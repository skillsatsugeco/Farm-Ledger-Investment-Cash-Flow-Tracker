// ══════════════════════════════════════════════════
//  freshBABA FARMS — Google Apps Script Backend
//  Deploy as: Web App → Execute as: Me → Access: Anyone
// ══════════════════════════════════════════════════

const SHEET_NAME_INV       = 'Investments';
const SHEET_NAME_CASH      = 'CashInflows';
const SHEET_NAME_SCOUT     = 'FieldScouting';
const SHEET_NAME_ASSET     = 'Assets';
const SHEET_NAME_TODO      = 'FarmToDo';
// ── Production Activity Sheets ──
const SHEET_NAME_NURSERY   = 'Prod_Nursery';
const SHEET_NAME_TRANSPLANT= 'Prod_Transplant';
const SHEET_NAME_FERTILIZER= 'Prod_Fertilizer';
const SHEET_NAME_AGROCHEM  = 'Prod_Agrochem';
const SHEET_NAME_WEEDING   = 'Prod_Weeding';
const SHEET_NAME_MONITORING= 'Prod_Monitoring';
const SHEET_NAME_HARVEST   = 'Prod_Harvest';

const HEADERS_INV        = ['ID', 'Date', 'Location', 'Category', 'PaymentType', 'Amount', 'Notes', 'Deleted'];
const HEADERS_CASH       = ['ID', 'Date', 'Location', 'Category', 'SaleType', 'Amount', 'Notes', 'Deleted'];
const HEADERS_SCOUT      = ['ID', 'Date', 'Location', 'Observation', 'PhotoUrl', 'AudioUrl', 'Deleted'];
const HEADERS_ASSET      = ['ID', 'Date', 'Location', 'Name', 'Category', 'Value', 'Condition', 'Notes', 'PhotoUrl', 'Deleted'];
const HEADERS_TODO       = ['ID', 'Task', 'Goal', 'Urgency', 'Location', 'DueDate', 'PostponeTo', 'Status', 'Notes', 'CreatedDate', 'Deleted'];
// ── Production Headers ──
const HEADERS_NURSERY    = ['ID','Date','Location','CropType','Variety','SeedSource','NurseryLocation','QuantitySeeds','ActivityType','FungicideUsed','PesticideUsed','WateringSchedule','ShadeManagement','HealthStatus','Observations','NextActionDate','Status','Notes','CreatedDate','Deleted'];
const HEADERS_TRANSPLANT = ['ID','Date','Location','Field','CropType','SeedlingsCount','Spacing','Personnel','SuccessRate','EstablishmentStatus','Status','Notes','CreatedDate','Deleted'];
const HEADERS_FERTILIZER = ['ID','Date','Location','Field','CropType','FertilizerType','ApplicationMethod','QuantityApplied','AppliedBy','NextScheduledDate','Status','Notes','CreatedDate','Deleted'];
const HEADERS_AGROCHEM   = ['ID','Date','Location','Field','ChemicalName','ActiveIngredient','ChemicalType','TargetPestDiseaseWeed','ApplicationRate','ReEntryInterval','PreHarvestInterval','NextSprayDate','AppliedBy','Status','Notes','CreatedDate','Deleted'];
const HEADERS_WEEDING    = ['ID','Date','Location','Field','Method','LaborUsed','AreaCovered','NextWeedingDate','Status','Notes','CreatedDate','Deleted'];
const HEADERS_MONITORING = ['ID','Date','Location','Field','CropType','GrowthStage','HealthObservation','DiseaseIncidence','PestInfestation','WeatherImpact','PhotoUrl','Status','Notes','CreatedDate','Deleted'];
const HEADERS_HARVEST    = ['ID','HarvestDate','Location','Field','CropType','QuantityHarvested','Unit','Grade','LossesRecorded','HarvestCycle','Status','Notes','CreatedDate','Deleted'];

// ── Helpers ───────────────────────────────────────
function authorize() {
  DriveApp.getRootFolder();
  var dummy = DriveApp.createFolder("dummy_auth_folder");
  dummy.setTrashed(true);
  SpreadsheetApp.getActiveSpreadsheet();
}

function getWorkingSpreadsheet() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;

  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) {}
  }

  ss = SpreadsheetApp.create('freshBABA FARMS Database');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function getOrCreateSheet(name, headers) {
  const ss = getWorkingSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#2d4a2d')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else {
    // ── Auto-Migration for Legacy Headers ──
    const existingHeaderValues = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    const existingHeaderLabels = existingHeaderValues.map(h => String(h).trim().toLowerCase());
    
    // Check if the 5th column (index 4) is 'amount' (the old layout). If so, we need to insert the Payment/Sale type column.
    if (name === SHEET_NAME_INV && existingHeaderLabels[4] === 'amount') {
      sheet.insertColumnAfter(4); // Inserts empty Column E
      sheet.getRange(1, 5).setValue('PaymentType'); // Set new header in E
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#2d4a2d')
        .setFontColor('#ffffff');
    }
    else if (name === SHEET_NAME_CASH && existingHeaderLabels[4] === 'amount') {
      sheet.insertColumnAfter(4); // Inserts empty Column E
      sheet.getRange(1, 5).setValue('SaleType'); // Set new header in E
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#2d4a2d')
        .setFontColor('#ffffff');
    }
  }
  return sheet;
}

function corsResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getScoutingFolder() {
  const folderIterator = DriveApp.getFoldersByName('freshBABA_ScoutingFiles');
  if (folderIterator.hasNext()) return folderIterator.next();
  return DriveApp.createFolder('freshBABA_ScoutingFiles');
}

// ── Generic sheet → objects mapper ────────────────
function mapInvestmentRows(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  // Auto-detect layout from header row:
  // OLD: ID, Date, Location, Category, Amount, Notes, Deleted  (col[4]=Amount)
  // NEW: ID, Date, Location, Category, PaymentType, Amount, Notes, Deleted  (col[4]=PaymentType)
  const header = rows[0].map(h => String(h).trim().toLowerCase());
  const isNewLayout = header[4] === 'paymenttype';

  return rows.slice(1)
    .filter(r => {
      const deletedCol = isNewLayout ? r[7] : r[6];
      return deletedCol !== true && deletedCol !== 'TRUE';
    })
    .map(r => ({
      id:          String(r[0] || ''),
      date:        r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[1] || ''),
      location:    String(r[2] || 'Unspecified'),
      category:    String(r[3] || ''),
      paymentType: isNewLayout ? String(r[4] || '') : 'Cash',   // default old rows to Cash
      amount:      isNewLayout ? (parseFloat(r[5]) || 0) : (parseFloat(r[4]) || 0),
      notes:       isNewLayout ? String(r[6] || '') : String(r[5] || ''),
    }));
}

function mapCashInflowRows(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  // Auto-detect layout from header row:
  // OLD: ID, Date, Location, Category, Amount, Notes, Deleted  (col[4]=Amount)
  // NEW: ID, Date, Location, Category, SaleType, Amount, Notes, Deleted  (col[4]=SaleType)
  const header = rows[0].map(h => String(h).trim().toLowerCase());
  const isNewLayout = header[4] === 'saletype';

  return rows.slice(1)
    .filter(r => {
      const deletedCol = isNewLayout ? r[7] : r[6];
      return deletedCol !== true && deletedCol !== 'TRUE';
    })
    .map(r => ({
      id:       String(r[0] || ''),
      date:     r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[1] || ''),
      location: String(r[2] || 'Unspecified'),
      category: String(r[3] || ''),
      saleType: isNewLayout ? String(r[4] || '') : 'Cash Sale',  // default old rows to Cash Sale
      amount:   isNewLayout ? (parseFloat(r[5]) || 0) : (parseFloat(r[4]) || 0),
      notes:    isNewLayout ? String(r[6] || '') : String(r[5] || ''),
    }));
}

function mapScoutingRows(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  // Columns: ID, Date, Location, Observation, PhotoUrl, AudioUrl, Deleted
  return rows.slice(1)
    .filter(r => r[6] !== true && r[6] !== 'TRUE')
    .map(r => ({
      id:          String(r[0] || ''),
      date:        r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[1] || ''),
      location:    String(r[2] || 'Unspecified'),
      observation: String(r[3] || ''),
      photoUrl:    String(r[4] || ''),
      audioUrl:    String(r[5] || ''),
    }));
}

function mapAssetRows(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  // Columns: ID, Date, Location, Name, Category, Value, Condition, Notes, PhotoUrl, Deleted
  return rows.slice(1)
    .filter(r => r[9] !== true && r[9] !== 'TRUE')
    .map(r => ({
      id:        String(r[0] || ''),
      date:      r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[1] || ''),
      location:  String(r[2] || 'Unspecified'),
      name:      String(r[3] || ''),
      category:  String(r[4] || ''),
      value:     parseFloat(r[5]) || 0,
      condition: String(r[6] || ''),
      notes:     String(r[7] || ''),
      photoUrl:  String(r[8] || ''),
    }));
}

function mapTodoRows(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  // Columns: ID, Task, Goal, Urgency, Location, DueDate, PostponeTo, Status, Notes, CreatedDate, Deleted
  return rows.slice(1)
    .filter(r => r[10] !== true && r[10] !== 'TRUE')
    .map(r => ({
      id:          String(r[0] || ''),
      task:        String(r[1] || ''),
      goal:        String(r[2] || ''),
      urgency:     String(r[3] || 'Medium'),
      location:    String(r[4] || ''),
      dueDate:     r[5] instanceof Date ? Utilities.formatDate(r[5], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[5] || ''),
      postponeTo:  r[6] instanceof Date ? Utilities.formatDate(r[6], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[6] || ''),
      status:      String(r[7] || 'Pending'),
      notes:       String(r[8] || ''),
      createdDate: r[9] instanceof Date ? Utilities.formatDate(r[9], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[9] || ''),
    }));
}

// ── Production Mappers ──────────────────────────────
function mapGenericRows(sheet, deletedColIndex, mapFn) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1)
    .filter(r => r[deletedColIndex] !== true && r[deletedColIndex] !== 'TRUE')
    .map(mapFn);
}

function fmtDate(v) {
  return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(v || '');
}

function mapNurseryRows(sheet) {
  return mapGenericRows(sheet, 19, r => ({
    id: String(r[0]||''), date: fmtDate(r[1]), location: String(r[2]||''),
    cropType: String(r[3]||''), variety: String(r[4]||''), seedSource: String(r[5]||''),
    nurseryLocation: String(r[6]||''), quantitySeeds: String(r[7]||''),
    activityType: String(r[8]||''), fungicideUsed: String(r[9]||''),
    pesticideUsed: String(r[10]||''), wateringSchedule: String(r[11]||''),
    shadeManagement: String(r[12]||''), healthStatus: String(r[13]||''),
    observations: String(r[14]||''), nextActionDate: fmtDate(r[15]),
    status: String(r[16]||'Planned'), notes: String(r[17]||''),
    createdDate: fmtDate(r[18]),
  }));
}

function mapTransplantRows(sheet) {
  return mapGenericRows(sheet, 13, r => ({
    id: String(r[0]||''), date: fmtDate(r[1]), location: String(r[2]||''),
    field: String(r[3]||''), cropType: String(r[4]||''),
    seedlingsCount: String(r[5]||''), spacing: String(r[6]||''),
    personnel: String(r[7]||''), successRate: String(r[8]||''),
    establishmentStatus: String(r[9]||''), status: String(r[10]||'Planned'),
    notes: String(r[11]||''), createdDate: fmtDate(r[12]),
  }));
}

function mapFertilizerRows(sheet) {
  return mapGenericRows(sheet, 13, r => ({
    id: String(r[0]||''), date: fmtDate(r[1]), location: String(r[2]||''),
    field: String(r[3]||''), cropType: String(r[4]||''),
    fertilizerType: String(r[5]||''), applicationMethod: String(r[6]||''),
    quantityApplied: String(r[7]||''), appliedBy: String(r[8]||''),
    nextScheduledDate: fmtDate(r[9]), status: String(r[10]||'Planned'),
    notes: String(r[11]||''), createdDate: fmtDate(r[12]),
  }));
}

function mapAgrochemRows(sheet) {
  return mapGenericRows(sheet, 16, r => ({
    id: String(r[0]||''), date: fmtDate(r[1]), location: String(r[2]||''),
    field: String(r[3]||''), chemicalName: String(r[4]||''),
    activeIngredient: String(r[5]||''), chemicalType: String(r[6]||''),
    targetPestDiseaseWeed: String(r[7]||''), applicationRate: String(r[8]||''),
    reEntryInterval: String(r[9]||''), preHarvestInterval: String(r[10]||''),
    nextSprayDate: fmtDate(r[11]), appliedBy: String(r[12]||''),
    status: String(r[13]||'Planned'), notes: String(r[14]||''),
    createdDate: fmtDate(r[15]),
  }));
}

function mapWeedingRows(sheet) {
  return mapGenericRows(sheet, 11, r => ({
    id: String(r[0]||''), date: fmtDate(r[1]), location: String(r[2]||''),
    field: String(r[3]||''), method: String(r[4]||''),
    laborUsed: String(r[5]||''), areaCovered: String(r[6]||''),
    nextWeedingDate: fmtDate(r[7]), status: String(r[8]||'Planned'),
    notes: String(r[9]||''), createdDate: fmtDate(r[10]),
  }));
}

function mapMonitoringRows(sheet) {
  return mapGenericRows(sheet, 14, r => ({
    id: String(r[0]||''), date: fmtDate(r[1]), location: String(r[2]||''),
    field: String(r[3]||''), cropType: String(r[4]||''),
    growthStage: String(r[5]||''), healthObservation: String(r[6]||''),
    diseaseIncidence: String(r[7]||''), pestInfestation: String(r[8]||''),
    weatherImpact: String(r[9]||''), photoUrl: String(r[10]||''),
    status: String(r[11]||'Planned'), notes: String(r[12]||''),
    createdDate: fmtDate(r[13]),
  }));
}

function mapHarvestRows(sheet) {
  return mapGenericRows(sheet, 13, r => ({
    id: String(r[0]||''), harvestDate: fmtDate(r[1]), location: String(r[2]||''),
    field: String(r[3]||''), cropType: String(r[4]||''),
    quantityHarvested: String(r[5]||''), unit: String(r[6]||''),
    grade: String(r[7]||''), lossesRecorded: String(r[8]||''),
    harvestCycle: String(r[9]||''), status: String(r[10]||'Planned'),
    notes: String(r[11]||''), createdDate: fmtDate(r[12]),
  }));
}

// ── GET — load all records ─────────────────────────
function doGet() {
  try {
    const invSheet        = getOrCreateSheet(SHEET_NAME_INV,        HEADERS_INV);
    const cashSheet       = getOrCreateSheet(SHEET_NAME_CASH,       HEADERS_CASH);
    const scoutSheet      = getOrCreateSheet(SHEET_NAME_SCOUT,      HEADERS_SCOUT);
    const assetSheet      = getOrCreateSheet(SHEET_NAME_ASSET,      HEADERS_ASSET);
    const todoSheet       = getOrCreateSheet(SHEET_NAME_TODO,       HEADERS_TODO);
    const nurserySheet    = getOrCreateSheet(SHEET_NAME_NURSERY,    HEADERS_NURSERY);
    const transplantSheet = getOrCreateSheet(SHEET_NAME_TRANSPLANT, HEADERS_TRANSPLANT);
    const fertilizerSheet = getOrCreateSheet(SHEET_NAME_FERTILIZER, HEADERS_FERTILIZER);
    const agrochemSheet   = getOrCreateSheet(SHEET_NAME_AGROCHEM,   HEADERS_AGROCHEM);
    const weedingSheet    = getOrCreateSheet(SHEET_NAME_WEEDING,    HEADERS_WEEDING);
    const monitoringSheet = getOrCreateSheet(SHEET_NAME_MONITORING, HEADERS_MONITORING);
    const harvestSheet    = getOrCreateSheet(SHEET_NAME_HARVEST,    HEADERS_HARVEST);

    return corsResponse({
      success:      true,
      investments:  mapInvestmentRows(invSheet),
      cashInflows:  mapCashInflowRows(cashSheet),
      scouting:     mapScoutingRows(scoutSheet),
      assets:       mapAssetRows(assetSheet),
      todos:        mapTodoRows(todoSheet),
      nursery:      mapNurseryRows(nurserySheet),
      transplanting:mapTransplantRows(transplantSheet),
      fertilizer:   mapFertilizerRows(fertilizerSheet),
      agrochem:     mapAgrochemRows(agrochemSheet),
      weeding:      mapWeedingRows(weedingSheet),
      monitoring:   mapMonitoringRows(monitoringSheet),
      harvest:      mapHarvestRows(harvestSheet),
    });
  } catch (e) {
    return corsResponse({ success: false, error: e.message });
  }
}

// ── POST — add or delete records ───────────────────
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;

    // ── Add Investment / Expense ──────────────────
    if (action === 'add_investment') {
      const sheet = getOrCreateSheet(SHEET_NAME_INV, HEADERS_INV);
      sheet.appendRow([
        body.id, body.date, body.location || '', body.category,
        body.paymentType || 'Cash', body.amount, body.notes || '', false
      ]);
      return corsResponse({ success: true });
    }

    // ── Add Cash Inflow / Income ──────────────────
    if (action === 'add_cashinflow') {
      const sheet = getOrCreateSheet(SHEET_NAME_CASH, HEADERS_CASH);
      sheet.appendRow([
        body.id, body.date, body.location || '', body.category,
        body.saleType || 'Cash Sale', body.amount, body.notes || '', false
      ]);
      return corsResponse({ success: true });
    }

    // ── Add Scouting Log ──────────────────────────
    if (action === 'add_scouting') {
      const sheet = getOrCreateSheet(SHEET_NAME_SCOUT, HEADERS_SCOUT);
      let photoUrl = '';
      let audioUrl = '';

      const folder = getScoutingFolder();

      if (body.photoBase64) {
        try {
          const decoded = Utilities.base64Decode(body.photoBase64.split(',')[1]);
          const blob = Utilities.newBlob(decoded, body.photoMimeType || 'image/jpeg', 'photo_' + body.id + '.jpg');
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          photoUrl = file.getUrl();
        } catch (ex) {
          Logger.log('Photo upload failed: ' + ex.message);
        }
      }

      if (body.audioBase64) {
        try {
          const decoded = Utilities.base64Decode(body.audioBase64.split(',')[1]);
          const blob = Utilities.newBlob(decoded, body.audioMimeType || 'audio/webm', 'audio_' + body.id + '.webm');
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          audioUrl = file.getUrl();
        } catch (ex) {
          Logger.log('Audio upload failed: ' + ex.message);
        }
      }

      sheet.appendRow([body.id, body.date, body.location || '', body.observation, photoUrl, audioUrl, false]);
      return corsResponse({ success: true, photoUrl: photoUrl, audioUrl: audioUrl });
    }

    // ── Add Asset ─────────────────────────────────
    if (action === 'add_asset') {
      const sheet = getOrCreateSheet(SHEET_NAME_ASSET, HEADERS_ASSET);
      let photoUrl = '';

      if (body.photoBase64) {
        try {
          const folder = getScoutingFolder();
          const decoded = Utilities.base64Decode(body.photoBase64.split(',')[1]);
          const blob = Utilities.newBlob(decoded, body.photoMimeType || 'image/jpeg', 'asset_' + body.id + '.jpg');
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          photoUrl = file.getUrl();
        } catch (ex) {
          Logger.log('Asset photo upload failed: ' + ex.message);
        }
      }

      sheet.appendRow([
        body.id, body.date, body.location || '', body.name, body.category,
        body.value, body.condition || 'Fair', body.notes || '', photoUrl, false
      ]);
      return corsResponse({ success: true, photoUrl: photoUrl });
    }

    // ── Add Todo Task ───────────────────────────
    if (action === 'add_todo') {
      const sheet = getOrCreateSheet(SHEET_NAME_TODO, HEADERS_TODO);
      const createdDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sheet.appendRow([
        body.id, body.task, body.goal || '', body.urgency || 'Medium',
        body.location || '', body.dueDate || '', body.postponeTo || '',
        'Pending', body.notes || '', createdDate, false
      ]);
      return corsResponse({ success: true });
    }

    // ── Update Todo Status ────────────────────────
    if (action === 'update_todo_status') {
      const sheet = getOrCreateSheet(SHEET_NAME_TODO, HEADERS_TODO);
      const rows  = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(body.id)) {
          sheet.getRange(i + 1, 8).setValue(body.status);   // col 8 = Status
          if (body.postponeTo) sheet.getRange(i + 1, 7).setValue(body.postponeTo); // col 7 = PostponeTo
          break;
        }
      }
      return corsResponse({ success: true });
    }

    // ── Add Production: Nursery ───────────────────────────
    if (action === 'add_nursery') {
      const sheet = getOrCreateSheet(SHEET_NAME_NURSERY, HEADERS_NURSERY);
      const cd = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sheet.appendRow([body.id, body.date, body.location||'', body.cropType||'', body.variety||'',
        body.seedSource||'', body.nurseryLocation||'', body.quantitySeeds||'',
        body.activityType||'Sowing', body.fungicideUsed||'', body.pesticideUsed||'',
        body.wateringSchedule||'', body.shadeManagement||'', body.healthStatus||'',
        body.observations||'', body.nextActionDate||'', body.status||'Planned',
        body.notes||'', cd, false]);
      return corsResponse({ success: true });
    }

    // ── Add Production: Transplanting ─────────────────────
    if (action === 'add_transplant') {
      const sheet = getOrCreateSheet(SHEET_NAME_TRANSPLANT, HEADERS_TRANSPLANT);
      const cd = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sheet.appendRow([body.id, body.date, body.location||'', body.field||'',
        body.cropType||'', body.seedlingsCount||'', body.spacing||'',
        body.personnel||'', body.successRate||'', body.establishmentStatus||'',
        body.status||'Planned', body.notes||'', cd, false]);
      return corsResponse({ success: true });
    }

    // ── Add Production: Fertilizer ────────────────────────
    if (action === 'add_fertilizer') {
      const sheet = getOrCreateSheet(SHEET_NAME_FERTILIZER, HEADERS_FERTILIZER);
      const cd = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sheet.appendRow([body.id, body.date, body.location||'', body.field||'',
        body.cropType||'', body.fertilizerType||'', body.applicationMethod||'',
        body.quantityApplied||'', body.appliedBy||'', body.nextScheduledDate||'',
        body.status||'Planned', body.notes||'', cd, false]);
      return corsResponse({ success: true });
    }

    // ── Add Production: Agrochemical ──────────────────────
    if (action === 'add_agrochem') {
      const sheet = getOrCreateSheet(SHEET_NAME_AGROCHEM, HEADERS_AGROCHEM);
      const cd = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sheet.appendRow([body.id, body.date, body.location||'', body.field||'',
        body.chemicalName||'', body.activeIngredient||'', body.chemicalType||'',
        body.targetPestDiseaseWeed||'', body.applicationRate||'',
        body.reEntryInterval||'', body.preHarvestInterval||'',
        body.nextSprayDate||'', body.appliedBy||'', body.status||'Planned',
        body.notes||'', cd, false]);
      return corsResponse({ success: true });
    }

    // ── Add Production: Weeding ───────────────────────────
    if (action === 'add_weeding') {
      const sheet = getOrCreateSheet(SHEET_NAME_WEEDING, HEADERS_WEEDING);
      const cd = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sheet.appendRow([body.id, body.date, body.location||'', body.field||'',
        body.method||'', body.laborUsed||'', body.areaCovered||'',
        body.nextWeedingDate||'', body.status||'Planned', body.notes||'', cd, false]);
      return corsResponse({ success: true });
    }

    // ── Add Production: Monitoring ────────────────────────
    if (action === 'add_monitoring') {
      const sheet = getOrCreateSheet(SHEET_NAME_MONITORING, HEADERS_MONITORING);
      const cd = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      let photoUrl = '';
      if (body.photoBase64) {
        try {
          const folder = getScoutingFolder();
          const decoded = Utilities.base64Decode(body.photoBase64.split(',')[1]);
          const blob = Utilities.newBlob(decoded, body.photoMimeType || 'image/jpeg', 'mon_' + body.id + '.jpg');
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          photoUrl = file.getUrl();
        } catch(ex) { Logger.log('Monitoring photo upload failed: ' + ex.message); }
      }
      sheet.appendRow([body.id, body.date, body.location||'', body.field||'',
        body.cropType||'', body.growthStage||'', body.healthObservation||'',
        body.diseaseIncidence||'', body.pestInfestation||'', body.weatherImpact||'',
        photoUrl, body.status||'Completed', body.notes||'', cd, false]);
      return corsResponse({ success: true, photoUrl: photoUrl });
    }

    // ── Add Production: Harvest ───────────────────────────
    if (action === 'add_harvest') {
      const sheet = getOrCreateSheet(SHEET_NAME_HARVEST, HEADERS_HARVEST);
      const cd = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sheet.appendRow([body.id, body.harvestDate||body.date, body.location||'',
        body.field||'', body.cropType||'', body.quantityHarvested||'',
        body.unit||'', body.grade||'', body.lossesRecorded||'',
        body.harvestCycle||'Cycle 1', body.status||'Completed',
        body.notes||'', cd, false]);
      return corsResponse({ success: true });
    }

    // ── Update Production Activity Status ─────────────────
    if (action === 'update_prod_status') {
      const sheetMap = {
        nursery: { name: SHEET_NAME_NURSERY, headers: HEADERS_NURSERY, statusCol: 17 },
        transplant: { name: SHEET_NAME_TRANSPLANT, headers: HEADERS_TRANSPLANT, statusCol: 11 },
        fertilizer: { name: SHEET_NAME_FERTILIZER, headers: HEADERS_FERTILIZER, statusCol: 11 },
        agrochem: { name: SHEET_NAME_AGROCHEM, headers: HEADERS_AGROCHEM, statusCol: 14 },
        weeding: { name: SHEET_NAME_WEEDING, headers: HEADERS_WEEDING, statusCol: 9 },
        monitoring: { name: SHEET_NAME_MONITORING, headers: HEADERS_MONITORING, statusCol: 12 },
        harvest: { name: SHEET_NAME_HARVEST, headers: HEADERS_HARVEST, statusCol: 11 },
      };
      const cfg = sheetMap[body.activityType];
      if (!cfg) return corsResponse({ success: false, error: 'Unknown activityType' });
      const sheet = getOrCreateSheet(cfg.name, cfg.headers);
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(body.id)) {
          sheet.getRange(i + 1, cfg.statusCol).setValue(body.status);
          break;
        }
      }
      return corsResponse({ success: true });
    }

    // ── Delete ─────────────────────────────────────
    if (action === 'delete') {
      let sheetName, headers, deletedCol;
      if (body.type === 'investment') {
        sheetName = SHEET_NAME_INV; headers = HEADERS_INV; deletedCol = 8;
      } else if (body.type === 'cashinflow') {
        sheetName = SHEET_NAME_CASH; headers = HEADERS_CASH; deletedCol = 8;
      } else if (body.type === 'asset') {
        sheetName = SHEET_NAME_ASSET; headers = HEADERS_ASSET; deletedCol = 10;
      } else if (body.type === 'todo') {
        sheetName = SHEET_NAME_TODO; headers = HEADERS_TODO; deletedCol = 11;
      } else if (body.type === 'nursery') {
        sheetName = SHEET_NAME_NURSERY; headers = HEADERS_NURSERY; deletedCol = 20;
      } else if (body.type === 'transplant') {
        sheetName = SHEET_NAME_TRANSPLANT; headers = HEADERS_TRANSPLANT; deletedCol = 14;
      } else if (body.type === 'fertilizer') {
        sheetName = SHEET_NAME_FERTILIZER; headers = HEADERS_FERTILIZER; deletedCol = 14;
      } else if (body.type === 'agrochem') {
        sheetName = SHEET_NAME_AGROCHEM; headers = HEADERS_AGROCHEM; deletedCol = 17;
      } else if (body.type === 'weeding') {
        sheetName = SHEET_NAME_WEEDING; headers = HEADERS_WEEDING; deletedCol = 12;
      } else if (body.type === 'monitoring') {
        sheetName = SHEET_NAME_MONITORING; headers = HEADERS_MONITORING; deletedCol = 15;
      } else if (body.type === 'harvest') {
        sheetName = SHEET_NAME_HARVEST; headers = HEADERS_HARVEST; deletedCol = 14;
      } else {
        sheetName = SHEET_NAME_SCOUT; headers = HEADERS_SCOUT; deletedCol = 7;
      }

      const sheet = getOrCreateSheet(sheetName, headers);
      const rows  = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(body.id)) {
          sheet.getRange(i + 1, deletedCol).setValue(true);
          break;
        }
      }
      return corsResponse({ success: true });
    }

    return corsResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (e) {
    return corsResponse({ success: false, error: e.message });
  }
}

// ── Google Forms Integration ───────────────────────
function setupForms() {
  const ss = getWorkingSpreadsheet();

  const invForm = FormApp.create('freshBABA FARMS - Add Expense');
  invForm.setDescription('Record a new farm expense / investment.');
  invForm.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  invForm.addDateItem().setTitle('Date').setRequired(true);
  invForm.addTextItem().setTitle('Site / Location').setRequired(true);
  invForm.addTextItem().setTitle('Amount (TZS)').setRequired(true);
  invForm.addListItem().setTitle('Payment Type').setRequired(true).setChoiceValues(['Cash', 'Credit / On Account']);
  const invCat = invForm.addListItem().setTitle('Category').setRequired(true);
  invCat.setChoiceValues([
    'Seeds', 'Fertilizer (Basal)', 'Fertilizer (Top Dressing)', 'Pesticides',
    'Herbicides / Weedicides', 'Fungicides', 'Irrigation', 'Land Rent / Lease',
    'Land Preparation', 'Soil Testing', 'Planting Labor', 'Weeding Labor',
    'Harvesting Labor', 'General Farm Labor', 'Supervisory Wages', 'Equipment Purchase',
    'Equipment Rental (Tractor)', 'Equipment Rental (Other)', 'Tools & Small Equipment',
    'Equipment Repair & Maintenance', 'Fuel & Lubricants', 'Animal Purchase',
    'Animal Feed', 'Veterinary Services', 'Vaccines & Medicine', 'Livestock Housing',
    'Transport (Inputs)', 'Transport (Produce)', 'Packaging & Storage',
    'Cold Storage / Warehouse', 'Loan Interest / Repayment', 'Insurance Premium',
    'Permit & License Fees', 'Extension / Consultancy Services', 'Training & Capacity Building',
    'Fence Construction', 'Store / Shed Construction', 'Water System Installation', 'Other'
  ]);
  invForm.addParagraphTextItem().setTitle('Notes');

  const cashForm = FormApp.create('freshBABA FARMS - Add Income');
  cashForm.setDescription('Record a new farm income / cash inflow.');
  cashForm.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  cashForm.addDateItem().setTitle('Date').setRequired(true);
  cashForm.addTextItem().setTitle('Site / Location').setRequired(true);
  cashForm.addTextItem().setTitle('Amount (TZS)').setRequired(true);
  cashForm.addListItem().setTitle('Sale Type').setRequired(true).setChoiceValues(['Cash Sale', 'Credit Sale']);
  const cashCat = cashForm.addListItem().setTitle('Category').setRequired(true);
  cashCat.setChoiceValues([
    'Maize Sale', 'Rice Sale', 'Wheat Sale', 'Cassava Sale', 'Sweet Potato Sale',
    'Irish Potato Sale', 'Sunflower Sale', 'Sorghum Sale', 'Millet Sale',
    'Beans / Legumes Sale', 'Groundnut Sale', 'Sesame Sale', 'Cotton Sale',
    'Tobacco Sale', 'Sugarcane Sale', 'Vegetables Sale', 'Fruits Sale',
    'Other Crop Sale', 'Cattle Sale', 'Goat / Sheep Sale', 'Pig Sale',
    'Poultry / Chicken Sale', 'Eggs Sale', 'Milk / Dairy Sale',
    'Fish / Aquaculture Sale', 'Equipment Rental Income', 'Land Rental Income',
    'By-Product Sale (Straw, Husks)', 'Processed Product Sale',
    'Government Subsidy', 'NGO / Development Grant', 'Loan Received',
    'Insurance Claim Payout', 'Advance Payment from Buyer', 'Other Income'
  ]);
  cashForm.addParagraphTextItem().setTitle('Notes');

  ScriptApp.newTrigger('onFormSubmitHandler')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  const msg = 'Forms created! Expenses and Income forms have been added.';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}

function onFormSubmitHandler(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const formValues = e.namedValues;
  if (!formValues) return;

  const date = formValues['Date'] ? formValues['Date'][0] : '';
  const location = formValues['Site / Location'] ? formValues['Site / Location'][0] : '';
  const amount = formValues['Amount (TZS)'] ? formValues['Amount (TZS)'][0] : '';
  const category = formValues['Category'] ? formValues['Category'][0] : '';
  const notes = formValues['Notes'] ? formValues['Notes'][0] : '';
  const id = new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 6);

  if (sheetName.toLowerCase().includes('investment') || sheetName.toLowerCase().includes('expense')) {
    const paymentType = formValues['Payment Type'] ? formValues['Payment Type'][0] : 'Cash';
    const targetSheet = getOrCreateSheet(SHEET_NAME_INV, HEADERS_INV);
    targetSheet.appendRow([id, date, location, category, paymentType, amount, notes, false]);
  } else if (sheetName.toLowerCase().includes('inflow') || sheetName.toLowerCase().includes('cash') || sheetName.toLowerCase().includes('income')) {
    const saleType = formValues['Sale Type'] ? formValues['Sale Type'][0] : 'Cash Sale';
    const targetSheet = getOrCreateSheet(SHEET_NAME_CASH, HEADERS_CASH);
    targetSheet.appendRow([id, date, location, category, saleType, amount, notes, false]);
  }
}
