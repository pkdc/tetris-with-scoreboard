"use strict";

import gameArea from './table.js';
import {score, setId, scoreBoardDiv, timeInput, scoreInput} from './scoreboard.js';
import tetrisBlock from './tetris-block.js';
import timer from './timer.js';

let wait;
let prevTime;
let runID, waitID;
let started = false;
let curBlocks;
let gameTimer;
let totalLines = 0;
let level = 1;

const root = document.querySelector("#root");

const box1 = document.createElement("div");
const box2 = document.createElement("div");
const box3 = document.createElement("div");

// =============================================
// START SCREEN - Animated with falling blocks
// =============================================
const startScreen = document.createElement("div");
startScreen.id = "start-screen";
startScreen.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 15, 26, 0.97);
    backdrop-filter: blur(6px);
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow: hidden;
`;

// Animated background blocks on start screen
const startBg = document.createElement("div");
startBg.className = "start-bg-blocks";
startScreen.append(startBg);

const startContent = document.createElement("div");
startContent.style.cssText = "text-align: center; max-width: 32rem; width: 100%; padding: 0 1rem; position: relative; z-index: 2;";

const title = document.createElement("h1");
title.textContent = "TETRIS";
title.className = "start-title";

const subtitle = document.createElement("p");
subtitle.textContent = "CLASSIC ARCADE";
subtitle.className = "start-subtitle";

const instructions = document.createElement("div");
instructions.className = "start-instructions";
instructions.innerHTML = `
    <div class="controls-grid">
        <div class="control-item">
            <span class="control-key">&#9650;</span>
            <span class="control-label">Rotate</span>
        </div>
        <div class="control-item">
            <span class="control-key">&#9664; &#9654;</span>
            <span class="control-label">Move</span>
        </div>
        <div class="control-item">
            <span class="control-key">&#9660;</span>
            <span class="control-label">Fast Drop</span>
        </div>
        <div class="control-item">
            <span class="control-key">SPACE</span>
            <span class="control-label">Hard Drop</span>
        </div>
    </div>
    <p class="start-prompt">Press ENTER to Start</p>
`;

startContent.append(title, subtitle, instructions);
startScreen.append(startContent);
root.append(startScreen);

// =============================================
// SCORE / STATS PANEL (Left side)
// =============================================
const scoreArea = document.createElement("div");
scoreArea.className = "stats-panel";

const scoreDisplay = document.createElement("p");
scoreDisplay.id = "score-display";
scoreDisplay.textContent = `Score: 0`;
scoreDisplay.className = "stat-value stat-score";

const levelDisplay = document.createElement("p");
levelDisplay.id = "level-display";
levelDisplay.textContent = `Level: 1`;
levelDisplay.className = "stat-value stat-level";

const linesDisplay = document.createElement("p");
linesDisplay.id = "lines-display";
linesDisplay.textContent = `Lines: 0`;
linesDisplay.className = "stat-value stat-lines";

const timeDisplay = document.createElement("p");
timeDisplay.textContent = `00:00`;
timeDisplay.id = "time-display";
timeDisplay.className = "stat-value stat-time";

scoreArea.append(scoreDisplay, levelDisplay, linesDisplay, timeDisplay);
box1.className = "score-box flex items-center justify-center p-2 md:p-4 hidden";
box1.append(scoreArea);

root.append(box1);
root.append(box2);
root.append(box3);

// =============================================
// GAME BOARD
// =============================================
const gameBoard = new gameArea(10, 20);
const gameBoardElement = gameBoard.generateTable();
gameBoardElement.className = "game-table border-4 border-game-yellow rounded-lg shadow-[0_0_40px_rgba(255,215,0,0.4)] bg-game-dark/70 p-2";
box2.className = "game-box flex items-center justify-center p-2 md:p-4 hidden";
box2.append(gameBoardElement);

// =============================================
// SIDE PANEL - Next Piece Preview
// =============================================
const sidePanel = document.createElement("div");
sidePanel.className = "side-panel";

const nextLabel = document.createElement("p");
nextLabel.textContent = "NEXT";
nextLabel.className = "next-label";

const nextPieceContainer = document.createElement("div");
nextPieceContainer.className = "next-piece-container";
nextPieceContainer.id = "next-piece-preview";

// Create a 6x4 mini grid for next piece preview
for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 6; i++) {
        const pixel = document.createElement("div");
        pixel.className = "preview-pixel";
        pixel.dataset.x = i;
        pixel.dataset.y = j;
        nextPieceContainer.append(pixel);
    }
}

sidePanel.append(nextLabel, nextPieceContainer);
box3.className = "side-box flex items-center justify-center p-2 md:p-4 hidden";
box3.append(sidePanel);

// =============================================
// MOBILE TOUCH CONTROLS
// =============================================
const touchControls = document.createElement("div");
touchControls.className = "touch-controls hidden";
touchControls.innerHTML = `
    <div class="touch-row">
        <button class="touch-btn" data-action="rotate" aria-label="Rotate">&#8635;</button>
    </div>
    <div class="touch-row">
        <button class="touch-btn" data-action="left" aria-label="Move Left">&#9664;</button>
        <button class="touch-btn touch-btn-down" data-action="down" aria-label="Fast Drop">&#9660;</button>
        <button class="touch-btn" data-action="right" aria-label="Move Right">&#9654;</button>
    </div>
    <div class="touch-row">
        <button class="touch-btn touch-btn-drop" data-action="harddrop" aria-label="Hard Drop">DROP</button>
    </div>
`;
document.body.append(touchControls);

// Touch control event handlers
touchControls.querySelectorAll(".touch-btn").forEach(btn => {
    const action = btn.dataset.action;
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (!started) return;
        switch(action) {
            case "left": moveLeft(); break;
            case "right": moveRight(); break;
            case "down": fastDrop(); break;
            case "rotate": rotateTBlock(); break;
            case "harddrop": hardDrop(); break;
        }
    });
    // Also support click for testing
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!started) return;
        switch(action) {
            case "left": moveLeft(); break;
            case "right": moveRight(); break;
            case "down": fastDrop(); break;
            case "rotate": rotateTBlock(); break;
            case "harddrop": hardDrop(); break;
        }
    });
});

// =============================================
// GAME LOGIC
// =============================================

// Get drop speed based on level
function getDropSpeed() {
    // Speed increases with level: 1000ms at level 1, faster each level
    return Math.max(100, 1000 - (level - 1) * 80);
}

// Update level based on lines cleared
function updateLevel(prevLines, newLines) {
    const linesCleared = newLines - prevLines;
    totalLines = newLines;
    // Level up every 10 lines
    level = Math.floor(totalLines / 10) + 1;
    levelDisplay.textContent = `Level: ${level}`;
    linesDisplay.textContent = `Lines: ${totalLines}`;

    // Trigger line clear animation if lines were cleared
    if (linesCleared > 0) {
        triggerLineClearEffect(linesCleared);
    }
}

// Line clear flash effect
function triggerLineClearEffect(numLines) {
    const gameTable = document.querySelector(".game-table");
    if (!gameTable) return;

    gameTable.classList.add("line-clear-flash");
    if (numLines >= 4) {
        gameTable.classList.add("tetris-clear");
    }
    setTimeout(() => {
        gameTable.classList.remove("line-clear-flash", "tetris-clear");
    }, 400);
}

// Update next piece preview
function updateNextPiecePreview() {
    const previewPixels = nextPieceContainer.querySelectorAll(".preview-pixel");
    previewPixels.forEach(p => {
        p.style.background = "transparent";
        p.classList.remove("preview-active");
    });

    const nextInfo = tetrisBlock.getNextPieceInfo();
    if (!nextInfo) return;

    // Map piece coordinates to preview grid (centered)
    const coords = [
        {x: nextInfo.x1, y: nextInfo.y1},
        {x: nextInfo.x2, y: nextInfo.y2},
        {x: nextInfo.x3, y: nextInfo.y3},
        {x: nextInfo.x4, y: nextInfo.y4},
    ];

    // Find bounding box to center in preview
    const minX = Math.min(...coords.map(c => c.x));
    const maxX = Math.max(...coords.map(c => c.x));
    const minY = Math.min(...coords.map(c => c.y));
    const maxY = Math.max(...coords.map(c => c.y));
    const pieceW = maxX - minX + 1;
    const pieceH = maxY - minY + 1;
    const offsetX = Math.floor((6 - pieceW) / 2) - minX;
    const offsetY = Math.floor((4 - pieceH) / 2) - minY;

    coords.forEach(c => {
        const px = c.x + offsetX;
        const py = c.y + offsetY;
        const pixel = nextPieceContainer.querySelector(`[data-x="${px}"][data-y="${py}"]`);
        if (pixel) {
            pixel.style.background = nextInfo.blockColour;
            pixel.classList.add("preview-active");
        }
    });
}

const slowDrop = function() {
    curBlocks.erase();
    const prevScore = score;
    const rBlocks = curBlocks.fall(curBlocks, gameBoard);
    if (rBlocks) {
        curBlocks = rBlocks;
        updateNextPiecePreview();
        // Check for line clears and update level
        if (score !== prevScore) {
            const linesFromScore = scoreToCumulativeLines(score);
            updateLevel(totalLines, linesFromScore);
        }
    }
    curBlocks.colour();
    return;
};

// Convert cumulative score to approximate total lines
function scoreToCumulativeLines(totalScore) {
    // Approximate - just track via the score changes
    return totalLines;
}

const fastDrop = function() {
    wait = 0;
};

// Hard drop - instantly drop piece to bottom
const hardDrop = function() {
    if (!curBlocks) return;
    curBlocks.erase();
    const ghostPositions = curBlocks.getGhostPositions();
    // Move piece to ghost position
    curBlocks.blocks.forEach((block, i) => {
        block.x = ghostPositions[i].x;
        block.y = ghostPositions[i].y;
    });
    curBlocks.colour();
    // Force immediate lock by triggering a drop
    wait = 0;
};

const moveRight = function() {
    curBlocks.erase();
    curBlocks.mvRight(gameBoard.getMaxX);
    curBlocks.colour();
}

const moveLeft = function() {
    curBlocks.erase();
    curBlocks.mvLeft();
    curBlocks.colour();
}

const rotateTBlock = function() {
    if (curBlocks.shape === "sq") {
        return;
    }
    curBlocks.erase();
    curBlocks.rotate(gameBoard);
    curBlocks.colour();
}

document.addEventListener("keydown", (e) => {
    if (!started) return;

    if (e.key === "ArrowDown") {
        fastDrop();
    }
    if (e.key === "ArrowRight") {
        moveRight();
    }
    if (e.key === "ArrowLeft") {
        moveLeft();
    }
    if (e.key === "ArrowUp") {
        rotateTBlock();
    }
    if (e.key === " ") {
        e.preventDefault();
        hardDrop();
    }
});

const checkWait = function(timestamp) {
    if (!prevTime) {
        prevTime = timestamp;
    }

    let runtime = timestamp - prevTime;
    if (runtime >= wait) {
        slowDrop();
        runID = requestAnimationFrame(run);
    } else {
        waitID = requestAnimationFrame(checkWait);
    }
}

// Track lines in removeCompletedLines
const origRemoveCompletedLines = gameBoard.removeCompletedLines.bind(gameBoard);
gameBoard.removeCompletedLines = function(s) {
    const prevScore = s;
    const newScore = origRemoveCompletedLines(s);
    // Calculate lines cleared from score delta
    const delta = newScore - prevScore;
    let linesCleared = 0;
    if (delta === 100) linesCleared = 1;
    else if (delta === 300) linesCleared = 2;
    else if (delta === 700) linesCleared = 3;
    else if (delta === 1500) linesCleared = 4;

    if (linesCleared > 0) {
        totalLines += linesCleared;
        level = Math.floor(totalLines / 10) + 1;
        levelDisplay.textContent = `Level: ${level}`;
        linesDisplay.textContent = `Lines: ${totalLines}`;
        triggerLineClearEffect(linesCleared);
    }
    return newScore;
};

const run = function() {
    wait = getDropSpeed();
    prevTime = null;
    timeDisplay.textContent = `${gameTimer.time}`;
    scoreDisplay.textContent = `Score: ${score}`;
    if (curBlocks.endGame) {
        gameover();
        return;
    }
    if (curBlocks.endSoon) {
        scoreBoardDiv.style.willChange = "opacity";
    }
    waitID = requestAnimationFrame(checkWait);
}

// press "Enter" to start game
document.addEventListener("keydown", (e) => {
    if (scoreBoardDiv.classList.contains("show")) {
        return;
    }

    if (e.key === "Enter") {
        if (!started) {
            startGame();
        }
    }
});

function startGame() {
    started = true;
    // Hide start screen with animation
    const startScreen = document.getElementById("start-screen");
    if (startScreen) {
        startScreen.classList.add("fade-out");
        setTimeout(() => {
            startScreen.style.display = "none";
        }, 600);
    }
    // Show game elements with staggered animation
    box1.classList.remove("hidden");
    box2.classList.remove("hidden");
    box3.classList.remove("hidden");
    box1.classList.add("slide-in-left");
    box2.classList.add("scale-in");
    box3.classList.add("slide-in-right");

    // Show touch controls on mobile
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        touchControls.classList.remove("hidden");
    }

    gameTimer = new timer(Date.now());
    updateNextPiecePreview();
    run();
}

// Also allow clicking the start screen to start
startScreen.addEventListener("click", () => {
    if (!started) {
        startGame();
    }
});

curBlocks = tetrisBlock.newBlocks(curBlocks, gameBoard);

const enterPlayerName = function() {
    timeInput.setAttribute("value", `${timeDisplay.textContent}`);
    scoreInput.setAttribute("value", `${score}`);
    setId();
    scoreBoardDiv.classList.add("show");
    scoreBoardDiv.style.willChange = "auto";
}

// Open menu (Backspace or Escape)
document.addEventListener("keydown", (e) => {
    if ((e.key === "Backspace" || e.key === "Escape") && started) {
        gameover();
    }
})

const gameover = function() {
    cancelAnimationFrame(runID);
    cancelAnimationFrame(waitID);
    // Hide touch controls
    touchControls.classList.add("hidden");
    enterPlayerName();
}
