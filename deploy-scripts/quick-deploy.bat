@echo off
echo 🚀 Starting LabFlow Clinic Deployment...
echo.

echo ✅ Building frontend for production...
call npm run build:netlify

if %errorlevel% equ 0 (
    echo.
    echo ✅ Frontend build completed successfully!
    echo 📁 Built files are in the 'dist' directory
    echo.
    echo ⚠️  Next steps:
    echo 1. 📤 Upload the 'dist' folder to Netlify
    echo 2. 🔧 Set environment variables in Netlify:
    echo    VITE_API_URL=https://your-render-backend.onrender.com
    echo    VITE_APP_ENV=production
    echo.
    echo 3. 🖥️  Deploy backend to Render using the 'backend' folder
    echo 4. 🔧 Set environment variables in Render:
    echo    NODE_ENV=production
    echo    MONGODB_URI=your-mongodb-connection-string
    echo    FRONTEND_URL=https://your-netlify-app.netlify.app
    echo.
    echo ✅ 🎉 Ready for deployment!
) else (
    echo.
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)

pause
