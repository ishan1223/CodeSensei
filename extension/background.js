// Background service worker for CodeSensei
console.log('CodeSensei background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('CodeSensei installed:', details.reason);
  
  // Initialize default settings
  chrome.storage.local.set({
    enabled: true,
    apiEndpoint: 'http://localhost:3000/api',
    userId: generateUserId(),
    settings: {
      theme: 'light',
      hintsEnabled: true,
      debugEnabled: true
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'getSettings':
      chrome.storage.local.get(['settings', 'apiEndpoint'], (data) => {
        sendResponse({
          settings: data.settings || {},
          apiEndpoint: data.apiEndpoint || 'http://localhost:3000/api'
        });
      });
      return true; // Keep message channel open for async response
      
    case 'updateProgress':
      updateUserProgress(request.data);
      sendResponse({ success: true });
      break;
      
    case 'logActivity':
      logUserActivity(request.data);
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Generate unique user ID for anonymous tracking
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Update user progress in storage
function updateUserProgress(data) {
  chrome.storage.local.get(['progress'], (result) => {
    const progress = result.progress || {};
    const today = new Date().toISOString().split('T')[0];
    
    if (!progress[today]) {
      progress[today] = {
        hintsUsed: 0,
        problemsViewed: 0,
        debugSessions: 0
      };
    }
    
    progress[today].hintsUsed += data.hintsUsed || 0;
    progress[today].problemsViewed += data.problemsViewed || 0;
    progress[today].debugSessions += data.debugSessions || 0;
    
    chrome.storage.local.set({ progress });
  });
}

// Log user activity for analytics
function logUserActivity(data) {
  chrome.storage.local.get(['activityLog'], (result) => {
    const activityLog = result.activityLog || [];
    
    activityLog.push({
      timestamp: Date.now(),
      action: data.action,
      platform: data.platform,
      problemId: data.problemId
    });
    
    // Keep only last 100 activities
    if (activityLog.length > 100) {
      activityLog.splice(0, activityLog.length - 100);
    }
    
    chrome.storage.local.set({ activityLog });
  });
}

// Handle tab updates to detect coding platforms
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const codingPlatforms = [
      'leetcode.com/problems',
      'hackerrank.com/challenges',
      'codeforces.com/problemset',
      'atcoder.jp/contests'
    ];
    
    const isCodingPlatform = codingPlatforms.some(platform => 
      tab.url.includes(platform)
    );
    
    if (isCodingPlatform) {
      // Notify content script that we're on a coding platform
      chrome.tabs.sendMessage(tabId, {
        action: 'platformDetected',
        url: tab.url
      }).catch(() => {
        // Ignore errors if content script isn't ready
      });
    }
  }
});
