const defaultStands = 6;
const defaultRuns = 4;
const minStands = 1;
let numStands = defaultStands;
let runs = defaultRuns;
let is24HourFormat = true;
let isNineHourDay = false;
let promptedNineHour = false;

function adjustStandNameWidth(input) {
    const len = input.value.length || input.placeholder.length || 1;
    input.style.width = (len + 1) + 'ch';
}

function adjustSheepTypeWidth(input) {
    const len = input.value.length || input.placeholder.length || 1;
    const width = Math.max(len + 4, 10);
    input.style.width = width + 'ch';
}

function adjustShedStaffNameWidth(input) {
  const len = input.value.length || input.placeholder.length || 0;
    const buffer = 4; // small buffer so the dropdown arrow doesn't hide text
    const width = Math.max(len + buffer, 10);
    input.style.width = width + 'ch';   
}

function adjustShedStaffHoursWidth(input) {
    const len = input.value.length || input.placeholder.length || 1;
    input.style.width = (len + 1) + 'ch';
}

function getHistoryKey(input) {
    return (input.name || input.placeholder || input.id || '').replace(/\s+/g, '_');
}

function applyInputHistory(input) {
    if (!input || input.type !== 'text' || input.id === 'hoursWorked') return;
    const key = getHistoryKey(input);
    if (!key) return;

    const existingId = input.getAttribute('list');
    const listId = existingId || ('hist_' + key);
    let list = document.getElementById(listId);
    if (!list) {
        list = document.createElement('datalist');
        list.id = listId;
        document.body.appendChild(list);
    }
    if (!existingId) input.setAttribute('list', listId);
    try {
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const existingValues = new Set(Array.from(list.options).map(o => o.value));
        if (!existingId) list.innerHTML = '';
        if (Array.isArray(items)) {
            items.forEach(v => {
                if (!existingValues.has(v)) {
                    const opt = document.createElement('option');
                    opt.value = v;
                    list.appendChild(opt);
                }
            });
        }
    } catch (e) {}

    input.addEventListener('blur', () => {
        if (input.closest('#shedStaffTable')) {
            adjustShedStaffNameWidth(input);
        }
        const val = input.value.trim();
        if (!val) return;
        let arr;
        try {
            arr = JSON.parse(localStorage.getItem(key) || '[]');
            if (!Array.isArray(arr)) arr = [];
        } catch (e) {
            arr = [];
        }
        if (!arr.includes(val)) {
            arr.push(val);
            localStorage.setItem(key, JSON.stringify(arr));
            const exists = Array.from(list.options).some(o => o.value === val);
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = val;
                list.appendChild(opt);
            }
        }
          if (input.matches('#tallyBody td.sheep-type input[type="text"]')) {
            adjustSheepTypeWidth(input);
        } else if (input.matches('#shedStaffTable input[type="number"]')) {
            adjustShedStaffHoursWidth(input);
        } else if (input.matches('#headerRow input[type="text"]')) {
            adjustStandNameWidth(input);
        }
    });

input.addEventListener('input', () => {
        if (input.closest('#shedStaffTable')) {
            adjustShedStaffNameWidth(input);
        }
    });
    
 // ensure shed staff name width is sized correctly on initialization
    if (input.closest('#shedStaffTable')) {
        adjustShedStaffNameWidth(input);
    }
    
    input.addEventListener('input', () => {
        if (input.matches('#tallyBody td.sheep-type input[type="text"]')) {
            adjustSheepTypeWidth(input);
        } else if (input.matches('#shedStaffTable input[type="text"]')) {
            adjustShedStaffNameWidth(input);
        } else if (input.matches('#shedStaffTable input[type="number"]')) {
            adjustShedStaffHoursWidth(input);
        } else if (input.matches('#headerRow input[type="text"]')) {
            adjustStandNameWidth(input);
        }
    });
}

function formatTimeDisplay(h, m, use24) {
    const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (use24) return value;
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    const suffix = h < 12 ? 'AM' : 'PM';
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function generateTimeOptions() {
    const startSelect = document.getElementById('startTime');
    const finishSelect = document.getElementById('finishTime');
    if (!startSelect || !finishSelect) return;
    const startVal = startSelect.value;
    const endVal = finishSelect.value;
    startSelect.innerHTML = '';
    finishSelect.innerHTML = '';
     // Add blank option so the field appears empty until a time is chosen
    const blankStart = document.createElement('option');
    blankStart.value = '';
    blankStart.textContent = '';
    startSelect.appendChild(blankStart);
    const blankEnd = document.createElement('option');
    blankEnd.value = '';
    blankEnd.textContent = '';
    finishSelect.appendChild(blankEnd);
    for (let h = 4; h <= 22; h++) {
        for (let m = 0; m < 60; m += 15) {
            const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const display = formatTimeDisplay(h, m, is24HourFormat);
            const optStart = document.createElement('option');
            optStart.value = value;
            optStart.textContent = display;
            startSelect.appendChild(optStart);
            const optEnd = document.createElement('option');
            optEnd.value = value;
            optEnd.textContent = display;
            finishSelect.appendChild(optEnd);
        }
    }
    if (startVal) startSelect.value = startVal;
    if (endVal) finishSelect.value = endVal;
}

function toggleTimeFormat() {
    is24HourFormat = !is24HourFormat;
    const btn = document.getElementById('timeFormatToggle');
    if (btn) {
        btn.textContent = is24HourFormat ? 'Switch to 12-hour format' : 'Switch to 24-hour format';
    }
    generateTimeOptions();
    calculateHoursWorked();
}

function adjustRuns(desired) {
    const body = document.getElementById('tallyBody');
    if (!body) return;
    while (runs < desired) {
        body.appendChild(createRow(runs));
        runs++;
    }
    while (runs > desired) {
        if (body.lastElementChild) body.removeChild(body.lastElementChild);
        runs--;
    }
    updateTotals();
}

function setWorkdayType(nineHour) {
    isNineHourDay = nineHour;
    adjustRuns(isNineHourDay ? 5 : 4);
    calculateHoursWorked();
     const label = document.getElementById('timeSystemLabel');
    if (label) {
        label.textContent = isNineHourDay ? 'Time System: 9-Hour Day' : 'Time System: 8-Hour Day';
        label.style.color = isNineHourDay ? '#ff0' : '#0f0';
    }
    const hours = document.getElementById('hoursWorked');
    if (hours) updateShedStaffHours(hours.value);
}

function toggleWorkdayType() {
    const switchToNine = !isNineHourDay;
    const msg = switchToNine ? 'Switch to 9-hour day system?' : 'Switch to 8-hour day system?';
    if (confirm(msg)) {
        setWorkdayType(switchToNine);
    }
}

function handleStartTimeChange() {
    const start = document.getElementById('startTime');
    if (start && start.value === '05:00' && !promptedNineHour) {
        promptedNineHour = true;
        if (confirm('Is this a 9-hour day?')) {
            setWorkdayType(true);
        } else {
            setWorkdayType(false);
        }
    }
    calculateHoursWorked();
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
   if (sheepInput) {
        adjustSheepTypeWidth(sheepInput);
        applyInputHistory(sheepInput);
    }
    return row;
}

function addStand() {
    numStands++;
    const header = document.getElementById("headerRow");
    const newHeader = document.createElement("th");
    newHeader.innerHTML = `Stand ${numStands}<br><input type="text" placeholder="Name">`;
    const input = newHeader.querySelector('input');
   if (input) {
        adjustStandNameWidth(input);
        applyInputHistory(input);
    }
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
     if (numStands <= minStands) return;

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
    updateSheepTypeTotals();
}

function updateSheepTypeTotals() {
    const tbody = document.getElementById('tallyBody');
    const totals = {};
    let grandTotal = 0;
    tbody.querySelectorAll('tr').forEach(row => {
        const typeInput = row.querySelector('.sheep-type input');
        if (!typeInput) return;
        const type = typeInput.value.trim();
        if (!type) return;
        const runTotal = parseInt(row.querySelector('.run-total').innerText) || 0;
        totals[type] = (totals[type] || 0) + runTotal;
        grandTotal += runTotal;
    });

    const table = document.getElementById('sheepTypeTotalsTable');
    if (!table) return;
    const body = table.querySelector('tbody');
    body.innerHTML = '';
    Object.keys(totals).forEach(type => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${type}</td><td>${totals[type]}</td>`;
        body.appendChild(tr);
    });
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `<td>Total</td><td>${grandTotal}</td>`;
    body.appendChild(totalRow);
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
updateTotals();

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

     const breaks = isNineHourDay ?
        [
            ["07:00", "08:00"],
            ["09:45", "10:15"],
            ["12:00", "13:00"],
            ["14:45", "15:15"]
        ] : [
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
updateShedStaffHours(output.value);
}

function updateShedStaffHours(value) {
    const table = document.getElementById('shedStaffTable');
    if (!table) return;
    table.querySelectorAll('tr').forEach(row => {
        const input = row.querySelector('td:nth-child(2) input');
        if (input) {
            input.value = value;
            adjustShedStaffHoursWidth(input);
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    generateTimeOptions();
    const start = document.getElementById("startTime");
    const end = document.getElementById("finishTime");
    const hours = document.getElementById("hoursWorked");
    const toggle = document.getElementById('timeFormatToggle');
    const workdayToggle = document.getElementById('workdayToggle');
    if (toggle) toggle.addEventListener('click', toggleTimeFormat);
    if (workdayToggle) workdayToggle.addEventListener('click', toggleWorkdayType);
    if (start) start.addEventListener("change", handleStartTimeChange);
    if (end) end.addEventListener("change", calculateHoursWorked);
if (hours) {
        hours.addEventListener("input", () => updateShedStaffHours(hours.value));
        updateShedStaffHours(hours.value);
    }
    document.querySelectorAll('#headerRow input[type="text"]').forEach(adjustStandNameWidth);
document.querySelectorAll('#tallyBody td.sheep-type input[type="text"]').forEach(adjustSheepTypeWidth);
    document.querySelectorAll('#shedStaffTable input[type="text"]').forEach(adjustShedStaffNameWidth);
    document.querySelectorAll('#shedStaffTable input[type="number"]').forEach(adjustShedStaffHoursWidth);
    document.querySelectorAll('input[type="text"]').forEach(applyInputHistory);
});

document.addEventListener('input', function(e) {
    if (e.target.matches('#headerRow input[type="text"]')) {
        adjustStandNameWidth(e.target);
    }
     if (e.target.matches('#tallyBody td.sheep-type input[type="text"]')) {
        adjustSheepTypeWidth(e.target);
         updateSheepTypeTotals();
    }
if (e.target.matches('#shedStaffTable input[type="text"]')) {
        adjustShedStaffNameWidth(e.target);
    }
    if (e.target.matches('#shedStaffTable input[type="number"]')) {
        adjustShedStaffHoursWidth(e.target);
    }
});

function addShedStaff() {
    const body = document.getElementById('shedStaffTable');
    const row = document.createElement('tr');
    row.innerHTML = `<td><input placeholder="Staff Name" type="text"/></td><td><input min="0" placeholder="0" step="0.1" type="number"/></td>`;
    body.appendChild(row);
    const hours = document.getElementById('hoursWorked');
    const nameInput = row.querySelector('td:nth-child(1) input');
    const hoursInput = row.querySelector('td:nth-child(2) input');
    if (hours && hoursInput) {
        hoursInput.value = hours.value;
    }
    if (nameInput) {
        adjustShedStaffNameWidth(nameInput);
        applyInputHistory(nameInput);
    }
    if (hoursInput) adjustShedStaffHoursWidth(hoursInput);
}

function removeShedStaff() {
    const body = document.getElementById('shedStaffTable');
    if (body.lastElementChild) {
        body.removeChild(body.lastElementChild);
    }
}
