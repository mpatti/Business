#!/bin/bash

echo "======================================"
echo "FormBackend SaaS - Production Deployment"
echo "======================================"
echo ""

# Build frontend
echo "📦 Building frontend for production..."
cd frontend
npm run build
cd ..
echo "✓ Frontend built"
echo ""

# Setup production server script
cat > start-production.sh << 'EOF'
#!/bin/bash

# Production startup script
cd backend

# Set production environment
export NODE_ENV=production

# Start backend server
echo "Starting FormBackend API server..."
node server.js

EOF

chmod +x start-production.sh

echo "✅ Production build complete!"
echo ""
echo "Deployment files ready:"
echo "  - backend/ (API server)"
echo "  - frontend/dist/ (Static files)"
echo "  - start-production.sh (Production startup)"
echo ""
echo "Deploy to your VPS:"
echo "1. Upload these files to your server"
echo "2. Set up environment variables in backend/.env"
echo "3. Run: ./start-production.sh"
echo "4. Serve frontend/dist with nginx or similar"
echo ""
echo "For more details, see DEPLOYMENT.md"
echo ""
