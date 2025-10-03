# 🚀 LabFlow Clinic Deployment Guide

## สรุปการ Deploy

การ deploy LabFlow Clinic แบ่งเป็น 3 ส่วน:
1. **Backend** → Render (Free tier)
2. **Frontend** → Netlify (Free tier)  
3. **Electron App** → ยังคงใช้ local backend/frontend ตามเดิม

## 📋 ไฟล์ที่เตรียมไว้แล้ว

### Backend Files:
- `backend/render.yaml` - Render configuration
- `backend/.env.example` - Environment variables template
- `backend/server.js` - อัปเดต CORS สำหรับ production

### Frontend Files:
- `netlify.toml` - Netlify configuration
- `.env.example` - Environment variables template
- `vite.config.production.ts` - Production build config
- `src/services/api.ts` - อัปเดตรองรับ environment variables
- `src/contexts/AuthContext.tsx` - อัปเดต API URLs

### Deploy Scripts:
- `deploy-scripts/quick-deploy.bat` - Windows deployment script
- `deploy-scripts/quick-deploy.sh` - Linux/Mac deployment script
- `deploy-scripts/deploy-backend.md` - Backend deployment guide
- `deploy-scripts/deploy-frontend.md` - Frontend deployment guide
- `deploy-scripts/post-deployment.md` - Post-deployment checklist

## 🚀 Quick Start

### 1. Build Frontend
```bash
npm run build:netlify
```

### 2. Deploy Backend to Render
1. สร้าง repository ใหม่สำหรับ backend หรือใช้ subfolder
2. ไปที่ [render.com](https://render.com) → New Web Service
3. เชื่อมต่อ GitHub repository
4. ตั้งค่า:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     ```
     NODE_ENV=production
     MONGODB_URI=your-mongodb-connection-string
     FRONTEND_URL=https://your-netlify-app.netlify.app
     ```

### 3. Deploy Frontend to Netlify
1. ไปที่ [netlify.com](https://netlify.com)
2. ลาก folder `dist` ไปวาง หรือเชื่อมต่อ Git
3. ตั้งค่า Environment Variables:
   ```
   VITE_API_URL=https://your-render-backend.onrender.com
   VITE_APP_ENV=production
   ```

## 🔧 การตั้งค่าหลัง Deploy

### อัปเดต URLs จริง:
1. **ใน Render**: อัปเดต `FRONTEND_URL` เป็น Netlify URL จริง
2. **ใน Netlify**: อัปเดต `VITE_API_URL` เป็น Render URL จริง

### ทดสอบการทำงาน:
- ✅ เข้าไปที่ Netlify URL
- ✅ ทดสอบ login
- ✅ ทดสอบสร้างคนไข้
- ✅ ตรวจสอบ console ไม่มี CORS errors

## 🖥️ Electron App ไม่กระทบ

Electron app จะยังคง:
- ใช้ `http://localhost:3002` สำหรับ backend
- ใช้ local frontend
- ทำงานแยกจาก deployed version
- ไม่มีผลกระทบใดๆ

## 📊 Architecture หลัง Deploy

```
┌─────────────────┐    ┌─────────────────┐
│   Netlify       │    │     Render      │
│   (Frontend)    │◄──►│   (Backend)     │
│                 │    │                 │
│ your-app.       │    │ your-backend.   │
│ netlify.app     │    │ onrender.com    │
└─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   Atlas         │
                    └─────────────────┘

┌─────────────────────────────────────────┐
│           Electron App                  │
│  (ยังคงใช้ localhost:3002)              │
│  ไม่กระทบจาก deployment                 │
└─────────────────────────────────────────┘
```

## 🎯 ประโยชน์ของการ Deploy

1. **เข้าถึงได้ทุกที่** - ใช้งานผ่าน web browser
2. **แชร์ได้ง่าย** - ส่ง URL ให้ทีมงาน
3. **ไม่ต้องติดตั้ง** - เปิดเบราว์เซอร์ใช้ได้เลย
4. **Backup option** - มีทางเลือกนอกจาก Electron
5. **Testing** - ทดสอบ production environment

## 🔄 การอัปเดตในอนาคต

### Backend:
```bash
cd backend
git add .
git commit -m "Update backend"
git push origin main
# Render จะ auto-deploy
```

### Frontend:
```bash
npm run build:netlify
# Upload dist folder ใหม่ไป Netlify
```

## 🆘 Troubleshooting

### CORS Errors:
- ตรวจสอบ `FRONTEND_URL` ใน Render
- ตรวจสอบ `VITE_API_URL` ใน Netlify

### Build Errors:
- ตรวจสอบ Node.js version (ใช้ v18)
- ตรวจสอบ environment variables

### Database Connection:
- ตรวจสอบ `MONGODB_URI` ใน Render
- ตรวจสอบ MongoDB Atlas whitelist IPs

---

**🎉 พร้อม Deploy แล้ว!** ใช้ `quick-deploy.bat` เพื่อเริ่มต้น
