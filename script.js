
const SIZE = 5;
const TOTAL_TIME = 60;

let solution = [];
let board = [];
let selected = null;
let mistakes = 0;
let timeLeft = TOTAL_TIME;
let timer = null;
let ended = false;

const grid = document.getElementById("grid");
const statusText = document.getElementById("status");
const dots = document.querySelectorAll(".dot");
const keys = document.querySelectorAll(".key");
const timeText = document.getElementById("time");
const fill = document.getElementById("fill");
const restart = document.getElementById("restart");

function shuffle(arr) {
    let a = [...arr];

    for (let i = a.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
}

function generateSolution() {
    let rows = shuffle([0,1,2,3,4]);
    let cols = shuffle([0,1,2,3,4]);
    let nums = shuffle([1,2,3,4,5]);

    return rows.map(r =>
        cols.map(c => nums[(r + c) % SIZE])
    );
}

function generatePuzzle() {
    solution = generateSolution();
    board = solution.map(row => [...row]);

    let positions = shuffle(
        Array.from({length: 25}, (_, i) => i)
    );

    positions.slice(0, 14).forEach(pos =>  {
        let r = Math.floor(pos / SIZE);
        let c = pos % SIZE;
        board[r][c] = 0;
    });
}

function renderGrid() {
    grid.innerHTML = "";

    board.forEach((row, r) => {
        row.forEach((value, c) => {
            const cell = document.createElement("button");

            cell.className = "cell";
            cell.textContent = value || "";

            if (value !== 0) {
                cell.classList.add("given");
                cell.disabled = true;
            }

            if (
                selected &&
                selected.r === r &&
                selected.c === c
            ) {
                cell.classList.add("selected");
            }

            cell.onclick = () => {
                if (ended || board[r][c] !== 0) return;

                selected = {r, c};
                renderGrid();
            };

            grid.appendChild(cell);
        });
    });

    updateKeys();
}

function updateKeys() {
    keys.forEach(key => {
        key.disabled = ended || !selected;
    });
}


function moveSelection(dr, dc) {
    if (ended) return;

    // If nothing is selected yet, start from the first empty cell.
    if (!selected) {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] === 0) {
                    selected = { r, c };
                    renderGrid();
                    setStatus("Square selected. Enter a number from 1 to 5.");
                    return;
                }
            }
        }
        return;
    }

    let r = selected.r + dr;
    let c = selected.c + dc;

    // Skip filled/given squares while moving in the chosen direction.
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
        if (board[r][c] === 0) {
            selected = { r, c };
            renderGrid();
            setStatus("Square selected. Enter a number from 1 to 5.");
            return;
        }
        r += dr;
        c += dc;
    }
}

function updateMistakes() {
    dots.forEach((dot, i) => {
        dot.classList.toggle("used", i < mistakes);
    });
}

function setStatus(message, type = "") {
    statusText.textContent = message;
    statusText.className = "status " + type;
}

function chooseNumber(number) {
    if (ended) return;

    if (!selected) {
        setStatus("Select an empty square first.", "bad");
        return;
    }

    const {r, c} = selected;

    if (solution[r][c] === number) {
        board[r][c] = number;
        selected = null;

        renderGrid();

        if (board.every(row => row.every(v => v !== 0))) {
            finish("Congratulations! Puzzle completed!", true);
        } else {
            setStatus("Correct number! Keep going.", "good");
        }

    } else {
        mistakes++;
        updateMistakes();
        resetTimer();

        const cell = grid.children[r * SIZE + c];

        if (cell) {
            cell.classList.add("wrong");
        }

        if (mistakes >= 3) {
            finish("Game Over! Three mistakes used.");
        } else {
            setStatus(
                `Wrong number! ${3 - mistakes} mistakes remaining.`,
                "bad"
            );
        }
    }
}

function updateTimer() {
    const seconds = Math.max(0, timeLeft);
    timeText.textContent = `${seconds.toFixed(1)}s`;

    const percent = (seconds / TOTAL_TIME) * 100;
    fill.style.width = `${percent}%`;
    fill.classList.toggle("low", seconds <= 5);
}

function resetTimer() {
    if (ended) return;
    timeLeft = TOTAL_TIME;
    updateTimer();
}

function finish(message, won = false) {
    ended = true;
    clearInterval(timer);

    setStatus(message, won ? "good" : "bad");
    updateKeys();
}

function startTimer() {
    clearInterval(timer);
    timeLeft = TOTAL_TIME;
    updateTimer();

    timer = setInterval(() => {
        if (ended) return;

        timeLeft = Math.max(0, timeLeft - 0.1);
        updateTimer();

        if (timeLeft <= 0) {
            finish("Time's up! Press NEW GAME to try again.");
        }
    }, 100);
}

function newGame() {
    clearInterval(timer);

    mistakes = 0;
    timeLeft = TOTAL_TIME;
    selected = null;
    ended = false;

    generatePuzzle();
    updateMistakes();
    updateTimer();

    setStatus("Select an empty square to begin.");

    renderGrid();
    startTimer();
}

keys.forEach(key => {
    key.addEventListener("click", () => {
        chooseNumber(Number(key.dataset.n));
    });
});

restart.addEventListener("click", newGame);

document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if (key === "r") {
        newGame();
        return;
    }

    const directions = {
        w: [-1, 0], arrowup: [-1, 0],
        s: [1, 0], arrowdown: [1, 0],
        a: [0, -1], arrowleft: [0, -1],
        d: [0, 1], arrowright: [0, 1]
    };

    if (directions[key]) {
        e.preventDefault();
        moveSelection(...directions[key]);
        return;
    }

    if (/^[1-5]$/.test(e.key)) {
        e.preventDefault();
        chooseNumber(Number(e.key));
    }
});

newGame();
