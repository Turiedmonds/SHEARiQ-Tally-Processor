const defaultStands = 6;
const defaultRuns = 4;
let numStands = defaultStands;
let runs = defaultRuns;

function adjustStandNameWidth(input) {
    const len = input.value.length || input.placeholder.length || 1;
    input.style.width = (len + 1) + 'ch';
}

function adjustSheepTypeWidth(input) {
    const len = input.value.length || input.placeholder.length || 1;
    input.style.width = (len + 1) + 'ch';
}

function createRow(runIndex) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>Count ${runIndex + 1}</td>`;
    for (let i = 0; i < numStands; i++) {
        row.innerHTML += `<td><input type="number" value="" onchange="updateTotals()"></td>`;
    }
    row.innerHTML += `<td class="run-total">0</td>`;
    row.innerHTML += `<td class="sheep-type"><input type="text" list="sheepTypes" placeholder="Sheep Type"></td>`;
    const sheepInput = row.querySelector('.sheep-type input');
    if (sheepInput) adjustSheepTypeWidth(sheepInput);
    return row;
}

function addStand() {
    numStands++;
    const header = document.getElementById("headerRow");
    const newHeader = document.createElement("th");
    newHeader.innerHTML = `Stand ${numStands}<br><input type="text" placeholder="Name">`;
    const input = newHeader.querySelector('input');
    if (input) adjustStandNameWidth(input);
    header.insertBefore(newHeader, header.children[header.children.length - 2]);

    const tallyBody = document.getElementById("tallyBody");
    for (let i = 0; i < runs; i++) {
        const row = tallyBody.children[i];
        const cell = document.createElement("td");
        cell.innerHTML = `<input type="number" value="0" onchange="updateTotals()">`;
        row.insertBefore(cell, row.children[row.children.length - 2]);
    }

    const subtotalRow = document.getElementById("subtotalRow");
    const cell = document.createElement("td");
    cell.innerText = "0";
    subtotalRow.insertBefore(cell, subtotalRow.children[subtotalRow.children.length - 2]);
}

function addCount() {
    const body = document.getElementById("tallyBody");
    body.appendChild(createRow(runs));
    runs++;
    updateTotals();
}

function removeCount() {
    if (runs <= defaultRuns) return;

    const body = document.getElementById("tallyBody");
    if (body.lastElementChild) {
        body.removeChild(body.lastElementChild);
    }
    runs--;
    updateTotals();
}


function removeStand() {
    if (numStands <= defaultStands) return;

    const header = document.getElementById("headerRow");
    header.removeChild(header.children[numStands]);

    const tallyBody = document.getElementById("tallyBody");
    for (let i = 0; i < runs; i++) {
        const row = tallyBody.children[i];
        row.removeChild(row.children[numStands]);
    }

    const subtotalRow = document.getElementById("subtotalRow");
    subtotalRow.removeChild(subtotalRow.children[numStands]);

    numStands--;
    updateTotals();
}


function updateTotals() {
    const tbody = document.getElementById("tallyBody");
    let dailyTotal = 0;
    for (let i = 0; i < tbody.children.length; i++) {
        const row = tbody.children[i];
        let total = 0;
        for (let j = 1; j <= numStands; j++) {
            total += Number(row.children[j].children[0].value);
        }
        row.querySelector(".run-total").innerText = total;
        dailyTotal += total;
    }

    const subtotalRow = document.getElementById("subtotalRow");
    for (let i = 1; i <= numStands; i++) {
        let colTotal = 0;
        for (let j = 0; j < tbody.children.length; j++) {
            colTotal += Number(tbody.children[j].children[i].children[0].value);
        }
        subtotalRow.children[i].innerText = colTotal;
    }
    subtotalRow.children[numStands + 1].innerText = dailyTotal;
}

// Initialize table with default rows
for (let i = 0; i < runs; i++) {
    document.getElementById("tallyBody").appendChild(createRow(i));
}

// Init subtotal row
const subtotalRow = document.getElementById("subtotalRow");
for (let i = 0; i < numStands; i++) {
    const cell = document.createElement("td");
    cell.innerText = "0";
    subtotalRow.appendChild(cell);
}
subtotalRow.innerHTML += `<td></td><td></td>`;

function calculateHoursWorked() {
    const startInput = document.getElementById("startTime");
    const endInput = document.getElementById("finishTime");
    const output = document.getElementById("hoursWorked");

    if (!startInput || !endInput || !output) return;

    const start = new Date("1970-01-01T" + startInput.value);
    const end = new Date("1970-01-01T" + endInput.value);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        output.value = "";
        return;
    }

    let totalHours = (end - start) / (1000 * 60 * 60);

    const breaks = [
        ["09:00", "09:30"],
        ["11:30", "12:30"],
        ["14:30", "15:00"]
    ];

    breaks.forEach(b => {
        const bStart = new Date("1970-01-01T" + b[0]);
        const bEnd = new Date("1970-01-01T" + b[1]);

        if (end > bStart && start < bEnd) {
            const overlapStart = new Date(Math.max(start, bStart));
            const overlapEnd = new Date(Math.min(end, bEnd));
            totalHours -= (overlapEnd - overlapStart) / (1000 * 60 * 60);
        }
    });

    output.value = totalHours > 0 ? totalHours.toFixed(2) : "0";
}

document.addEventListener("DOMContentLoaded", function () {
    const start = document.getElementById("startTime");
    const end = document.getElementById("finishTime");
    if (start) start.addEventListener("change", calculateHoursWorked);
    if (end) end.addEventListener("change", calculateHoursWorked);

    document.querySelectorAll('#headerRow input[type="text"]').forEach(adjustStandNameWidth);
document.querySelectorAll('#tallyBody td.sheep-type input[type="text"]').forEach(adjustSheepTypeWidth);
});

document.addEventListener('input', function(e) {
    if (e.target.matches('#headerRow input[type="text"]')) {
        adjustStandNameWidth(e.target);
    }
     if (e.target.matches('#tallyBody td.sheep-type input[type="text"]')) {
        adjustSheepTypeWidth(e.target);
    }
});
