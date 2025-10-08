# CodeSensei Backend Setup Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier available)
- Gemini API key or OpenAI API key

### 2. Installation
```bash
cd backend
npm install
```

### 3. Environment Configuration
```bash
cp env.example .env
```

Edit `.env` file with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codesensei

# AI API Keys (use at least one)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# AI Configuration
DEFAULT_LLM_PROVIDER=gemini
MAX_HINTS_PER_PROBLEM=3
MAX_DEBUG_TIPS=5
```

### 4. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📚 API Endpoints

### Health Check
- `GET /health` - Server health status

### Hints API
- `POST /api/hints` - Generate hints for a problem
- `GET /api/hints/stats` - Get hints usage statistics

### Feedback API
- `POST /api/feedback` - Get debug feedback for code
- `GET /api/feedback/stats` - Get debug feedback statistics
- `POST /api/feedback/rate` - Rate feedback helpfulness

### Progress API
- `GET /api/progress/:userId` - Get user progress
- `POST /api/progress/hint` - Log hint usage
- `POST /api/progress/complete` - Mark problem as completed
- `GET /api/progress/leaderboard/:platform` - Get platform leaderboard

## 🧪 Testing

### Manual Testing
1. Start the server: `npm run dev`
2. Test health endpoint: `curl http://localhost:3000/health`
3. Test hints endpoint with sample data:

```bash
curl -X POST http://localhost:3000/api/hints \
  -H "Content-Type: application/json" \
  -d '{
    "problem": {
      "title": "Two Sum",
      "platform": "leetcode",
      "difficulty": "Easy",
      "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      "url": "https://leetcode.com/problems/two-sum/"
    },
    "userId": "test_user_123"
  }'
```

### Automated Testing
```bash
npm test
```

## 🔧 Configuration

### LLM Providers
- **Gemini**: Set `GEMINI_API_KEY` in `.env`
- **OpenAI**: Set `OPENAI_API_KEY` in `.env`
- **Default Provider**: Set `DEFAULT_LLM_PROVIDER=gemini` or `openai`

### Rate Limiting
- Default: 100 requests per 15 minutes per IP
- Configure in `.env`: `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`

### CORS
- Configure allowed origins in `.env`: `ALLOWED_ORIGINS`
- Default includes `chrome-extension://` for extension access

## 📊 Database Schema

### Users Collection
```javascript
{
  userId: String (unique),
  createdAt: Date,
  lastActive: Date,
  preferences: {
    theme: String,
    hintsEnabled: Boolean,
    debugEnabled: Boolean,
    preferredLLM: String
  },
  stats: {
    totalHintsUsed: Number,
    totalProblemsViewed: Number,
    totalDebugSessions: Number,
    streakDays: Number
  }
}
```

### Problems Collection
```javascript
{
  title: String,
  platform: String,
  url: String (unique),
  difficulty: String,
  tags: [String],
  description: String,
  cachedHints: {
    category: String,
    summary: String,
    hints: [String],
    generatedAt: Date,
    llmProvider: String
  },
  stats: {
    viewCount: Number,
    hintUsageCount: Number,
    debugSessionCount: Number
  }
}
```

### Progress Collection
```javascript
{
  userId: String,
  problemId: ObjectId,
  platform: String,
  problemTitle: String,
  sessionData: {
    hintsRevealed: [Object],
    debugSessions: [Object],
    timeSpent: Number,
    sessionStart: Date,
    sessionEnd: Date
  },
  learningMetrics: {
    hintsUsed: Number,
    debugSessions: Number,
    completionStatus: String,
    difficultyRating: Number,
    helpfulnessRating: Number
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check `MONGODB_URI` in `.env`
   - Ensure MongoDB Atlas cluster is running
   - Verify network access settings

2. **LLM API Errors**
   - Verify API keys are correct
   - Check API quota limits
   - Ensure internet connectivity

3. **CORS Errors**
   - Add your domain to `ALLOWED_ORIGINS`
   - Check browser console for specific CORS errors

4. **Rate Limiting**
   - Adjust `RATE_LIMIT_MAX_REQUESTS` if needed
   - Check IP whitelist if behind proxy

### Logs
- Development: Console logs with `morgan` middleware
- Production: Configure logging in `.env`

## 🔒 Security

### Environment Variables
- Never commit `.env` file to version control
- Use strong, unique API keys
- Rotate keys regularly

### Input Validation
- All endpoints use `express-validator`
- Code input is sanitized before LLM processing
- Rate limiting prevents abuse

### Database Security
- Use MongoDB Atlas security features
- Enable IP whitelisting
- Use strong database passwords

## 📈 Monitoring

### Health Checks
- `GET /health` endpoint for basic health
- Monitor API response times
- Track error rates

### Metrics
- Hints generation success rate
- Debug feedback quality ratings
- User engagement metrics

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set up proper logging
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL certificates
- [ ] Configure monitoring
- [ ] Set up backup strategy

### Recommended Platforms
- **Vercel**: Easy deployment with automatic scaling
- **Railway**: Simple Node.js deployment
- **DigitalOcean App Platform**: Full control with good pricing
- **AWS EC2**: Maximum control and customization