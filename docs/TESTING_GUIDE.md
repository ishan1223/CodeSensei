# CodeSensei Testing Guide

## 🧪 Testing Overview
This guide covers comprehensive testing of the CodeSensei Chrome Extension prototype, including unit tests, integration tests, and end-to-end testing scenarios.

## 📋 Test Environment Setup

### Prerequisites
- Node.js 18+
- Chrome browser (latest)
- MongoDB Atlas account
- Gemini/OpenAI API key
- Test accounts on supported platforms

### Setup Commands
```bash
# Backend setup
cd backend
npm install
cp env.example .env
# Configure .env with your API keys and MongoDB URI
npm run dev

# Extension setup
cd ../extension
npm install
npm run build
# Load unpacked extension in Chrome
```

## 🔧 Backend Testing

### Unit Tests
```bash
cd backend
npm test
```

### API Endpoint Testing

#### 1. Health Check
```bash
curl http://localhost:3000/health
```
**Expected**: 200 OK with server status

#### 2. Hints Generation
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
**Expected**: 200 OK with hints data

#### 3. Debug Feedback
```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "problem": {
      "title": "Two Sum",
      "platform": "leetcode",
      "difficulty": "Easy",
      "url": "https://leetcode.com/problems/two-sum/"
    },
    "code": "def twoSum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []",
    "userId": "test_user_123"
  }'
```
**Expected**: 200 OK with debug tips

#### 4. Progress Tracking
```bash
curl http://localhost:3000/api/progress/test_user_123
```
**Expected**: 200 OK with user progress data

### Error Handling Tests

#### 1. Invalid Problem Data
```bash
curl -X POST http://localhost:3000/api/hints \
  -H "Content-Type: application/json" \
  -d '{"problem": {"title": ""}}'
```
**Expected**: 400 Bad Request with validation errors

#### 2. Missing API Keys
```bash
# Temporarily remove API keys from .env
curl -X POST http://localhost:3000/api/hints \
  -H "Content-Type: application/json" \
  -d '{"problem": {"title": "Test", "platform": "leetcode"}}'
```
**Expected**: 503 Service Unavailable

#### 3. Rate Limiting
```bash
# Make 101 requests quickly
for i in {1..101}; do
  curl -X POST http://localhost:3000/api/hints \
    -H "Content-Type: application/json" \
    -d '{"problem": {"title": "Test", "platform": "leetcode"}}'
done
```
**Expected**: 429 Too Many Requests after 100 requests

## 🌐 Extension Testing

### Manual Testing Checklist

#### 1. Extension Loading
- [ ] Extension loads without errors in Chrome
- [ ] Icon appears in toolbar
- [ ] Popup opens when clicked
- [ ] No console errors in background script

#### 2. Platform Detection
- [ ] LeetCode problems detected correctly
- [ ] HackerRank problems detected correctly
- [ ] CodeForces problems detected correctly
- [ ] AtCoder problems detected correctly
- [ ] Non-coding sites ignored

#### 3. Problem Data Extraction
- [ ] Problem title extracted correctly
- [ ] Problem description extracted
- [ ] Difficulty level identified
- [ ] Tags/categories captured
- [ ] URL stored properly

#### 4. Sidebar Functionality
- [ ] Sidebar appears automatically
- [ ] Three tabs visible and clickable
- [ ] Toggle button works
- [ ] Responsive design on different screen sizes
- [ ] No layout issues

#### 5. Breakdown Tab
- [ ] Problem analysis loads
- [ ] Category displayed correctly
- [ ] Summary shows approach
- [ ] Tags displayed properly
- [ ] Difficulty shown

#### 6. Hints Tab
- [ ] Progressive hints load
- [ ] "Reveal" buttons work
- [ ] Hints are educational, not spoiling
- [ ] Hint state persists
- [ ] Loading state shows during generation

#### 7. Debug Tab
- [ ] Code input accepts text
- [ ] Submit button triggers analysis
- [ ] Debug tips are relevant
- [ ] Example reasoning provided
- [ ] Error handling for invalid input

#### 8. Popup Interface
- [ ] Status shows correctly
- [ ] Statistics display properly
- [ ] Buttons function correctly
- [ ] Settings accessible
- [ ] Current problem shown

### Automated Testing

#### 1. Content Script Testing
```javascript
// Test in browser console on LeetCode
console.log('Testing problem detection...');
const platform = detectPlatform(window.location.href);
console.log('Platform detected:', platform);

const problemData = extractLeetCodeProblem();
console.log('Problem data:', problemData);
```

#### 2. API Integration Testing
```javascript
// Test in browser console
fetch('http://localhost:3000/api/hints', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    problem: {
      title: 'Two Sum',
      platform: 'leetcode',
      difficulty: 'Easy',
      url: window.location.href
    }
  })
})
.then(r => r.json())
.then(data => console.log('API Response:', data));
```

## 🔄 Integration Testing

### End-to-End Scenarios

#### Scenario 1: Complete Problem Solving Flow
1. **Setup**: Load LeetCode Two Sum problem
2. **Action**: Wait for sidebar to appear
3. **Verify**: Problem analysis loads in Breakdown tab
4. **Action**: Switch to Hints tab
5. **Action**: Reveal Hint 1
6. **Verify**: Hint appears and is educational
7. **Action**: Switch to Debug tab
8. **Action**: Paste sample code and get feedback
9. **Verify**: Debug tips are relevant and helpful
10. **Action**: Check popup statistics
11. **Verify**: Progress tracked correctly

#### Scenario 2: Cross-Platform Testing
1. **Setup**: Test on LeetCode
2. **Action**: Complete hint usage
3. **Setup**: Switch to HackerRank
4. **Action**: Use debug feature
5. **Verify**: Progress data persists across platforms
6. **Verify**: UI adapts to different platform layouts

#### Scenario 3: Error Recovery
1. **Setup**: Start backend server
2. **Action**: Use extension normally
3. **Action**: Stop backend server
4. **Action**: Try to use hints
5. **Verify**: Graceful error message shown
6. **Action**: Restart backend server
7. **Action**: Retry hint generation
8. **Verify**: Functionality restored

### Performance Testing

#### 1. Load Testing
```bash
# Test API performance
ab -n 100 -c 10 -H "Content-Type: application/json" \
  -p test_data.json http://localhost:3000/api/hints
```

#### 2. Memory Usage
- Monitor Chrome task manager during extension use
- Check for memory leaks during extended usage
- Verify cleanup when switching between problems

#### 3. Response Times
- Sidebar injection: < 2 seconds
- Hint generation: < 5 seconds
- Debug feedback: < 10 seconds
- API responses: < 3 seconds average

## 🐛 Bug Testing

### Common Issues to Test

#### 1. Network Issues
- [ ] Offline functionality
- [ ] Slow network handling
- [ ] API timeout scenarios
- [ ] CORS errors

#### 2. Browser Compatibility
- [ ] Chrome latest version
- [ ] Chrome older versions
- [ ] Different screen resolutions
- [ ] Different zoom levels

#### 3. Data Persistence
- [ ] Local storage limits
- [ ] Data corruption handling
- [ ] Migration between versions
- [ ] Privacy mode compatibility

#### 4. Security
- [ ] XSS prevention in code input
- [ ] CSRF protection
- [ ] API key security
- [ ] Data sanitization

## 📊 Test Results Documentation

### Test Report Template
```markdown
## CodeSensei Test Report - [Date]

### Test Environment
- Chrome Version: [Version]
- Backend Version: [Version]
- Node.js Version: [Version]
- MongoDB Version: [Version]

### Test Results Summary
- Total Tests: [Number]
- Passed: [Number]
- Failed: [Number]
- Skipped: [Number]

### Critical Issues
- [List any critical bugs found]

### Performance Metrics
- Average API Response Time: [Time]
- Sidebar Injection Time: [Time]
- Memory Usage: [MB]

### Recommendations
- [List any improvements needed]
```

### Bug Tracking
Use this format for bug reports:
```markdown
**Bug Title**: [Brief description]

**Severity**: Critical/High/Medium/Low

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]

**Actual Result**: [What actually happens]

**Environment**:
- Chrome Version: [Version]
- Platform: [Platform tested]
- Backend Status: [Running/Stopped]

**Screenshots**: [If applicable]
```

## ✅ Testing Checklist

### Pre-Release Testing
- [ ] All unit tests pass
- [ ] Integration tests complete
- [ ] Manual testing checklist done
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] Cross-platform compatibility verified
- [ ] Error handling tested
- [ ] Documentation updated

### Post-Release Testing
- [ ] Monitor error logs
- [ ] Track user feedback
- [ ] Monitor performance metrics
- [ ] Check API usage statistics
- [ ] Verify database performance
- [ ] Monitor extension store reviews

## 🚀 Continuous Testing

### Automated Testing Pipeline
1. **Code Commit**: Trigger tests
2. **Unit Tests**: Run backend tests
3. **Integration Tests**: Test API endpoints
4. **Build Tests**: Verify extension builds
5. **Deploy Tests**: Test deployment process

### Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor API performance
- Track user engagement metrics
- Set up alerts for critical issues
