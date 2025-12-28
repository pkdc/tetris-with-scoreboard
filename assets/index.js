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
startScreen.className = "fixed inset-0 bg-game-darker/95 backdrop-blur-sm z-50 flex items-center justify-center p-4";
startScreen.id = "start-screen";

const startContent = document.createElement("div");
startContent.className = "text-center space-y-6 max-w-md w-full px-4";

const title = document.createElement("h1");
title.className = "text-4xl md:text-6xl font-black text-game-accent mb-8 drop-shadow-[0_0_20px_rgba(0,255,136,0.8)]";
title.textContent = "TETRIS";
title.style.letterSpacing = "8px";

const instructions = document.createElement("div");
instructions.className = "text-base md:text-xl text-white space-y-3 mb-8";
instructions.innerHTML = `
    <p class="text-game-blue font-semibold">Controls:</p>
    <p>↑ Arrow - Rotate</p>
    <p>← → Arrows - Move</p>
    <p>↓ Arrow - Fast Drop</p>
    <p>Backspace - Open Menu</p>
    <p class="mt-6 text-game-accent font-bold text-xl md:text-2xl">Press ENTER to Start</p>
`;

startContent.append(title, instructions);
startScreen.append(startContent);
root.append(startScreen);

// scoreArea
const scoreArea = document.createElement("div");
const scoreDisplay = document.createElement("p");
scoreDisplay.id = "score-display";
scoreDisplay.textContent = `Score: ${score}`;
scoreDisplay.className = "text-xl md:text-3xl font-bold text-game-accent mb-4 drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]";
// const timeText = document.createElement("p");
// timeText.textContent = "Time";
// timeText.style.display = "span";
const timeDisplay = document.createElement("p");
timeDisplay.textContent = `00:00`;
timeDisplay.id = "time-display";
timeDisplay.className = "text-lg md:text-2xl font-semibold text-game-blue drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]";
scoreArea.className = "bg-game-dark/80 backdrop-blur-sm border-2 border-game-accent/50 rounded-xl p-4 md:p-6 shadow-[0_0_30px_rgba(0,255,136,0.3)] w-full max-w-[280px]";
scoreArea.append(scoreDisplay,  timeDisplay);
box1.className = "score-box flex items-center justify-center p-2 md:p-4";
box1.append(scoreArea);

root.append(box1);
root.append(box2);
root.append(box3);

// gameBoard
const gameBoard = new gameArea(10, 20);
const gameBoardElement = gameBoard.generateTable();
gameBoardElement.className = "game-table border-4 border-game-purple/70 rounded-lg shadow-[0_0_40px_rgba(139,92,246,0.5)] bg-game-dark/50 p-2";
box2.className = "game-box flex items-center justify-center p-2 md:p-4";
box3.className = "side-box";
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
            gameTimer = new timer(Date.now());
            run();
            // startedID = requestAnimationFrame(run);
        }
    }
});

curBlocks = tetrisBlock.newBlocks(curBlocks, gameBoard);
// gameTimer = new timer(Date.now()); // not the same as the one runninng
    // next comming up window
    // const commingUp = document.createElement("div");
    // commingUp.classList.add("comming-up");
    // commingUp.style.position = "fixed";
    // commingUp.style.top = "100px";
    // commingUp.style.left = `${document.documentElement.clientWidth - 100}px`;
    // commingUp.textContent = "block shape";
    // wrapper.append(commingUp);

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
