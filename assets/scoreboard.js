"use strict"

const recordUrl = "/record/";

export let score = 0;

export const nextRound = function(gameBoard) {
    // if 4 lines, remove it, add score

    // if a line, remove it, add score
    // console.log(gameBoard);
    score = gameBoard.removeCompletedLines(score);
    // score += 4; // temp
    // round++;
};

const showUnfilledPage = function(scoreTableRow, data, whichPage) {
    console.log("last unfilled page: ", Math.ceil(data.length/5)-1);
    let remainder = {};

    for (let i = 1; i <= data.length%5; i++) {
        console.log(`reverse ${5*whichPage+i} record : `, data[5*whichPage+i-1]);
        console.log("current remaider", remainder);
        const key = `${5*whichPage+i}`; // rank no need to -1
        let obj = {};
        obj[key] = data[5*whichPage+i-1]; // data array, need to -1
        remainder = Object.assign(remainder, obj);
    }
    console.log("remaider", remainder);
    for (const [key, remainRecord] of Object.entries(remainder)) {
        const rankLeader = document.createElement("div");
        rankLeader.classList.add("r-cell");
        rankLeader.classList.add("rank-leader-board");
        rankLeader.textContent = `${key}`;

        const nameLeader = document.createElement("div");
        nameLeader.classList.add("r-cell");
        nameLeader.classList.add("name-leader-board");
        nameLeader.textContent = `${remainRecord.pname}`;

        const scoreLeader = document.createElement("div");
        scoreLeader.classList.add("r-cell");
        scoreLeader.classList.add("score-leader-board");
        scoreLeader.textContent = `${remainRecord.score}`;

        const timeLeader = document.createElement("div");
        timeLeader.classList.add("r-cell");
        timeLeader.classList.add("time-leader-board");
        timeLeader.textContent = `${remainRecord.time}`;

        scoreTableRow.append(rankLeader, nameLeader, scoreLeader, timeLeader);
    }
}

const showFilledPage = function(scoreTableRow, data, whichPage) {
    for (let r = 5*whichPage; r < 5*(whichPage+1); r++) {
        const rankLeader = document.createElement("div");
        rankLeader.classList.add("r-cell");
        rankLeader.classList.add("rank-leader-board");
        rankLeader.textContent = `${r+1}`;

        const nameLeader = document.createElement("div");
        nameLeader.classList.add("r-cell");
        nameLeader.classList.add("name-leader-board");
        nameLeader.textContent = `${data[r].pname}`;

        const scoreLeader = document.createElement("div");
        scoreLeader.classList.add("r-cell");
        scoreLeader.classList.add("score-leader-board");
        scoreLeader.textContent = `${data[r].score}`;

        const timeLeader = document.createElement("div");
        timeLeader.classList.add("r-cell");
        timeLeader.classList.add("time-leader-board");
        timeLeader.textContent = `${data[r].time}`;

        scoreTableRow.append(rankLeader, nameLeader, scoreLeader, timeLeader);
    }
}

const showRows = function(scoreTableRow, data, whichPage) {
    console.log("data or foundRecord length:", data.length);
    if (data.length % 5 === 0) {
        showFilledPage(scoreTableRow, data, whichPage);
    } else {
        console.log("whichPage filled or unfilled: ", whichPage);
        console.log("Math.ceil(data.length/5)-1): ", Math.ceil(data.length/5)-1);
        if (whichPage === Math.ceil(data.length/5)-1) { // last page that is not full // bug:sFilledPage when shld be UnfilledPage
            showUnfilledPage(scoreTableRow, data, whichPage);
        } else {
            showFilledPage(scoreTableRow, data, whichPage);
        }
    }
    return scoreTableRow;
};

// const searchRecords = function(e) {
//     // console.log("search data: ", this);
//     const allRankedRecordsArr = Object.entries(this);
//     console.log("allRankedRecordsArr: ", allRankedRecordsArr);

//     const foundRecords = allRankedRecordsArr.filter((rankRec) => rankRec[1].pname.toLowerCase().includes(e.target.value.toLowerCase()));
//     console.log("foundRecords: ", foundRecords);
// };

const preventRefresh = function(e) {
    e.preventDefault();
};

// scoreboard
const updateScoreBoard = function(cur, data) {
    // console.log("Creating scoreBoard", data)
    recordForm.textContent = "";
    // remove submit handler
    recordForm.removeEventListener("submit", submitHandler);
    recordForm.addEventListener("submit", preventRefresh);

    const searchDiv = document.createElement("div");
    searchDiv.className = "search";
    const searchLabelDiv = document.createElement("div");
    searchLabelDiv.className = "search-label";
    const searchLabel = document.createElement("label");
    searchLabel.textContent = "Search records: ";
    searchLabel.setAttribute("for", "search");
    searchLabelDiv.append(searchLabel);
    const searchInputDiv = document.createElement("div");
    const searchInput = document.createElement("input");
    searchInput.setAttribute("id", "search");
    searchInput.setAttribute("type", "text");
    searchInput.setAttribute("name", "search");
    searchInput.setAttribute("placeholder", "Name");
    searchInput.className = "search-input";
    searchInputDiv.append(searchInput);
    searchDiv.append(searchLabelDiv, searchInputDiv);


    const scoreTableHeader = document.createElement("div");
    scoreTableHeader.classList.add("score-table-header");
    const header = ["Rank", "Name", "Score", "Time"];
    for (let h = 0; h < 4; h++) {
        const hCell = document.createElement("div");
        hCell.textContent = header[h];
        hCell.classList.add("h-cell");
        // h === 3 ? hCell.classList.add("h-cell-last") : hCell.classList.add("h-cell")
        scoreTableHeader.append(hCell);
    }

    // sort by score
    data.sort((a,b) => +a.score >= +b.score ? -1 : 1);

    let rankedData = {};
    for (const [rank, rec] of data.entries()) {
        rankedData[rank] = rec;
    }
    console.log("rD: ", rankedData);

    // const [curRecord] = data.filter((el) => el.id === +cur.id);

    const [curRecordRankMinusOne] = Object.keys(rankedData).filter((key) => rankedData[key].id === +cur.id);
    console.log("curRecordRank: ", curRecordRankMinusOne);
    const curRecordRank = +curRecordRankMinusOne + 1;
    const percent = Math.round(curRecordRank*100/data.length);

    const endMsgDiv = document.createElement("div");
    endMsgDiv.className = "mb-6";
    const endMsg = document.createElement("h2");
    endMsg.className = "text-2xl font-arcade text-game-yellow-light";
    endMsg.style.textShadow = "2px 2px 0 #E5A800";
    endMsg.textContent = `Congratz ${cur.pname} you are in the top ${percent}%, on the ${curRecordRank} position.`;
    endMsgDiv.append(endMsg);

    let whichPage = 0; // Note: when whichPage === 0, it displayed as page 1

    let scoreTableRow = document.createElement("div");
    scoreTableRow.classList.add("score-table-row");

    scoreTableRow = showRows(scoreTableRow, data, whichPage);


    // page nav

    const pageNavDiv = document.createElement("div");
    pageNavDiv.classList.add("page-nav");

    // pageNavDiv = updateNav(pageNavDiv, whichPage);
    // check if first or last page
    // prev
    const pageNavPrev = document.createElement("div");
    pageNavPrev.classList.add("page-arrow");
    pageNavPrev.textContent = "<";
    console.log("n pageNavPrev", pageNavPrev.onclick);

    const prevPage = function() {
        if (whichPage >= 1) whichPage-=1;
        pageNavCur.textContent = `${whichPage+1}/${Math.ceil(this.length/5)}`;
        scoreTableRow.textContent = "";
        scoreTableRow = showRows(scoreTableRow, this, whichPage);
    };
    pageNavPrev.onclick = prevPage.bind(data);
    // pageNavPrev.addEventListener("click", prevPage.bind(data));

    // cur
    // if (pageNavCur !== null) pageNavCur.remove();
    const pageNavCur = document.createElement("p");
    pageNavCur.textContent = `${whichPage+1}/${Math.ceil(data.length/5)}`;

    // next
    // need to use callback instead of anon func
    const pageNavNext = document.createElement("div");
    pageNavNext.classList.add("page-arrow");
    pageNavNext.textContent = ">";
    console.log("n pageNavNext",pageNavNext.onclick);

    const nextPage = function() {
        console.log("this: ", this);
        console.log("next page limit:", Math.ceil(this.length/5)-1);
        if (whichPage < Math.ceil(this.length/5)-1) whichPage+=1; // rmb whichPage starts from 0
        pageNavCur.textContent = `${whichPage+1}/${Math.ceil(this.length/5)}`;
        scoreTableRow.textContent = "";
        scoreTableRow = showRows(scoreTableRow, this, whichPage);
    };
    pageNavNext.onclick = nextPage.bind(data);
    // pageNavNext.addEventListener("click", nextPage.bind(data));

    pageNavDiv.append(pageNavPrev, pageNavCur, pageNavNext);

    console.log("y pageNavNext",pageNavPrev.onclick);
    console.log("y pageNavNext",pageNavNext.onclick);

    const noResultMsg = document.createElement("p");
    noResultMsg.textContent = "No Record Is Found";
    noResultMsg.classList.add("no-result");
    noResultMsg.classList.add("hide");

    // putting all divs tgt
    recordForm.append(endMsgDiv, searchDiv, scoreTableHeader, scoreTableRow, pageNavDiv, noResultMsg);

    searchInput.addEventListener("input", (e) => {
        scoreTableHeader.style.willChange = "opacity";
        pageNavDiv.style.willChange = "opacity";
        noResultMsg.style.willChange = "opacity";
        // pageNavNext.removeEventListener("click", nextPage);
        pageNavPrev.onclick = null;
        pageNavNext.onclick = null;
        console.log("search pageNavPrev", pageNavPrev.onclick);
        console.log("search pageNavNext",pageNavNext.onclick);

        const foundRecords = data.filter((rec) => rec.pname.toLowerCase().includes(e.target.value.toLowerCase()));
        console.log("foundRecords: ", foundRecords);
        scoreTableRow.textContent = "";
        whichPage = 0;
        pageNavCur.textContent = `${whichPage+1}/${Math.ceil(foundRecords.length/5)}`;

        recordForm.append(noResultMsg);

        if (foundRecords.length !== 0) {
            scoreTableHeader.classList.remove("hide");
            pageNavDiv.classList.remove("hide");
            noResultMsg.classList.add("hide");
            showRows(scoreTableRow, foundRecords, whichPage);
            // pageNavPrev.addEventListener(prevPage.bind(foundRecords));
            // pageNavNext.addEventListener(nextPage.bind(foundRecords));
            pageNavPrev.onclick = prevPage.bind(foundRecords);
            pageNavNext.onclick =  nextPage.bind(foundRecords);
        } else {
            scoreTableHeader.classList.add("hide");
            pageNavDiv.classList.add("hide");
            noResultMsg.classList.remove("hide");
        }
        scoreTableHeader.style.willChange = "auto";
        pageNavDiv.style.willChange = "auto";
        noResultMsg.style.willChange = "auto";
    });

    // searchInput.addEventListener("input", searchRecords.bind(rankedData));
}

const showUpdatedScoreBoard = function(cur) {
    fetch(recordUrl)
    .then(req => req.json())
    .then(data => {
        console.log("league table", data)
        updateScoreBoard(cur, data);
    })
    .catch((err) => console.log(`Failed to get game record ${err}`));
    console.log("scoreboard shown");
}

const submitHandler = function(e) {
    e.preventDefault();
    console.log("subHan");
    // const rForm = document.querySelector(".score-form");

    const formFields = new FormData(e.target);
    console.log("formFields: ", [...formFields]);
    const payload = Object.fromEntries(formFields.entries());
    console.log("payload: ", payload);

    // Validate player name is not empty
    if (!payload.pname || payload.pname.trim() === "") {
        alert("Please enter your name before submitting.");
        return;
    }

    // console.log("pay Json", JSON.stringify(payload))
    const reqOptions = {
        method: "POST",
        body: JSON.stringify(payload) // doesn't recognise body??
    };
    console.log("req body", reqOptions.body)

    // since the API will return the latest records
    // const testUrl = "http://httpbin.org/post";
    fetch(recordUrl, reqOptions)
    .then((response) => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || `Server error: ${response.status}`);
            });
        }
        return showUpdatedScoreBoard(payload);
    })
    // .then(req => req.json())
    // .then(data => {
    //     console.log("returned data: ", data);
    //     // updateScoreBoard(payload, data);
    //     showUpdatedScoreBoard(payload);
    // })
    .catch((err) => {
        console.log(`Failed to submit record for storing ${err}`);
        alert(`Error: ${err.message}. Please try again.`);
    });
}

const body = document.querySelector("body");
export const scoreBoardDiv = document.createElement('div');
scoreBoardDiv.classList.add("scoreboard");

// form
// const method = "POST";
// const endpoint = "/record";
const recordForm = document.createElement('form');
recordForm.classList.add("score-form");
// recordForm.setAttribute("action", endpoint);
// recordForm.setAttribute("method", method);
recordForm.addEventListener("submit", submitHandler);
// Prevent Enter key from submitting form - only allow button click
recordForm.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "BUTTON") {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});

// gameover text
const gameoverText = document.createElement('h1');
gameoverText.textContent = "GAME OVER";

// Stats summary section
const statsSummary = document.createElement('div');
statsSummary.id = "game-stats-summary";
statsSummary.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 20px;
    padding: 12px;
    background: rgba(15, 15, 26, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(255, 215, 0, 0.15);
`;

function updateStatsSummary() {
    const levelEl = document.getElementById("level-display");
    const linesEl = document.getElementById("lines-display");
    const levelText = levelEl ? levelEl.textContent : "Level: 1";
    const linesText = linesEl ? linesEl.textContent : "Lines: 0";
    statsSummary.innerHTML = `
        <div style="text-align: center; font-family: 'VT323', monospace; font-size: 1.3rem;">
            <div style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">SCORE</div>
            <div style="color: #FFD700; font-size: 1.5rem;">${scoreInput.value || 0}</div>
        </div>
        <div style="text-align: center; font-family: 'VT323', monospace; font-size: 1.3rem;">
            <div style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">TIME</div>
            <div style="color: #20B2AA; font-size: 1.5rem;">${timeInput.value || '00:00'}</div>
        </div>
        <div style="text-align: center; font-family: 'VT323', monospace; font-size: 1.3rem;">
            <div style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">LEVEL</div>
            <div style="color: #FF6B6B; font-size: 1.5rem;">${levelText.replace('Level: ', '')}</div>
        </div>
        <div style="text-align: center; font-family: 'VT323', monospace; font-size: 1.3rem;">
            <div style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">LINES</div>
            <div style="color: #20B2AA; font-size: 1.5rem;">${linesText.replace('Lines: ', '')}</div>
        </div>
    `;
}

// Update stats when scoreboard is shown via MutationObserver
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && scoreBoardDiv.classList.contains('show')) {
            updateStatsSummary();
        }
    });
});
observer.observe(scoreBoardDiv, { attributes: true });

// id input
const idInput = document.createElement('input');
idInput.setAttribute("type", "hidden");
idInput.setAttribute("name", "id");
idInput.setAttribute("readonly", "readonly");

// name label
const enterNameLabelDiv = document.createElement('div');
const enterNameLabel = document.createElement('label');
enterNameLabel.textContent = "Please Enter Your Name:";
enterNameLabel.setAttribute("for", "name");
enterNameLabelDiv.append(enterNameLabel);

// name input
const enterNameInputDiv = document.createElement('div');
const enterNameInput = document.createElement('input');
enterNameInput.setAttribute("type", "text");
enterNameInput.setAttribute("name", "pname");
enterNameInput.setAttribute("id", "name");
// Prevent Enter key from submitting form - user must click submit button
enterNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});
enterNameInputDiv.append(enterNameInput);

// score label
const scoreLabelDiv = document.createElement('div');
const scoreLabel = document.createElement('label');
scoreLabel.textContent = "Score: ";
scoreLabel.setAttribute("for", "score");
scoreLabelDiv.append(scoreLabel);

// score input
const scoreInputDiv = document.createElement('div');
export const scoreInput = document.createElement('input');
scoreInput.setAttribute("type", "number");
scoreInput.setAttribute("name", "score");
scoreInput.setAttribute("id", "score");
scoreInput.setAttribute("readonly", "readonly");
scoreInputDiv.append(scoreInput);

// time label
const timeLabelDiv = document.createElement('div');
const timeLabel = document.createElement('label');
timeLabel.textContent = "Time: ";
timeLabel.setAttribute("for", "time");
timeLabelDiv.append(timeLabel);

// time input
const timeInputDiv = document.createElement('div');
export const timeInput = document.createElement('input');
timeInput.setAttribute("type", "text");
timeInput.setAttribute("name", "time");
timeInput.setAttribute("id", "time");
timeInput.setAttribute("readonly", "readonly");
timeInputDiv.append(timeInput);


const recordSubmitDiv = document.createElement('div');
const recordSubmit = document.createElement('button');
recordSubmit.textContent = "Submit Name";
recordSubmit.setAttribute("type", "submit");
recordSubmitDiv.append(recordSubmit);

recordForm.append(gameoverText, statsSummary, idInput, enterNameLabelDiv, enterNameInputDiv, recordSubmitDiv);
// Hide score and time inputs (shown in stats summary instead)
scoreInputDiv.style.display = "none";
timeInputDiv.style.display = "none";
timeLabelDiv.style.display = "none";
scoreLabelDiv.style.display = "none";
recordForm.append(timeLabelDiv, timeInputDiv, scoreLabelDiv, scoreInputDiv);
scoreBoardDiv.append(recordForm);
body.append(scoreBoardDiv);

let gameId;
export const setId = function() {
    fetch(recordUrl)
    .then(req => req.json())
    .then(data => {
        console.log("all records", data);
        gameId = data[data.length-1].id + 1;
        console.log("cur id",gameId);
        // console.log("cur id type",typeof(gameId));
        idInput.setAttribute("value", gameId);
    })
    .catch(() => {
        // first record
        console.log("caught");
        gameId = 1;
        console.log("foundId",gameId);
        idInput.setAttribute("value", gameId);
    })
}

