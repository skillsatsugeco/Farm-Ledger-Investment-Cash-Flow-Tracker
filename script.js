<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>freshBABA FARMS — Investment &amp; Cash Flow Tracker</title>
  <meta name="description"
    content="Track your farm investments, cash inflows and assets. Data synced to Google Sheets." />
  <link rel="stylesheet" href="style.css" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
</head>

<body>

  <!-- ══════════ LOCK SCREEN ══════════ -->
  <div id="lockScreen" class="lock-screen">
    <div class="lock-container">
      <div class="lock-logo">
        <img src="logo.jpg" alt="freshBABA FARMS Logo"
          style="width:100%; height:100%; object-fit:contain; border-radius:10px;">
      </div>
      <h2 style="margin-bottom:12px; font-size:22px; color:var(--text-primary);">freshBABA FARMS</h2>
      <p style="margin-bottom:24px; color:var(--text-secondary); font-size:14px;">Enter PIN to access your account</p>

      <div class="pin-display" id="pinDisplay">
        <div class="pin-dot"></div>
        <div class="pin-dot"></div>
        <div class="pin-dot"></div>
        <div class="pin-dot"></div>
      </div>

      <div class="pin-pad">
        <button class="pin-btn" onclick="enterPin(1)">1</button>
        <button class="pin-btn" onclick="enterPin(2)">2</button>
        <button class="pin-btn" onclick="enterPin(3)">3</button>
        <button class="pin-btn" onclick="enterPin(4)">4</button>
        <button class="pin-btn" onclick="enterPin(5)">5</button>
        <button class="pin-btn" onclick="enterPin(6)">6</button>
        <button class="pin-btn" onclick="enterPin(7)">7</button>
        <button class="pin-btn" onclick="enterPin(8)">8</button>
        <button class="pin-btn" onclick="enterPin(9)">9</button>
        <button class="pin-btn pin-action" onclick="clearPin()">C</button>
        <button class="pin-btn" onclick="enterPin(0)">0</button>
        <button class="pin-btn pin-action" onclick="submitPin()">OK</button>
      </div>

      <div id="pinError" style="color:var(--accent-red); font-size:13px; margin-top:20px; min-height:20px;"></div>
    </div>
  </div>

  <!-- ══════════ HEADER ══════════ -->
  <header class="header">
    <div class="header-brand">
      <div class="header-logo" style="background:none;"><img src="logo.jpg" alt="Logo"
          style="width:100%; height:100%; object-fit:contain; border-radius:10px;"></div>
      <div>
        <div class="header-title">freshBABA FARMS</div>
        <div class="header-sub">Investment &amp; Cash Flow Tracker</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:14px;">
      <select id="globalLocationFilter"
        style="background:rgba(255,255,255,0.06); border:1px solid var(--glass-border); border-radius:8px; padding:6px 10px; color:#fff; font-family:'Inter',sans-serif; font-size:13px;">
        <option value="all">🌍 All Locations</option>
      </select>
      <div style="display:flex;align-items:center;gap:8px;">
        <div id="connDot"
          style="width:8px;height:8px;border-radius:50%;background:var(--accent-green);box-shadow:0 0 8px var(--accent-green);transition:all 0.3s;">
        </div>
        <span id="connLabel" class="header-sub" style="color:var(--accent-green);">Connected securely</span>
      </div>
      <button id="privacyBtn" title="Toggle Privacy Mode" onclick="togglePrivacy()"
        style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:18px;">👁️</button>
      <button id="refreshBtn" title="Refresh data"
        style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:18px;">↻</button>
    </div>
  </header>

  <!-- ══════════ NAV TABS ══════════ -->
  <div class="nav-tabs">
    <button class="nav-tab active" data-tab="dashboard" onclick="switchTab('dashboard')">📊 Dashboard</button>
    <button class="nav-tab" data-tab="investments" onclick="switchTab('investments')">📉 Expenses</button>
    <button class="nav-tab" data-tab="cashinflows" onclick="switchTab('cashinflows')">💵 Income</button>
    <button class="nav-tab" data-tab="assets" onclick="switchTab('assets')">🏦 Assets</button>
    <button class="nav-tab" data-tab="scouting" onclick="switchTab('scouting')">📝 Field Scouting</button>
    <button class="nav-tab" data-tab="todos" onclick="switchTab('todos')">✅ Farm To-Do</button>
    <button class="nav-tab" data-tab="production" onclick="switchTab('production')">🌱 Production</button>
    <button class="nav-tab" data-tab="history" onclick="switchTab('history')">📋 History</button>
  </div>

  <main class="main">

    <!-- ══════════ DASHBOARD ══════════ -->
    <div id="dashboard" class="tab-content active">
      <div class="cards-grid">
        <div class="stat-card invested">
          <div class="stat-icon">📉</div>
          <div class="stat-label">Total Invested</div>
          <div class="stat-value blue" id="stat-invested">TZS 0</div>
          <div class="stat-sub" id="stat-inv-count">0 records</div>
        </div>
        <div class="stat-card cashout">
          <div class="stat-icon">💵</div>
          <div class="stat-label">Total Income</div>
          <div class="stat-value green" id="stat-cashout">TZS 0</div>
          <div class="stat-sub" id="stat-co-count">0 records</div>
        </div>
        <div class="stat-card assets-card">
          <div class="stat-icon">🏦</div>
          <div class="stat-label">Total Assets</div>
          <div class="stat-value purple" id="stat-assets">TZS 0</div>
          <div class="stat-sub" id="stat-assets-count">0 assets</div>
        </div>
        <div class="stat-card net">
          <div class="stat-icon">💰</div>
          <div class="stat-label">Net Profit / Loss</div>
          <div class="stat-value gold" id="stat-net">TZS 0</div>
          <div class="stat-sub">Income minus Expenses</div>
        </div>
        <div class="stat-card roi">
          <div class="stat-icon">📐</div>
          <div class="stat-label">ROI</div>
          <div class="stat-value" id="stat-roi">—</div>
          <div class="stat-sub">Return on Investment</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">📊 Monthly Overview — Expenses vs Income</div>
          <span class="save-indicator" id="saveIndicator">✓ Saved to Google Sheets</span>
        </div>
        <div class="panel-body">
          <div class="chart-wrapper">
            <canvas id="mainChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ ADD INVESTMENT / EXPENSE ══════════ -->
    <div id="investments" class="tab-content">
      <div class="add-panel">
        <div class="section-heading">📉 Record Expense / Investment</div>
        <form id="inv-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="inv-date">Date *</label>
              <input type="date" id="inv-date" required />
            </div>
            <div class="form-group">
              <label for="inv-location">Site / Location *</label>
              <input type="text" id="inv-location" placeholder="e.g. Site A, Block B..." required />
            </div>
            <div class="form-group">
              <label for="inv-amount">Amount (TZS) *</label>
              <input type="number" id="inv-amount" min="1" step="any" placeholder="e.g. 50000" required />
            </div>
            <div class="form-group">
              <label for="inv-payment-type">Payment Type *</label>
              <select id="inv-payment-type" required>
                <option value="" disabled selected>— Cash or Credit? —</option>
                <option value="Cash">💵 Cash</option>
                <option value="Credit">💳 Credit / On Account</option>
              </select>
            </div>
            <div class="form-group">
              <label for="inv-category">Category *</label>
              <select id="inv-category" required>
                <option value="" disabled selected>— Select category —</option>
                <optgroup label="🌱 Crop Inputs">
                  <option>Seeds</option>
                  <option>Fertilizer (Basal)</option>
                  <option>Fertilizer (Top Dressing)</option>
                  <option>Pesticides</option>
                  <option>Herbicides / Weedicides</option>
                  <option>Fungicides</option>
                </optgroup>
                <optgroup label="💧 Water &amp; Land">
                  <option>Irrigation</option>
                  <option>Land Rent / Lease</option>
                  <option>Land Preparation</option>
                  <option>Soil Testing</option>
                </optgroup>
                <optgroup label="👷 Labor">
                  <option>Planting Labor</option>
                  <option>Weeding Labor</option>
                  <option>Harvesting Labor</option>
                  <option>General Farm Labor</option>
                  <option>Supervisory Wages</option>
                </optgroup>
                <optgroup label="🚜 Equipment &amp; Tools">
                  <option>Equipment Purchase</option>
                  <option>Equipment Rental (Tractor)</option>
                  <option>Equipment Rental (Other)</option>
                  <option>Tools &amp; Small Equipment</option>
                  <option>Equipment Repair &amp; Maintenance</option>
                  <option>Fuel &amp; Lubricants</option>
                </optgroup>
                <optgroup label="🐄 Livestock">
                  <option>Animal Purchase</option>
                  <option>Animal Feed</option>
                  <option>Veterinary Services</option>
                  <option>Vaccines &amp; Medicine</option>
                  <option>Livestock Housing</option>
                </optgroup>
                <optgroup label="🚚 Logistics">
                  <option>Transport (Inputs)</option>
                  <option>Transport (Produce)</option>
                  <option>Packaging &amp; Storage</option>
                  <option>Cold Storage / Warehouse</option>
                </optgroup>
                <optgroup label="💼 Finance &amp; Admin">
                  <option>Loan Interest / Repayment</option>
                  <option>Insurance Premium</option>
                  <option>Permit &amp; License Fees</option>
                  <option>Extension / Consultancy Services</option>
                  <option>Training &amp; Capacity Building</option>
                </optgroup>
                <optgroup label="🏗 Infrastructure">
                  <option>Fence Construction</option>
                  <option>Store / Shed Construction</option>
                  <option>Water System Installation</option>
                </optgroup>
                <option>Other</option>
              </select>
            </div>
            <div class="form-group form-full">
              <label for="inv-notes">Notes</label>
              <textarea id="inv-notes" placeholder="Optional — supplier name, quantity, batch info…"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" style="background:linear-gradient(135deg,#ff5252,#c62828);">✚
              Record Expense</button>
            <button type="reset" class="btn btn-secondary"
              onclick="document.getElementById('inv-date').value=today()">Clear</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ══════════ ADD CASH INFLOW / INCOME ══════════ -->
    <div id="cashinflows" class="tab-content">
      <div class="add-panel">
        <div class="section-heading">💵 Record Income</div>
        <form id="ci-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="ci-date">Date *</label>
              <input type="date" id="ci-date" required />
            </div>
            <div class="form-group">
              <label for="ci-location">Site / Location *</label>
              <input type="text" id="ci-location" placeholder="e.g. Site A, Block B..." required />
            </div>
            <div class="form-group">
              <label for="ci-amount">Amount (TZS) *</label>
              <input type="number" id="ci-amount" min="1" step="any" placeholder="e.g. 200000" required />
            </div>
            <div class="form-group">
              <label for="ci-sale-type">Sale Type *</label>
              <select id="ci-sale-type" required>
                <option value="" disabled selected>— Sale type? —</option>
                <option value="Cash Sale">💵 Cash Sale</option>
                <option value="Credit Sale">💳 Credit Sale</option>
              </select>
            </div>
            <div class="form-group">
              <label for="ci-category">Category *</label>
              <select id="ci-category" required>
                <option value="" disabled selected>— Select category —</option>
                <optgroup label="🌾 Crop Sales (main)">
                  <option>Maize Sale</option>
                  <option>Rice Sale</option>
                  <option>Wheat Sale</option>
                  <option>Cassava Sale</option>
                  <option>Sweet Potato Sale</option>
                  <option>Irish Potato Sale</option>
                  <option>Sunflower Sale</option>
                  <option>Sorghum Sale</option>
                  <option>Millet Sale</option>
                  <option>Beans / Legumes Sale</option>
                  <option>Groundnut Sale</option>
                  <option>Sesame Sale</option>
                  <option>Cotton Sale</option>
                  <option>Tobacco Sale</option>
                  <option>Sugarcane Sale</option>
                  <option>Vegetables Sale</option>
                  <option>Fruits Sale</option>
                  <option>Other Crop Sale</option>
                </optgroup>
                <optgroup label="🐄 Livestock Sales">
                  <option>Cattle Sale</option>
                  <option>Goat / Sheep Sale</option>
                  <option>Pig Sale</option>
                  <option>Poultry / Chicken Sale</option>
                  <option>Eggs Sale</option>
                  <option>Milk / Dairy Sale</option>
                  <option>Fish / Aquaculture Sale</option>
                </optgroup>
                <optgroup label="🔧 Asset &amp; Service Income">
                  <option>Equipment Rental Income</option>
                  <option>Land Rental Income</option>
                  <option>By-Product Sale (Straw, Husks…)</option>
                  <option>Processed Product Sale</option>
                </optgroup>
                <optgroup label="💵 Grants &amp; Finance">
                  <option>Government Subsidy</option>
                  <option>NGO / Development Grant</option>
                  <option>Loan Received</option>
                  <option>Insurance Claim Payout</option>
                  <option>Advance Payment from Buyer</option>
                </optgroup>
                <option>Other Income</option>
              </select>
            </div>
            <div class="form-group form-full">
              <label for="ci-notes">Notes</label>
              <textarea id="ci-notes" placeholder="Optional — buyer name, quantity sold, market price…"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">✚ Record Income</button>
            <button type="reset" class="btn btn-secondary"
              onclick="document.getElementById('ci-date').value=today()">Clear</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ══════════ ASSETS ══════════ -->
    <div id="assets" class="tab-content">
      <div class="add-panel">
        <div class="section-heading">🏦 Record Farm Asset</div>
        <form id="asset-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="asset-date">Date Acquired *</label>
              <input type="date" id="asset-date" required />
            </div>
            <div class="form-group">
              <label for="asset-location">Site / Location *</label>
              <input type="text" id="asset-location" placeholder="e.g. Site A, Main Farm..." required />
            </div>
            <div class="form-group">
              <label for="asset-name">Asset Name *</label>
              <input type="text" id="asset-name" placeholder="e.g. Tractor, Water Pump, Shed..." required />
            </div>
            <div class="form-group">
              <label for="asset-value">Purchase Value (TZS) *</label>
              <input type="number" id="asset-value" min="1" step="any" placeholder="e.g. 5000000" required />
            </div>
            <div class="form-group">
              <label for="asset-category">Category *</label>
              <select id="asset-category" required>
                <option value="" disabled selected>— Select category —</option>
                <optgroup label="🚜 Machinery &amp; Equipment">
                  <option>Tractor</option>
                  <option>Plough / Harrow</option>
                  <option>Water Pump</option>
                  <option>Generator</option>
                  <option>Sprayer</option>
                  <option>Harvesting Machine</option>
                  <option>Other Machinery</option>
                </optgroup>
                <optgroup label="🏗 Buildings &amp; Structures">
                  <option>Farm House / Office</option>
                  <option>Storage Shed / Warehouse</option>
                  <option>Animal Housing</option>
                  <option>Greenhouse / Shade Net</option>
                  <option>Water Tank / Reservoir</option>
                  <option>Fence / Boundary Wall</option>
                </optgroup>
                <optgroup label="🌱 Land">
                  <option>Owned Land</option>
                  <option>Leased Land (Long-term)</option>
                </optgroup>
                <optgroup label="🐄 Livestock">
                  <option>Cattle / Cows</option>
                  <option>Goats / Sheep</option>
                  <option>Pigs</option>
                  <option>Poultry Flock</option>
                  <option>Fish Pond</option>
                </optgroup>
                <optgroup label="🔧 Tools &amp; Small Assets">
                  <option>Hand Tools (Hoes, Machetes…)</option>
                  <option>Irrigation Pipes / Drip System</option>
                  <option>Weighing Scale</option>
                  <option>Storage Containers</option>
                </optgroup>
                <optgroup label="🚗 Vehicles">
                  <option>Farm Truck / Pickup</option>
                  <option>Motorbike</option>
                  <option>Other Vehicle</option>
                </optgroup>
                <option>Other Asset</option>
              </select>
            </div>
            <div class="form-group">
              <label for="asset-condition">Condition</label>
              <select id="asset-condition">
                <option value="New">🟢 New</option>
                <option value="Good">🔵 Good</option>
                <option value="Fair" selected>🟡 Fair</option>
                <option value="Poor">🔴 Poor / Needs Repair</option>
              </select>
            </div>
            <div class="form-group form-full">
              <label for="asset-notes">Notes / Description</label>
              <textarea id="asset-notes" placeholder="Optional — serial number, supplier, warranty info…"></textarea>
            </div>
            <!-- Photo upload -->
            <div class="form-group form-full">
              <label>Asset Photo <span style="color:var(--text-muted); font-weight:400;">(optional — adds
                  realism)</span></label>
              <div class="photo-upload-area" id="assetPhotoArea">
                <input type="file" id="asset-photo" accept="image/*" capture="environment" style="display:none;" />
                <div class="photo-upload-placeholder" id="assetPhotoPlaceholder"
                  onclick="document.getElementById('asset-photo').click()">
                  <div style="font-size:36px; margin-bottom:8px;">📷</div>
                  <div style="font-weight:600; font-size:14px; color:var(--text-primary);">Click to take / upload photo
                  </div>
                  <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Supports JPG, PNG, WEBP</div>
                </div>
                <div class="asset-photo-preview-wrap" id="assetPhotoPreviewWrap" style="display:none;">
                  <img id="asset-photo-preview"
                    style="max-width:100%; max-height:220px; border-radius:10px; object-fit:contain;" />
                  <button type="button" class="remove-photo-btn" onclick="clearAssetPhoto()">✕ Remove Photo</button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" style="background:linear-gradient(135deg,#7c3aed,#4c1d95);">🏦
              Record Asset</button>
            <button type="reset" class="btn btn-secondary"
              onclick="document.getElementById('asset-date').value=today(); clearAssetPhoto();">Clear</button>
          </div>
        </form>
      </div>

      <!-- Asset list -->
      <div class="panel" style="margin-top:24px;">
        <div class="panel-header">
          <div class="panel-title">🏦 Recorded Assets</div>
        </div>
        <div class="panel-body" id="assets-list-container">
          <div class="empty-state">
            <div class="empty-icon">🏦</div>
            <p>No assets recorded yet.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ FIELD SCOUTING ══════════ -->
    <div id="scouting" class="tab-content">
      <div class="add-panel">
        <form id="scout-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="scout-date">Date *</label>
              <input type="date" id="scout-date" required />
            </div>
            <div class="form-group">
              <label for="scout-location">Site / Location *</label>
              <input type="text" id="scout-location" placeholder="e.g. Site A, Block B..." required />
            </div>
            <div class="form-group form-full">
              <label for="scout-observation">Observation / Notes *</label>
              <textarea id="scout-observation" placeholder="What did you see? Pests, crop health, problems..."
                required></textarea>
            </div>
            <div class="form-group">
              <label>Take Photo</label>
              <input type="file" id="scout-photo" accept="image/*" capture="environment" style="padding: 6px;" />
              <img id="scout-photo-preview"
                style="max-width: 100%; margin-top: 10px; border-radius: 8px; display: none;" />
            </div>
            <div class="form-group">
              <label>Record Voice Note</label>
              <button type="button" id="recordBtn" class="record-btn">🎤 Start Recording</button>
              <audio id="scout-audio-preview" controls style="width: 100%; margin-top: 10px; display: none;"></audio>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary"
              style="background:linear-gradient(135deg,#00b0ff,#0069c0); color:#fff;">✚ Save Log</button>
            <button type="reset" class="btn btn-secondary"
              onclick="document.getElementById('scout-date').value=today(); clearScoutMedia();">Clear</button>
          </div>
        </form>
      </div>

      <div class="panel" style="margin-top: 24px;">
        <div class="panel-header">
          <div class="panel-title">📋 Recent Scouting Logs</div>
        </div>
        <div class="panel-body" id="scout-logs-container">
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p>No scouting logs yet.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ FARM TO-DO ══════════ -->
    <div id="todos" class="tab-content">
      <div class="add-panel">
        <div class="section-heading">✅ Farm To-Do List</div>
        <form id="todo-form">
          <div class="form-grid">
            <div class="form-group form-full">
              <label for="todo-task">Task / Activity *</label>
              <input type="text" id="todo-task" placeholder="e.g. Apply top dressing fertilizer on Block A" required />
            </div>
            <div class="form-group form-full">
              <label for="todo-goal">Objective / Goal</label>
              <textarea id="todo-goal" placeholder="Why is this important? What outcome are you targeting?"></textarea>
            </div>
            <div class="form-group">
              <label for="todo-urgency">Urgency Level *</label>
              <select id="todo-urgency" required>
                <option value="" disabled selected>— Select urgency —</option>
                <option value="High">🔴 High — Do it today</option>
                <option value="Medium">🟡 Medium — This week</option>
                <option value="Low">🟢 Low — When possible</option>
              </select>
            </div>
            <div class="form-group">
              <label for="todo-location">Site / Location</label>
              <input type="text" id="todo-location" placeholder="e.g. Block B, Site A..." />
            </div>
            <div class="form-group">
              <label for="todo-due">Due Date *</label>
              <input type="date" id="todo-due" required />
            </div>
            <div class="form-group">
              <label for="todo-postpone">Postpone To (optional)</label>
              <input type="date" id="todo-postpone" />
            </div>
            <div class="form-group form-full">
              <label for="todo-notes">Notes</label>
              <textarea id="todo-notes"
                placeholder="Any extra details, resources needed, assigned person..."></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary"
              style="background:linear-gradient(135deg,#7c4dff,#512da8);color:#fff;">✚ Add Task</button>
            <button type="reset" class="btn btn-secondary">Clear</button>
          </div>
        </form>
      </div>

      <!-- Filter bar -->
      <div class="table-controls" style="margin-top:20px;">
        <select class="filter-select" id="todo-filter-urgency">
          <option value="all">All Urgency</option>
          <option value="High">🔴 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>
        <select class="filter-select" id="todo-filter-status">
          <option value="all">All Status</option>
          <option value="Pending">⏳ Pending</option>
          <option value="Postponed">📅 Postponed</option>
          <option value="Done">✅ Done</option>
        </select>
        <input class="search-box" type="text" id="todo-search" placeholder="🔍 Search tasks..." />
      </div>

      <!-- Task list -->
      <div class="panel" style="margin-top:12px;">
        <div class="panel-body" id="todo-list-container">
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <p>No tasks yet. Add your first farm task above.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ PRODUCTION ACTIVITY TRACKING ══════════ -->
    <div id="production" class="tab-content">

      <!-- Production Sub-Nav -->
      <div class="prod-subnav">
        <button class="prod-subtab active" data-subtab="prod-dashboard" onclick="switchProdTab('prod-dashboard')">📊
          Overview</button>
        <button class="prod-subtab" data-subtab="prod-nursery" onclick="switchProdTab('prod-nursery')">🌿
          Nursery</button>
        <button class="prod-subtab" data-subtab="prod-transplant" onclick="switchProdTab('prod-transplant')">🪴
          Transplanting</button>
        <button class="prod-subtab" data-subtab="prod-fertilizer" onclick="switchProdTab('prod-fertilizer')">🧪
          Fertilizer</button>
        <button class="prod-subtab" data-subtab="prod-agrochem" onclick="switchProdTab('prod-agrochem')">🧬
          Agrochemicals</button>
        <button class="prod-subtab" data-subtab="prod-weeding" onclick="switchProdTab('prod-weeding')">🌾
          Weeding</button>
        <button class="prod-subtab" data-subtab="prod-monitoring" onclick="switchProdTab('prod-monitoring')">👁
          Monitoring</button>
        <button class="prod-subtab" data-subtab="prod-harvest" onclick="switchProdTab('prod-harvest')">🚜
          Harvest</button>
      </div>

      <!-- ── Production Overview Dashboard ── -->
      <div id="prod-dashboard" class="prod-subcontent active">
        <div class="prod-dash-grid">
          <div class="prod-stat-card" style="border-top-color:#00e676;">
            <div class="prod-stat-icon">🌿</div>
            <div class="prod-stat-label">Nursery Activities</div>
            <div class="prod-stat-value" id="pd-nursery-count">0</div>
          </div>
          <div class="prod-stat-card" style="border-top-color:#448aff;">
            <div class="prod-stat-icon">🪴</div>
            <div class="prod-stat-label">Transplants</div>
            <div class="prod-stat-value" id="pd-transplant-count">0</div>
          </div>
          <div class="prod-stat-card" style="border-top-color:#ffd740;">
            <div class="prod-stat-icon">🧪</div>
            <div class="prod-stat-label">Fertilizer Applications</div>
            <div class="prod-stat-value" id="pd-fertilizer-count">0</div>
          </div>
          <div class="prod-stat-card" style="border-top-color:#ff5252;">
            <div class="prod-stat-icon">🧬</div>
            <div class="prod-stat-label">Agrochem Sprays</div>
            <div class="prod-stat-value" id="pd-agrochem-count">0</div>
          </div>
          <div class="prod-stat-card" style="border-top-color:#00b0ff;">
            <div class="prod-stat-icon">🌾</div>
            <div class="prod-stat-label">Weeding Operations</div>
            <div class="prod-stat-value" id="pd-weeding-count">0</div>
          </div>
          <div class="prod-stat-card" style="border-top-color:#69f0ae;">
            <div class="prod-stat-icon">👁</div>
            <div class="prod-stat-label">Monitoring Logs</div>
            <div class="prod-stat-value" id="pd-monitoring-count">0</div>
          </div>
          <div class="prod-stat-card" style="border-top-color:#ea80fc;">
            <div class="prod-stat-icon">🚜</div>
            <div class="prod-stat-label">Harvest Records</div>
            <div class="prod-stat-value" id="pd-harvest-count">0</div>
          </div>
          <div class="prod-stat-card" style="border-top-color:#ff6d00;">
            <div class="prod-stat-icon">⚠️</div>
            <div class="prod-stat-label">Overdue / Delayed</div>
            <div class="prod-stat-value" id="pd-delayed-count" style="color:#ff5252;">0</div>
          </div>
        </div>
        <!-- Upcoming Activities -->
        <div class="panel" style="margin-top:20px;">
          <div class="panel-header">
            <div class="panel-title">📅 Upcoming & Pending Activities</div>
            <select class="filter-select" id="prod-upcoming-filter" onchange="renderProdDashboard()">
              <option value="all">All Types</option>
              <option value="nursery">🌿 Nursery</option>
              <option value="transplanting">🪴 Transplanting</option>
              <option value="fertilizer">🧪 Fertilizer</option>
              <option value="agrochem">🧬 Agrochem</option>
              <option value="weeding">🌾 Weeding</option>
              <option value="monitoring">👁 Monitoring</option>
              <option value="harvest">🚜 Harvest</option>
            </select>
          </div>
          <div class="panel-body" id="prod-upcoming-list">
            <div class="empty-state">
              <div class="empty-icon">📅</div>
              <p>No activities yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 1. Nursery & Seedling Management ── -->
      <div id="prod-nursery" class="prod-subcontent">
        <div class="add-panel">
          <div class="section-heading">🌿 Nursery & Seedling Activity</div>
          <form id="nursery-form">
            <div class="form-grid">
              <div class="form-group">
                <label for="nur-date">Date *</label>
                <input type="date" id="nur-date" required />
              </div>
              <div class="form-group">
                <label for="nur-location">Farm Location *</label>
                <input type="text" id="nur-location" placeholder="e.g. Site A" required />
              </div>
              <div class="form-group">
                <label for="nur-activity-type">Activity Type *</label>
                <select id="nur-activity-type" required>
                  <option value="" disabled selected>— Select activity —</option>
                  <option value="Sowing">🌱 Seed Sowing</option>
                  <option value="Fungicide Application">🧪 Fungicide Application</option>
                  <option value="Pesticide Application">🐛 Pesticide Application</option>
                  <option value="Watering">💧 Watering</option>
                  <option value="Shade Management">☂️ Shade Management</option>
                  <option value="Thinning">✂️ Thinning/Pricking Out</option>
                  <option value="Health Check">🔍 Health Check</option>
                  <option value="Other">📋 Other</option>
                </select>
              </div>
              <div class="form-group">
                <label for="nur-crop-type">Crop Type *</label>
                <input type="text" id="nur-crop-type" placeholder="e.g. Tomato, Maize, Rice" required />
              </div>
              <div class="form-group">
                <label for="nur-variety">Variety</label>
                <input type="text" id="nur-variety" placeholder="e.g. Roma VF, DK8031" />
              </div>
              <div class="form-group">
                <label for="nur-seed-source">Seed Source</label>
                <input type="text" id="nur-seed-source" placeholder="e.g. TANSEED, Local market" />
              </div>
              <div class="form-group">
                <label for="nur-nursery-loc">Nursery Location</label>
                <input type="text" id="nur-nursery-loc" placeholder="e.g. Block N1, Shade House" />
              </div>
              <div class="form-group">
                <label for="nur-qty-seeds">Quantity of Seeds</label>
                <input type="text" id="nur-qty-seeds" placeholder="e.g. 2kg, 5000 seeds" />
              </div>
              <div class="form-group">
                <label for="nur-fungicide">Fungicide Used</label>
                <input type="text" id="nur-fungicide" placeholder="e.g. Ridomil 2.5g/L" />
              </div>
              <div class="form-group">
                <label for="nur-pesticide">Pesticide Used</label>
                <input type="text" id="nur-pesticide" placeholder="e.g. Actellic 15ml/L" />
              </div>
              <div class="form-group">
                <label for="nur-watering">Watering Schedule</label>
                <input type="text" id="nur-watering" placeholder="e.g. Twice daily, 7AM & 5PM" />
              </div>
              <div class="form-group">
                <label for="nur-shade">Shade Management</label>
                <input type="text" id="nur-shade" placeholder="e.g. 50% shade net applied" />
              </div>
              <div class="form-group">
                <label for="nur-health">Seedling Health Status</label>
                <select id="nur-health">
                  <option value="">— Not assessed —</option>
                  <option value="Excellent">🟢 Excellent</option>
                  <option value="Good">🔵 Good</option>
                  <option value="Fair">🟡 Fair</option>
                  <option value="Poor">🔴 Poor</option>
                  <option value="Damping Off">⚠️ Damping Off</option>
                </select>
              </div>
              <div class="form-group">
                <label for="nur-next-date">Next Action Date</label>
                <input type="date" id="nur-next-date" />
              </div>
              <div class="form-group">
                <label for="nur-status">Status *</label>
                <select id="nur-status" required>
                  <option value="Planned">📋 Planned</option>
                  <option value="Scheduled">📅 Scheduled</option>
                  <option value="In Progress">⚙️ In Progress</option>
                  <option value="Completed" selected>✅ Completed</option>
                  <option value="Delayed">⏰ Delayed</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label for="nur-observations">Observations</label>
                <textarea id="nur-observations"
                  placeholder="Detailed observations on seedling health, pest presence, growth…"></textarea>
              </div>
              <div class="form-group form-full">
                <label for="nur-notes">Notes</label>
                <textarea id="nur-notes" placeholder="Any additional information…"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary"
                style="background:linear-gradient(135deg,#00c853,#009624);">🌿 Save Nursery Log</button>
              <button type="reset" class="btn btn-secondary"
                onclick="document.getElementById('nur-date').value=today()">Clear</button>
            </div>
          </form>
        </div>
        <div class="panel" style="margin-top:20px;">
          <div class="panel-header">
            <div class="panel-title">🌿 Nursery Activity Records</div>
            <div style="display:flex;gap:8px;">
              <input class="search-box" type="text" id="nur-search" placeholder="🔍 Search…" style="max-width:200px;" />
              <select class="filter-select" id="nur-filter-status">
                <option value="all">All Status</option>
                <option value="Planned">Planned</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div class="panel-body" id="nursery-list">
            <div class="empty-state">
              <div class="empty-icon">🌿</div>
              <p>No nursery records yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 2. Transplanting Management ── -->
      <div id="prod-transplant" class="prod-subcontent">
        <div class="add-panel">
          <div class="section-heading">🪴 Transplanting Record</div>
          <form id="transplant-form">
            <div class="form-grid">
              <div class="form-group">
                <label for="tr-date">Date Transplanted *</label>
                <input type="date" id="tr-date" required />
              </div>
              <div class="form-group">
                <label for="tr-location">Farm Location *</label>
                <input type="text" id="tr-location" placeholder="e.g. Site A" required />
              </div>
              <div class="form-group">
                <label for="tr-field">Field / Block *</label>
                <input type="text" id="tr-field" placeholder="e.g. Block B, Field 3" required />
              </div>
              <div class="form-group">
                <label for="tr-crop-type">Crop Type *</label>
                <input type="text" id="tr-crop-type" placeholder="e.g. Tomato, Cabbage" required />
              </div>
              <div class="form-group">
                <label for="tr-seedlings">Number of Seedlings *</label>
                <input type="number" id="tr-seedlings" placeholder="e.g. 5000" required />
              </div>
              <div class="form-group">
                <label for="tr-spacing">Spacing Used</label>
                <input type="text" id="tr-spacing" placeholder="e.g. 60cm x 30cm" />
              </div>
              <div class="form-group">
                <label for="tr-personnel">Responsible Personnel</label>
                <input type="text" id="tr-personnel" placeholder="e.g. John, Team A" />
              </div>
              <div class="form-group">
                <label for="tr-success">Success Rate (%)</label>
                <input type="text" id="tr-success" placeholder="e.g. 92%, 95%" />
              </div>
              <div class="form-group">
                <label for="tr-establishment">Field Establishment Status</label>
                <select id="tr-establishment">
                  <option value="">— Not assessed —</option>
                  <option value="Excellent — >95% survival">🟢 Excellent — >95% survival</option>
                  <option value="Good — 80-95% survival">🔵 Good — 80-95%</option>
                  <option value="Fair — 60-80% survival">🟡 Fair — 60-80%</option>
                  <option value="Poor — <60% survival">🔴 Poor — <60%< /option>
                </select>
              </div>
              <div class="form-group">
                <label for="tr-status">Status *</label>
                <select id="tr-status" required>
                  <option value="Planned">📋 Planned</option>
                  <option value="Scheduled">📅 Scheduled</option>
                  <option value="In Progress">⚙️ In Progress</option>
                  <option value="Completed" selected>✅ Completed</option>
                  <option value="Delayed">⏰ Delayed</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label for="tr-notes">Notes</label>
                <textarea id="tr-notes" placeholder="Additional notes, challenges encountered…"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary"
                style="background:linear-gradient(135deg,#448aff,#1565c0);">🪴 Save Transplant Record</button>
              <button type="reset" class="btn btn-secondary"
                onclick="document.getElementById('tr-date').value=today()">Clear</button>
            </div>
          </form>
        </div>
        <div class="panel" style="margin-top:20px;">
          <div class="panel-header">
            <div class="panel-title">🪴 Transplanting Records</div>
            <select class="filter-select" id="tr-filter-status">
              <option value="all">All Status</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
          <div class="panel-body" id="transplant-list">
            <div class="empty-state">
              <div class="empty-icon">🪴</div>
              <p>No transplanting records yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 3. Fertilizer Application ── -->
      <div id="prod-fertilizer" class="prod-subcontent">
        <div class="add-panel">
          <div class="section-heading">🧪 Fertilizer Application</div>
          <form id="fertilizer-form">
            <div class="form-grid">
              <div class="form-group">
                <label for="fert-date">Application Date *</label>
                <input type="date" id="fert-date" required />
              </div>
              <div class="form-group">
                <label for="fert-location">Farm Location *</label>
                <input type="text" id="fert-location" placeholder="e.g. Site A" required />
              </div>
              <div class="form-group">
                <label for="fert-field">Field / Block *</label>
                <input type="text" id="fert-field" placeholder="e.g. Block A, Field 2" required />
              </div>
              <div class="form-group">
                <label for="fert-crop-type">Crop Type</label>
                <input type="text" id="fert-crop-type" placeholder="e.g. Maize, Tomato" />
              </div>
              <div class="form-group">
                <label for="fert-type">Fertilizer Type *</label>
                <select id="fert-type" required>
                  <option value="" disabled selected>— Select type —</option>
                  <option value="Basal (DAP)">Basal — DAP</option>
                  <option value="Basal (NPK)">Basal — NPK</option>
                  <option value="Basal (SSP)">Basal — SSP</option>
                  <option value="Top Dressing (CAN)">Top Dressing — CAN</option>
                  <option value="Top Dressing (Urea)">Top Dressing — Urea</option>
                  <option value="Broadcasting (NPK)">Broadcasting — NPK</option>
                  <option value="Foliar Feeding">Foliar Feeding</option>
                  <option value="Organic (Compost)">Organic — Compost</option>
                  <option value="Organic (Manure)">Organic — Manure</option>
                  <option value="Liquid Fertilizer">Liquid Fertilizer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label for="fert-method">Application Method</label>
                <select id="fert-method">
                  <option value="">— Select method —</option>
                  <option value="Basal Application">Basal Application</option>
                  <option value="Top Dressing">Top Dressing</option>
                  <option value="Broadcasting">Broadcasting</option>
                  <option value="Foliar Spray">Foliar Spray</option>
                  <option value="Fertigation">Fertigation (via Irrigation)</option>
                  <option value="Banding">Banding</option>
                </select>
              </div>
              <div class="form-group">
                <label for="fert-qty">Quantity Applied *</label>
                <input type="text" id="fert-qty" placeholder="e.g. 50kg, 10L" required />
              </div>
              <div class="form-group">
                <label for="fert-applied-by">Applied By</label>
                <input type="text" id="fert-applied-by" placeholder="e.g. John Mwangi" />
              </div>
              <div class="form-group">
                <label for="fert-next">Next Scheduled Application</label>
                <input type="date" id="fert-next" />
              </div>
              <div class="form-group">
                <label for="fert-status">Status *</label>
                <select id="fert-status" required>
                  <option value="Planned">📋 Planned</option>
                  <option value="Scheduled">📅 Scheduled</option>
                  <option value="In Progress">⚙️ In Progress</option>
                  <option value="Completed" selected>✅ Completed</option>
                  <option value="Delayed">⏰ Delayed</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label for="fert-notes">Notes</label>
                <textarea id="fert-notes" placeholder="Additional notes, observations after application…"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary"
                style="background:linear-gradient(135deg,#ffd740,#f9a825);color:#001;">🧪 Save Fertilizer
                Record</button>
              <button type="reset" class="btn btn-secondary"
                onclick="document.getElementById('fert-date').value=today()">Clear</button>
            </div>
          </form>
        </div>
        <div class="panel" style="margin-top:20px;">
          <div class="panel-header">
            <div class="panel-title">🧪 Fertilizer Application Records</div>
            <select class="filter-select" id="fert-filter-status">
              <option value="all">All Status</option>
              <option value="Planned">Planned</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
          <div class="panel-body" id="fertilizer-list">
            <div class="empty-state">
              <div class="empty-icon">🧪</div>
              <p>No fertilizer records yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 4. Agrochemical Management ── -->
      <div id="prod-agrochem" class="prod-subcontent">
        <div class="add-panel">
          <div class="section-heading">🧬 Agrochemical Application</div>
          <form id="agrochem-form">
            <div class="form-grid">
              <div class="form-group">
                <label for="agro-date">Application Date *</label>
                <input type="date" id="agro-date" required />
              </div>
              <div class="form-group">
                <label for="agro-location">Farm Location *</label>
                <input type="text" id="agro-location" placeholder="e.g. Site A" required />
              </div>
              <div class="form-group">
                <label for="agro-field">Field / Block *</label>
                <input type="text" id="agro-field" placeholder="e.g. Block B" required />
              </div>
              <div class="form-group">
                <label for="agro-chem-type">Chemical Type *</label>
                <select id="agro-chem-type" required>
                  <option value="" disabled selected>— Select type —</option>
                  <option value="Pesticide">🐛 Pesticide</option>
                  <option value="Herbicide">🌿 Herbicide / Weedicide</option>
                  <option value="Fungicide">🍄 Fungicide</option>
                  <option value="Insecticide">🦟 Insecticide</option>
                  <option value="Acaricide">🕷️ Acaricide</option>
                  <option value="Nematicide">🪱 Nematicide</option>
                  <option value="Growth Regulator">🧬 Plant Growth Regulator</option>
                </select>
              </div>
              <div class="form-group">
                <label for="agro-chem-name">Chemical Name *</label>
                <input type="text" id="agro-chem-name" placeholder="e.g. Roundup, Dimethoate" required />
              </div>
              <div class="form-group">
                <label for="agro-active">Active Ingredient</label>
                <input type="text" id="agro-active" placeholder="e.g. Glyphosate 360g/L" />
              </div>
              <div class="form-group">
                <label for="agro-target">Target Pest / Disease / Weed *</label>
                <input type="text" id="agro-target" placeholder="e.g. Armyworm, Fusarium wilt" required />
              </div>
              <div class="form-group">
                <label for="agro-rate">Application Rate</label>
                <input type="text" id="agro-rate" placeholder="e.g. 2L/ha, 15ml/L water" />
              </div>
              <div class="form-group">
                <label for="agro-reentry">Re-Entry Interval</label>
                <input type="text" id="agro-reentry" placeholder="e.g. 24 hours, 48 hours" />
              </div>
              <div class="form-group">
                <label for="agro-preharvest">Pre-Harvest Interval</label>
                <input type="text" id="agro-preharvest" placeholder="e.g. 7 days, 14 days" />
              </div>
              <div class="form-group">
                <label for="agro-next-spray">Next Spray Date</label>
                <input type="date" id="agro-next-spray" />
              </div>
              <div class="form-group">
                <label for="agro-applied-by">Applied By</label>
                <input type="text" id="agro-applied-by" placeholder="e.g. Spray crew A" />
              </div>
              <div class="form-group">
                <label for="agro-status">Status *</label>
                <select id="agro-status" required>
                  <option value="Planned">📋 Planned</option>
                  <option value="Scheduled">📅 Scheduled</option>
                  <option value="In Progress">⚙️ In Progress</option>
                  <option value="Completed" selected>✅ Completed</option>
                  <option value="Delayed">⏰ Delayed</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label for="agro-notes">Notes</label>
                <textarea id="agro-notes"
                  placeholder="Weather conditions during spray, equipment used, PPE worn…"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary"
                style="background:linear-gradient(135deg,#ff5252,#b71c1c);">🧬 Save Agrochem Record</button>
              <button type="reset" class="btn btn-secondary"
                onclick="document.getElementById('agro-date').value=today()">Clear</button>
            </div>
          </form>
        </div>
        <div class="panel" style="margin-top:20px;">
          <div class="panel-header">
            <div class="panel-title">🧬 Agrochemical Records</div>
            <div style="display:flex;gap:8px;">
              <select class="filter-select" id="agro-filter-type">
                <option value="all">All Types</option>
                <option value="Pesticide">Pesticide</option>
                <option value="Herbicide">Herbicide</option>
                <option value="Fungicide">Fungicide</option>
                <option value="Insecticide">Insecticide</option>
              </select>
              <select class="filter-select" id="agro-filter-status">
                <option value="all">All Status</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>
          </div>
          <div class="panel-body" id="agrochem-list">
            <div class="empty-state">
              <div class="empty-icon">🧬</div>
              <p>No agrochemical records yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 5. Weeding ── -->
      <div id="prod-weeding" class="prod-subcontent">
        <div class="add-panel">
          <div class="section-heading">🌾 Weeding Operation</div>
          <form id="weeding-form">
            <div class="form-grid">
              <div class="form-group">
                <label for="weed-date">Date *</label>
                <input type="date" id="weed-date" required />
              </div>
              <div class="form-group">
                <label for="weed-location">Farm Location *</label>
                <input type="text" id="weed-location" placeholder="e.g. Site A" required />
              </div>
              <div class="form-group">
                <label for="weed-field">Field / Block *</label>
                <input type="text" id="weed-field" placeholder="e.g. Block C" required />
              </div>
              <div class="form-group">
                <label for="weed-method">Weeding Method *</label>
                <select id="weed-method" required>
                  <option value="" disabled selected>— Select method —</option>
                  <option value="Manual (Hand weeding)">✋ Manual — Hand Weeding</option>
                  <option value="Mechanical (Cultivator)">🚜 Mechanical — Cultivator</option>
                  <option value="Mechanical (Tractor)">🚜 Mechanical — Tractor</option>
                  <option value="Chemical (Herbicide)">🧪 Chemical — Herbicide</option>
                  <option value="Mulching">🌿 Mulching</option>
                  <option value="Combined">🔄 Combined Methods</option>
                </select>
              </div>
              <div class="form-group">
                <label for="weed-labor">Labor Used</label>
                <input type="text" id="weed-labor" placeholder="e.g. 10 workers, 2 tractor hrs" />
              </div>
              <div class="form-group">
                <label for="weed-area">Area Covered</label>
                <input type="text" id="weed-area" placeholder="e.g. 2 acres, 0.5 ha" />
              </div>
              <div class="form-group">
                <label for="weed-next">Next Weeding Date</label>
                <input type="date" id="weed-next" />
              </div>
              <div class="form-group">
                <label for="weed-status">Status *</label>
                <select id="weed-status" required>
                  <option value="Planned">📋 Planned</option>
                  <option value="Scheduled">📅 Scheduled</option>
                  <option value="In Progress">⚙️ In Progress</option>
                  <option value="Completed" selected>✅ Completed</option>
                  <option value="Delayed">⏰ Delayed</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label for="weed-notes">Notes</label>
                <textarea id="weed-notes" placeholder="Weed species noted, challenges, outcome…"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary"
                style="background:linear-gradient(135deg,#00b0ff,#006699);">🌾 Save Weeding Record</button>
              <button type="reset" class="btn btn-secondary"
                onclick="document.getElementById('weed-date').value=today()">Clear</button>
            </div>
          </form>
        </div>
        <div class="panel" style="margin-top:20px;">
          <div class="panel-header">
            <div class="panel-title">🌾 Weeding Records</div>
            <select class="filter-select" id="weed-filter-status">
              <option value="all">All Status</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
          <div class="panel-body" id="weeding-list">
            <div class="empty-state">
              <div class="empty-icon">🌾</div>
              <p>No weeding records yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 6. Crop Monitoring ── -->
      <div id="prod-monitoring" class="prod-subcontent">
        <div class="add-panel">
          <div class="section-heading">👁 Crop Monitoring & Follow-up</div>
          <form id="monitoring-form">
            <div class="form-grid">
              <div class="form-group">
                <label for="mon-date">Monitoring Date *</label>
                <input type="date" id="mon-date" required />
              </div>
              <div class="form-group">
                <label for="mon-location">Farm Location *</label>
                <input type="text" id="mon-location" placeholder="e.g. Site A" required />
              </div>
              <div class="form-group">
                <label for="mon-field">Field / Block *</label>
                <input type="text" id="mon-field" placeholder="e.g. Block D" required />
              </div>
              <div class="form-group">
                <label for="mon-crop-type">Crop Type</label>
                <input type="text" id="mon-crop-type" placeholder="e.g. Maize, Tomato" />
              </div>
              <div class="form-group">
                <label for="mon-growth-stage">Growth Stage</label>
                <select id="mon-growth-stage">
                  <option value="">— Select stage —</option>
                  <option value="Germination">🌱 Germination</option>
                  <option value="Seedling">🌿 Seedling</option>
                  <option value="Vegetative">🍃 Vegetative</option>
                  <option value="Flowering">🌸 Flowering</option>
                  <option value="Fruiting">🍅 Fruiting / Grain Filling</option>
                  <option value="Maturation">🌾 Maturation</option>
                  <option value="Ready for Harvest">🚜 Ready for Harvest</option>
                </select>
              </div>
              <div class="form-group">
                <label for="mon-health">Plant Health Observation</label>
                <select id="mon-health">
                  <option value="">— Assess health —</option>
                  <option value="Excellent — No issues">🟢 Excellent — No Issues</option>
                  <option value="Good — Minor issues">🔵 Good — Minor Issues</option>
                  <option value="Fair — Needs attention">🟡 Fair — Needs Attention</option>
                  <option value="Poor — Serious problems">🔴 Poor — Serious Problems</option>
                </select>
              </div>
              <div class="form-group">
                <label for="mon-disease">Disease Incidence</label>
                <input type="text" id="mon-disease" placeholder="e.g. Blight — 10% of plants, None" />
              </div>
              <div class="form-group">
                <label for="mon-pest">Pest Infestation</label>
                <input type="text" id="mon-pest" placeholder="e.g. Armyworm — moderate, None" />
              </div>
              <div class="form-group">
                <label for="mon-weather">Weather-Related Impacts</label>
                <input type="text" id="mon-weather" placeholder="e.g. Drought stress, Flooding, Hailstorm damage" />
              </div>
              <div class="form-group">
                <label for="mon-status">Status</label>
                <select id="mon-status">
                  <option value="Completed" selected>✅ Completed</option>
                  <option value="In Progress">⚙️ In Progress</option>
                  <option value="Planned">📋 Planned</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label for="mon-notes">Detailed Notes & Recommendations</label>
                <textarea id="mon-notes" placeholder="Observations, recommended actions, follow-up needed…"></textarea>
              </div>
              <div class="form-group form-full">
                <label>Field Photo <span style="color:var(--text-muted);font-weight:400;">(optional)</span></label>
                <input type="file" id="mon-photo" accept="image/*" capture="environment"
                  style="background:rgba(255,255,255,0.06);border:1px solid var(--glass-border);border-radius:8px;padding:8px;color:var(--text-primary);" />
                <img id="mon-photo-preview" style="max-width:100%;margin-top:10px;border-radius:8px;display:none;" />
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary"
                style="background:linear-gradient(135deg,#69f0ae,#00897b);color:#001;">👁 Save Monitoring Log</button>
              <button type="reset" class="btn btn-secondary"
                onclick="document.getElementById('mon-date').value=today();document.getElementById('mon-photo-preview').style.display='none';">Clear</button>
            </div>
          </form>
        </div>
        <div class="panel" style="margin-top:20px;">
          <div class="panel-header">
            <div class="panel-title">👁 Crop Monitoring Logs</div>
            <input class="search-box" type="text" id="mon-search" placeholder="🔍 Search…" style="max-width:200px;" />
          </div>
          <div class="panel-body" id="monitoring-list">
            <div class="empty-state">
              <div class="empty-icon">👁</div>
              <p>No monitoring logs yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 7. Harvesting Management ── -->
      <div id="prod-harvest" class="prod-subcontent">
        <div class="add-panel">
          <div class="section-heading">🚜 Harvest Record</div>
          <form id="harvest-form">
            <div class="form-grid">
              <div class="form-group">
                <label for="har-date">Harvest Date *</label>
                <input type="date" id="har-date" required />
              </div>
              <div class="form-group">
                <label for="har-location">Farm Location *</label>
                <input type="text" id="har-location" placeholder="e.g. Site A" required />
              </div>
              <div class="form-group">
                <label for="har-field">Field / Block *</label>
                <input type="text" id="har-field" placeholder="e.g. Block E, Field 1" required />
              </div>
              <div class="form-group">
                <label for="har-crop-type">Crop Harvested *</label>
                <input type="text" id="har-crop-type" placeholder="e.g. Tomato, Maize" required />
              </div>
              <div class="form-group">
                <label for="har-quantity">Quantity Harvested *</label>
                <input type="text" id="har-quantity" placeholder="e.g. 500, 1200" required />
              </div>
              <div class="form-group">
                <label for="har-unit">Unit</label>
                <select id="har-unit">
                  <option value="kg">kg</option>
                  <option value="tonnes">tonnes</option>
                  <option value="bags (90kg)">bags (90kg)</option>
                  <option value="bags (50kg)">bags (50kg)</option>
                  <option value="crates">crates</option>
                  <option value="boxes">boxes</option>
                  <option value="litres">litres</option>
                  <option value="bunches">bunches</option>
                  <option value="pieces">pieces</option>
                </select>
              </div>
              <div class="form-group">
                <label for="har-grade">Grade / Quality</label>
                <select id="har-grade">
                  <option value="">— Not graded —</option>
                  <option value="Grade A — Export quality">Grade A — Export Quality</option>
                  <option value="Grade B — Local market">Grade B — Local Market</option>
                  <option value="Grade C — Processing">Grade C — Processing</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
              <div class="form-group">
                <label for="har-losses">Losses Recorded</label>
                <input type="text" id="har-losses" placeholder="e.g. 5%, 50kg due to rot" />
              </div>
              <div class="form-group">
                <label for="har-cycle">Harvest Cycle</label>
                <select id="har-cycle">
                  <option value="Cycle 1">Cycle 1 — First Harvest</option>
                  <option value="Cycle 2">Cycle 2 — Second Harvest</option>
                  <option value="Cycle 3">Cycle 3 — Third Harvest</option>
                  <option value="Cycle 4">Cycle 4</option>
                  <option value="Cycle 5">Cycle 5</option>
                  <option value="Final Harvest">Final Harvest</option>
                </select>
              </div>
              <div class="form-group">
                <label for="har-status">Status *</label>
                <select id="har-status" required>
                  <option value="Planned">📋 Planned</option>
                  <option value="Scheduled">📅 Scheduled</option>
                  <option value="In Progress">⚙️ In Progress</option>
                  <option value="Completed" selected>✅ Completed</option>
                  <option value="Delayed">⏰ Delayed</option>
                </select>
              </div>
              <div class="form-group form-full">
                <label for="har-notes">Notes</label>
                <textarea id="har-notes"
                  placeholder="Market destination, post-harvest handling, storage notes…"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary"
                style="background:linear-gradient(135deg,#ea80fc,#8e24aa);">🚜 Save Harvest Record</button>
              <button type="reset" class="btn btn-secondary"
                onclick="document.getElementById('har-date').value=today()">Clear</button>
            </div>
          </form>
        </div>
        <div class="panel" style="margin-top:20px;">
          <div class="panel-header">
            <div class="panel-title">🚜 Harvest Records</div>
            <input class="search-box" type="text" id="har-search" placeholder="🔍 Search…" style="max-width:200px;" />
          </div>
          <div class="panel-body" id="harvest-list">
            <div class="empty-state">
              <div class="empty-icon">🚜</div>
              <p>No harvest records yet.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
    <!-- ══════════ HISTORY ══════════ -->
    <div id="history" class="tab-content">
      <div class="panel" style="border-top:none;border-radius:0 var(--radius) var(--radius) var(--radius);">
        <div class="table-controls">
          <input class="search-box" id="histSearch" type="text" placeholder="🔍  Search by category, notes, date…" />
          <select class="filter-select" id="histFilter">
            <option value="all">All Records</option>
            <option value="investments">Expenses Only</option>
            <option value="cashinflows">Income Only</option>
            <option value="assets">Assets Only</option>
          </select>
        </div>
        <div class="table-wrap" style="padding:16px 24px;">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Location</th>
                <th>Type</th>
                <th>Payment</th>
                <th>Category</th>
                <th>Amount (TZS)</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="histBody">
              <tr>
                <td colspan="8">
                  <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>Connect your Google Sheet to load records.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </main>

  <!-- ══════════ TOAST ══════════ -->
  <div id="toast"></div>

  <script src="script.js"></script>
</body>

</html>
