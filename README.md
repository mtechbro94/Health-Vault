# HealthVault - Patient-Controlled Health Record System

A secure, patient-owned health record management system with emergency access capabilities, blood donation coordination, and a Python-powered priority engine.

## Quick Start (Plug and Play)

HealthVault is designed to run locally with **zero database configuration** required. It automatically uses an in-memory MongoDB server if no connection string is provided.

1. **Clone the repository**
   ```bash
   git clone https://github.com/mtechbro94/health-vault.git
   cd health-vault
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Run the Application**
   Open two terminals:

   **Terminal 1 (Backend)**:
   ```bash
   cd server
   npm start
   ```
   *The server will start at http://localhost:3001 and automatically spin up a temporary database.*

   **Terminal 2 (Frontend)**:
   ```bash
   npm run dev
   ```
   *The app will be accessible at http://localhost:5173*

---

## Features

- **Patient Dashboard**: Manage personal health records, blood donation preferences, and emergency profiles.
- **Hospital Dashboard**: Search for patients, access emergency records (with consent), and broadcast urgent blood requests.
- **Emergency QR Access**: High-performance QR code system with **automatic network detection** for mobile scanning.
- **Priority Engine**: Sophisticated Python-based scoring system to determine the urgency of blood requests.
- **Mobile Ready**: Built-in IP selector helps you scan QR codes even when running on a local development machine.

## Tech Stack

- **Frontend**: React 18, Vite, Vanilla CSS (Glassmorphism design)
- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB (Supports Auto-In-Memory fallback for local development)
- **Urgency Engine**: Python 3.x
- **Utilities**: Twilio (Optional SMS), UUID, OS-level network discovery

## Advanced Configuration (Optional)

To use a persistent database or Twilio SMS, create a `.env` file in the `server/` directory:

```env
# MongoDB Connection (Persistent)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/healthvault

# Twilio Credentials
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number
```

## Usage Guide

### 1. Patient Flow
* Sign up as a **Patient**.
* Upload your medical records.
* In the dashboard, select your **Wi-Fi IP** from the dropdown to ensure the QR code is reachable by your phone.
* Scan the QR code to view the **Emergency Access Page**.

### 2. Hospital Flow
* Sign up as a **Hospital**.
* Use the search bar to find donors by blood group.
* Create a **Blood Request** to see the **Priority Engine** in action (calculating urgency scores from 0-100).

---

## License
MIT License. Created by @mtechbro94.
