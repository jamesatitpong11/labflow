# หลังจาก Deploy เสร็จแล้ว

## การตั้งค่าหลัง Deployment

### 1. อัปเดต Environment Variables
หลังจากได้ URL จริงแล้ว ให้อัปเดต:

#### ใน Render (Backend):
```
FRONTEND_URL=https://your-actual-netlify-app.netlify.app
```

#### ใน Netlify (Frontend):
```
VITE_API_URL=https://your-actual-render-backend.onrender.com
```

### 2. ทดสอบการเชื่อมต่อ
1. เข้าไปที่ frontend URL
2. ทดสอบ login
3. ทดสอบการสร้างคนไข้
4. ทดสอบการสร้าง visit
5. ตรวจสอบ console ว่าไม่มี CORS errors

### 3. การใช้งานร่วมกับ Electron
- Electron app จะยังคงใช้ local backend (`http://localhost:3002`)
- Web version จะใช้ deployed backend
- ไม่มีผลกระทบต่อกัน

### 4. การอัปเดตในอนาคต

#### อัปเดต Backend:
```bash
cd backend
git add .
git commit -m "Update backend"
git push origin main
# Render จะ auto-deploy
```

#### อัปเดต Frontend:
```bash
npm run build
# Upload dist folder ใหม่ไป Netlify
# หรือ push ไป Git ถ้าใช้ Git integration
```

### 5. Monitoring และ Logs
- **Render**: ดู logs ใน Dashboard > Logs
- **Netlify**: ดู deploy logs ใน Dashboard > Deploys
- **Frontend**: ใช้ browser console สำหรับ debug

### 6. Backup และ Security
- ตั้งค่า MongoDB backup
- ใช้ environment variables สำหรับ sensitive data
- ตรวจสอบ CORS settings เป็นประจำ
