# Deploy Backend to Render

## ขั้นตอนการ Deploy Backend

### 1. เตรียม Repository
```bash
# สร้าง repository ใหม่สำหรับ backend (หรือใช้ subfolder)
cd backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/yourusername/labflow-backend.git
git push -u origin main
```

### 2. Deploy ใน Render
1. ไปที่ [render.com](https://render.com)
2. เข้าสู่ระบบและกด "New +"
3. เลือก "Web Service"
4. เชื่อมต่อ GitHub repository
5. ตั้งค่าดังนี้:
   - **Name**: `labflow-clinic-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 3. ตั้งค่า Environment Variables
ใน Render Dashboard > Environment:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/labflow?retryWrites=true&w=majority
FRONTEND_URL=https://your-netlify-app.netlify.app
```

### 4. ตรวจสอบ Health Check
- Render จะใช้ `/api/health` endpoint
- ตรวจสอบว่า backend ทำงานได้ที่ URL ที่ได้รับ

### 5. บันทึก Backend URL
- จดบันทึก URL ที่ได้จาก Render (เช่น `https://labflow-clinic-backend.onrender.com`)
- จะใช้ใน frontend configuration
