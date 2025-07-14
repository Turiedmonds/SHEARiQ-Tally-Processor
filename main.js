const defaultStands = 6;
const defaultRuns = 4;
const minStands = 1;
const minRuns = 1;
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
  const len = input.value.length || input.placeholder.length || 1;
    input.style.width = (len + 1) + 'ch';
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
       cell.innerHTML = `<input type="number" value="" onchange="updateTotals()">`;
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
  if (runs <= minRuns) return;  

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

function clearHighlights() {
    document.querySelectorAll('.highlight-error').forEach(el => el.classList.remove('highlight-error'));
}

function saveData() {
    clearHighlights();
    const issues = [];
    const tbody = document.getElementById('tallyBody');
    const header = document.getElementById('headerRow');
    if (!tbody || !header) return;

    // Check empty stand columns
    for (let s = 1; s <= numStands; s++) {
        const inputs = Array.from(tbody.querySelectorAll(`tr td:nth-child(${s + 1}) input`));
        const empty = inputs.every(inp => !inp.value.trim());
        if (empty) {
            issues.push(`Stand ${s} has no data. Please remove unused stands.`);
            const headerInput = header.children[s].querySelector('input');
            if (headerInput) headerInput.classList.add('highlight-error');
            inputs.forEach(i => i.classList.add('highlight-error'));
        }
    }

    // Check empty count rows
    Array.from(tbody.querySelectorAll('tr')).forEach((row, idx) => {
        const standInputs = Array.from(row.querySelectorAll('td input[type="number"]')).slice(0, numStands);
        const sheepType = row.querySelector('.sheep-type input');
        const allEmpty = standInputs.every(i => !i.value.trim()) && (!sheepType || !sheepType.value.trim());
        if (allEmpty) {
            issues.push(`Count ${idx + 1} has no data. Please remove unused counts.`);
            standInputs.forEach(i => i.classList.add('highlight-error'));
            if (sheepType) sheepType.classList.add('highlight-error');
        }
    });

    // Check empty shed staff rows
    document.querySelectorAll('#shedStaffTable tr').forEach((row, idx) => {
        const name = row.querySelector('td:nth-child(1) input');
        const hours = row.querySelector('td:nth-child(2) input');
        if (name && hours && !name.value.trim() && !hours.value.trim()) {
            issues.push(`Shed Staff row ${idx + 1} has no data. Please remove unused rows.`);
            name.classList.add('highlight-error');
            hours.classList.add('highlight-error');
        }
    });

    if (issues.length) {
        window.alert(issues.join('\n'));
        return;
    }

    // Gather data
    const data = {
        date: document.getElementById('date')?.value || '',
        stationName: document.getElementById('stationName')?.value || '',
        teamLeader: document.getElementById('teamLeader')?.value || '',
        combType: document.getElementById('combType')?.value || '',
        startTime: document.getElementById('startTime')?.value || '',
        finishTime: document.getElementById('finishTime')?.value || '',
        hoursWorked: document.getElementById('hoursWorked')?.value || '',
        timeSystem: isNineHourDay ? '9-hr' : '8-hr',
        shearerCounts: [],
        shedStaff: [],
        sheepTypeTotals: []
    };

    Array.from(tbody.querySelectorAll('tr')).forEach((row, idx) => {
        const standVals = [];
        for (let s = 1; s <= numStands; s++) {
            const input = row.children[s].querySelector('input[type="number"]');
            standVals.push(input ? input.value : '');
        }
        const sheepTypeInput = row.querySelector('.sheep-type input');
        if (standVals.some(v => v) || (sheepTypeInput && sheepTypeInput.value.trim())) {
            data.shearerCounts.push({
                count: idx + 1,
                stands: standVals,
                total: row.querySelector('.run-total')?.innerText || '0',
                sheepType: sheepTypeInput ? sheepTypeInput.value : ''
            });
        }
    });

    document.querySelectorAll('#shedStaffTable tr').forEach(row => {
        const name = row.querySelector('td:nth-child(1) input');
        const hours = row.querySelector('td:nth-child(2) input');
        if (name && hours && (name.value.trim() || hours.value.trim())) {
            data.shedStaff.push({ name: name.value, hours: hours.value });
        }
    });

    document.querySelectorAll('#sheepTypeTotalsTable tbody tr').forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (cells.length >= 2) {
            data.sheepTypeTotals.push({ type: cells[0].textContent, total: cells[1].textContent });
        }
    });

    const json = JSON.stringify(data, null, 2);
    localStorage.setItem('sheariq_saved_session', json);

    let fileName = 'Tally_Save.json';
    if (data.stationName && data.date) {
        const parts = data.date.split('-');
        if (parts.length === 3) fileName = `${data.stationName}_${parts[2]}-${parts[1]}-${parts[0]}.json`;
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadPreviousSession() {
    const json = localStorage.getItem('sheariq_saved_session');
    if (!json) {
        alert('No saved session found.');
        return;
    }
    let data;
    try {
        data = JSON.parse(json);
    } catch (e) {
        alert('No saved session found.');
        return;
    }
    if (!window.confirm('This will replace all current data. Do you want to continue?')) {
        return;
    }

    const dateObj = data.date ? new Date(data.date) : null;
    let formattedDate = data.date || '';
    if (dateObj && !isNaN(dateObj)) {
        formattedDate = dateObj.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    const sessionName = `${formattedDate}${data.stationName ? ' \u2014 ' + data.stationName : ''}`;
    alert(sessionName);

    // Determine required stands and runs
    const targetRuns = Array.isArray(data.shearerCounts) ? data.shearerCounts.length : runs;
    const targetStands = data.shearerCounts && data.shearerCounts[0] ? data.shearerCounts[0].stands.length : numStands;

    while (numStands < targetStands) addStand();
    while (numStands > targetStands) removeStand();
    while (runs < targetRuns) addCount();
    while (runs > targetRuns) removeCount();

    // Clear existing inputs
    document.querySelectorAll('#tallyBody input').forEach(inp => inp.value = '');
    document.querySelectorAll('#shedStaffTable input').forEach(inp => inp.value = '');

    // Basic fields
    const assign = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    assign('date', data.date);
    assign('stationName', data.stationName);
    assign('teamLeader', data.teamLeader);
    assign('combType', data.combType);
    assign('startTime', data.startTime);
    assign('finishTime', data.finishTime);
    assign('hoursWorked', data.hoursWorked);

    setWorkdayType(data.timeSystem === '9-hr');
    updateShedStaffHours(data.hoursWorked || '');

    // Populate shearer counts
    const body = document.getElementById('tallyBody');
    if (body && Array.isArray(data.shearerCounts)) {
        data.shearerCounts.forEach((run, idx) => {
            const row = body.children[idx];
            if (!row) return;
            run.stands.forEach((val, sIdx) => {
                const input = row.children[sIdx + 1]?.querySelector('input[type="number"]');
                if (input) input.value = val;
            });
            const typeInput = row.querySelector('.sheep-type input');
            if (typeInput) {
                typeInput.value = run.sheepType || '';
                adjustSheepTypeWidth(typeInput);
            }
        });
    }

    // Populate shed staff
    const staffTable = document.getElementById('shedStaffTable');
    if (staffTable) {
        staffTable.innerHTML = '';
        if (Array.isArray(data.shedStaff)) {
            data.shedStaff.forEach(staff => {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td><input placeholder="Staff Name" type="text"/></td><td><input min="0" placeholder="0" step="0.1" type="number"/></td>';
                const nameInput = tr.querySelector('td:nth-child(1) input');
                const hoursInput = tr.querySelector('td:nth-child(2) input');
                if (nameInput) {
                    nameInput.value = staff.name || '';
                    adjustShedStaffNameWidth(nameInput);
                    applyInputHistory(nameInput);
                }
                if (hoursInput) {
                    hoursInput.value = staff.hours || '';
                    adjustShedStaffHoursWidth(hoursInput);
                }
                staffTable.appendChild(tr);
            });
        }
    }

    updateTotals();
    updateSheepTypeTotals();
}

function resetApp() {
    if (!window.confirm('Are you sure you want to clear all data and start fresh? This cannot be undone.')) {
        return;
    }

    clearHighlights();

    // Reset global state
    numStands = defaultStands;
    runs = defaultRuns;
    isNineHourDay = false;
    promptedNineHour = false;

    // Clear basic fields
    ['date', 'stationName', 'teamLeader', 'combType', 'startTime', 'finishTime', 'hoursWorked']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

    // Rebuild header
    const header = document.getElementById('headerRow');
    if (header) {
        header.innerHTML = '<th>Count #</th>';
        for (let i = 1; i <= numStands; i++) {
            header.innerHTML += `<th>Stand ${i}<br/><input placeholder="Name" type="text"/></th>`;
        }
        header.innerHTML += '<th>Count Total</th><th class="sheep-type">Sheep Type</th>';
        header.querySelectorAll('input[type="text"]').forEach(inp => {
            adjustStandNameWidth(inp);
            applyInputHistory(inp);
        });
    }

    // Rebuild tally body
    const body = document.getElementById('tallyBody');
    if (body) {
        body.innerHTML = '';
        for (let i = 0; i < runs; i++) {
            body.appendChild(createRow(i));
        }
    }

    // Reset subtotal row
    const subtotalRow = document.getElementById('subtotalRow');
    if (subtotalRow) {
        subtotalRow.innerHTML = '<th>Shearer Totals</th>';
        for (let i = 0; i < numStands; i++) {
            const cell = document.createElement('td');
            cell.innerText = '0';
            subtotalRow.appendChild(cell);
        }
        subtotalRow.innerHTML += '<td></td><td></td>';
    }

    // Reset shed staff table
    const staffTable = document.getElementById('shedStaffTable');
    if (staffTable) {
        staffTable.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td><input placeholder="Staff Name" type="text"/></td>' +
                           '<td><input min="0" placeholder="0" step="0.1" type="number"/></td>';
            staffTable.appendChild(tr);
            const nameInput = tr.querySelector('td:nth-child(1) input');
            const hoursInput = tr.querySelector('td:nth-child(2) input');
            if (nameInput) {
                adjustShedStaffNameWidth(nameInput);
                applyInputHistory(nameInput);
            }
            if (hoursInput) {
                adjustShedStaffHoursWidth(hoursInput);
            }
        }
    }

    // Clear sheep type totals
    const totalsBody = document.querySelector('#sheepTypeTotalsTable tbody');
    if (totalsBody) totalsBody.innerHTML = '';

    // Reset to 8-hour day and recalc hours
    setWorkdayType(false);
    calculateHoursWorked();
    updateTotals();
    updateSheepTypeTotals();
}

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
 window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
function collectExportData() {
    const data = {
        date: document.getElementById('date')?.value || '',
        stationName: document.getElementById('stationName')?.value || '',
        teamLeader: document.getElementById('teamLeader')?.value || '',
        combType: document.getElementById('combType')?.value || '',
        startTime: document.getElementById('startTime')?.value || '',
        finishTime: document.getElementById('finishTime')?.value || '',
        hoursWorked: document.getElementById('hoursWorked')?.value || '',
        timeSystem: isNineHourDay ? '9-hr' : '8-hr',
        stands: [],
        shearerCounts: [],
        shedStaff: [],
        sheepTypeTotals: []
    };

    const header = document.getElementById('headerRow');
    const tbody = document.getElementById('tallyBody');
    if (!header || !tbody) return data;

    for (let s = 1; s <= numStands; s++) {
        const headerInput = header.children[s]?.querySelector('input');
        const name = headerInput && headerInput.value.trim() ? headerInput.value.trim() : `Stand ${s}`;
        let hasData = !!(headerInput && headerInput.value.trim());
        if (!hasData) {
            for (let r = 0; r < tbody.children.length; r++) {
                const val = tbody.children[r].children[s]?.querySelector('input[type="number"]')?.value;
                if (val && val.trim()) { hasData = true; break; }
            }
        }
        if (hasData) {
            data.stands.push({ index: s, name });
        }
    }

    Array.from(tbody.querySelectorAll('tr')).forEach((row, idx) => {
        let rowHasData = false;
        const standVals = [];
        data.stands.forEach(s => {
            const input = row.children[s.index]?.querySelector('input[type="number"]');
            const val = input ? input.value : '';
            if (val.trim()) rowHasData = true;
            standVals.push(val);
        });
        const typeInput = row.querySelector('.sheep-type input');
        const sheepType = typeInput ? typeInput.value : '';
        if (sheepType.trim()) rowHasData = true;
        if (rowHasData) {
            data.shearerCounts.push({
                count: idx + 1,
                stands: standVals,
                total: row.querySelector('.run-total')?.innerText || '0',
                sheepType
            });
        }
    });

    document.querySelectorAll('#shedStaffTable tr').forEach(row => {
        const name = row.querySelector('td:nth-child(1) input');
        const hours = row.querySelector('td:nth-child(2) input');
        if (name && hours && (name.value.trim() || hours.value.trim())) {
            data.shedStaff.push({ name: name.value, hours: hours.value });
        }
    });

    document.querySelectorAll('#sheepTypeTotalsTable tbody tr').forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (cells.length >= 2) {
            data.sheepTypeTotals.push({ type: cells[0].textContent, total: cells[1].textContent });
        }
    });

    return data;
}

function buildExportRows(data) {
    const rows = [];
    const boldRows = [];
    const add = (arr, bold=false) => {
        rows.push(arr);
        if (bold) boldRows.push(rows.length - 1);
    };

    add(['Station Name', data.stationName]);
    add(['Date', data.date]);
    add(['Team Leader', data.teamLeader]);
    add(['Comb Type', data.combType]);
    add(['Start Time', data.startTime]);
    add(['Finish Time', data.finishTime]);
    add(['Hours Worked', data.hoursWorked]);
    add(['Time System', data.timeSystem]);
    add([]);

    add(['Shearer Tallies'], true);
    const headerRow = ['Count #', ...data.stands.map(s => s.name), 'Total', 'Sheep Type'];
    add(headerRow, true);
    data.shearerCounts.forEach(run => {
        const row = [run.count, ...run.stands, run.total, run.sheepType];
        add(row);
    });
    add([]);

    add(['Shed Staff'], true);
    add(['Name', 'Hours Worked'], true);
    data.shedStaff.forEach(s => add([s.name, s.hours]));
    add([]);

    add(['Sheep Type Totals'], true);
    add(['Sheep Type', 'Total'], true);
    data.sheepTypeTotals.forEach(t => add([t.type, t.total]));

    return { rows, boldRows };
}

function exportCSV() {
    const data = collectExportData();
    const { rows } = buildExportRows(data);
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\r\n');
    let fileName = 'export.csv';
    if (data.stationName && data.date) {
        const parts = data.date.split('-');
        if (parts.length === 3) fileName = `${data.stationName}_${parts[2]}-${parts[1]}-${parts[0]}.csv`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('Excel export not available');
        return;
    }
    const data = collectExportData();
    const { rows, boldRows } = buildExportRows(data);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    boldRows.forEach(r => {
        for (let c = 0; c < rows[r].length; c++) {
            const cellAddr = XLSX.utils.encode_cell({ r, c });
            const cell = ws[cellAddr];
            if (cell) {
                cell.s = cell.s || {};
                cell.s.font = cell.s.font || {};
                cell.s.font.bold = true;
            }
        }
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tally');
    let fileName = 'export.xlsx';
    if (data.stationName && data.date) {
        const parts = data.date.split('-');
        if (parts.length === 3) fileName = `${data.stationName}_${parts[2]}-${parts[1]}-${parts[0]}.xlsx`;
    }
    XLSX.writeFile(wb, fileName);
}

function handleExport() {
    const format = document.getElementById('exportFormat')?.value;
    if (format === 'excel') exportToExcel();
    else exportCSV();
}
