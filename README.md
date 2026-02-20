# HealthVault - Patient-Controlled Health Record System

A secure, patient-owned health record management system with emergency access capabilities and blood donation coordination.

## Features

- **Patient Dashboard** - Manage personal health records, blood donation preferences, and emergency profiles
- **Hospital Dashboard** - Access patient records (with consent), broadcast urgent blood requests
- **Emergency Access** - QR-code based emergency access to patient records
- **Priority Engine** - Python-based urgency scoring for blood requests
- **SMS Notifications** - Twilio integration for alerting blood donors

## Prerequisites

- Node.js 18+
- Python 3.8+
- MongoDB (local or Atlas)
- npm or yarn

## Project Structure

```
health-vault/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── context/            # Auth context
│   ├── pages/              # Page components
│   └── utils/              # API helpers and utilities
├── server/                 # Express backend
│   ├── models/             # Mongoose models
│   ├── priority_engine/    # Python urgency scoring
│   ├── index.js            # API server
│   └── .env                # Environment variables
├── dist/                   # Built frontend
├── package.json            # Root package config
└── vite.config.js          # Vite configuration
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/healthvault

# Server Port
PORT=3001

# Twilio (Optional - for SMS notifications)
# Get a free trial at https://www.twilio.com/
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

For MongoDB Atlas (cloud), use:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/healthvault
```

### 3. Install MongoDB

**Option A: Local MongoDB**
1. Download from https://www.mongodb.com/try/download/community
2. Install and start the MongoDB service

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string and put it in MONGODB_URI

### 4. Run the Project

**Development Mode (Frontend only - API calls will fail without backend):**
```bash
npm run dev
```
Frontend runs at http://localhost:5173

**Full Stack (requires MongoDB):**

Terminal 1 - Backend:
```bash
cd server
npm start
```
Backend runs at http://localhost:3001

Terminal 2 - Frontend:
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
cd server
npm start
```

## Usage

### For Patients:
1. Sign up as a "Patient"
2. Complete your profile with medical details
3. Enable blood donation if eligible
4. Upload medical records
5. Share your emergency QR code

### For Hospitals:
1. Sign up as a "Hospital"
2. Search for patients by blood group
3. Request blood with urgency scoring
4. Access patient records (with consent)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/users | Create new user |
| POST | /api/users/login | User login |
| GET | /api/patients/:patientId | Get patient by ID |
| PUT | /api/patients/:patientId | Update patient |
| GET | /api/records/:patientId | Get patient records |
| POST | /api/records | Add medical record |
| POST | /api/blood-requests | Create blood request |
| POST | /api/access-logs | Log record access |

## Blood Request Types

The priority engine accepts these request types:
- `ACCIDENT` - Base score: 90
- `CHILDBIRTH` - Base score: 80
- `SURGERY` - Base score: 75
- `THALASSEMIA` - Base score: 60

## Tech Stack

- **Frontend**: React 18, React Router, Vite
- **Backend**: Express.js, Mongoose
- **Database**: MongoDB
- **Priority Engine**: Python
- **SMS**: Twilio (optional)

## License

MIT
