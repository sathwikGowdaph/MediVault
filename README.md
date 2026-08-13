# MediVault — Emergency Medical Record Management System MVP

MediVault is a secure, scalable, responsive, and deployment-ready Emergency Medical Record Management System built with React, Vite, Node.js, Express, MongoDB, and Tailwind CSS.

## Features

- **Authentication & Authorization**: Multi-role support (Patient, Doctor, Family, Admin), JWT access & refresh tokens, password hashing with bcrypt, protected routes.
- **Patient Medical Profile**: Personal medical info, blood group, allergies, chronic diseases, current medications, emergency notes, and emergency contacts.
- **Medical Records Vault**: Secure upload for prescriptions, lab reports, scans, and insurance files (PDF, PNG, JPG, WEBP up to 10MB) with category tagging, search, filter, sorting, pagination, and authenticated streaming downloads.
- **AI OCR & Summarization**: Modular AI service architecture (Mock default, OpenAI, Gemini) for document OCR, structured medicine/allergy detection, and emergency risk summary generation.
- **QR Emergency Access & Doctor Flow**: Public, secure QR code scan route (`/emergency/access/:token`) providing read-only emergency medical summary for doctors and first responders. Token generation, regeneration, revocation, and PNG download support.
- **Family Management**: Invitation flow, pending invite accept/reject, fine-grained view/manage permissions per family member, and access revocation.
- **Reminders & Alerts**: Medicine, doctor appointment, and document renewal reminders with status toggling (active/completed) and overdue alerts.
- **Admin Dashboard**: System overview statistics, user account management (enable/disable users), search/filter by role, and paginated activity audit logs.
- **Security Hardening**: Helmet HTTP headers, CORS control, mongo-sanitize for query injection protection, rate limiting, and production-safe error middleware.

---

## Tech Stack

### Frontend
- React 18, Vite, React Router v6
- Tailwind CSS, Lucide Icons, React Toastify, QRCode

### Backend
- Node.js, Express v4, MongoDB, Mongoose
- JWT (Access & Refresh), BcryptJS, Multer, Helmet, Express-Rate-Limit, Express-Mongo-Sanitize

---

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will run at `http://localhost:5173` and backend at `http://localhost:5000`.

---

## Deployment

- **Frontend**: Can be built using `npm run build` inside `frontend/` and deployed to Vercel, Netlify, or static host.
- **Backend**: Can be deployed to Render, Railway, AWS, or Heroku with a MongoDB Atlas database.
