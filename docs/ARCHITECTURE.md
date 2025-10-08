# CodeSensei Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome        │    │   Backend       │    │   Database      │
│   Extension     │◄──►│   API Server    │◄──►│   MongoDB       │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Content     │ │    │ │ Express     │ │    │ │ Users       │ │
│ │ Script      │ │    │ │ Server      │ │    │ │ Collection  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Sidebar     │ │    │ │ LLM Client  │ │    │ │ Problems    │ │
│ │ UI          │ │    │ │ (Gemini/    │ │    │ │ Collection  │ │
│ └─────────────┘ │    │ │  OpenAI)    │ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ └─────────────┘ │    │ ┌─────────────┐ │
│ │ Popup       │ │    │ ┌─────────────┐ │    │ │ Progress    │ │
│ │ Interface   │ │    │ │ Routes      │ │    │ │ Collection  │ │
│ └─────────────┘ │    │ │ (Hints/     │ │    │ └─────────────┘ │
└─────────────────┘    │ │  Feedback)  │ │    └─────────────────┘
                       │ └─────────────┘ │
                       └─────────────────┘
```

## 🔄 Data Flow

### 1. Problem Detection Flow
```
User visits coding platform
    ↓
Content script detects platform
    ↓
Extract problem data (title, description, difficulty)
    ↓
Store in local storage
    ↓
Inject sidebar UI
    ↓
Request problem analysis from backend
```

### 2. Hints Generation Flow
```
User clicks "Reveal Hint"
    ↓
Check if hints cached in database
    ↓
If not cached: Call LLM API
    ↓
Parse and validate LLM response
    ↓
Cache hints in database
    ↓
Return hints to extension
    ↓
Display hints in sidebar
    ↓
Log hint usage in progress tracking
```

### 3. Debug Feedback Flow
```
User pastes code in debug tab
    ↓
Sanitize and validate code input
    ↓
Send code + problem context to backend
    ↓
Call LLM API for debug analysis
    ↓
Parse debug tips and suggestions
    ↓
Return feedback to extension
    ↓
Display tips in sidebar
    ↓
Log debug session in progress tracking
```

## 🧩 Component Details

### Chrome Extension Components

#### Content Script (`content.js`)
- **Purpose**: Detects coding platforms and extracts problem data
- **Responsibilities**:
  - Platform detection (LeetCode, HackerRank, etc.)
  - Problem data extraction
  - Sidebar injection
  - Communication with background script
- **Key Functions**:
  - `detectPlatform()`: Identifies current coding platform
  - `extractProblemInfo()`: Extracts problem metadata
  - `injectSidebar()`: Creates and injects sidebar UI
  - `loadProblemAnalysis()`: Requests analysis from backend

#### Background Script (`background.js`)
- **Purpose**: Manages extension state and handles cross-tab communication
- **Responsibilities**:
  - Extension lifecycle management
  - User activity tracking
  - Settings management
  - Message routing
- **Key Functions**:
  - `generateUserId()`: Creates anonymous user IDs
  - `updateUserProgress()`: Tracks user statistics
  - `logUserActivity()`: Records user actions

#### Sidebar UI (`sidebar/`)
- **Purpose**: Main user interface for hints and debugging
- **Components**:
  - **Breakdown Tab**: Problem analysis and categorization
  - **Hints Tab**: Progressive hint system
  - **Debug Tab**: Code feedback interface
- **Styling**: Custom CSS with responsive design

#### Popup Interface (`popup/`)
- **Purpose**: Extension status and quick actions
- **Features**:
  - Current problem status
  - Daily statistics
  - Extension controls
  - Settings access

### Backend Components

#### Express Server (`server.js`)
- **Purpose**: Main API server and request handling
- **Features**:
  - CORS configuration
  - Rate limiting
  - Security middleware
  - Error handling
  - Health monitoring

#### LLM Client (`utils/llmClient.js`)
- **Purpose**: Integration with AI services
- **Supported Providers**:
  - Google Gemini API
  - OpenAI GPT-4 API
- **Key Functions**:
  - `generateHints()`: Creates progressive hints
  - `generateDebugFeedback()`: Analyzes user code
  - `parseHintsResponse()`: Validates LLM output
  - `parseDebugResponse()`: Processes debug feedback

#### Database Models
- **User Model**: User preferences and statistics
- **Problem Model**: Cached problem data and hints
- **Progress Model**: Learning analytics and session data

#### API Routes
- **Hints Route** (`/api/hints`): Problem analysis and hint generation
- **Feedback Route** (`/api/feedback`): Debug assistance
- **Progress Route** (`/api/progress`): User analytics and tracking

## 🔒 Security Architecture

### Data Protection
- **Input Sanitization**: All user inputs are sanitized
- **XSS Prevention**: Code input is cleaned before processing
- **CSRF Protection**: API endpoints use proper validation
- **Rate Limiting**: Prevents API abuse

### Privacy Considerations
- **Anonymous Users**: No personal data collection
- **Local Storage**: User preferences stored locally
- **API Keys**: Secured environment variables
- **Data Encryption**: MongoDB Atlas encryption

### Extension Security
- **Manifest V3**: Latest security standards
- **Content Security Policy**: Prevents code injection
- **Minimal Permissions**: Only required permissions granted
- **Secure Communication**: HTTPS for all API calls

## 📊 Performance Architecture

### Caching Strategy
- **Problem Caching**: Hints cached for 24 hours
- **User Session**: Progress data cached locally
- **API Responses**: Cached to reduce LLM calls
- **Database Indexing**: Optimized queries

### Scalability Design
- **Stateless Backend**: Horizontal scaling ready
- **Database Sharding**: User-based partitioning
- **CDN Ready**: Static assets optimized
- **Load Balancing**: Multiple server instances

### Performance Monitoring
- **Response Times**: API endpoint monitoring
- **Error Tracking**: Comprehensive logging
- **Usage Analytics**: User behavior tracking
- **Resource Usage**: Memory and CPU monitoring

## 🔄 Integration Points

### External APIs
- **Gemini API**: Google's LLM service
- **OpenAI API**: GPT-4 integration
- **MongoDB Atlas**: Cloud database service
- **Chrome Extension APIs**: Browser integration

### Platform Integrations
- **LeetCode**: Problem detection and data extraction
- **HackerRank**: Platform-specific parsing
- **CodeForces**: Contest problem handling
- **AtCoder**: Japanese platform support

## 🚀 Deployment Architecture

### Development Environment
- **Local Backend**: Node.js development server
- **Local Database**: MongoDB Atlas free tier
- **Extension**: Unpacked Chrome extension
- **API Keys**: Development credentials

### Production Environment
- **Cloud Backend**: Vercel/Railway deployment
- **Production Database**: MongoDB Atlas cluster
- **Extension Store**: Chrome Web Store
- **Monitoring**: Error tracking and analytics

## 📈 Monitoring and Analytics

### User Analytics
- **Problem Views**: Tracked per user
- **Hint Usage**: Learning pattern analysis
- **Debug Sessions**: Code assistance metrics
- **Progress Tracking**: Skill development monitoring

### Technical Metrics
- **API Performance**: Response time tracking
- **Error Rates**: System reliability monitoring
- **Usage Patterns**: Feature adoption metrics
- **Resource Utilization**: Server performance

### Business Intelligence
- **User Engagement**: Daily/monthly active users
- **Feature Usage**: Most popular features
- **Platform Distribution**: Usage by coding platform
- **Learning Effectiveness**: Hint success rates
