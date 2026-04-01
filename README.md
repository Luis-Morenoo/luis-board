# 📋 Luis's Board

A full-stack personal Kanban ticketing app built with **React** and **Firebase** — featuring real-time sync, Google authentication, and a public read-only view for sharing progress with recruiters.

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

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Database | Firebase Firestore (real-time NoSQL) |
| Auth | Firebase Authentication (Google OAuth) |
| Analytics | Firebase Analytics |
| Hosting | GitHub Pages |
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

### Environment
Firebase config is set in `src/firebase.js`. Update with your own Firebase project credentials if forking.

---

## 🔐 Security

Firestore security rules enforce server-side access control:

```
allow read: if true;          // Public — needed for read-only view
allow write: if request.auth != null
  && request.auth.token.email == "OWNER_EMAIL";  // Owner only
```

The `#/view` route skips authentication entirely and shows only tickets marked **Public**.

---

## 📦 Deployment

This project deploys to GitHub Pages using a manual `git subtree` approach (more reliable on Windows than the `gh-pages` package):

```bash
npm run build
git add dist/ -f
git commit -m "deploy"
git subtree push --prefix dist origin gh-pages
```

The `main` branch holds source code. The `gh-pages` branch holds the compiled build.

---

## 📁 Project Structure

```
luis-board/
├── src/
│   ├── App.jsx          # Main app — routing, auth, board, modals
│   ├── firebase.js      # Firebase config and exports
│   └── main.jsx         # React entry point
├── index.html           # HTML shell
├── vite.config.js       # Vite config with GitHub Pages base path
├── firestore.rules      # Firestore security rules
└── package.json
```

---

## 🗺️ Roadmap

- [ ] Drag and drop between columns
- [ ] Due dates with overdue indicators
- [ ] Full-text ticket search
- [ ] Multiple boards
- [ ] Mobile app (React Native)

---

## 👤 About

Built by **Luis Moreno** — Computer Engineering graduate, former SWE Associate at Wells Fargo, currently pursuing an **MS in Computer Science (Cybersecurity concentration)** at Arizona State University.

Actively seeking roles in IT Infrastructure, Data Center Operations, and Cybersecurity (GRC / SOC).

[![GitHub](https://img.shields.io/badge/GitHub-Luis--Morenoo-181717?style=flat&logo=github)](https://github.com/Luis-Morenoo)
[![Email](https://img.shields.io/badge/Email-luismorenosofteng%40gmail.com-blue?style=flat&logo=gmail)](mailto:luismorenosofteng@gmail.com)