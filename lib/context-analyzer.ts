import { FileItem } from './file-processor';

export interface SecurityContext {
    authPackages: string[];
    middlewarePaths: string[];
    middlewareDetails: string;
    securityWrappers: { [wrapperName: string]: string[] }; // wrapper -> files using it
    crossFileReferences: { [exportName: string]: { exportedBy: string; importedBy: string[] } };
}

/**
 * Parses files to build a global cross-file security and dependency context.
 */
export function buildContextSummary(files: FileItem[]): string {
    const context = analyzeRepoContext(files);
    
    let summary = '';
    
    // 1. Security-related Dependencies
    summary += `#### 📦 Security & Auth Infrastructure:\n`;
    if (context.authPackages.length > 0) {
        summary += `- Detected Security/Auth Packages: ${context.authPackages.join(', ')}\n`;
    } else {
        summary += `- No standard third-party auth packages detected in package.json. (Likely using custom auth or none).\n`;
    }
    
    // 2. Global Middleware
    summary += `\n#### 🛡️ Global Route Protection (Middleware):\n`;
    if (context.middlewarePaths.length > 0) {
        summary += `- **Active Middleware Matchers** (Paths protected globally):\n`;
        context.middlewarePaths.forEach(path => {
            summary += `  * \`${path}\`\n`;
        });
        if (context.middlewareDetails) {
            summary += `- **Middleware Logic Details**:\n  ${context.middlewareDetails}\n`;
        }
    } else {
        summary += `- No global middleware route matchers detected. File-by-file authorization checks are expected for private endpoints.\n`;
    }
    
    // 3. Custom Security Wrappers
    summary += `\n#### 🔑 Custom Security Decorators & Wrappers:\n`;
    const wrapperKeys = Object.keys(context.securityWrappers);
    if (wrapperKeys.length > 0) {
        wrapperKeys.forEach(wrapper => {
            const usage = context.securityWrappers[wrapper];
            summary += `- \`${wrapper}\` security wrapper is used in:\n`;
            usage.forEach(file => {
                summary += `  * \`${file}\`\n`;
            });
        });
    } else {
        summary += `- No common custom security wrappers (e.g. \`withAuth\`, \`requireRole\`, \`getServerSession\`) identified in code imports.\n`;
    }

    // 4. Important Cross-File Function Calls
    summary += `\n#### 🔗 Cross-File Dependency Map:\n`;
    const refKeys = Object.keys(context.crossFileReferences);
    const criticalFunctions = refKeys.filter(k => 
        /auth|login|session|db|connect|admin|role|perm|secure/i.test(k)
    );
    
    if (criticalFunctions.length > 0) {
        criticalFunctions.forEach(func => {
            const ref = context.crossFileReferences[func];
            if (ref.importedBy.length > 0) {
                summary += `- Function \`${func}\` (defined in \`${ref.exportedBy}\`) is imported & consumed by:\n`;
                ref.importedBy.forEach(importer => {
                    summary += `  * \`${importer}\`\n`;
                });
            }
        });
    } else {
        summary += `- No critical security, database connection, or auth-related cross-file imports detected.\n`;
    }

    return summary;
}

function analyzeRepoContext(files: FileItem[]): SecurityContext {
    const context: SecurityContext = {
        authPackages: [],
        middlewarePaths: [],
        middlewareDetails: '',
        securityWrappers: {},
        crossFileReferences: {}
    };

    // Common security/auth packages to look for in package.json
    const SECURITY_PACKAGES = [
        'next-auth', '@auth/core', '@clerk/nextjs', '@clerk/backend', 
        'passport', 'jsonwebtoken', 'jose', 'bcrypt', 'argon2', 
        'helmet', 'cors', 'express-rate-limit', 'supabase', 'firebase-admin'
    ];

    // Common security-related functions/wrappers to trace
    const SECURITY_WRAPPERS = [
        'withAuth', 'requireAuth', 'getServerSession', 'auth', 
        'withRole', 'requireRole', 'verifyToken', 'validateSession'
    ];

    // First pass: scan package.json and middleware
    for (const file of files) {
        const pathLower = file.path.toLowerCase();

        // 1. Scan package.json
        if (pathLower.includes('package.json')) {
            try {
                const pkg = JSON.parse(file.content);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                SECURITY_PACKAGES.forEach(pkgName => {
                    if (deps[pkgName]) {
                        context.authPackages.push(`${pkgName} (${deps[pkgName]})`);
                    }
                });
            } catch (e) {
                // Fallback to simple regex if JSON parsing fails
                SECURITY_PACKAGES.forEach(pkgName => {
                    if (file.content.includes(`"${pkgName}"`)) {
                        context.authPackages.push(pkgName);
                    }
                });
            }
        }

        // 2. Scan Next.js Middleware
        if (pathLower.includes('middleware.ts') || pathLower.includes('middleware.js')) {
            // Extract matchers from config object
            // E.g., matcher: ['/api/secure/:path*', '/dashboard/:path*']
            const arrayMatcherRegex = /matcher\s*:\s*\[([\s\S]*?)\]/g;
            const singleMatcherRegex = /matcher\s*:\s*['"`]([^'"`]+)['"`]/g;

            let match;
            if ((match = arrayMatcherRegex.exec(file.content)) !== null) {
                const inner = match[1];
                const paths = inner.split(',').map(p => p.trim().replace(/['"`]/g, '')).filter(Boolean);
                context.middlewarePaths.push(...paths);
            } else if ((match = singleMatcherRegex.exec(file.content)) !== null) {
                context.middlewarePaths.push(match[1]);
            }

            // Look for details inside middleware body
            const details: string[] = [];
            if (file.content.includes('next-auth') || file.content.includes('withAuth')) {
                details.push('Uses NextAuth.js standard middleware protection');
            }
            if (file.content.includes('jwt') || file.content.includes('getToken')) {
                details.push('Verifies JWT / Token presence');
            }
            if (file.content.includes('redirect') || file.content.includes('NextResponse.redirect')) {
                details.push('Redirects unauthorized users to sign-in page');
            }
            
            context.middlewareDetails = details.length > 0 
                ? details.join(', ') 
                : 'Custom routing and authorization checks detected in middleware logic.';
        }

        // 3. Scan for Exports to build exports database
        // Matches export function foo, export const bar = ...
        const exportRegex = /export\s+(?:const|function|async\s+function|class|interface|type)\s+(\w+)/g;
        let expMatch;
        while ((expMatch = exportRegex.exec(file.content)) !== null) {
            const expName = expMatch[1];
            if (expName && expName.length > 2) {
                context.crossFileReferences[expName] = {
                    exportedBy: file.path,
                    importedBy: []
                };
            }
        }
    }

    // Second pass: trace custom security wrappers and cross-file references
    for (const file of files) {
        const pathLower = file.path.toLowerCase();
        
        // Skip package.json and middleware in tracing usage to avoid noise
        if (pathLower.includes('package.json') || pathLower.includes('middleware')) {
            continue;
        }

        // Trace Custom Security Wrappers
        SECURITY_WRAPPERS.forEach(wrapper => {
            // Check if wrapper is imported or used in the file
            // Make sure it matches as a whole word
            const hasWrapper = new RegExp(`\\b${wrapper}\\b`).test(file.content);
            if (hasWrapper) {
                if (!context.securityWrappers[wrapper]) {
                    context.securityWrappers[wrapper] = [];
                }
                context.securityWrappers[wrapper].push(file.path);
            }
        });

        // Trace Cross-File Imports
        // For each known exported function, check if it's imported in this file
        Object.keys(context.crossFileReferences).forEach(expName => {
            const ref = context.crossFileReferences[expName];
            // Don't trace file importing itself
            if (ref.exportedBy === file.path) {
                return;
            }

            // Simple check: does the file have an import statement mentioning the exported entity?
            const importRegex = new RegExp(`import\\s+.*\\b${expName}\\b.*from`);
            if (importRegex.test(file.content) || (file.content.includes(expName) && file.content.includes('require('))) {
                ref.importedBy.push(file.path);
            }
        });
    }

    return context;
}
