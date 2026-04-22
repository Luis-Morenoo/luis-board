# 📋 Luis's Board

A full-stack personal Kanban ticketing app built with **React** and **Firebase** — featuring real-time sync, Google authentication, public/private ticket visibility, mobile-responsive design, and automated CI/CD deployment via GitHub Actions.

🔗 **Live App:** [luis-morenoo.github.io/luis-board](https://luis-morenoo.github.io/luis-board/)  
👁️ **Read-Only View:** [luis-morenoo.github.io/luis-board/#/view](https://luis-morenoo.github.io/luis-board/#/view)

---

## ✨ Features

- **Kanban Board** — Four columns: Backlog, To Do, In Progress, Done
- **Real-Time Sync** — Changes instantly reflect across all devices via Firestore WebSockets
- **Google Login** — Only the authenticated owner can create, edit, or delete tickets
- **Public / Private Tickets** — Toggle visibility per ticket; guests only see public ones
- **Tag Filtering** — Filter by Job Search, Study, ASU, Finance, Personal, and more
- **Priority Levels** — High, Medium, Low with color-coded badges
- **Read-Only View** — Shareable link for recruiters — no login required
- **Mobile Responsive** — Stacked collapsible columns and bottom sheet modal on mobile
- **Automated Deployment** — GitHub Actions CI/CD deploys on every push to main

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Database | Firebase Firestore (real-time NoSQL) |
| Auth | Firebase Authentication (Google OAuth) |
| Analytics | Firebase Analytics |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages |
| Dev Environment | VS Code |
| Version Control | Git + GitHub |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore and Google Auth enabled

### Installation

```bash
git clone https://github.com/Luis-Morenoo/luis-board.git
cd luis-board
npm install
npm run dev
```

Open `http://localhost:5173/luis-board/` in your browser.

### Environment Variables

Create a `.env` file in the project root:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## 🔐 Security

Firestore security rules enforce server-side access control:

```
allow read: if true;          // Public — needed for read-only view
allow write: if request.auth != null
  && request.auth.token.email == "OWNER_EMAIL";  // Owner only
```

Firebase credentials are stored in `.env` locally and as **GitHub Actions secrets** for automated builds — never hardcoded in source code.

---

## ⚙️ CI/CD Pipeline

Every push to `main` triggers the GitHub Actions workflow:

1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Build with Firebase secrets injected as environment variables
5. Deploy `dist/` to `gh-pages` branch via `peaceiris/actions-gh-pages`

Workflow file: `.github/workflows/deploy.yml`

---

## 📁 Project Structure

```
luis-board/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions CI/CD
├── src/
│   ├── App.jsx              # Main app — routing, auth, board, modals
│   ├── firebase.js          # Firebase config (reads from .env)
│   └── main.jsx             # React entry point
├── index.html               # HTML shell
├── vite.config.js           # Vite config with GitHub Pages base path
├── firestore.rules          # Firestore security rules
├── .env                     # Firebase credentials (not committed)
├── .gitignore               # Excludes node_modules, dist, .env
└── package.json
```

---

## 🗺️ Roadmap

- [ ] Drag and drop between columns
- [ ] Due dates with overdue indicators
- [ ] Full-text ticket search
- [ ] Multiple boards
- [ ] Role-based access for collaborators
- [ ] React Native mobile app

---

## 👤 About

Built by **Luis Moreno** — Computer Engineering graduate, former SWE Associate at Wells Fargo, currently pursuing an **MS in Computer Science (Cybersecurity concentration)** at Arizona State University.

Actively seeking roles in Junior SWE, IT Infrastructure, Data Center Operations, and Cybersecurity, entry SRE, junior DevOps.

[![GitHub](https://img.shields.io/badge/GitHub-Luis--Morenoo-181717?style=flat&logo=github)](https://github.com/Luis-Morenoo)
[![Email](https://img.shields.io/badge/Email-luismorenosofteng%40gmail.com-blue?style=flat&logo=gmail)](mailto:luismorenosofteng@gmail.com)
[![Live App](https://img.shields.io/badge/Live%20App-luis--board-3B82F6?style=flat&logo=github)](https://luis-morenoo.github.io/luis-board/)