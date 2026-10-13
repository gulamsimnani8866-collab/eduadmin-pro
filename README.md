# EduAdmin Pro
**Educational Platform — Complete Admin Dashboard**

React 18 · Firebase v10 · Tailwind CSS v3 · Vite 5

---

## Tech Stack

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Frontend    | React 18 (functional components + hooks)|
| Build Tool  | Vite 5                                  |
| State       | Zustand                                 |
| Routing     | React Router v6                         |
| Forms       | react-hook-form + zod                  |
| Database    | Firebase Firestore (real-time)          |
| Auth        | Firebase Authentication                 |
| Storage     | Firebase Cloud Storage                  |
| Push Notifs | Firebase Cloud Messaging (FCM)          |
| Charts      | Recharts                                |
| UI          | Tailwind CSS v3 + Radix UI primitives   |
| Icons       | lucide-react                            |
| Toast       | react-hot-toast                         |
| CSV         | papaparse                               |

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd eduadmin-pro
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password provider)
3. Enable **Firestore** (Start in production mode)
4. Enable **Cloud Storage**
5. Enable **Cloud Messaging** (for FCM push notifications)

### 3. Environment Variables

```bash
cp .env.example .env
```

Fill in your Firebase config values in `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

> Get your VAPID key from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates

### 4. Create First Admin

In Firestore, manually create a document at `/admins/{your-firebase-uid}`:

```json
{
  "name": "Super Admin",
  "email": "admin@yourdomain.com",
  "role": "superadmin",
  "createdAt": "<timestamp>"
}
```

### 5. Run Development Server

```bash
npm run dev
```

---

## Deployment

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init   # Select Hosting, Firestore, Storage
npm run build
firebase deploy
```

### Deploy only Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy only Storage Rules

```bash
firebase deploy --only storage
```

---

## Project Structure

```
eduadmin-pro/
├── public/
│   └── firebase-messaging-sw.js    # FCM service worker
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx       # Main layout wrapper
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   └── Topbar.jsx          # Top bar with search
│   │   └── ui/
│   │       ├── index.jsx           # All reusable UI components
│   │       └── Spinner.jsx
│   ├── hooks/
│   │   ├── useFirestore.js         # Generic + specific collection hooks
│   │   └── useDashboard.js         # Dashboard stats hook
│   ├── lib/
│   │   ├── firebase.js             # Firebase initialization
│   │   ├── storage.js              # Upload / download utilities
│   │   └── fcm.js                  # Push notification utilities
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── CoursesPage.jsx
│   │   ├── LiveClassesPage.jsx
│   │   ├── RecordedClassesPage.jsx
│   │   ├── StudyMaterialsPage.jsx
│   │   ├── SyllabusPage.jsx
│   │   ├── ImpQuestionsPage.jsx
│   │   ├── PrevYearPapersPage.jsx
│   │   ├── PremiumCoursesPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── FeedbackPage.jsx
│   │   ├── UsersPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   └── SettingsPage.jsx
│   ├── routes/
│   │   ├── AppRouter.jsx           # All routes defined here
│   │   └── ProtectedRoute.jsx      # Auth guard
│   ├── store/
│   │   └── authStore.js            # Zustand auth state
│   ├── App.jsx                     # Root + error boundary
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Tailwind + global styles
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # Composite indexes
├── storage.rules                   # Storage security rules
├── firebase.json                   # Firebase hosting config
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Firestore Collections

| Collection       | Description                    |
|-----------------|-------------------------------|
| /admins          | Admin user profiles            |
| /courses         | Course catalog                 |
| /liveClasses     | Scheduled live sessions        |
| /recordedClasses | Uploaded video library         |
| /studyMaterials  | PDFs, audio, images            |
| /syllabus        | Course syllabus (by courseId)  |
| /impQuestions    | Question bank with MCQ support |
| /prevYearPapers  | Exam paper archive             |
| /users           | Student accounts               |
| /purchases       | Payment transactions           |
| /notifications   | FCM notification history       |
| /feedback        | Student reviews & ratings      |

---

## Features

### Phase 1 — Foundation
- [x] Vite + React 18 setup
- [x] Firebase v10 modular SDK
- [x] Tailwind CSS with custom design tokens
- [x] Zustand auth store with Firebase onAuthStateChanged
- [x] Protected routes with lazy loading
- [x] Login page with react-hook-form + zod validation
- [x] Sidebar + Topbar layout shell

### Phase 2 — Core Modules
- [x] Dashboard with KPI cards + 4 Recharts charts
- [x] Courses CRUD (create, filter, edit, delete + storage cleanup)
- [x] Live Classes scheduling + cancel flow
- [x] Recorded Classes with upload progress
- [x] Study Materials (PDF/Audio/Image) with type filtering

### Phase 3 — Advanced Modules
- [x] Syllabus builder with chapter/topic accordion
- [x] IMP Questions with MCQ support + CSV bulk import
- [x] Previous Year Papers with dual PDF upload
- [x] Premium Courses with revenue tracking
- [x] Notifications composer + FCM
- [x] Feedback with approve/hide/reply flow
- [x] Users page with profile drawer

### Phase 4 — Infrastructure
- [x] Firestore Security Rules
- [x] Firebase Storage Rules
- [x] Composite indexes
- [x] FCM Service Worker
- [x] Error boundary in App.jsx
- [x] Toast notifications (react-hot-toast)
- [x] Skeleton loading states

---

## License

Private — All rights reserved.
