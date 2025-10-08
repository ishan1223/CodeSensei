# CodeSensei Chrome Extension Setup Guide

## 🚀 Quick Start

### 1. Prerequisites
- Chrome browser (version 88+)
- Node.js 18+ (for building)
- CodeSensei backend running (see backend README)

### 2. Installation
```bash
cd extension
npm install
```

### 3. Build Extension
```bash
npm run build
```

### 4. Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. The CodeSensei extension should now appear in your extensions list

## 🧪 Testing

### 1. Test on LeetCode
1. Visit [LeetCode](https://leetcode.com/problems/two-sum/)
2. The CodeSensei sidebar should automatically appear
3. Test the three tabs:
   - **Breakdown**: Shows problem analysis
   - **Hints**: Progressive hints (click "Reveal" buttons)
   - **Debug**: Paste code and get feedback

### 2. Test on HackerRank
1. Visit [HackerRank](https://www.hackerrank.com/challenges/simple-array-sum/problem)
2. Verify sidebar appears and functions correctly

### 3. Test Extension Popup
1. Click the CodeSensei icon in Chrome toolbar
2. Verify popup shows current status and statistics
3. Test "Activate CodeSensei" button

## 🔧 Configuration

### Backend API Endpoint
The extension connects to your backend API. Update the endpoint in:
- `background.js`: `apiEndpoint` in storage
- Or set via popup settings

Default: `http://localhost:3000/api`

### Supported Platforms
- LeetCode (`leetcode.com/problems/*`)
- HackerRank (`hackerrank.com/challenges/*`)
- CodeForces (`codeforces.com/problemset/*`)
- AtCoder (`atcoder.jp/contests/*`)

## 📁 File Structure

```
extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Content script for page injection
├── popup/
│   ├── popup.html        # Extension popup UI
│   └── popup.js          # Popup functionality
├── sidebar/
│   ├── styles.css        # Sidebar styling
│   └── components/       # React components (if using React)
└── assets/
    ├── icon16.png        # Extension icons
    ├── icon48.png
    └── icon128.png
```

## 🎨 Customization

### Styling
- Edit `sidebar/styles.css` for sidebar appearance
- Modify `popup/popup.html` for popup styling
- Colors and themes can be customized in CSS variables

### Functionality
- `content.js`: Main logic for problem detection and sidebar injection
- `background.js`: Background tasks and message handling
- `popup.js`: Popup interface and user interactions

## 🐛 Troubleshooting

### Common Issues

1. **Sidebar Not Appearing**
   - Check if you're on a supported platform
   - Verify content script is loaded (check DevTools Console)
   - Ensure backend API is running and accessible

2. **API Connection Errors**
   - Check backend server is running on correct port
   - Verify CORS settings allow extension requests
   - Check network connectivity

3. **Hints Not Loading**
   - Verify LLM API keys are configured in backend
   - Check backend logs for API errors
   - Ensure problem data is being extracted correctly

4. **Extension Not Loading**
   - Check Chrome version compatibility
   - Verify manifest.json syntax
   - Check for JavaScript errors in DevTools

### Debug Mode
1. Open Chrome DevTools (`F12`)
2. Go to Console tab
3. Look for CodeSensei logs (prefixed with "CodeSensei")
4. Check Network tab for API requests

### Content Script Debugging
1. Right-click on the page → "Inspect"
2. Go to Console tab
3. Look for content script logs
4. Check if `#codesensei-sidebar` element exists in Elements tab

## 🔒 Permissions

The extension requires these permissions:
- `activeTab`: Access current tab content
- `storage`: Store user preferences and progress
- `scripting`: Inject content scripts
- `tabs`: Access tab information

Host permissions for supported coding platforms:
- `https://leetcode.com/*`
- `https://hackerrank.com/*`
- `https://codeforces.com/*`
- `https://atcoder.jp/*`

## 📊 Data Storage

### Local Storage
- User preferences and settings
- Current problem data
- Hint reveal state
- Daily statistics

### Chrome Storage API
- Extension settings
- User progress data
- Activity logs

## 🚀 Building for Production

### 1. Update Version
Edit `manifest.json`:
```json
{
  "version": "1.0.0"
}
```

### 2. Build Extension
```bash
npm run build
```

### 3. Create Distribution Package
```bash
npm run package
```

### 4. Chrome Web Store
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Upload the packaged extension
3. Fill in store listing details
4. Submit for review

## 🔄 Updates

### Automatic Updates
- Chrome will automatically update the extension
- Users will see update notifications
- Backward compatibility is maintained

### Manual Updates
1. Update code and version number
2. Build new package
3. Upload to Chrome Web Store
4. Or distribute updated files to users

## 📈 Analytics

### Built-in Tracking
- Problem views and hint usage
- Debug session frequency
- User engagement metrics
- Error tracking

### Privacy
- All data is anonymized
- No personal information collected
- Users can opt out of analytics

## 🛠️ Development

### Local Development
1. Make changes to source files
2. Run `npm run build` to compile
3. Reload extension in Chrome (`chrome://extensions/`)
4. Test changes on coding platforms

### Hot Reload
For faster development, use Chrome's extension reload feature:
1. Make changes to files
2. Click reload button on extension card
3. Refresh target website

### Testing Checklist
- [ ] Extension loads without errors
- [ ] Sidebar appears on supported platforms
- [ ] Problem data extraction works
- [ ] Hints API integration functions
- [ ] Debug feedback works
- [ ] Popup shows correct information
- [ ] Local storage persists data
- [ ] Error handling works gracefully
