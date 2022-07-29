"use strict"

let round = 0;
let score = 0;
let gameStartTime = Date.now();

const scoreArea = document.createElement("div");
scoreArea.classList.add("score-area");
scoreArea.textContent = `round: ${round}`;

const timer = function() {
    const playTime = Date.now() - gameStartTime;
    const min = Math.floor(playTime/60/1000%60).toString().padStart(2, "0");
    const sec = Math.floor(playTime/1000%60).toString().padStart(2, "0");
    scoreArea.textContent = `Score: ${score}, Round: ${round}, Time: ${min}:${sec}`;
}

const nextRound = function() {
    // if 4 lines, remove it, add score
    
    // if a line, remove it, add score
    for (let j = 0; j < maxY; j++) {
        const line = document.querySelectorAll(`.y-${j}`);
        let lineArr = [...line];
        console.log(lineArr);
        let wholeLine = true;
        wholeLine = lineArr.every((el) => el.classList.contains("occupied"));
        console.log("wholeLine", wholeLine);
        if (wholeLine) {
            score += 100;
            line.forEach(el => el.remove());
            
        }

    }

    round++;
};


