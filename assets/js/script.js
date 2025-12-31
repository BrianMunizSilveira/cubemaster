// ============================================
// CONSTANTS & CONFIG
// ============================================
const CONFIG = {
    TIMES_STORAGE_KEY: 'times-data',
    THEME_KEY: 'theme-preference',
    DEFAULT_PAGE_SIZE: 100,
    DEFAULT_CUBE: '3x3',
    DEFAULT_METHOD: 'CFOP',
    PENALTIES: {
        NONE: 'none',
        PLUS2: 'plus2',
        DNF: 'dnf'
    },
    CHART_CONFIGS: {
        COLORS: {
            PRIMARY: '#2563eb',
            SUCCESS: '#10b981',
            WARNING: '#f59e0b',
            DANGER: '#ef4444',
            PURPLE: '#8b5cf6'
        }
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const Utils = (function() {
    function isSolveObject(x) {
        return x && typeof x === 'object' && typeof x.time === 'number' && 'penalty' in x;
    }

    function effectiveTime(s) {
        if (!isSolveObject(s)) return Number(s);
        if (s.penalty === CONFIG.PENALTIES.DNF) return NaN;
        return s.penalty === CONFIG.PENALTIES.PLUS2 ? s.time + 2 : s.time;
    }

    function parseTimeStr(str) {
        if (!str) return NaN;
        let val = parseFloat(str);
        
        if (str.includes(':')) {
            const parts = str.split(':');
            if (parts.length === 2) {
                val = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
            }
        }
        
        return val;
    }

    function avg(arr) {
        if (!arr?.length) return NaN;
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

    function formatTime(seconds) {
        return seconds.toFixed(2) + 's';
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    }

    function toSolveObjects(arr) {
        if (!Array.isArray(arr)) return [];
        
        let res = [];
        if (arr.every(isSolveObject)) {
            res = arr;
        } else {
            res = arr.map(t => ({ 
                time: Number(t), 
                penalty: CONFIG.PENALTIES.NONE, 
                method: CONFIG.DEFAULT_METHOD, 
                cube: CONFIG.DEFAULT_CUBE 
            }));
        }
        
        return res;
    }

    function simulateDates(times) {
        if (!times.length) return;
        
        if (times.every(t => t.date && !isNaN(new Date(t.date).getTime()))) return;

        let currentDate = new Date();
        let solvesToday = 0;
        const maxSolvesPerDay = 15;

        for (let i = times.length - 1; i >= 0; i--) {
            if (!times[i].date) {
                times[i].date = currentDate.toISOString();
                solvesToday++;

                if (solvesToday >= Math.floor(Math.random() * maxSolvesPerDay) + 5) {
                    currentDate.setDate(currentDate.getDate() - 1);
                    solvesToday = 0;
                }
            }
        }
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

    return {
        isSolveObject,
        effectiveTime,
        parseTimeStr,
        avg,
        movingAverage,
        formatTime,
        formatDate,
        toSolveObjects,
        simulateDates,
        aoN,
        showToast
    };
})();

// ============================================
// DATA IMPORTER
// ============================================
const DataImporter = (function() {
    function parseCsTimerExport(text) {
        let times = [];
        let exportDate = null;
        const lines = text.split(/\r?\n/);

        // 1. Tentar parsing JSON
        try {
            const json = JSON.parse(text);
            let sessionData = [];

            if (Array.isArray(json)) {
                sessionData = json;
            } else if (typeof json === 'object' && json !== null) {
                Object.keys(json).forEach(key => {
                    if ((key.startsWith('session') || key === 'times') && Array.isArray(json[key])) {
                        sessionData = sessionData.concat(json[key]);
                    }
                });
            }

            if (sessionData.length > 0) {
                sessionData.forEach(s => {
                    // Formato CsTimer Array: [penalty, time(ms), scramble, timestamp]
                    if (Array.isArray(s) && s.length >= 2 && typeof s[1] === 'number') {
                        const penaltyVal = s[0];
                        const timeMs = s[1];
                        const ts = s[3];

                        let penalty = CONFIG.PENALTIES.NONE;
                        if (penaltyVal === -1) penalty = CONFIG.PENALTIES.DNF;
                        else if (penaltyVal === 2000) penalty = CONFIG.PENALTIES.PLUS2;

                        times.push({
                            time: timeMs / 1000,
                            penalty: penalty,
                            method: CONFIG.DEFAULT_METHOD,
                            cube: CONFIG.DEFAULT_CUBE,
                            date: ts ? new Date(ts * 1000).toISOString() : null
                        });
                    }
                    // Formato Objeto
                    else if (typeof s === 'object' && s.time) {
                        times.push(s);
                    }
                });

                if (times.length > 0) {
                    return { 
                        times, 
                        exportDate: new Date().toISOString(), 
                        solves: times.length 
                    };
                }
            }
        } catch (e) {
            // Não é JSON válido, continuar
        }

        // 2. Parsing de Twisty Timer
        const twistyHeaderRegex = /Puzzle.*Time\(millis\).*Date\(millis\)/i;
        if (twistyHeaderRegex.test(lines[0]) || twistyHeaderRegex.test(lines[1] || '')) {
            const headerLineIdx = lines.findIndex(l => twistyHeaderRegex.test(l));
            
            for (let i = headerLineIdx + 1; i < lines.length; i++) {
                let line = lines[i].trim();
                if (!line) continue;
                
                const cols = line.split(';');
                if (cols.length < 4) continue;

                const cleanCol = (s) => s ? s.replace(/^"|"$/g, '').trim() : '';
                
                const puzzle = cleanCol(cols[0]);
                const timeMs = parseFloat(cleanCol(cols[2]));
                const dateMs = parseFloat(cleanCol(cols[3]));
                const penaltyCode = cleanCol(cols[5]);

                let penalty = CONFIG.PENALTIES.NONE;
                if (penaltyCode === '1') penalty = CONFIG.PENALTIES.PLUS2;
                else if (penaltyCode === '2') penalty = CONFIG.PENALTIES.DNF;

                if (!isNaN(timeMs)) {
                    times.push({
                        time: timeMs / 1000,
                        penalty: penalty,
                        method: CONFIG.DEFAULT_METHOD,
                        cube: puzzle === '333' ? '3x3' : (puzzle || '3x3'),
                        date: dateMs ? new Date(dateMs).toISOString() : null
                    });
                }
            }
            if (times.length > 0) return { times, exportDate, solves: times.length };
        }

        // 3. Parsing de CSV Simples
        const simpleCsvRegex = /^"([^"]+)";"([^"]+)";"([^"]+)"/;
        const firstValidLine = lines.find(l => l.trim());
        
        if (firstValidLine && simpleCsvRegex.test(firstValidLine.trim())) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const m = line.match(simpleCsvRegex);
                if (m) {
                    let timeRaw = m[1];
                    let scramble = m[2];
                    let dateStr = m[3];
                    
                    let penalty = CONFIG.PENALTIES.NONE;
                    let timeVal = NaN;

                    if (/^DNF/i.test(timeRaw)) {
                        penalty = CONFIG.PENALTIES.DNF;
                        const mDnf = timeRaw.match(/\(([\d.:]+)\)/);
                        if (mDnf) timeVal = Utils.parseTimeStr(mDnf[1]);
                    } else if (/\+$/.test(timeRaw)) {
                        penalty = CONFIG.PENALTIES.PLUS2;
                        timeVal = Utils.parseTimeStr(timeRaw.replace('+', ''));
                    } else {
                        timeVal = Utils.parseTimeStr(timeRaw);
                    }

                    if (!isNaN(timeVal)) {
                        times.push({
                            time: timeVal,
                            penalty: penalty,
                            method: CONFIG.DEFAULT_METHOD,
                            cube: CONFIG.DEFAULT_CUBE,
                            date: dateStr ? new Date(dateStr).toISOString() : null,
                            scramble: scramble
                        });
                    }
                }
            }
            if (times.length > 0) return { times, exportDate, solves: times.length };
        }

        // 4. Parsing de CSV Genérico
        const csvHeaderRegex = /^(?:No\.|Solves?)[;,](?:Time|Tempo)[;,].*/i;
        if (csvHeaderRegex.test(lines[0]) || csvHeaderRegex.test(lines[1] || '')) {
            const separator = lines[0].includes(';') ? ';' : ',';
            const headerLineIdx = lines.findIndex(l => csvHeaderRegex.test(l));
            const header = lines[headerLineIdx].toLowerCase().split(separator).map(c => c.trim());

            const timeIdx = header.findIndex(h => h === 'time' || h === 'tempo');
            const dateIdx = header.findIndex(h => h === 'date' || h === 'data');

            if (timeIdx !== -1) {
                for (let i = headerLineIdx + 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const cols = line.split(separator).map(c => c.trim());

                    if (cols.length > timeIdx) {
                        const timeRaw = cols[timeIdx];
                        const dateRaw = dateIdx !== -1 ? cols[dateIdx] : null;

                        let timeVal = NaN;
                        let penalty = CONFIG.PENALTIES.NONE;

                        if (/^DNF/i.test(timeRaw)) {
                            penalty = CONFIG.PENALTIES.DNF;
                            const mDnf = timeRaw.match(/\(([\d.:]+)\)/);
                            if (mDnf) timeVal = Utils.parseTimeStr(mDnf[1]);
                        } else if (/\+$/.test(timeRaw) || /^2000/.test(cols[cols.length - 1])) {
                            penalty = CONFIG.PENALTIES.PLUS2;
                            timeVal = Utils.parseTimeStr(timeRaw.replace('+', ''));
                        } else {
                            timeVal = Utils.parseTimeStr(timeRaw);
                        }

                        if (!isNaN(timeVal)) {
                            times.push({
                                time: timeVal,
                                penalty: penalty,
                                method: CONFIG.DEFAULT_METHOD,
                                cube: CONFIG.DEFAULT_CUBE,
                                date: dateRaw ? new Date(dateRaw).toISOString() : (exportDate || null)
                            });
                        }
                    }
                }
                if (times.length > 0) return { times, exportDate, solves: times.length };
            }
        }

        // 5. Parsing de Texto CsTimer
        const mDate = text.match(/(?:Gerado|Generated).*?(?:em|on)\s+(\d{4}-\d{2}-\d{2})/i);
        if (mDate) exportDate = mDate[1];

        const solveRegex = /^\s*\d+\.\s+(?:(DNF)\s*\(?([0-9.:]+)\)?|([0-9.:]+)(\+?))/i;
        const headerIdx = lines.findIndex(l => /(?:Lista de Tempos|Time List|Liste de temps|List)\s*:/i.test(l));
        const startIdx = headerIdx !== -1 ? headerIdx + 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const m = line.match(solveRegex);
            if (m) {
                const isDnf = !!m[1];
                const timeStr = m[2] || m[3];
                const isPlus2 = m[4] === '+';

                if (timeStr) {
                    let val = Utils.parseTimeStr(timeStr);

                    if (!isNaN(val)) {
                        times.push({
                            time: val,
                            penalty: isDnf ? CONFIG.PENALTIES.DNF : (isPlus2 ? CONFIG.PENALTIES.PLUS2 : CONFIG.PENALTIES.NONE),
                            method: CONFIG.DEFAULT_METHOD,
                            cube: CONFIG.DEFAULT_CUBE,
                            date: exportDate
                        });
                    }
                }
            }
        }

        return { times, exportDate, solves: times.length };
    }

    function computeDistribution(solves) {
        const d = { sub15: 0, r15_18: 0, r18_21: 0, r21_24: 0, over24: 0 };
        solves.forEach(s => {
            const t = Utils.effectiveTime(s);
            if (!isFinite(t)) return;
            if (t < 15) d.sub15++;
            else if (t < 18) d.r15_18++;
            else if (t < 21) d.r18_21++;
            else if (t < 24) d.r21_24++;
            else d.over24++;
        });
        return d;
    }

    function computeHistogram(solves, binSize = 2) {
        const valid = solves.map(Utils.effectiveTime).filter(Number.isFinite);
        if (!valid.length) return { labels: [], data: [], ranges: [] };

        const min = Math.floor(Math.min(...valid));
        const max = Math.ceil(Math.max(...valid));
        const bins = [];
        const labels = [];
        const ranges = [];

        for (let i = min; i < max; i += binSize) {
            bins.push(0);
            const rangeEnd = i + binSize;
            labels.push(`${i}-${rangeEnd}s`);
            ranges.push({ min: i, max: rangeEnd });
        }

        valid.forEach(t => {
            const binIndex = Math.floor((t - min) / binSize);
            if (binIndex >= 0 && binIndex < bins.length) {
                bins[binIndex]++;
            }
        });

        return { labels, data: bins, ranges };
    }

    function getStatsForPeriod(times, days, offsetDays = 0) {
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - days - offsetDays);
        const end = new Date();
        end.setDate(now.getDate() - offsetDays);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const valid = times.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end && Number.isFinite(Utils.effectiveTime(t));
        });

        return {
            avg: Utils.avg(valid.map(Utils.effectiveTime)),
            count: valid.length,
            best: valid.length ? Math.min(...valid.map(Utils.effectiveTime)) : NaN
        };
    }

    function calculateAdvancedMetrics(times) {
        const valid = times.map(Utils.effectiveTime).filter(Number.isFinite);
        if (!valid.length) return { level: '--', pbProbability: '--%', bestTimeOfDay: '--' };

        // Estimated Level
        const recent100 = valid.slice(-100);
        const avg100 = Utils.avg(recent100);
        let level = '--';
        
        if (!isNaN(avg100)) {
            if (avg100 < 10) level = 'Sub-10';
            else if (avg100 < 15) level = 'Sub-15';
            else if (avg100 < 20) level = 'Sub-20';
            else if (avg100 < 25) level = 'Sub-25';
            else if (avg100 < 30) level = 'Sub-30';
            else if (avg100 < 40) level = 'Sub-40';
            else if (avg100 < 60) level = 'Sub-1';
            else level = 'Iniciante';
        }

        // PB Probability
        let pbProbability = '--%';
        if (valid.length >= 20) {
            const recent20 = valid.slice(-20);
            const m = Utils.avg(recent20);
            const variance = recent20.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / recent20.length;
            const stdDev = Math.sqrt(variance);
            const currentPB = Math.min(...valid);

            // Simplified Z-score calculation
            const z = (currentPB - m) / stdDev;
            const erf = (x) => {
                const sign = (x >= 0) ? 1 : -1;
                x = Math.abs(x);
                const a1 = 0.254829592;
                const a2 = -0.284496736;
                const a3 = 1.421413741;
                const a4 = -1.453152027;
                const a5 = 1.061405429;
                const p = 0.3275911;
                const t = 1.0 / (1.0 + p * x);
                const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
                return sign * y;
            };

            const cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));
            const prob = cdf * 100;
            pbProbability = prob < 0.1 ? '< 0.1%' : `${prob.toFixed(1)}%`;
        }

        // Best Time of Day
        const hours = {};
        times.forEach(t => {
            if (!t.date || !Number.isFinite(Utils.effectiveTime(t))) return;
            const h = new Date(t.date).getHours();
            const period = h < 6 ? 'Madrugada' : h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite';
            if (!hours[period]) hours[period] = [];
            hours[period].push(Utils.effectiveTime(t));
        });

        let bestTimeOfDay = '--';
        let bestAvg = Infinity;

        Object.entries(hours).forEach(([p, periodTimes]) => {
            const a = Utils.avg(periodTimes);
            if (a < bestAvg) {
                bestAvg = a;
                bestTimeOfDay = p;
            }
        });

        return { level, pbProbability, bestTimeOfDay };
    }

    return {
        parseCsTimerExport,
        computeDistribution,
        computeHistogram,
        getStatsForPeriod,
        calculateAdvancedMetrics
    };
})();

// ============================================
// DATA MANAGER
// ============================================
const DataManager = (function() {
    let appData = { times: [], exportDate: null, solves: 0 };
    let currentPage = 1;
    let pageSize = CONFIG.DEFAULT_PAGE_SIZE;

    async function initData() {
        const saved = localStorage.getItem(CONFIG.TIMES_STORAGE_KEY);
        if (saved) {
            const timesRaw = JSON.parse(saved);
            const times = Utils.toSolveObjects(timesRaw);
            Utils.simulateDates(times);
            appData = { times, exportDate: null, solves: times.length };
            return;
        }

        try {
            const res = await fetch('./meus-tempos.txt', { cache: 'no-store' });
            if (res.ok) {
                const text = await res.text();
                appData = DataImporter.parseCsTimerExport(text);
                Utils.simulateDates(appData.times);
                localStorage.setItem(CONFIG.TIMES_STORAGE_KEY, JSON.stringify(appData.times));
                return;
            }
        } catch { }

        const fallback = [16.45, 18.32, 17.89, 15.32, 19.21, 18.76, 20.12, 19.45]
            .map(t => ({ 
                time: t, 
                penalty: CONFIG.PENALTIES.NONE, 
                method: CONFIG.DEFAULT_METHOD, 
                cube: CONFIG.DEFAULT_CUBE 
            }));
        
        Utils.simulateDates(fallback);
        appData = { times: fallback, exportDate: null, solves: fallback.length };
    }

    function buildTimesRows() {
        const valid = appData.times.map(Utils.effectiveTime).filter(Number.isFinite);
        const pb = valid.length ? Math.min(...valid) : NaN;
        const rows = [];
        const total = appData.times.length;
        let startIdx, endIdx;
        
        if (!isFinite(pageSize)) {
            startIdx = total - 1;
            endIdx = 0;
        } else {
            const from = (currentPage - 1) * pageSize;
            startIdx = Math.max(total - from - 1, -1);
            endIdx = Math.max(total - (currentPage * pageSize), 0);
        }
        
        for (let idx = startIdx; idx >= endIdx; idx--) {
            const s = appData.times[idx];
            const eff = Utils.effectiveTime(s);
            rows.push({
                date: s.date || (appData.exportDate ? new Date(appData.exportDate).toISOString() : new Date().toISOString()),
                time: eff,
                method: s.method || CONFIG.DEFAULT_METHOD,
                cube: s.cube || CONFIG.DEFAULT_CUBE,
                penalty: s.penalty || CONFIG.PENALTIES.NONE,
                isPB: isFinite(pb) && isFinite(eff) ? eff === pb : false,
                index: idx
            });
        }
        
        return rows;
    }

    function addSolve(solve) {
        appData.times.push(solve);
        localStorage.setItem(CONFIG.TIMES_STORAGE_KEY, JSON.stringify(appData.times));
    }

    function deleteSolve(index) {
        appData.times.splice(index, 1);
        localStorage.setItem(CONFIG.TIMES_STORAGE_KEY, JSON.stringify(appData.times));
    }

    function clearAllData() {
        appData = { times: [], exportDate: null, solves: 0 };
        localStorage.removeItem(CONFIG.TIMES_STORAGE_KEY);
    }

    function setPageSize(size) {
        pageSize = size === 'all' ? Infinity : parseInt(size, 10);
        currentPage = 1;
    }

    function setCurrentPage(page) {
        currentPage = page;
    }

    function getCurrentPage() {
        return currentPage;
    }

    function getTotalPages() {
        return !isFinite(pageSize) ? 1 : Math.max(1, Math.ceil(appData.times.length / pageSize));
    }

    function getData() {
        return { ...appData };
    }

    function setData(newData) {
        appData = newData;
        localStorage.setItem(CONFIG.TIMES_STORAGE_KEY, JSON.stringify(appData.times));
    }

    return {
        initData,
        buildTimesRows,
        addSolve,
        deleteSolve,
        clearAllData,
        setPageSize,
        setCurrentPage,
        getCurrentPage,
        getTotalPages,
        getData,
        setData
    };
})();

// ============================================
// UI COMPONENTS
// ============================================
const UIComponents = (function() {
    const chartsInit = {};

    function showTableSkeleton() {
        const timesTableBody = document.getElementById('timesTableBody');
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
        const timesTableBody = document.getElementById('timesTableBody');
        if (!timesTableBody) return;
        
        timesTableBody.innerHTML = '';
        const rows = DataManager.buildTimesRows();
        
        rows.forEach(time => {
            const row = document.createElement('tr');
            const formattedDate = Utils.formatDate(time.date);
            const penaltyLabel = time.penalty === CONFIG.PENALTIES.DNF ? 'DNF' : 
                               (time.penalty === CONFIG.PENALTIES.PLUS2 ? '+2' : '');
            
            let statusCell = '';
            if (time.penalty === CONFIG.PENALTIES.DNF) {
                statusCell = '<span class="badge badge--dnf">DNF</span>';
            } else if (time.time < 16) {
                statusCell = '<span class="badge badge--good">Ótimo</span>';
            } else if (time.time < 20) {
                statusCell = '<span class="badge badge--warn">Bom</span>';
            } else {
                statusCell = '<span class="badge badge--bad">Melhorável</span>';
            }
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td class="time-cell">
                    ${Number.isFinite(time.time) ? Utils.formatTime(time.time) : '—'} 
                    ${penaltyLabel ? `<span class="badge ${penaltyLabel === '+2' ? 'badge--warn' : 'badge--dnf'}">${penaltyLabel}</span>` : ''} 
                    ${time.isPB ? '<span class="pb-badge">PB</span>' : ''}
                </td>
                <td>${time.method}</td>
                <td>${time.cube}</td>
                <td>${statusCell}</td>
                <td>
                    <button class="btn btn--sm" data-action="edit" data-index="${time.index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn--sm btn--danger" data-action="delete" data-index="${time.index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            timesTableBody.appendChild(row);
        });
        
        updatePaginationUI();
    }

    function renderDashboardCards() {
        const data = DataManager.getData();
        
        // PB
        const pbEl = document.getElementById('statPbValue');
        if (pbEl) {
            const valid = data.times.map(Utils.effectiveTime).filter(Number.isFinite);
            const pb = valid.length ? Math.min(...valid) : NaN;
            pbEl.textContent = isFinite(pb) ? `${pb.toFixed(2)}s` : '--';
        }
        
        // AO5
        const ao5El = document.getElementById('statAo5Value');
        if (ao5El) {
            const a5 = Utils.aoN(data.times, 5);
            ao5El.textContent = isFinite(a5) ? `${a5.toFixed(2)}s` : '--';
        }
        
        // AO12
        const ao12El = document.getElementById('statAo12Value');
        if (ao12El) {
            const a12 = Utils.aoN(data.times, 12);
            ao12El.textContent = isFinite(a12) ? `${a12.toFixed(2)}s` : '--';
        }
        
        // Total Solves
        const solvesEl = document.getElementById('statSolvesValue');
        if (solvesEl) {
            solvesEl.textContent = String(data.solves || data.times.length);
        }
        
        // Consistency
        const consEl = document.getElementById('statConsistencyValue');
        if (consEl) {
            const valid = data.times.map(Utils.effectiveTime).filter(Number.isFinite);
            const m = Utils.avg(valid);
            const within = valid.filter(t => Math.abs(t - m) <= m * 0.1).length;
            const pct = valid.length ? Math.round((within / valid.length) * 100) : 0;
            consEl.textContent = `${pct}%`;
        }
        
        renderEvolutionAnalysis();
        renderGoals();
        renderAdvancedMetrics();
    }

    function renderEvolutionAnalysis() {
        const data = DataManager.getData();
        const stats7 = DataImporter.getStatsForPeriod(data.times, 7);
        const stats7Prev = DataImporter.getStatsForPeriod(data.times, 7, 7);
        const stats30 = DataImporter.getStatsForPeriod(data.times, 30);
        const stats30Prev = DataImporter.getStatsForPeriod(data.times, 30, 30);
        const statsAll = {
            avg: Utils.avg(data.times.map(Utils.effectiveTime).filter(Number.isFinite)),
            count: data.times.length
        };

        const renderDiff = (current, prev, el) => {
            if (!isFinite(current) || !isFinite(prev)) {
                el.textContent = 'Sem dados suficientes';
                el.className = 'section__card-text';
                return 0;
            }
            
            const diff = prev - current;
            const pct = (diff / prev) * 100;
            const isImprovement = diff > 0;

            el.innerHTML = `<i class="fas fa-${isImprovement ? 'arrow-up' : 'arrow-down'}"></i> ${Math.abs(pct).toFixed(1)}% ${isImprovement ? 'mais rápido' : 'mais lento'}`;
            el.className = `section__card-text ${isImprovement ? 'positive' : 'negative'}`;
            return pct;
        };

        const el7 = document.getElementById('evo7Days');
        const el7Comp = document.getElementById('evo7DaysComp');
        if (el7) {
            el7.textContent = isFinite(stats7.avg) ? Utils.formatTime(stats7.avg) : '--';
            renderDiff(stats7.avg, stats7Prev.avg, el7Comp);
        }

        const el30 = document.getElementById('evo30Days');
        const el30Comp = document.getElementById('evo30DaysComp');
        const elTrend = document.getElementById('evolutionTrend');
        if (el30) {
            el30.textContent = isFinite(stats30.avg) ? Utils.formatTime(stats30.avg) : '--';
            const pct30 = renderDiff(stats30.avg, stats30Prev.avg, el30Comp);

            if (elTrend && isFinite(pct30)) {
                const isImp = pct30 > 0;
                elTrend.textContent = isImp
                    ? `🚀 Você está ${pct30.toFixed(1)}% mais rápido que há 30 dias!`
                    : `🐢 Você está ${Math.abs(pct30).toFixed(1)}% mais lento que há 30 dias.`;
                elTrend.className = `evolution-trend ${isImp ? '' : 'negative'}`;
            } else if (elTrend) {
                elTrend.textContent = 'Continue treinando para ver sua evolução!';
                elTrend.className = 'evolution-trend';
            }
        }

        const elAll = document.getElementById('evoAll');
        const elAllComp = document.getElementById('evoAllComp');
        if (elAll) {
            elAll.textContent = isFinite(statsAll.avg) ? Utils.formatTime(statsAll.avg) : '--';
            elAllComp.textContent = `${statsAll.count} solves totais`;
        }
    }

    function renderGoals() {
        const goalVolumeBar = document.getElementById('goalVolumeBar');
        const goalVolumeText = document.getElementById('goalVolumeText');
        const goalSub20Bar = document.getElementById('goalSub20Bar');
        const goalSub20Text = document.getElementById('goalSub20Text');

        if (!goalVolumeBar) return;

        const data = DataManager.getData();
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);

        const thisWeekSolves = data.times.filter(t => new Date(t.date) >= startOfWeek);
        const vol = thisWeekSolves.length;
        const volTarget = 100;
        const volPct = Math.min((vol / volTarget) * 100, 100);

        goalVolumeBar.style.width = `${volPct}%`;
        goalVolumeText.textContent = `${vol}/${volTarget}`;

        const sub20 = thisWeekSolves.filter(t => Utils.effectiveTime(t) < 20).length;
        const sub20Target = 10;
        const sub20Pct = Math.min((sub20 / sub20Target) * 100, 100);

        goalSub20Bar.style.width = `${sub20Pct}%`;
        goalSub20Text.textContent = `${sub20}/${sub20Target}`;
    }

    function renderAdvancedMetrics() {
        const data = DataManager.getData();
        const metrics = DataImporter.calculateAdvancedMetrics(data.times);
        
        const elLevel = document.getElementById('metricLevel');
        const elLevelDesc = document.getElementById('metricLevelDesc');
        if (elLevel) {
            elLevel.textContent = metrics.level;
            if (elLevelDesc && metrics.level !== '--') {
                const valid = data.times.map(Utils.effectiveTime).filter(Number.isFinite);
                const recent100 = valid.slice(-100);
                const avg100 = Utils.avg(recent100);
                elLevelDesc.textContent = `Média: ${isNaN(avg100) ? '--' : avg100.toFixed(2)}s`;
            }
        }
        
        const elPbProb = document.getElementById('metricPbProb');
        if (elPbProb) {
            elPbProb.textContent = metrics.pbProbability;
        }
        
        const elBestTime = document.getElementById('metricBestTime');
        if (elBestTime) {
            elBestTime.textContent = metrics.bestTimeOfDay;
        }
    }

    function updatePaginationUI() {
        const info = document.getElementById('paginationInfo');
        const btnFirst = document.getElementById('pageFirst');
        const btnPrev = document.getElementById('pagePrev');
        const btnNext = document.getElementById('pageNext');
        const btnLast = document.getElementById('pageLast');
        
        const currentPage = DataManager.getCurrentPage();
        const totalPages = DataManager.getTotalPages();
        
        if (info) info.textContent = `Página ${currentPage} de ${totalPages}`;
        if (btnFirst) btnFirst.disabled = currentPage <= 1;
        if (btnPrev) btnPrev.disabled = currentPage <= 1;
        if (btnNext) btnNext.disabled = currentPage >= totalPages;
        if (btnLast) btnLast.disabled = currentPage >= totalPages;
    }

    function updateHistoricoSummary() {
        const rows = DataManager.buildTimesRows();
        const valid = rows.filter(r => Number.isFinite(r.time));
        const avgVal = Utils.avg(valid.map(t => t.time));
        const pb = valid.length ? Math.min(...valid.map(t => t.time)) : NaN;
        
        const avgEl = document.getElementById('historicoAvg');
        const pbEl = document.getElementById('historicoPb');
        const solvesEl = document.getElementById('historicoSolves');

        if (avgEl) avgEl.textContent = isFinite(avgVal) ? Utils.formatTime(avgVal) : '--';
        if (pbEl) pbEl.textContent = isFinite(pb) ? Utils.formatTime(pb) : '--';
        if (solvesEl) solvesEl.textContent = String(valid.length);
    }

    function showDistributionDetails(range) {
        const container = document.getElementById('distributionDetails');
        const tbody = document.getElementById('distTableBody');
        const label = document.getElementById('distRangeLabel');
        const closeBtn = document.getElementById('closeDistDetails');

        if (!container || !tbody) return;

        const data = DataManager.getData();
        label.textContent = `${range.min}s - ${range.max}s`;

        const solves = data.times.filter(s => {
            const t = Utils.effectiveTime(s);
            return Number.isFinite(t) && t >= range.min && t < range.max;
        }).sort((a, b) => Utils.effectiveTime(a) - Utils.effectiveTime(b));

        tbody.innerHTML = solves.map(s => `
            <tr>
                <td>${Utils.formatDate(s.date)}</td>
                <td style="font-weight:bold;">${Utils.effectiveTime(s).toFixed(2)}s</td>
                <td>${s.method}</td>
            </tr>
        `).join('');

        container.style.display = 'block';

        if (closeBtn) {
            closeBtn.onclick = () => container.style.display = 'none';
        }

        container.scrollIntoView({ behavior: 'smooth' });
    }

    return {
        showTableSkeleton,
        renderTimesTable,
        renderDashboardCards,
        renderEvolutionAnalysis,
        renderGoals,
        renderAdvancedMetrics,
        updatePaginationUI,
        updateHistoricoSummary,
        showDistributionDetails,
        chartsInit
    };
})();

// ============================================
// CHART MANAGER
// ============================================
const ChartManager = (function() {
    const chartsInit = UIComponents.chartsInit;

    function initTimeEvolutionChart() {
        if (chartsInit.timeEvolutionChart) return;
        
        const el = document.getElementById('timeEvolutionChart');
        if (!el) return;
        
        const ctx = el.getContext('2d');
        const data = DataManager.getData();
        const valid = data.times.map(Utils.effectiveTime).filter(Number.isFinite);
        const series = valid.slice(-30);
        const labels = series.map((_, i) => String(i + 1));
        const ma5 = Utils.movingAverage(series, 5);
        
        chartsInit.timeEvolutionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Tempo por solve',
                    data: series,
                    borderColor: CONFIG.CHART_CONFIGS.COLORS.PRIMARY,
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: context => {
                        const data = context.dataset.data;
                        const val = data[context.dataIndex];
                        const min = Math.min(...data);
                        return val === min ? CONFIG.CHART_CONFIGS.COLORS.WARNING : CONFIG.CHART_CONFIGS.COLORS.PRIMARY;
                    },
                    pointRadius: context => {
                        const data = context.dataset.data;
                        const val = data[context.dataIndex];
                        const min = Math.min(...data);
                        return val === min ? 6 : 3;
                    },
                    pointHoverRadius: 8
                }, {
                    label: 'Média móvel (5)',
                    data: ma5,
                    borderColor: CONFIG.CHART_CONFIGS.COLORS.SUCCESS,
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
        const targetInput = document.getElementById('targetTimeInput');
        const targetTime = targetInput ? parseFloat(targetInput.value) : 20;
        const data = DataManager.getData();
        
        const dist = DataImporter.computeHistogram(data.times, 2);

        chartsInit.timeDistributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dist.labels,
                datasets: [{
                    label: 'Solves',
                    data: dist.data,
                    backgroundColor: context => {
                        const idx = context.dataIndex;
                        const range = dist.ranges[idx];
                        if (range.max <= targetTime) return CONFIG.CHART_CONFIGS.COLORS.SUCCESS;
                        if (range.min >= targetTime) return CONFIG.CHART_CONFIGS.COLORS.WARNING;
                        return CONFIG.CHART_CONFIGS.COLORS.PRIMARY;
                    },
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                },
                onClick: (e, elements) => {
                    if (!elements.length) return;
                    const idx = elements[0].index;
                    const range = dist.ranges[idx];
                    UIComponents.showDistributionDetails(range);
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const range = dist.ranges[ctx.dataIndex];
                                return `${ctx.raw} solves (${range.min}-${range.max}s)`;
                            }
                        }
                    }
                }
            }
        });

        if (targetInput) {
            targetInput.addEventListener('change', () => {
                if (chartsInit.timeDistributionChart) {
                    chartsInit.timeDistributionChart.destroy();
                    chartsInit.timeDistributionChart = null;
                    initTimeDistributionChart();
                }
            });
        }

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
                    backgroundColor: CONFIG.CHART_CONFIGS.COLORS.PRIMARY
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
                    borderColor: CONFIG.CHART_CONFIGS.COLORS.WARNING,
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

    function initTimeOfDayChart() {
        if (chartsInit.timeOfDayChart) return;
        
        const el = document.getElementById('timeOfDayChart');
        if (!el) return;

        const data = DataManager.getData();
        const hourCounts = new Array(24).fill(0);
        const hourSums = new Array(24).fill(0);

        data.times.forEach(t => {
            if (!t.date || !Number.isFinite(Utils.effectiveTime(t))) return;
            const h = new Date(t.date).getHours();
            hourCounts[h]++;
            hourSums[h] += Utils.effectiveTime(t);
        });

        const avgs = hourSums.map((sum, i) => hourCounts[i] ? sum / hourCounts[i] : null);

        const ctx = el.getContext('2d');
        chartsInit.timeOfDayChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
                datasets: [{
                    label: 'Média por Horário',
                    data: avgs,
                    borderColor: CONFIG.CHART_CONFIGS.COLORS.PURPLE,
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    spanGaps: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
        
        el.classList.remove('skeleton');
    }

    function observeCharts() {
        const ids = ['timeEvolutionChart', 'timeDistributionChart', 'methodPerformanceChart', 'sessionVolumeChart', 'timeOfDayChart'];
        const mapInit = {
            timeEvolutionChart: initTimeEvolutionChart,
            timeDistributionChart: initTimeDistributionChart,
            methodPerformanceChart: initMethodPerformanceChart,
            sessionVolumeChart: initSessionVolumeChart,
            timeOfDayChart: initTimeOfDayChart
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
            initTimeOfDayChart();
        }
    }

    function destroyCharts() {
        Object.values(chartsInit).forEach(chart => {
            if (chart) chart.destroy();
        });
        
        Object.keys(chartsInit).forEach(key => {
            chartsInit[key] = null;
        });
    }

    return {
        initTimeEvolutionChart,
        initTimeDistributionChart,
        initMethodPerformanceChart,
        initSessionVolumeChart,
        initTimeOfDayChart,
        observeCharts,
        destroyCharts
    };
})();

// ============================================
// EVENT HANDLERS
// ============================================
const EventHandlers = (function() {
    function setupNav() {
        const links = document.querySelectorAll('.nav-menu a');
        const current = location.pathname.split('/').pop() || 'index.html';
        
        links.forEach(a => {
            const path = new URL(a.href, location.href).pathname.split('/').pop();
            a.classList.toggle('active', path === current);
        });
        
        const toggleBtn = document.getElementById('menuToggle');
        let overlay = document.querySelector('.nav-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'nav-overlay';
            document.body.appendChild(overlay);
        }
        
        function openNav() {
            document.body.classList.add('nav-open');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
            if (navigator.vibrate) navigator.vibrate(50);
        }
        
        function closeNav() {
            document.body.classList.remove('nav-open');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        }
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                const open = document.body.classList.contains('nav-open');
                if (open) closeNav(); else openNav();
            });
        }
        
        if (overlay) overlay.addEventListener('click', closeNav);
        links.forEach(a => a.addEventListener('click', closeNav));
        document.addEventListener('keydown', function (e) { 
            if (e.key === 'Escape') closeNav(); 
        });
    }

    function setupPreferences() {
        const prefDarkMode = document.getElementById('prefDarkMode');
        const prefCompactCards = document.getElementById('prefCompactCards');
        const prefAnimations = document.getElementById('prefAnimations');
        
        if (prefDarkMode) { 
            prefDarkMode.disabled = true; 
            prefDarkMode.checked = false; 
        }
        
        if (prefCompactCards) {
            prefCompactCards.addEventListener('change', function () {
                document.body.classList.toggle('compact-cards', this.checked);
            });
        }
        
        if (prefAnimations) {
            prefAnimations.addEventListener('change', function () {
                const speed = this.checked ? 0.4 : 0;
                if (UIComponents.chartsInit.timeEvolutionChart) {
                    UIComponents.chartsInit.timeEvolutionChart.options.datasets?.forEach?.(d => d.tension = speed);
                }
            });
        }
    }

    function setupDataManagement() {
        const btnUseLocalEmpty = document.getElementById('btnUseLocalEmpty');
        const btnWipeAll = document.getElementById('btnWipeAll');

        if (btnUseLocalEmpty) {
            btnUseLocalEmpty.addEventListener('click', function () {
                if (!confirm('Isso irá remover todos os tempos atuais e iniciar uma lista vazia APENAS no navegador. Deseja continuar?')) return;
                
                DataManager.clearAllData();
                Utils.showToast('Banco de dados local reiniciado e limpo.');
                setTimeout(() => window.location.reload(), 1000);
            });
        }

        if (btnWipeAll) {
            btnWipeAll.addEventListener('click', function () {
                if (!confirm('Isso apagará TODO o histórico local. Se não houver arquivo TXT, dados de exemplo serão carregados na próxima visita. Continuar?')) return;
                
                DataManager.clearAllData();
                Utils.showToast('Dados locais apagados.');
                setTimeout(() => window.location.reload(), 1000);
            });
        }
    }

    function setupImport() {
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');
        const exportBtn = document.getElementById('exportBtn');
        const resetBtn = document.getElementById('resetBtn');
        const pageFirst = document.getElementById('pageFirst');
        const pagePrev = document.getElementById('pagePrev');
        const pageNext = document.getElementById('pageNext');
        const pageLast = document.getElementById('pageLast');
        const limitSelect = document.getElementById('limitSelect');

        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            
            importFile.addEventListener('change', async function () {
                const f = this.files?.[0];
                if (!f) return;
                
                const text = await f.text();
                const parsed = DataImporter.parseCsTimerExport(text);
                
                if (parsed.times.length === 0) {
                    Utils.showToast('Nenhum tempo válido encontrado!');
                    return;
                }

                Utils.simulateDates(parsed.times);
                DataManager.setData(parsed);
                DataManager.setCurrentPage(1);
                
                UIComponents.renderTimesTable();
                UIComponents.updateHistoricoSummary();
                
                ChartManager.destroyCharts();
                ChartManager.initTimeEvolutionChart();
                ChartManager.initTimeDistributionChart();
                UIComponents.renderDashboardCards();
                
                Utils.showToast('Importação concluída (CsTimer/Twisty)');
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', async function () {
                if (!confirm('Tem certeza que deseja resetar seus tempos? Esta ação não pode ser desfeita.')) return;
                
                DataManager.clearAllData();
                
                const reimport = confirm('Deseja reimportar do arquivo meus-tempos.txt agora?');
                if (reimport) {
                    try {
                        const res = await fetch('./meus-tempos.txt', { cache: 'no-store' });
                        if (res.ok) {
                            const text = await res.text();
                            const parsed = DataImporter.parseCsTimerExport(text);
                            Utils.simulateDates(parsed.times);
                            DataManager.setData(parsed);
                            Utils.showToast('Tempos reimportados');
                        } else {
                            DataManager.setData({ times: [], exportDate: null, solves: 0 });
                            Utils.showToast('Arquivo meus-tempos.txt não encontrado; tempos resetados');
                        }
                    } catch {
                        DataManager.setData({ times: [], exportDate: null, solves: 0 });
                        Utils.showToast('Erro ao reimportar; tempos resetados');
                    }
                } else {
                    DataManager.setData({ times: [], exportDate: null, solves: 0 });
                    localStorage.setItem(CONFIG.TIMES_STORAGE_KEY, JSON.stringify([]));
                    Utils.showToast('Tempos resetados (Modo Local)');
                }
                
                UIComponents.renderTimesTable();
                UIComponents.updateHistoricoSummary();
                UIComponents.renderDashboardCards();
                
                ChartManager.destroyCharts();
                ChartManager.initTimeEvolutionChart();
                ChartManager.initTimeDistributionChart();
            });
        }

        if (limitSelect) {
            limitSelect.addEventListener('change', function () {
                DataManager.setPageSize(this.value);
                UIComponents.renderTimesTable();
                UIComponents.updateHistoricoSummary();
            });
        }

        if (pageFirst) {
            pageFirst.addEventListener('click', function () {
                DataManager.setCurrentPage(1);
                UIComponents.renderTimesTable();
                UIComponents.updateHistoricoSummary();
            });
        }

        if (pagePrev) {
            pagePrev.addEventListener('click', function () {
                const currentPage = DataManager.getCurrentPage();
                DataManager.setCurrentPage(Math.max(1, currentPage - 1));
                UIComponents.renderTimesTable();
                UIComponents.updateHistoricoSummary();
            });
        }

        if (pageNext) {
            pageNext.addEventListener('click', function () {
                const currentPage = DataManager.getCurrentPage();
                const totalPages = DataManager.getTotalPages();
                DataManager.setCurrentPage(Math.min(totalPages, currentPage + 1));
                UIComponents.renderTimesTable();
                UIComponents.updateHistoricoSummary();
            });
        }

        if (pageLast) {
            pageLast.addEventListener('click', function () {
                const totalPages = DataManager.getTotalPages();
                DataManager.setCurrentPage(totalPages);
                UIComponents.renderTimesTable();
                UIComponents.updateHistoricoSummary();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                const header = ['data', 'tempo', 'penalidade', 'metodo', 'cubo'];
                const rows = DataManager.buildTimesRows().map(r => [
                    r.date,
                    Number.isFinite(r.time) ? r.time.toFixed(2) : 'DNF',
                    r.penalty || CONFIG.PENALTIES.NONE,
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

    function attachAddTimeForm() {
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
                
                const solve = { 
                    time: isFinite(val) ? val : 0, 
                    penalty: isDnf ? CONFIG.PENALTIES.DNF : (isPlus2 ? CONFIG.PENALTIES.PLUS2 : CONFIG.PENALTIES.NONE), 
                    method: formMethodInput.value || CONFIG.DEFAULT_METHOD, 
                    cube: formCubeInput.value || CONFIG.DEFAULT_CUBE, 
                    date: new Date().toISOString() 
                };
                
                DataManager.addSolve(solve);
                addForm.style.display = 'none';
                formTimeInput.value = '';
                
                if (formPlus2) formPlus2.checked = false;
                if (formDnf) formDnf.checked = false;
                
                UIComponents.renderTimesTable();
                UIComponents.renderDashboardCards();
                
                ChartManager.destroyCharts();
                ChartManager.initTimeEvolutionChart();
                ChartManager.initTimeDistributionChart();
                
                UIComponents.updateHistoricoSummary();
                Utils.showToast('Tempo salvo');
            });
        }
    }

    function attachTableEventListeners() {
        const timesTableBody = document.getElementById('timesTableBody');
        if (!timesTableBody) return;
        
        timesTableBody.addEventListener('click', function (e) {
            const target = e.target.closest('button[data-action]');
            if (!target) return;
            
            const idx = parseInt(target.dataset.index, 10);
            
            if (target.dataset.action === 'delete' && isFinite(idx)) {
                if (!confirm('Tem certeza que deseja excluir este tempo?')) return;
                
                DataManager.deleteSolve(idx);
                UIComponents.renderTimesTable();
                UIComponents.renderDashboardCards();
                
                ChartManager.destroyCharts();
                ChartManager.initTimeEvolutionChart();
                ChartManager.initTimeDistributionChart();
                
                UIComponents.updateHistoricoSummary();
                Utils.showToast('Tempo excluído');
            }
        });
    }

    function setupEventListeners() {
        setupNav();
        setupPreferences();
        setupDataManagement();
        setupImport();
        attachAddTimeForm();
        attachTableEventListeners();
    }

    return {
        setupEventListeners
    };
})();

// ============================================
// TIMER & SCRAMBLE
// ============================================
const ScrambleGenerator = {
    moves: ['R', 'L', 'U', 'D', 'F', 'B'],
    modifiers: ['', "'", '2'],
    
    generate(length = 20) {
        let scramble = [];
        let lastAxis = -1;
        const axisMap = { 'R': 0, 'L': 0, 'U': 1, 'D': 1, 'F': 2, 'B': 2 };
        
        for (let i = 0; i < length; i++) {
            let move, axis;
            do {
                move = this.moves[Math.floor(Math.random() * this.moves.length)];
                axis = axisMap[move];
            } while (axis === lastAxis);
            
            lastAxis = axis;
            const mod = this.modifiers[Math.floor(Math.random() * this.modifiers.length)];
            scramble.push(move + mod);
        }
        return scramble.join(' ');
    }
};

const Timer = {
    state: 'idle', // idle, ready, ready_inspection, inspection_running, ready_solve, running, stopped
    startTime: 0,
    inspectionStart: 0,
    interval: null,
    inspectionInterval: null,
    display: null,
    scrambleDisplay: null,
    currentScramble: '',
    useInspection: false,
    
    init() {
        this.display = document.getElementById('timerDisplay');
        this.scrambleDisplay = document.getElementById('scrambleDisplay');
        
        if (!this.display) return;
        
        this.generateScramble();
        this.attachEvents();
        this.updateSessionStats();
        
        // Load data if not already loaded
        if (DataManager.getData().times.length === 0) {
            DataManager.initData().then(() => {
                this.updateSessionStats();
            });
        }
    },
    
    generateScramble() {
        this.currentScramble = ScrambleGenerator.generate();
        if (this.scrambleDisplay) this.scrambleDisplay.textContent = this.currentScramble;
    },
    
    attachEvents() {
        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Touch
        const touchZone = document.querySelector('.timer-section') || document.body;
        touchZone.addEventListener('touchstart', (e) => {
            if(e.target.tagName !== 'BUTTON' && !e.target.closest('.solves-list') && !e.target.closest('.toggle-switch')) this.handleTouchStart(e);
        });
        touchZone.addEventListener('touchend', (e) => {
             if(e.target.tagName !== 'BUTTON' && !e.target.closest('.solves-list') && !e.target.closest('.toggle-switch')) this.handleTouchEnd(e);
        });
        
        // Buttons
        document.getElementById('btnGenScramble')?.addEventListener('click', (e) => {
            this.generateScramble();
            e.target.blur();
        });
        
        document.getElementById('btnDeleteLast')?.addEventListener('click', (e) => {
            this.deleteLast();
            e.target.blur();
        });
        
        document.getElementById('btnResetSession')?.addEventListener('click', (e) => {
            this.resetSession();
            e.target.blur();
        });

        // Settings
        const toggleInspection = document.getElementById('toggleInspection');
        if (toggleInspection) {
            toggleInspection.addEventListener('change', (e) => {
                this.useInspection = e.target.checked;
                e.target.blur();
            });
        }
    },
    
    handleKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            
            if (this.state === 'running') {
                this.stop();
                return;
            }

            if (this.state === 'idle' || this.state === 'stopped') {
                if (this.useInspection) {
                    this.state = 'ready_inspection';
                    this.display.classList.add('ready');
                    this.display.style.color = CONFIG.CHART_CONFIGS.COLORS.SUCCESS;
                } else {
                    this.state = 'ready';
                    this.display.classList.add('ready');
                    this.display.style.color = CONFIG.CHART_CONFIGS.COLORS.SUCCESS;
                }
            } else if (this.state === 'inspection_running') {
                this.state = 'ready_solve';
                this.display.classList.add('ready');
                this.display.style.color = CONFIG.CHART_CONFIGS.COLORS.SUCCESS;
            }
        }
    },
    
    handleKeyUp(e) {
        if (e.code === 'Space') {
            if (this.state === 'ready') {
                this.start();
            } else if (this.state === 'ready_inspection') {
                this.startInspection();
            } else if (this.state === 'ready_solve') {
                this.start();
            } else if (this.state === 'stopped') {
                this.state = 'idle';
                this.display.classList.remove('ready');
                this.display.style.color = '';
            }
        }
    },
    
    handleTouchStart(e) {
         if (this.state === 'running') {
            this.stop();
            return;
        }

        if (this.state === 'idle' || this.state === 'stopped') {
             if (this.useInspection) {
                this.state = 'ready_inspection';
                this.display.classList.add('ready');
                this.display.style.color = CONFIG.CHART_CONFIGS.COLORS.SUCCESS;
            } else {
                this.state = 'ready';
                this.display.classList.add('ready');
                this.display.style.color = CONFIG.CHART_CONFIGS.COLORS.SUCCESS;
            }
        } else if (this.state === 'inspection_running') {
            this.state = 'ready_solve';
            this.display.classList.add('ready');
            this.display.style.color = CONFIG.CHART_CONFIGS.COLORS.SUCCESS;
        }
    },
    
    handleTouchEnd(e) {
         if (this.state === 'ready') {
            this.start();
        } else if (this.state === 'ready_inspection') {
            this.startInspection();
        } else if (this.state === 'ready_solve') {
            this.start();
        } else if (this.state === 'stopped') {
            this.state = 'idle';
            this.display.classList.remove('ready');
            this.display.style.color = '';
        }
    },
    
    startInspection() {
        this.state = 'inspection_running';
        this.display.classList.remove('ready');
        this.display.style.color = CONFIG.CHART_CONFIGS.COLORS.WARNING; // Orange for inspection
        this.inspectionStart = Date.now();
        
        this.display.textContent = '15';
        
        this.inspectionInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = (now - this.inspectionStart) / 1000;
            const remaining = 15 - elapsed;
            
            if (remaining > 0) {
                this.display.textContent = Math.ceil(remaining);
            } else if (remaining > -2) {
                this.display.textContent = '+2';
                this.display.style.color = CONFIG.CHART_CONFIGS.COLORS.DANGER;
            } else {
                this.display.textContent = 'DNF';
            }
        }, 100);
    },

    start() {
        // Calculate penalty if coming from inspection
        let penalty = CONFIG.PENALTIES.NONE;
        if (this.state === 'ready_solve') {
            clearInterval(this.inspectionInterval);
            const inspectionTime = (Date.now() - this.inspectionStart) / 1000;
            if (inspectionTime > 15 && inspectionTime <= 17) {
                penalty = CONFIG.PENALTIES.PLUS_2;
            } else if (inspectionTime > 17) {
                penalty = CONFIG.PENALTIES.DNF;
            }
        }

        this.state = 'running';
        this.display.classList.remove('ready');
        this.display.classList.add('running');
        this.display.style.color = '';
        this.startTime = Date.now();
        
        // Store penalty for saveSolve to use
        this.currentPenalty = penalty;

        this.interval = setInterval(() => {
            const now = Date.now();
            const diff = (now - this.startTime) / 1000;
            this.display.textContent = diff.toFixed(2);
        }, 30);
    },
    
    stop() {
        this.state = 'stopped';
        clearInterval(this.interval);
        this.display.classList.remove('running');
        
        const now = Date.now();
        const finalTime = (now - this.startTime) / 1000;
        this.display.textContent = finalTime.toFixed(2);
        
        this.saveSolve(finalTime, this.currentPenalty);
        this.currentPenalty = CONFIG.PENALTIES.NONE; // Reset
    },
    
    saveSolve(time, penalty = CONFIG.PENALTIES.NONE) {
        const solve = {
            time: time,
            scramble: this.currentScramble,
            date: new Date().toISOString(),
            penalty: penalty,
            cube: CONFIG.DEFAULT_CUBE,
            method: CONFIG.DEFAULT_METHOD
        };
        
        DataManager.addSolve(solve);
        this.generateScramble();
        this.updateSessionStats();
        
        UIComponents.renderTimesTable();
        UIComponents.renderDashboardCards();
        UIComponents.updateHistoricoSummary();
        ChartManager.destroyCharts();
        ChartManager.initTimeEvolutionChart();
        ChartManager.initTimeDistributionChart();
        
        if (penalty === CONFIG.PENALTIES.PLUS_2) Utils.showToast('Penalidade +2 aplicada!');
        if (penalty === CONFIG.PENALTIES.DNF) Utils.showToast('DNF aplicado!');
    },
    
    deleteLast() {
        const data = DataManager.getData();
        if (data.times.length === 0) return;
        if (confirm('Excluir último tempo?')) {
            DataManager.deleteSolve(data.times.length - 1);
            this.updateSessionStats();
            
            UIComponents.renderTimesTable();
            UIComponents.renderDashboardCards();
            UIComponents.updateHistoricoSummary();
            ChartManager.destroyCharts();
            ChartManager.initTimeEvolutionChart();
            ChartManager.initTimeDistributionChart();
            
            Utils.showToast('Tempo excluído.');
        }
    },

    resetSession() {
         if (confirm('Recarregar página para limpar visualização da sessão?')) {
             location.reload();
         }
    },
    
    updateSessionStats() {
        const data = DataManager.getData();
        const times = data.times;
        const reversed = [...times].reverse();
        
        const list = document.getElementById('solvesList');
        if (list) {
            if (reversed.length === 0) {
                list.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--color-muted);">Nenhum tempo</div>';
            } else {
                list.innerHTML = reversed.slice(0, 50).map((t, i) => {
                    let timeDisplay = t.time.toFixed(2);
                    let rowClass = '';
                    if (t.penalty === CONFIG.PENALTIES.PLUS_2) {
                        timeDisplay = `${(t.time + 2).toFixed(2)}+`;
                        rowClass = 'penalty-plus2';
                    } else if (t.penalty === CONFIG.PENALTIES.DNF) {
                        timeDisplay = 'DNF';
                        rowClass = 'penalty-dnf';
                    }

                    return `
                    <div class="solve-item ${rowClass}" data-index="${times.length - 1 - i}">
                        <span class="count">${times.length - i}.</span>
                        <span class="time">${timeDisplay}</span>
                        <span class="actions" title="Excluir"><i class="fas fa-trash"></i></span>
                    </div>
                `}).join('');
                
                list.querySelectorAll('.solve-item .actions').forEach(el => {
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const idx = parseInt(el.parentElement.dataset.index);
                        if (confirm('Excluir este tempo?')) {
                            DataManager.deleteSolve(idx);
                            this.updateSessionStats();
                            UIComponents.renderTimesTable();
                            UIComponents.renderDashboardCards();
                            UIComponents.updateHistoricoSummary();
                            ChartManager.destroyCharts();
                            ChartManager.initTimeEvolutionChart();
                            ChartManager.initTimeDistributionChart();
                        }
                    });
                });
            }
        }
        
        const ao5 = Utils.aoN(times, 5);
        const ao12 = Utils.aoN(times, 12);
        const valid = times.map(Utils.effectiveTime).filter(Number.isFinite);
        const mean = Utils.avg(valid);
        const best = valid.length ? Math.min(...valid) : NaN;
        
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = (val === undefined || isNaN(val)) ? '--' : val.toFixed(2);
        };
        
        setVal('sessionCount', times.length);
        setVal('sessionMean', mean);
        setVal('sessionAo5', ao5);
        setVal('sessionAo12', ao12);
        setVal('sessionBest', best);
    }
};

// ============================================
// MAIN APPLICATION INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function () {
    // Show skeleton loader
    UIComponents.showTableSkeleton();
    
    // Initialize data
    await DataManager.initData();
    
    // Init Timer
    Timer.init();
    
    // Render UI
    UIComponents.renderDashboardCards();
    UIComponents.renderTimesTable();
    UIComponents.updateHistoricoSummary();
    
    // Setup charts
    ChartManager.observeCharts();
    
    // Setup event listeners
    EventHandlers.setupEventListeners();
    
    Utils.showToast('Cubing Analytics carregado!');
});