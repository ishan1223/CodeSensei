// Popup script for CodeSensei extension
console.log('CodeSensei popup loaded');

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  console.log('Initializing popup...');
  
  // Load current status and stats
  await loadStatus();
  await loadStats();
  
  // Set up event listeners
  setupEventListeners();
}

// Load current status
async function loadStatus() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a supported platform
    const platform = detectPlatform(tab.url);
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const currentProblemDiv = document.getElementById('currentProblem');
    
    if (platform) {
      statusDot.className = 'status-dot active';
      statusText.textContent = `Active on ${platform}`;
      
      // Try to get current problem from storage
      const { currentProblem } = await chrome.storage.local.get(['currentProblem']);
      if (currentProblem) {
        currentProblemDiv.textContent = `${currentProblem.title} (${currentProblem.difficulty})`;
      } else {
        currentProblemDiv.textContent = 'Problem analysis in progress...';
      }
    } else {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Not on a coding platform';
      currentProblemDiv.textContent = 'Visit LeetCode, HackerRank, etc.';
    }
    
  } catch (error) {
    console.error('Failed to load status:', error);
    document.getElementById('statusText').textContent = 'Error loading status';
  }
}

// Load user statistics
async function loadStats() {
  try {
    const { progress } = await chrome.storage.local.get(['progress']);
    const today = new Date().toISOString().split('T')[0];
    const todayProgress = progress?.[today] || { hintsUsed: 0, problemsViewed: 0, debugSessions: 0 };
    
    document.getElementById('hintsUsed').textContent = todayProgress.hintsUsed;
    document.getElementById('problemsViewed').textContent = todayProgress.problemsViewed;
    document.getElementById('debugSessions').textContent = todayProgress.debugSessions;
    
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Detect platform from URL
function detectPlatform(url) {
  if (!url) return null;
  
  if (url.includes('leetcode.com/problems')) {
    return 'LeetCode';
  } else if (url.includes('hackerrank.com/challenges')) {
    return 'HackerRank';
  } else if (url.includes('codeforces.com/problemset')) {
    return 'CodeForces';
  } else if (url.includes('atcoder.jp/contests')) {
    return 'AtCoder';
  }
  
  return null;
}

// Set up event listeners
function setupEventListeners() {
  // Activate button
  document.getElementById('activateBtn').addEventListener('click', activateCodeSensei);
  
  // Toggle sidebar button
  document.getElementById('toggleSidebarBtn').addEventListener('click', toggleSidebar);
  
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', refreshAnalysis);
  
  // Settings link
  document.getElementById('settingsLink').addEventListener('click', openSettings);
}

// Activate CodeSensei on current tab
async function activateCodeSensei() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a supported platform
    const platform = detectPlatform(tab.url);
    if (!platform) {
      alert('Please visit a supported coding platform (LeetCode, HackerRank, etc.)');
      return;
    }
    
    // Send message to content script to initialize
    await chrome.tabs.sendMessage(tab.id, {
      action: 'activateCodeSensei'
    });
    
    // Update status
    await loadStatus();
    
    // Close popup
    window.close();
    
  } catch (error) {
    console.error('Failed to activate CodeSensei:', error);
    alert('Failed to activate CodeSensei. Please refresh the page and try again.');
  }
}

// Toggle sidebar visibility
async function toggleSidebar() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.tabs.sendMessage(tab.id, {
      action: 'toggleSidebar'
    });
    
    // Close popup
    window.close();
    
  } catch (error) {
    console.error('Failed to toggle sidebar:', error);
    alert('Failed to toggle sidebar. Please refresh the page and try again.');
  }
}

// Refresh problem analysis
async function refreshAnalysis() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.tabs.sendMessage(tab.id, {
      action: 'refreshAnalysis'
    });
    
    // Update status
    await loadStatus();
    
    alert('Analysis refreshed!');
    
  } catch (error) {
    console.error('Failed to refresh analysis:', error);
    alert('Failed to refresh analysis. Please try again.');
  }
}

// Open settings page
function openSettings() {
  // Create a simple settings page or open options
  chrome.runtime.openOptionsPage();
}
