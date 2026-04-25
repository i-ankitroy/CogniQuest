# CogniQuest ⚡🧠

A premium, highly-interactive **Memory Card Game** built with **React + Vite**. Featuring a dark glassmorphism UI, dynamic 3D card animations, live scoring, a confetti win celebration, and customizable game modes.

---

## 🚀 Getting Started

```bash
cd cogniquest-react
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## ✨ Features

- **Epic Landing Page** — Floating 3D card backs, neon glowing orbs, animated entrance
- **Three Difficulty Levels** — 2×4 (8 cards), 2×5 (10 cards), 2×6 (12 cards)
- **Custom Image Upload** — Play with default images or upload your own
- **Live Dashboard** (right sidebar):
  - ⏱️ Real-time timer
  - ❌ Error / mistake counter
  - 🃏 Pairs matched tracker
  - ⭐ Dynamic live score
  - 📊 Progress bar
- **Configurable Preview Time** — 2s / 3s / 4s peek before cards hide
- **🎊 Confetti Win Celebration** — Canvas-based particle burst on game completion
- **Win Stats Banner** — Time taken, errors, and final score displayed on win
- **🔊 Audio Controls** — Sound effects (flip, match, error, win) with mute toggle
- **Restart Button** — Instantly reshuffles and restarts the current difficulty

---

## 💡 Score Formula

```
Score = (Pairs × 150) - (Errors × 20) + Max(0, 300 - Time × 2)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | CSS Modules (scoped per component) |
| State | React hooks + Refs (no external state library) |
| Animations | CSS Keyframes + Web Animations API |
| Physics | *Matter.js — planned* |
| Generative FX | *P5.js — planned* |

---

## 📁 Project Structure

```
cogniquest-react/
├── public/
│   └── assets/
│       ├── audio/          bell, buzzer, swipe, win sounds
│       └── images/db_img/  default card image pool
└── src/
    ├── hooks/
    │   ├── useGameLogic.js  core flip/match/score logic
    │   ├── useTimer.js      interval timer
    │   └── useAudio.js      mute + sound playback
    ├── components/
    │   ├── Card.jsx / .module.css
    │   ├── Board.jsx / .module.css
    │   ├── LeftSidebar.jsx / .module.css
    │   ├── RightSidebar.jsx / .module.css
    │   └── ConfettiCanvas.jsx
    └── pages/
        ├── LandingPage.jsx / .module.css
        └── GamePage.jsx / .module.css
```
