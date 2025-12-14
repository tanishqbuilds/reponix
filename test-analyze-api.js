/**
 * Test script for /api/analyze endpoint
 * 
 * Usage: Run this in browser console on localhost:3000
 */

async function testAnalyzeAPI() {
    console.log('🧪 Testing /api/analyze endpoint...');

    const testRepo = 'https://github.com/vercel/next.js';

    console.log(`📦 Testing with repository: ${testRepo}`);
    console.log('⏳ This may take 30-60 seconds...');

    try {
        const startTime = Date.now();

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ repoUrl: testRepo }),
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`⏱️  Response time: ${duration}s`);

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Error:', data.error);
            console.error('Details:', data.details);
            return;
        }

        console.log('✅ Analysis successful!');
        console.log('\n📊 Summary:');
        console.log(data.summary);

        console.log('\n🤖 AI Analysis:');
        console.log(`  Overall Score: ${data.analysis.overall.score}/100`);
        console.log(`  AI Detection Probability: ${data.analysis.overall.aiDetectionProbability}%`);
        console.log(`  Security Score: ${data.analysis.security.score}/100`);
        console.log(`  Code Quality Score: ${data.analysis.codeQuality.score}/100`);

        console.log('\n📝 Summary:', data.analysis.overall.summary);

        if (data.analysis.security.vulnerabilities.length > 0) {
            console.log(`\n🔒 Security Vulnerabilities (${data.analysis.security.vulnerabilities.length}):`);
            data.analysis.security.vulnerabilities.forEach((vuln, i) => {
                console.log(`  ${i + 1}. [${vuln.severity}] ${vuln.file}: ${vuln.description}`);
            });
        }

        if (data.analysis.codeQuality.issues.length > 0) {
            console.log(`\n⚡ Code Quality Issues (${data.analysis.codeQuality.issues.length}):`);
            data.analysis.codeQuality.issues.forEach((issue, i) => {
                console.log(`  ${i + 1}. [${issue.type}] ${issue.file}: ${issue.description}`);
            });
        }

        if (data.analysis.aiGenerated.suspiciousFiles.length > 0) {
            console.log(`\n🤖 Suspicious AI-Generated Files (${data.analysis.aiGenerated.suspiciousFiles.length}):`);
            data.analysis.aiGenerated.suspiciousFiles.forEach((file, i) => {
                console.log(`  ${i + 1}. ${file.file} (${file.confidence}% confidence)`);
            });
        }

        console.log(`\n💡 Recommendations (${data.analysis.recommendations.length}):`);
        data.analysis.recommendations.forEach((rec, i) => {
            console.log(`  ${i + 1}. ${rec}`);
        });

        console.log('\n📦 Full response:', data);

        return data;

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testAnalyzeAPI();
