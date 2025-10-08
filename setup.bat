@echo off
REM CodeSensei Setup Script for Windows
REM This script sets up the complete CodeSensei Chrome Extension prototype

echo.
echo 🧠 CodeSensei Setup Script
echo ==========================
echo.

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set NODE_MAJOR=%%i

if %NODE_MAJOR% lss 18 (
    echo [ERROR] Node.js version 18+ required. Current version: 
    node --version
    pause
    exit /b 1
)

echo [SUCCESS] Node.js 
node --version
echo detected

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

echo [SUCCESS] npm 
npm --version
echo detected

echo.

REM Setup backend
echo [INFO] Setting up backend...
cd backend

echo [INFO] Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo [INFO] Creating .env file...
    copy env.example .env
    echo [WARNING] Please edit backend\.env with your API keys and MongoDB URI
) else (
    echo [SUCCESS] .env file already exists
)

echo [SUCCESS] Backend setup complete
echo.

REM Setup extension
echo [INFO] Setting up extension...
cd ..\extension

echo [INFO] Installing extension dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install extension dependencies
    pause
    exit /b 1
)

echo [INFO] Building extension...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build extension
    pause
    exit /b 1
)

echo [SUCCESS] Extension setup complete
echo.

REM Create startup scripts
echo [INFO] Creating startup scripts...

REM Backend start script
echo @echo off > start-backend.bat
echo echo 🚀 Starting CodeSensei Backend... >> start-backend.bat
echo cd backend >> start-backend.bat
echo npm run dev >> start-backend.bat

REM Extension build script
echo @echo off > build-extension.bat
echo echo 🔨 Building CodeSensei Extension... >> build-extension.bat
echo cd extension >> build-extension.bat
echo npm run build >> build-extension.bat
echo echo ✅ Extension built successfully! >> build-extension.bat
echo echo 📁 Load the 'extension\dist' folder in Chrome as an unpacked extension >> build-extension.bat

REM Test script
echo @echo off > test-api.bat
echo echo 🧪 Testing CodeSensei API... >> test-api.bat
echo echo. >> test-api.bat
echo curl -s http://localhost:3000/health >> test-api.bat
echo echo. >> test-api.bat
echo echo Testing hints endpoint... >> test-api.bat
echo curl -s -X POST http://localhost:3000/api/hints -H "Content-Type: application/json" -d "{\"problem\":{\"title\":\"Two Sum\",\"platform\":\"leetcode\",\"difficulty\":\"Easy\",\"description\":\"Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\",\"url\":\"https://leetcode.com/problems/two-sum/\"},\"userId\":\"test_user_123\"}" >> test-api.bat

echo [SUCCESS] Startup scripts created
echo.

REM Display setup instructions
echo [SUCCESS] Setup complete! 🎉
echo.
echo 📋 Next Steps:
echo =============
echo.
echo 1. 🔧 Configure Environment Variables:
echo    Edit backend\.env with your API keys:
echo    - GEMINI_API_KEY or OPENAI_API_KEY
echo    - MONGODB_URI (MongoDB Atlas connection string)
echo.
echo 2. 🚀 Start the Backend Server:
echo    start-backend.bat
echo    Or: cd backend ^&^& npm run dev
echo.
echo 3. 🔨 Build the Extension:
echo    build-extension.bat
echo    Or: cd extension ^&^& npm run build
echo.
echo 4. 📱 Load Extension in Chrome:
echo    - Open Chrome and go to chrome://extensions/
echo    - Enable 'Developer mode'
echo    - Click 'Load unpacked'
echo    - Select the 'extension\dist' folder
echo.
echo 5. 🧪 Test the System:
echo    test-api.bat
echo    Then visit LeetCode or HackerRank to test the extension
echo.
echo 📚 Documentation:
echo =================
echo - Backend setup: backend\README.md
echo - Extension setup: extension\README.md
echo - Testing guide: docs\TESTING_GUIDE.md
echo - Demo script: docs\DEMO_SCRIPT.md
echo - Architecture: docs\ARCHITECTURE.md
echo.
echo 🐛 Troubleshooting:
echo ===================
echo - Check that MongoDB Atlas is accessible
echo - Verify API keys are correctly configured
echo - Ensure backend server is running on port 3000
echo - Check Chrome console for extension errors
echo.
echo 🎯 Demo URLs:
echo =============
echo - LeetCode: https://leetcode.com/problems/two-sum/
echo - HackerRank: https://www.hackerrank.com/challenges/simple-array-sum/problem
echo.

echo [SUCCESS] CodeSensei setup completed successfully! 🎉
pause
