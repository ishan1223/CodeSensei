#!/bin/bash

# CodeSensei Setup Script
# This script sets up the complete CodeSensei Chrome Extension prototype

set -e  # Exit on any error

echo "🧠 CodeSensei Setup Script"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) detected"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "npm $(npm --version) detected"
    
    # Check Chrome (optional)
    if command -v google-chrome &> /dev/null || command -v chrome &> /dev/null; then
        print_success "Chrome browser detected"
    else
        print_warning "Chrome browser not detected. You'll need Chrome to test the extension."
    fi
    
    echo ""
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cp env.example .env
        print_warning "Please edit backend/.env with your API keys and MongoDB URI"
    else
        print_success ".env file already exists"
    fi
    
    print_success "Backend setup complete"
    echo ""
}

# Setup extension
setup_extension() {
    print_status "Setting up extension..."
    
    cd ../extension
    
    # Install dependencies
    print_status "Installing extension dependencies..."
    npm install
    
    # Build extension
    print_status "Building extension..."
    npm run build
    
    print_success "Extension setup complete"
    echo ""
}

# Create startup scripts
create_scripts() {
    print_status "Creating startup scripts..."
    
    # Backend start script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting CodeSensei Backend..."
cd backend
npm run dev
EOF
    
    # Extension build script
    cat > build-extension.sh << 'EOF'
#!/bin/bash
echo "🔨 Building CodeSensei Extension..."
cd extension
npm run build
echo "✅ Extension built successfully!"
echo "📁 Load the 'extension/dist' folder in Chrome as an unpacked extension"
EOF
    
    # Test script
    cat > test-api.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing CodeSensei API..."
echo ""

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:3000/health | jq '.' || echo "❌ Backend not running or jq not installed"

echo ""
echo "Testing hints endpoint..."
curl -s -X POST http://localhost:3000/api/hints \
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
  }' | jq '.' || echo "❌ API test failed"

echo ""
echo "✅ API tests complete!"
EOF
    
    # Make scripts executable
    chmod +x start-backend.sh build-extension.sh test-api.sh
    
    print_success "Startup scripts created"
    echo ""
}

# Display setup instructions
show_instructions() {
    print_success "Setup complete! 🎉"
    echo ""
    echo "📋 Next Steps:"
    echo "============="
    echo ""
    echo "1. 🔧 Configure Environment Variables:"
    echo "   Edit backend/.env with your API keys:"
    echo "   - GEMINI_API_KEY or OPENAI_API_KEY"
    echo "   - MONGODB_URI (MongoDB Atlas connection string)"
    echo ""
    echo "2. 🚀 Start the Backend Server:"
    echo "   ./start-backend.sh"
    echo "   Or: cd backend && npm run dev"
    echo ""
    echo "3. 🔨 Build the Extension:"
    echo "   ./build-extension.sh"
    echo "   Or: cd extension && npm run build"
    echo ""
    echo "4. 📱 Load Extension in Chrome:"
    echo "   - Open Chrome and go to chrome://extensions/"
    echo "   - Enable 'Developer mode'"
    echo "   - Click 'Load unpacked'"
    echo "   - Select the 'extension/dist' folder"
    echo ""
    echo "5. 🧪 Test the System:"
    echo "   ./test-api.sh"
    echo "   Then visit LeetCode or HackerRank to test the extension"
    echo ""
    echo "📚 Documentation:"
    echo "================="
    echo "- Backend setup: backend/README.md"
    echo "- Extension setup: extension/README.md"
    echo "- Testing guide: docs/TESTING_GUIDE.md"
    echo "- Demo script: docs/DEMO_SCRIPT.md"
    echo "- Architecture: docs/ARCHITECTURE.md"
    echo ""
    echo "🐛 Troubleshooting:"
    echo "==================="
    echo "- Check that MongoDB Atlas is accessible"
    echo "- Verify API keys are correctly configured"
    echo "- Ensure backend server is running on port 3000"
    echo "- Check Chrome console for extension errors"
    echo ""
    echo "🎯 Demo URLs:"
    echo "============="
    echo "- LeetCode: https://leetcode.com/problems/two-sum/"
    echo "- HackerRank: https://www.hackerrank.com/challenges/simple-array-sum/problem"
    echo ""
}

# Main setup function
main() {
    echo "Starting CodeSensei setup..."
    echo ""
    
    check_prerequisites
    setup_backend
    setup_extension
    create_scripts
    show_instructions
    
    print_success "CodeSensei setup completed successfully! 🎉"
}

# Run main function
main "$@"
