# CogniQuest ⚡🧠

CogniQuest is a premium, highly-interactive Memory Card Game built with modern web technologies. Featuring a stunning "glassmorphism" UI, dynamic 3D card animations, live scoring, and customizable game modes, it's designed to provide an epic and challenging brain-training experience.

## ✨ Features

* **Epic Gaming UI**: A dark, neon-infused glassmorphism design with floating 3D background cards, animated glowing orbs, and a responsive grid layout.
* **Three Difficulty Levels**: 
    * **2x4 Grid** (8 Cards) - Quick warmup
    * **2x5 Grid** (10 Cards) - Medium challenge
    * **2x6 Grid** (12 Cards) - Maximum brain stress
* **Custom Image Upload**: Play with default images or upload your own pictures to personalize the game deck!
* **Live Dashboard**: Real-time tracking of:
    * ⏱️ Time Elapsed
    * ❌ Errors / Mistakes made
    * 🃏 Pairs Matched
    * ⭐ Dynamic Score Calculation (based on time, pairs, and penalties)
* **Preview Time**: Configurable 2s, 3s, or 4s peek before the cards flip face-down.
* **Celebration Effects**: A highly responsive confetti canvas explosion upon winning, along with an epic win banner detailing your stats.
* **Audio Controls**: Integrated sound effects for flipping, matching, buzzing (errors), and winning, complete with a global mute toggle.

## 🚀 How to Play

1. **Open** `mem start.html` in your favorite modern browser.
2. Click **ENTER GAME** to reach the main dashboard.
3. Select your **Grid Size** and **Preview Time** from the left sidebar.
4. *(Optional)* Click **Upload Images** to use your own pictures for the memory cards.
5. The cards will reveal themselves for the selected preview time, then flip face-down.
6. Click cards to find matching pairs. Remember their positions!
7. Match all pairs as quickly as possible with the fewest errors to achieve a high score.

## 🛠️ Technologies Used
* **HTML5**: Semantic layout and responsive DOM architecture.
* **CSS3**: Advanced CSS Grid, Flexbox, 3D Transforms (`perspective`, `rotateY`), and Keyframe Animations.
* **Vanilla JavaScript (ES6)**: State management, DOM manipulation, scoring logic, and custom Canvas-based confetti engine (No external libraries required).

## 💡 Scoring Logic
The live scoring system is calculated dynamically:
* `Base Score = Total Pairs × 150`
* `Time Bonus = Max(0, 300 - (Seconds Elapsed × 2))`
* `Penalty = Errors × 20`
