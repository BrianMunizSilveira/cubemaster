// ============================================
// SUPABASE INTEGRATION
// ============================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://fhsolmqghxbreahgqknl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cieUk7Cu_zRUg_NBffSYaA_HYQzy4cf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session.user;
}

// ============================================
// CONSTANTS & CONFIG
// ============================================
const CONFIG = {
    TIMES_STORAGE_KEY: 'times-data',
    INSPECTION_PREF_KEY: 'inspection-preference',
    DEFAULT_PAGE_SIZE: 100,
    DEFAULT_CUBE: '3x3',
    DEFAULT_METHOD: 'CFOP',
    PENALTIES: { NONE: 'none', PLUS2: 'plus2', DNF: 'dnf' },
    CHART_CONFIGS: {
        COLORS: { PRIMARY: '#2563eb', SUCCESS: '#10b981', WARNING: '#f59e0b', DANGER: '#ef4444', PURPLE: '#8b5cf6' }
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const Utils = (function () {
    function effectiveTime(s) {
        if (!s || typeof s !== 'object') return Number(s);
        if (s.penalty === CONFIG.PENALTIES.DNF) return NaN;
        return s.penalty === CONFIG.PENALTIES.PLUS2 ? s.time + 2 : s.time;
    }
    function formatTime(seconds) { return seconds.toFixed(2) + 's'; }
    function formatDate(dateStr) { return new Date(dateStr).toLocaleDateString('pt-BR'); }
    function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN; }

    function aoN(solves, n) {
        if (solves.length < n) return NaN;
        const last = solves.slice(-n);
        if (last.some(s => !Number.isFinite(effectiveTime(s)))) return NaN;
        const eff = last.map(effectiveTime).sort((a, b) => a - b);
        return avg(eff.slice(1, -1));
    }

    function showToast(message) {
        let t = document.getElementById('toaster');
        if (!t) {
            t = document.createElement('div');
            t.id = 'toaster';
            document.body.appendChild(t);
        }
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = message;
        t.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    return { effectiveTime, formatTime, formatDate, avg, aoN, showToast };
})();

// ============================================
// DATA IMPORTER
// ============================================
const DataImporter = (function () {
    function parseCsTimerExport(text) {
        let times = [];
        const lines = text.split(/\r?\n/);
        try {
            const json = JSON.parse(text);
            let sessionData = Array.isArray(json) ? json : Object.values(json).filter(Array.isArray).flat();
            sessionData.forEach(s => {
                if (Array.isArray(s) && s.length >= 2) {
                    let penalty = CONFIG.PENALTIES.NONE;
                    if (s[0] === -1) penalty = CONFIG.PENALTIES.DNF;
                    else if (s[0] === 2000) penalty = CONFIG.PENALTIES.PLUS2;
                    times.push({ time: s[1] / 1000, penalty, method: CONFIG.DEFAULT_METHOD, cube: CONFIG.DEFAULT_CUBE, date: s[3] ? new Date(s[3] * 1000).toISOString() : null });
                }
            });
            if (times.length) return { times, solves: times.length };
        } catch (e) { }

        const solveRegex = /^\s*\d+\.\s+(?:(DNF)\s*\(?([0-9.:]+)\)?|([0-9.:]+)(\+?))/i;
        for (let i = 0; i < lines.length; i++) {
            const m = lines[i].trim().match(solveRegex);
            if (m) {
                const isDnf = !!m[1];
                const timeStr = m[2] || m[3];
                const isPlus2 = m[4] === '+';
                if (timeStr) {
                    let val = parseFloat(timeStr);
                    if (timeStr.includes(':')) {
                        const parts = timeStr.split(':');
                        val = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
                    }
                    if (!isNaN(val)) {
                        times.push({ time: val, penalty: isDnf ? CONFIG.PENALTIES.DNF : (isPlus2 ? CONFIG.PENALTIES.PLUS2 : CONFIG.PENALTIES.NONE), method: CONFIG.DEFAULT_METHOD, cube: CONFIG.DEFAULT_CUBE, date: new Date().toISOString() });
                    }
                }
            }
        }
        return { times, solves: times.length };
    }

    function computeHistogram(solves, binSize = 2) {
        const valid = solves.map(Utils.effectiveTime).filter(Number.isFinite);
        if (!valid.length) return { labels: [], data: [], ranges: [] };
        const min = Math.floor(Math.min(...valid));
        const max = Math.ceil(Math.max(...valid));
        const bins = [], labels = [], ranges = [];
        for (let i = min; i < max; i += binSize) {
            bins.push(0);
            labels.push(`${i}-${i + binSize}s`);
            ranges.push({ min: i, max: i + binSize });
        }
        valid.forEach(t => {
            const idx = Math.floor((t - min) / binSize);
            if (idx >= 0 && idx < bins.length) bins[idx]++;
        });
        return { labels, data: bins, ranges };
    }

    function getStatsForPeriod(times, days, offsetDays = 0) {
        const now = new Date();
        const start = new Date(); start.setDate(now.getDate() - days - offsetDays);
        const end = new Date(); end.setDate(now.getDate() - offsetDays);
        start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
        const valid = times.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end && Number.isFinite(Utils.effectiveTime(t));
        });
        return { avg: Utils.avg(valid.map(Utils.effectiveTime)), count: valid.length, best: valid.length ? Math.min(...valid.map(Utils.effectiveTime)) : NaN };
    }

    return { parseCsTimerExport, computeHistogram, getStatsForPeriod };
})();

// ============================================
// DATA MANAGER
// ============================================
const DataManager = (function () {
    let appData = { times: [], solves: 0 };
    let currentUser = null;
    let pageSize = CONFIG.DEFAULT_PAGE_SIZE;
    let currentPage = 1;

    async function initData() {
        currentUser = await checkAuth();
        if (!currentUser) return;

        const { data, error } = await supabase.from('solves').select('*').order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
            appData.times = data.map(s => ({
                time: s.time, penalty: s.penalty || CONFIG.PENALTIES.NONE,
                method: s.method || CONFIG.DEFAULT_METHOD, cube: s.cube || CONFIG.DEFAULT_CUBE,
                date: s.created_at, dbId: s.id, scramble: s.scramble || ''
            }));
            appData.solves = appData.times.length;
        } else {
            const saved = localStorage.getItem(CONFIG.TIMES_STORAGE_KEY);
            if (saved) {
                appData.times = JSON.parse(saved);
                appData.solves = appData.times.length;
            }
        }
    }

    function addSolve(solve) {
        appData.times.push(solve);
        appData.solves = appData.times.length;
        localStorage.setItem(CONFIG.TIMES_STORAGE_KEY, JSON.stringify(appData.times));

        if (currentUser) {
            supabase.from('solves').insert([{
                user_id: currentUser.id,
                time: solve.time,
                scramble: solve.scramble,
                penalty: solve.penalty,
                method: solve.method,
                cube: solve.cube
            }]).select().then(({ data, error }) => {
                if (error) {
                    console.error('Erro no Supabase:', error);
                    Utils.showToast('Erro ao sincronizar com a nuvem');
                } else if (data && data[0]) {
                    solve.dbId = data[0].id;
                    localStorage.setItem(CONFIG.TIMES_STORAGE_KEY, JSON.stringify(appData.times));
                }
            });
        }
    }

    async function deleteSolve(index) {
        const solve = appData.times[index];
        if (!solve) return;

        appData.times.splice(index, 1);
        appData.solves = appData.times.length;
        localStorage.setItem(CONFIG.TIMES_STORAGE_KEY, JSON.stringify(appData.times));

        if (solve.dbId && currentUser) {
            const { error } = await supabase.from('solves').delete().eq('id', solve.dbId);
            if (error) {
                console.error('Erro ao deletar na nuvem:', error);
                Utils.showToast('Erro ao apagar da nuvem.');
            }
        }
    }

    function buildTimesRows() {
        const valid = appData.times.map(Utils.effectiveTime).filter(Number.isFinite);
        const pb = valid.length ? Math.min(...valid) : NaN;
        const total = appData.times.length;
        const startIdx = Math.max(total - (currentPage - 1) * pageSize - 1, -1);
        const endIdx = Math.max(total - currentPage * pageSize, 0);

        const rows = [];
        for (let idx = startIdx; idx >= endIdx; idx--) {
            const s = appData.times[idx];
            rows.push({
                date: s.date || new Date().toISOString(), time: Utils.effectiveTime(s),
                method: s.method || CONFIG.DEFAULT_METHOD, cube: s.cube || CONFIG.DEFAULT_CUBE,
                penalty: s.penalty || CONFIG.PENALTIES.NONE, isPB: Utils.effectiveTime(s) === pb,
                index: idx, dbId: s.dbId
            });
        }
        return rows;
    }

    return {
        initData, addSolve, deleteSolve, buildTimesRows,
        getData: () => ({ ...appData }),
        setPageSize: (s) => { pageSize = s === 'all' ? Infinity : parseInt(s); currentPage = 1; },
        setCurrentPage: (p) => { currentPage = p; },
        getCurrentPage: () => currentPage,
        getTotalPages: () => Math.max(1, Math.ceil(appData.times.length / pageSize))
    };
})();

// ============================================
// UI COMPONENTS
// ============================================
const UIComponents = (function () {
    const chartsInit = {};

    function renderTimesTable() {
        const timesTableBody = document.getElementById('timesTableBody');
        if (!timesTableBody) return;
        timesTableBody.innerHTML = '';
        const rows = DataManager.buildTimesRows();

        rows.forEach(time => {
            const row = document.createElement('tr');
            const penaltyLabel = time.penalty === CONFIG.PENALTIES.DNF ? 'DNF' : (time.penalty === CONFIG.PENALTIES.PLUS2 ? '+2' : '');
            let statusCell = time.penalty === CONFIG.PENALTIES.DNF ? '<span class="badge badge--dnf">DNF</span>' :
                time.time < 16 ? '<span class="badge badge--good">Ótimo</span>' :
                    time.time < 20 ? '<span class="badge badge--warn">Bom</span>' : '<span class="badge badge--bad">Melhorável</span>';

            row.innerHTML = `
                <td>${Utils.formatDate(time.date)}</td>
                <td class="time-cell">${Number.isFinite(time.time) ? Utils.formatTime(time.time) : '—'} ${penaltyLabel ? `<span class="badge ${penaltyLabel === '+2' ? 'badge--warn' : 'badge--dnf'}">${penaltyLabel}</span>` : ''} ${time.isPB ? '<span class="pb-badge">PB</span>' : ''}</td>
                <td>${time.method}</td><td>${time.cube}</td><td>${statusCell}</td>
                <td><button class="btn btn--sm btn--danger" data-action="delete" data-index="${time.index}"><i class="fas fa-trash"></i></button></td>
            `;
            timesTableBody.appendChild(row);
        });
    }

    function renderDashboardCards() {
        const data = DataManager.getData();
        const pb = data.times.length ? Math.min(...data.times.map(Utils.effectiveTime).filter(Number.isFinite)) : NaN;
        const a5 = Utils.aoN(data.times, 5);
        const a12 = Utils.aoN(data.times, 12);
        const valid = data.times.map(Utils.effectiveTime).filter(Number.isFinite);
        const m = Utils.avg(valid);
        const within = valid.filter(t => Math.abs(t - m) <= m * 0.1).length;

        if (document.getElementById('statPbValue')) document.getElementById('statPbValue').textContent = isFinite(pb) ? `${pb.toFixed(2)}s` : '--';
        if (document.getElementById('statAo5Value')) document.getElementById('statAo5Value').textContent = isFinite(a5) ? `${a5.toFixed(2)}s` : '--';
        if (document.getElementById('statAo12Value')) document.getElementById('statAo12Value').textContent = isFinite(a12) ? `${a12.toFixed(2)}s` : '--';
        if (document.getElementById('statSolvesValue')) document.getElementById('statSolvesValue').textContent = String(data.times.length);
        if (document.getElementById('statConsistencyValue')) document.getElementById('statConsistencyValue').textContent = valid.length ? `${Math.round((within / valid.length) * 100)}%` : '--';
    }

    return { renderTimesTable, renderDashboardCards, chartsInit };
})();

// ============================================
// TIMER & SCRAMBLE
// ============================================
const ScrambleGenerator = {
    moves: ['R', 'L', 'U', 'D', 'F', 'B'], modifiers: ['', "'", '2'],
    generate(length = 20) {
        let scramble = [], lastAxis = -1;
        const axisMap = { 'R': 0, 'L': 0, 'U': 1, 'D': 1, 'F': 2, 'B': 2 };
        for (let i = 0; i < length; i++) {
            let move, axis;
            do { move = this.moves[Math.floor(Math.random() * this.moves.length)]; axis = axisMap[move]; } while (axis === lastAxis);
            lastAxis = axis;
            scramble.push(move + this.modifiers[Math.floor(Math.random() * this.modifiers.length)]);
        }
        return scramble.join(' ');
    }
};

const Timer = {
    state: 'idle', startTime: 0, interval: null, display: null, scrambleDisplay: null, currentScramble: '',

    init() {
        this.display = document.getElementById('timerDisplay');
        this.scrambleDisplay = document.getElementById('scrambleDisplay');
        if (!this.display) return;
        this.generateScramble();
        this.attachEvents();
        this.updateSessionStats();
    },

    generateScramble() {
        this.currentScramble = ScrambleGenerator.generate();
        if (this.scrambleDisplay) this.scrambleDisplay.textContent = this.currentScramble;
    },

    attachEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state === 'running') this.stop();
                else if (this.state === 'idle' || this.state === 'stopped') { this.state = 'ready'; this.display.classList.add('ready'); }
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.state === 'ready') this.start();
            else if (e.code === 'Space' && this.state === 'stopped') { this.state = 'idle'; this.display.classList.remove('ready'); }
        });

        document.getElementById('btnGenScramble')?.addEventListener('click', () => this.generateScramble());
        document.getElementById('btnDeleteLast')?.addEventListener('click', () => this.deleteLast());

        // 💡 Ouve o clique na lista de tempos recentes para deletar
        const solvesList = document.getElementById('solvesList');
        if (solvesList) {
            solvesList.addEventListener('click', async (e) => {
                const deleteBtn = e.target.closest('.actions');
                if (!deleteBtn) return;

                const item = deleteBtn.closest('.solve-item');
                const index = parseInt(item.dataset.index, 10);

                if (!isNaN(index) && confirm('Excluir este tempo?')) {
                    await DataManager.deleteSolve(index);
                    this.updateSessionStats();
                    UIComponents.renderDashboardCards();
                    Utils.showToast('Tempo excluído.');
                }
            });
        }
    },

    start() {
        this.state = 'running'; this.display.classList.remove('ready'); this.startTime = Date.now();
        this.interval = setInterval(() => { this.display.textContent = ((Date.now() - this.startTime) / 1000).toFixed(2); }, 30);
    },

    stop() {
        this.state = 'stopped'; clearInterval(this.interval);
        const finalTime = (Date.now() - this.startTime) / 1000;
        this.display.textContent = finalTime.toFixed(2);

        this.saveSolve(finalTime, CONFIG.PENALTIES.NONE);
    },

    saveSolve(time, penalty) {
        const solve = {
            time: time, scramble: this.currentScramble, date: new Date().toISOString(),
            penalty: penalty, cube: CONFIG.DEFAULT_CUBE, method: CONFIG.DEFAULT_METHOD
        };

        DataManager.addSolve(solve);
        this.generateScramble();
        this.updateSessionStats();
        UIComponents.renderDashboardCards();

        if (penalty === CONFIG.PENALTIES.PLUS2) Utils.showToast('Penalidade +2 aplicada!');
        if (penalty === CONFIG.PENALTIES.DNF) Utils.showToast('DNF aplicado!');
    },

    deleteLast() {
        const data = DataManager.getData();
        if (data.times.length === 0) return;
        if (confirm('Excluir último tempo?')) {
            DataManager.deleteSolve(data.times.length - 1);
            this.updateSessionStats();
            UIComponents.renderDashboardCards();
            Utils.showToast('Tempo excluído.');
        }
    },

    updateSessionStats() {
        const data = DataManager.getData();
        const times = data.times;
        const reversed = [...times].reverse();

        const list = document.getElementById('solvesList');
        if (list) {
            if (reversed.length === 0) {
                list.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Nenhum tempo</div>';
            } else {
                list.innerHTML = reversed.slice(0, 50).map((t, i) => {
                    let timeDisplay = t.time.toFixed(2);
                    let rowClass = '';
                    if (t.penalty === CONFIG.PENALTIES.PLUS2) {
                        timeDisplay = `${(t.time + 2).toFixed(2)}+`;
                        rowClass = 'penalty-plus2';
                    } else if (t.penalty === CONFIG.PENALTIES.DNF) {
                        timeDisplay = 'DNF';
                        rowClass = 'penalty-dnf';
                    }

                    return `
                    <div class="solve-item ${rowClass}" data-index="${times.length - 1 - i}" title="Scramble: ${t.scramble}">
                        <span class="count">${times.length - i}.</span>
                        <span class="time">${timeDisplay}</span>
                        <span class="small-scramble" style="display:block; font-size:0.7rem; color:var(--text-muted); width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.scramble || ''}</span>
                        <span class="actions" title="Excluir"><i class="fas fa-trash"></i></span>
                    </div>
                `}).join('');
            }
        }

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = (val === undefined || isNaN(val)) ? '--' : val.toFixed(2);
        };

        setVal('sessionCount', times.length);
        setVal('sessionMean', Utils.avg(times.map(Utils.effectiveTime).filter(Number.isFinite)));
        setVal('sessionAo5', Utils.aoN(times, 5));
        setVal('sessionAo12', Utils.aoN(times, 12));
        setVal('sessionBest', times.length ? Math.min(...times.map(Utils.effectiveTime).filter(Number.isFinite)) : NaN);
    }
};

// ============================================
// MAIN APPLICATION INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function () {
    try {
        await DataManager.initData();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        if (document.getElementById('timerDisplay')) Timer.init();

        UIComponents.renderDashboardCards();
        UIComponents.renderTimesTable();

        // 💡 Lógica do Menu Lateral (Ctrl+H e Botão)
        const sidebarToggle = document.getElementById('sidebarToggle');
        const body = document.body;

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                body.classList.toggle('sidebar-hidden');
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                body.classList.toggle('sidebar-hidden');
            }
            if (e.key === 'Escape') {
                const timerDisplay = document.getElementById('timerDisplay');
                if (timerDisplay && timerDisplay.textContent === '0.00') {
                    document.getElementById('btnGenScramble')?.click();
                }
            }
        });

        // Exporta para a página de estatísticas
        window.CubeMasterApp = { DataManager, Utils, DataImporter };
        window.dispatchEvent(new CustomEvent('CubeMaster:Ready'));

        Utils.showToast('Cubing Analytics carregado!');
    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
});