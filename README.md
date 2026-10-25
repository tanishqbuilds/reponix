# REPONIX 🔍

> AI-powered code analysis platform for GitHub repositories

Devlyzer is a comprehensive repository analysis tool that uses AI to detect security vulnerabilities, code quality issues, and AI-generated code. Built with Next.js and powered by Groq's LLM.

## ✨ Features

- 🔒 **Security Analysis** - Detect vulnerabilities with severity ratings
- ⚡ **Code Quality** - Identify bugs, code smells, and performance issues
- 🤖 **AI Detection** - Find potentially AI-generated code patterns
- 📊 **Visual Dashboard** - Beautiful results page with score cards and metrics
- 🚀 **Fast Analysis** - Powered by Groq's high-speed LLM
- 🎯 **Smart Filtering** - Analyzes only relevant code files
- 💡 **Actionable Insights** - Get specific recommendations for improvement

## 🖼️ Screenshots

### Home Page
Clean, modern interface for repository analysis

### Results Dashboard
Comprehensive visualization of analysis results with scores, vulnerabilities, and recommendations

## 🏗️ Architecture

```
Client (Next.js) → POST repo URL → API Route (/api/analyze)
  ├─ Validate URL
  ├─ Verify repository exists
  ├─ Fetch repository files (GitHub API)
  ├─ Filter & chunk files (max 100 files, 500KB each)
  ├─ Format for AI analysis
  └─ Analyze with Groq AI → Structured JSON response
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Groq API key ([Get one here](https://console.groq.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tanishqmsd/devlyzer.git
   cd devlyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

1. **Enter Repository URL**
   - Paste any public GitHub repository URL
   - Supports formats: `https://github.com/owner/repo` or `git@github.com:owner/repo.git`

2. **Analyze**
   - Click "Analyze Now" button
   - Wait 30-60 seconds for AI analysis

3. **View Results**
   - Automatically redirected to results page
   - Review scores, vulnerabilities, and recommendations
   - Navigate back to analyze another repository

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons

### Backend
- **Next.js API Routes** - Serverless functions
- **Groq SDK** - AI analysis
- **GitHub API** - Repository fetching

### AI
- **Groq** - Fast LLM inference
- **OpenAI GPT OSS 120B** - Code analysis model (configurable via `GROQ_MODEL`)

## 📁 Project Structure

```
devlyzer/
├── app/
│   ├── api/
│   │   └── analyze/          # Main analysis API route
│   │       └── route.ts
│   ├── results/              # Results page
│   │   └── page.tsx
│   └── page.tsx              # Home page
├── components/
│   └── ui/
│       ├── hero-section.tsx  # Landing page hero
│       ├── button.tsx        # UI components
│       └── ...
├── lib/
│   ├── validators.ts         # URL & repo validation
│   ├── file-processor.ts     # File fetching & filtering
│   └── ai-analyzer.ts        # Groq AI integration
└── .env.local               # Environment variables
```

## 🔧 Configuration

### File Limits

Adjust in `lib/file-processor.ts`:
```typescript
const MAX_FILES = 100         // Maximum files to analyze
const MAX_FILE_SIZE = 500KB   // Maximum file size
```

### Supported File Types

```typescript
const ALLOWED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',  // JavaScript/TypeScript
  '.py',                          // Python
  '.java', '.go', '.rs',          // Other languages
  '.md', '.json', '.yml'          // Documentation/Config
]
```

### Analysis Timeout

Adjust in `app/api/analyze/route.ts`:
```typescript
export const maxDuration = 60  // Timeout in seconds
```

## 🔑 API Reference

### POST /api/analyze

Analyzes a GitHub repository.

**Request Body:**
```json
{
  "repoUrl": "https://github.com/owner/repo"
}
```

**Response:**
```json
{
  "success": true,
  "repository": "owner/repo",
  "analysis": {
    "overall": {
      "score": 85,
      "summary": "Good code quality with minor issues",
      "aiDetectionProbability": 25
    },
    "security": {
      "vulnerabilities": [...],
      "score": 90
    },
    "codeQuality": {
      "issues": [...],
      "score": 82
    },
    "aiGenerated": {
      "suspiciousFiles": [...],
      "patterns": [...]
    },
    "recommendations": [...]
  }
}
```

## 🎯 Scoring System

### Overall Score (0-100)
- **80-100**: Excellent code quality
- **60-79**: Good with minor improvements needed
- **40-59**: Moderate issues, attention required
- **0-39**: Significant issues found

### Security Severity
- 🔴 **Critical** - Immediate action required
- 🟠 **High** - Should be addressed soon
- 🟡 **Medium** - Address when possible
- 🔵 **Low** - Minor concern

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 📝 License

This project is licensed under the MIT License.




## 📧 Contact

Tanishq - [@tanishqbuilds](https://github.com/tanishqbuilds)

Project Link: [https://github.com/tanishqbuilds/devlyzer](https://github.com/tanishqbuilds/devlyzer)

---

Made with ❤️ by [Tanishq](https://github.com/tanishqbuilds)
