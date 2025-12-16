document.addEventListener('DOMContentLoaded', function () {
    const chartsInit = {};
    const themeKey = 'theme-preference';
    const timesStorageKey = 'times-data';
    let appData = { times: [], exportDate: null, solves: 0 };
    let pageSize = 100;
    let currentPage = 1;
    function isSolveObject(x) {
        return x && typeof x === 'object' && typeof x.time === 'number' && 'penalty' in x;
    }
    function toSolveObjects(arr) {
        if (!Array.isArray(arr)) return [];
        let res = [];
        if (arr.every(isSolveObject)) {
            res = arr;
        } else {
            res = arr.map(t => ({ time: Number(t), penalty: 'none', method: 'CFOP', cube: '3x3' }));
        }
        simulateDates(res);
        return res;
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

    function simulateDates(times) {
        if (!times.length) return;
        // Check if dates are already present and valid
        if (times.every(t => t.date && !isNaN(new Date(t.date).getTime()))) return;

        let currentDate = new Date();
        let solvesToday = 0;
        const maxSolvesPerDay = 15;

        // Iterate backwards
        for (let i = times.length - 1; i >= 0; i--) {
            if (!times[i].date) {
                times[i].date = currentDate.toISOString();
                solvesToday++;

                // Randomly move to previous day
                if (solvesToday >= Math.floor(Math.random() * maxSolvesPerDay) + 5) {
                    currentDate.setDate(currentDate.getDate() - 1);
                    solvesToday = 0;
                }
            }
        }
    }

    function getStatsForPeriod(days, offsetDays = 0) {
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - days - offsetDays);
        const end = new Date();
        end.setDate(now.getDate() - offsetDays);

        // Set to start/end of day
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const valid = appData.times.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end && Number.isFinite(effectiveTime(t));
        });

        return {
            avg: avg(valid.map(effectiveTime)),
            count: valid.length,
            best: valid.length ? Math.min(...valid.map(effectiveTime)) : NaN
        };
    }

    function renderEvolutionAnalysis() {
        const stats7 = getStatsForPeriod(7);
        const stats7Prev = getStatsForPeriod(7, 7);
        const stats30 = getStatsForPeriod(30);
        const stats30Prev = getStatsForPeriod(30, 30);
        const statsAll = {
            avg: avg(appData.times.map(effectiveTime).filter(Number.isFinite)),
            count: appData.times.length
        };

        // UI Elements
        const el7 = document.getElementById('evo7Days');
        const el7Comp = document.getElementById('evo7DaysComp');
        const el30 = document.getElementById('evo30Days');
        const el30Comp = document.getElementById('evo30DaysComp');
        const elAll = document.getElementById('evoAll');
        const elAllComp = document.getElementById('evoAllComp');
        const elTrend = document.getElementById('evolutionTrend');

        // Helper to render diff
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

        if (el7) {
            el7.textContent = isFinite(stats7.avg) ? formatTime(stats7.avg) : '--';
            renderDiff(stats7.avg, stats7Prev.avg, el7Comp);
        }

        if (el30) {
            el30.textContent = isFinite(stats30.avg) ? formatTime(stats30.avg) : '--';
            const pct30 = renderDiff(stats30.avg, stats30Prev.avg, el30Comp);

            // Trend Text
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

        if (elAll) {
            elAll.textContent = isFinite(statsAll.avg) ? formatTime(statsAll.avg) : '--';
            elAllComp.textContent = `${statsAll.count} solves totais`;
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
                simulateDates(appData.times);
                localStorage.setItem(timesStorageKey, JSON.stringify(appData.times));
                return;
            }
        } catch { }
        const fallback = [16.45, 18.32, 17.89, 15.32, 19.21, 18.76, 20.12, 19.45].map(t => ({ time: t, penalty: 'none', method: 'CFOP', cube: '3x3' }));
        simulateDates(fallback);
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
        renderEvolutionAnalysis();
        calculateAdvancedMetrics();
        renderGoals();
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
                    tension: 0.4,
                    pointBackgroundColor: context => {
                        const data = context.dataset.data;
                        const val = data[context.dataIndex];
                        const min = Math.min(...data);
                        return val === min ? '#f59e0b' : '#2563eb';
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
    function computeHistogram(solves, binSize = 2) {
        const valid = solves.map(effectiveTime).filter(Number.isFinite);
        if (!valid.length) return { labels: [], data: [], ranges: [] };

        const min = Math.floor(Math.min(...valid));
        const max = Math.ceil(Math.max(...valid));
        const bins = [];
        const labels = [];
        const ranges = [];

        // Create bins
        for (let i = min; i < max; i += binSize) {
            bins.push(0);
            const rangeEnd = i + binSize;
            labels.push(`${i}-${rangeEnd}s`);
            ranges.push({ min: i, max: rangeEnd });
        }

        // Fill bins
        valid.forEach(t => {
            const binIndex = Math.floor((t - min) / binSize);
            if (binIndex >= 0 && binIndex < bins.length) {
                bins[binIndex]++;
            }
        });

        return { labels, data: bins, ranges };
    }

    function initTimeDistributionChart() {
        if (chartsInit.timeDistributionChart) return;
        const el = document.getElementById('timeDistributionChart');
        if (!el) return;
        const ctx = el.getContext('2d');
        const targetInput = document.getElementById('targetTimeInput');
        const targetTime = targetInput ? parseFloat(targetInput.value) : 20;

        // Dynamic Bin Calculation
        const dist = computeHistogram(appData.times, 2);

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
                        // Green if range max is under target, Orange if range min is over target
                        if (range.max <= targetTime) return '#10b981';
                        if (range.min >= targetTime) return '#f59e0b';
                        return '#3b82f6'; // Mixed range
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
                    showDistributionDetails(range);
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

        // Listen for target change
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

    function showDistributionDetails(range) {
        const container = document.getElementById('distributionDetails');
        const tbody = document.getElementById('distTableBody');
        const label = document.getElementById('distRangeLabel');
        const closeBtn = document.getElementById('closeDistDetails');

        if (!container || !tbody) return;

        label.textContent = `${range.min}s - ${range.max}s`;

        // Filter solves
        const solves = appData.times.filter(s => {
            const t = effectiveTime(s);
            return Number.isFinite(t) && t >= range.min && t < range.max;
        }).sort((a, b) => effectiveTime(a) - effectiveTime(b));

        tbody.innerHTML = solves.map(s => `
            <tr>
                <td>${new Date(s.date).toLocaleDateString()}</td>
                <td style="font-weight:bold;">${effectiveTime(s).toFixed(2)}s</td>
                <td>${s.method}</td>
            </tr>
        `).join('');

        container.style.display = 'block';

        if (closeBtn) {
            closeBtn.onclick = () => container.style.display = 'none';
        }

        // Scroll to details
        container.scrollIntoView({ behavior: 'smooth' });
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
    function calculateAdvancedMetrics() {
        const valid = appData.times.map(effectiveTime).filter(Number.isFinite);
        if (!valid.length) return;

        // 1. Estimated Level (based on Ao100 or all)
        const recent100 = valid.slice(-100);
        const avg100 = avg(recent100);
        const elLevel = document.getElementById('metricLevel');
        const elLevelDesc = document.getElementById('metricLevelDesc');

        if (elLevel) {
            if (isNaN(avg100)) {
                elLevel.textContent = '--';
            } else {
                let level = '';
                if (avg100 < 10) level = 'Sub-10';
                else if (avg100 < 15) level = 'Sub-15';
                else if (avg100 < 20) level = 'Sub-20';
                else if (avg100 < 25) level = 'Sub-25';
                else if (avg100 < 30) level = 'Sub-30';
                else if (avg100 < 40) level = 'Sub-40';
                else if (avg100 < 60) level = 'Sub-1';
                else level = 'Iniciante';

                elLevel.textContent = level;
                elLevelDesc.textContent = `Média: ${avg100.toFixed(2)}s`;
            }
        }

        // 2. PB Probability
        const elPbProb = document.getElementById('metricPbProb');
        if (elPbProb) {
            if (valid.length < 20) {
                elPbProb.textContent = '--%';
            } else {
                const recent20 = valid.slice(-20);
                const m = avg(recent20);
                const variance = recent20.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / recent20.length;
                const stdDev = Math.sqrt(variance);
                const currentPB = Math.min(...valid);

                // Z-score for PB
                const z = (currentPB - m) / stdDev;

                // Approx probability using cumulative distribution function (CDF)
                // This is a rough estimation for "probability of beating PB in next solve"
                // Assuming normal distribution (which is approx true for cubing)
                // We want P(X < PB)

                // Error function approximation
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

                // If prob is super low, show < 1%
                elPbProb.textContent = prob < 0.1 ? '< 0.1%' : `${prob.toFixed(1)}%`;
            }
        }

        // 3. Best Time of Day
        const elBestTime = document.getElementById('metricBestTime');
        if (elBestTime) {
            const hours = {};
            appData.times.forEach(t => {
                if (!t.date || !Number.isFinite(effectiveTime(t))) return;
                const h = new Date(t.date).getHours();
                const period = h < 6 ? 'Madrugada' : h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite';
                if (!hours[period]) hours[period] = [];
                hours[period].push(effectiveTime(t));
            });

            let bestPeriod = '--';
            let bestAvg = Infinity;

            Object.entries(hours).forEach(([p, times]) => {
                const a = avg(times);
                if (a < bestAvg) {
                    bestAvg = a;
                    bestPeriod = p;
                }
            });

            elBestTime.textContent = bestPeriod;
        }
    }

    function renderGoals() {
        const goalVolumeBar = document.getElementById('goalVolumeBar');
        const goalVolumeText = document.getElementById('goalVolumeText');
        const goalSub20Bar = document.getElementById('goalSub20Bar');
        const goalSub20Text = document.getElementById('goalSub20Text');

        if (!goalVolumeBar) return;

        // Weekly Volume Goal (100)
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);

        const thisWeekSolves = appData.times.filter(t => new Date(t.date) >= startOfWeek);
        const vol = thisWeekSolves.length;
        const volTarget = 100;
        const volPct = Math.min((vol / volTarget) * 100, 100);

        goalVolumeBar.style.width = `${volPct}%`;
        goalVolumeText.textContent = `${vol}/${volTarget}`;

        // Sub-20 Goal (10)
        const sub20 = thisWeekSolves.filter(t => effectiveTime(t) < 20).length;
        const sub20Target = 10;
        const sub20Pct = Math.min((sub20 / sub20Target) * 100, 100);

        goalSub20Bar.style.width = `${sub20Pct}%`;
        goalSub20Text.textContent = `${sub20}/${sub20Target}`;
    }

    function initTimeOfDayChart() {
        if (chartsInit.timeOfDayChart) return;
        const el = document.getElementById('timeOfDayChart');
        if (!el) return;

        const hourCounts = new Array(24).fill(0);
        const hourSums = new Array(24).fill(0);

        appData.times.forEach(t => {
            if (!t.date || !Number.isFinite(effectiveTime(t))) return;
            const h = new Date(t.date).getHours();
            hourCounts[h]++;
            hourSums[h] += effectiveTime(t);
        });

        const avgs = hourSums.map((sum, i) => hourCounts[i] ? sum / hourCounts[i] : null);
        // Filter out nulls for cleaner chart or leave gaps

        const ctx = el.getContext('2d');
        chartsInit.timeOfDayChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
                datasets: [{
                    label: 'Média por Horário',
                    data: avgs,
                    borderColor: '#8b5cf6',
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
    function buildTimesRows() {
        const valid = appData.times.map(effectiveTime).filter(Number.isFinite);
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
            const eff = effectiveTime(s);
            rows.push({
                date: s.date || (appData.exportDate ? new Date(appData.exportDate).toISOString() : new Date().toISOString()),
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
                const solve = { time: isFinite(val) ? val : 0, penalty: isDnf ? 'dnf' : (isPlus2 ? 'plus2' : 'none'), method: formMethodInput.value || 'CFOP', cube: formCubeInput.value || '3x3', date: new Date().toISOString() };
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
        const info = document.getElementById('paginationInfo');
        const btnFirst = document.getElementById('pageFirst');
        const btnPrev = document.getElementById('pagePrev');
        const btnNext = document.getElementById('pageNext');
        const btnLast = document.getElementById('pageLast');
        const totalPages = !isFinite(pageSize) ? 1 : Math.max(1, Math.ceil(appData.times.length / pageSize));
        if (info) info.textContent = `Página ${currentPage} de ${totalPages}`;
        if (btnFirst) btnFirst.disabled = currentPage <= 1;
        if (btnPrev) btnPrev.disabled = currentPage <= 1;
        if (btnNext) btnNext.disabled = currentPage >= totalPages;
        if (btnLast) btnLast.disabled = currentPage >= totalPages;
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
    function updateHistoricoSummary() {
        const rows = buildTimesRows();
        const valid = rows.filter(r => Number.isFinite(r.time));
        const avgVal = avg(valid.map(t => t.time));
        const pb = valid.length ? Math.min(...valid.map(t => t.time)) : NaN;
        const avgEl = document.getElementById('historicoAvg');
        const pbEl = document.getElementById('historicoPb');
        const solvesEl = document.getElementById('historicoSolves');

        if (avgEl) avgEl.textContent = isFinite(avgVal) ? formatTime(avgVal) : '--';
        if (pbEl) pbEl.textContent = isFinite(pb) ? formatTime(pb) : '--';
        if (solvesEl) solvesEl.textContent = String(valid.length);
    }

    // Initial update
    updateHistoricoSummary();
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
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(50);
        }
        function closeNav() {
            document.body.classList.remove('nav-open');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        }
        if (toggleBtn) toggleBtn.addEventListener('click', function () {
            const open = document.body.classList.contains('nav-open');
            if (open) closeNav(); else openNav();
        });
        if (overlay) overlay.addEventListener('click', closeNav);
        links.forEach(a => a.addEventListener('click', closeNav));
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
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
                const parsed = parseCsTimerExport(text);
                appData = parsed;
                currentPage = 1;
                simulateDates(appData.times);
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
        if (resetBtn) {
            resetBtn.addEventListener('click', async function () {
                if (!confirm('Tem certeza que deseja resetar seus tempos? Esta ação não pode ser desfeita.')) return;
                localStorage.removeItem(timesStorageKey);
                const reimport = confirm('Deseja reimportar do arquivo meus-tempos.txt agora?');
                if (reimport) {
                    try {
                        const res = await fetch('./meus-tempos.txt', { cache: 'no-store' });
                        if (res.ok) {
                            const text = await res.text();
                            appData = parseCsTimerExport(text);
                            simulateDates(appData.times);
                            localStorage.setItem(timesStorageKey, JSON.stringify(appData.times));
                            showToast('Tempos reimportados');
                        } else {
                            appData = { times: [], exportDate: null, solves: 0 };
                            showToast('Arquivo meus-tempos.txt não encontrado; tempos resetados');
                        }
                    } catch {
                        appData = { times: [], exportDate: null, solves: 0 };
                        showToast('Erro ao reimportar; tempos resetados');
                    }
                } else {
                    appData = { times: [], exportDate: null, solves: 0 };
                    showToast('Tempos resetados');
                }
                renderTimesTable();
                updateHistoricoSummary();
                renderDashboardCards();
                if (chartsInit.timeEvolutionChart) { chartsInit.timeEvolutionChart.destroy(); chartsInit.timeEvolutionChart = null; }
                if (chartsInit.timeDistributionChart) { chartsInit.timeDistributionChart.destroy(); chartsInit.timeDistributionChart = null; }
                initTimeEvolutionChart();
                initTimeDistributionChart();
            });
        }
        if (limitSelect) {
            limitSelect.addEventListener('change', function () {
                pageSize = this.value === 'all' ? Infinity : parseInt(this.value, 10);
                currentPage = 1;
                renderTimesTable();
                updateHistoricoSummary();
            });
        }
        if (pageFirst) {
            pageFirst.addEventListener('click', function () {
                currentPage = 1;
                renderTimesTable();
                updateHistoricoSummary();
            });
        }
        if (pagePrev) {
            pagePrev.addEventListener('click', function () {
                if (!isFinite(pageSize)) return;
                currentPage = Math.max(1, currentPage - 1);
                renderTimesTable();
                updateHistoricoSummary();
            });
        }
        if (pageNext) {
            pageNext.addEventListener('click', function () {
                if (!isFinite(pageSize)) return;
                const totalPages = Math.max(1, Math.ceil(appData.times.length / pageSize));
                currentPage = Math.min(totalPages, currentPage + 1);
                renderTimesTable();
                updateHistoricoSummary();
            });
        }
        if (pageLast) {
            pageLast.addEventListener('click', function () {
                if (!isFinite(pageSize)) return;
                const totalPages = Math.max(1, Math.ceil(appData.times.length / pageSize));
                currentPage = totalPages;
                renderTimesTable();
                updateHistoricoSummary();
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
        updateHistoricoSummary();
    })();
});
