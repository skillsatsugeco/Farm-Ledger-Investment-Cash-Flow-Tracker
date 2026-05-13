// ══════════════════════════════════════════════════
//  freshBABA FARMS — Frontend Script
//  Backend: Google Apps Script Web App
// ══════════════════════════════════════════════════

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyZXruOGI9pcIg-sbzv-LJxuYfMZj3PIqbDsrsMcCbifxL-7RZbfak7dPCfkYh2gn8HBw/exec';

let state = {
    data: {
        investments: [], cashInflows: [], scouting: [], assets: [], todos: [],
        nursery: [], transplanting: [], fertilizer: [], agrochem: [],
        weeding: [], monitoring: [], harvest: [],
    },
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
            state.data.scouting = json.scouting || [];
            state.data.assets = json.assets || [];
            state.data.todos = json.todos || [];
            // Production
            state.data.nursery = json.nursery || [];
            state.data.transplanting = json.transplanting || [];
            state.data.fertilizer = json.fertilizer || [];
            state.data.agrochem = json.agrochem || [];
            state.data.weeding = json.weeding || [];
            state.data.monitoring = json.monitoring || [];
            state.data.harvest = json.harvest || [];
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

// ── Add Investment / Expense ────────────────────────
async function addInvestment(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('inv-date').value,
        location: document.getElementById('inv-location').value.trim(),
        category: document.getElementById('inv-category').value,
        paymentType: document.getElementById('inv-payment-type').value,
        amount: parseFloat(document.getElementById('inv-amount').value),
        notes: document.getElementById('inv-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.category || !rec.paymentType || isNaN(rec.amount) || rec.amount <= 0) {
        showToast('Fill all required fields', 'error'); return;
    }
    setLoading(true);
    showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_investment', ...rec });
        if (res.success) {
            state.data.investments.push(rec);
            showToast('Expense recorded ✓', 'success');
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

// ── Add Cash Inflow / Income ───────────────────────
async function addCashInflow(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('ci-date').value,
        location: document.getElementById('ci-location').value.trim(),
        category: document.getElementById('ci-category').value,
        saleType: document.getElementById('ci-sale-type').value,
        amount: parseFloat(document.getElementById('ci-amount').value),
        notes: document.getElementById('ci-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.category || !rec.saleType || isNaN(rec.amount) || rec.amount <= 0) {
        showToast('Fill all required fields', 'error'); return;
    }
    setLoading(true);
    showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_cashinflow', ...rec });
        if (res.success) {
            state.data.cashInflows.push(rec);
            showToast('Income recorded ✓', 'success');
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

// ── Add Asset ──────────────────────────────────────
let assetPhotoBase64 = null;
let assetPhotoMimeType = null;

async function addAsset(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('asset-date').value,
        location: document.getElementById('asset-location').value.trim(),
        name: document.getElementById('asset-name').value.trim(),
        category: document.getElementById('asset-category').value,
        value: parseFloat(document.getElementById('asset-value').value),
        condition: document.getElementById('asset-condition').value,
        notes: document.getElementById('asset-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.name || !rec.category || isNaN(rec.value) || rec.value <= 0) {
        showToast('Fill all required fields', 'error'); return;
    }

    if (assetPhotoBase64) {
        rec.photoBase64 = assetPhotoBase64;
        rec.photoMimeType = assetPhotoMimeType;
    }

    setLoading(true);
    showToast('Saving asset…', 'info');
    try {
        const res = await gasPost({ action: 'add_asset', ...rec });
        if (res.success) {
            rec.photoUrl = res.photoUrl || '';
            state.data.assets.push(rec);
            showToast('Asset recorded ✓', 'success');
            e.target.reset();
            document.getElementById('asset-date').value = today();
            clearAssetPhoto();
            flashSaveIndicator();
            renderAssets();
            renderDashboard();
        } else {
            showToast('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showToast('Save failed: ' + err.message, 'error');
    }
    setLoading(false);
}

window.clearAssetPhoto = function () {
    assetPhotoBase64 = null;
    assetPhotoMimeType = null;
    document.getElementById('asset-photo').value = '';
    document.getElementById('assetPhotoPreviewWrap').style.display = 'none';
    document.getElementById('assetPhotoPlaceholder').style.display = 'flex';
    document.getElementById('asset-photo-preview').src = '';
};

// ── Delete ─────────────────────────────────────────
async function deleteRecord(type, id) {
    if (!confirm('Delete this record?')) return;
    setLoading(true);
    try {
        const res = await gasPost({ action: 'delete', type, id });
        if (res.success) {
            if (type === 'investment') {
                state.data.investments = state.data.investments.filter(r => r.id !== id);
            } else if (type === 'cashinflow') {
                state.data.cashInflows = state.data.cashInflows.filter(r => r.id !== id);
            } else if (type === 'asset') {
                state.data.assets = state.data.assets.filter(r => r.id !== id);
            } else if (type === 'todo') {
                state.data.todos = state.data.todos.filter(r => r.id !== id);
                renderTodos();
            } else {
                state.data.scouting = state.data.scouting.filter(r => r.id !== id);
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
    renderScoutingLogs();
    renderAssets();
    renderTodos();
    renderProduction();
}

function totalOf(arr, field = 'amount') {
    return arr.reduce((s, r) => s + (parseFloat(r[field]) || 0), 0);
}

function getFilteredData() {
    const locFilter = document.getElementById('globalLocationFilter')?.value || 'all';
    let invs = state.data.investments;
    let cis = state.data.cashInflows;
    let assets = state.data.assets;
    if (locFilter !== 'all') {
        invs = invs.filter(r => r.location === locFilter);
        cis = cis.filter(r => r.location === locFilter);
        assets = assets.filter(r => r.location === locFilter);
    }
    return { investments: invs, cashInflows: cis, assets };
}

function renderDashboard() {
    const { investments, cashInflows, assets } = getFilteredData();
    const totalInv = totalOf(investments);
    const totalCi = totalOf(cashInflows);
    const totalAssets = totalOf(assets, 'value');
    const net = totalCi - totalInv;
    const roi = totalInv > 0 ? ((net / totalInv) * 100).toFixed(1) : '—';

    document.getElementById('stat-invested').textContent = fmt(totalInv);
    document.getElementById('stat-cashout').textContent = fmt(totalCi);
    document.getElementById('stat-assets').textContent = fmt(totalAssets);
    document.getElementById('stat-net').textContent = (net >= 0 ? '+' : '-') + fmt(net);
    document.getElementById('stat-roi').textContent = roi !== '—' ? roi + '%' : '—';

    document.getElementById('stat-net').className = 'stat-value ' + (net >= 0 ? 'green' : 'red');
    document.getElementById('stat-roi').className = 'stat-value ' + (net >= 0 ? 'green' : 'red');

    document.getElementById('stat-inv-count').textContent = investments.length + ' records';
    document.getElementById('stat-co-count').textContent = cashInflows.length + ' records';
    document.getElementById('stat-assets-count').textContent = assets.length + ' assets';
}

function renderHistory() {
    const query = (document.getElementById('histSearch')?.value || '').toLowerCase();
    const filter = document.getElementById('histFilter')?.value || 'all';
    const tbody = document.getElementById('histBody');
    if (!tbody) return;

    const { investments, cashInflows, assets } = getFilteredData();

    let rows = [];
    if (filter !== 'cashinflows' && filter !== 'assets') {
        investments.forEach(r => rows.push({ ...r, _type: 'investment' }));
    }
    if (filter !== 'investments' && filter !== 'assets') {
        cashInflows.forEach(r => rows.push({ ...r, _type: 'cashinflow' }));
    }
    if (filter === 'assets' || filter === 'all') {
        assets.forEach(r => rows.push({
            ...r,
            amount: r.value,
            category: r.name + (r.category ? ' (' + r.category + ')' : ''),
            notes: [r.condition ? 'Condition: ' + r.condition : '', r.notes || ''].filter(Boolean).join(' | '),
            _type: 'asset'
        }));
    }

    rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (query) {
        rows = rows.filter(r =>
            (r.category || '').toLowerCase().includes(query) ||
            (r.notes || '').toLowerCase().includes(query) ||
            (r.date || '').includes(query) ||
            (r.name || '').toLowerCase().includes(query)
        );
    }

    if (rows.length === 0) {
        tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>No records yet. Start adding entries using the tabs above.</p>
        </div>
      </td></tr>`;
        return;
    }

    const paymentBadge = (r) => {
        if (r._type === 'investment') {
            const pt = r.paymentType || '—';
            const cls = pt === 'Credit' ? 'badge-credit' : 'badge-cash';
            const icon = pt === 'Credit' ? '💳' : '💵';
            return `<span class="badge ${cls}">${icon} ${pt}</span>`;
        }
        if (r._type === 'cashinflow') {
            const st = r.saleType || '—';
            const cls = st === 'Credit Sale' ? 'badge-credit' : 'badge-cash';
            return `<span class="badge ${cls}">${st}</span>`;
        }
        return '<span class="badge badge-type">Asset</span>';
    };

    tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.date || '—'}</td>
      <td style="font-weight:600;">${r.location || '—'}</td>
      <td><span class="badge ${r._type === 'investment' ? 'badge-invest' : r._type === 'asset' ? 'badge-asset' : 'badge-cashout'}">
        ${r._type === 'investment' ? '📉 Expense' : r._type === 'asset' ? '🏦 Asset' : '💵 Income'}
      </span></td>
      <td>${paymentBadge(r)}</td>
      <td><span class="badge badge-type">${r.category || '—'}</span></td>
      <td class="${r._type === 'investment' ? 'amount-invest' : r._type === 'asset' ? 'amount-asset' : 'amount-cashout'}">
        ${r._type === 'investment' ? '-' : r._type === 'asset' ? '' : '+'}${fmt(r.amount || 0)}
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
        type: 'line',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [
                {
                    label: 'Expenses',
                    data: months.length ? months.map(m => monthMap[m].inv) : [0],
                    borderColor: 'rgba(255,82,82,0.9)',
                    backgroundColor: 'rgba(255,82,82,0.08)',
                    borderWidth: 2.5,
                    pointBackgroundColor: 'rgba(255,82,82,0.9)',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.4,
                    fill: true,
                },
                {
                    label: 'Income',
                    data: months.length ? months.map(m => monthMap[m].ci) : [0],
                    borderColor: 'rgba(0,230,118,0.9)',
                    backgroundColor: 'rgba(0,230,118,0.08)',
                    borderWidth: 2.5,
                    pointBackgroundColor: 'rgba(0,230,118,0.9)',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.4,
                    fill: true,
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

// ── Assets Rendering ───────────────────────────────
function renderAssets() {
    const container = document.getElementById('assets-list-container');
    if (!container) return;

    let assets = state.data.assets;
    const locFilter = document.getElementById('globalLocationFilter')?.value || 'all';
    if (locFilter !== 'all') {
        assets = assets.filter(r => r.location === locFilter);
    }
    assets = [...assets].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (assets.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🏦</div>
            <p>No assets recorded yet. Add your first farm asset above.</p>
          </div>`;
        return;
    }

    const conditionColors = { New: '#00e676', Good: '#448aff', Fair: '#ffd740', Poor: '#ff5252' };

    container.innerHTML = `<div class="assets-grid">` + assets.map(a => {
        const condColor = conditionColors[a.condition] || '#8892a4';
        return `
        <div class="asset-card">
          ${a.photoUrl ? `<div class="asset-card-photo"><a href="${a.photoUrl}" target="_blank"><img src="${a.photoUrl}" alt="${a.name}" /></a></div>` : `<div class="asset-card-photo-placeholder">📷</div>`}
          <div class="asset-card-body">
            <div class="asset-card-title">${a.name || '—'}</div>
            <div class="asset-card-meta">
              <span class="badge badge-type">${a.category || '—'}</span>
              <span class="badge" style="background:rgba(0,0,0,0.2);color:${condColor};border:1px solid ${condColor}40;">${a.condition || '—'}</span>
            </div>
            <div class="asset-card-value">${fmt(parseFloat(a.value) || 0)}</div>
            <div class="asset-card-footer">
              <span>📍 ${a.location || '—'}</span>
              <span>📅 ${a.date || '—'}</span>
            </div>
            ${a.notes ? `<div class="asset-card-notes">${a.notes}</div>` : ''}
            <div style="margin-top:10px;">
              <button class="delete-btn" onclick="deleteRecord('asset','${a.id}')" title="Delete">🗑 Delete</button>
            </div>
          </div>
        </div>`;
    }).join('') + `</div>`;
}

// ── Tab Navigation ─────────────────────────────────
function switchTab(id) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === id));
    if (id === 'history') renderHistory();
    if (id === 'dashboard') renderChart();
    if (id === 'scouting') renderScoutingLogs();
    if (id === 'assets') renderAssets();
    if (id === 'todos') renderTodos();
    if (id === 'production') renderProduction();
}

// ── Production Sub-Tab Navigation ─────────────────────────────────
function switchProdTab(id) {
    document.querySelectorAll('.prod-subtab').forEach(t => t.classList.toggle('active', t.dataset.subtab === id));
    document.querySelectorAll('.prod-subcontent').forEach(c => c.classList.toggle('active', c.id === id));
    if (id === 'prod-dashboard') renderProdDashboard();
    if (id === 'prod-nursery') renderNursery();
    if (id === 'prod-transplant') renderTransplant();
    if (id === 'prod-fertilizer') renderFertilizer();
    if (id === 'prod-agrochem') renderAgrochem();
    if (id === 'prod-weeding') renderWeeding();
    if (id === 'prod-monitoring') renderMonitoring();
    if (id === 'prod-harvest') renderHarvest();
}
// Expose globally for inline onclick
window.switchProdTab = switchProdTab;

// ── Init ───────────────────────────────────────────
function updateLocationFilterOptions() {
    const locSet = new Set();
    state.data.investments.forEach(r => { if (r.location) locSet.add(r.location); });
    state.data.cashInflows.forEach(r => { if (r.location) locSet.add(r.location); });
    state.data.assets.forEach(r => { if (r.location) locSet.add(r.location); });

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

// ── Farm To-Do Logic ──────────────────────────────────
async function addTodo(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        task: document.getElementById('todo-task').value.trim(),
        goal: document.getElementById('todo-goal').value.trim(),
        urgency: document.getElementById('todo-urgency').value,
        location: document.getElementById('todo-location').value.trim(),
        dueDate: document.getElementById('todo-due').value,
        postponeTo: document.getElementById('todo-postpone').value,
        notes: document.getElementById('todo-notes').value.trim(),
        status: 'Pending',
        createdDate: today(),
    };
    if (!rec.task || !rec.urgency || !rec.dueDate) {
        showToast('Fill Task, Urgency and Due Date', 'error'); return;
    }
    setLoading(true);
    showToast('Saving task…', 'info');
    try {
        const res = await gasPost({ action: 'add_todo', ...rec });
        if (res.success) {
            state.data.todos.unshift(rec);
            showToast('Task added ✓', 'success');
            e.target.reset();
            renderTodos();
        } else {
            showToast('Error: ' + res.error, 'error');
        }
    } catch (err) {
        showToast('Save failed: ' + err.message, 'error');
    }
    setLoading(false);
}

window.toggleTodoStatus = async function (id) {
    const todo = state.data.todos.find(t => t.id === id);
    if (!todo) return;
    const next = todo.status === 'Done' ? 'Pending' : 'Done';
    try {
        const res = await gasPost({ action: 'update_todo_status', id, status: next });
        if (res.success) {
            todo.status = next;
            renderTodos();
        } else { showToast('Update failed: ' + res.error, 'error'); }
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
};

window.postponeTodo = async function (id) {
    const todo = state.data.todos.find(t => t.id === id);
    if (!todo) return;
    const newDate = prompt('Enter new date to postpone to (YYYY-MM-DD):', todo.postponeTo || todo.dueDate);
    if (!newDate) return;
    try {
        const res = await gasPost({ action: 'update_todo_status', id, status: 'Postponed', postponeTo: newDate });
        if (res.success) {
            todo.status = 'Postponed';
            todo.postponeTo = newDate;
            renderTodos();
            showToast('Task postponed to ' + newDate, 'info');
        } else { showToast('Update failed: ' + res.error, 'error'); }
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
};

function renderTodos() {
    const container = document.getElementById('todo-list-container');
    if (!container) return;

    const urgencyFilter = document.getElementById('todo-filter-urgency')?.value || 'all';
    const statusFilter = document.getElementById('todo-filter-status')?.value || 'all';
    const searchQ = (document.getElementById('todo-search')?.value || '').toLowerCase();

    let todos = [...state.data.todos];
    if (urgencyFilter !== 'all') todos = todos.filter(t => t.urgency === urgencyFilter);
    if (statusFilter !== 'all') todos = todos.filter(t => t.status === statusFilter);
    if (searchQ) todos = todos.filter(t =>
        t.task.toLowerCase().includes(searchQ) ||
        (t.goal || '').toLowerCase().includes(searchQ) ||
        (t.notes || '').toLowerCase().includes(searchQ)
    );

    // Sort: High urgency first, then by dueDate
    const urgOrd = { High: 0, Medium: 1, Low: 2 };
    todos.sort((a, b) => {
        const ud = (urgOrd[a.urgency] ?? 1) - (urgOrd[b.urgency] ?? 1);
        if (ud !== 0) return ud;
        return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    if (todos.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <p>No tasks match your filters.</p>
          </div>`;
        return;
    }

    const urgencyConfig = {
        High: { icon: '🔴', cls: 'urgency-high', label: 'HIGH' },
        Medium: { icon: '🟡', cls: 'urgency-medium', label: 'MEDIUM' },
        Low: { icon: '🟢', cls: 'urgency-low', label: 'LOW' },
    };
    const statusConfig = {
        Pending: { icon: '⏳', cls: 'status-pending' },
        Done: { icon: '✅', cls: 'status-done' },
        Postponed: { icon: '📅', cls: 'status-postponed' },
    };

    container.innerHTML = todos.map(t => {
        const urg = urgencyConfig[t.urgency] || urgencyConfig.Medium;
        const sta = statusConfig[t.status] || statusConfig.Pending;
        const isDone = t.status === 'Done';
        const effectiveDate = t.status === 'Postponed' && t.postponeTo ? t.postponeTo : t.dueDate;
        const isOverdue = !isDone && effectiveDate && effectiveDate < today();

        return `
        <div class="todo-card ${isDone ? 'todo-done' : ''} ${isOverdue ? 'todo-overdue' : ''}">
          <div class="todo-top">
            <div class="todo-urgency-badge ${urg.cls}">${urg.icon} ${urg.label}</div>
            <div class="todo-status-badge ${sta.cls}">${sta.icon} ${t.status}</div>
            <div class="todo-actions">
              <button class="todo-btn todo-btn-done" onclick="toggleTodoStatus('${t.id}')" title="${isDone ? 'Mark Pending' : 'Mark Done'}">
                ${isDone ? '↺ Undo' : '✔ Done'}
              </button>
              <button class="todo-btn todo-btn-postpone" onclick="postponeTodo('${t.id}')" title="Postpone">
                📅 Postpone
              </button>
              <button class="delete-btn" onclick="deleteRecord('todo','${t.id}')" title="Delete">🗑</button>
            </div>
          </div>
          <div class="todo-task ${isDone ? 'todo-task-strikethrough' : ''}">${t.task}</div>
          ${t.goal ? `<div class="todo-goal">🎯 <em>${t.goal}</em></div>` : ''}
          <div class="todo-meta">
            ${t.location ? `<span>📍 ${t.location}</span>` : ''}
            <span class="${isOverdue ? 'todo-overdue-text' : ''}">📅 Due: ${effectiveDate || '—'}</span>
            ${t.status === 'Postponed' && t.postponeTo ? `<span>⏭ Postponed to: ${t.postponeTo}</span>` : ''}
            ${t.notes ? `<span>📝 ${t.notes}</span>` : ''}
          </div>
        </div>`;
    }).join('');
}

// ── Scouting Logic ─────────────────────────────────
let audioRecorder = null;
let audioChunks = [];
let audioBlob = null;

async function setupScouting() {
    document.getElementById('scout-date').value = today();

    const photoInput = document.getElementById('scout-photo');
    const photoPreview = document.getElementById('scout-photo-preview');

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                photoPreview.src = ev.target.result;
                photoPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            photoPreview.style.display = 'none';
        }
    });

    const recordBtn = document.getElementById('recordBtn');
    const audioPreview = document.getElementById('scout-audio-preview');

    recordBtn.addEventListener('click', async () => {
        if (!audioRecorder || audioRecorder.state === 'inactive') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioRecorder = new MediaRecorder(stream);
                audioChunks = [];

                audioRecorder.ondataavailable = e => {
                    if (e.data.size > 0) audioChunks.push(e.data);
                };

                audioRecorder.onstop = () => {
                    audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    audioPreview.src = URL.createObjectURL(audioBlob);
                    audioPreview.style.display = 'block';
                    stream.getTracks().forEach(t => t.stop());
                };

                audioRecorder.start();
                recordBtn.classList.add('recording');
                recordBtn.textContent = '⏹ Stop Recording';
            } catch (err) {
                showToast('Mic access denied or error', 'error');
            }
        } else if (audioRecorder.state === 'recording') {
            audioRecorder.stop();
            recordBtn.classList.remove('recording');
            recordBtn.textContent = '🎤 Start Recording';
        }
    });

    document.getElementById('scout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const rec = {
            id: uuid(),
            date: document.getElementById('scout-date').value,
            location: document.getElementById('scout-location').value.trim(),
            observation: document.getElementById('scout-observation').value.trim(),
        };

        if (!rec.date || !rec.location || !rec.observation) {
            showToast('Fill all required fields', 'error'); return;
        }

        // Base64 encode photo if it exists
        const file = photoInput.files[0];
        if (file) {
            rec.photoBase64 = photoPreview.src;
            rec.photoMimeType = file.type;
        }

        // Base64 encode audio if it exists
        if (audioBlob) {
            rec.audioBase64 = await new Promise((req) => {
                const reader = new FileReader();
                reader.onload = () => req(reader.result);
                reader.readAsDataURL(audioBlob);
            });
            rec.audioMimeType = 'audio/webm';
        }

        setLoading(true);
        showToast('Saving log (may take time for media)...', 'info');
        try {
            const res = await gasPost({ action: 'add_scouting', ...rec });
            if (res.success) {
                rec.photoUrl = res.photoUrl || '';
                rec.audioUrl = res.audioUrl || '';
                state.data.scouting.unshift(rec);
                showToast('Log recorded ✓', 'success');
                e.target.reset();
                document.getElementById('scout-date').value = today();
                window.clearScoutMedia();
                renderScoutingLogs();
            } else {
                showToast('Error: ' + res.error, 'error');
            }
        } catch (err) {
            showToast('Save failed: ' + err.message, 'error');
        }
        setLoading(false);
    });
}

window.clearScoutMedia = function () {
    document.getElementById('scout-photo-preview').style.display = 'none';
    document.getElementById('scout-photo-preview').src = '';
    document.getElementById('scout-audio-preview').style.display = 'none';
    document.getElementById('scout-audio-preview').src = '';
    audioBlob = null;
    audioChunks = [];
};

function renderScoutingLogs() {
    const container = document.getElementById('scout-logs-container');
    if (!container) return;

    let logs = state.data.scouting;
    const locFilter = document.getElementById('globalLocationFilter')?.value || 'all';
    if (locFilter !== 'all') {
        logs = logs.filter(r => r.location === locFilter);
    }

    logs = [...logs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (logs.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p>No scouting logs found.</p>
          </div>
        `;
        return;
    }

    container.innerHTML = logs.map(log => {
        // Safely extract observation text — handle old/new field names
        const obsText = log.observation || log.Observation || log.observations || '(No observation text recorded)';
        const dateText = log.date || '—';
        const locText = log.location || '—';

        const hasPhoto = log.photoUrl && log.photoUrl.trim() !== '';
        const hasAudio = log.audioUrl && log.audioUrl.trim() !== '';

        return `
        <div class="scout-card">
            <div class="scout-header">
                <div><strong>📅 ${dateText}</strong> &bull; 📍 ${locText}</div>
                <button class="delete-btn" onclick="deleteRecord('scouting', '${log.id}')" title="Delete">🗑</button>
            </div>
            <div class="scout-body">${obsText}</div>
            <div class="scout-media-indicators">
              ${hasPhoto ? `<span class="media-badge photo-badge">📷 Photo attached</span>` : ''}
              ${hasAudio ? `<span class="media-badge audio-badge">🎤 Voice note attached</span>` : ''}
            </div>
            <div class="scout-media">
                ${hasPhoto ? `<a href="${log.photoUrl}" target="_blank"><img src="${log.photoUrl}" class="scout-img" /></a>` : ''}
                ${hasAudio ? `<audio src="${log.audioUrl}" controls class="scout-audio"></audio>` : ''}
            </div>
        </div>
    `;
    }).join('');
}



// ══════════════════════════════════════════════════
//  PRODUCTION ACTIVITY TRACKING MODULE
// ══════════════════════════════════════════════════

// ── Status pill helper ──────────────────────────────
function prodStatusPill(status) {
    const cfg = {
        'Planned': { cls: 'prod-status-planned', icon: '📋' },
        'Scheduled': { cls: 'prod-status-scheduled', icon: '📅' },
        'In Progress': { cls: 'prod-status-inprogress', icon: '⚙️' },
        'Completed': { cls: 'prod-status-completed', icon: '✅' },
        'Delayed': { cls: 'prod-status-delayed', icon: '⏰' },
        'Cancelled': { cls: 'prod-status-cancelled', icon: '❌' },
    };
    const c = cfg[status] || cfg['Planned'];
    return `<span class="prod-status-pill ${c.cls}">${c.icon} ${status}</span>`;
}

// ── Quick field row template ────────────────────────
function prodFieldRow(label, value) {
    if (!value || value === '—' || value.trim() === '') return '';
    return `<div class="prod-detail-row"><span class="prod-detail-label">${label}</span><span class="prod-detail-value">${value}</span></div>`;
}

// ── renderProduction — calls all sub-renders ────────
function renderProduction() {
    renderProdDashboard();
    renderNursery();
    renderTransplant();
    renderFertilizer();
    renderAgrochem();
    renderWeeding();
    renderMonitoring();
    renderHarvest();
}

// ── Production Dashboard ────────────────────────────
function renderProdDashboard() {
    document.getElementById('pd-nursery-count').textContent = state.data.nursery.length;
    document.getElementById('pd-transplant-count').textContent = state.data.transplanting.length;
    document.getElementById('pd-fertilizer-count').textContent = state.data.fertilizer.length;
    document.getElementById('pd-agrochem-count').textContent = state.data.agrochem.length;
    document.getElementById('pd-weeding-count').textContent = state.data.weeding.length;
    document.getElementById('pd-monitoring-count').textContent = state.data.monitoring.length;
    document.getElementById('pd-harvest-count').textContent = state.data.harvest.length;

    const delayed = [
        ...state.data.nursery, ...state.data.transplanting,
        ...state.data.fertilizer, ...state.data.agrochem,
        ...state.data.weeding, ...state.data.monitoring, ...state.data.harvest
    ].filter(r => r.status === 'Delayed' || r.status === 'In Progress' || r.status === 'Planned' || r.status === 'Scheduled').length;
    document.getElementById('pd-delayed-count').textContent = delayed;

    // Build upcoming list
    const filter = document.getElementById('prod-upcoming-filter')?.value || 'all';
    let upcoming = [];
    const add = (arr, type, icon, dateField) => arr.forEach(r => {
        if (!['Completed', 'Cancelled'].includes(r.status)) {
            upcoming.push({ ...r, _type: type, _icon: icon, _date: r[dateField] || r.date || '' });
        }
    });
    if (filter === 'all' || filter === 'nursery') add(state.data.nursery, 'nursery', '🌿', 'date');
    if (filter === 'all' || filter === 'transplanting') add(state.data.transplanting, 'transplant', '🪴', 'date');
    if (filter === 'all' || filter === 'fertilizer') add(state.data.fertilizer, 'fertilizer', '🧪', 'date');
    if (filter === 'all' || filter === 'agrochem') add(state.data.agrochem, 'agrochem', '🧬', 'date');
    if (filter === 'all' || filter === 'weeding') add(state.data.weeding, 'weeding', '🌾', 'date');
    if (filter === 'all' || filter === 'monitoring') add(state.data.monitoring, 'monitoring', '👁', 'date');
    if (filter === 'all' || filter === 'harvest') add(state.data.harvest, 'harvest', '🚜', 'harvestDate');

    upcoming.sort((a, b) => (b._date || '').localeCompare(a._date || ''));

    const container = document.getElementById('prod-upcoming-list');
    if (!container) return;
    if (upcoming.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><p>All activities completed!</p></div>`;
        return;
    }
    container.innerHTML = upcoming.map(r => {
        const title = r.cropType || r.chemicalName || r.fertilizerType || r.method || r.activityType || r.field || '—';
        const loc = r.location ? `📍 ${r.location}` : '';
        const field = r.field ? ` • 🏑 ${r.field}` : '';
        return `
        <div class="prod-upcoming-item">
          <div class="prod-upcoming-icon">${r._icon}</div>
          <div class="prod-upcoming-body">
            <div class="prod-upcoming-title">${title}</div>
            <div class="prod-upcoming-meta">${loc}${field} • 📅 ${r._date || '—'}</div>
          </div>
          <div>${prodStatusPill(r.status)}</div>
          <button class="delete-btn" onclick="deleteRecord('${r._type}','${r.id}')" title="Delete">🗑</button>
        </div>`;
    }).join('');
}

// ── Generic prod record card ────────────────────────
function prodCard(rec, type, title, subtitle, details, deleteType) {
    const isDelayed = rec.status === 'Delayed';
    const isCompleted = rec.status === 'Completed';
    return `
    <div class="prod-record-card ${isDelayed ? 'prod-card-delayed' : ''} ${isCompleted ? 'prod-card-completed' : ''}">
      <div class="prod-record-header">
        <div>
          <div class="prod-record-title">${title}</div>
          <div class="prod-record-sub">${subtitle}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${prodStatusPill(rec.status)}
          <button class="delete-btn" onclick="deleteRecord('${deleteType}','${rec.id}')" title="Delete">🗑</button>
        </div>
      </div>
      <div class="prod-record-details">${details}</div>
    </div>`;
}

// ── 1. Nursery ──────────────────────────────────────
async function addNursery(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('nur-date').value,
        location: document.getElementById('nur-location').value.trim(),
        activityType: document.getElementById('nur-activity-type').value,
        cropType: document.getElementById('nur-crop-type').value.trim(),
        variety: document.getElementById('nur-variety').value.trim(),
        seedSource: document.getElementById('nur-seed-source').value.trim(),
        nurseryLocation: document.getElementById('nur-nursery-loc').value.trim(),
        quantitySeeds: document.getElementById('nur-qty-seeds').value.trim(),
        fungicideUsed: document.getElementById('nur-fungicide').value.trim(),
        pesticideUsed: document.getElementById('nur-pesticide').value.trim(),
        wateringSchedule: document.getElementById('nur-watering').value.trim(),
        shadeManagement: document.getElementById('nur-shade').value.trim(),
        healthStatus: document.getElementById('nur-health').value,
        nextActionDate: document.getElementById('nur-next-date').value,
        status: document.getElementById('nur-status').value,
        observations: document.getElementById('nur-observations').value.trim(),
        notes: document.getElementById('nur-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.activityType || !rec.cropType) {
        showToast('Fill all required fields', 'error'); return;
    }
    setLoading(true); showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_nursery', ...rec });
        if (res.success) {
            state.data.nursery.unshift(rec);
            showToast('Nursery log saved ✓', 'success');
            e.target.reset();
            document.getElementById('nur-date').value = today();
            renderNursery(); renderProdDashboard();
        } else { showToast('Error: ' + res.error, 'error'); }
    } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    setLoading(false);
}

function renderNursery() {
    const container = document.getElementById('nursery-list');
    if (!container) return;
    const statusF = document.getElementById('nur-filter-status')?.value || 'all';
    const searchQ = (document.getElementById('nur-search')?.value || '').toLowerCase();
    let items = [...state.data.nursery];
    if (statusF !== 'all') items = items.filter(r => r.status === statusF);
    if (searchQ) items = items.filter(r =>
        (r.cropType || '').toLowerCase().includes(searchQ) ||
        (r.activityType || '').toLowerCase().includes(searchQ) ||
        (r.observations || '').toLowerCase().includes(searchQ) ||
        (r.location || '').toLowerCase().includes(searchQ)
    );
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🌿</div><p>No nursery records match your filters.</p></div>`;
        return;
    }
    container.innerHTML = items.map(r => prodCard(r, 'nursery',
        `${r.activityType} — ${r.cropType}${r.variety ? ' (' + r.variety + ')' : ''}`,
        `📅 ${r.date} • 📍 ${r.location}${r.nurseryLocation ? ' • 🏡 ' + r.nurseryLocation : ''}`,
        prodFieldRow('Seed Source', r.seedSource) +
        prodFieldRow('Qty of Seeds', r.quantitySeeds) +
        prodFieldRow('Fungicide', r.fungicideUsed) +
        prodFieldRow('Pesticide', r.pesticideUsed) +
        prodFieldRow('Watering', r.wateringSchedule) +
        prodFieldRow('Shade', r.shadeManagement) +
        prodFieldRow('Health Status', r.healthStatus) +
        prodFieldRow('Next Action', r.nextActionDate) +
        prodFieldRow('Observations', r.observations) +
        prodFieldRow('Notes', r.notes),
        'nursery'
    )).join('');
}

// ── 2. Transplanting ────────────────────────────────
async function addTransplant(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('tr-date').value,
        location: document.getElementById('tr-location').value.trim(),
        field: document.getElementById('tr-field').value.trim(),
        cropType: document.getElementById('tr-crop-type').value.trim(),
        seedlingsCount: document.getElementById('tr-seedlings').value,
        spacing: document.getElementById('tr-spacing').value.trim(),
        personnel: document.getElementById('tr-personnel').value.trim(),
        successRate: document.getElementById('tr-success').value.trim(),
        establishmentStatus: document.getElementById('tr-establishment').value,
        status: document.getElementById('tr-status').value,
        notes: document.getElementById('tr-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.field || !rec.cropType || !rec.seedlingsCount) {
        showToast('Fill all required fields', 'error'); return;
    }
    setLoading(true); showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_transplant', ...rec });
        if (res.success) {
            state.data.transplanting.unshift(rec);
            showToast('Transplant record saved ✓', 'success');
            e.target.reset();
            document.getElementById('tr-date').value = today();
            renderTransplant(); renderProdDashboard();
        } else { showToast('Error: ' + res.error, 'error'); }
    } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    setLoading(false);
}

function renderTransplant() {
    const container = document.getElementById('transplant-list');
    if (!container) return;
    const statusF = document.getElementById('tr-filter-status')?.value || 'all';
    let items = [...state.data.transplanting];
    if (statusF !== 'all') items = items.filter(r => r.status === statusF);
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🪴</div><p>No transplanting records yet.</p></div>`;
        return;
    }
    container.innerHTML = items.map(r => prodCard(r, 'transplant',
        `${r.cropType} — ${r.seedlingsCount} seedlings`,
        `📅 ${r.date} • 📍 ${r.location} • 🏑 ${r.field}`,
        prodFieldRow('Spacing', r.spacing) +
        prodFieldRow('Personnel', r.personnel) +
        prodFieldRow('Success Rate', r.successRate) +
        prodFieldRow('Establishment', r.establishmentStatus) +
        prodFieldRow('Notes', r.notes),
        'transplant'
    )).join('');
}

// ── 3. Fertilizer ───────────────────────────────────
async function addFertilizer(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('fert-date').value,
        location: document.getElementById('fert-location').value.trim(),
        field: document.getElementById('fert-field').value.trim(),
        cropType: document.getElementById('fert-crop-type').value.trim(),
        fertilizerType: document.getElementById('fert-type').value,
        applicationMethod: document.getElementById('fert-method').value,
        quantityApplied: document.getElementById('fert-qty').value.trim(),
        appliedBy: document.getElementById('fert-applied-by').value.trim(),
        nextScheduledDate: document.getElementById('fert-next').value,
        status: document.getElementById('fert-status').value,
        notes: document.getElementById('fert-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.field || !rec.fertilizerType || !rec.quantityApplied) {
        showToast('Fill all required fields', 'error'); return;
    }
    setLoading(true); showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_fertilizer', ...rec });
        if (res.success) {
            state.data.fertilizer.unshift(rec);
            showToast('Fertilizer record saved ✓', 'success');
            e.target.reset();
            document.getElementById('fert-date').value = today();
            renderFertilizer(); renderProdDashboard();
        } else { showToast('Error: ' + res.error, 'error'); }
    } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    setLoading(false);
}

function renderFertilizer() {
    const container = document.getElementById('fertilizer-list');
    if (!container) return;
    const statusF = document.getElementById('fert-filter-status')?.value || 'all';
    let items = [...state.data.fertilizer];
    if (statusF !== 'all') items = items.filter(r => r.status === statusF);
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🧪</div><p>No fertilizer records yet.</p></div>`;
        return;
    }
    container.innerHTML = items.map(r => prodCard(r, 'fertilizer',
        `${r.fertilizerType} — ${r.quantityApplied}`,
        `📅 ${r.date} • 📍 ${r.location} • 🏑 ${r.field}${r.cropType ? ' • 🌱 ' + r.cropType : ''}`,
        prodFieldRow('Method', r.applicationMethod) +
        prodFieldRow('Applied By', r.appliedBy) +
        prodFieldRow('Next Application', r.nextScheduledDate) +
        prodFieldRow('Notes', r.notes),
        'fertilizer'
    )).join('');
}

// ── 4. Agrochemicals ────────────────────────────────
async function addAgrochem(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('agro-date').value,
        location: document.getElementById('agro-location').value.trim(),
        field: document.getElementById('agro-field').value.trim(),
        chemicalType: document.getElementById('agro-chem-type').value,
        chemicalName: document.getElementById('agro-chem-name').value.trim(),
        activeIngredient: document.getElementById('agro-active').value.trim(),
        targetPestDiseaseWeed: document.getElementById('agro-target').value.trim(),
        applicationRate: document.getElementById('agro-rate').value.trim(),
        reEntryInterval: document.getElementById('agro-reentry').value.trim(),
        preHarvestInterval: document.getElementById('agro-preharvest').value.trim(),
        nextSprayDate: document.getElementById('agro-next-spray').value,
        appliedBy: document.getElementById('agro-applied-by').value.trim(),
        status: document.getElementById('agro-status').value,
        notes: document.getElementById('agro-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.field || !rec.chemicalType || !rec.chemicalName || !rec.targetPestDiseaseWeed) {
        showToast('Fill all required fields', 'error'); return;
    }
    setLoading(true); showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_agrochem', ...rec });
        if (res.success) {
            state.data.agrochem.unshift(rec);
            showToast('Agrochem record saved ✓', 'success');
            e.target.reset();
            document.getElementById('agro-date').value = today();
            renderAgrochem(); renderProdDashboard();
        } else { showToast('Error: ' + res.error, 'error'); }
    } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    setLoading(false);
}

function renderAgrochem() {
    const container = document.getElementById('agrochem-list');
    if (!container) return;
    const typeF = document.getElementById('agro-filter-type')?.value || 'all';
    const statusF = document.getElementById('agro-filter-status')?.value || 'all';
    let items = [...state.data.agrochem];
    if (typeF !== 'all') items = items.filter(r => r.chemicalType === typeF);
    if (statusF !== 'all') items = items.filter(r => r.status === statusF);
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🧬</div><p>No agrochemical records yet.</p></div>`;
        return;
    }
    container.innerHTML = items.map(r => prodCard(r, 'agrochem',
        `${r.chemicalType}: ${r.chemicalName}`,
        `📅 ${r.date} • 📍 ${r.location} • 🏑 ${r.field}`,
        prodFieldRow('Active Ingredient', r.activeIngredient) +
        prodFieldRow('Target', r.targetPestDiseaseWeed) +
        prodFieldRow('Application Rate', r.applicationRate) +
        prodFieldRow('Re-Entry Interval', r.reEntryInterval) +
        prodFieldRow('Pre-Harvest Interval', r.preHarvestInterval) +
        prodFieldRow('Next Spray Date', r.nextSprayDate) +
        prodFieldRow('Applied By', r.appliedBy) +
        prodFieldRow('Notes', r.notes),
        'agrochem'
    )).join('');
}

// ── 5. Weeding ──────────────────────────────────────
async function addWeeding(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('weed-date').value,
        location: document.getElementById('weed-location').value.trim(),
        field: document.getElementById('weed-field').value.trim(),
        method: document.getElementById('weed-method').value,
        laborUsed: document.getElementById('weed-labor').value.trim(),
        areaCovered: document.getElementById('weed-area').value.trim(),
        nextWeedingDate: document.getElementById('weed-next').value,
        status: document.getElementById('weed-status').value,
        notes: document.getElementById('weed-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.field || !rec.method) {
        showToast('Fill all required fields', 'error'); return;
    }
    setLoading(true); showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_weeding', ...rec });
        if (res.success) {
            state.data.weeding.unshift(rec);
            showToast('Weeding record saved ✓', 'success');
            e.target.reset();
            document.getElementById('weed-date').value = today();
            renderWeeding(); renderProdDashboard();
        } else { showToast('Error: ' + res.error, 'error'); }
    } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    setLoading(false);
}

function renderWeeding() {
    const container = document.getElementById('weeding-list');
    if (!container) return;
    const statusF = document.getElementById('weed-filter-status')?.value || 'all';
    let items = [...state.data.weeding];
    if (statusF !== 'all') items = items.filter(r => r.status === statusF);
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🌾</div><p>No weeding records yet.</p></div>`;
        return;
    }
    container.innerHTML = items.map(r => prodCard(r, 'weeding',
        `${r.method}`,
        `📅 ${r.date} • 📍 ${r.location} • 🏑 ${r.field}`,
        prodFieldRow('Labor Used', r.laborUsed) +
        prodFieldRow('Area Covered', r.areaCovered) +
        prodFieldRow('Next Weeding', r.nextWeedingDate) +
        prodFieldRow('Notes', r.notes),
        'weeding'
    )).join('');
}

// ── 6. Crop Monitoring ──────────────────────────────
async function addMonitoring(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        date: document.getElementById('mon-date').value,
        location: document.getElementById('mon-location').value.trim(),
        field: document.getElementById('mon-field').value.trim(),
        cropType: document.getElementById('mon-crop-type').value.trim(),
        growthStage: document.getElementById('mon-growth-stage').value,
        healthObservation: document.getElementById('mon-health').value,
        diseaseIncidence: document.getElementById('mon-disease').value.trim(),
        pestInfestation: document.getElementById('mon-pest').value.trim(),
        weatherImpact: document.getElementById('mon-weather').value.trim(),
        status: document.getElementById('mon-status').value,
        notes: document.getElementById('mon-notes').value.trim(),
    };
    if (!rec.date || !rec.location || !rec.field) {
        showToast('Fill all required fields', 'error'); return;
    }

    const photoInput = document.getElementById('mon-photo');
    const file = photoInput?.files[0];
    if (file) {
        rec.photoBase64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target.result);
            reader.readAsDataURL(file);
        });
        rec.photoMimeType = file.type;
    }

    setLoading(true); showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_monitoring', ...rec });
        if (res.success) {
            rec.photoUrl = res.photoUrl || '';
            state.data.monitoring.unshift(rec);
            showToast('Monitoring log saved ✓', 'success');
            e.target.reset();
            document.getElementById('mon-date').value = today();
            document.getElementById('mon-photo-preview').style.display = 'none';
            renderMonitoring(); renderProdDashboard();
        } else { showToast('Error: ' + res.error, 'error'); }
    } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    setLoading(false);
}

function renderMonitoring() {
    const container = document.getElementById('monitoring-list');
    if (!container) return;
    const searchQ = (document.getElementById('mon-search')?.value || '').toLowerCase();
    let items = [...state.data.monitoring];
    if (searchQ) items = items.filter(r =>
        (r.cropType || '').toLowerCase().includes(searchQ) ||
        (r.field || '').toLowerCase().includes(searchQ) ||
        (r.notes || '').toLowerCase().includes(searchQ) ||
        (r.healthObservation || '').toLowerCase().includes(searchQ)
    );
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">👁</div><p>No monitoring logs yet.</p></div>`;
        return;
    }
    container.innerHTML = items.map(r => {
        const hasPhoto = r.photoUrl && r.photoUrl.trim() !== '';
        const details =
            prodFieldRow('Crop', r.cropType) +
            prodFieldRow('Growth Stage', r.growthStage) +
            prodFieldRow('Plant Health', r.healthObservation) +
            prodFieldRow('Disease Incidence', r.diseaseIncidence) +
            prodFieldRow('Pest Infestation', r.pestInfestation) +
            prodFieldRow('Weather Impact', r.weatherImpact) +
            prodFieldRow('Notes', r.notes) +
            (hasPhoto ? `<div class="prod-detail-row"><a href="${r.photoUrl}" target="_blank"><img src="${r.photoUrl}" style="max-width:100%;max-height:180px;border-radius:8px;margin-top:6px;object-fit:cover;" alt="Field photo"/></a></div>` : '');
        return prodCard(r, 'monitoring',
            `Crop Monitoring${r.cropType ? ' — ' + r.cropType : ''}`,
            `📅 ${r.date} • 📍 ${r.location} • 🏑 ${r.field}`,
            details, 'monitoring'
        );
    }).join('');
}

// ── 7. Harvesting ───────────────────────────────────
async function addHarvest(e) {
    e.preventDefault();
    const rec = {
        id: uuid(),
        harvestDate: document.getElementById('har-date').value,
        location: document.getElementById('har-location').value.trim(),
        field: document.getElementById('har-field').value.trim(),
        cropType: document.getElementById('har-crop-type').value.trim(),
        quantityHarvested: document.getElementById('har-quantity').value.trim(),
        unit: document.getElementById('har-unit').value,
        grade: document.getElementById('har-grade').value,
        lossesRecorded: document.getElementById('har-losses').value.trim(),
        harvestCycle: document.getElementById('har-cycle').value,
        status: document.getElementById('har-status').value,
        notes: document.getElementById('har-notes').value.trim(),
    };
    if (!rec.harvestDate || !rec.location || !rec.field || !rec.cropType || !rec.quantityHarvested) {
        showToast('Fill all required fields', 'error'); return;
    }
    setLoading(true); showToast('Saving…', 'info');
    try {
        const res = await gasPost({ action: 'add_harvest', ...rec });
        if (res.success) {
            state.data.harvest.unshift(rec);
            showToast('Harvest record saved ✓', 'success');
            e.target.reset();
            document.getElementById('har-date').value = today();
            renderHarvest(); renderProdDashboard();
        } else { showToast('Error: ' + res.error, 'error'); }
    } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    setLoading(false);
}

function renderHarvest() {
    const container = document.getElementById('harvest-list');
    if (!container) return;
    const searchQ = (document.getElementById('har-search')?.value || '').toLowerCase();
    let items = [...state.data.harvest];
    if (searchQ) items = items.filter(r =>
        (r.cropType || '').toLowerCase().includes(searchQ) ||
        (r.field || '').toLowerCase().includes(searchQ) ||
        (r.grade || '').toLowerCase().includes(searchQ)
    );
    items.sort((a, b) => (b.harvestDate || '').localeCompare(a.harvestDate || ''));
    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🚜</div><p>No harvest records yet.</p></div>`;
        return;
    }
    container.innerHTML = items.map(r => prodCard(r, 'harvest',
        `${r.cropType} — ${r.quantityHarvested} ${r.unit}`,
        `📅 ${r.harvestDate} • 📍 ${r.location} • 🏑 ${r.field} • ${r.harvestCycle}`,
        prodFieldRow('Grade / Quality', r.grade) +
        prodFieldRow('Losses Recorded', r.lossesRecorded) +
        prodFieldRow('Notes', r.notes),
        'harvest'
    )).join('');
}

// ── Production delete routing ───────────────────────
// Extend existing deleteRecord to handle production types
const _origDeleteRecord = deleteRecord;
async function deleteRecord(type, id) {
    const prodTypes = ['nursery', 'transplant', 'fertilizer', 'agrochem', 'weeding', 'monitoring', 'harvest'];
    if (!prodTypes.includes(type)) {
        return _origDeleteRecord(type, id);
    }
    if (!confirm('Delete this record?')) return;
    setLoading(true);
    try {
        const res = await gasPost({ action: 'delete', type, id });
        if (res.success) {
            const map = {
                nursery: 'nursery',
                transplant: 'transplanting',
                fertilizer: 'fertilizer',
                agrochem: 'agrochem',
                weeding: 'weeding',
                monitoring: 'monitoring',
                harvest: 'harvest',
            };
            const key = map[type];
            if (key) state.data[key] = state.data[key].filter(r => r.id !== id);
            renderProduction();
            showToast('Record deleted', 'info');
        } else { showToast('Error: ' + res.error, 'error'); }
    } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
    setLoading(false);
}

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('inv-date').value = today();
    document.getElementById('ci-date').value = today();
    document.getElementById('asset-date').value = today();

    loadData();

    document.getElementById('globalLocationFilter').addEventListener('change', renderAll);
    document.getElementById('inv-form').addEventListener('submit', addInvestment);
    document.getElementById('ci-form').addEventListener('submit', addCashInflow);
    document.getElementById('asset-form').addEventListener('submit', addAsset);
    document.getElementById('histSearch').addEventListener('input', renderHistory);
    document.getElementById('histFilter').addEventListener('change', renderHistory);
    document.getElementById('refreshBtn').addEventListener('click', loadData);

    // To-Do event listeners
    document.getElementById('todo-form')?.addEventListener('submit', addTodo);
    document.getElementById('todo-filter-urgency')?.addEventListener('change', renderTodos);
    document.getElementById('todo-filter-status')?.addEventListener('change', renderTodos);
    document.getElementById('todo-search')?.addEventListener('input', renderTodos);
    document.getElementById('refreshBtn').addEventListener('click', loadData);

    // Asset photo preview
    const assetPhotoInput = document.getElementById('asset-photo');
    assetPhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                assetPhotoBase64 = ev.target.result;
                assetPhotoMimeType = file.type;
                document.getElementById('asset-photo-preview').src = ev.target.result;
                document.getElementById('assetPhotoPreviewWrap').style.display = 'flex';
                document.getElementById('assetPhotoPlaceholder').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    setupScouting();

    // ── Production form listeners ──────────────────────
    document.getElementById('nursery-form')?.addEventListener('submit', addNursery);
    document.getElementById('transplant-form')?.addEventListener('submit', addTransplant);
    document.getElementById('fertilizer-form')?.addEventListener('submit', addFertilizer);
    document.getElementById('agrochem-form')?.addEventListener('submit', addAgrochem);
    document.getElementById('weeding-form')?.addEventListener('submit', addWeeding);
    document.getElementById('monitoring-form')?.addEventListener('submit', addMonitoring);
    document.getElementById('harvest-form')?.addEventListener('submit', addHarvest);

    // Production filter listeners
    document.getElementById('nur-filter-status')?.addEventListener('change', renderNursery);
    document.getElementById('nur-search')?.addEventListener('input', renderNursery);
    document.getElementById('tr-filter-status')?.addEventListener('change', renderTransplant);
    document.getElementById('fert-filter-status')?.addEventListener('change', renderFertilizer);
    document.getElementById('agro-filter-type')?.addEventListener('change', renderAgrochem);
    document.getElementById('agro-filter-status')?.addEventListener('change', renderAgrochem);
    document.getElementById('weed-filter-status')?.addEventListener('change', renderWeeding);
    document.getElementById('mon-search')?.addEventListener('input', renderMonitoring);
    document.getElementById('har-search')?.addEventListener('input', renderHarvest);

    // Production date defaults
    const prodDateIds = ['nur-date', 'tr-date', 'fert-date', 'agro-date', 'weed-date', 'mon-date', 'har-date'];
    prodDateIds.forEach(id => { const el = document.getElementById(id); if (el) el.value = today(); });

    // Monitoring photo preview
    document.getElementById('mon-photo')?.addEventListener('change', e => {
        const file = e.target.files[0];
        const preview = document.getElementById('mon-photo-preview');
        if (file && preview) {
            const reader = new FileReader();
            reader.onload = ev => { preview.src = ev.target.result; preview.style.display = 'block'; };
            reader.readAsDataURL(file);
        }
    });



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
            document.getElementById('lockScreen').classList.add('hidden');
            showToast('Access Granted ✓', 'success');
        } else {
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
