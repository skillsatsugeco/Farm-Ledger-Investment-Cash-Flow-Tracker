// ══════════════════════════════════════════════════
//  freshBABA FARMS — Google Apps Script Backend
//  Deploy as: Web App → Execute as: Me → Access: Anyone
// ══════════════════════════════════════════════════

const SHEET_NAME_INV   = 'Investments';
const SHEET_NAME_CASH  = 'CashInflows';
const SHEET_NAME_SCOUT = 'FieldScouting';
const SHEET_NAME_ASSET = 'Assets';

const HEADERS_INV   = ['ID', 'Date', 'Location', 'Category', 'PaymentType', 'Amount', 'Notes', 'Deleted'];
const HEADERS_CASH  = ['ID', 'Date', 'Location', 'Category', 'SaleType', 'Amount', 'Notes', 'Deleted'];
const HEADERS_SCOUT = ['ID', 'Date', 'Location', 'Observation', 'PhotoUrl', 'AudioUrl', 'Deleted'];
const HEADERS_ASSET = ['ID', 'Date', 'Location', 'Name', 'Category', 'Value', 'Condition', 'Notes', 'PhotoUrl', 'Deleted'];

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

// ── GET — load all records ─────────────────────────
function doGet() {
  try {
    const invSheet   = getOrCreateSheet(SHEET_NAME_INV,   HEADERS_INV);
    const cashSheet  = getOrCreateSheet(SHEET_NAME_CASH,  HEADERS_CASH);
    const scoutSheet = getOrCreateSheet(SHEET_NAME_SCOUT, HEADERS_SCOUT);
    const assetSheet = getOrCreateSheet(SHEET_NAME_ASSET, HEADERS_ASSET);

    return corsResponse({
      success:     true,
      investments: mapInvestmentRows(invSheet),
      cashInflows: mapCashInflowRows(cashSheet),
      scouting:    mapScoutingRows(scoutSheet),
      assets:      mapAssetRows(assetSheet),
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

    // ── Delete ─────────────────────────────────────
    if (action === 'delete') {
      let sheetName, headers, deletedCol;
      if (body.type === 'investment') {
        sheetName = SHEET_NAME_INV; headers = HEADERS_INV; deletedCol = 8;
      } else if (body.type === 'cashinflow') {
        sheetName = SHEET_NAME_CASH; headers = HEADERS_CASH; deletedCol = 8;
      } else if (body.type === 'asset') {
        sheetName = SHEET_NAME_ASSET; headers = HEADERS_ASSET; deletedCol = 10;
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
