"use strict"

const recordUrl = "/record/";

export let score = 0;

// Id of the just-submitted record, used to highlight the current player's row.
let currentPlayerId = null;

export function resetScore() {
    score = 0;
}

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
        const isMe = currentPlayerId !== null && +remainRecord.id === currentPlayerId;

        const rankLeader = document.createElement("div");
        rankLeader.classList.add("r-cell");
        rankLeader.classList.add("rank-leader-board");
        rankLeader.textContent = `${key}`;

        const nameLeader = document.createElement("div");
        nameLeader.classList.add("r-cell");
        nameLeader.classList.add("name-leader-board");
        nameLeader.textContent = isMe ? `▸ ${remainRecord.pname}` : `${remainRecord.pname}`;

        const scoreLeader = document.createElement("div");
        scoreLeader.classList.add("r-cell");
        scoreLeader.classList.add("score-leader-board");
        scoreLeader.textContent = `${remainRecord.score}`;

        const timeLeader = document.createElement("div");
        timeLeader.classList.add("r-cell");
        timeLeader.classList.add("time-leader-board");
        timeLeader.textContent = `${remainRecord.time}`;

        if (isMe) {
            [rankLeader, nameLeader, scoreLeader, timeLeader].forEach((c) => c.classList.add("is-me"));
        }

        scoreTableRow.append(rankLeader, nameLeader, scoreLeader, timeLeader);
    }
}

const showFilledPage = function(scoreTableRow, data, whichPage) {
    for (let r = 5*whichPage; r < 5*(whichPage+1); r++) {
        const isMe = currentPlayerId !== null && +data[r].id === currentPlayerId;

        const rankLeader = document.createElement("div");
        rankLeader.classList.add("r-cell");
        rankLeader.classList.add("rank-leader-board");
        rankLeader.textContent = `${r+1}`;

        const nameLeader = document.createElement("div");
        nameLeader.classList.add("r-cell");
        nameLeader.classList.add("name-leader-board");
        nameLeader.textContent = isMe ? `▸ ${data[r].pname}` : `${data[r].pname}`;

        const scoreLeader = document.createElement("div");
        scoreLeader.classList.add("r-cell");
        scoreLeader.classList.add("score-leader-board");
        scoreLeader.textContent = `${data[r].score}`;

        const timeLeader = document.createElement("div");
        timeLeader.classList.add("r-cell");
        timeLeader.classList.add("time-leader-board");
        timeLeader.textContent = `${data[r].time}`;

        if (isMe) {
            [rankLeader, nameLeader, scoreLeader, timeLeader].forEach((c) => c.classList.add("is-me"));
        }

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

    // Hall of Fame header: centred title + FIND search
    const headerDiv = document.createElement("div");
    headerDiv.className = "scoreboard-header";

    const titleBlock = document.createElement("div");
    titleBlock.className = "scoreboard-title";
    const hofLabel = document.createElement("div");
    hofLabel.className = "hof-label";
    hofLabel.textContent = "◆ HALL OF FAME ◆";
    const hofTitle = document.createElement("div");
    hofTitle.className = "hof-title";
    hofTitle.textContent = "HIGH SCORES";
    titleBlock.append(hofLabel, hofTitle);

    const searchDiv = document.createElement("div");
    searchDiv.className = "search";
    const searchLabelDiv = document.createElement("div");
    searchLabelDiv.className = "search-label";
    const searchLabel = document.createElement("label");
    searchLabel.textContent = "FIND";
    searchLabel.setAttribute("for", "search");
    searchLabelDiv.append(searchLabel);
    const searchInputDiv = document.createElement("div");
    const searchInput = document.createElement("input");
    searchInput.setAttribute("id", "search");
    searchInput.setAttribute("type", "text");
    searchInput.setAttribute("name", "search");
    searchInput.setAttribute("placeholder", "NAME");
    searchInput.className = "search-input";
    searchInputDiv.append(searchInput);
    searchDiv.append(searchLabelDiv, searchInputDiv);

    headerDiv.append(titleBlock, searchDiv);


    const scoreTableHeader = document.createElement("div");
    scoreTableHeader.classList.add("score-table-header");
    const header = ["#", "NAME", "SCORE", "TIME"];
    for (let h = 0; h < 4; h++) {
        const hCell = document.createElement("div");
        hCell.textContent = header[h];
        hCell.classList.add("h-cell");
        // h === 3 ? hCell.classList.add("h-cell-last") : hCell.classList.add("h-cell")
        scoreTableHeader.append(hCell);
    }

    // sort by score
    data.sort((a,b) => +a.score >= +b.score ? -1 : 1);

    // remember the current player's record so its row can be highlighted
    currentPlayerId = +cur.id;

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
    pageNavPrev.textContent = "◀";
    console.log("n pageNavPrev", pageNavPrev.onclick);

    const prevPage = function() {
        if (whichPage >= 1) whichPage-=1;
        pageNavCur.textContent = `PAGE ${whichPage+1} / ${Math.ceil(this.length/5)}`;
        scoreTableRow.textContent = "";
        scoreTableRow = showRows(scoreTableRow, this, whichPage);
    };
    pageNavPrev.onclick = prevPage.bind(data);
    // pageNavPrev.addEventListener("click", prevPage.bind(data));

    // cur
    // if (pageNavCur !== null) pageNavCur.remove();
    const pageNavCur = document.createElement("p");
    pageNavCur.textContent = `PAGE ${whichPage+1} / ${Math.ceil(data.length/5)}`;

    // next
    // need to use callback instead of anon func
    const pageNavNext = document.createElement("div");
    pageNavNext.classList.add("page-arrow");
    pageNavNext.textContent = "▶";
    console.log("n pageNavNext",pageNavNext.onclick);

    const nextPage = function() {
        console.log("this: ", this);
        console.log("next page limit:", Math.ceil(this.length/5)-1);
        if (whichPage < Math.ceil(this.length/5)-1) whichPage+=1; // rmb whichPage starts from 0
        pageNavCur.textContent = `PAGE ${whichPage+1} / ${Math.ceil(this.length/5)}`;
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
    recordForm.append(headerDiv, endMsgDiv, scoreTableHeader, scoreTableRow, pageNavDiv, noResultMsg);

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
        pageNavCur.textContent = `PAGE ${whichPage+1} / ${Math.ceil(foundRecords.length/5)}`;

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

// gameover banner
const gameoverDiamonds = document.createElement('div');
gameoverDiamonds.className = "gameover-diamonds";
gameoverDiamonds.textContent = "◆ ◆ ◆";

const gameoverText = document.createElement('h1');
gameoverText.textContent = "GAME OVER";

const gameoverSub = document.createElement('p');
gameoverSub.className = "gameover-sub";
gameoverSub.textContent = "NEW HIGH SCORE";

// id input
const idInput = document.createElement('input');
idInput.setAttribute("type", "hidden");
idInput.setAttribute("name", "id");
idInput.setAttribute("readonly", "readonly");

// SCORE + TIME stat panels
const statsRow = document.createElement('div');
statsRow.className = "score-form-stats";

const scorePanel = document.createElement('div');
scorePanel.className = "stat-panel score";
const scoreLabel = document.createElement('label');
scoreLabel.className = "stat-label";
scoreLabel.textContent = "SCORE";
scoreLabel.setAttribute("for", "score");
export const scoreInput = document.createElement('input');
scoreInput.className = "stat-value";
scoreInput.setAttribute("type", "number");
scoreInput.setAttribute("name", "score");
scoreInput.setAttribute("id", "score");
scoreInput.setAttribute("readonly", "readonly");
scorePanel.append(scoreLabel, scoreInput);

const timePanel = document.createElement('div');
timePanel.className = "stat-panel time";
const timeLabel = document.createElement('label');
timeLabel.className = "stat-label";
timeLabel.textContent = "TIME";
timeLabel.setAttribute("for", "time");
export const timeInput = document.createElement('input');
timeInput.className = "stat-value";
timeInput.setAttribute("type", "text");
timeInput.setAttribute("name", "time");
timeInput.setAttribute("id", "time");
timeInput.setAttribute("readonly", "readonly");
timePanel.append(timeLabel, timeInput);

statsRow.append(scorePanel, timePanel);

// name label + input
const enterNameLabelDiv = document.createElement('div');
const enterNameLabel = document.createElement('label');
enterNameLabel.textContent = "ENTER YOUR NAME";
enterNameLabel.setAttribute("for", "name");
enterNameLabelDiv.append(enterNameLabel);

const enterNameInputDiv = document.createElement('div');
const enterNameInput = document.createElement('input');
enterNameInput.setAttribute("type", "text");
enterNameInput.setAttribute("name", "pname");
enterNameInput.setAttribute("id", "name");
enterNameInput.setAttribute("maxlength", "12");
enterNameInput.setAttribute("autocomplete", "off");
// Prevent Enter key from submitting form - user must click submit button
enterNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});
enterNameInputDiv.append(enterNameInput);

const recordSubmitDiv = document.createElement('div');
const recordSubmit = document.createElement('button');
recordSubmit.textContent = "SUBMIT ▶";
recordSubmit.setAttribute("type", "submit");
recordSubmitDiv.append(recordSubmit);

recordForm.append(gameoverDiamonds, gameoverText, gameoverSub, idInput, statsRow, enterNameLabelDiv, enterNameInputDiv, recordSubmitDiv);
scoreBoardDiv.append(recordForm);

// export const returnHomeBtn = document.createElement('button');
// returnHomeBtn.classList.add("return-home-btn");
// returnHomeBtn.setAttribute("type", "button");
// returnHomeBtn.textContent = "◀ HOME";
// scoreBoardDiv.append(returnHomeBtn);

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

