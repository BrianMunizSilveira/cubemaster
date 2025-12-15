document.addEventListener('DOMContentLoaded', function () {
    const chartsInit = {};
    const themeKey = 'theme-preference';
    const timesStorageKey = 'times-data';
    let appData = { times: [], exportDate: null, solves: 0 };
    function isSolveObject(x) {
        return x && typeof x === 'object' && typeof x.time === 'number' && 'penalty' in x;
    }
    function toSolveObjects(arr) {
        if (!Array.isArray(arr)) return [];
        if (arr.every(isSolveObject)) return arr;
        return arr.map(t => ({ time: Number(t), penalty: 'none', method: 'CFOP', cube: '3x3' }));
    }
    function effectiveTime(s) {
        if (!isSolveObject(s)) return Number(s);
        if (s.penalty === 'dnf') return NaN;
        return s.penalty === 'plus2' ? s.time + 2 : s.time;
    }
    function parseCsTimerExport(text) {
        const lines = text.split(/\r?\n/);
        let exportDate = null;
        const mDate = text.match(/Gerado .* em (\d{4}-\d{2}-\d{2})/);
        if (mDate) exportDate = mDate[1];
        const mSolves = text.match(/solves\/total:\s*(\d+)\//i);
        const solves = mSolves ? parseInt(mSolves[1], 10) : 0;
        const idx = lines.findIndex(l => /Lista de Tempos:/i.test(l));
        const times = [];
        for (let i = idx + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const m = line.match(/^\d+\.\s+(DNF\(([0-9.]+)\)|([0-9.]+))/i);
            if (!m) continue;
            const isDnf = !!m[2];
            const val = m[3] ? parseFloat(m[3]) : (m[2] ? parseFloat(m[2]) : NaN);
            if (!isNaN(val)) {
                times.push({
                    time: val,
                    penalty: isDnf ? 'dnf' : 'none',
                    method: 'CFOP',
                    cube: '3x3'
                });
            }
        }
        return { times, exportDate, solves: solves || times.length };
    }
    function computeDistribution(solves) {
        const d = { sub15: 0, r15_18: 0, r18_21: 0, r21_24: 0, over24: 0 };
        solves.forEach(s => {
            const t = effectiveTime(s);
            if (!isFinite(t)) return;
            if (t < 15) d.sub15++;
            else if (t < 18) d.r15_18++;
            else if (t < 21) d.r18_21++;
            else if (t < 24) d.r21_24++;
            else d.over24++;
        });
        return d;
    }
    function avg(arr) {
        if (!arr.length) return NaN;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
    function movingAverage(arr, n) {
        const out = [];
        for (let i = 0; i < arr.length; i++) {
            const start = Math.max(0, i - n + 1);
            const slice = arr.slice(start, i + 1);
            out.push(avg(slice));
        }
        return out;
    }
    function ensureToaster() {
        if (!document.getElementById('toaster')) {
            const t = document.createElement('div');
            t.id = 'toaster';
            document.body.appendChild(t);
        }
    }
    function showToast(message) {
        ensureToaster();
        const t = document.getElementById('toaster');
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = message;
        t.appendChild(el);
        setTimeout(() => { el.remove(); }, 3000);
    }
    function aoN(solves, n) {
        if (solves.length < n) return NaN;
        const last = solves.slice(-n);
        if (last.some(s => !Number.isFinite(effectiveTime(s)))) return NaN;
        const eff = last.map(effectiveTime);
        const min = Math.min(...eff);
        const max = Math.max(...eff);
        const middle = eff.filter(t => t !== min && t !== max);
        if (middle.length !== n - 2) {
            const sorted = eff.slice().sort((a, b) => a - b);
            const trimmed = sorted.slice(1, sorted.length - 1);
            return avg(trimmed);
        }
        return avg(middle);
    }
    async function initData() {
        const saved = localStorage.getItem(timesStorageKey);
        if (saved) {
            const timesRaw = JSON.parse(saved);
            const times = toSolveObjects(timesRaw);
            appData = { times, exportDate: null, solves: times.length };
            return;
        }
        try {
            const res = await fetch('./meus-tempos.txt', { cache: 'no-store' });
            if (res.ok) {
                const text = await res.text();
                appData = parseCsTimerExport(text);
                localStorage.setItem(timesStorageKey, JSON.stringify(appData.times));
                return;
            }
        } catch { }
        const fallback = [16.45, 18.32, 17.89, 15.32, 19.21, 18.76, 20.12, 19.45].map(t => ({ time: t, penalty: 'none', method: 'CFOP', cube: '3x3' }));
        appData = { times: fallback, exportDate: null, solves: fallback.length };
    }
    function renderDashboardCards() {
        const pbEl = document.getElementById('statPbValue');
        const ao5El = document.getElementById('statAo5Value');
        const ao12El = document.getElementById('statAo12Value');
        const solvesEl = document.getElementById('statSolvesValue');
        const consEl = document.getElementById('statConsistencyValue');
        if (pbEl) {
            const valid = appData.times.map(effectiveTime).filter(Number.isFinite);
            const pb = Math.min(...valid);
            pbEl.textContent = isFinite(pb) ? `${pb.toFixed(2)}s` : '--';
        }
        if (ao5El) {
            const a5 = aoN(appData.times, 5);
            ao5El.textContent = isFinite(a5) ? `${a5.toFixed(2)}s` : '--';
        }
        if (ao12El) {
            const a12 = aoN(appData.times, 12);
            ao12El.textContent = isFinite(a12) ? `${a12.toFixed(2)}s` : '--';
        }
        if (solvesEl) {
            solvesEl.textContent = String(appData.solves || appData.times.length);
        }
        if (consEl) {
            const valid = appData.times.map(effectiveTime).filter(Number.isFinite);
            const m = avg(valid);
            const within = valid.filter(t => Math.abs(t - m) <= m * 0.1).length;
            const pct = valid.length ? Math.round((within / valid.length) * 100) : 0;
            consEl.textContent = `${pct}%`;
        }
    }
    function getThemePref() {
        return 'light';
    }
    function applyThemeFromPref() {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    applyThemeFromPref();
    function initTimeEvolutionChart() {
        if (chartsInit.timeEvolutionChart) return;
        const el = document.getElementById('timeEvolutionChart');
        if (!el) return;
        const ctx = el.getContext('2d');
        const valid = appData.times.map(effectiveTime).filter(Number.isFinite);
        const series = valid.slice(-30);
        const labels = series.map((_, i) => String(i + 1));
        const ma5 = movingAverage(series, 5);
        chartsInit.timeEvolutionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Tempo por solve',
                    data: series,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Média móvel (5)',
                    data: ma5,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'Tempo (segundos)' }
                    },
                    x: { title: { display: true, text: 'Solves' } }
                }
            }
        });
        el.classList.remove('skeleton');
    }
    function initTimeDistributionChart() {
        if (chartsInit.timeDistributionChart) return;
        const el = document.getElementById('timeDistributionChart');
        if (!el) return;
        const ctx = el.getContext('2d');
        const dist = computeDistribution(appData.times);
        chartsInit.timeDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sub-15', '15-18', '18-21', '21-24', '24+'],
                datasets: [{
                    data: [dist.sub15, dist.r15_18, dist.r18_21, dist.r21_24, dist.over24],
                    backgroundColor: ['#10b981', '#2563eb', '#f59e0b', '#ef4444', '#9ca3af'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
        el.classList.remove('skeleton');
    }
    function initMethodPerformanceChart() {
        if (chartsInit.methodPerformanceChart) return;
        const el = document.getElementById('methodPerformanceChart');
        if (!el) return;
        const ctx = el.getContext('2d');
        chartsInit.methodPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['CFOP', 'Roux', 'ZZ'],
                datasets: [{
                    label: 'Média (s)',
                    data: [19.8, 21.2, 22.5],
                    backgroundColor: '#2563eb'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Segundos' } }
                }
            }
        });
        el.classList.remove('skeleton');
    }
    function initSessionVolumeChart() {
        if (chartsInit.sessionVolumeChart) return;
        const el = document.getElementById('sessionVolumeChart');
        if (!el) return;
        const ctx = el.getContext('2d');
        chartsInit.sessionVolumeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Solves por dia',
                    data: [20, 34, 28, 22, 26, 40, 32],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: { responsive: true }
        });
        el.classList.remove('skeleton');
    }
    function observeCharts() {
        const ids = ['timeEvolutionChart', 'timeDistributionChart', 'methodPerformanceChart', 'sessionVolumeChart'];
        const mapInit = {
            timeEvolutionChart: initTimeEvolutionChart,
            timeDistributionChart: initTimeDistributionChart,
            methodPerformanceChart: initMethodPerformanceChart,
            sessionVolumeChart: initSessionVolumeChart
        };
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        mapInit[id]();
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) io.observe(el);
            });
        } else {
            initTimeEvolutionChart();
            initTimeDistributionChart();
            initMethodPerformanceChart();
            initSessionVolumeChart();
        }
    }
    function buildTimesRows() {
        const dateStr = appData.exportDate ? new Date(appData.exportDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
        const valid = appData.times.map(effectiveTime).filter(Number.isFinite);
        const pb = valid.length ? Math.min(...valid) : NaN;
        const rows = [];
        const start = Math.max(appData.times.length - 100, 0);
        for (let idx = appData.times.length - 1; idx >= start; idx--) {
            const s = appData.times[idx];
            const eff = effectiveTime(s);
            rows.push({
                date: dateStr,
                time: eff,
                method: s.method || 'CFOP',
                cube: s.cube || '3x3',
                penalty: s.penalty || 'none',
                isPB: isFinite(pb) && isFinite(eff) ? eff === pb : false,
                index: idx
            });
        }
        return rows;
    }
    function formatTime(seconds) {
        return seconds.toFixed(2) + 's';
    }
    const timesTableBody = document.getElementById('timesTableBody');
    function showTableSkeleton() {
        if (!timesTableBody) return;
        timesTableBody.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            const block = document.createElement('div');
            block.className = 'skeleton skeleton--row';
            cell.appendChild(block);
            row.appendChild(cell);
            timesTableBody.appendChild(row);
        }
    }
    function renderTimesTable() {
        if (!timesTableBody) return;
        timesTableBody.innerHTML = '';
        const rows = buildTimesRows();
        rows.forEach(time => {
            const row = document.createElement('tr');
            const dateObj = new Date(time.date);
            const formattedDate = dateObj.toLocaleDateString('pt-BR');
            const penaltyLabel = time.penalty === 'dnf' ? 'DNF' : (time.penalty === 'plus2' ? '+2' : '');
            const statusCell = time.penalty === 'dnf'
                ? '<span class="badge badge--dnf">DNF</span>'
                : (time.time < 16 ? '<span class="badge badge--good">Ótimo</span>' : time.time < 20 ? '<span class="badge badge--warn">Bom</span>' : '<span class="badge badge--bad">Melhorável</span>');
            row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td class="time-cell">${Number.isFinite(time.time) ? formatTime(time.time) : '—'} ${penaltyLabel ? `<span class="badge ${penaltyLabel === '+2' ? 'badge--warn' : 'badge--dnf'}">${penaltyLabel}</span>` : ''} ${time.isPB ? '<span class="pb-badge">PB</span>' : ''}</td>
                        <td>${time.method}</td>
                        <td>${time.cube}</td>
                        <td>${statusCell}</td>
                        <td>
                            <button class="btn btn--sm" data-action="edit" data-index="${time.index}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn--sm btn--danger" data-action="delete" data-index="${time.index}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
            timesTableBody.appendChild(row);
        });
        const addBtn = document.getElementById('addTimeBtn');
        const addForm = document.getElementById('addTimeForm');
        const formCancel = document.getElementById('formCancelBtn');
        const formTimeInput = document.getElementById('formTimeInput');
        const formMethodInput = document.getElementById('formMethodInput');
        const formCubeInput = document.getElementById('formCubeInput');
        const formPlus2 = document.getElementById('formPlus2');
        const formDnf = document.getElementById('formDnf');
        if (addBtn && addForm) {
            addBtn.addEventListener('click', function () {
                addForm.style.display = addForm.style.display === 'none' ? 'grid' : 'none';
            });
        }
        if (formCancel && addForm) {
            formCancel.addEventListener('click', function () {
                addForm.style.display = 'none';
            });
        }
        if (formDnf && formPlus2) {
            formDnf.addEventListener('change', function () {
                if (this.checked) formPlus2.checked = false;
            });
        }
        if (addForm) {
            addForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const val = parseFloat(formTimeInput.value);
                const isDnf = !!(formDnf && formDnf.checked);
                const isPlus2 = !!(formPlus2 && formPlus2.checked) && !isDnf;
                if (!isDnf && (!isFinite(val) || val <= 0)) return;
                const solve = { time: isFinite(val) ? val : 0, penalty: isDnf ? 'dnf' : (isPlus2 ? 'plus2' : 'none'), method: formMethodInput.value || 'CFOP', cube: formCubeInput.value || '3x3' };
                appData.times.push(solve);
                localStorage.setItem(timesStorageKey, JSON.stringify(appData.times));
                addForm.style.display = 'none';
                formTimeInput.value = '';
                if (formPlus2) formPlus2.checked = false;
                if (formDnf) formDnf.checked = false;
                renderTimesTable();
                renderDashboardCards();
                if (chartsInit.timeEvolutionChart) { chartsInit.timeEvolutionChart.destroy(); chartsInit.timeEvolutionChart = null; }
                if (chartsInit.timeDistributionChart) { chartsInit.timeDistributionChart.destroy(); chartsInit.timeDistributionChart = null; }
                initTimeEvolutionChart();
                initTimeDistributionChart();
                updateHistoricoSummary();
                showToast('Tempo salvo');
            });
        }
        timesTableBody.addEventListener('click', function (e) {
            const target = e.target.closest('button[data-action]');
            if (!target) return;
            const idx = parseInt(target.dataset.index, 10);
            if (target.dataset.action === 'delete' && isFinite(idx)) {
                appData.times.splice(idx, 1);
                localStorage.setItem(timesStorageKey, JSON.stringify(appData.times));
                renderTimesTable();
                renderDashboardCards();
                if (chartsInit.timeEvolutionChart) { chartsInit.timeEvolutionChart.destroy(); chartsInit.timeEvolutionChart = null; }
                if (chartsInit.timeDistributionChart) { chartsInit.timeDistributionChart.destroy(); chartsInit.timeDistributionChart = null; }
                initTimeEvolutionChart();
                initTimeDistributionChart();
                updateHistoricoSummary();
            }
        });
    }
    const filterMethod = document.getElementById('filterMethod');
    const filterRange = document.getElementById('filterRange');
    const applyFilters = document.getElementById('applyFilters');
    function updateHistoricoSummary() {
        const rows = buildTimesRows().filter(t => filterMethod.value === 'all' ? true : t.method === filterMethod.value);
        const valid = rows.filter(r => Number.isFinite(r.time));
        const avgVal = avg(valid.map(t => t.time));
        const pb = valid.length ? Math.min(...valid.map(t => t.time)) : NaN;
        document.getElementById('historicoAvg').textContent = isFinite(avgVal) ? formatTime(avgVal) : '--';
        document.getElementById('historicoPb').textContent = isFinite(pb) ? formatTime(pb) : '--';
        document.getElementById('historicoSolves').textContent = String(valid.length);
    }
    if (applyFilters) {
        applyFilters.addEventListener('click', updateHistoricoSummary);
        updateHistoricoSummary();
    }
    function setupNav() {
        const links = document.querySelectorAll('.nav-menu a');
        const current = location.pathname.split('/').pop() || 'index.html';
        links.forEach(a => {
            const path = new URL(a.href, location.href).pathname.split('/').pop();
            a.classList.toggle('active', path === current);
        });
    }
    function setupPreferences() {
        const prefDarkMode = document.getElementById('prefDarkMode');
        const prefCompactCards = document.getElementById('prefCompactCards');
        const prefAnimations = document.getElementById('prefAnimations');
        if (prefDarkMode) { prefDarkMode.disabled = true; prefDarkMode.checked = false; }
        if (prefCompactCards) {
            prefCompactCards.addEventListener('change', function () {
                document.body.classList.toggle('compact-cards', this.checked);
            });
        }
        if (prefAnimations) {
            prefAnimations.addEventListener('change', function () {
                const speed = this.checked ? 0.4 : 0;
                if (chartsInit.timeEvolutionChart) chartsInit.timeEvolutionChart.options.datasets?.forEach?.(d => d.tension = speed);
            });
        }
    }
    function setupImport() {
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');
        const exportBtn = document.getElementById('exportBtn');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', async function () {
                const f = this.files?.[0];
                if (!f) return;
                const text = await f.text();
                const parsed = parseCsTimerExport(text);
                appData = parsed;
                localStorage.setItem(timesStorageKey, JSON.stringify(appData.times));
                renderTimesTable();
                updateHistoricoSummary();
                if (chartsInit.timeEvolutionChart) { chartsInit.timeEvolutionChart.destroy(); chartsInit.timeEvolutionChart = null; }
                if (chartsInit.timeDistributionChart) { chartsInit.timeDistributionChart.destroy(); chartsInit.timeDistributionChart = null; }
                initTimeEvolutionChart();
                initTimeDistributionChart();
                renderDashboardCards();
                showToast('Tempos importados');
            });
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                const header = ['data', 'tempo', 'penalidade', 'metodo', 'cubo'];
                const rows = buildTimesRows().map(r => [
                    r.date,
                    Number.isFinite(r.time) ? r.time.toFixed(2) : 'DNF',
                    r.penalty || 'none',
                    r.method,
                    r.cube
                ]);
                const csv = [header.join(','), ...rows.map(c => c.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cubemaster-tempos.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
    }
    (async function () {
        showTableSkeleton();
        await initData();
        renderDashboardCards();
        observeCharts();
        setupNav();
        setupPreferences();
        setupImport();
        renderTimesTable();
    })();
});
