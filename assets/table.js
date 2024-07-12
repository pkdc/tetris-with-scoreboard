class gameArea {
    constructor(maxX, maxY) {
        this.maxX = maxX;
        this.maxY = maxY;
    }
    // getters
    get getMaxX() {
        return this.maxX;
    }
    get getMaxY() {
        return this.maxY;
    }

    // setters
    set setMaxX(x) {
        this.maxX = x;
    }
    set setMaxY(y) {
        this.maxY = y;
    }

    removeCompletedLines = function(score) {
        let completedLines = 0;

        for (let j = this.maxY-1; j >= 0; j--) {
            const line = document.querySelectorAll(`.y-${j}`);
            let domBlockArr = [...line];
            let lineCompleted = true;
            lineCompleted = domBlockArr.every((el) => el.classList.contains("occupied"));
            console.log("Line completed", lineCompleted);

            if (lineCompleted) {
                completedLines += 1;
                score += 100;
                // line.forEach(el => el.remove());
            }
            // gameArea.addNewLine(); // not implemented yet
            console.log("Completed lines: ", completedLines);
        }
        // temp
        score += completedLines * 100;
        console.log("score: ", score);
        return score;
    };

    generateTable = function() {
        const gameTable = document.createElement("div");
        gameTable.classList.add("game-table");

        // create game table area
        // const maxY=20, maxX=10;
        for (let j = 0; j < this.maxY; j++) {
            for (let i = 0; i < this.maxX; i++) {
                const tablePixel = document.createElement("div");
                tablePixel.classList.add("table-pixel");
                tablePixel.classList.add(`x-${i}`);
                tablePixel.classList.add(`y-${j}`);
                // const pixelVal = document.createElement("input");
                // pixelVal.value = 0; // 0 means free, 1 means occupied
                // pixelVal.style.display = "none";
                // tablePixel.append(pixelVal);
                gameTable.append(tablePixel);
            }
        }
        for (let k = 0; k <this.maxX; k++) {
            const tablePixel = document.createElement("div");
                tablePixel.classList.add("table-pixel");
                tablePixel.classList.add(`x-${k}`);
                tablePixel.classList.add(`y-20`);
                tablePixel.classList.add("occupied");
                gameTable.append(tablePixel);
        }
        return gameTable;
    };

// const addNewLine = function() {

// };
}
export default gameArea;