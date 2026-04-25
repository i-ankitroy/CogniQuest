// ── State ──────────────────────────────────────────────────────────
let board          = document.getElementById("board");
let errorCounter   = 0;
let firstCard      = null;
let lockBoard      = false;
let matchCount     = 0;
let currentDifficulty = 8;
let revealTime     = 3000;
let isMuted        = false;
let timerInterval  = null;
let secondsElapsed = 0;
let totalPairs     = 0;

// Image state — starts with defaults, swaps to custom on upload
let customImages  = [];
let useCustom     = false;

const defaultImages = [
    "assets/images/db_img/1 (1).JPG", "assets/images/db_img/1 (2).JPG",
    "assets/images/db_img/1 (3).JPG", "assets/images/db_img/1 (4).jpg",
    "assets/images/db_img/1 (5).jpg", "assets/images/db_img/1 (6).jpg",
    "assets/images/db_img/1 (7).jpg", "assets/images/db_img/1 (8).jpg",
    "assets/images/db_img/1 (9).jpg", "assets/images/db_img/1 (10).jpg",
    "assets/images/db_img/1 (11).jpg", "assets/images/db_img/1 (12).jpg",
    "assets/images/db_img/1 (13).jpg", "assets/images/db_img/1 (15).jpg",
    "assets/images/db_img/1 (16).jpg", "assets/images/db_img/1 (17).jpg"
];

// ── Timer ──────────────────────────────────────────────────────────
function startTimer() {
    stopTimer();
    secondsElapsed = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => { secondsElapsed++; updateTimerDisplay(); }, 1000);
}
function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}
function updateTimerDisplay() {
    const m = Math.floor(secondsElapsed / 60);
    const s = secondsElapsed % 60;
    document.getElementById("timer").textContent = `${m}:${s.toString().padStart(2, '0')}`;
}
function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Score ──────────────────────────────────────────────────────────
function calcScore(pairs, errors, secs) {
    return Math.max(0, pairs * 150 - errors * 20 + Math.max(0, 300 - secs * 2));
}

// ── Mute ──────────────────────────────────────────────────────────
function toggleMute() {
    isMuted = !isMuted;
    const btn = document.getElementById("mute-btn");
    btn.innerHTML = isMuted ? "🔇 &nbsp;Muted" : "🔊 &nbsp;Sound On";
    btn.classList.toggle("muted", isMuted);
}

// ── Sound ──────────────────────────────────────────────────────────
function playSound(id) {
    if (isMuted) return;
    const s = document.getElementById(id);
    if (s) { s.currentTime = 0; s.play().catch(() => {}); }
}

// ── Stats UI ──────────────────────────────────────────────────────
function updateStats(matches, total, errors) {
    document.getElementById("errors").textContent = errors;
    document.getElementById("matches").textContent = matches;
    document.getElementById("total-matches").textContent = total;
    document.getElementById("progress-text").textContent = `${matches} of ${total} pairs matched`;
    document.getElementById("score").textContent = matches > 0 ? calcScore(matches, errors, secondsElapsed) : "—";
    const pct = total === 0 ? 0 : (matches / total) * 100;
    document.getElementById("progress-fill").style.width = pct + "%";
}

// ── Confetti ──────────────────────────────────────────────────────
function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#a78bfa","#60a5fa","#f472b6","#fbbf24","#34d399","#fff"];
    const pieces = Array.from({ length: 160 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 3,
        d: Math.random() * 4 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 10,
        tiltAngle: 0,
        tiltDelta: (Math.random() * 0.07) + 0.05
    }));
    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
            ctx.stroke();
            p.tiltAngle += p.tiltDelta;
            p.y += (Math.cos(frame + p.d) + p.d) * 1.8;
            p.x += Math.sin(frame) * 1.2;
            p.tilt = Math.sin(p.tiltAngle) * 12;
            if (p.y > canvas.height) { p.x = Math.random() * canvas.width; p.y = -10; }
        });
        frame += 0.04;
        if (frame < 6) requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
}

// ── Image Upload ──────────────────────────────────────────────────
document.getElementById("image-upload").addEventListener("change", function (e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    Promise.all(files.map(file => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    }))).then(images => {
        customImages = images;
        useCustom = true;
        const btn = document.getElementById("upload-btn");
        btn.innerHTML      = `✓ &nbsp;Uploaded (${images.length})`;
        btn.style.color    = "#4ade80";
        btn.style.borderColor = "rgba(74,222,128,0.4)";
        btn.style.background  = "rgba(74,222,128,0.1)";
        startGame(currentDifficulty); // restart with custom images
    });
});

// ── Button Interactions ────────────────────────────────────────────
document.querySelectorAll('.seg-btn').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.seg-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        currentDifficulty = parseInt(b.getAttribute('data-val'));
        startGame(currentDifficulty);
    });
});

document.querySelectorAll('.time-btn').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        revealTime = parseInt(b.getAttribute('data-time'));
    });
});

// ── Game Setup ────────────────────────────────────────────────────
function startGame(numCards) {
    currentDifficulty = numCards;
    const requiredPairs = numCards / 2;
    totalPairs = requiredPairs;

    // Determine which image pool to use
    const pool = useCustom && customImages.length > 0 ? customImages : defaultImages;

    // Build image set — cycle if pool is smaller than required
    let activeImages = [];
    for (let i = 0; i < requiredPairs; i++) {
        activeImages.push(pool[i % pool.length]);
    }

    // Shuffle non-custom default pool
    if (!useCustom) {
        activeImages = [...defaultImages].sort(() => Math.random() - 0.5).slice(0, requiredPairs);
    }

    const cards = [...activeImages, ...activeImages].sort(() => Math.random() - 0.5);

    board.className = "board";
    if (numCards === 8) board.classList.add("grid-2x4");
    else if (numCards === 10) board.classList.add("grid-2x5");
    else if (numCards === 12) board.classList.add("grid-2x6");

    board.innerHTML = "";
    errorCounter = 0;
    matchCount   = 0;
    firstCard    = null;
    lockBoard    = true;
    stopTimer();
    updateStats(0, requiredPairs, 0);
    document.getElementById("score").textContent = "—";
    document.getElementById("game-end").classList.remove("show");

    cards.forEach((src, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'cq-card-wrap';
        wrap.style.animationDelay = `${i * 0.04}s`; // stagger on WRAPPER

        const card = document.createElement("div");
        card.classList.add("cq-card", "flipped");
        card.dataset.image = src;
        // NO animationDelay on card itself

        card.innerHTML = `
          <div class="cq-face cq-back">
            <div class="cq-back-pattern"></div>
            <div class="cq-back-icon">CQ</div>
          </div>
          <div class="cq-face cq-front">
            <img src="${src}" alt="card">
          </div>
        `;

        wrap.appendChild(card);
        board.appendChild(wrap);
        card.addEventListener("click", () => flipCard(card));
    });

    // Preview → then flip back and unlock
    setTimeout(() => {
        document.querySelectorAll(".cq-card").forEach(c => c.classList.remove("flipped"));
        lockBoard = false;
        startTimer();
    }, revealTime);
}

// ── Flip Logic ────────────────────────────────────────────────────
function flipCard(card) {
    if (lockBoard || card.classList.contains("matched") || card.classList.contains("flipped")) return;

    card.classList.add("flipped");
    playSound("swipe-sound");

    if (!firstCard) { firstCard = card; return; }

    if (card.dataset.image === firstCard.dataset.image) {
        card.classList.add("matched");
        firstCard.classList.add("matched");
        matchCount++;
        updateStats(matchCount, totalPairs, errorCounter);
        playSound("bell-sound");
        if (matchCount === totalPairs) {
            stopTimer();
            const finalScore = calcScore(totalPairs, errorCounter, secondsElapsed);
            setTimeout(() => playSound("win-sound"), 400);
            setTimeout(() => {
                document.getElementById("win-time").textContent   = formatTime(secondsElapsed);
                document.getElementById("win-errors").textContent = errorCounter;
                document.getElementById("win-score").textContent  = finalScore;
                document.getElementById("game-end").classList.add("show");
                launchConfetti();
            }, 800);
        }
        firstCard = null;
    } else {
        lockBoard = true;
        errorCounter++;
        updateStats(matchCount, totalPairs, errorCounter);
        playSound("buzzer-sound");
        card.classList.add("wrong");
        firstCard.classList.add("wrong");
        setTimeout(() => {
            card.classList.remove("flipped", "wrong");
            firstCard.classList.remove("flipped", "wrong");
            firstCard = null;
            lockBoard = false;
        }, 900);
    }
}

function resetGame() {
    startGame(currentDifficulty);
}

// ── Auto-start with default images ────────────────────────────────
window.onload = function () { startGame(8); };
