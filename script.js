// ══════════════════════════════════════════════════
//  freshBABA FARMS — Frontend Script
//  Backend: Google Apps Script Web App
// ══════════════════════════════════════════════════

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyZXruOGI9pcIg-sbzv-LJxuYfMZj3PIqbDsrsMcCbifxL-7RZbfak7dPCfkYh2gn8HBw/exec';

let state = {
    data: { investments: [], cashInflows: [], scouting: [], assets: [] },
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
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [
                {
                    label: 'Expenses',
                    data: months.length ? months.map(m => monthMap[m].inv) : [0],
                    backgroundColor: 'rgba(255,82,82,0.5)',
                    borderColor: 'rgba(255,82,82,0.9)',
                    borderWidth: 2, borderRadius: 6,
                },
                {
                    label: 'Income',
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
}

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
