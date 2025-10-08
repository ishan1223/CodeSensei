# 🧠 CodeSensei - AI Mentorship Chrome Extension

An AI-powered Chrome Extension that provides contextual, non-spoiler hints to coding platform users (LeetCode, HackerRank, etc.).

## 🎯 Features

- **Smart Problem Detection**: Automatically detects coding problems on LeetCode, HackerRank, etc.
- **Progressive Hints**: AI-generated hints that guide without spoiling solutions
- **Debug Assistant**: Get AI feedback on your code snippets
- **Progress Tracking**: Track your learning journey and hint usage
- **Clean UI**: Modern sidebar interface built with React + TailwindCSS

## 🏗️ Architecture

```
codesensei/
├── extension/          # Chrome Extension (Manifest V3)
├── backend/           # Node.js + Express API
├── docs/              # Documentation and diagrams
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Gemini API key or OpenAI API key

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys and MongoDB URI
npm run dev
```

### 2. Extension Setup
```bash
cd extension
npm install
npm run build
```

### 3. Load Extension
1. Open Chrome → Extensions → Developer mode
2. Click "Load unpacked" → Select `extension/dist` folder
3. Visit LeetCode or HackerRank to test

## 🧩 Components

### Chrome Extension
- **Manifest V3** with proper permissions
- **Content Scripts** for problem detection
- **React Sidebar** with TailwindCSS styling
- **Local Storage** for state management

### Backend API
- **Express Server** with CORS enabled
- **LLM Integration** (Gemini/GPT-4)
- **MongoDB** with Mongoose ODM
- **Caching** for repeated queries

### Database Schema
- **Users**: Anonymous session tracking
- **Problems**: Cached problem-hint mappings
- **Progress**: Hint usage and learning analytics

## 🔧 Environment Variables

```env
# Backend (.env)
PORT=3000
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
NODE_ENV=development
```

## 📊 API Endpoints

- `POST /api/hints` - Get AI hints for a problem
- `POST /api/feedback` - Get debugging feedback for code
- `GET /api/progress/:userId` - Get user progress

## 🧪 Testing

1. Load extension in Chrome Developer mode
2. Visit a LeetCode problem page
3. Sidebar should auto-appear
4. Test hint progression and debug features

## 📈 Future Enhancements

- Support for more coding platforms
- Advanced analytics dashboard
- Community hint sharing
- Personalized learning paths

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details