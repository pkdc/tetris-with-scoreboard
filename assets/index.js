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

const root = document.querySelector("#root");

const box1 = document.createElement("div");
const box2 = document.createElement("div");
const box3 = document.createElement("div");

// Create start screen overlay
const startScreen = document.createElement("div");
startScreen.id = "start-screen";
startScreen.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 15, 26, 0.95);
    backdrop-filter: blur(4px);
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
`;

const startContent = document.createElement("div");
startContent.style.cssText = "text-align: center; max-width: 28rem; width: 100%; padding: 0 1rem;";

const title = document.createElement("h1");
title.textContent = "TETRIS";
title.style.cssText = `
    font-family: 'Press Start 2P', cursive;
    font-size: clamp(2rem, 8vw, 4rem);
    color: #FFD700;
    margin-bottom: 2rem;
    letter-spacing: 4px;
    text-shadow: 4px 4px 0px #FF8C00, 0 0 30px rgba(255, 215, 0, 0.5);
`;

const instructions = document.createElement("div");
instructions.style.cssText = `
    font-family: 'VT323', monospace;
    font-size: clamp(1.2rem, 4vw, 1.5rem);
    color: white;
    line-height: 2;
    margin-bottom: 2rem;
`;
instructions.innerHTML = `
    <p style="color: #FF8C00; font-weight: 600; font-size: 1.5em; margin-bottom: 1rem;">Controls:</p>
    <p>UP Arrow - Rotate</p>
    <p>LEFT / RIGHT - Move</p>
    <p>DOWN Arrow - Fast Drop</p>
    <p>Backspace - Open Menu</p>
    <p style="margin-top: 2rem; color: #FFD700; font-family: 'Press Start 2P', cursive; font-size: 0.9em; animation: pulse 2s infinite;">Press ENTER to Start</p>
`;

startContent.append(title, instructions);
startScreen.append(startContent);
root.append(startScreen);

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
    wait = 0;
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

const checkWait = function(timestamp) {
    // if the fall is called right after the execution of the game (prevTime is falsy)
    // i.e. executes if just after falling one row
    if (!prevTime) {
        prevTime = timestamp;
    }

    let runtime = timestamp - prevTime;
    if (runtime >= wait) {
        slowDrop(); // fall a line if runtime of this round has exceeded the wait time (1 sec if slow, 0 if fast)
        runID = requestAnimationFrame(run);
    } else {
        // continue waiting, and listening to events
        waitID = requestAnimationFrame(checkWait);
    }
}

const run = function() {
    // after falling a line, reset prevTime and wait (in case it's changed by fast drop)
    wait = 1000;
    prevTime = null;
    console.log("in run");
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
    // Don't start game if scoreboard is visible (player might be typing)
    if (scoreBoardDiv.classList.contains("show")) {
        return;
    }

    if (e.key === "Enter") {
        // To prevent run being called multiple times
        if (!started) {
            started = true;
            // Hide start screen
            const startScreen = document.getElementById("start-screen");
            if (startScreen) {
                startScreen.style.opacity = "0";
                startScreen.style.transition = "opacity 0.5s ease";
                setTimeout(() => {
                    startScreen.style.display = "none";
                }, 500);
            }
            // Show game elements
            box1.classList.remove("hidden");
            box2.classList.remove("hidden");
            box3.classList.remove("hidden");
            gameTimer = new timer(Date.now());
            run();
            // startedID = requestAnimationFrame(run);
        }
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

// test
document.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
        console.log("Backspace");
        gameover();
    }
})

const gameover = function() {
    cancelAnimationFrame(runID);
    cancelAnimationFrame(waitID);
    enterPlayerName();
}
// temp game over
