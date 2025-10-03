# Deploy Frontend to Netlify

## ขั้นตอนการ Deploy Frontend

### 1. เตรียม Environment Variables
สร้างไฟล์ `.env.production`:
```bash
VITE_API_URL=https://your-render-backend.onrender.com
VITE_APP_ENV=production
```

### 2. Build สำหรับ Production
```bash
# ใน root directory
npm run build
```

### 3. Deploy ใน Netlify

#### วิธีที่ 1: Drag & Drop
1. ไปที่ [netlify.com](https://netlify.com)
2. เข้าสู่ระบบ
3. ลาก folder `dist` ไปวางใน deploy area

#### วิธีที่ 2: Git Integration
1. Push code ไป GitHub
2. ใน Netlify กด "New site from Git"
3. เลือก repository
4. ตั้งค่า:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### 4. ตั้งค่า Environment Variables ใน Netlify
ใน Netlify Dashboard > Site settings > Environment variables:
```
VITE_API_URL=https://your-render-backend.onrender.com
VITE_APP_ENV=production
```

### 5. ตั้งค่า Redirects
Netlify จะใช้ `netlify.toml` ที่เราสร้างไว้แล้ว

### 6. อัปเดต Backend CORS
อัปเดต `FRONTEND_URL` ใน Render environment variables:
```
FRONTEND_URL=https://your-netlify-app.netlify.app
```

### 7. ทดสอบ
- เข้าไปที่ Netlify URL ที่ได้รับ
- ทดสอบ login และฟีเจอร์ต่างๆ
