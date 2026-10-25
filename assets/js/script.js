import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
    'https://fhsolmqghxbreahgqknl.supabase.co',
    'sb_publishable_cieUk7Cu_zRUg_NBffSYaA_HYQzy4cf'
);

window.supabase = supabase;

const CONFIG = {
    STORAGE_KEY: 'times-data',
    DEFAULT_CUBE: '3x3',
    DEFAULT_METHOD: 'CFOP',
    PENALTIES: { NONE: 'none', PLUS2: 'plus2', DNF: 'dnf' }
};

const Utils = {
    effectiveTime(s) {
        if (!s || typeof s !== 'object') return Number(s);
        if (s.penalty === CONFIG.PENALTIES.DNF) return NaN;
        return s.penalty === CONFIG.PENALTIES.PLUS2 ? s.time + 2 : s.time;
    },
    formatTime(sec) {
        return sec.toFixed(2) + 's';
    },
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    },
    avg(arr) {
        return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN;
    },
    aoN(solves, n) {
        if (solves.length < n) return NaN;
        const last = solves.slice(-n);
        if (last.some(s => !Number.isFinite(Utils.effectiveTime(s)))) return NaN;
        const eff = last.map(Utils.effectiveTime).sort((a, b) => a - b);
        return Utils.avg(eff.slice(1, -1));
    },
    toast(msg) {
        let container = document.getElementById('toaster');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toaster';
            document.body.appendChild(container);
        }
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = msg;
        container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
};

const DataImporter = {
    parseCsTimer(text) {
        let times = [];
        const lines = text.split(/\r?\n/);

        // Tenta JSON primeiro
        try {
            const json = JSON.parse(text);
            const sessions = Array.isArray(json) ? json : Object.values(json).filter(Array.isArray).flat();
            sessions.forEach(s => {
                if (Array.isArray(s) && s.length >= 2) {
                    let penalty = CONFIG.PENALTIES.NONE;
                    if (s[0] === -1) penalty = CONFIG.PENALTIES.DNF;
                    else if (s[0] === 2000) penalty = CONFIG.PENALTIES.PLUS2;

                    times.push({
                        time: s[1] / 1000,
                        penalty,
                        method: CONFIG.DEFAULT_METHOD,
                        cube: CONFIG.DEFAULT_CUBE,
                        date: s[3] ? new Date(s[3] * 1000).toISOString() : null
                    });
                }
            });
            if (times.length) return { times, solves: times.length };
        } catch (e) { /* ignora e tenta o formato de texto */ }

        // Parser do formato TXT padrão do csTimer
        const solveRegex = /^\s*\d+\.\s+(?:(DNF)\s*\(?([0-9.:]+)\)?|([0-9.:]+)(\+?))/i;
        lines.forEach(line => {
            const m = line.trim().match(solveRegex);
            if (m) {
                const isDnf = !!m[1];
                const timeStr = m[2] || m[3];
                const isPlus2 = m[4] === '+';

                if (timeStr) {
                    let val = parseFloat(timeStr);
                    if (timeStr.includes(':')) {
                        const p = timeStr.split(':');
                        val = parseFloat(p[0]) * 60 + parseFloat(p[1]);
                    }
                    if (!isNaN(val)) {
                        times.push({
                            time: val,
                            penalty: isDnf ? CONFIG.PENALTIES.DNF : (isPlus2 ? CONFIG.PENALTIES.PLUS2 : CONFIG.PENALTIES.NONE),
                            method: CONFIG.DEFAULT_METHOD,
                            cube: CONFIG.DEFAULT_CUBE,
                            date: new Date().toISOString()
                        });
                    }
                }
            }
        });

        return { times, solves: times.length };
    },

    getStatsForPeriod(times, days, offset = 0) {
        const now = new Date();
        const start = new Date(); start.setDate(now.getDate() - days - offset); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setDate(now.getDate() - offset); end.setHours(23, 59, 59, 999);

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
};

const DataManager = (() => {
    let appData = { times: [], solves: 0 };
    let currentUser = null;
    let pageSize = 100;
    let currentPage = 1;

    async function init() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { window.location.href = 'login.html'; return; }
        currentUser = session.user;

        const { data, error } = await supabase.from('solves').select('*').order('created_at', { ascending: true });

        if (!error && data?.length) {
            appData.times = data.map(s => ({
                time: s.time,
                penalty: s.penalty || CONFIG.PENALTIES.NONE,
                method: s.method || CONFIG.DEFAULT_METHOD,
                cube: s.cube || CONFIG.DEFAULT_CUBE,
                date: s.created_at,
                dbId: s.id,
                scramble: s.scramble || ''
            }));
        } else {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (saved) appData.times = JSON.parse(saved);
        }
        appData.solves = appData.times.length;
    }

    function add(solve) {
        appData.times.push(solve);
        appData.solves = appData.times.length;
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData.times));

        if (!currentUser) return;

        supabase.from('solves').insert([{
            user_id: currentUser.id,
            time: solve.time,
            scramble: solve.scramble,
            penalty: solve.penalty,
            method: solve.method,
            cube: solve.cube
        }]).select().then(({ data, error }) => {
            if (error) {
                console.error('Erro ao salvar no DB:', error);
                Utils.toast('Erro ao sincronizar');
            } else if (data?.[0]) {
                solve.dbId = data[0].id;
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData.times));
            }
        });
    }

    async function remove(index) {
        const solve = appData.times[index];
        if (!solve) return;

        appData.times.splice(index, 1);
        appData.solves = appData.times.length;
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData.times));

        if (solve.dbId && currentUser) {
            await supabase.from('solves').delete().eq('id', solve.dbId);
        }
    }

    function getRows() {
        const valid = appData.times.map(Utils.effectiveTime).filter(Number.isFinite);
        const pb = valid.length ? Math.min(...valid) : NaN;
        const total = appData.times.length;

        const start = Math.max(total - (currentPage - 1) * pageSize - 1, -1);
        const end = Math.max(total - currentPage * pageSize, 0);

        const rows = [];
        for (let i = start; i >= end; i--) {
            const s = appData.times[i];
            rows.push({
                date: s.date || new Date().toISOString(),
                time: Utils.effectiveTime(s),
                method: s.method || CONFIG.DEFAULT_METHOD,
                cube: s.cube || CONFIG.DEFAULT_CUBE,
                penalty: s.penalty || CONFIG.PENALTIES.NONE,
                isPB: Utils.effectiveTime(s) === pb,
                index: i,
                dbId: s.dbId
            });
        }
        return rows;
    }

    return {
        init, add, remove, getRows,
        getData: () => ({ ...appData }),
        setPageSize: (s) => { pageSize = s === 'all' ? Infinity : parseInt(s); currentPage = 1; },
        setCurrentPage: (p) => { currentPage = p; },
        getCurrentPage: () => currentPage,
        getTotalPages: () => Math.max(1, Math.ceil(appData.times.length / pageSize))
    };
})();

const ScrambleGenerator = {
    moves: ['R', 'L', 'U', 'D', 'F', 'B'],
    mods: ['', "'", '2'],
    generate(len = 20) {
        let scramble = [], lastAxis = -1;
        const axes = { 'R': 0, 'L': 0, 'U': 1, 'D': 1, 'F': 2, 'B': 2 };
        for (let i = 0; i < len; i++) {
            let move, axis;
            do {
                move = this.moves[Math.floor(Math.random() * this.moves.length)];
                axis = axes[move];
            } while (axis === lastAxis);

            lastAxis = axis;
            scramble.push(move + this.mods[Math.floor(Math.random() * this.mods.length)]);
        }
        return scramble.join(' ');
    }
};

const Timer = {
    state: 'idle', startTime: 0, interval: null,
    display: document.getElementById('timerDisplay'),
    scrambleDisplay: document.getElementById('scrambleDisplay'),
    currentScramble: '',

    init() {
        if (!this.display) return;
        this.genScramble();
        this.bindEvents();
        this.updateStats();
    },

    genScramble() {
        this.currentScramble = ScrambleGenerator.generate();
        if (this.scrambleDisplay) this.scrambleDisplay.textContent = this.currentScramble;
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state === 'running') this.stop();
                else if (this.state === 'idle' || this.state === 'stopped') {
                    this.state = 'ready';
                    this.display.classList.add('ready');
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.state === 'ready') this.start();
            else if (e.code === 'Space' && this.state === 'stopped') {
                this.state = 'idle';
                this.display.classList.remove('ready');
            }
        });

        document.getElementById('btnGenScramble')?.addEventListener('click', () => this.genScramble());
        document.getElementById('btnDeleteLast')?.addEventListener('click', () => this.deleteLast());

        document.getElementById('solvesList')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.actions');
            if (!btn) return;
            const idx = parseInt(btn.closest('.solve-item').dataset.index, 10);

            if (!isNaN(idx) && confirm('Excluir este tempo?')) {
                await DataManager.remove(idx);
                this.updateStats();
                Utils.toast('Tempo excluído.');
            }
        });
    },

    start() {
        this.state = 'running';
        this.display.classList.remove('ready');
        this.startTime = Date.now();
        this.interval = setInterval(() => {
            this.display.textContent = ((Date.now() - this.startTime) / 1000).toFixed(2);
        }, 30);
    },

    stop() {
        this.state = 'stopped';
        clearInterval(this.interval);
        const time = (Date.now() - this.startTime) / 1000;
        this.display.textContent = time.toFixed(2);

        const solve = {
            time,
            scramble: this.currentScramble,
            date: new Date().toISOString(),
            penalty: CONFIG.PENALTIES.NONE,
            cube: CONFIG.DEFAULT_CUBE,
            method: CONFIG.DEFAULT_METHOD
        };

        DataManager.add(solve);
        this.genScramble();
        this.updateStats();
    },

    deleteLast() {
        const data = DataManager.getData();
        if (!data.times.length) return;
        if (confirm('Excluir último tempo?')) {
            DataManager.remove(data.times.length - 1);
            this.updateStats();
            Utils.toast('Tempo excluído.');
        }
    },

    updateStats() {
        const times = DataManager.getData().times;

        // Lista lateral
        const list = document.getElementById('solvesList');
        if (list) {
            const rev = [...times].reverse();
            list.innerHTML = rev.length === 0
                ? '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Nenhum tempo</div>'
                : rev.slice(0, 50).map((t, i) => {
                    let timeStr = t.time.toFixed(2), rowClass = '';
                    if (t.penalty === CONFIG.PENALTIES.PLUS2) { timeStr = `${(t.time + 2).toFixed(2)}+`; rowClass = 'penalty-plus2'; }
                    else if (t.penalty === CONFIG.PENALTIES.DNF) { timeStr = 'DNF'; rowClass = 'penalty-dnf'; }

                    return `
                    <div class="solve-item ${rowClass}" data-index="${times.length - 1 - i}" title="${t.scramble}">
                        <span class="count">${times.length - i}.</span>
                        <span class="time">${timeStr}</span>
                        <span class="small-scramble" style="display:block; font-size:0.7rem; color:var(--text-muted); width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.scramble || ''}</span>
                        <span class="actions" title="Excluir"><i class="fas fa-trash"></i></span>
                    </div>`;
                }).join('');
        }

        // Cards superiores
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = (!val || isNaN(val)) ? '--' : val.toFixed(2);
        };

        const validTimes = times.map(Utils.effectiveTime).filter(Number.isFinite);
        setVal('sessionCount', times.length);
        setVal('sessionMean', Utils.avg(validTimes));
        setVal('sessionAo5', Utils.aoN(times, 5));
        setVal('sessionAo12', Utils.aoN(times, 12));
        setVal('sessionBest', validTimes.length ? Math.min(...validTimes) : NaN);
    }
};

// Inicialização Global
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await DataManager.init();
        if (document.getElementById('timerDisplay')) Timer.init();

        // Menu responsivo e atalhos
        const sidebarToggle = document.getElementById('sidebarToggle');
        const body = document.body;

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => body.classList.toggle('sidebar-hidden'));
        }

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                body.classList.toggle('sidebar-hidden');
            }
            if (e.key === 'Escape' && document.getElementById('timerDisplay')?.textContent === '0.00') {
                document.getElementById('btnGenScramble')?.click();
            }
        });

        // Logout
        document.getElementById('btnLogout')?.addEventListener('click', async () => {
            if (!confirm('Deseja realmente sair?')) return;
            await supabase.auth.signOut();
            window.location.href = 'login.html';
        });

        window.CubeMasterApp = { DataManager, Utils, DataImporter };
        window.dispatchEvent(new CustomEvent('CubeMaster:Ready'));
    } catch (err) {
        console.error("Falha na inicialização:", err);
    }
});