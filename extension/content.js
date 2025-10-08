// Content script for CodeSensei - injects sidebar into coding platforms
console.log('CodeSensei content script loaded');

let sidebarInjected = false;
let currentProblem = null;
let sidebarElement = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCodeSensei);
} else {
  initializeCodeSensei();
}

function initializeCodeSensei() {
  console.log('Initializing CodeSensei...');
  
  // Check if we're on a supported platform
  const platform = detectPlatform();
  if (!platform) {
    console.log('Not on a supported coding platform');
    return;
  }
  
  // Wait for page to fully load
  setTimeout(() => {
    extractProblemInfo(platform);
    injectSidebar();
  }, 2000);
}

// Detect which coding platform we're on
function detectPlatform() {
  const url = window.location.href;
  
  if (url.includes('leetcode.com/problems')) {
    return 'leetcode';
  } else if (url.includes('hackerrank.com/challenges')) {
    return 'hackerrank';
  } else if (url.includes('codeforces.com/problemset')) {
    return 'codeforces';
  } else if (url.includes('atcoder.jp/contests')) {
    return 'atcoder';
  }
  
  return null;
}

// Extract problem information from the page
function extractProblemInfo(platform) {
  console.log('Extracting problem info for platform:', platform);
  
  let problemData = {
    platform: platform,
    url: window.location.href,
    title: '',
    description: '',
    difficulty: '',
    tags: []
  };
  
  switch (platform) {
    case 'leetcode':
      problemData = extractLeetCodeProblem();
      break;
    case 'hackerrank':
      problemData = extractHackerRankProblem();
      break;
    case 'codeforces':
      problemData = extractCodeForcesProblem();
      break;
    case 'atcoder':
      problemData = extractAtCoderProblem();
      break;
  }
  
  currentProblem = problemData;
  console.log('Extracted problem:', problemData);
  
  // Store problem data
  chrome.storage.local.set({ currentProblem: problemData });
  
  // Log activity
  chrome.runtime.sendMessage({
    action: 'logActivity',
    data: {
      action: 'problemViewed',
      platform: platform,
      problemId: problemData.title
    }
  });
}

// Extract LeetCode problem data
function extractLeetCodeProblem() {
  const titleElement = document.querySelector('[data-cy="question-title"]') || 
                      document.querySelector('.css-v3d350') ||
                      document.querySelector('h1');
  
  const descriptionElement = document.querySelector('[data-cy="question-detail-main-tabs"]') ||
                           document.querySelector('.content__u3I1') ||
                           document.querySelector('.question-content');
  
  const difficultyElement = document.querySelector('[diff]') ||
                           document.querySelector('.css-10o4wqw');
  
  const tagsElements = document.querySelectorAll('.tag__2P4s') ||
                      document.querySelectorAll('.css-1l4w6pd');
  
  return {
    platform: 'leetcode',
    url: window.location.href,
    title: titleElement?.textContent?.trim() || 'Unknown Problem',
    description: descriptionElement?.textContent?.trim()?.substring(0, 1000) || '',
    difficulty: difficultyElement?.textContent?.trim() || 'Unknown',
    tags: Array.from(tagsElements).map(el => el.textContent?.trim()).filter(Boolean)
  };
}

// Extract HackerRank problem data
function extractHackerRankProblem() {
  const titleElement = document.querySelector('.challenge-title') ||
                      document.querySelector('h1');
  
  const descriptionElement = document.querySelector('.challenge-body-html') ||
                           document.querySelector('.problem-statement');
  
  const difficultyElement = document.querySelector('.difficulty');
  
  return {
    platform: 'hackerrank',
    url: window.location.href,
    title: titleElement?.textContent?.trim() || 'Unknown Problem',
    description: descriptionElement?.textContent?.trim()?.substring(0, 1000) || '',
    difficulty: difficultyElement?.textContent?.trim() || 'Unknown',
    tags: []
  };
}

// Extract CodeForces problem data
function extractCodeForcesProblem() {
  const titleElement = document.querySelector('.title') ||
                      document.querySelector('h1');
  
  const descriptionElement = document.querySelector('.problem-statement') ||
                           document.querySelector('.problem-content');
  
  return {
    platform: 'codeforces',
    url: window.location.href,
    title: titleElement?.textContent?.trim() || 'Unknown Problem',
    description: descriptionElement?.textContent?.trim()?.substring(0, 1000) || '',
    difficulty: 'Unknown',
    tags: []
  };
}

// Extract AtCoder problem data
function extractAtCoderProblem() {
  const titleElement = document.querySelector('h1') ||
                      document.querySelector('.h2');
  
  const descriptionElement = document.querySelector('#task-statement') ||
                           document.querySelector('.part');
  
  return {
    platform: 'atcoder',
    url: window.location.href,
    title: titleElement?.textContent?.trim() || 'Unknown Problem',
    description: descriptionElement?.textContent?.trim()?.substring(0, 1000) || '',
    difficulty: 'Unknown',
    tags: []
  };
}

// Inject the CodeSensei sidebar
function injectSidebar() {
  if (sidebarInjected) {
    console.log('Sidebar already injected');
    return;
  }
  
  console.log('Injecting CodeSensei sidebar...');
  
  // Create sidebar container
  sidebarElement = document.createElement('div');
  sidebarElement.id = 'codesensei-sidebar';
  sidebarElement.innerHTML = `
    <div id="codesensei-sidebar-content">
      <div class="codesensei-header">
        <h3>🧠 CodeSensei</h3>
        <button id="codesensei-toggle" class="codesensei-toggle-btn">−</button>
      </div>
      <div id="codesensei-tabs" class="codesensei-tabs">
        <button class="codesensei-tab active" data-tab="breakdown">Breakdown</button>
        <button class="codesensei-tab" data-tab="hints">Hints</button>
        <button class="codesensei-tab" data-tab="debug">Debug</button>
      </div>
      <div id="codesensei-content" class="codesensei-content">
        <div id="codesensei-loading" class="codesensei-loading">
          <div class="codesensei-spinner"></div>
          <p>Analyzing problem...</p>
        </div>
      </div>
    </div>
  `;
  
  // Add sidebar to page
  document.body.appendChild(sidebarElement);
  sidebarInjected = true;
  
  // Initialize sidebar functionality
  initializeSidebarEvents();
  
  // Load problem analysis
  loadProblemAnalysis();
}

// Initialize sidebar event listeners
function initializeSidebarEvents() {
  // Toggle button
  const toggleBtn = document.getElementById('codesensei-toggle');
  toggleBtn?.addEventListener('click', toggleSidebar);
  
  // Tab switching
  const tabs = document.querySelectorAll('.codesensei-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (!sidebarElement?.contains(e.target) && !e.target.closest('#codesensei-sidebar')) {
      // Optional: close sidebar on outside click
    }
  });
}

// Toggle sidebar visibility
function toggleSidebar() {
  const content = document.getElementById('codesensei-sidebar-content');
  const toggleBtn = document.getElementById('codesensei-toggle');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    toggleBtn.textContent = '−';
  } else {
    content.style.display = 'none';
    toggleBtn.textContent = '+';
  }
}

// Switch between tabs
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.codesensei-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Load tab content
  loadTabContent(tabName);
}

// Load content for specific tab
function loadTabContent(tabName) {
  const contentDiv = document.getElementById('codesensei-content');
  
  switch (tabName) {
    case 'breakdown':
      loadBreakdownTab();
      break;
    case 'hints':
      loadHintsTab();
      break;
    case 'debug':
      loadDebugTab();
      break;
  }
}

// Load problem analysis from backend
async function loadProblemAnalysis() {
  if (!currentProblem) {
    console.error('No current problem data');
    return;
  }
  
  try {
    // Get API endpoint from storage
    const { apiEndpoint } = await chrome.storage.local.get(['apiEndpoint']);
    
    const response = await fetch(`${apiEndpoint}/hints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem: currentProblem
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const analysis = await response.json();
    
    // Store analysis data
    chrome.storage.local.set({ 
      problemAnalysis: analysis,
      hintsRevealed: []
    });
    
    // Load breakdown tab by default
    loadBreakdownTab();
    
  } catch (error) {
    console.error('Failed to load problem analysis:', error);
    showError('Failed to analyze problem. Please try again.');
  }
}

// Load breakdown tab content
function loadBreakdownTab() {
  const contentDiv = document.getElementById('codesensei-content');
  
  chrome.storage.local.get(['problemAnalysis'], (result) => {
    const analysis = result.problemAnalysis;
    
    if (!analysis) {
      contentDiv.innerHTML = '<div class="codesensei-error">No analysis available</div>';
      return;
    }
    
    contentDiv.innerHTML = `
      <div class="codesensei-breakdown">
        <h4>📊 Problem Analysis</h4>
        <div class="codesensei-category">
          <strong>Category:</strong> ${analysis.category || 'Unknown'}
        </div>
        <div class="codesensei-difficulty">
          <strong>Difficulty:</strong> ${currentProblem?.difficulty || 'Unknown'}
        </div>
        <div class="codesensei-summary">
          <strong>Summary:</strong>
          <p>${analysis.summary || 'No summary available'}</p>
        </div>
        <div class="codesensei-tags">
          <strong>Tags:</strong>
          <div class="codesensei-tag-list">
            ${(currentProblem?.tags || []).map(tag => 
              `<span class="codesensei-tag">${tag}</span>`
            ).join('')}
          </div>
        </div>
      </div>
    `;
  });
}

// Load hints tab content
function loadHintsTab() {
  const contentDiv = document.getElementById('codesensei-content');
  
  chrome.storage.local.get(['problemAnalysis', 'hintsRevealed'], (result) => {
    const analysis = result.problemAnalysis;
    const hintsRevealed = result.hintsRevealed || [];
    
    if (!analysis || !analysis.hints) {
      contentDiv.innerHTML = '<div class="codesensei-error">No hints available</div>';
      return;
    }
    
    const hintsHtml = analysis.hints.map((hint, index) => `
      <div class="codesensei-hint ${hintsRevealed.includes(index) ? 'revealed' : 'hidden'}">
        <div class="codesensei-hint-header">
          <span class="codesensei-hint-number">Hint ${index + 1}</span>
          ${!hintsRevealed.includes(index) ? 
            `<button class="codesensei-reveal-btn" onclick="revealHint(${index})">Reveal</button>` : 
            ''
          }
        </div>
        <div class="codesensei-hint-content">
          ${hintsRevealed.includes(index) ? hint : 'Click to reveal...'}
        </div>
      </div>
    `).join('');
    
    contentDiv.innerHTML = `
      <div class="codesensei-hints">
        <h4>💡 Progressive Hints</h4>
        <p class="codesensei-hints-intro">
          Get hints that guide you step by step without spoiling the solution.
        </p>
        ${hintsHtml}
      </div>
    `;
  });
}

// Load debug tab content
function loadDebugTab() {
  const contentDiv = document.getElementById('codesensei-content');
  
  contentDiv.innerHTML = `
    <div class="codesensei-debug">
      <h4>🐛 Debug Assistant</h4>
      <p class="codesensei-debug-intro">
        Paste your code here to get AI-powered debugging feedback.
      </p>
      <textarea 
        id="codesensei-code-input" 
        placeholder="Paste your code here..."
        rows="10"
      ></textarea>
      <button id="codesensei-debug-btn" class="codesensei-debug-btn">
        Get Debug Feedback
      </button>
      <div id="codesensei-debug-output" class="codesensei-debug-output"></div>
    </div>
  `;
  
  // Add debug button event listener
  document.getElementById('codesensei-debug-btn')?.addEventListener('click', getDebugFeedback);
}

// Reveal a hint
async function revealHint(hintIndex) {
  try {
    // Update revealed hints
    chrome.storage.local.get(['hintsRevealed'], (result) => {
      const hintsRevealed = result.hintsRevealed || [];
      hintsRevealed.push(hintIndex);
      chrome.storage.local.set({ hintsRevealed });
      
      // Reload hints tab
      loadHintsTab();
      
      // Log activity
      chrome.runtime.sendMessage({
        action: 'logActivity',
        data: {
          action: 'hintRevealed',
          platform: currentProblem?.platform,
          problemId: currentProblem?.title,
          hintIndex: hintIndex
        }
      });
    });
    
  } catch (error) {
    console.error('Failed to reveal hint:', error);
  }
}

// Get debug feedback for user code
async function getDebugFeedback() {
  const codeInput = document.getElementById('codesensei-code-input');
  const debugOutput = document.getElementById('codesensei-debug-output');
  const debugBtn = document.getElementById('codesensei-debug-btn');
  
  if (!codeInput?.value.trim()) {
    debugOutput.innerHTML = '<div class="codesensei-error">Please enter some code first</div>';
    return;
  }
  
  // Show loading state
  debugBtn.textContent = 'Analyzing...';
  debugBtn.disabled = true;
  debugOutput.innerHTML = '<div class="codesensei-loading">Analyzing your code...</div>';
  
  try {
    const { apiEndpoint } = await chrome.storage.local.get(['apiEndpoint']);
    
    const response = await fetch(`${apiEndpoint}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem: currentProblem,
        code: codeInput.value
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const feedback = await response.json();
    
    debugOutput.innerHTML = `
      <div class="codesensei-feedback">
        <h5>🔍 Analysis Results</h5>
        <div class="codesensei-feedback-content">
          ${feedback.tips?.map(tip => `<div class="codesensei-tip">• ${tip}</div>`).join('') || 'No specific issues found'}
        </div>
        ${feedback.example ? `
          <div class="codesensei-example">
            <h6>💡 Example Reasoning</h6>
            <p>${feedback.example}</p>
          </div>
        ` : ''}
      </div>
    `;
    
    // Log activity
    chrome.runtime.sendMessage({
      action: 'logActivity',
      data: {
        action: 'debugSession',
        platform: currentProblem?.platform,
        problemId: currentProblem?.title
      }
    });
    
  } catch (error) {
    console.error('Failed to get debug feedback:', error);
    debugOutput.innerHTML = '<div class="codesensei-error">Failed to analyze code. Please try again.</div>';
  } finally {
    debugBtn.textContent = 'Get Debug Feedback';
    debugBtn.disabled = false;
  }
}

// Show error message
function showError(message) {
  const contentDiv = document.getElementById('codesensei-content');
  contentDiv.innerHTML = `<div class="codesensei-error">${message}</div>`;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'platformDetected') {
    console.log('Platform detected:', request.url);
    // Re-initialize if needed
    if (!sidebarInjected) {
      initializeCodeSensei();
    }
  }
  
  sendResponse({ success: true });
});

// Make functions globally available for inline event handlers
window.revealHint = revealHint;
