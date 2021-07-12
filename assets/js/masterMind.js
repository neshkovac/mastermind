const layoutConfig = { // config objec for elements with their attributes.
    logos: [{
            name: "angular",
            src: "angular.png"
        },
        {
            name: "javascript",
            src: "javascript.png"
        },
        {
            name: "react",
            src: "react.png"
        },
        {
            name: "css",
            src: "css.png"
        }
    ],
    columnAttributes: [{
        name: 'class',
        value: 'col'
    }, {
        name: 'id',
        value: 'col'
    }],
    rowAttributes: [{
        name: 'class',
        value: 'row'
    }, {
        name: 'id',
        value: 'row'
    }],
    cellAttributes: [{
        name: 'class',
        value: 'cell'
    }, {
        name: 'id',
        value: 'cell'
    }],
    legendAttributesRed: [{
        name: 'class',
        value: 'color-cell red'
    }],
    legendAttributesGreen: [{
        name: 'class',
        value: 'color-cell green'
    }],
    legendColumnAttributes: [{
        name: 'class',
        value: 'legend-col'
    }],
    legendParagraphGreenHTML: `<p class='legend-paragraph'>Correct logo, correct position</p>`,
    legendParagraphRedHTML: `<p class='legend-paragraph'>Correct logo, but at wrong position</p>`,
    numberOfCells: 4,
    numberOfColumns: 2,
    numberOfRows: 8
}

let playingRows = []; // placeholder for columns,rows and cells. No selector needed.
let resultRows = [];

let playerState = {
    combination: [],
    activeCell: 0,
    activeRow: 0,
    correctCombination: []
}; // active combination


function appendChildToEl(parent, fn, element, attributes, numberOfEl) {
    // factory function, numberOfEl times.
    let children = [];
    for (let i = 0; i < numberOfEl; i++) {
        const newChild = parent.appendChild(fn(element, attributes, i)); // parent is already a selected node.
        children.push(newChild)
    }
    return children;
};

function nodeFactory(el, attrs, index) { // Function for making child nodes, and setting id, class and other attributes.
    const child = document.createElement(el);
    attrs.forEach(attr => {
        if (attr.name === 'class') {
            child.setAttribute(attr.name, attr.value + " " + attr.value + "-" + index); // e.g. "row row-0", 0 being index, for class.
        } else if (attr.name === 'id') {
            child.setAttribute(attr.name, attr.value + "-" + index); // only "row-0" for id.
        } else {
            child.setAttribute(attr.name, attr.value); // set every other attribute as it is.
        }
    })
    return child;
}

function createElementWithInnerHTML(target, html) {
    target.innerHTML = html;
}

function renderElements() {
    let main = document.querySelector("#main");
    // initial 2 columns, left and right. Left for guessing rows, rightfor matching rows.
    const columns = appendChildToEl(main, nodeFactory, 'div', layoutConfig.columnAttributes, layoutConfig.numberOfColumns);
    // 8 rows on the guessing side.
    const guessingRows = appendChildToEl(columns[0], nodeFactory, 'div', layoutConfig.rowAttributes, layoutConfig.numberOfRows);
    // 8 rows on the matching side.
    const matchingRows = appendChildToEl(columns[1], nodeFactory, 'div', layoutConfig.rowAttributes, layoutConfig.numberOfRows);

    guessingRows.map((row) => {
        // populate guessing side with 4 cell's a row.
        appendChildToEl(row, nodeFactory, 'div', layoutConfig.cellAttributes, layoutConfig.numberOfCells);
    });
    matchingRows.map((row, i) => {
        if (i !== 0 && i !== matchingRows.length - 1) { // don't put cell's into first and last row on the matching side.
            appendChildToEl(row, nodeFactory, 'div', layoutConfig.cellAttributes, 4);
        } else if (i === (matchingRows.length - 1)) { // put Legend info about the game in last row.
            const legendWrapper = appendChildToEl(row, nodeFactory, 'div', layoutConfig.legendColumnAttributes, 1); // wrapper for legend.
            appendChildToEl(legendWrapper[0], nodeFactory, 'div', layoutConfig.legendAttributesRed, 1); // red dot.
            appendChildToEl(legendWrapper[0], nodeFactory, 'div', layoutConfig.legendAttributesGreen, 1); // green dot.
            const legendParagraphWrapper = appendChildToEl(row, nodeFactory, 'div', layoutConfig.legendColumnAttributes, 1); // append paragraphs.
            createElementWithInnerHTML(legendParagraphWrapper[0],
                layoutConfig.legendParagraphRedHTML + layoutConfig.legendParagraphGreenHTML);
        };
    });
    playingRows = guessingRows;
    resultRows = matchingRows;
}

function randomInt(min = 0, max = 4) {
    return Math.floor(Math.random() * (max - min)); // min = 0, max = 4 - exclusive. 
}

function shuffleLogos() {
    let rndElements = [];
    let indexes = [];
    let logosAray = [...layoutConfig.logos]; // get all the logo objects   
    while (true) { // populate array with infinite loop.
        let index = randomInt();
        if (!indexes.includes(index)) { // if unique index, push.
            indexes.push(index);
            rndElements.push(logosAray[index]);
        }
        if (indexes.length === 4) { // break infinite loop.
            break;
        }
    }
    rndElements.forEach(element => {
        playerState.correctCombination.push(element.name);
    });
    // return rndElements;
}

function addEventListeners() {
    const lastRow = playingRows[playingRows.length - 1]; // get last row from node array.
    const playingLogosPlaceholder = Array.from(lastRow.children); // get array from node list.
    playingLogosPlaceholder.forEach((element, index) => {
        element.classList.add('background-' + layoutConfig.logos[index].name); // placeholder images in last row.
        element.setAttribute('data-element', layoutConfig.logos[index].name); // add data-element dataset, for populating player array.
        element.addEventListener('click', function ($event) {
            validateUserInput($event, selectRow(playingRows, playerState.activeRow));
        });
    });

}

function validateUserInput($event, activeCells) {
    if (playerState.combination.length < 4 &&
        !playerState.combination.includes($event.target.dataset.element) &&
        $event.target.disabled !== false) {
        // push only 4 elements to array.
        $event.target.disabled = true;
        playerState.combination.push($event.target.dataset.element); // push dataset.element e.g. "angular" to user array.
        populateGuessingRow(playerState.activeRow);
    }
    if (playerState.combination.length === 4) {
        activeCells.forEach(cell => {
            cell.disabled = false;
        })
        populateGuessingRow(playerState.activeRow++);

    }
}

function populateGuessingRow(activeRow) { // get reference value from playerState.activeRow, so it can be incremented from inside.
    let activeRowCells = selectRow(playingRows, activeRow); // playingRows is a global reference to guessingRows node list.
    const lastAddedElement = playerState.combination[playerState.combination.length - 1]; // last added element.
    const playerArrayLength = playerState.combination.length; // array length.

    // got all the elements needed for function.

    if (playerArrayLength && playerState.activeCell < 4) { // make sure user selected element and it's not 5th click.
        activeRowCells[playerArrayLength - 1].classList.add('background-' + lastAddedElement); // add class to cell.
        playerState.activeCell++; // move to the next cell on the right.
    } else if (playerArrayLength && playerState.activeCell === 4) { // By this time, player has selected 4 different logos.
        // console.log(playerState.correctCombination);
        // console.log(playerState.combination);
        compareResult(); // compare correct combination with the one user has selected.
        activeRow++; // increment row.
        playerState.activeCell = 0; // set cell on 0, left corner.
        playerState.combination = []; // reset the current guessing array for player.
    } else {
        console.log("Initiated!");
        console.log(playerState.activeCell);
        console.log(playerArrayLength);
    }
}

function shuffleArray(array) { // Fisher-Yates (Knuth) shuffle algorithm.
    var currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

function compareResult() {
    let result = []; // placeholder array for "green" and "red" classes.
    const indicatorRows = selectRow(resultRows, playerState.activeRow - 1); // - 1 because the row has already incremented.
    playerState.combination.forEach(logo => {
        if (playerState.combination.indexOf(logo) === playerState.correctCombination.indexOf(logo)) {
            result.push("green");
        } else {
            result.push("red");
        }
    })
    result = shuffleArray(result);
    console.log(result + " ------ result in cmpResult");
    indicatorRows.forEach((cell, index) => {
        cell.classList.add('matching-' + result[index]);
    });
}

function selectRow(playingOrResultRow, position) {
    // playingRows are rows on the left of the app, the ones that user populates.
    // resultRows are rows on the right of the app, which indicate positions.
    const [...rows] = [...playingOrResultRow].slice(1, (playingOrResultRow.length - 1)); // don't need first and last row.
    const activeRow = rows[position]; // select active row.
    const cells = Array.from(activeRow.children); // make sure I get array from list of nodes.
    return cells; // return back active cells to work with.
}

window.onload = function () {
    renderElements(); // initialize HTML on load.
    addEventListeners(); // add listeners to logo row.
    shuffleLogos();


}