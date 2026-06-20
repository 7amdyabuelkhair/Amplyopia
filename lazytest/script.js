/* ======================== GAMES ARRAY ======================= */
const levels = [
    {
        name: "Level 1",
        games: [
            { name: "Different Color", play: differentColorGame },
            { name: "Butterflies", play: butterfliesGame },
            { name: "Color Word Match", play: colorWordMatchGame }
        ]
    },
    {
        name: "Level 2",
        games: [
            { name: "Memory Positioning", play: memoryPositioningGame },
            { name: "Slide Puzzle", play: slidePuzzleGame },
            { name: "Which is Brighter?", play: whichIsBrighterGame }
        ]
    },
    {
        name: "Level 3",
        games: [
            { name: "Ball on Path", play: ballOnPathGame },
            { name: "Number Hunt", play: numberHuntGame },
            { name: "Letter Sequence", play: letterSequenceGame }
        ]
    },
    {
        name: "Level 4",
        games: [
            { name: "I SPY", play: iSpyGame },
            { name: "Find Identical Pair", play: findIdenticalPairGame },
            { name: "Connect Letters", play: connectLettersGame }
        ]
    },
    {
        name: "Lazy Eye Training",
        games: [
            { name: "Spot the Difference", play: spotTheDifferenceGame },
            { name: "Maze Game", play: mazeGame },
            { name: "Snake Game", play: snakeGame }
        ]
    },
    {
        name: "Level 6 - Red/Blue Glasses",
        games: [
            { name: "Front & Back", play: redBlueFrontBackGame },
            { name: "Motor Fusion", play: redBlueMotorFusionGame },
            { name: "Flappy Bird", play: flappyBirdLevel6Game }
        ]
    }
];

let currentLevel = 0;
let currentGame = 0;
let levelScores = levels.map(() => []);
let completedGames = levels.map(() => []);

try {
    const savedLevel = Number(sessionStorage.getItem('amplyopia_lazy_current_level'));
    if (savedLevel >= 0 && savedLevel < levels.length) currentLevel = savedLevel;
} catch (_) {}

/* ======================== ELEMENTS ========================== */
const mainMenu = document.getElementById('main-menu');
const videosBtn = document.getElementById('videos-btn');
const videoSection = document.getElementById('video-section');
const backFromVideoBtn = document.getElementById('back-from-video');
const levelGames = document.getElementById('level-games');
const gamesList = document.getElementById('games-list');
const gameArea = document.getElementById('game-area');
const gameResult = document.getElementById('game-result');
const resultMsg = document.getElementById('result-msg');
const scoreMsg = document.getElementById('score-msg');
const giftScreen = document.getElementById('gift-screen');
const giftMsg = document.getElementById('gift-msg');
const continueBtn = document.getElementById('continue-btn');
const finalScreen = document.getElementById('final-screen');
const finalScore = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again');
const returnMainBtn = document.getElementById('return-main');
const levelTitle = document.getElementById('level-title');
const backMainBtn = document.getElementById('back-main');
const backToGamesBtn = document.getElementById('back-to-games');
const level1Btn = document.getElementById('level1-btn');
const level2Btn = document.getElementById('level2-btn');
const level3Btn = document.getElementById('level3-btn');
const level4Btn = document.getElementById('level4-btn');
const lazyEyeBtn = document.getElementById('lazy-eye-btn');
const level6Btn = document.getElementById('level6-btn');

function show(el) { if (el) el.classList.remove('hidden'); }
function hide(...els) { els.forEach(e => e.classList.add('hidden')); }

/* =========== GLASS MODALS =========== */
const rbGlassesModal = document.getElementById('rb-glasses-modal');
const rbGlassesConfirm = document.getElementById('rb-glasses-confirm');

function showGlassModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => modal.classList.add('is-open'));
    });
}

function hideGlassModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    setTimeout(() => modal.classList.add('hidden'), 380);
}

function showRbGlassesModal(onConfirm) {
    if (!rbGlassesModal || !rbGlassesConfirm) {
        if (typeof onConfirm === 'function') onConfirm();
        return;
    }

    const handleConfirm = () => {
        rbGlassesModal.removeEventListener('click', handleBackdrop);
        document.removeEventListener('keydown', handleEscape);
        rbGlassesConfirm.onclick = null;
        hideGlassModal(rbGlassesModal);
        if (typeof onConfirm === 'function') onConfirm();
    };

    const handleBackdrop = (e) => {
        if (e.target === rbGlassesModal) handleConfirm();
    };

    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            rbGlassesModal.removeEventListener('click', handleBackdrop);
            document.removeEventListener('keydown', handleEscape);
            rbGlassesConfirm.onclick = null;
            hideGlassModal(rbGlassesModal);
            hide(levelGames);
            show(mainMenu);
        }
    };

    rbGlassesConfirm.onclick = handleConfirm;
    rbGlassesModal.addEventListener('click', handleBackdrop);
    document.addEventListener('keydown', handleEscape);
    showGlassModal(rbGlassesModal);
    rbGlassesConfirm.focus();
}

function proceedOpenLevel(lvl) {
    currentLevel = lvl;
    try { sessionStorage.setItem('amplyopia_lazy_current_level', String(lvl)); } catch (_) {}
    updateGamesList();
    levelTitle.textContent = levels[lvl].name;
    show(levelGames);
    hide(mainMenu, gameArea, gameResult, giftScreen, finalScreen);
    window.LevelReminder?.onLevelStarted?.(lvl);
}

/* =========== MAIN MENU & LEVEL LOGIC =========== */
level1Btn.onclick = () => openLevel(0);
level2Btn.onclick = () => openLevel(1);
level3Btn.onclick = () => openLevel(2);
if (level4Btn) level4Btn.onclick = () => openLevel(3);
if (lazyEyeBtn) lazyEyeBtn.onclick = () => openLevel(4);
if (level6Btn) level6Btn.onclick = () => openLevel(5);

// Allow deep-linking directly to a level (e.g. lazytest/index.html?level=6)
try {
    const q = new URLSearchParams(window.location.search);
    const lvlNum = Number(q.get('level'));
    if (lvlNum >= 1 && lvlNum <= levels.length) {
        setTimeout(() => openLevel(lvlNum - 1), 0);
    }
} catch (_) {}

function openLevel(lvl, skipGlassesCheck) {
    if (lvl === 5 && !skipGlassesCheck) {
        showRbGlassesModal(() => openLevel(lvl, true));
        return;
    }
    proceedOpenLevel(lvl);
}
backMainBtn.onclick = () => {
    hide(levelGames);
    show(mainMenu);
}

/* =========== UPDATE GAMES LIST =========== */
function updateGamesList() {
    gamesList.innerHTML = '';
    levels[currentLevel].games.forEach((game, i) => {
        const card = document.createElement('div');
        card.className = 'game-card' + (completedGames[currentLevel][i] ? ' completed' : '');
        card.textContent = game.name;
        card.onclick = () => startGame(i);
        gamesList.appendChild(card);
    });
}

/* =========== START GAME =========== */
function startGame(idx) {
    currentGame = idx;
    levels[currentLevel].games[idx].play(() => {
        // callback after game finished
    });
}

/* =========== SHOW RESULT AFTER GAME =========== */
function showGameResult(score, encouragement, callback) {
    hide(gameArea);
    show(gameResult);
    resultMsg.textContent = encouragement;
    scoreMsg.textContent = `You scored: ${score}`;
    levelScores[currentLevel][currentGame] = score;
    completedGames[currentLevel][currentGame] = true;

    // Persist score event (local + Supabase if signed in)
    try {
        const lvlName = levels[currentLevel]?.name || `Level ${currentLevel + 1}`;
        const gameName = levels[currentLevel]?.games?.[currentGame]?.name || `Game ${currentGame + 1}`;
        window.Score?.addPoints?.({
            game_id: `lazytest:l${currentLevel + 1}:${gameName}`.toLowerCase().replace(/\s+/g, '-'),
            points: score,
            meta: { level: currentLevel + 1, levelName: lvlName, gameIndex: currentGame + 1, gameName }
        });
    } catch (_) {}

    backToGamesBtn.onclick = () => {
        hide(gameResult);
        updateGamesList();
        show(levelGames);

        if (completedGames[currentLevel].filter(Boolean).length === levels[currentLevel].games.length) {
            setTimeout(showGiftScreen, 700);
        }
    }
}

function flappyBirdLevel6Game(callback) {
    gameArea.innerHTML = `
        <h2>Flappy Bird</h2>
        <p style="margin-top:-4px;">Press <b>Space</b> or <b>Arrow Up</b> to jump. Survive 1 minute to get <b>100 points</b>.</p>
        <div id="flappy-timer" style="font-size:1.1rem;font-weight:700;margin:6px 0 8px;">Time left: 60s</div>
        <div style="display:flex;justify-content:center;margin:10px 0 14px;">
            <iframe
                id="flappy-frame"
                src="../flappy-bird-master/index.html"
                title="Flappy Bird"
                tabindex="0"
                style="width:370px;height:650px;border:2px solid #ddd;border-radius:12px;background:#000;"
            ></iframe>
        </div>
        <button id="flappy-start-btn" class="small-btn">Start Flappy Bird</button>
        <button id="flappy-finish-btn" class="small-btn">Finish Flappy Bird</button>
    `;

    hide(levelGames, gameResult, giftScreen, finalScreen);
    show(gameArea);

    const startBtn = document.getElementById('flappy-start-btn');
    const finishBtn = document.getElementById('flappy-finish-btn');
    const flappyFrame = document.getElementById('flappy-frame');
    const timerEl = document.getElementById('flappy-timer');
    const timerDurationSec = 60;
    let timeLeft = timerDurationSec;
    let startTimeMs = 0;
    let timerFrameId = null;
    let sessionFinished = false;

    const getElapsedSeconds = () => {
        if (!startTimeMs) return 0;
        return Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000));
    };

    const syncTimer = () => {
        const elapsed = getElapsedSeconds();
        timeLeft = Math.max(0, timerDurationSec - elapsed);
        if (timerEl) timerEl.textContent = `Time left: ${timeLeft}s`;
        if (elapsed >= timerDurationSec && !sessionFinished) {
            sessionFinished = true;
            if (timerFrameId) cancelAnimationFrame(timerFrameId);
            timerFrameId = null;
            showGameResult(100, 'Amazing! You completed 1 minute and earned 100 points!', callback);
            return true;
        }
        return false;
    };

    const runTimer = () => {
        if (sessionFinished || !startTimeMs) return;
        const finished = syncTimer();
        if (!finished) {
            timerFrameId = requestAnimationFrame(runTimer);
        }
    };

    const activateStart = () => {
        if (!startBtn || startBtn.disabled || sessionFinished) return;
        focusFlappyFrame();
        try { flappyFrame?.contentWindow?.startFlappyBird?.(); } catch (_) {}
        startBtn.disabled = true;
        startBtn.textContent = 'Started';
        if (!timerFrameId) {
            startTimeMs = Date.now();
            syncTimer();
            timerFrameId = requestAnimationFrame(runTimer);
        }
    };

    const onStartKey = (e) => {
        if (sessionFinished) return;
        if (e.code === 'Space' || e.code === 'ArrowUp') activateStart();
    };

    const onFlappyMessage = (e) => {
        if (e?.data?.type === 'flappy:start') activateStart();
    };

    window.addEventListener('keydown', onStartKey);
    window.addEventListener('message', onFlappyMessage);

    // Ensure the iframe receives keyboard events immediately.
    const focusFlappyFrame = () => {
        try { flappyFrame?.focus(); } catch (_) {}
        try { flappyFrame?.contentWindow?.focus?.(); } catch (_) {}
    };
    if (flappyFrame) {
        flappyFrame.onload = () => setTimeout(focusFlappyFrame, 50);
        flappyFrame.addEventListener('click', focusFlappyFrame);
        flappyFrame.addEventListener('mouseenter', focusFlappyFrame);
    }
    setTimeout(focusFlappyFrame, 50);

    if (startBtn) {
        startBtn.onclick = () => activateStart();
    }

    finishBtn.onclick = () => {
        if (sessionFinished) return;
        sessionFinished = true;
        window.removeEventListener('keydown', onStartKey);
        window.removeEventListener('message', onFlappyMessage);
        if (timerFrameId) cancelAnimationFrame(timerFrameId);
        timerFrameId = null;
        let score = 0;
        let message = 'Great effort!';
        try {
            const frameWin = flappyFrame?.contentWindow;
            const reportScore = frameWin?.getFlappyBirdReportScore?.();
            const rawScore = Number.isFinite(reportScore) ? reportScore : frameWin?.getFlappyBirdScore?.();
            score = Number.isFinite(rawScore) ? Math.max(0, Math.round(rawScore)) : 0;
            const started = !!frameWin?.hasFlappyBirdStarted?.();
            if (!started) {
                message = 'Please press Start Flappy Bird first.';
            } else {
                // Convert survival time to points so real play is reflected in report.
                const elapsedSeconds = getElapsedSeconds();
                const timeBasedScore = Math.min(100, Math.ceil((elapsedSeconds / timerDurationSec) * 100));
                score = Math.max(score, timeBasedScore);
                if (score >= 100) {
                    score = 100;
                    message = 'Amazing! You completed 1 minute and earned 100 points!';
                }
            }
        } catch (_) {
            score = 0;
        }
        showGameResult(score, message, callback);
    };
}

/* =========== GIFT SCREEN & FINAL =========== */
function showGiftScreen() {
    hide(levelGames, gameResult, gameArea);
    show(giftScreen);
    let total = levelScores[currentLevel].reduce((a,b)=>a+b,0);

        giftMsg.innerHTML = `
            <div style="width:180px; margin:0 auto 1rem auto;">
                <img src="Animation - 1752044468269.gif" style="width:100%;" alt="Gift Animation">
            </div>
            <b>Your total score: ${total}</b><br/>Enjoy your reward! 🎁<br/>
        `;

    playGiftSound();

    continueBtn.onclick = () => {
        hide(giftScreen);
        if(currentLevel === 0){
            openLevel(1);
        } else if(currentLevel === 1){
            level3Btn.disabled = false;
            openLevel(2);
        } else if(currentLevel === 2){
            if (level4Btn) level4Btn.disabled = false;
            openLevel(3);
        } else if (currentLevel === 3) {
            openLevel(4);
        } else if (currentLevel === 4) {
            openLevel(5);
        } else {
            show(finalScreen);
            finalScore.innerHTML = `<b>Total Score: ${levelScores.flat().reduce((a,b)=>a+b,0)}</b>`;
        }
    }
}

function playGiftSound() {
    let audio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa5c47.mp3');
    audio.play();
}
playAgainBtn.onclick = () => {
    currentLevel = 0;
    currentGame = 0;
    levelScores = levels.map(() => []);
    completedGames = levels.map(() => []);
    level2Btn.disabled = false;
    level3Btn.disabled = true;
    if (level4Btn) level4Btn.disabled = true;
    window.LevelReminder?.clear?.();
    try { sessionStorage.removeItem('amplyopia_lazy_current_level'); } catch (_) {}
    hide(finalScreen, gameArea, gameResult, giftScreen, levelGames);
    show(mainMenu);
}
returnMainBtn.onclick = () => {
    window.LevelReminder?.clear?.();
    try { sessionStorage.removeItem('amplyopia_lazy_current_level'); } catch (_) {}
    hide(finalScreen, gameArea, gameResult, giftScreen, levelGames);
    show(mainMenu);
}

/* ================== LEVEL 6 (RED/BLUE) ================== */
const RB_EX1_IMAGES = [
    "front1.png",
    "front2.png",
    "behind3.png",
    "behind4.png",
    "behind5.png",
    "front6.png",
    "behind7.png",
    "front8.png",
    "front9.png",
    "front10.png"
];

const RB_EX2_IMAGES = [
    // Add your motor-fusion images/GIFs in red-blue/ex-2 and list them here, e.g.:
     "ezgif.com-video-to-gif-converter.gif",
    "ezgif.com-video-to-gif-converter (1).gif",
    "ezgif.com-video-to-gif-converter (2).gif"
];

function rbExpectedAnswer(filename) {
    const f = String(filename || '').toLowerCase();
    if (f.includes('front')) return 'front';
    if (f.includes('back') || f.includes('behind')) return 'back';
    return '';
}

function redBlueFrontBackGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let idx = 0;
    let score = 0;
    let answered = new Set();

    gameArea.innerHTML = `
      <div class="game-box" style="max-width:820px;margin:0 auto;background:#fff;border-radius:18px;padding:18px;box-shadow:0 10px 26px rgba(248,117,185,0.18);border:2px solid rgba(248,117,185,0.25);">
        <h2 style="margin:0 0 8px 0;color:#f875b9;">Red/Blue - Front &amp; Back</h2>
        <div style="color:#666;margin-bottom:10px;">Wear your red/blue glasses. Decide if the object is in the <b>front</b> or <b>back</b>.</div>
        <div style="width:100%;min-height:280px;border:2px dashed rgba(248,117,185,0.45);border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;">
          <img id="rb-ex1-img" alt="Front/Back exercise" style="max-width:100%;max-height:60vh;object-fit:contain;">
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:14px 0;">
          <button id="rb-ex1-prev" class="small-btn" type="button">Prev</button>
          <button id="rb-ex1-front" class="small-btn" type="button" style="background:#f875b9;color:#fff;border:none;">Front</button>
          <button id="rb-ex1-back" class="small-btn" type="button" style="background:#f875b9;color:#fff;border:none;">Back</button>
          <button id="rb-ex1-next" class="small-btn" type="button">Next</button>
          <button id="rb-ex1-finish" class="small-btn" type="button" style="background:#2ecc71;color:#fff;border:none;">Finish</button>
        </div>
        <div id="rb-ex1-status" style="text-align:center;color:#666;min-height:22px;"></div>
        <div style="text-align:center;color:#396485;font-weight:700;margin-top:6px;">Score: <span id="rb-ex1-score">0</span></div>
      </div>
    `;

    const img = document.getElementById('rb-ex1-img');
    const status = document.getElementById('rb-ex1-status');
    const scoreEl = document.getElementById('rb-ex1-score');

    function src(name) { return `../red-blue/ex-1/${name}`; }
    function showImage() {
        const name = RB_EX1_IMAGES[idx];
        img.src = src(name);
        status.textContent = `Image ${idx + 1} / ${RB_EX1_IMAGES.length}`;
    }

    function answer(choice) {
        const name = RB_EX1_IMAGES[idx];
        const expect = rbExpectedAnswer(name);
        if (!expect) {
            status.textContent = 'This image filename must include front/back (or behind).';
            return;
        }
        if (choice === expect) {
            if (!answered.has(name)) {
                answered.add(name);
                score += 1;
                scoreEl.textContent = String(score);
            }
            status.textContent = 'Correct!';
            idx = (idx + 1) % RB_EX1_IMAGES.length;
            showImage();
        } else {
            status.textContent = `Wrong. Correct answer is ${expect}.`;
        }
    }

    document.getElementById('rb-ex1-prev').onclick = () => { idx = (idx - 1 + RB_EX1_IMAGES.length) % RB_EX1_IMAGES.length; showImage(); };
    document.getElementById('rb-ex1-next').onclick = () => { idx = (idx + 1) % RB_EX1_IMAGES.length; showImage(); };
    document.getElementById('rb-ex1-front').onclick = () => answer('front');
    document.getElementById('rb-ex1-back').onclick = () => answer('back');
    document.getElementById('rb-ex1-finish').onclick = () => showGameResult(score, 'Great job!', startGameCallback);

    showImage();
}

function redBlueMotorFusionGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let idx = 0;
    let startedAt = null;
    let totalSeconds = 0;

    gameArea.innerHTML = `
      <div class="game-box" style="max-width:820px;margin:0 auto;background:#fff;border-radius:18px;padding:18px;box-shadow:0 10px 26px rgba(248,117,185,0.18);border:2px solid rgba(248,117,185,0.25);">
        <h2 style="margin:0 0 8px 0;color:#f875b9;">Red/Blue - Motor Fusion</h2>
        <div style="color:#666;margin-bottom:10px;">Try to fuse the image into one. Press <b>Start hold</b>, keep fusing, then press <b>Done</b>.</div>
        <div style="width:100%;min-height:280px;border:2px dashed rgba(248,117,185,0.45);border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;">
          <img id="rb-ex2-img" alt="Motor fusion exercise" style="max-width:100%;max-height:60vh;object-fit:contain;">
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:14px 0;">
          <button id="rb-ex2-prev" class="small-btn" type="button">Prev</button>
          <button id="rb-ex2-next" class="small-btn" type="button">Next</button>
          <button id="rb-ex2-start" class="small-btn" type="button" style="background:#f875b9;color:#fff;border:none;">Start hold</button>
          <button id="rb-ex2-done" class="small-btn" type="button" style="background:#2ecc71;color:#fff;border:none;">Done</button>
          <button id="rb-ex2-finish" class="small-btn" type="button" style="background:#2ecc71;color:#fff;border:none;">Finish</button>
        </div>
        <div id="rb-ex2-status" style="text-align:center;color:#666;min-height:22px;"></div>
        <div style="text-align:center;color:#396485;font-weight:700;margin-top:6px;">Points: <span id="rb-ex2-points">0</span></div>
      </div>
    `;

    const img = document.getElementById('rb-ex2-img');
    const status = document.getElementById('rb-ex2-status');
    const pointsEl = document.getElementById('rb-ex2-points');

    function src(name) { return `../red-blue/ex-2/${name}`; }
    function showImage() {
        if (!RB_EX2_IMAGES.length) {
            img.removeAttribute('src');
            status.textContent = 'No motor-fusion images yet. Add files to red-blue/ex-2 and list them in lazytest/script.js (RB_EX2_IMAGES).';
            return;
        }
        img.src = src(RB_EX2_IMAGES[idx]);
        status.textContent = `Image ${idx + 1} / ${RB_EX2_IMAGES.length}`;
    }

    document.getElementById('rb-ex2-prev').onclick = () => { if (!RB_EX2_IMAGES.length) return; idx = (idx - 1 + RB_EX2_IMAGES.length) % RB_EX2_IMAGES.length; showImage(); };
    document.getElementById('rb-ex2-next').onclick = () => { if (!RB_EX2_IMAGES.length) return; idx = (idx + 1) % RB_EX2_IMAGES.length; showImage(); };

    document.getElementById('rb-ex2-start').onclick = () => {
        startedAt = Date.now();
        status.textContent = 'Holding... press Done when you finish fusing.';
    };
    document.getElementById('rb-ex2-done').onclick = () => {
        if (!startedAt) {
            status.textContent = 'Press Start hold first.';
            return;
        }
        const secs = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
        startedAt = null;
        totalSeconds += secs;
        pointsEl.textContent = String(totalSeconds);
        status.textContent = `Nice! Added ${secs}s. Total hold time: ${totalSeconds}s.`;
    };

    document.getElementById('rb-ex2-finish').onclick = () => showGameResult(totalSeconds, 'Well done!', startGameCallback);

    showImage();
}

/* =========== SPLASH =========== */

/* =========== HOVER SOUND EFFECT =========== */
document.addEventListener('DOMContentLoaded', function () {
    try {
        const gender = localStorage.getItem('userGender');
        if (gender && window.Profile?.applyThemeFromGender) {
            window.Profile.applyThemeFromGender(gender);
        }
    } catch (_) {}
    const hoverAudio = document.getElementById('btn-hover-sound');
    function isInGameBox(el) {
        let p = el.parentElement;
        while (p) {
            if (
                p.id === 'game-area' ||
                p.id === 'bf-container' ||
                p.classList.contains('bf-exit-btn-custom')
            ) return true;
            p = p.parentElement;
        }
        if (el.id && el.id.startsWith('bf-')) return true;
        if (el.className && el.className.indexOf('bf-') !== -1) return true;
        return false;
    }
    document.body.addEventListener('mouseenter', function (e) {
        if (
            (e.target.tagName === 'BUTTON' || e.target.classList.contains('game-card'))
            && !isInGameBox(e.target)
        ) {
            if (hoverAudio) {
                hoverAudio.currentTime = 0;
                hoverAudio.play();
            }
        }
    }, true);
});

/* ================== GAMES ================== */

/* 1. Butterflies Game */
let butterflyGameState = null;
function butterfliesGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    gameArea.innerHTML = `
    <div id="bf-container" style="position:relative;">
      <div id="bf-header">
        <h1>Butterfly Hunt</h1>
        <div id="bf-score-board">
          <span id="bf-score">Stars: 0</span>
          <span id="bf-timer">Time: 02:00</span>
        </div>
      </div>
      <div id="bf-area"></div>
      <div id="bf-message"></div>
      <div id="bf-cert"></div>
      <button id="bf-play-again" style="display:none;">Play Again</button>
      <button id="bf-finish-btn2" class="small-btn" style="display:none;margin-left:1.5rem;">Back to Games</button>
      <button id="bf-exit-btn" class="small-btn bf-exit-btn-custom" style="position:absolute;bottom:20px;right:22px;">⟵ Back</button>
      <audio id="bf-sound-correct" src="correct-156911.mp3" preload="auto"></audio>
      <audio id="bf-sound-wrong" src="wrong-47985.mp3" preload="auto"></audio>
    </div>
    `;

    let score = 0, timer = 120, level = 1, butterflies = [];
    let timerInterval, spawnInterval;
    let finished = false;

    if (butterflyGameState && butterflyGameState.active) {
        ({ score, timer, level } = butterflyGameState);
    }

    const scoreElement = document.getElementById('bf-score');
    const timerElement = document.getElementById('bf-timer');
    const messageElement = document.getElementById('bf-message');
    const certElement = document.getElementById('bf-cert');
    const area = document.getElementById('bf-area');
    const playAgainBtn = document.getElementById('bf-play-again');
    const finishBtn2 = document.getElementById('bf-finish-btn2');
    const exitBtn = document.getElementById('bf-exit-btn');
    const sndCorrect = document.getElementById('bf-sound-correct');
    const sndWrong = document.getElementById('bf-sound-wrong');

  const butterflyImages = [
  'img/butterfly (1).png','img/butterfly (2).png','img/butterfly (3).png',
  'img/butterfly.png','img/butterfly (6).png','img/silk-butterfly.png',
  'img/butterfly (9).png','img/butterfly (10).png','img/butterfly (11).png',
  'img/butterfly (12).png','img/butterfly (13).png','img/butterfly (15).png',
  'img/butterfly (16).png','img/butterfly (17).png','img/butterfly (18).png',
  'img/butterfly (19).png','img/nature.png','img/butterfly (20).png',
  'img/retro.png','img/stripes-wings-light-butterfly-beautiful-design-from-top-view.png',
  'img/summer (1).png','img/butterfly (21).png','img/butterfly (23).png',
  'img/butterfly (24).png','img/butterfly (26).png','img/butterfly (27).png',
  'img/nature (1).png','img/butterfly (28).png','img/butterfly (29).png',
  'img/butterfly (30).png','img/fly.png','img/butterfly (31).png',
  'img/butterfly (32).png','img/hand.png'
];


    function start(isResume = false) {
      updateUI();
      messageElement.textContent = '';
      certElement.textContent = '';
      butterflies = [];
      finished = false;
      area.innerHTML = '';
      area.style.backgroundImage = "url('./Register - Login.gif')";
      area.style.backgroundSize = "cover";
      area.style.backgroundPosition = "center";
      area.style.borderRadius = "10px";
      area.style.overflow = "hidden";
      area.style.height = "300px";
      area.style.position = "relative";
      playAgainBtn.style.display = "none";
      finishBtn2.style.display = "none";
      exitBtn.style.display = ""; // Show back btn
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
      spawnButterflies();
      timerInterval = setInterval(() => {
          if (finished) return;
          timer--;
          updateUI();
          if (timer === 0 || score >= 20) {
            endGame();
          }
          saveState();
      }, 1000);
    }

    function updateUI() {
      scoreElement.textContent = `Stars: ${score}`;
      timerElement.textContent = `Time: ${formatTime(timer)}`;
    }

    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    function spawnButterflies() {
      clearButterflies();
      clearInterval(spawnInterval);

      let isHarder = score >= 10;
      let butterflySize = isHarder ? 32 : 50;
      let totalButterflies = isHarder ? (15 + Math.floor(score / 2)) : (7 + level);

      const differentButterflyIndex = Math.floor(Math.random() * totalButterflies);
      const availableImages = [...butterflyImages];
      const differentImage = availableImages.splice(Math.floor(Math.random() * availableImages.length), 1)[0];

      messageElement.innerHTML = `Find the butterfly with this image: <img src="${differentImage}" style="width:40px;vertical-align:middle;">`;

      let i = 0;
      butterflies = [];
      spawnInterval = setInterval(() => {
        if (finished) {
          clearInterval(spawnInterval);
          return;
        }
        if (i >= totalButterflies) {
          clearInterval(spawnInterval);
          return;
        }
        const isDifferent = i === differentButterflyIndex;
        const butterfly = document.createElement('div');
        butterfly.classList.add('butterfly');
        const img = document.createElement('img');
        img.src = isDifferent ? differentImage : availableImages.splice(Math.floor(Math.random() * availableImages.length), 1)[0];
        img.style.width = '100%'; img.style.height = '100%';
        butterfly.appendChild(img);
        butterfly.style.left = `${Math.random() * 85}%`;
        butterfly.style.top = `${Math.random() * 72}%`;
        butterfly.style.position = 'absolute';
        butterfly.style.width = butterflySize + "px";
        butterfly.style.height = butterflySize + "px";
        butterfly.style.animation = 'fly 2s ease-in-out infinite';

        butterfly.onclick = function() {
          if (finished) return;
          if (isDifferent) {
            sndCorrect.currentTime = 0; sndCorrect.play();
            score++;
            updateUI();
            messageElement.textContent = 'Great job! Next level...';
            messageElement.style.color = "#0d954f";
            clearInterval(spawnInterval);
            setTimeout(() => {
              if (score === 20) {
                endGame();
              } else {
                level++;
                spawnButterflies();
              }
            }, 800);
          } else {
            sndWrong.currentTime = 0; sndWrong.play();
            messageElement.textContent = 'Oops! Try again.';
            messageElement.style.color = "red";
            setTimeout(() => {
              messageElement.innerHTML = `Find the butterfly with this image: <img src="${differentImage}" style="width:40px;vertical-align:middle;">`;
              messageElement.style.color = "#ff66b2";
            }, 1100);
          }
        };
        area.appendChild(butterfly);
        butterflies.push(butterfly);
        i++;
      }, 220);
    }

    function clearButterflies() {
      butterflies.forEach(bf => bf.remove());
      butterflies = [];
      area.innerHTML = '';
      clearInterval(spawnInterval);
    }

    function endGame() {
      finished = true;
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
      clearButterflies();
      certElement.textContent = `You caught ${score} stars!`;
      playAgainBtn.style.display = '';
      finishBtn2.style.display = '';
      messageElement.textContent = "Game Over! Click Play Again or Back to Games";
      messageElement.style.color = "#0d954f";
      exitBtn.style.display = "none";
      butterflyGameState = null;
    }

    playAgainBtn.onclick = function() {
      butterflyGameState = null;
      score = 0; level = 1; timer = 120;
      start();
    }

    finishBtn2.onclick = function() {
      butterflyGameState = null;
      showGameResult(score, "Well done!", startGameCallback);
    }

    exitBtn.onclick = function() {
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
      let percent = Math.floor((score / 20) * 100);
      percent = percent > 100 ? 100 : percent;
      saveState(true);
      alert(`You finished ${percent}% of the game.`);
      hide(gameArea);
      updateGamesList();
      show(levelGames);
    };

    function saveState(active=true) {
      butterflyGameState = {
        score,
        timer,
        level,
        active
      };
    }

    // CSS حركة و زر الرجوع لو مش متعرف فوق
    if (!document.getElementById('bf-fly-style')) {
      const style = document.createElement('style');
      style.id = 'bf-fly-style';
      style.innerHTML = `
      @keyframes fly {
        0% { transform: translateY(0);}
        50% { transform: translateY(-10px);}
        100% { transform: translateY(0);}
      }
      .bf-exit-btn-custom {
        position: absolute !important;
        right: 22px !important;
        bottom: 20px !important;
        min-width: 90px;
        font-size: 1rem;
        background: #ffd3e7;
        color: #333;
        z-index: 15;
      }
      @media (max-width: 600px) {
        .bf-exit-btn-custom { right: 2px !important; bottom: 12px !important;}
      }
      `;
      document.head.appendChild(style);
    }

    if (butterflyGameState && butterflyGameState.active) {
      start(true);
    } else {
      start();
    }
}

/* 2. Different Color */
// ========== Different Color Game WITH SOUNDS ==========

let differentColorState = null;
function differentColorGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let score = 0, timer = 50, finished = false;
    if (differentColorState && !differentColorState.finished) {
        ({ score, timer, finished } = differentColorState);
    }
    let timerInterval;

    // --------- أصوات الإجابة ---------
    let sndRight = document.getElementById("snd-rightanswer");
    let sndWrong = document.getElementById("snd-wronganswer");
    if (!sndRight) {
        sndRight = document.createElement("audio");
        sndRight.id = "snd-rightanswer";
        sndRight.src = "rightanswer-95219.mp3";
        sndRight.preload = "auto";
        document.body.appendChild(sndRight);
    }
    if (!sndWrong) {
        sndWrong = document.createElement("audio");
        sndWrong.id = "snd-wronganswer";
        sndWrong.src = "wronganswer-37702.mp3";
        sndWrong.preload = "auto";
        document.body.appendChild(sndWrong);
    }
    // --------- END الأصوات ---------

    gameArea.innerHTML = `
    <div id="fdc-container" style="
        max-width: 520px;
        margin: 35px auto;
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 10px 30px #c9d7e866;
        padding: 30px 20px 26px 20px;
        border: 4px solid #f8b6d6;
        text-align:center;
        position:relative;
    ">
        <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;letter-spacing:1px;">Find the Different Color</h1>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Score: <span id="fdc-score">${score}</span></span>
            <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Time: <span id="fdc-timer">${timer}</span>s</span>
        </div>
        <div id="fdc-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:22px;margin-bottom:22px;min-height:310px;"></div>
        <div id="fdc-message" style="
            margin:16px 0 6px 0;
            min-height:27px;
            padding:8px 0;
            background:#fff5e0;
            border-radius:8px;
            color:#ae8d40;
            font-size:1.1rem;
            font-family:'Comic Sans MS';
        "></div>
        <button id="fdc-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
    </div>
    `;

    const grid = document.getElementById("fdc-grid");
    const scoreSpan = document.getElementById("fdc-score");
    const timerSpan = document.getElementById("fdc-timer");
    const msg = document.getElementById("fdc-message");

    function getRandomColor() {
        const base = Math.floor(Math.random() * 130 + 90);
        const sat = Math.floor(Math.random() * 30 + 40);
        return `hsl(${Math.floor(Math.random() * 360)},${sat}%,${base / 3}%)`;
    }
    function getSimilarColor(base, diff = 10) {
        let parts = base.match(/\d+/g).map(Number);
        parts[0] = (parts[0] + Math.floor(Math.random() * diff * 2 - diff) + 360) % 360;
        return `hsl(${parts[0]},${parts[1]}%,${parts[2]}%)`;
    }

    function renderGrid() {
        let gridSize = score < 5 ? 3 : score < 10 ? 4 : 5;
        grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        grid.innerHTML = "";

        const mainColor = getRandomColor();
        const diffColor = getSimilarColor(mainColor, 12 + Math.max(1, 16 - score));
        const diffIdx = Math.floor(Math.random() * gridSize * gridSize);

        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement("div");
            cell.style.background = (i === diffIdx) ? diffColor : mainColor;
            cell.style.borderRadius = "15px";
            cell.style.height = "105px";
            cell.style.width = "100%";
            cell.style.transition = "transform 0.16s, box-shadow 0.16s";
            cell.style.cursor = "pointer";
            cell.style.boxShadow = "0 2px 12px #bbbcf077";
            cell.onmouseenter = () => cell.style.transform = "scale(1.07)";
            cell.onmouseleave = () => cell.style.transform = "scale(1.0)";
            cell.onclick = function () {
                if (finished) return;
                if (i === diffIdx) {
                    sndRight.currentTime = 0; sndRight.play();
                    score++;
                    scoreSpan.textContent = score;
                    msg.textContent = "Correct!";
                    msg.style.color = "#12af33";
                } else {
                    sndWrong.currentTime = 0; sndWrong.play();
                    msg.textContent = "Try again!";
                    msg.style.color = "#e12727";
                }
                saveState();
                setTimeout(nextRound, 720);
            };
            grid.appendChild(cell);
        }
    }

    function nextRound() {
        if (finished) return;
        if (score >= 13) { showEnd(); return; }
        msg.textContent = "";
        msg.style.color = "#ae8d40";
        renderGrid();
    }

    function showEnd() {
        finished = true;
        clearInterval(timerInterval);
        differentColorState = null;
        msg.textContent = `Game Over! Your score: ${score}`;
        msg.style.color = "#098810";
        setTimeout(() => {
            showGameResult(score, "Well done!", startGameCallback);
        }, 1200);
    }

    document.getElementById("fdc-back-btn").onclick = function () {
        clearInterval(timerInterval);
        saveState();
        let percent = Math.floor((score / 13) * 100);
        alert(`You finished ${percent}% of the game.`);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };

    function saveState() {
        differentColorState = { score, timer, finished };
    }

    timerSpan.textContent = timer;
    nextRound();
    timerInterval = setInterval(() => {
        if (finished) return;
        timer--;
        timerSpan.textContent = timer;
        saveState();
        if (timer <= 0) showEnd();
    }, 1000);
}


// ========== Color Word Match Game WITH SOUNDS ==========

let colorWordMatchState = null;
function colorWordMatchGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let score = 0, timer = 60, finished = false, lastTarget = null;
    if (colorWordMatchState && !colorWordMatchState.finished) {
        ({ score, timer, finished, lastTarget } = colorWordMatchState);
    }
    let timerInterval;

    // --------- أصوات الإجابة ---------
    let sndRight = document.getElementById("snd-rightanswer");
    let sndWrong = document.getElementById("snd-wronganswer");
    if (!sndRight) {
        sndRight = document.createElement("audio");
        sndRight.id = "snd-rightanswer";
        sndRight.src = "rightanswer-95219.mp3";
        sndRight.preload = "auto";
        document.body.appendChild(sndRight);
    }
    if (!sndWrong) {
        sndWrong = document.createElement("audio");
        sndWrong.id = "snd-wronganswer";
        sndWrong.src = "wronganswer-37702.mp3";
        sndWrong.preload = "auto";
        document.body.appendChild(sndWrong);
    }
    // --------- END الأصوات ---------

    const colorWords = [
        { word: "orange", color: "#FFA500" },
        { word: "red",    color: "#FF0000" },
        { word: "green",  color: "#008000" },
        { word: "yellow", color: "#FFFF00" },
        { word: "blue",   color: "#0033FF" },
        { word: "purple", color: "#88187d" }
    ];

    gameArea.innerHTML = `
    <div id="cwm-container" style="
        max-width: 520px;
        margin: 35px auto;
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 10px 30px #c9d7e866;
        padding: 30px 20px 26px 20px;
        border: 4px solid #f8b6d6;
        text-align:center;
        position:relative;
    ">
        <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;letter-spacing:1px;">Match the Color Word</h1>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <span style="font-size:1.3rem;font-weight:bold;color:#396485;">Score: <span id="cwm-score">${score}</span></span>
            <span style="font-size:1.3rem;font-weight:bold;color:#396485;">Time: <span id="cwm-timer">${timer}</span>s</span>
        </div>
        <div id="cwm-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;margin-bottom:20px;"></div>
        <div id="cwm-card" style="
            margin:20px 0 10px 0;
            padding: 18px 0;
            background: #8c44a0;
            border-radius: 12px;
            font-size:1.2rem;
            font-weight:bold;
            color:#fff;
            letter-spacing:1px;
        ">
            Color Card: <span id="cwm-card-word"></span>
        </div>
        <div id="cwm-message" style="font-family:'Comic Sans MS';font-size:1.08rem;color:#672176;min-height:32px;">
            Choose the color matching: <span id="cwm-choose-word"></span>
        </div>
        <button id="cwm-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
    </div>
    `;

    const scoreSpan = document.getElementById("cwm-score");
    const timerSpan = document.getElementById("cwm-timer");
    const grid = document.getElementById("cwm-grid");
    const card = document.getElementById("cwm-card");
    const cardWordSpan = document.getElementById("cwm-card-word");
    const message = document.getElementById("cwm-message");
    const chooseWordSpan = document.getElementById("cwm-choose-word");

    let currentTarget;

    function shuffleArray(arr) {
        return arr.map(a => [a, Math.random()]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
    }

    function nextRound() {
        if (finished) return;
        if (score >= 12) { showEnd(); return; }
        if (lastTarget) {
            currentTarget = lastTarget;
            lastTarget = null;
        } else {
            currentTarget = colorWords[Math.floor(Math.random() * colorWords.length)];
        }
        card.style.background = currentTarget.color;
        cardWordSpan.textContent = currentTarget.word.charAt(0).toUpperCase() + currentTarget.word.slice(1);
        cardWordSpan.style.color = "#2d1226";
        chooseWordSpan.textContent = currentTarget.word.charAt(0).toUpperCase() + currentTarget.word.slice(1);

        let shuffled = shuffleArray(colorWords);
        grid.innerHTML = "";
        shuffled.forEach(item => {
            let btn = document.createElement("div");
            btn.style.background = item.color;
            btn.style.color = "#fff";
            btn.style.borderRadius = "15px";
            btn.style.height = "150px";
            btn.style.display = "flex";
            btn.style.alignItems = "center";
            btn.style.justifyContent = "center";
            btn.style.fontSize = "1.45rem";
            btn.style.fontWeight = "bold";
            btn.style.boxShadow = "0 2px 16px #b4b4b48c";
            btn.style.cursor = "pointer";
            btn.style.transition = "transform 0.19s, box-shadow 0.19s";
            btn.style.textTransform = "lowercase";
            btn.style.marginBottom = "0";
            btn.textContent = item.word;
            btn.onmouseenter = () => btn.style.transform = "scale(1.06)";
            btn.onmouseleave = () => btn.style.transform = "scale(1.00)";
            btn.onclick = function () {
                if (finished) return;
                if (item.word === currentTarget.word) {
                    sndRight.currentTime = 0; sndRight.play();
                    score++;
                    scoreSpan.textContent = score;
                    message.textContent = "Correct!";
                    message.style.color = "#12af33";
                    lastTarget = null;
                } else {
                    sndWrong.currentTime = 0; sndWrong.play();
                    message.textContent = "Try again!";
                    message.style.color = "#e12727";
                    lastTarget = currentTarget;
                }
                saveState();
                setTimeout(nextRound, 700);
            }
            grid.appendChild(btn);
        });
    }

    function showEnd() {
        finished = true;
        clearInterval(timerInterval);
        colorWordMatchState = null;
        setTimeout(() => {
            showGameResult(score, "Well done!", startGameCallback);
        }, 850);
    }

    document.getElementById("cwm-back-btn").onclick = function () {
        clearInterval(timerInterval);
        saveState();
        let percent = Math.floor((score / 12) * 100);
        alert(`You finished ${percent}% of the game.`);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };

    function saveState() {
        colorWordMatchState = { score, timer, finished, lastTarget };
    }

    timerSpan.textContent = timer;
    nextRound();
    timerInterval = setInterval(() => {
        if (finished) return;
        timer--;
        timerSpan.textContent = timer;
        saveState();
        if (timer <= 0) showEnd();
    }, 1000);
}
/* 4. Memory Positioning Game (NEW!) */
let memoryPositioningState = null;
function memoryPositioningGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    // أصوات الإجابة
    let sndRight = document.getElementById("snd-rightanswer");
    let sndWrong = document.getElementById("snd-wronganswer");
    if (!sndRight) {
        sndRight = document.createElement("audio");
        sndRight.id = "snd-rightanswer";
        sndRight.src = "rightanswer-95219.mp3";
        sndRight.preload = "auto";
        document.body.appendChild(sndRight);
    }
    if (!sndWrong) {
        sndWrong = document.createElement("audio");
        sndWrong.id = "snd-wronganswer";
        sndWrong.src = "wronganswer-37702.mp3";
        sndWrong.preload = "auto";
        document.body.appendChild(sndWrong);
    }

    let state = memoryPositioningState && !memoryPositioningState.finished
        ? { ...memoryPositioningState }
        : { round: 0, totalScore: 0, finished: false, timer: 0 };
    let { round, totalScore, finished } = state;
    let mainTimer = null;

    // الرموز والراوندات
    const allSymbols = ["⭐", "❤️", "⬛", "🍀", "🔵", "🐶", "🍎", "🎈", "🌟", "🌸", "🚗", "🍓", "🥕", "🍔", "🧩"];
    // لكل راوند (10 راوندات) زمن خاص
    const rounds = [
        { n: 2, grid: 3, time: 18 },
        { n: 3, grid: 3, time: 20 },
        { n: 4, grid: 3, time: 22 },
        { n: 5, grid: 4, time: 24 },
        { n: 6, grid: 4, time: 26 },
        { n: 7, grid: 4, time: 28 },
        { n: 8, grid: 5, time: 30 },
        { n: 9, grid: 5, time: 33 },
        { n:10, grid: 5, time: 35 },
        { n:11, grid: 5, time: 37 }
    ];

    // زرار الباك خارج البوكس دايمًا يمين
    renderOuter();

    function renderOuter(innerHTML = "") {
        gameArea.innerHTML = `
        <div style="display:flex;justify-content:center;align-items:center;min-height:86vh;position:relative;">
            <div id="memory-box-holder">
                ${innerHTML}
            </div>
        </div>
        <button id="mp-back-btn" class="small-btn"
            style="position:fixed;right:32px;top:50%;transform:translateY(-50%);
                   background:#e9f0ff;border-radius:18px;box-shadow:0 2px 8px #dbe3ffb1;
                   font-size:1.18rem;color:#222;padding:11px 36px;z-index:1990;">
            &#8592; Back
        </button>
        `;
        setTimeout(() => {
            document.getElementById("mp-back-btn").onclick = function () {
                clearInterval(mainTimer);
                memoryPositioningState = { round, totalScore, finished };
                hide(gameArea);
                updateGamesList();
                show(levelGames);
            };
        }, 30);
        setTimeout(() => nextRound(), 80);
    }

    function nextRound() {
        if (finished) return;
        if (round >= rounds.length) {
            finished = true;
            memoryPositioningState = null;
            let encouragements = ["Amazing memory!", "Super job!", "You're a star!", "Wow, so sharp!"];
            setTimeout(() => showGameResult(totalScore, encouragements[Math.floor(Math.random()*encouragements.length)], startGameCallback), 1100);
            return;
        }

        let { n, grid: gridSize, time } = rounds[round];
        let symbols = allSymbols.slice(0, n);
        let gridArr = Array(gridSize * gridSize).fill(null);

        let positions = [];
        let spots = [];
        while (spots.length < n) {
            let idx = Math.floor(Math.random() * gridArr.length);
            if (!spots.includes(idx)) spots.push(idx);
        }
        spots.forEach((idx, i) => {
            gridArr[idx] = symbols[i];
            positions[i] = idx;
        });

        // شاشة الحفظ
        let html = `
            <div id="mp-container" style="
                width: min(420px,88vw);
                margin:0 auto;
                background:#fff;
                border-radius:25px;
                box-shadow:0 2px 18px #e8e8f3b2;
                padding:32px 18px 22px 18px;
                position:relative;
                ">
                <h2 style="color:#f54baf;font-family:'Comic Sans MS';font-size:2rem;margin-bottom:7px;font-weight:bold;">Memory Positioning</h2>
                <div style="color:#3553a6;font-size:1.22rem;font-weight:bold;margin-bottom:15px;">Round ${round+1} of 10</div>
                <div class="mp-grid" style="display:grid;grid-template-columns:repeat(${gridSize}, 1fr);gap:15px;justify-items:center;">
        `;
        gridArr.forEach(symbol => {
            html += `<div class="mp-cell" style="font-size:2.25rem;display:flex;align-items:center;justify-content:center;width:63px;height:63px;border-radius:15px;background:#f7f3fa;box-shadow:0 0 0.5px #e8e8f3c2;">${symbol ? symbol : ""}</div>`;
        });
        html += `</div>
            <div style="margin-top:18px;color:#aa955c;font-size:1.06rem;text-align:center;">Memorize the positions!</div>
        </div>`;

        document.getElementById("memory-box-holder").innerHTML = html;

        setTimeout(() => {
            askUser(time, positions, symbols, gridSize);
        }, 1900 + round * 70);
    }

    function askUser(time, positions, symbols, gridSize) {
        let gridArr = Array(gridSize * gridSize).fill(null);

        let html = `
            <div id="mp-container" style="
                width: min(420px,88vw);
                margin:0 auto;
                background:#fff;
                border-radius:25px;
                box-shadow:0 2px 18px #e8e8f3b2;
                padding:32px 18px 22px 18px;
                position:relative;
                ">
                <h2 style="color:#f54baf;font-family:'Comic Sans MS';font-size:2rem;margin-bottom:7px;font-weight:bold;">Memory Positioning</h2>
                <div style="color:#3553a6;font-size:1.22rem;font-weight:bold;margin-bottom:7px;float:left;text-align:left;">Round ${round+1} of 10</div>
                <div id="mp-timer" style="color:#d058d8;font-size:1.12rem;font-weight:bold;margin-bottom:7px;float:right;text-align:right;">Time: ${time}s</div>
                <div style="clear:both"></div>
                <div class="mp-grid" id="mp-answers" style="display:grid;grid-template-columns:repeat(${gridSize}, 1fr);gap:15px;justify-items:center;margin-bottom:8px;">
        `;
        for (let i = 0; i < gridArr.length; i++) {
            html += `<div class="mp-cell mp-select" data-idx="${i}" style="width:63px;height:63px;background:#f7f3fa;display:flex;align-items:center;justify-content:center;font-size:2.1rem;border-radius:15px;box-shadow:0 0 0.5px #e8e8f3c2;cursor:pointer;"></div>`;
        }
        html += `</div>
                <div class="mp-symbols" style="margin-top:7px;text-align:center;">`;
        symbols.forEach((symbol, i) => {
            html += `<button class="mp-symbol-btn" data-symbol="${i}" style="margin:0 8px 0 8px;font-size:1.35rem;border-radius:9px;padding:7px 14px;background:#fbe3fa;border:none;cursor:pointer;border:2px solid #f8daf5;">${symbol}</button>`;
        });
        html += `
                </div>
                <div id="mp-help" style="margin:12px 0 0 0;color:#aa8d58;font-size:1.06rem;">Click a symbol, then click its place!</div>
                <button id="mp-finish" class="small-btn" style="margin-top:18px;display:none;">Finish</button>
            </div>`;

        document.getElementById("memory-box-holder").innerHTML = html;

        let selectedSymbol = null;
        let answers = Array(symbols.length).fill(null);
        let finishedThisRound = false;

        // Timer setup
        let timeLeft = time;
        let timerEl = document.getElementById("mp-timer");
        clearInterval(mainTimer);
        mainTimer = setInterval(() => {
            if (finishedThisRound) return;
            timeLeft--;
            timerEl.textContent = "Time: " + timeLeft + "s";
            if (timeLeft <= 0) {
                clearInterval(mainTimer);
                handleFinish(positions, answers, symbols, gridSize, false);
            }
        }, 1000);

        document.querySelectorAll('.mp-symbol-btn').forEach(btn => {
            btn.onclick = function () {
                selectedSymbol = parseInt(btn.dataset.symbol);
                document.querySelectorAll('.mp-symbol-btn').forEach(b => b.style.background = "#fbe3fa");
                btn.style.background = "#f6b0ed";
                document.getElementById("mp-help").textContent = `Now click where "${symbols[selectedSymbol]}" was.`;
            }
        });
        document.querySelectorAll('.mp-select').forEach(cell => {
            cell.onclick = function () {
                if (selectedSymbol === null || finishedThisRound) return;
                let idx = parseInt(cell.dataset.idx);
                if (answers.includes(idx)) return;
                cell.textContent = symbols[selectedSymbol];
                answers[selectedSymbol] = idx;
                selectedSymbol = null;
                document.querySelectorAll('.mp-symbol-btn').forEach(b => b.style.background = "#fbe3fa");
                if (answers.every(a => a !== null)) {
                    document.getElementById("mp-finish").style.display = '';
                    document.getElementById("mp-help").textContent = "All done! Click Finish.";
                }
            }
        });
        document.getElementById("mp-finish").onclick = function () {
            handleFinish(positions, answers, symbols, gridSize, true);
        };

        // ======== finish logic and show results ========
        function handleFinish(positions, answers, symbols, gridSize, isManualFinish) {
            if (finishedThisRound) return;
            finishedThisRound = true;
            clearInterval(mainTimer);
            let correct = 0, wrongIdxs = [];
            answers.forEach((ans, i) => {
                if (ans === positions[i]) {
                    correct++;
                    sndRight.currentTime = 0; sndRight.play();
                } else {
                    wrongIdxs.push(i);
                    sndWrong.currentTime = 0; sndWrong.play();
                }
            });
            let score = correct * 2;
            totalScore += score;

            let gridCells = document.querySelectorAll('.mp-select');
            // الأماكن الصح
            positions.forEach((pos, i) => {
                if (answers[i] !== pos) {
                    gridCells[pos].style.background = "#d6ffd4";
                    gridCells[pos].style.border = "2.5px solid #11bb4c";
                    gridCells[pos].innerHTML = `<span style="opacity:0.68;">${symbols[i]}</span>`;
                }
            });
            // الأماكن الغلط
            wrongIdxs.forEach(i => {
                if (answers[i] !== null) {
                    gridCells[answers[i]].style.background = "#ffd3d3";
                    gridCells[answers[i]].style.border = "2.5px solid #ff2727";
                }
            });
            // الصح اللي اختارها فعلاً
            answers.forEach((ans, i) => {
                if (ans === positions[i]) {
                    gridCells[ans].style.background = "#d7ffda";
                    gridCells[ans].style.border = "2.5px solid #28b957";
                }
            });

            document.getElementById("mp-help").innerHTML = `
                <span>Correct: ${correct} | Wrong: ${wrongIdxs.length}</span><br>
                <span style="color:#444;">
                    <b>Green</b> shows where each symbol should have gone.<br>
                    <b>Red</b> are your wrong answers.
                </span>
                <br>
                <b>Your score this round: ${score}</b>
            `;
            document.getElementById("mp-finish").disabled = true;

            setTimeout(() => {
                round++;
                saveState();
                renderOuter();
            }, 2200);
        }
    }

    function saveState() {
        memoryPositioningState = { round, totalScore, finished };
    }
}

// ================= SLIDE PUZZLE GAME =================

let slidePuzzleState = null;
function slidePuzzleGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    // Cartoon images - replace with your real images
    const images = [
        "img/cartoon1.png", 
        "img/cartoon2.jpg",
        "img/cartoon3.jpg",
        "img/cartoon4.jpg"
    ];
    // Get random image on reload
    const chosenImg = images[Math.floor(Math.random() * images.length)];
    const N = 3; // 3x3 grid
    let board, emptyPos, moves = 0, finished = false, timer = 90, timerInterval;

    // Reset state
    slidePuzzleState = null;

    // Build puzzle UI
    gameArea.innerHTML = `
        <div id="sp-container" style="
            max-width: 520px;
            margin: 35px auto;
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 10px 30px #c9d7e866;
            padding: 30px 20px 26px 20px;
            border: 4px solid #f8b6d6;
            text-align:center;
            position:relative;
        ">
            <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;">Slide Puzzle</h1>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Moves: <span id="sp-moves">0</span></span>
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Time: <span id="sp-timer">90</span>s</span>
            </div>
            <div id="sp-board" style="display:grid;grid-template-columns:repeat(${N}, 1fr);gap:8px;margin:20px auto;justify-content:center;width:320px;height:320px;"></div>
            <div id="sp-message" style="font-size:1.15rem;color:#ae8d40;margin-top:10px;min-height:28px;"></div>
            <button id="sp-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
        </div>
    `;

    // puzzle logic
    function createBoard() {
        let arr = [];
        for (let i = 0; i < N * N; i++) arr.push(i);
        do {
            arr = arr.sort(() => Math.random() - 0.5);
        } while (!isSolvable(arr));
        board = arr;
        emptyPos = board.indexOf(0);
    }
    function isSolvable(arr) {
        // for 3x3, check inversions
        let inv = 0;
        for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++)
            if (arr[i] && arr[j] && arr[i] > arr[j]) inv++;
        return inv % 2 === 0;
    }
    function renderBoard() {
        const brd = document.getElementById('sp-board');
        brd.innerHTML = "";
        board.forEach((n, idx) => {
            const row = Math.floor(idx / N), col = idx % N;
            const tile = document.createElement('div');
            tile.style.width = tile.style.height = (320 / N - 8) + 'px';
            tile.style.borderRadius = '14px';
            tile.style.background = n === 0 ? "#f8f7fb" : "#eee";
            tile.style.cursor = n === 0 ? 'default' : 'pointer';
            tile.style.position = "relative";
            tile.style.overflow = "hidden";
            tile.style.transition = "0.12s";
            tile.style.boxShadow = n === 0 ? "" : "0 2px 10px #cacaff30";
            if (n !== 0) {
                // puzzle image part
                tile.style.backgroundImage = `url('${chosenImg}')`;
                tile.style.backgroundSize = `${N * 100}% ${N * 100}%`;
                tile.style.backgroundPosition = `${(n - 1) % N * (100 / (N - 1))}% ${Math.floor((n - 1) / N) * (100 / (N - 1))}%`;
            }
            tile.onclick = () => moveTile(idx);
            brd.appendChild(tile);
        });
    }
    function moveTile(idx) {
        if (finished) return;
        const diff = Math.abs(emptyPos - idx);
        if ((diff === 1 && Math.floor(emptyPos / N) === Math.floor(idx / N)) || diff === N) {
            [board[emptyPos], board[idx]] = [board[idx], board[emptyPos]];
            emptyPos = idx;
            moves++;
            document.getElementById('sp-moves').textContent = moves;
            renderBoard();
            if (isSolved()) showEnd();
        }
    }
    function isSolved() {
        for (let i = 0; i < board.length - 1; i++) if (board[i] !== i + 1) return false;
        return board[N * N - 1] === 0;
    }
    function showEnd() {
        finished = true;
        clearInterval(timerInterval);
        document.getElementById('sp-message').textContent = `Puzzle solved! Moves: ${moves}`;
        setTimeout(() => showGameResult(15 - Math.min(moves, 15), "Well done!", startGameCallback), 1000);
    }
    document.getElementById('sp-back-btn').onclick = () => {
        clearInterval(timerInterval);
        hide(gameArea); updateGamesList(); show(levelGames);
    }
    function startGame() {
        moves = 0;
        createBoard();
        document.getElementById('sp-moves').textContent = moves;
        renderBoard();
    }
    startGame();
    timerInterval = setInterval(() => {
        if (finished) return;
        timer--;
        document.getElementById('sp-timer').textContent = timer;
        if (timer <= 0) showEnd();
    }, 1000);
}

// ================= WHICH IS BRIGHTER GAME =============

let whichBrighterState = null;
function whichIsBrighterGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let score = 0, timer = 45, finished = false, timerInterval;

    // الأصوات
    let sndRight = document.getElementById("snd-rightanswer");
    let sndWrong = document.getElementById("snd-wronganswer");
    if (!sndRight) {
        sndRight = document.createElement("audio");
        sndRight.id = "snd-rightanswer";
        sndRight.src = "rightanswer-95219.mp3";
        sndRight.preload = "auto";
        document.body.appendChild(sndRight);
    }
    if (!sndWrong) {
        sndWrong = document.createElement("audio");
        sndWrong.id = "snd-wronganswer";
        sndWrong.src = "wronganswer-37702.mp3";
        sndWrong.preload = "auto";
        document.body.appendChild(sndWrong);
    }

    gameArea.innerHTML = `
        <div id="wb-container" style="
            max-width: 520px;
            margin: 35px auto;
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 10px 30px #c9d7e866;
            padding: 30px 20px 26px 20px;
            border: 4px solid #f8b6d6;
            text-align:center;
            position:relative;
        ">
            <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;">Which is Brighter?</h1>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Score: <span id="wb-score">0</span></span>
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Time: <span id="wb-timer">45</span>s</span>
            </div>
            <div id="wb-circles" style="display:flex;justify-content:center;align-items:center;gap:54px;margin-bottom:24px;"></div>
            <div id="wb-message" style="font-size:1.18rem;color:#ae8d40;min-height:38px;"></div>
            <button id="wb-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
        </div>
    `;

    function randomColorPair() {
        let h = Math.floor(Math.random() * 360);
        let s = 65 + Math.random() * 25;
        let l1 = 75 + Math.random() * 15; // bright
        let l2 = l1 - (16 + Math.random() * 18); // darker
        return [
            `hsl(${h},${s}%,${l1}%)`,
            `hsl(${h},${s}%,${l2}%)`
        ];
    }
    function renderRound() {
        if (finished) return;
        const [bright, dark] = randomColorPair();
        const order = Math.random() < 0.5 ? [bright, dark] : [dark, bright];
        const correctIdx = order[0] === bright ? 0 : 1;

        const ctn = document.getElementById('wb-circles');
        ctn.innerHTML = "";
        for (let i = 0; i < 2; i++) {
            const circ = document.createElement("div");
            circ.style.width = circ.style.height = "125px";
            circ.style.borderRadius = "50%";
            circ.style.background = order[i];
            circ.style.boxShadow = "0 2px 20px #ececec";
            circ.style.cursor = "pointer";
            circ.onclick = () => {
                if (finished) return;
                if (i === correctIdx) {
                    sndRight.currentTime = 0; sndRight.play();
                    score++;
                    document.getElementById('wb-message').textContent = "Correct!";
                    document.getElementById('wb-message').style.color = "#12af33";
                } else {
                    sndWrong.currentTime = 0; sndWrong.play();
                    document.getElementById('wb-message').textContent = "Try again!";
                    document.getElementById('wb-message').style.color = "#e12727";
                }
                document.getElementById('wb-score').textContent = score;
                setTimeout(renderRound, 650);
            }
            ctn.appendChild(circ);
        }
    }
    document.getElementById('wb-back-btn').onclick = () => {
        clearInterval(timerInterval);
        hide(gameArea); updateGamesList(); show(levelGames);
    }
    renderRound();
    timerInterval = setInterval(() => {
        if (finished) return;
        timer--;
        document.getElementById('wb-timer').textContent = timer;
        if (timer <= 0) showEnd();
    }, 1000);
    function showEnd() {
        finished = true;
        clearInterval(timerInterval);
        setTimeout(() => showGameResult(score, "Well done!", startGameCallback), 900);
    }
}

// ================= BALL ON PATH GAME =================
function ballOnPathGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let finished = false;
    let score = 0;
    let timer = 60;
    let timerInterval;

    gameArea.innerHTML = `
        <div id="bop-container" style="
            max-width: 600px;
            margin: 35px auto;
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 10px 30px #c9d7e866;
            padding: 30px 20px 26px 20px;
            border: 4px solid #f8b6d6;
            text-align:center;
            position:relative;
        ">
            <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;">Ball on Path</h1>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Score: <span id="bop-score">0</span></span>
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Time: <span id="bop-timer">60</span>s</span>
            </div>
            <div id="bop-canvas-container" style="position:relative;width:100%;height:400px;background:#fff;border-radius:15px;overflow:visible;margin-bottom:20px;">
                <svg id="bop-svg" width="100%" height="100%" style="display:block;pointer-events:none;">
                    <path id="bop-path" stroke="#000" stroke-width="3" fill="none" d=""/>
                    <circle id="bop-ball" r="15" fill="url(#bop-ball-gradient)"/>
                    <defs>
                        <radialGradient id="bop-ball-gradient" cx="30%" cy="30%" r="70%">
                            <stop offset="0%" stop-color="#ff4444"/>
                            <stop offset="100%" stop-color="#cc0000"/>
                        </radialGradient>
                    </defs>
                </svg>
            </div>
            <div id="bop-message" style="font-size:1.15rem;color:#ae8d40;margin-top:10px;min-height:28px;">Watch the ball move along the path!</div>
            <button id="bop-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
        </div>
    `;

    const svg = document.getElementById('bop-svg');
    const path = document.getElementById('bop-path');
    const ball = document.getElementById('bop-ball'); // SVG circle element
    const scoreSpan = document.getElementById('bop-score');
    const timerSpan = document.getElementById('bop-timer');
    const message = document.getElementById('bop-message');
    const container = document.getElementById('bop-canvas-container');

    // Create zigzag path
    function createZigzagPath() {
        // Use fixed dimensions for SVG
        const svgWidth = 560;
        const svgHeight = 400;
        const segments = 7;
        const segmentHeight = svgHeight / segments;
        const margin = 20;
        
        svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        let pathData = `M ${margin} ${segmentHeight}`;
        let x = margin;
        let y = segmentHeight;
        let direction = 1; // 1 for right, -1 for left
        
        for (let i = 0; i < segments; i++) {
            // Horizontal segment
            x = direction > 0 ? (svgWidth - margin) : margin;
            pathData += ` L ${x} ${y}`;
            
            // Diagonal segment (except last)
            if (i < segments - 1) {
                x = direction > 0 ? margin : (svgWidth - margin);
                y += segmentHeight;
                pathData += ` L ${x} ${y}`;
            }
            
            direction *= -1;
        }
        
        path.setAttribute('d', pathData);
        return path;
    }

    // Animate ball along path
    function animateBall() {
        if (finished) return;
        
        let pathLength = path.getTotalLength();
        let progress = 0;
        const speed = 0.003; // Adjust speed here
        
        function move() {
            if (finished) return;
            
            progress += speed;
            if (progress > 1) {
                progress = 0;
                score++;
                scoreSpan.textContent = score;
                message.textContent = `Great! Score: ${score}`;
                message.style.color = "#12af33";
                setTimeout(() => {
                    message.textContent = "Watch the ball move along the path!";
                    message.style.color = "#ae8d40";
                }, 1000);
                // Recreate path in case container size changed
                createZigzagPath();
                pathLength = path.getTotalLength();
            }
            
            const point = path.getPointAtLength(progress * pathLength);
            ball.setAttribute('cx', point.x);
            ball.setAttribute('cy', point.y);
            
            requestAnimationFrame(move);
        }
        move();
    }

    // Wait for container to be rendered
    setTimeout(() => {
        createZigzagPath();
        const firstPoint = path.getPointAtLength(0);
        ball.setAttribute('cx', firstPoint.x);
        ball.setAttribute('cy', firstPoint.y);
        animateBall();
    }, 100);

    document.getElementById('bop-back-btn').onclick = () => {
        finished = true;
        clearInterval(timerInterval);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };

    timerInterval = setInterval(() => {
        if (finished) return;
        timer--;
        timerSpan.textContent = timer;
        if (timer <= 0) {
            finished = true;
            clearInterval(timerInterval);
            setTimeout(() => showGameResult(score, "Well done!", startGameCallback), 900);
        }
    }, 1000);
}

// ================= NUMBER HUNT GAME =================
function numberHuntGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let finished = false;
    let currentNumber = 1;
    let timer = 60;
    let timerInterval;
    let numberElement = null;

    // Nice wallpaper background
    const wallpaperColors = ['#E3F2FD', '#F3E5F5', '#E8F5E9', '#FFF3E0', '#FCE4EC', '#E0F2F1'];
    const randomWallpaper = wallpaperColors[Math.floor(Math.random() * wallpaperColors.length)];

    gameArea.innerHTML = `
        <div id="nh-container" style="
            max-width: 95vw;
            width: 1200px;
            margin: 35px auto;
            background: ${randomWallpaper};
            border-radius: 20px;
            box-shadow: 0 10px 30px #c9d7e866;
            padding: 30px 20px 26px 20px;
            border: 4px solid #f8b6d6;
            text-align:center;
            position:relative;
            min-height:500px;
        ">
            <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;">Number Hunt</h1>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Find: <span id="nh-target">1</span></span>
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Time: <span id="nh-timer">60</span>s</span>
            </div>
            <div id="nh-area" style="position:relative;width:100%;height:450px;min-height:400px;margin-bottom:20px;"></div>
            <div id="nh-message" style="font-size:1.15rem;color:#ae8d40;margin-top:10px;min-height:28px;">Click on the number!</div>
            <button id="nh-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
        </div>
    `;

    const area = document.getElementById('nh-area');
    const targetSpan = document.getElementById('nh-target');
    const timerSpan = document.getElementById('nh-timer');
    const message = document.getElementById('nh-message');

    function showNumber() {
        if (finished || currentNumber > 100) {
            finished = true;
            clearInterval(timerInterval);
            setTimeout(() => showGameResult(currentNumber - 1, "Well done!", startGameCallback), 900);
            return;
        }

        // Remove previous number
        if (numberElement) {
            numberElement.remove();
        }

        // Create new number at random position
        numberElement = document.createElement('div');
        numberElement.textContent = currentNumber;
        numberElement.style.position = 'absolute';
        numberElement.style.fontSize = '4rem';
        numberElement.style.fontWeight = 'bold';
        numberElement.style.color = '#2c3e50';
        numberElement.style.cursor = 'pointer';
        numberElement.style.userSelect = 'none';
        numberElement.style.transition = 'transform 0.2s';
        
        // Random position
        const maxX = area.offsetWidth - 100;
        const maxY = area.offsetHeight - 100;
        numberElement.style.left = Math.random() * maxX + 'px';
        numberElement.style.top = Math.random() * maxY + 'px';
        
        numberElement.onmouseenter = () => numberElement.style.transform = 'scale(1.1)';
        numberElement.onmouseleave = () => numberElement.style.transform = 'scale(1)';
        
        numberElement.onclick = () => {
            if (finished) return;
            currentNumber++;
            targetSpan.textContent = currentNumber;
            message.textContent = `Great! Find ${currentNumber}`;
            message.style.color = "#12af33";
            setTimeout(() => {
                message.textContent = "Click on the number!";
                message.style.color = "#ae8d40";
            }, 800);
            showNumber();
        };
        
        area.appendChild(numberElement);
    }

    showNumber();

    document.getElementById('nh-back-btn').onclick = () => {
        finished = true;
        clearInterval(timerInterval);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };

    timerInterval = setInterval(() => {
        if (finished) return;
        timer--;
        timerSpan.textContent = timer;
        if (timer <= 0) {
            finished = true;
            clearInterval(timerInterval);
            setTimeout(() => showGameResult(currentNumber - 1, "Well done!", startGameCallback), 900);
        }
    }, 1000);
}

// ================= LETTER SEQUENCE GAME =================
function letterSequenceGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let finished = false;
    let currentIndex = 0;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const groups = [];
    
    // Create groups of 3 letters
    for (let i = 0; i < letters.length; i += 3) {
        groups.push(letters.slice(i, i + 3));
    }

    // Light color wallpaper
    const lightColors = ['#F0F8FF', '#F5F5DC', '#E6E6FA', '#FFF8DC', '#F0FFFF', '#FFFACD'];
    const randomColor = lightColors[Math.floor(Math.random() * lightColors.length)];

    gameArea.innerHTML = `
        <div id="ls-container" style="
            max-width: 95vw;
            width: 900px;
            margin: 35px auto;
            background: ${randomColor};
            border-radius: 20px;
            box-shadow: 0 10px 30px #c9d7e866;
            padding: 30px 20px 26px 20px;
            border: 4px solid #f8b6d6;
            text-align:center;
            position:relative;
            min-height:500px;
        ">
            <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;">Letter Sequence</h1>
            <div id="ls-letters" style="position:relative;width:100%;min-height:350px;margin:40px 0;"></div>
            <div id="ls-message" style="font-size:1.15rem;color:#ae8d40;margin-top:10px;min-height:28px;">Watch the letters appear!</div>
            <button id="ls-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
        </div>
    `;

    const lettersContainer = document.getElementById('ls-letters');
    const message = document.getElementById('ls-message');

    function showGroup(groupIndex) {
        if (finished || groupIndex >= groups.length) {
            finished = true;
            setTimeout(() => showGameResult(groups.length, "Well done!", startGameCallback), 900);
            return;
        }

        const group = groups[groupIndex];
        lettersContainer.innerHTML = '';

        // ABC (0), GHI (2), MNO (4)... = big; DEF (1), JKL (3)... = small
        const isBigGroup = (groupIndex % 2) === 0;
        const fontSize = isBigGroup ? '5rem' : '2.5rem';

        // Random position for this group (all 3 letters together)
        const areaW = lettersContainer.offsetWidth || 860;
        const areaH = lettersContainer.offsetHeight || 350;
        const groupW = isBigGroup ? 250 : 150;
        const groupH = isBigGroup ? 100 : 60;
        const groupX = 30 + Math.random() * Math.max(0, areaW - groupW - 60);
        const groupY = 20 + Math.random() * Math.max(0, areaH - groupH - 40);

        const groupWrapper = document.createElement('div');
        groupWrapper.style.position = 'absolute';
        groupWrapper.style.left = groupX + 'px';
        groupWrapper.style.top = groupY + 'px';
        groupWrapper.style.display = 'flex';
        groupWrapper.style.gap = '15px';
        groupWrapper.style.alignItems = 'center';
        lettersContainer.appendChild(groupWrapper);

        group.forEach((letter, idx) => {
            const letterDiv = document.createElement('div');
            letterDiv.textContent = letter;
            letterDiv.style.fontSize = fontSize;
            letterDiv.style.fontWeight = 'bold';
            letterDiv.style.color = '#2c3e50';
            letterDiv.style.opacity = '0';
            letterDiv.style.transform = 'translateY(20px)';
            letterDiv.style.transition = 'opacity 1s ease, transform 1s ease';

            groupWrapper.appendChild(letterDiv);

            setTimeout(() => {
                letterDiv.style.opacity = '1';
                letterDiv.style.transform = 'translateY(0)';
            }, idx * 300);
        });

        setTimeout(() => {
            if (!finished) {
                showGroup(groupIndex + 1);
            }
        }, 4000);
    }

    showGroup(0);

    document.getElementById('ls-back-btn').onclick = () => {
        finished = true;
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };
}

// ================= I SPY GAME (Level 4, Game 1) =================
function iSpyGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    const imageCount = 30;
    const imagePaths = [];
    for (let i = 1; i <= imageCount; i++) {
        imagePaths.push(`img/level4/${i}.png`);
    }

    let targetIndex = 1;
    let score = 0;
    let finished = false;

    gameArea.innerHTML = `
        <div id="ispy-container" class="game-container" style="max-width:min(900px,95vw);width:100%;margin:1rem auto;padding:1rem;box-sizing:border-box;">
            <h1 style="font-family:'Comic Sans MS',cursive;font-size:clamp(1.2rem,5vw,2rem);color:#f875b9;margin-bottom:8px;">I SPY</h1>
            <p style="font-size:clamp(0.9rem,3vw,1rem);color:#396485;margin-bottom:8px;">Find image <strong id="ispy-target">1</strong> in the big window, then 2, 3...</p>
            <div id="ispy-big-window" style="display:grid;gap:4px;padding:8px;background:#fff;border:3px solid #333;border-radius:12px;margin-bottom:12px;min-height:200px;"></div>
            <div id="ispy-legend" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(70px,22vw),1fr));gap:6px;padding:12px;background:#f5f5f5;border-radius:12px;min-height:280px;max-height:65vh;overflow-y:auto;-webkit-overflow-scrolling:touch;"></div>
            <button id="ispy-back-btn" class="small-btn" style="margin-top:12px;">⟵ Back</button>
        </div>
    `;

    const bigWindow = document.getElementById('ispy-big-window');
    const legend = document.getElementById('ispy-legend');
    const targetSpan = document.getElementById('ispy-target');

    // Build legend (30 images in frames, numbered 1-30) - all visible, scroll on phone
    for (let i = 1; i <= imageCount; i++) {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px;border:2px solid #ccc;border-radius:8px;background:#fff;min-height:60px;';
        const img = document.createElement('img');
        img.src = imagePaths[i - 1];
        img.onerror = () => { img.style.display = 'none'; if (item.querySelector('span')) item.querySelector('span').textContent = i; };
        img.style.cssText = 'width:100%;height:100%;max-width:48px;max-height:48px;object-fit:contain;';
        const num = document.createElement('span');
        num.textContent = i;
        num.style.fontSize = 'clamp(0.75rem,2.5vw,1rem);font-weight:bold;';
        item.appendChild(img);
        item.appendChild(num);
        legend.appendChild(item);
    }

    function fillBigWindow() {
        bigWindow.innerHTML = '';
        const cellSize = 56;
        const cols = Math.max(4, Math.min(12, Math.floor((bigWindow.offsetWidth || 400) / (cellSize + 4))));
        const rows = Math.max(4, Math.floor((bigWindow.offsetHeight || 200) / (cellSize + 4)));
        bigWindow.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        bigWindow.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
        bigWindow.style.justifyContent = 'center';
        bigWindow.style.alignContent = 'center';

        for (let i = 0; i < cols * rows; i++) {
            const imgIdx = Math.floor(Math.random() * imageCount);
            const div = document.createElement('div');
            div.style.cssText = 'width:100%;height:100%;min-width:' + cellSize + 'px;min-height:' + cellSize + 'px;border:2px solid #ddd;border-radius:8px;overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center;background:#fafafa;box-sizing:border-box;';
            const img = document.createElement('img');
            img.src = imagePaths[imgIdx];
            img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
            img.onerror = () => { img.style.background = '#ddd'; };
            div.dataset.value = imgIdx + 1;
            div.appendChild(img);
            div.onclick = () => {
                if (finished) return;
                const val = parseInt(div.dataset.value);
                if (val === targetIndex) {
                    score++;
                    targetIndex++;
                    targetSpan.textContent = targetIndex;
                    div.style.opacity = '0.35';
                    div.style.pointerEvents = 'none';
                    if (targetIndex > imageCount) {
                        finished = true;
                        setTimeout(() => showGameResult(score, "Well done!", startGameCallback), 800);
                    }
                }
            };
            bigWindow.appendChild(div);
        }
    }

    fillBigWindow();
    window.addEventListener('resize', () => { if (!finished) fillBigWindow(); });

    document.getElementById('ispy-back-btn').onclick = () => {
        finished = true;
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };
}

// ================= FIND IDENTICAL PAIR GAME (Level 4, Game 2) =================
function findIdenticalPairGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    // User provides 3 images (1.png, 2.png, 3.png); we repeat first → 4 displayed: 1,2,3,1
    const stages = [
        { folder: 'img/level4/game2/stage1/', images: ['1.png', '2.png', '3.png', '1.png'] },
        { folder: 'img/level4/game2/stage2/', images: ['1.png', '2.png', '3.png', '1.png'] },
        { folder: 'img/level4/game2/stage3/', images: ['1.png', '2.png', '3.png', '1.png'] },
        { folder: 'img/level4/game2/stage4/', images: ['1.png', '2.png', '3.png', '1.png'] }
    ];
    let stageIndex = 0;
    let score = 0;
    let selected = [];
    let finished = false;

    function runStage() {
        if (stageIndex >= stages.length) {
            finished = true;
            setTimeout(() => showGameResult(score, "Well done!", startGameCallback), 800);
            return;
        }

        const stage = stages[stageIndex];
        const shuffled = [...stage.images].sort(() => Math.random() - 0.5);

        gameArea.innerHTML = `
            <div id="fip-container" class="game-container" style="max-width:min(500px,95vw);width:100%;margin:1rem auto;padding:1rem;">
                <h1 style="font-family:'Comic Sans MS',cursive;font-size:clamp(1.2rem,5vw,1.8rem);color:#f875b9;">Find Identical Pair</h1>
                <p style="font-size:clamp(0.9rem,3vw,1rem);color:#396485;">Stage ${stageIndex + 1} of 4 - Select the 2 same images (10 pts)</p>
                <div id="fip-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:20px 0;"></div>
                <button id="fip-back-btn" class="small-btn">⟵ Back</button>
            </div>
        `;

        const grid = document.getElementById('fip-grid');
        selected = [];

        shuffled.forEach((src, idx) => {
            const div = document.createElement('div');
            div.style.cssText = 'aspect-ratio:1;border-radius:12px;cursor:pointer;border:3px solid transparent;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f5f5f5;min-height:100px;';
            const img = document.createElement('img');
            img.src = stage.folder + src;
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
            img.onerror = () => { img.style.display = 'none'; };
            div.appendChild(img);
            div.dataset.src = src;
            div.onclick = () => {
                if (selected.length >= 2) return;
                div.style.borderColor = '#f875b9';
                selected.push({ el: div, src });
                if (selected.length === 2) {
                    if (selected[0].src === selected[1].src) {
                        score += 10;
                        setTimeout(() => { stageIndex++; runStage(); }, 500);
                    } else {
                        selected.forEach(s => s.el.style.borderColor = 'red');
                        setTimeout(() => {
                            selected.forEach(s => { s.el.style.borderColor = 'transparent'; });
                            selected = [];
                        }, 800);
                    }
                }
            };
            grid.appendChild(div);
        });

        document.getElementById('fip-back-btn').onclick = () => {
            finished = true;
            hide(gameArea);
            updateGamesList();
            show(levelGames);
        };
    }

    runStage();
}

// ================= CONNECT LETTERS GAME (Level 4, Game 3) – Geoboard style =================
function connectLettersGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    const COLS = 9;
    const ROWS = 11;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let currentLetterIndex = 0;
    let score = 0;
    let timeLeft = 180; // 3 min
    let timerInterval;
    let finished = false;

    const canvasSize = Math.min(320, Math.min(window.innerWidth, window.innerHeight) * 0.85);

    function buildUI() {
        const letter = letters[currentLetterIndex] || letters[letters.length - 1];
        gameArea.innerHTML = `
            <div id="cl-container" class="game-container" style="max-width:min(500px,95vw);width:100%;margin:1rem auto;padding:1rem;box-sizing:border-box;">
                <h1 style="font-family:'Comic Sans MS',cursive;font-size:clamp(1.2rem,5vw,1.6rem);color:#f875b9;">Geoboard Letters</h1>
                <p style="font-size:clamp(1rem,4vw,1.3rem);color:#396485;">Write letter: <strong id="cl-letter">${letter}</strong></p>
                <p style="font-size:clamp(0.85rem,2.5vw,0.95rem);">Score: <span id="cl-score">${score}</span> &nbsp; Time: <span id="cl-timer">03:00</span> &nbsp; <button id="cl-clear-btn" type="button" class="small-btn" style="padding:4px 10px;">Clear</button></p>
                <div style="display:flex;justify-content:center;margin:12px 0;">
                    <canvas id="cl-canvas" width="${canvasSize}" height="${canvasSize}" style="width:min(320px,85vw);height:min(320px,85vw);touch-action:none;display:block;border:2px solid #333;border-radius:8px;background:#fff;"></canvas>
                </div>
                <div style="margin-top:12px;">
                    <button id="cl-next-btn" type="button" class="small-btn" style="margin-right:8px;">Next (10 pts)</button>
                    <button id="cl-back-btn" class="small-btn">⟵ Back</button>
                </div>
            </div>
        `;
    }

    buildUI();

    const canvas = document.getElementById('cl-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = 20;
    const stepX = (w - 2 * pad) / (COLS - 1);
    const stepY = (h - 2 * pad) / (ROWS - 1);

    const pegs = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            pegs.push({
                x: pad + col * stepX,
                y: pad + row * stepY,
                col, row
            });
        }
    }

    const lines = []; // { from: pegIndex, to: pegIndex }
    let dragFrom = -1;
    let dragX = 0, dragY = 0;

    function xyToPeg(x, y) {
        let best = -1, bestD = 999;
        for (let i = 0; i < pegs.length; i++) {
            const d = Math.hypot(pegs[i].x - x, pegs[i].y - y);
            if (d < bestD && d < Math.min(stepX, stepY) * 0.6) {
                bestD = d;
                best = i;
            }
        }
        return best;
    }

    function getCanvasXY(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = w / rect.width;
        const scaleY = h / rect.height;
        const clientX = e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function redraw() {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#f875b9';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        lines.forEach(({ from, to }) => {
            ctx.beginPath();
            ctx.moveTo(pegs[from].x, pegs[from].y);
            ctx.lineTo(pegs[to].x, pegs[to].y);
            ctx.stroke();
        });
        if (dragFrom >= 0) {
            ctx.beginPath();
            ctx.moveTo(pegs[dragFrom].x, pegs[dragFrom].y);
            ctx.lineTo(dragX, dragY);
            ctx.strokeStyle = 'rgba(248,117,185,0.6)';
            ctx.stroke();
        }
        const r = Math.min(stepX, stepY) * 0.2;
        pegs.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    function onPointerDown(e) {
        if (finished) return;
        e.preventDefault();
        const { x, y } = getCanvasXY(e);
        const idx = xyToPeg(x, y);
        if (idx >= 0) dragFrom = idx;
    }

    function onPointerMove(e) {
        if (finished) return;
        const { x, y } = getCanvasXY(e);
        dragX = x;
        dragY = y;
        if (dragFrom >= 0) redraw();
    }

    function onPointerUp(e) {
        if (finished) return;
        const { x, y } = getCanvasXY(e);
        const idx = xyToPeg(x, y);
        if (dragFrom >= 0 && idx >= 0 && idx !== dragFrom) {
            const key1 = [dragFrom, idx].sort((a,b)=>a-b).join(',');
            const exists = lines.some(l => {
                const k = [l.from, l.to].sort((a,b)=>a-b).join(',');
                return k === key1;
            });
            if (!exists) lines.push({ from: dragFrom, to: idx });
        }
        dragFrom = -1;
        redraw();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', () => { dragFrom = -1; redraw(); });
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

    document.getElementById('cl-clear-btn').onclick = () => {
        lines.length = 0;
        redraw();
    };

    document.getElementById('cl-next-btn').onclick = () => {
        if (finished) return;
        score += 10;
        const scoreEl = document.getElementById('cl-score');
        if (scoreEl) scoreEl.textContent = score;
        lines.length = 0;
        currentLetterIndex++;
        if (currentLetterIndex < letters.length) {
            const letterEl = document.getElementById('cl-letter');
            if (letterEl) letterEl.textContent = letters[currentLetterIndex];
        } else {
            currentLetterIndex = letters.length - 1;
            const letterEl = document.getElementById('cl-letter');
            if (letterEl) letterEl.textContent = letters[currentLetterIndex] + ' (done – keep drawing or wait for time)';
        }
        redraw();
    };

    redraw();

    timerInterval = setInterval(() => {
        if (finished) return;
        timeLeft--;
        if (timeLeft <= 0) {
            finished = true;
            clearInterval(timerInterval);
            const timerEl = document.getElementById('cl-timer');
            if (timerEl) timerEl.textContent = '00:00';
            setTimeout(() => showGameResult(score, "Time's up!", startGameCallback), 800);
            return;
        }
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        const timerEl = document.getElementById('cl-timer');
        if (timerEl) timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);

    document.getElementById('cl-back-btn').onclick = () => {
        finished = true;
        clearInterval(timerInterval);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };
}

// ================= SPOT THE DIFFERENCE (Lazy Eye Training) =================
function spotTheDifferenceGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);
    const sourceImage = "img/level5/Spot_the_difference.png";
    const cols = 14;
    const rows = 8;
    const targetNumbers = [
        2, 5, 16, 27, 28, 32, 34, 35, 40, 41, 54, 55, 56, 70, 38, 52, 60, 61,
        67, 81, 80, 75, 76, 77, 78, 79, 98, 102, 109, 110
    ];
    const mergedGroups = [
        [2, 16],
        [27, 28],
        [34, 35],
        [40, 41, 54, 55],
        [56, 70],
        [38, 52],
        [75, 76, 77, 78, 79],
        [67, 81],
        [109, 110]
    ];
    function numberToKey(n) {
        const idx = n - 1;
        const x = idx % cols;
        const y = Math.floor(idx / cols);
        return `${x}-${y}`;
    }
    const keyToGroupId = new Map();
    const answerGroups = [];
    const groupById = new Map();
    let groupCounter = 1;
    mergedGroups.forEach((group) => {
        const id = `g${groupCounter++}`;
        const keys = group.map(numberToKey);
        keys.forEach((key) => keyToGroupId.set(key, id));
        const groupObj = { id, keys };
        answerGroups.push(groupObj);
        groupById.set(id, groupObj);
    });
    const groupedNumbers = new Set(mergedGroups.flat());
    targetNumbers.filter((n) => !groupedNumbers.has(n)).forEach((n) => {
        const id = `g${groupCounter++}`;
        const key = numberToKey(n);
        keyToGroupId.set(key, id);
        const groupObj = { id, keys: [key] };
        answerGroups.push(groupObj);
        groupById.set(id, groupObj);
    });
    const allAnswerGroupIds = new Set(answerGroups.map((g) => g.id));
    const foundGroups = new Set();
    let currentScore = 0;
    let timeLeft = 60;
    let timerHandle = null;
    let gameEnded = false;
    let gameStarted = false;
    let gridEnabled = false;

    gameArea.innerHTML = `
        <div id="std-game" class="std-wrap">
            <div class="std-header">
                <h1>Spot the Difference</h1>
                <p>Photo mode - click the correct transparent square cells.</p>
                <div class="std-stats">
                    <span id="std-progress">0/${allAnswerGroupIds.size} differences found</span>
                    <span id="std-score">Score: 0</span>
                    <span id="std-time">Time: 01:00</span>
                </div>
            </div>
            <div class="std-toolbar">
                <button id="std-start-btn" class="small-btn" type="button">Start</button>
                <button id="std-back-btn" class="small-btn" type="button">⟵ Back</button>
            </div>
            <div id="std-grid" class="std-grid">
                <div class="std-panel">
                    <h3>Image A</h3>
                    <div id="std-left" class="std-scene std-photo std-left"></div>
                </div>
                <div class="std-panel">
                    <h3>Image B</h3>
                    <div id="std-right" class="std-scene std-photo std-right"></div>
                </div>
            </div>
            <div id="std-cover" style="position:relative;">
                
            </div>
            <p id="std-feedback" class="std-feedback">Transparent square layer is visible for fixing alignment.</p>
        </div>
    `;

    const photoLeftScene = document.getElementById("std-left");
    const photoRightScene = document.getElementById("std-right");
    const photoProgressEl = document.getElementById("std-progress");
    const photoScoreEl = document.getElementById("std-score");
    const photoTimeEl = document.getElementById("std-time");
    const photoFeedbackEl = document.getElementById("std-feedback");
    const startBtn = document.getElementById("std-start-btn");
    const cover = document.getElementById("std-cover");

    function renderSpotGrid(sceneEl) {
        sceneEl.style.setProperty("--std-bg-url", `url("${sourceImage}")`);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = document.createElement("button");
                cell.type = "button";
                cell.className = "std-cell";
                const key = `${x}-${y}`;
                const number = (y * cols) + x + 1;
                cell.dataset.key = key;
                cell.dataset.num = String(number);
                cell.dataset.groupId = keyToGroupId.get(key) || "";
                cell.textContent = "";
                cell.addEventListener("click", () => handleSpotClick(cell, key));
                sceneEl.appendChild(cell);
            }
        }
    }

    function keyToPoint(key) {
        const [xStr, yStr] = key.split("-");
        return { x: Number(xStr), y: Number(yStr) };
    }

    function chooseMiddleKey(keys) {
        if (keys.length <= 1) return keys[0];
        const points = keys.map(keyToPoint);
        const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        let bestKey = keys[0];
        let bestDistance = Number.POSITIVE_INFINITY;
        keys.forEach((key, idx) => {
            const p = points[idx];
            const dist = Math.hypot(p.x - meanX, p.y - meanY);
            if (dist < bestDistance) {
                bestDistance = dist;
                bestKey = key;
            }
        });
        return bestKey;
    }

    function markSpotFoundByGroup(groupId) {
        const group = groupById.get(groupId);
        if (!group) return;
        document.querySelectorAll(`.std-cell[data-group-id="${groupId}"]`).forEach((cell) => {
            cell.classList.add("std-cell-found");
            cell.disabled = true;
            cell.innerHTML = "";
        });
        const middleKey = chooseMiddleKey(group.keys);
        document.querySelectorAll(`.std-cell[data-key="${middleKey}"]`).forEach((cell) => {
            cell.innerHTML = `<span class="std-correct-icon">✓</span>`;
        });
    }

    function updateSpotHud() {
        photoProgressEl.textContent = `${foundGroups.size}/${allAnswerGroupIds.size} differences found`;
        photoScoreEl.textContent = `Score: ${currentScore}`;
        const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
        const ss = String(timeLeft % 60).padStart(2, "0");
        photoTimeEl.textContent = `Time: ${mm}:${ss}`;
    }

    function finishSpotGame() {
        if (gameEnded) return;
        gameEnded = true;
        clearInterval(timerHandle);
        const ratioScore = Math.round((currentScore / allAnswerGroupIds.size) * 100);
        showGameResult(
            ratioScore,
            `You found ${currentScore}/${allAnswerGroupIds.size}.`,
            startGameCallback
        );
    }

    function registerSpotWrongClick(cell) {
        if (gameEnded) return;
        if (cell) cell.classList.add("std-cell-wrong");
        setTimeout(() => cell && cell.classList.remove("std-cell-wrong"), 500);
        photoFeedbackEl.textContent = "Not a correct square.";
        photoFeedbackEl.style.color = "#c62828";
        updateSpotHud();
    }

    function handleSpotClick(cell, key) {
        if (!gridEnabled) return;
        if (gameEnded) return;
        const groupId = keyToGroupId.get(key);
        if (!groupId) return registerSpotWrongClick(cell);
        if (foundGroups.has(groupId)) return;
        foundGroups.add(groupId);
        currentScore += 1;
        markSpotFoundByGroup(groupId);
        photoFeedbackEl.textContent = "Correct square!";
        photoFeedbackEl.style.color = "#2e7d32";
        updateSpotHud();
        if (currentScore >= allAnswerGroupIds.size) setTimeout(finishSpotGame, 350);
    }

    updateSpotHud();
    photoFeedbackEl.textContent = "Press Start to begin.";
    photoFeedbackEl.style.color = "#355070";

    startBtn.onclick = () => {
        if (gameStarted || gameEnded) return;
        gameStarted = true;
        gridEnabled = true;
        startBtn.disabled = true;
        if (cover) cover.remove();
        renderSpotGrid(photoLeftScene);
        renderSpotGrid(photoRightScene);
        photoFeedbackEl.textContent = "Find the differences now!";
        photoFeedbackEl.style.color = "#2e7d32";
        timerHandle = setInterval(() => {
            if (gameEnded) return;
            timeLeft = Math.max(0, timeLeft - 1);
            updateSpotHud();
            if (timeLeft === 0) finishSpotGame();
        }, 1000);
    };
    document.getElementById("std-back-btn").onclick = () => {
        clearInterval(timerHandle);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };
    return;

    const scenes = [
        {
            name: "Park Picnic",
            bg: "linear-gradient(180deg, #8fd6ff 0%, #eaf8ff 42%, #7cc77a 42%, #5cad5a 100%)",
            objects: [
                { id: "sun", x: 12, y: 8, w: 60, h: 60, baseColor: "#ffd54f", diffColor: "#ffb300", change: "color" },
                { id: "cloud", x: 32, y: 9, w: 88, h: 28, baseColor: "#f8fcff", diffColor: "#d4ecff", change: "color" },
                { id: "tree", x: 72, y: 22, w: 40, h: 92, baseColor: "#2e7d32", diffColor: "#43a047", change: "size", scale: 1.2 },
                { id: "ball", x: 18, y: 63, w: 34, h: 34, baseColor: "#ff7043", diffColor: "#8d6e63", change: "color" },
                { id: "bench", x: 63, y: 67, w: 65, h: 18, baseColor: "#6d4c41", diffColor: "#4e342e", change: "shift", dx: 6, dy: -5 },
                { id: "kite", x: 52, y: 17, w: 35, h: 35, baseColor: "#ff4081", diffColor: "#f50057", change: "size", scale: 0.8 },
                { id: "flower", x: 39, y: 79, w: 22, h: 22, baseColor: "#ab47bc", diffColor: "#7b1fa2", change: "hide" },
                { id: "bird", x: 83, y: 15, w: 26, h: 20, baseColor: "#5c6bc0", diffColor: "#3949ab", change: "shift", dx: -10, dy: 3 }
            ]
        },
        {
            name: "Playroom",
            bg: "linear-gradient(180deg, #f5f3ff 0%, #f5f3ff 63%, #ffecb3 63%, #ffe082 100%)",
            objects: [
                { id: "lamp", x: 12, y: 12, w: 24, h: 54, baseColor: "#ffd54f", diffColor: "#ffca28", change: "color" },
                { id: "shelf", x: 68, y: 12, w: 56, h: 78, baseColor: "#8d6e63", diffColor: "#6d4c41", change: "shift", dx: -7, dy: 2 },
                { id: "blockA", x: 24, y: 67, w: 30, h: 30, baseColor: "#ef5350", diffColor: "#c62828", change: "size", scale: 1.25 },
                { id: "blockB", x: 58, y: 70, w: 28, h: 28, baseColor: "#42a5f5", diffColor: "#1565c0", change: "color" },
                { id: "teddy", x: 43, y: 46, w: 40, h: 44, baseColor: "#bcaaa4", diffColor: "#a1887f", change: "hide" },
                { id: "car", x: 78, y: 74, w: 42, h: 22, baseColor: "#66bb6a", diffColor: "#388e3c", change: "shift", dx: -8, dy: -4 },
                { id: "book", x: 70, y: 30, w: 20, h: 28, baseColor: "#ff7043", diffColor: "#d84315", change: "color" },
                { id: "window", x: 34, y: 12, w: 28, h: 28, baseColor: "#90caf9", diffColor: "#42a5f5", change: "size", scale: 0.75 }
            ]
        },
        {
            name: "Underwater",
            bg: "linear-gradient(180deg, #80deea 0%, #4dd0e1 48%, #006064 100%)",
            objects: [
                { id: "fish1", x: 15, y: 23, w: 34, h: 22, baseColor: "#ff7043", diffColor: "#d84315", change: "shift", dx: 8, dy: 0 },
                { id: "fish2", x: 61, y: 30, w: 37, h: 24, baseColor: "#ab47bc", diffColor: "#8e24aa", change: "color" },
                { id: "star", x: 75, y: 76, w: 26, h: 26, baseColor: "#ffd54f", diffColor: "#ffb300", change: "hide" },
                { id: "plant1", x: 22, y: 66, w: 18, h: 42, baseColor: "#66bb6a", diffColor: "#2e7d32", change: "size", scale: 1.3 },
                { id: "plant2", x: 41, y: 70, w: 16, h: 35, baseColor: "#26a69a", diffColor: "#00897b", change: "shift", dx: 5, dy: -3 },
                { id: "bubble", x: 86, y: 24, w: 20, h: 20, baseColor: "#e1f5fe", diffColor: "#b3e5fc", change: "color" },
                { id: "shell", x: 57, y: 83, w: 30, h: 17, baseColor: "#ffccbc", diffColor: "#ffab91", change: "size", scale: 0.72 },
                { id: "crab", x: 8, y: 82, w: 36, h: 23, baseColor: "#ef5350", diffColor: "#b71c1c", change: "shift", dx: 9, dy: -4 }
            ]
        }
    ];

    const scene = scenes[Math.floor(Math.random() * scenes.length)];
    const targetCount = 5 + Math.floor(Math.random() * 4);
    const selectedDiffs = [...scene.objects].sort(() => Math.random() - 0.5).slice(0, targetCount);
    const activeDiffIds = new Set(selectedDiffs.map(d => d.id));
    const foundIds = new Set();

    let wrongClicks = 0;
    let hintsLeft = 3;
    let easyMode = true;
    let remainingSeconds = 150;
    let timerInterval = null;
    let hintFlashTimeout = null;

    gameArea.innerHTML = `
        <div id="std-game" class="std-wrap">
            <div class="std-header">
                <h1>Spot the Difference</h1>
                <p>${scene.name} - Find all hidden differences.</p>
                <div class="std-stats">
                    <span id="std-progress">0/${targetCount} differences found</span>
                    <span id="std-timer">Time: 02:30</span>
                    <span id="std-penalty">Penalties: 0</span>
                </div>
            </div>
            <div class="std-toolbar">
                <button id="std-mode-btn" class="small-btn" type="button">Mode: Easy</button>
                <button id="std-hint-btn" class="small-btn" type="button">Hint (${hintsLeft})</button>
                <button id="std-focus-btn" class="small-btn" type="button">Focus Zone</button>
                <button id="std-back-btn" class="small-btn" type="button">⟵ Back</button>
            </div>
            <div id="std-grid" class="std-grid">
                <div class="std-panel">
                    <h3>Image A</h3>
                    <div id="std-left" class="std-scene"></div>
                </div>
                <div class="std-panel">
                    <h3>Image B</h3>
                    <div id="std-right" class="std-scene std-blur"></div>
                </div>
            </div>
            <p id="std-feedback" class="std-feedback">Tap differences in either image.</p>
        </div>
    `;

    const leftScene = document.getElementById("std-left");
    const rightScene = document.getElementById("std-right");
    const progressEl = document.getElementById("std-progress");
    const timerEl = document.getElementById("std-timer");
    const penaltyEl = document.getElementById("std-penalty");
    const feedbackEl = document.getElementById("std-feedback");
    const hintBtn = document.getElementById("std-hint-btn");
    const modeBtn = document.getElementById("std-mode-btn");
    const focusBtn = document.getElementById("std-focus-btn");

    function createObjectNode(obj, isRightScene) {
        const node = document.createElement("div");
        node.className = "std-object";
        node.dataset.id = obj.id;

        let x = obj.x;
        let y = obj.y;
        let w = obj.w;
        let h = obj.h;
        let color = obj.baseColor;
        let hidden = false;

        if (isRightScene && activeDiffIds.has(obj.id)) {
            if (obj.change === "color") color = obj.diffColor;
            if (obj.change === "size") {
                w = Math.max(14, Math.floor(w * (obj.scale || 1.15)));
                h = Math.max(14, Math.floor(h * (obj.scale || 1.15)));
            }
            if (obj.change === "shift") {
                x = Math.max(2, Math.min(90, x + (obj.dx || 5)));
                y = Math.max(2, Math.min(90, y + (obj.dy || -3)));
            }
            if (obj.change === "hide") hidden = true;
        }

        if (hidden) {
            node.style.display = "none";
        } else {
            node.style.left = `${x}%`;
            node.style.top = `${y}%`;
            node.style.width = `${w}px`;
            node.style.height = `${h}px`;
            node.style.background = color;
        }

        if (obj.id.includes("sun") || obj.id.includes("bubble")) node.style.borderRadius = "50%";
        else if (obj.id.includes("cloud")) node.style.borderRadius = "20px";
        else node.style.borderRadius = "8px";

        return node;
    }

    function renderScenes() {
        leftScene.style.background = scene.bg;
        rightScene.style.background = scene.bg;
        leftScene.innerHTML = "";
        rightScene.innerHTML = "";
        scene.objects.forEach(obj => {
            leftScene.appendChild(createObjectNode(obj, false));
            rightScene.appendChild(createObjectNode(obj, true));
        });
    }

    function markDifference(id) {
        const leftNode = leftScene.querySelector(`[data-id="${id}"]`);
        const rightNode = rightScene.querySelector(`[data-id="${id}"]`);
        [leftNode, rightNode].forEach((node) => {
            if (!node) return;
            node.classList.add("std-found");
            const marker = document.createElement("span");
            marker.className = "std-marker";
            marker.textContent = "✓";
            node.appendChild(marker);
        });
    }

    function updateHud() {
        progressEl.textContent = `${foundIds.size}/${targetCount} differences found`;
        penaltyEl.textContent = `Penalties: ${wrongClicks}`;
        hintBtn.textContent = `Hint (${hintsLeft})`;
    }

    function formatTime(value) {
        const mins = Math.floor(value / 60);
        const secs = value % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function finishGame() {
        clearInterval(timerInterval);
        clearTimeout(hintFlashTimeout);

        const baseScore = foundIds.size * 15;
        const timeBonus = easyMode ? Math.max(0, 40 - wrongClicks * 3) : Math.max(0, remainingSeconds);
        const penalty = wrongClicks * 4;
        const hintPenalty = (3 - hintsLeft) * 3;
        const finalScore = Math.max(0, baseScore + timeBonus - penalty - hintPenalty);

        showGameResult(finalScore, foundIds.size === targetCount ? "Excellent focus!" : "Nice effort!", startGameCallback);
    }

    function registerWrongClick() {
        wrongClicks++;
        feedbackEl.textContent = "Not a difference. Small penalty applied.";
        feedbackEl.style.color = "#c62828";
        if (!easyMode) {
            remainingSeconds = Math.max(0, remainingSeconds - 3);
            timerEl.textContent = `Time: ${formatTime(remainingSeconds)}`;
            if (remainingSeconds <= 0) finishGame();
        }
        updateHud();
    }

    function handleSelection(e) {
        const object = e.target.closest(".std-object");
        if (!object) return registerWrongClick();
        const id = object.dataset.id;
        if (!activeDiffIds.has(id) || foundIds.has(id)) return registerWrongClick();

        foundIds.add(id);
        markDifference(id);
        feedbackEl.textContent = "Great! You found a difference.";
        feedbackEl.style.color = "#2e7d32";
        const snd = new Audio("rightanswer-95219.mp3");
        snd.play().catch(() => {});
        updateHud();

        if (foundIds.size === targetCount) {
            setTimeout(finishGame, 350);
        }
    }

    function activateHint() {
        if (hintsLeft <= 0) return;
        const remaining = selectedDiffs.filter(d => !foundIds.has(d.id));
        if (!remaining.length) return;

        hintsLeft--;
        const target = remaining[Math.floor(Math.random() * remaining.length)];
        const leftNode = leftScene.querySelector(`[data-id="${target.id}"]`);
        const rightNode = rightScene.querySelector(`[data-id="${target.id}"]`);
        [leftNode, rightNode].forEach((node) => node && node.classList.add("std-hint"));
        clearTimeout(hintFlashTimeout);
        hintFlashTimeout = setTimeout(() => {
            [leftNode, rightNode].forEach((node) => node && node.classList.remove("std-hint"));
        }, 1300);
        feedbackEl.textContent = "Hint used. Focus around the highlighted zone.";
        feedbackEl.style.color = "#5e35b1";
        updateHud();
    }

    function showFocusZone() {
        const remaining = selectedDiffs.filter(d => !foundIds.has(d.id));
        const target = remaining[Math.floor(Math.random() * remaining.length)];
        if (!target) return;
        const zone = document.createElement("div");
        zone.className = "std-focus-zone";
        zone.style.left = `${target.x - 6}%`;
        zone.style.top = `${target.y - 6}%`;
        zone.style.width = "64px";
        zone.style.height = "64px";
        rightScene.appendChild(zone);
        setTimeout(() => zone.remove(), 1100);
    }

    function toggleMode() {
        easyMode = !easyMode;
        modeBtn.textContent = easyMode ? "Mode: Easy" : "Mode: Challenge";
        rightScene.classList.toggle("std-blur", easyMode);
        timerEl.style.display = easyMode ? "none" : "inline";
        feedbackEl.textContent = easyMode ? "Easy mode: no timer." : "Challenge mode: beat the clock.";
        feedbackEl.style.color = "#1d3557";
    }

    renderScenes();
    updateHud();
    timerEl.style.display = "none";
    leftScene.addEventListener("click", handleSelection);
    rightScene.addEventListener("click", handleSelection);

    modeBtn.onclick = toggleMode;
    hintBtn.onclick = activateHint;
    focusBtn.onclick = showFocusZone;
    document.getElementById("std-back-btn").onclick = () => {
        clearInterval(timerInterval);
        clearTimeout(hintFlashTimeout);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };

    timerInterval = setInterval(() => {
        if (easyMode) return;
        remainingSeconds = Math.max(0, remainingSeconds - 1);
        timerEl.textContent = `Time: ${formatTime(remainingSeconds)}`;
        if (remainingSeconds <= 0) finishGame();
    }, 1000);
}

// ================= MAZE GAME (Lazy Eye Training) =================
function mazeGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    const STAGES = [
        {
            name: "Stage 1",
            time: 90,
            maze: [
                "111111111111",
                "100000100001",
                "101110101101",
                "100010100001",
                "111010111101",
                "100010000101",
                "101111110101",
                "101000010001",
                "101011011101",
                "100000000001",
                "111111111111"
            ]
        },
        {
            name: "Stage 2",
            time: 75,
            maze: [
                "11111111111111",
                "10000000100001",
                "10111110101101",
                "10100010100001",
                "10101110111101",
                "10101000100001",
                "10101111101111",
                "10100000100001",
                "10111110111001",
                "10000010001001",
                "11111010101001",
                "10000000100001",
                "11111111111111"
            ]
        },
        {
            name: "Stage 3",
            time: 60,
            maze: [
                "1111111111111111",
                "1000000000100001",
                "1011111110101111",
                "1010000010100001",
                "1010111010111101",
                "1010101010000101",
                "1010101011110101",
                "1010001000010101",
                "1011101111010101",
                "1000101000010101",
                "1110101011110101",
                "1000100010000101",
                "1011111010111101",
                "1000000010000001",
                "1111111111111111"
            ]
        }
    ];

    let stageIndex = 0;
    let maze = STAGES[stageIndex].maze;
    let rows = maze.length;
    let cols = maze[0].length;
    let cell = 32;
    let player = { r: 1, c: 1 };
    let goal = { r: rows - 2, c: cols - 2 };
    let moves = 0;
    let totalScore = 0;
    let timeLeft = STAGES[stageIndex].time;
    let started = false;
    let finished = false;
    let timer = null;

    gameArea.innerHTML = `
        <div id="mz-wrap" style="max-width:min(740px,96vw);margin:1rem auto;padding:1rem;background:#ffe7f5;border-radius:18px;border:3px solid #f39ccd;box-shadow:0 8px 20px rgba(192,106,160,0.22);text-align:center;">
            <h1 style="margin:0 0 .6rem 0;color:#a22f7f;font-family:'Comic Sans MS',cursive;">Navigate the Labyrinth</h1>
            <div id="mz-stage" style="font-weight:bold;color:#7a2f66;margin-bottom:.4rem;">${STAGES[0].name} of ${STAGES.length}</div>
            <div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap;margin-bottom:.7rem;">
                <button id="mz-start" class="small-btn" style="background:#b64b98;color:#fff;">Start</button>
                <button id="mz-up" class="small-btn" style="background:#e36e3b;color:#fff;">Up</button>
                <button id="mz-down" class="small-btn" style="background:#e36e3b;color:#fff;">Down</button>
                <button id="mz-right" class="small-btn" style="background:#e36e3b;color:#fff;">Right</button>
                <button id="mz-left" class="small-btn" style="background:#e36e3b;color:#fff;">Left</button>
            </div>
            <div style="display:flex;justify-content:center;gap:1rem;font-weight:bold;color:#7a2f66;margin-bottom:.6rem;">
                <span id="mz-moves">Moves: 0</span>
                <span id="mz-time">Time: ${STAGES[0].time}s</span>
                <span id="mz-score">Score: 0</span>
            </div>
            <canvas id="mz-canvas" width="${cols * cell}" height="${rows * cell}" style="width:min(${cols * cell}px,90vw);height:auto;border-radius:12px;border:4px solid #7f5d6f;background:#8cab4b;"></canvas>
            <div style="margin-top:.8rem;">
                <button id="mz-back" class="small-btn">⟵ Back</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById("mz-canvas");
    const ctx = canvas.getContext("2d");
    const mazeWrap = document.getElementById("mz-wrap");
    const stageEl = document.getElementById("mz-stage");
    const movesEl = document.getElementById("mz-moves");
    const timeEl = document.getElementById("mz-time");
    const scoreEl = document.getElementById("mz-score");
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeTracking = false;

    function setupStage(idx) {
        stageIndex = idx;
        maze = STAGES[stageIndex].maze;
        rows = maze.length;
        cols = maze[0].length;
        cell = Math.max(24, Math.floor(500 / cols));
        canvas.width = cols * cell;
        canvas.height = rows * cell;
        canvas.style.width = `min(${cols * cell}px,90vw)`;
        player = { r: 1, c: 1 };
        goal = { r: rows - 2, c: cols - 2 };
        moves = 0;
        timeLeft = STAGES[stageIndex].time;
        started = false;
        clearInterval(timer);
        stageEl.textContent = `${STAGES[stageIndex].name} of ${STAGES.length}`;
        movesEl.textContent = "Moves: 0";
        timeEl.textContent = `Time: ${timeLeft}s`;
        scoreEl.textContent = `Score: ${totalScore}`;
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (maze[r][c] === "1") {
                    ctx.fillStyle = "#1f8f2e";
                    ctx.fillRect(c * cell, r * cell, cell, cell);
                } else {
                    ctx.fillStyle = "#86aa4a";
                    ctx.fillRect(c * cell, r * cell, cell, cell);
                }
            }
        }
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(player.c * cell + cell / 2, player.r * cell + cell / 2, cell * 0.33, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a36ff";
        ctx.beginPath();
        ctx.arc(goal.c * cell + cell / 2, goal.r * cell + cell / 2, cell * 0.33, 0, Math.PI * 2);
        ctx.fill();
    }

    function endGame(win) {
        if (finished) return;
        clearInterval(timer);
        if (!win) {
            finished = true;
            showGameResult(Math.round(totalScore), "Time's up!", startGameCallback);
            return;
        }

        const stageScore = Math.max(10, 120 - moves - (STAGES[stageIndex].time - timeLeft));
        totalScore += Math.round(stageScore);
        scoreEl.textContent = `Score: ${totalScore}`;

        if (stageIndex < STAGES.length - 1) {
            setupStage(stageIndex + 1);
            return;
        }

        finished = true;
        showGameResult(Math.round(totalScore), "All 3 maze stages completed!", startGameCallback);
    }

    function step(dr, dc) {
        if (!started || finished) return;
        const nr = player.r + dr;
        const nc = player.c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) return;
        if (maze[nr][nc] === "1") return;
        player = { r: nr, c: nc };
        moves++;
        movesEl.textContent = `Moves: ${moves}`;
        draw();
        if (player.r === goal.r && player.c === goal.c) endGame(true);
    }

    function startMaze() {
        if (started || finished) return;
        started = true;
        clearInterval(timer);
        timer = setInterval(() => {
            if (finished) return;
            timeLeft--;
            timeEl.textContent = `Time: ${timeLeft}s`;
            if (timeLeft <= 0) endGame(false);
        }, 1000);
    }

    document.getElementById("mz-start").onclick = startMaze;
    document.getElementById("mz-up").onclick = () => step(-1, 0);
    document.getElementById("mz-down").onclick = () => step(1, 0);
    document.getElementById("mz-right").onclick = () => step(0, 1);
    document.getElementById("mz-left").onclick = () => step(0, -1);

    // Mobile swipe controls: map swipe direction to the same movement logic.
    mazeWrap.addEventListener("touchstart", (e) => {
        if (!e.touches || e.touches.length !== 1) return;
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
        swipeTracking = true;
    }, { passive: true });

    mazeWrap.addEventListener("touchend", (e) => {
        if (!swipeTracking || !e.changedTouches || e.changedTouches.length !== 1) return;
        swipeTracking = false;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - swipeStartX;
        const dy = touch.clientY - swipeStartY;
        const minSwipe = 24;
        if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) step(0, 1);
            else step(0, -1);
        } else {
            if (dy > 0) step(1, 0);
            else step(-1, 0);
        }
    }, { passive: true });

    mazeWrap.addEventListener("touchmove", (e) => {
        if (!swipeTracking) return;
        e.preventDefault();
    }, { passive: false });

    document.getElementById("mz-back").onclick = () => {
        clearInterval(timer);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };

    window.addEventListener("keydown", function onMazeKey(e) {
        if (finished || gameArea.classList.contains("hidden")) {
            window.removeEventListener("keydown", onMazeKey);
            return;
        }
        if (e.key === "ArrowUp") step(-1, 0);
        if (e.key === "ArrowDown") step(1, 0);
        if (e.key === "ArrowRight") step(0, 1);
        if (e.key === "ArrowLeft") step(0, -1);
    });

    setupStage(0);
}

// ================= SNAKE GAME (Lazy Eye Training) =================
function snakeGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    const gridSize = 16;
    const cellSize = 24;
    let snake = [{ x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let food = { x: 10, y: 8 };
    let timeLeft = 60;
    let gameOver = false;
    let started = false;
    let moveTimer = null;
    let clockTimer = null;
    let speedMs = 190;

    gameArea.innerHTML = `
        <div style="max-width:min(680px,95vw);margin:1rem auto;padding:1rem;background:#ffe9f6;border:3px solid #f2a2cf;border-radius:16px;box-shadow:0 8px 20px rgba(214,123,175,0.25);text-align:center;overflow:hidden;">
            <h1 style="margin:.2rem 0 .6rem 0;color:#9d2d79;font-family:'Comic Sans MS',cursive;">Snake Game</h1>
            <div style="display:flex;justify-content:center;gap:1.2rem;font-weight:bold;color:#7a2f66;margin-bottom:.6rem;">
                <span id="sn-length">Length: ${snake.length}</span>
                <span id="sn-time">Time: 60s</span>
                <span id="sn-speed">Speed: 1x</span>
            </div>
            <div class="sn-top-controls" style="display:flex;justify-content:center;gap:.6rem;flex-wrap:wrap;margin-bottom:.6rem;">
                <button id="sn-start" class="small-btn" style="background:#b64b98;color:#fff;">Start</button>
            </div>
            <canvas id="sn-canvas" width="${gridSize * cellSize}" height="${gridSize * cellSize}" style="width:min(${gridSize * cellSize}px,90vw);height:auto;background:#8ed14f;border:3px solid #4c8f39;border-radius:12px;overflow:hidden;"></canvas>
            <div class="sn-dpad" style="margin-top:.8rem;">
                <div class="sn-dpad-row">
                    <button id="sn-up" class="small-btn sn-dpad-btn">▲</button>
                </div>
                <div class="sn-dpad-row">
                    <button id="sn-left" class="small-btn sn-dpad-btn">◀</button>
                    <button id="sn-down" class="small-btn sn-dpad-btn">▼</button>
                    <button id="sn-right" class="small-btn sn-dpad-btn">▶</button>
                </div>
            </div>
            <div style="display:flex;justify-content:center;gap:.6rem;flex-wrap:wrap;margin-top:.8rem;">
                <button id="sn-back" class="small-btn">⟵ Back</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById("sn-canvas");
    const ctx = canvas.getContext("2d");
    const lengthEl = document.getElementById("sn-length");
    const timeEl = document.getElementById("sn-time");
    const speedEl = document.getElementById("sn-speed");
    const startBtn = document.getElementById("sn-start");

    function randomFood() {
        let x, y, onSnake;
        do {
            x = Math.floor(Math.random() * gridSize);
            y = Math.floor(Math.random() * gridSize);
            onSnake = snake.some((p) => p.x === x && p.y === y);
        } while (onSnake);
        food = { x, y };
    }

    function setDirection(x, y) {
        if (gameOver || !started) return;
        if (x === -direction.x && y === -direction.y) return;
        nextDirection = { x, y };
    }

    function drawApple(x, y) {
        const cx = x * cellSize + cellSize / 2;
        const cy = y * cellSize + cellSize / 2;
        const r = cellSize * 0.33;
        ctx.fillStyle = "#e53935";
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2e7d32";
        ctx.fillRect(cx - 2, cy - r - 5, 4, 6);
    }

    function drawRoundedCell(x, y, fill, radius = 6) {
        const px = x * cellSize + 1;
        const py = y * cellSize + 1;
        const s = cellSize - 2;
        const r = Math.min(radius, s / 2);
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(px + r, py);
        ctx.lineTo(px + s - r, py);
        ctx.quadraticCurveTo(px + s, py, px + s, py + r);
        ctx.lineTo(px + s, py + s - r);
        ctx.quadraticCurveTo(px + s, py + s, px + s - r, py + s);
        ctx.lineTo(px + r, py + s);
        ctx.quadraticCurveTo(px, py + s, px, py + s - r);
        ctx.lineTo(px, py + r);
        ctx.quadraticCurveTo(px, py, px + r, py);
        ctx.closePath();
        ctx.fill();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? "#9adf5e" : "#90d655";
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }

        snake.forEach((part, idx) => {
            if (idx === 0) {
                drawRoundedCell(part.x, part.y, "#1f57cc", 7);
                const eyeOffsetX = direction.x !== 0 ? direction.x * 3 : 0;
                const eyeOffsetY = direction.y !== 0 ? direction.y * 3 : 0;
                const cx = part.x * cellSize + cellSize / 2;
                const cy = part.y * cellSize + cellSize / 2;
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(cx - 5 + eyeOffsetX, cy - 4 + eyeOffsetY, 2.2, 0, Math.PI * 2);
                ctx.arc(cx + 5 + eyeOffsetX, cy - 4 + eyeOffsetY, 2.2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                drawRoundedCell(part.x, part.y, "#2f7af2", 6);
            }
        });

        drawApple(food.x, food.y);
    }

    function endSnakeGame() {
        if (gameOver) return;
        gameOver = true;
        started = false;
        clearInterval(moveTimer);
        clearInterval(clockTimer);
        showGameResult(snake.length, "Snake time ended!", startGameCallback);
    }

    function restartMoveTimer() {
        clearInterval(moveTimer);
        moveTimer = setInterval(step, speedMs);
        const speedLevel = (190 / speedMs).toFixed(1);
        speedEl.textContent = `Speed: ${speedLevel}x`;
    }

    function step() {
        if (gameOver || !started) return;
        direction = nextDirection;
        const head = {
            x: (snake[0].x + direction.x + gridSize) % gridSize,
            y: (snake[0].y + direction.y + gridSize) % gridSize
        };

        if (snake.some((p) => p.x === head.x && p.y === head.y)) {
            endSnakeGame();
            return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            randomFood();
            speedMs = Math.max(85, speedMs - 10);
            restartMoveTimer();
        } else {
            snake.pop();
        }

        lengthEl.textContent = `Length: ${snake.length}`;
        draw();
    }

    function onKey(e) {
        if (gameOver || gameArea.classList.contains("hidden")) {
            window.removeEventListener("keydown", onKey);
            return;
        }
        if (e.key === "ArrowUp") setDirection(0, -1);
        if (e.key === "ArrowDown") setDirection(0, 1);
        if (e.key === "ArrowLeft") setDirection(-1, 0);
        if (e.key === "ArrowRight") setDirection(1, 0);
    }

    document.getElementById("sn-up").onclick = () => setDirection(0, -1);
    document.getElementById("sn-down").onclick = () => setDirection(0, 1);
    document.getElementById("sn-left").onclick = () => setDirection(-1, 0);
    document.getElementById("sn-right").onclick = () => setDirection(1, 0);
    startBtn.onclick = () => {
        if (started || gameOver) return;
        started = true;
        startBtn.disabled = true;
        restartMoveTimer();
        clockTimer = setInterval(() => {
            if (gameOver) return;
            timeLeft--;
            timeEl.textContent = `Time: ${timeLeft}s`;
            if (timeLeft <= 0) endSnakeGame();
        }, 1000);
    };
    document.getElementById("sn-back").onclick = () => {
        gameOver = true;
        started = false;
        clearInterval(moveTimer);
        clearInterval(clockTimer);
        window.removeEventListener("keydown", onKey);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };

    window.addEventListener("keydown", onKey);

    draw();
    speedEl.textContent = "Speed: 1.0x";
}

// ================ Override showGiftScreen for 4 levels ================

function showGiftScreen() {
    hide(levelGames, gameResult, gameArea);
    show(giftScreen);
    let total = levelScores[currentLevel].reduce((a,b)=>a+b,0);

    giftMsg.innerHTML = `<img src="Animation - 1752044468269.gif" style="width:120px;display:block;margin:16px auto 2px auto;" alt="gift"><b>Your total score: ${total}</b><br/>Enjoy your reward! 🎁<br/>`;
    playGiftSound();

    continueBtn.onclick = () => {
        hide(giftScreen);
        if(currentLevel === 0){
            openLevel(1);
        } else if(currentLevel === 1){
            level3Btn.disabled = false;
            openLevel(2);
        } else if(currentLevel === 2){
            if (level4Btn) level4Btn.disabled = false;
            openLevel(3);
        } else if (currentLevel === 3) {
            openLevel(4);
        } else if (currentLevel === 4) {
            openLevel(5);
        } else {
            // All levels finished: compute full session results and send to Lazy-eye Firebase
            try {
                const gamesSummary = [];
                for (let lvl = 0; lvl < levels.length; lvl++) {
                    const lvlScoresArr = levelScores[lvl] || [];
                    for (let gi = 0; gi < levels[lvl].games.length; gi++) {
                        const gameDef = levels[lvl].games[gi];
                        const score = typeof lvlScoresArr[gi] === 'number' ? lvlScoresArr[gi] : 0;
                        gamesSummary.push({
                            level: lvl + 1,
                            gameIndex: gi,
                            gameName: gameDef.name,
                            score
                        });
                    }
                }
                const sessionTotal = gamesSummary.reduce((sum, g) => sum + g.score, 0);
                // Get patient name and age from localStorage (set in step 2 of wizard)
                const patientName = localStorage.getItem('userName') || '';
                const patientAge = localStorage.getItem('userAge') || '';
                const payload = {
                    when: new Date().toISOString(),
                    sessionTotal,
                    games: gamesSummary,
                    patientName: patientName,
                    patientAge: patientAge
                };
                window.LazyDB?.saveLazySessionResult(payload);
            } catch (_) {}

            show(finalScreen);
            finalScore.innerHTML = `<b>Total Score: ${levelScores.flat().reduce((a,b)=>a+b,0)}</b>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // ... أي أكواد أخرى ...
    const videosCard = document.getElementById('videos-card');
    const videoScreen = document.getElementById('video-screen');
    const mainMenu = document.getElementById('main-menu');
    const videoBackBtn = document.getElementById('video-back-btn');
    if (videosCard && videoScreen && mainMenu && videoBackBtn) {
        videosCard.onclick = () => {
            mainMenu.classList.add('hidden');
            videoScreen.classList.remove('hidden');
        }
        videoBackBtn.onclick = () => {
            videoScreen.classList.add('hidden');
            mainMenu.classList.remove('hidden');
        }
    }
});

        // دوال مساعدة للعرض والإخفاء
        function show(el) { el.classList.remove('hidden'); }
        function hide(...els) { els.forEach(e => e && e.classList.add('hidden')); }


window.onload = function () {
    window.LevelReminder?.init?.({
        getCurrentLevel: () => currentLevel,
        onGoToNextLevel: (levelIndex) => {
            const next = levelIndex + 1;
            if (next < levels.length) openLevel(next);
        }
    });

    // بعد 2.5 ثانية (مدة الـ intro.gif تقريبًا) نخفي splash ونظهر welcome animation
    setTimeout(function () {
        document.getElementById('intro-splash').style.display = 'none';
        let welcome = document.getElementById('welcome-anim');
        welcome.style.opacity = 1;
        welcome.style.pointerEvents = 'auto';

        // بعد 2.4 ثانية نخفي welcome animation ونظهر الموقع الأساسي
        setTimeout(function () {
            welcome.style.opacity = 0;
            welcome.style.pointerEvents = 'none';
            // إظهار المينيو الرئيسي
            document.getElementById('main-menu').classList.remove('hidden');
            if (window.SessionTimer?.startSession) window.SessionTimer.startSession();
        }, 2400);
    }, 2400);
};