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

// Piece colours for block-letter styling
const PIECE_COLORS = ['#00CED1','#FFD700','#FF8C00','#DA70D6','#FF6B6B','#90EE90','#6495ED'];

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

// --- Left column ---
const splashLeft = document.createElement("div");
splashLeft.className = "splash-left";

const titleEl = document.createElement("h1");
titleEl.className = "splash-title";
"TETRIS".split("").forEach((ch, i) => {
    const span = document.createElement("span");
    span.className = "block-letter";
    span.textContent = ch;
    span.style.setProperty("--letter-color", titleColors[i]);
    titleEl.append(span);
});

const controls = document.createElement("div");
controls.className = "splash-controls";
controls.innerHTML = `
    <p class="controls-heading">Controls:</p>
    <p>UP Arrow - Rotate</p>
    <p>LEFT / RIGHT - Move</p>
    <p>DOWN Arrow - Fast Drop</p>
    <p>Backspace - Open Menu</p>
    <p class="splash-enter-hint">Press ENTER to Start</p>
`;

const startBtn = document.createElement("button");
startBtn.id = "start-btn";
startBtn.className = "splash-cta";
"START".split("").forEach((ch, i) => {
    const span = document.createElement("span");
    span.className = "cta-letter";
    span.textContent = ch;
    span.style.setProperty("--letter-color", ctaColors[i]);
    startBtn.append(span);
});

splashLeft.append(titleEl, controls, startBtn);

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

previewWrapper.append(previewBoard);
splashRight.append(previewWrapper);

startScreen.append(splashLeft, splashRight);
root.append(startScreen);

// --- Splash board simulation (rAF-driven) ---
const SPLASH_DEFS = [
    { offsets: [{x:-2,y:0},{x:-1,y:0},{x:0,y:0},{x:1,y:0}], colour: "#00CED1" },
    { offsets: [{x:-1,y:0},{x:0,y:0},{x:-1,y:1},{x:0,y:1}], colour: "#FFD700" },
    { offsets: [{x:-1,y:0},{x:-1,y:1},{x:-1,y:2},{x:0,y:2}], colour: "#FF8C00" },
    { offsets: [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:0,y:1}], colour: "#DA70D6" },
    { offsets: [{x:-1,y:0},{x:0,y:0},{x:0,y:1},{x:1,y:1}], colour: "#FF6B6B" },
    { offsets: [{x:1,y:0},{x:0,y:0},{x:0,y:1},{x:-1,y:1}], colour: "#90EE90" },
    { offsets: [{x:1,y:0},{x:1,y:1},{x:1,y:2},{x:0,y:2}], colour: "#6495ED" },
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

// scoreArea
const scoreArea = document.createElement("div");
const scoreDisplay = document.createElement("p");
scoreDisplay.id = "score-display";
scoreDisplay.textContent = `Score: ${score}`;
scoreDisplay.className = "text-2xl md:text-4xl font-arcade text-game-yellow mb-4";
scoreDisplay.style.textShadow = "2px 2px 0 #FF8C00";
// const timeText = document.createElement("p");
// timeText.textContent = "Time";
// timeText.style.display = "span";
const timeDisplay = document.createElement("p");
timeDisplay.textContent = `00:00`;
timeDisplay.id = "time-display";
timeDisplay.className = "text-xl md:text-3xl font-arcade text-game-teal";
scoreArea.className = "bg-game-card/90 backdrop-blur-sm border-4 border-game-yellow rounded-xl p-4 md:p-6 shadow-[0_0_30px_rgba(255,215,0,0.3)] w-full max-w-[280px]";
scoreArea.append(scoreDisplay,  timeDisplay);
box1.className = "score-box flex items-center justify-center p-2 md:p-4 hidden";
box1.append(scoreArea);

root.append(box1);
root.append(box2);
root.append(box3);

// gameBoard
const gameBoard = new gameArea(10, 20);
const gameBoardElement = gameBoard.generateTable();
gameBoardElement.className = "game-table border-4 border-game-yellow rounded-lg shadow-[0_0_40px_rgba(255,215,0,0.4)] bg-game-dark/70 p-2";
box2.className = "game-box flex items-center justify-center p-2 md:p-4 hidden";
box3.className = "side-box hidden";
box2.append(gameBoardElement);

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

const pauseMenuHeading = document.createElement("h2");
pauseMenuHeading.textContent = "PAUSED";
pauseMenuCard.append(pauseMenuHeading);

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

pauseMenuCard.append(pauseMenuActions, pauseMenuConfirm);
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
    scoreDisplay.textContent = `Score: ${score}`;

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
    scoreDisplay.textContent = `Score: ${score}`;

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
    box1.classList.remove("hidden");
    box2.classList.remove("hidden");
    box3.classList.remove("hidden");
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

// Escape key: toggle pause menu
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!started) return;
    if (scoreBoardDiv.classList.contains("show")) return;
    if (paused) {
        resumeGame();
    } else {
        pauseGame();
    }
});

const gameover = function() {
    cancelAnimationFrame(loopID);
    enterPlayerName();
}
// temp game over
