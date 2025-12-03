document.getElementById('algorithm').addEventListener('change', toggleTimeQuantum);
document.getElementById('generateInputs').addEventListener('click', generateInputs);
document.getElementById('loadSample').addEventListener('click', loadSampleData);
document.getElementById('calculate').addEventListener('click', calculate);
document.getElementById('reset').addEventListener('click', reset);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');

    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'inline';
        localStorage.setItem('theme', 'dark');
    } else {
        sunIcon.style.display = 'inline';
        moonIcon.style.display = 'none';
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme on page load
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'inline';
    } else {
        sunIcon.style.display = 'inline';
        moonIcon.style.display = 'none';
    }
});

// Tooltip functionality
let tooltip = document.getElementById('tooltip');

function showTooltip(event, content) {
    tooltip.innerHTML = content;
    tooltip.classList.add('show');
    tooltip.style.left = event.pageX + 10 + 'px';
    tooltip.style.top = event.pageY - 10 + 'px';
}

function hideTooltip() {
    tooltip.classList.remove('show');
}

document.addEventListener('mousemove', (event) => {
    if (tooltip.classList.contains('show')) {
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY - 10 + 'px';
    }
});

function toggleTimeQuantum() {
    const algorithm = document.getElementById('algorithm').value;
    const timeQuantumLabel = document.getElementById('timeQuantumLabel');
    const timeQuantum = document.getElementById('timeQuantum');
    if (algorithm === 'rr') {
        timeQuantumLabel.style.display = 'inline';
        timeQuantum.style.display = 'inline';
        timeQuantum.required = true;
    } else {
        timeQuantumLabel.style.display = 'none';
        timeQuantum.style.display = 'none';
        timeQuantum.required = false;
    }
}

function generateInputs() {
    const numProcesses = parseInt(document.getElementById('numProcesses').value);
    const algorithm = document.getElementById('algorithm').value;
    const processInputs = document.getElementById('processInputs');
    processInputs.innerHTML = '';

    for (let i = 0; i < numProcesses; i++) {
        const div = document.createElement('div');
        div.className = 'process-input';
        let html = `
            <label>Process ${i + 1} Arrival Time:</label>
            <input type="number" id="arrival${i}" min="0" required>
            <label>Burst Time:</label>
            <input type="number" id="burst${i}" min="1" required>
        `;
        if (algorithm === 'priority') {
            html += `
                <label>Priority (lower number = higher priority):</label>
                <input type="number" id="priority${i}" min="1" required>
            `;
        }
        div.innerHTML = html;
        processInputs.appendChild(div);
    }
}

function loadSampleData() {
    document.getElementById('numProcesses').value = 4;
    generateInputs();
    document.getElementById('arrival0').value = 0;
    document.getElementById('burst0').value = 5;
    document.getElementById('arrival1').value = 1;
    document.getElementById('burst1').value = 3;
    document.getElementById('arrival2').value = 2;
    document.getElementById('burst2').value = 8;
    document.getElementById('arrival3').value = 3;
    document.getElementById('burst3').value = 6;
}

function calculate() {
    const algorithm = document.getElementById('algorithm').value;
    const numProcesses = parseInt(document.getElementById('numProcesses').value);
    const processes = [];

    for (let i = 0; i < numProcesses; i++) {
        const arrival = parseInt(document.getElementById(`arrival${i}`).value);
        const burst = parseInt(document.getElementById(`burst${i}`).value);
        const priority = algorithm === 'priority' ? parseInt(document.getElementById(`priority${i}`).value) : 1;
        processes.push({ id: i + 1, arrival, burst, priority, waiting: 0, turnaround: 0, completion: 0, remaining: burst });
    }

    let results;
    switch (algorithm) {
        case 'fcfs':
            results = calculateFCFS(processes);
            break;
        case 'sjf':
            results = calculateSJF(processes);
            break;
        case 'priority':
            results = calculatePriority(processes);
            break;
        case 'rr':
            const timeQuantum = parseInt(document.getElementById('timeQuantum').value);
            results = calculateRR(processes, timeQuantum);
            break;
    }

    displayResults(results.processes, results.avgWaiting, results.avgTurnaround, results.cpuUtilization, results.throughput, algorithm, results.gantt);
}

function calculateFCFS(processes) {
    const sortedProcesses = [...processes].sort((a, b) => a.arrival - b.arrival);
    let currentTime = 0;
    let totalWaiting = 0;
    let totalTurnaround = 0;
    let totalBurst = 0;

    sortedProcesses.forEach(p => {
        totalBurst += p.burst;
        if (currentTime < p.arrival) {
            currentTime = p.arrival;
        }
        p.waiting = currentTime - p.arrival;
        p.turnaround = p.waiting + p.burst;
        p.completion = currentTime + p.burst;
        currentTime += p.burst;
        totalWaiting += p.waiting;
        totalTurnaround += p.turnaround;
    });

    const maxTime = Math.max(...sortedProcesses.map(p => p.completion));
    const cpuUtilization = (totalBurst / maxTime) * 100;
    const throughput = sortedProcesses.length / maxTime;

    return {
        processes: sortedProcesses,
        avgWaiting: totalWaiting / sortedProcesses.length,
        avgTurnaround: totalTurnaround / sortedProcesses.length,
        cpuUtilization,
        throughput
    };
}

function calculateSJF(processes) {
    const sortedProcesses = [...processes].sort((a, b) => a.arrival - b.arrival);
    const readyQueue = [];
    let currentTime = 0;
    let totalWaiting = 0;
    let totalTurnaround = 0;
    let totalBurst = 0;
    const completed = [];

    while (completed.length < sortedProcesses.length) {
        // Add arrived processes to ready queue
        while (sortedProcesses.length > 0 && sortedProcesses[0].arrival <= currentTime) {
            readyQueue.push(sortedProcesses.shift());
        }

        if (readyQueue.length === 0) {
            currentTime = sortedProcesses[0].arrival;
            continue;
        }

        // Select shortest job
        readyQueue.sort((a, b) => a.burst - b.burst);
        const current = readyQueue.shift();
        totalBurst += current.burst;

        current.waiting = currentTime - current.arrival;
        current.turnaround = current.waiting + current.burst;
        current.completion = currentTime + current.burst;
        currentTime += current.burst;

        totalWaiting += current.waiting;
        totalTurnaround += current.turnaround;
        completed.push(current);
    }

    const maxTime = Math.max(...completed.map(p => p.completion));
    const cpuUtilization = (totalBurst / maxTime) * 100;
    const throughput = completed.length / maxTime;

    return {
        processes: completed,
        avgWaiting: totalWaiting / completed.length,
        avgTurnaround: totalTurnaround / completed.length,
        cpuUtilization,
        throughput
    };
}

function calculatePriority(processes) {
    const sortedProcesses = [...processes].sort((a, b) => a.arrival - b.arrival);
    const readyQueue = [];
    let currentTime = 0;
    let totalWaiting = 0;
    let totalTurnaround = 0;
    let totalBurst = 0;
    const completed = [];

    while (completed.length < sortedProcesses.length) {
        // Add arrived processes to ready queue
        while (sortedProcesses.length > 0 && sortedProcesses[0].arrival <= currentTime) {
            readyQueue.push(sortedProcesses.shift());
        }

        if (readyQueue.length === 0) {
            currentTime = sortedProcesses[0].arrival;
            continue;
        }

        // Select highest priority (lowest number)
        readyQueue.sort((a, b) => a.priority - b.priority);
        const current = readyQueue.shift();
        totalBurst += current.burst;

        current.waiting = currentTime - current.arrival;
        current.turnaround = current.waiting + current.burst;
        current.completion = currentTime + current.burst;
        currentTime += current.burst;

        totalWaiting += current.waiting;
        totalTurnaround += current.turnaround;
        completed.push(current);
    }

    const maxTime = Math.max(...completed.map(p => p.completion));
    const cpuUtilization = (totalBurst / maxTime) * 100;
    const throughput = completed.length / maxTime;

    return {
        processes: completed,
        avgWaiting: totalWaiting / completed.length,
        avgTurnaround: totalTurnaround / completed.length,
        cpuUtilization,
        throughput
    };
}

function calculateRR(processes, timeQuantum) {
    const queue = [...processes].sort((a, b) => a.arrival - b.arrival);
    let currentTime = 0;
    let totalWaiting = 0;
    let totalTurnaround = 0;
    let totalBurst = 0;
    const completed = [];
    const gantt = [];

    while (queue.length > 0 || completed.length < processes.length) {
        // Add arrived processes to queue
        while (processes.some(p => p.arrival <= currentTime && !queue.includes(p) && !completed.includes(p))) {
            const arrived = processes.filter(p => p.arrival <= currentTime && !queue.includes(p) && !completed.includes(p));
            queue.push(...arrived);
        }

        if (queue.length === 0) {
            currentTime = Math.min(...processes.filter(p => !completed.includes(p)).map(p => p.arrival));
            continue;
        }

        const current = queue.shift();
        const executeTime = Math.min(timeQuantum, current.remaining);
        totalBurst += executeTime;

        gantt.push({ id: current.id, start: currentTime, duration: executeTime });

        currentTime += executeTime;
        current.remaining -= executeTime;

        if (current.remaining === 0) {
            current.completion = currentTime;
            current.turnaround = current.completion - current.arrival;
            current.waiting = current.turnaround - current.burst;
            totalWaiting += current.waiting;
            totalTurnaround += current.turnaround;
            completed.push(current);
        } else {
            queue.push(current);
        }
    }

    const maxTime = Math.max(...completed.map(p => p.completion));
    const cpuUtilization = (totalBurst / maxTime) * 100;
    const throughput = completed.length / maxTime;

    return {
        processes: completed,
        avgWaiting: totalWaiting / completed.length,
        avgTurnaround: totalTurnaround / completed.length,
        cpuUtilization,
        throughput,
        gantt
    };
}

function reset() {
    document.getElementById('numProcesses').value = '';
    document.getElementById('processInputs').innerHTML = '';
    document.getElementById('results').innerHTML = '';
    const svg = document.getElementById('ganttChart');
    svg.innerHTML = '';
}

function displayResults(processes, avgWaiting, avgTurnaround, cpuUtilization, throughput, algorithm, gantt) {
    const results = document.getElementById('results');
    let html = `<h2>${algorithm.toUpperCase()} Scheduling Results</h2>`;
    html += '<table>';
    html += '<tr><th>Process</th><th>Arrival Time</th><th>Burst Time</th><th>Waiting Time</th><th>Turnaround Time</th><th>Completion Time</th></tr>';
    processes.forEach(p => {
        html += `<tr><td>${p.id}</td><td>${p.arrival}</td><td>${p.burst}</td><td>${p.waiting}</td><td>${p.turnaround}</td><td>${p.completion}</td></tr>`;
    });
    html += '</table>';
    html += `<p>Average Waiting Time: ${avgWaiting.toFixed(2)}</p>`;
    html += `<p>Average Turnaround Time: ${avgTurnaround.toFixed(2)}</p>`;
    html += `<p>CPU Utilization: ${cpuUtilization.toFixed(2)}%</p>`;
    html += `<p>Throughput: ${throughput.toFixed(2)} processes per unit time</p>`;
    results.innerHTML = html;

    drawGanttChart(processes, algorithm, gantt);
}

function drawGanttChart(processes, algorithm, gantt) {
    const svg = document.getElementById('ganttChart');
    svg.innerHTML = '';

    let maxTime;
    if (algorithm === 'rr' && gantt) {
        maxTime = Math.max(...gantt.map(g => g.start + g.duration));
    } else {
        maxTime = Math.max(...processes.map(p => p.completion));
    }
    const scale = 800 / maxTime;
    const barHeight = 40;
    const yStart = 50;

    // Calculate number of processes
    let numProcesses;
    if (algorithm === 'rr' && gantt) {
        numProcesses = new Set(gantt.map(g => g.id)).size;
    } else {
        numProcesses = processes.length;
    }

    // Calculate total height
    const totalHeight = yStart + (numProcesses * (barHeight + 10)) + 50;
    svg.setAttribute('height', totalHeight);

    // Draw time axis at the bottom
    const axisY = yStart + (numProcesses * (barHeight + 10)) + barHeight;
    const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axis.setAttribute('x1', 0);
    axis.setAttribute('y1', axisY);
    axis.setAttribute('x2', svg.clientWidth);
    axis.setAttribute('y2', axisY);
    axis.setAttribute('stroke', 'black');
    svg.appendChild(axis);

    // Draw time labels
    for (let t = 0; t <= maxTime; t += Math.ceil(maxTime / 10)) {
        const x = t * scale;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', axisY + 20);
        text.setAttribute('text-anchor', 'middle');
        text.textContent = t.toString();
        text.classList.add('gantt-label');
        svg.appendChild(text);
    }

    // Draw idle time at the bottom
    const idleY = axisY - barHeight - 10;
    if (algorithm === 'rr' && gantt) {
        let lastEnd = 0;
        gantt.forEach(g => {
            if (g.start > lastEnd) {
                const idleRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                idleRect.setAttribute('x', lastEnd * scale);
                idleRect.setAttribute('y', idleY);
                idleRect.setAttribute('width', (g.start - lastEnd) * scale);
                idleRect.setAttribute('height', barHeight);
                idleRect.setAttribute('fill', 'gray');
                idleRect.classList.add('gantt-idle');
                svg.appendChild(idleRect);

                const idleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                idleText.setAttribute('x', lastEnd * scale + 10);
                idleText.setAttribute('y', idleY + barHeight / 2 + 5);
                idleText.setAttribute('fill', 'black');
                idleText.textContent = 'Idle';
                idleText.classList.add('gantt-label');
                svg.appendChild(idleText);
            }
            lastEnd = g.start + g.duration;
        });
    } else {
        let lastEnd = 0;
        processes.forEach(p => {
            const startTime = p.completion - p.burst;
            if (startTime > lastEnd) {
                const idleRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                idleRect.setAttribute('x', lastEnd * scale);
                idleRect.setAttribute('y', idleY);
                idleRect.setAttribute('width', (startTime - lastEnd) * scale);
                idleRect.setAttribute('height', barHeight);
                idleRect.setAttribute('fill', 'gray');
                idleRect.classList.add('gantt-idle');
                svg.appendChild(idleRect);

                const idleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                idleText.setAttribute('x', lastEnd * scale + 10);
                idleText.setAttribute('y', idleY + barHeight / 2 + 5);
                idleText.setAttribute('fill', 'black');
                idleText.textContent = 'Idle';
                idleText.classList.add('gantt-label');
                svg.appendChild(idleText);
            }
            lastEnd = p.completion;
        });
    }

    // Draw process bars
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    if (algorithm === 'rr' && gantt) {
        gantt.forEach((g) => {
            const x = g.start * scale;
            const width = g.duration * scale;
            const y = yStart + (g.id - 1) * (barHeight + 10);
            const process = processes.find(p => p.id === g.id);

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', width);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', colors[(g.id - 1) % colors.length]);
            rect.setAttribute('stroke', 'black');
            rect.classList.add('gantt-bar');
            svg.appendChild(rect);

            // Add tooltip
            const tooltipContent = `<strong>Process ${g.id}</strong><br>Arrival Time: ${process.arrival}<br>Burst Time: ${process.burst}<br>Waiting Time: ${process.waiting}<br>Turnaround Time: ${process.turnaround}<br>Completion Time: ${process.completion}`;
            rect.addEventListener('mouseover', (event) => showTooltip(event, tooltipContent));
            rect.addEventListener('mouseout', hideTooltip);

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `Process ${g.id}\nArrival Time: ${process.arrival}\nBurst Time: ${process.burst}\nWaiting Time: ${process.waiting}\nTurnaround Time: ${process.turnaround}\nCompletion Time: ${process.completion}`;
            rect.appendChild(title);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + width / 2);
            text.setAttribute('y', y + barHeight / 2 + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'black');
            text.textContent = `P${g.id}`;
            text.classList.add('gantt-label');
            svg.appendChild(text);
        });
    } else {
        processes.forEach((p, index) => {
            const startTime = p.completion - p.burst;
            const x = startTime * scale;
            const width = p.burst * scale;
            const y = yStart + index * (barHeight + 10);

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', width);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', colors[index % colors.length]);
            rect.setAttribute('stroke', 'black');
            rect.classList.add('gantt-bar');
            svg.appendChild(rect);

            // Add tooltip
            const tooltipContent = `<strong>Process ${p.id}</strong><br>Arrival Time: ${p.arrival}<br>Burst Time: ${p.burst}<br>Waiting Time: ${p.waiting}<br>Turnaround Time: ${p.turnaround}<br>Completion Time: ${p.completion}`;
            rect.addEventListener('mouseover', (event) => showTooltip(event, tooltipContent));
            rect.addEventListener('mouseout', hideTooltip);

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `Process ${p.id}\nArrival Time: ${p.arrival}\nBurst Time: ${p.burst}\nWaiting Time: ${p.waiting}\nTurnaround Time: ${p.turnaround}\nCompletion Time: ${p.completion}`;
            rect.appendChild(title);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + width / 2);
            text.setAttribute('y', y + barHeight / 2 + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'black');
            text.textContent = `P${p.id}`;
            text.classList.add('gantt-label');
            svg.appendChild(text);
        });
    }
}
