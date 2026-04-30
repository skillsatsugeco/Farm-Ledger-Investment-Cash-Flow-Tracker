// ══════════════════════════════════════════════════
//  freshBABA FARMS — Frontend Script
//  Backend: Google Apps Script Web App
// ══════════════════════════════════════════════════

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyZXruOGI9pcIg-sbzv-LJxuYfMZj3PIqbDsrsMcCbifxL-7RZbfak7dPCfkYh2gn8HBw/exec';

let state = {
    data: { investments: [], cashInflows: [] },
    chart: null,
    loading: false,
};

// ── Helpers ────────────────────────────────────────
const fmt = n =>
    'TZS ' + Math.abs(n).toLocaleString('en-TZ', { minimumFractionDigits: 0 });

const uuid = () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2, 6);

const today = () => new Date().toISOString().slice(0, 10);

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.innerHTML = '';
    const ico = document.createElement('span');
    ico.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : '⏳';
    const txt = document.createElement('span');
    txt.textContent = msg;
    t.appendChild(ico); t.appendChild(txt);
    t.className = 'show ' + type;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = ''; }, 3500);
}

function setLoading(on) {
    state.loading = on;
    document.querySelectorAll('.btn-primary').forEach(b => {
        b.disabled = on;
        b.style.opacity = on ? '0.6' : '1';
    });
}

function flashSaveIndicator() {
    const el = document.getElementById('saveIndicator');
    if (!el) return;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
}

// ── API calls ──────────────────────────────────────
async function gasGet() {
    const res = await fetch(GAS_URL, {
        method: 'GET',
        redirect: 'follow'
    });
    return res.json();
}

async function gasPost(body) {
    const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(body),
        redirect: 'follow'
    });
    return res.json();
}

// ── Load ───────────────────────────────────────────
async function loadData() {
    setLoading(true);
    showToast('Loading data…', 'info');
    try {
        const json = await gasGet();
        if (json.success) {
            state.data.investments = json.investments || [];
            state.data.cashInflows = json.cashInflows || [];
            updateLocationFilterOptions();
            renderAll();
            showToast('Data loaded ✓', 'success');
        } else {
            showToast('Error: ' + json.error, 'error');
        }
    } catch (e) {
        showToast('Failed to reach backend: ' + e.message, 'error');
    }
    setLoading(false);
}

// ── Add Investment ─────────────────────────────────
async function addInvestment(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('inv-date').value,
        location: document.getElementById('inv-location').value.trim(),
        category: document.getElementById('inv-category').value,
        amount: parseFloat(document.getElementById('inv-amount').value),
        notes: document.getElementById('inv-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.category || isNaN(rec.amount) || rec.amount <= 0) {
        showToast('Fill all required fields', 'error'); return;
    }
    setLoading(true);
    showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_investment', ...rec });
        if (res.success) {
            state.data.investments.push(rec);
            showToast('Investment recorded ✓', 'success');
            e.target.reset();
            document.getElementById('inv-date').value = today();
            flashSaveIndicator();
            updateLocationFilterOptions();
            renderAll();
        } else {
            showToast('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showToast('Save failed: ' + err.message, 'error');
    }
    setLoading(false);
}

// ── Add Cash Inflow ────────────────────────────────
async function addCashInflow(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('ci-date').value,
        location: document.getElementById('ci-location').value.trim(),
        category: document.getElementById('ci-category').value,
        amount: parseFloat(document.getElementById('ci-amount').value),
        notes: document.getElementById('ci-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.category || isNaN(rec.amount) || rec.amount <= 0) {
        showToast('Fill all required fields', 'error'); return;
    }
    setLoading(true);
    showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_cashinflow', ...rec });
        if (res.success) {
            state.data.cashInflows.push(rec);
            showToast('Cash inflow recorded ✓', 'success');
            e.target.reset();
            document.getElementById('ci-date').value = today();
            flashSaveIndicator();
            updateLocationFilterOptions();
            renderAll();
        } else {
            showToast('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showToast('Save failed: ' + err.message, 'error');
    }
    setLoading(false);
}

// ── Delete ─────────────────────────────────────────
async function deleteRecord(type, id) {
    if (!confirm('Delete this record?')) return;
    setLoading(true);
    try {
        const res = await gasPost({ action: 'delete', type, id });
        if (res.success) {
            if (type === 'investment') {
                state.data.investments = state.data.investments.filter(r => r.id !== id);
            } else {
                state.data.cashInflows = state.data.cashInflows.filter(r => r.id !== id);
            }
            updateLocationFilterOptions();
            renderAll();
            showToast('Record deleted', 'info');
        } else {
            showToast('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
    }
    setLoading(false);
}

// ── Render ─────────────────────────────────────────
function renderAll() {
    renderDashboard();
    renderHistory();
    renderChart();
}

function totalOf(arr) {
    return arr.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
}

function getFilteredData() {
    const locFilter = document.getElementById('globalLocationFilter')?.value || 'all';
    let invs = state.data.investments;
    let cis = state.data.cashInflows;
    if (locFilter !== 'all') {
        invs = invs.filter(r => r.location === locFilter);
        cis = cis.filter(r => r.location === locFilter);
    }
    return { investments: invs, cashInflows: cis };
}

function renderDashboard() {
    const { investments, cashInflows } = getFilteredData();
    const totalInv = totalOf(investments);
    const totalCi = totalOf(cashInflows);
    const net = totalCi - totalInv;
    const roi = totalInv > 0 ? ((net / totalInv) * 100).toFixed(1) : '—';

    document.getElementById('stat-invested').textContent = fmt(totalInv);
    document.getElementById('stat-cashout').textContent = fmt(totalCi);
    document.getElementById('stat-net').textContent = (net >= 0 ? '+' : '-') + fmt(net);
    document.getElementById('stat-roi').textContent = roi !== '—' ? roi + '%' : '—';

    document.getElementById('stat-net').className = 'stat-value ' + (net >= 0 ? 'green' : 'red');
    document.getElementById('stat-roi').className = 'stat-value ' + (net >= 0 ? 'green' : 'red');

    document.getElementById('stat-inv-count').textContent = investments.length + ' records';
    document.getElementById('stat-co-count').textContent = cashInflows.length + ' records';
}

function renderHistory() {
    const query = (document.getElementById('histSearch')?.value || '').toLowerCase();
    const filter = document.getElementById('histFilter')?.value || 'all';
    const tbody = document.getElementById('histBody');
    if (!tbody) return;

    const { investments, cashInflows } = getFilteredData();

    let rows = [];
    if (filter !== 'cashinflows') investments.forEach(r => rows.push({ ...r, _type: 'investment' }));
    if (filter !== 'investments') cashInflows.forEach(r => rows.push({ ...r, _type: 'cashinflow' }));

    rows.sort((a, b) => b.date.localeCompare(a.date));

    if (query) {
        rows = rows.filter(r =>
            r.category.toLowerCase().includes(query) ||
            (r.notes || '').toLowerCase().includes(query) ||
            r.date.includes(query)
        );
    }

    if (rows.length === 0) {
        tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>No records yet. Connect your Google Sheet and start adding entries.</p>
        </div>
      </td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.date}</td>
      <td style="font-weight:600;">${r.location || '—'}</td>
      <td><span class="badge ${r._type === 'investment' ? 'badge-invest' : 'badge-cashout'}">
        ${r._type === 'investment' ? '📉 Investment' : '💵 Cash Inflow'}
      </span></td>
      <td><span class="badge badge-type">${r.category}</span></td>
      <td class="${r._type === 'investment' ? 'amount-invest' : 'amount-cashout'}">
        ${r._type === 'investment' ? '-' : '+'}${fmt(r.amount)}
      </td>
      <td style="color:var(--text-secondary);font-size:12px;">${r.notes || '—'}</td>
      <td>
        <button class="delete-btn" onclick="deleteRecord('${r._type}','${r.id}')" title="Delete">🗑</button>
      </td>
    </tr>
  `).join('');
}

function renderChart() {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;

    const { investments, cashInflows } = getFilteredData();

    const monthMap = {};
    [
        ...investments.map(r => ({ ...r, _type: 'investment' })),
        ...cashInflows.map(r => ({ ...r, _type: 'cashinflow' })),
    ].forEach(r => {
        const m = (r.date || '').slice(0, 7);
        if (!m) return;
        if (!monthMap[m]) monthMap[m] = { inv: 0, ci: 0 };
        if (r._type === 'investment') monthMap[m].inv += parseFloat(r.amount) || 0;
        else monthMap[m].ci += parseFloat(r.amount) || 0;
    });

    const months = Object.keys(monthMap).sort();
    const labels = months.map(m => {
        const [y, mo] = m.split('-');
        return new Date(+y, +mo - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
    });

    if (state.chart) state.chart.destroy();
    state.chart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [
                {
                    label: 'Investments',
                    data: months.length ? months.map(m => monthMap[m].inv) : [0],
                    backgroundColor: 'rgba(255,82,82,0.5)',
                    borderColor: 'rgba(255,82,82,0.9)',
                    borderWidth: 2, borderRadius: 6,
                },
                {
                    label: 'Cash Inflows',
                    data: months.length ? months.map(m => monthMap[m].ci) : [0],
                    backgroundColor: 'rgba(0,230,118,0.5)',
                    borderColor: 'rgba(0,230,118,0.9)',
                    borderWidth: 2, borderRadius: 6,
                },
            ],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#8892a4', font: { family: 'Inter', size: 12 } } },
                tooltip: { callbacks: { label: ctx => ' ' + fmt(ctx.raw) } },
            },
            scales: {
                x: { ticks: { color: '#8892a4', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: {
                    ticks: {
                        color: '#8892a4', font: { family: 'Inter', size: 11 },
                        callback: v => v >= 1e6 ? 'TZS ' + (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? 'TZS ' + (v / 1e3).toFixed(0) + 'K' : 'TZS ' + v,
                    },
                    grid: { color: 'rgba(255,255,255,0.06)' },
                },
            },
        },
    });
}

// ── Tab Navigation ─────────────────────────────────
function switchTab(id) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === id));
    if (id === 'history') renderHistory();
    if (id === 'dashboard') renderChart();
}

// ── Init ───────────────────────────────────────────
function updateLocationFilterOptions() {
    const locSet = new Set();
    state.data.investments.forEach(r => { if (r.location) locSet.add(r.location); });
    state.data.cashInflows.forEach(r => { if (r.location) locSet.add(r.location); });

    const select = document.getElementById('globalLocationFilter');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="all">🌍 All Locations</option>';

    Array.from(locSet).sort().forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        opt.textContent = '📍 ' + loc;
        select.appendChild(opt);
    });

    if (locSet.has(currentVal)) {
        select.value = currentVal;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('inv-date').value = today();
    document.getElementById('ci-date').value = today();

    // Load data deferred after unlock if needed, but keeping it here for now
    // Or we could wait for unlock. Let's just load it.
    loadData();

    document.getElementById('globalLocationFilter').addEventListener('change', renderAll);
    document.getElementById('inv-form').addEventListener('submit', addInvestment);
    document.getElementById('ci-form').addEventListener('submit', addCashInflow);
    document.getElementById('histSearch').addEventListener('input', renderHistory);
    document.getElementById('histFilter').addEventListener('change', renderHistory);
    document.getElementById('refreshBtn').addEventListener('click', loadData);


    // ── Lock Screen Logic ──────────────────────────────
    let currentPin = '';
    const correctPin = '1234';

    function updatePinDisplay() {
        const dots = document.querySelectorAll('#pinDisplay .pin-dot');
        dots.forEach((dot, index) => {
            if (index < currentPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled', 'error');
            }
        });
    }

    window.enterPin = function (num) {
        const errEl = document.getElementById('pinError');
        if (errEl) errEl.textContent = '';

        if (currentPin.length < 4) {
            currentPin += num;
            updatePinDisplay();
        }
    }

    window.clearPin = function () {
        currentPin = '';
        const errEl = document.getElementById('pinError');
        if (errEl) errEl.textContent = '';
        updatePinDisplay();
    }

    window.submitPin = function () {
        if (currentPin.length !== 4) return;

        if (currentPin === correctPin) {
            // success
            document.getElementById('lockScreen').classList.add('hidden');
            showToast('Access Granted ✓', 'success');

            // Load data only after unlock to save unnecessary background requests
            // loadData(); // If we prefer, we could defer loadData until here.
        } else {
            // fail
            const dots = document.querySelectorAll('#pinDisplay .pin-dot');
            dots.forEach(dot => dot.classList.add('error'));
            const errEl = document.getElementById('pinError');
            if (errEl) errEl.textContent = 'Incorrect PIN. Try again.';

            setTimeout(() => {
                currentPin = '';
                updatePinDisplay();
            }, 500);
        }
    }
});

// ── Privacy Mode Logic ──────────────────────────────
window.togglePrivacy = function () {
    const isPrivacy = document.body.classList.toggle('privacy-enabled');
    const btn = document.getElementById('privacyBtn');
    if (btn) {
        btn.textContent = isPrivacy ? '🕶️' : '👁️';
    }
};
