"use strict";

import gameArea from './table.js';
import {score, resetScore, setId, scoreBoardDiv, timeInput, scoreInput} from './scoreboard.js';
import tetrisBlock from './tetris-block.js';
import timer from './timer.js';
import {createGameLoop} from './game-loop.js';

let loopID;
const loop = createGameLoop();
let started = false;
let paused = false;
let curBlocks;
let gameTimer;

const root = document.querySelector("#root");

const box1 = document.createElement("div");
const box2 = document.createElement("div");
const box3 = document.createElement("div");

// Piece colours for block-letter styling (NES palette)
const PIECE_COLORS = ['#5ad9ff','#ffd23f','#ff9128','#c93dff','#ff3a55','#5cff7a','#3a5cff'];

function shuffleColors(pool, count) {
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
}

const titleColors = shuffleColors([...PIECE_COLORS], 6);
const ctaColors   = shuffleColors([...PIECE_COLORS], 5);

// Build start screen
const startScreen = document.createElement("div");
startScreen.id = "start-screen";

// Top status strip
const statusLeft = document.createElement("div");
statusLeft.className = "splash-status splash-status-left";
statusLeft.textContent = "v 1.0 · INSERT COIN";
const statusRight = document.createElement("div");
statusRight.className = "splash-status splash-status-right";
statusRight.textContent = "1 PLAYER · NORMAL";

// --- Left column ---
const splashLeft = document.createElement("div");
splashLeft.className = "splash-left";

const arcadeLabel = document.createElement("div");
arcadeLabel.className = "arcade-label";
arcadeLabel.textContent = "◆ A R C A D E ◆ E D I T I O N";

const titleEl = document.createElement("h1");
titleEl.className = "splash-title";
"TETRIS".split("").forEach((ch, i) => {
    const span = document.createElement("span");
    span.className = "block-letter";
    span.textContent = ch;
    span.style.setProperty("--letter-color", titleColors[i]);
    titleEl.append(span);
});

const tagline = document.createElement("p");
tagline.className = "splash-tagline";
tagline.innerHTML = "Stack. Clear. Climb the board.<br>Ten by twenty. Seven shapes.";

const controls = document.createElement("div");
controls.className = "splash-controls";
const controlsHeading = document.createElement("div");
controlsHeading.className = "controls-heading";
controlsHeading.textContent = "CONTROLS";
controls.append(controlsHeading);
[
    ["ENTER", "START"],
    ["◀ ▶", "MOVE"],
    ["▼", "DROP"],
    ["▲", "ROTATE"],
    ["ESC", "PAUSE"],
].forEach(([key, label]) => {
    const row = document.createElement("div");
    row.className = "control-row";
    const badge = document.createElement("span");
    badge.className = "key-badge";
    badge.textContent = key;
    const lbl = document.createElement("span");
    lbl.className = "control-label";
    lbl.textContent = label;
    row.append(badge, lbl);
    controls.append(row);
});

const ctaWrap = document.createElement("div");
ctaWrap.className = "splash-cta-wrap";

const startBtn = document.createElement("button");
startBtn.id = "start-btn";
startBtn.className = "splash-cta";
startBtn.textContent = "▶ START";

const enterHint = document.createElement("p");
enterHint.className = "splash-enter-hint";
enterHint.textContent = "PRESS ENTER";

ctaWrap.append(startBtn, enterHint);

splashLeft.append(arcadeLabel, titleEl, tagline, controls, ctaWrap);

// --- Right column (preview board) ---
const splashRight = document.createElement("div");
splashRight.className = "splash-right";

const previewWrapper = document.createElement("div");
previewWrapper.className = "preview-wrapper";

const previewBoard = document.createElement("div");
previewBoard.id = "preview-board";
previewBoard.className = "preview-board";

// Hardcoded board state: null = empty, string = colour
const C = PIECE_COLORS;
const PREVIEW_BOARD = [
    // Rows 0–8: empty
    ...Array(9).fill(Array(10).fill(null)),
    // Row 9 – sparse top of stack
    [null, null, C[0], C[1], null, C[2], null, null, C[3], null],
    // Row 10
    [null, C[4], C[0], C[5], C[1], null, C[6], C[2], C[3], null],
    // Row 11
    [C[5], C[4], null, C[6], C[0], C[1], C[2], C[3], C[5], C[6]],
    // Row 12
    [C[0], C[1], C[2], C[3], null, C[4], C[5], C[6], null, C[0]],
    // Row 13
    [C[6], C[5], C[4], C[3], C[2], C[1], null, C[0], C[6], C[5]],
    // Row 14
    [C[1], C[2], null, C[3], C[4], C[5], C[6], C[0], C[1], C[2]],
    // Row 15
    [C[3], C[4], C[5], C[6], C[0], C[1], C[2], null, C[3], C[4]],
    // Row 16
    [C[5], C[6], C[0], C[1], C[2], null, C[3], C[4], C[5], C[6]],
    // Row 17
    [C[0], C[1], C[2], C[3], null, C[4], C[5], null, C[6], C[0]],
    // Row 18
    [C[1], C[2], C[3], C[4], C[5], C[6], C[0], null, null, C[1]],
    // Row 19 – bottom floor, mostly filled
    [C[2], C[3], C[4], C[5], C[6], C[0], C[1], C[2], C[3], C[4]],
];

for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 10; x++) {
        const px = document.createElement("div");
        px.className = `splash-pixel sx-${x} sy-${y}`;
        const color = PREVIEW_BOARD[y][x];
        if (color) {
            px.classList.add("occupied");
            px.style.background = color;
        }
        previewBoard.append(px);
    }
}

const demoLabel = document.createElement("div");
demoLabel.className = "preview-demo-label";
demoLabel.textContent = "DEMO";
previewWrapper.append(demoLabel, previewBoard);
splashRight.append(previewWrapper);

startScreen.append(statusLeft, statusRight, splashLeft, splashRight);
root.append(startScreen);

// --- Splash board simulation (rAF-driven) ---
const SPLASH_DEFS = [
    { offsets: [{x:-2,y:0},{x:-1,y:0},{x:0,y:0},{x:1,y:0}], colour: "#5ad9ff" },
    { offsets: [{x:-1,y:0},{x:0,y:0},{x:-1,y:1},{x:0,y:1}], colour: "#ffd23f" },
    { offsets: [{x:-1,y:0},{x:-1,y:1},{x:-1,y:2},{x:0,y:2}], colour: "#ff9128" },
    { offsets: [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:0,y:1}], colour: "#c93dff" },
    { offsets: [{x:-1,y:0},{x:0,y:0},{x:0,y:1},{x:1,y:1}], colour: "#ff3a55" },
    { offsets: [{x:1,y:0},{x:0,y:0},{x:0,y:1},{x:-1,y:1}], colour: "#5cff7a" },
    { offsets: [{x:1,y:0},{x:1,y:1},{x:1,y:2},{x:0,y:2}], colour: "#3a5cff" },
];

let splashPiece = null;
let splashRAF = null;
let splashLastFall = 0;
let splashLastDrift = 0;

function splashCell(x, y) {
    return previewBoard.querySelector(`.sx-${x}.sy-${y}`);
}

function splashOccupied(x, y) {
    if (x < 0 || x >= 10 || y >= 20) return true;
    if (y < 0) return false;
    const cell = splashCell(x, y);
    return cell && cell.classList.contains("occupied");
}

function splashErase() {
    splashPiece.blocks.forEach(b => {
        const cell = splashCell(b.x, b.y);
        if (cell && !cell.classList.contains("occupied")) {
            cell.removeAttribute("style");
        }
    });
}

function splashColour() {
    splashPiece.blocks.forEach(b => {
        const cell = splashCell(b.x, b.y);
        if (cell) {
            cell.style.background = splashPiece.colour;
            cell.style.border = "2px solid rgba(255,255,255,0.4)";
            cell.style.borderTopColor = "rgba(255,255,255,0.6)";
            cell.style.borderLeftColor = "rgba(255,255,255,0.5)";
            cell.style.borderBottomColor = "rgba(0,0,0,0.3)";
            cell.style.borderRightColor = "rgba(0,0,0,0.2)";
        }
    });
}

function splashSpawn() {
    const def = SPLASH_DEFS[Math.floor(Math.random() * 7)];
    const blocks = def.offsets.map(o => ({ x: 5 + o.x, y: o.y }));
    if (blocks.some(b => splashOccupied(b.x, b.y))) return null;
    return { blocks, colour: def.colour };
}

function splashClearLines() {
    for (let y = 19; y >= 0; y--) {
        let full = true;
        for (let x = 0; x < 10; x++) {
            if (!splashOccupied(x, y)) { full = false; break; }
        }
        if (full) {
            for (let row = y; row > 0; row--) {
                for (let x = 0; x < 10; x++) {
                    const above = splashCell(x, row - 1);
                    const cur = splashCell(x, row);
                    if (above && above.classList.contains("occupied")) {
                        cur.classList.add("occupied");
                        cur.style.background = above.style.background;
                    } else {
                        cur.classList.remove("occupied");
                        cur.style.background = "var(--grey)";
                    }
                }
            }
            for (let x = 0; x < 10; x++) {
                const cell = splashCell(x, 0);
                cell.classList.remove("occupied");
                cell.style.background = "var(--grey)";
            }
            y++;
        }
    }
}

function splashReset() {
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            const cell = splashCell(x, y);
            const color = PREVIEW_BOARD[y][x];
            if (color) {
                cell.classList.add("occupied");
                cell.style.background = color;
            } else {
                cell.classList.remove("occupied");
                cell.style.background = "var(--grey)";
            }
        }
    }
}

function splashFall() {
    const willLock = splashPiece.blocks.some(b => splashOccupied(b.x, b.y + 1));
    if (willLock) {
        splashPiece.blocks.forEach(b => {
            const cell = splashCell(b.x, b.y);
            if (cell) {
                cell.classList.add("occupied");
                cell.style.cssText = `background: ${splashPiece.colour}`;
            }
        });
        splashClearLines();
        splashPiece = splashSpawn();
        if (!splashPiece) {
            splashReset();
            splashPiece = splashSpawn();
        }
        if (splashPiece) splashColour();
        return;
    }
    splashErase();
    splashPiece.blocks.forEach(b => b.y += 1);
    splashColour();
}

function splashDrift() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (splashPiece.blocks.every(b => !splashOccupied(b.x + dir, b.y))) {
        splashErase();
        splashPiece.blocks.forEach(b => b.x += dir);
        splashColour();
    }
}

function splashLoop(timestamp) {
    if (started) return;
    if (timestamp - splashLastFall >= 500) {
        if (splashPiece) splashFall();
        splashLastFall = timestamp;
    }
    if (timestamp - splashLastDrift >= 800) {
        if (splashPiece) splashDrift();
        splashLastDrift = timestamp;
    }
    splashRAF = requestAnimationFrame(splashLoop);
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    splashPiece = splashSpawn();
    if (splashPiece) splashColour();
    splashRAF = requestAnimationFrame(splashLoop);
}

// scoreArea — SCORE + TIME stat panels (left rail)
const scorePanel = document.createElement("div");
scorePanel.className = "stat-panel score";
const scoreLabelEl = document.createElement("div");
scoreLabelEl.className = "stat-label";
scoreLabelEl.textContent = "SCORE";
const scoreDisplay = document.createElement("p");
scoreDisplay.id = "score-display";
scoreDisplay.className = "stat-value";
scoreDisplay.textContent = `${score}`;
scorePanel.append(scoreLabelEl, scoreDisplay);

const timePanel = document.createElement("div");
timePanel.className = "stat-panel time";
const timeLabelEl = document.createElement("div");
timeLabelEl.className = "stat-label";
timeLabelEl.textContent = "TIME";
const timeDisplay = document.createElement("p");
timeDisplay.id = "time-display";
timeDisplay.className = "stat-value";
timeDisplay.textContent = `00:00`;
timePanel.append(timeLabelEl, timeDisplay);

box1.className = "score-box hidden";
box1.append(scorePanel, timePanel);

root.append(box1);
root.append(box2);
root.append(box3);

// gameBoard
const gameBoard = new gameArea(10, 20);
const gameBoardElement = gameBoard.generateTable();
gameBoardElement.className = "game-table";
box2.className = "game-box hidden";
box3.className = "side-box hidden";
box2.append(gameBoardElement);

// Reserved NEXT panel (right rail)
box3.innerHTML = `
    <div class="stat-panel next-panel">
        <div class="stat-label">NEXT<span class="soon-badge">SOON</span></div>
        <div class="next-placeholder">
            <div></div><div></div><div></div><div></div>
            <div></div><div></div><div></div><div></div>
        </div>
        <p class="next-hint">preview piece pending</p>
    </div>
`;

// Persistent top bar (spans all columns; hidden until the game starts)
const topBar = document.createElement("div");
topBar.id = "top-bar";
topBar.classList.add("hidden");
const topBarLeft = document.createElement("div");
topBarLeft.className = "top-bar-left";
const playDot = document.createElement("span");
playDot.className = "play-dot";
topBarLeft.append(playDot, document.createTextNode("NOW PLAYING"));
const topBarTitle = document.createElement("div");
topBarTitle.className = "top-bar-title";
topBarTitle.textContent = "TETRIS";
const topBarRight = document.createElement("div");
topBarRight.className = "top-bar-right";
topBarRight.textContent = "ESC · PAUSE";   // keyboard hint (desktop only)
topBar.append(topBarLeft, topBarTitle, topBarRight);
root.prepend(topBar);

// PAUSED indicator (inside game board wrapper)
const pausedIndicator = document.createElement("div");
pausedIndicator.id = "paused-indicator";
pausedIndicator.textContent = "PAUSED";
box2.append(pausedIndicator);

// ---- Pause menu overlay ----
const pauseMenu = document.createElement("div");
pauseMenu.id = "pause-menu";

const pauseMenuCard = document.createElement("div");
pauseMenuCard.className = "pause-menu-card";

const pauseDots = document.createElement("div");
pauseDots.className = "pause-dots";
pauseDots.textContent = "● ● ●";

const pauseMenuHeading = document.createElement("h2");
pauseMenuHeading.textContent = "PAUSED";

// Score / time readout (mirrors the live display; updated from the game loop)
const pauseScoreRow = document.createElement("div");
pauseScoreRow.className = "pause-score-row";
const pauseScoreCol = document.createElement("div");
const pauseScoreLabel = document.createElement("div");
pauseScoreLabel.className = "ps-label";
pauseScoreLabel.textContent = "SCORE";
const pauseScoreValue = document.createElement("div");
pauseScoreValue.className = "ps-value";
pauseScoreValue.textContent = "0";
pauseScoreCol.append(pauseScoreLabel, pauseScoreValue);
const pauseTimeCol = document.createElement("div");
const pauseTimeLabel = document.createElement("div");
pauseTimeLabel.className = "ps-label";
pauseTimeLabel.textContent = "TIME";
const pauseTimeValue = document.createElement("div");
pauseTimeValue.className = "ps-value";
pauseTimeValue.textContent = "00:00";
pauseTimeCol.append(pauseTimeLabel, pauseTimeValue);
pauseScoreRow.append(pauseScoreCol, pauseTimeCol);

pauseMenuCard.append(pauseDots, pauseMenuHeading, pauseScoreRow);

const pauseMenuActions = document.createElement("div");
pauseMenuActions.className = "pause-menu-actions";

const btnResume = document.createElement("button");
btnResume.id = "btn-resume";
btnResume.type = "button";
btnResume.textContent = "RESUME";

const btnRestart = document.createElement("button");
btnRestart.id = "btn-restart";
btnRestart.type = "button";
btnRestart.textContent = "RESTART";

const btnEnd = document.createElement("button");
btnEnd.id = "btn-end";
btnEnd.type = "button";
btnEnd.textContent = "END GAME";

pauseMenuActions.append(btnResume, btnRestart, btnEnd);

const pauseMenuConfirm = document.createElement("div");
pauseMenuConfirm.className = "pause-menu-confirm hidden";

const confirmText = document.createElement("p");
confirmText.textContent = "Restart the game?";

const btnConfirmYes = document.createElement("button");
btnConfirmYes.id = "btn-confirm-yes";
btnConfirmYes.type = "button";
btnConfirmYes.textContent = "YES";

const btnConfirmNo = document.createElement("button");
btnConfirmNo.id = "btn-confirm-no";
btnConfirmNo.type = "button";
btnConfirmNo.textContent = "NO";

pauseMenuConfirm.append(confirmText, btnConfirmYes, btnConfirmNo);

const pauseMenuFooter = document.createElement("div");
pauseMenuFooter.className = "pause-menu-footer";
pauseMenuFooter.textContent = "ESC · RESUME";

pauseMenuCard.append(pauseMenuActions, pauseMenuConfirm, pauseMenuFooter);
pauseMenu.append(pauseMenuCard);
root.append(pauseMenu);

// Focus trap handler while paused
const focusTrapHandler = function(e) {
    if (e.key !== "Tab") return;
    // Determine currently-visible focusable buttons
    const visibleButtons = !pauseMenuConfirm.classList.contains("hidden")
        ? [btnConfirmYes, btnConfirmNo]
        : [btnResume, btnRestart, btnEnd];
    const first = visibleButtons[0];
    const last = visibleButtons[visibleButtons.length - 1];
    if (e.shiftKey) {
        if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    } else {
        if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
};

const showPauseMenuActions = function() {
    pauseMenuConfirm.classList.add("hidden");
    pauseMenuActions.classList.remove("hidden");
};

const showPauseMenuConfirm = function() {
    pauseMenuActions.classList.add("hidden");
    pauseMenuConfirm.classList.remove("hidden");
    btnConfirmNo.focus();
};

const pauseGame = function() {
    if (!started || paused) return;
    paused = true;
    cancelAnimationFrame(loopID);
    gameTimer.pauseTimer();
    pausedIndicator.classList.add("show");
    pauseMenu.classList.add("show");
    showPauseMenuActions();
    btnResume.focus();
    document.addEventListener("keydown", focusTrapHandler);
};

const resumeGame = function() {
    if (!paused) return;
    paused = false;
    gameTimer.continueTimer();
    loop.reset();
    pausedIndicator.classList.remove("show");
    pauseMenu.classList.remove("show");
    document.removeEventListener("keydown", focusTrapHandler);
    loopID = requestAnimationFrame(gameLoop);
};

const restartGame = function() {
    // hide menu and indicator
    pauseMenu.classList.remove("show");
    pausedIndicator.classList.remove("show");
    document.removeEventListener("keydown", focusTrapHandler);
    showPauseMenuActions();
    paused = false;

    // clear the board
    const pixels = gameBoardElement.querySelectorAll(".table-pixel");
    pixels.forEach((px) => {
        if (px.classList.contains("bottom-boundary")) return;
        px.classList.remove("occupied");
        px.style.background = "";
    });

    // reset score + display
    resetScore();
    scoreDisplay.textContent = `${score}`;

    // reset timer
    gameTimer = new timer(Date.now());
    timeDisplay.textContent = `00:00`;

    // respawn
    curBlocks = tetrisBlock.newBlocks(curBlocks, gameBoard);

    // reset loop + start
    loop.reset();
    started = true;
    loopID = requestAnimationFrame(gameLoop);
};

// Wire up pause menu buttons
btnResume.addEventListener("click", resumeGame);
btnRestart.addEventListener("click", showPauseMenuConfirm);
btnConfirmYes.addEventListener("click", restartGame);
btnConfirmNo.addEventListener("click", () => {
    showPauseMenuActions();
    btnResume.focus();
});
btnEnd.addEventListener("click", () => {
    pauseMenu.classList.remove("show");
    pausedIndicator.classList.remove("show");
    document.removeEventListener("keydown", focusTrapHandler);
    paused = false;
    gameover();
});

const slowDrop = function() {
    // console.log("slow");
    curBlocks.erase();
    const rBlocks = curBlocks.fall(curBlocks, gameBoard);
    if (rBlocks) {
        curBlocks = rBlocks;
    }
    curBlocks.colour();
    // timeoutID = setTimeout(() => {
    //     globalID = requestAnimationFrame(slowDrop);
    // }, 500);
    return;
};

const fastDrop = function() {
    loop.requestFastDrop();
};

const moveRight = function() {
    console.log("Mv Right");
    curBlocks.erase();
    curBlocks.mvRight(gameBoard.getMaxX);
    curBlocks.colour();
    // mvRight += 10;
    // blockGroup.style.right = `${mvRight}px`;
}

const moveLeft = function() {
    console.log("Mv Left");
    curBlocks.erase();
    curBlocks.mvLeft();
    curBlocks.colour();
    // mvLeft += 10;
    // blockGroup.style.right = `${mvLeft}px`;
}

const rotateTBlock = function() {
    console.log(`rotate! ${curBlocks.shape}`);
    if (curBlocks.shape === "sq") {
        return;
    }
    console.log("rotate non sq");
    curBlocks.erase();
    curBlocks.rotate(gameBoard);
    curBlocks.colour();
}



document.addEventListener("keydown", (e) => {
    // Only allow controls if game has started
    if (!started) return;
    if (paused) return;

    if (e.key === "ArrowDown") {
        console.log("fastDrop");
        fastDrop();
    }
    if (e.key === "ArrowRight") {
        console.log("Right");
        moveRight();
    }
    if (e.key === "ArrowLeft") {
        console.log("Left");
        moveLeft();
    }
    if (e.key === "ArrowUp") {
        console.log("Up, rotate");
        rotateTBlock();
    }
});

const gameLoop = function(timestamp) {
    if (!started) return;

    timeDisplay.textContent = `${gameTimer.time}`;
    scoreDisplay.textContent = `${score}`;
    pauseScoreValue.textContent = `${score}`;
    pauseTimeValue.textContent = `${gameTimer.time}`;

    if (loop.tick(timestamp)) {
        slowDrop();

        if (curBlocks.endGame) {
            gameover();
            return;
        }
        if (curBlocks.endSoon) {
            scoreBoardDiv.style.willChange = "opacity";
        }
    }

    loopID = requestAnimationFrame(gameLoop);
};

// Start game handler (shared by ENTER key and START button)
function startGame() {
    if (started) return;
    started = true;
    cancelAnimationFrame(splashRAF);
    // Hide start screen
    const screen = document.getElementById("start-screen");
    if (screen) {
        screen.style.opacity = "0";
        setTimeout(() => { screen.style.display = "none"; }, 500);
    }
    // Show game elements
    topBar.classList.remove("hidden");
    box1.classList.remove("hidden");
    box2.classList.remove("hidden");
    box3.classList.remove("hidden");
    document.getElementById("touch-controls")?.classList.add("playing");
    gameTimer = new timer(Date.now());
    loop.reset();
    loopID = requestAnimationFrame(gameLoop);
}

startBtn.addEventListener("click", startGame);

// press "Enter" to start game
document.addEventListener("keydown", (e) => {
    // Don't start game if scoreboard is visible (player might be typing)
    if (scoreBoardDiv.classList.contains("show")) {
        return;
    }
    if (e.key === "Enter") {
        startGame();
    }
});

curBlocks = tetrisBlock.newBlocks(curBlocks, gameBoard);
// gameTimer = new timer(Date.now()); // not the same as the one runninng
    // next coming up window
    // const comingUp = document.createElement("div");
    // comingUp.classList.add("coming-up");
    // comingUp.style.position = "fixed";
    // comingUp.style.top = "100px";
    // comingUp.style.left = `${document.documentElement.clientWidth - 100}px`;
    // comingUp.textContent = "block shape";
    // wrapper.append(comingUp);

const enterPlayerName = function() {
    timeInput.setAttribute("value", `${timeDisplay.textContent}`);
    scoreInput.setAttribute("value", `${score}`);
    setId();
    scoreBoardDiv.classList.add("show");
    scoreBoardDiv.style.willChange = "auto";
}

// Open menu (only works if game has started)
document.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && started && !paused) {
        console.log("Backspace");
        gameover();
    }
});

// Toggle pause from any source (ESC key or on-screen button)
const togglePause = function() {
    if (!started) return;
    if (scoreBoardDiv.classList.contains("show")) return;
    if (paused) {
        resumeGame();
    } else {
        pauseGame();
    }
};

// Escape key: toggle pause menu
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    togglePause();
});

// On-screen pause button — sits in the touch-controls bar, between the
// d-pad and rotate, so it's within thumb reach on phones/tablets.
const pauseBtn = document.getElementById("btn-pause");
if (pauseBtn) {
    pauseBtn.addEventListener("click", togglePause);
    pauseBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        togglePause();
    }, { passive: false });
}

const gameover = function() {
    cancelAnimationFrame(loopID);
    enterPlayerName();
}
// temp game over

// const returnHome = function() {
//     // Hide scoreboard
//     scoreBoardDiv.classList.remove("show");

//     // Stop any running game loop and reset flags
//     cancelAnimationFrame(loopID);
//     started = false;
//     paused = false;

//     // Clear the game board (preserve bottom boundary)
//     const pixels = gameBoardElement.querySelectorAll(".table-pixel");
//     pixels.forEach((px) => {
//         if (px.classList.contains("bottom-boundary")) return;
//         px.classList.remove("occupied");
//         px.style.background = "";
//     });

//     // Reset score and displays
//     resetScore();
//     scoreDisplay.textContent = `${score}`;
//     timeDisplay.textContent = `00:00`;

//     // Hide game UI, restore start screen
//     topBar.classList.add("hidden");
//     box1.classList.add("hidden");
//     box2.classList.add("hidden");
//     box3.classList.add("hidden");
//     document.getElementById("touch-controls")?.classList.remove("playing");
//     const screen = document.getElementById("start-screen");
//     if (screen) {
//         screen.style.display = "";
//         screen.style.opacity = "";
//     }

//     // Prepare next game's starting piece
//     curBlocks = tetrisBlock.newBlocks(curBlocks, gameBoard);

//     // Restart splash animation
//     if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
//         splashReset();
//         splashPiece = splashSpawn();
//         if (splashPiece) splashColour();
//         splashLastFall = 0;
//         splashLastDrift = 0;
//         splashRAF = requestAnimationFrame(splashLoop);
//     }
// };

// returnHomeBtn.addEventListener("click", returnHome);

// ---- Mobile touch controls ----
const touchMap = {
    "btn-left":   moveLeft,
    "btn-right":  moveRight,
    "btn-down":   fastDrop,
    "btn-rotate": rotateTBlock,
};

Object.entries(touchMap).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (!started || paused) return;
        fn();
    }, { passive: false });
    // Click fallback (e.g. desktop testing / non-touch devices)
    el.addEventListener("click", () => {
        if (!started || paused) return;
        fn();
    });
});
