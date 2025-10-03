# LabFlow Clinic Backend API

Backend API server for LabFlow Clinic Management System built with Node.js, Express, and MongoDB.

## Features

- **Patient Management**: CRUD operations for patient records
- **Search**: Search patients by name, ID card, or LN number
- **Data Validation**: Input validation and error handling
- **CORS Support**: Cross-origin resource sharing enabled
- **Health Check**: API health monitoring endpoint

## API Endpoints

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/search/:query` - Search patients

### Health Check
- `GET /api/health` - API health status

## Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   - Copy `.env` file and update MongoDB connection string
   - Default: `mongodb://localhost:27017/labflow-clinic`

3. **Start MongoDB**
   - Ensure MongoDB is running on your system
   - Default port: 27017

4. **Run Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/labflow-clinic
PORT=3001
NODE_ENV=development
```

## Database Schema

### Patient Collection
```javascript
{
  _id: ObjectId,
  ln: String,           // Lab Number
  idCard: String,       // National ID Card
  title: String,        // Title (นาย, นาง, นางสาว, etc.)
  firstName: String,
  lastName: String,
  gender: String,       // "male" or "female"
  birthDate: String,    // ISO date string
  age: Number,
  address: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages in Thai language for better user experience.

## CORS Configuration

CORS is enabled for all origins in development. Configure appropriately for production use.
