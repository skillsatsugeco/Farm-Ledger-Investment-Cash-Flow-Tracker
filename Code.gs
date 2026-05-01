// ══════════════════════════════════════════════════
//  freshBABA FARMS — Google Apps Script Backend
//  Deploy as: Web App → Execute as: Me → Access: Anyone
// ══════════════════════════════════════════════════

const SHEET_NAME_INV  = 'Investments';
const SHEET_NAME_CASH = 'CashInflows';
const SHEET_NAME_SCOUT = 'FieldScouting';

const HEADERS_INV     = ['ID', 'Date', 'Location', 'Category', 'Amount', 'Notes', 'Deleted'];
const HEADERS_CASH    = ['ID', 'Date', 'Location', 'Category', 'Amount', 'Notes', 'Deleted'];
const HEADERS_SCOUT   = ['ID', 'Date', 'Location', 'Observations', 'PhotoUrl', 'AudioUrl', 'Deleted'];

// ── Helpers ───────────────────────────────────────
function authorize() {
  // Run this function manually in the Apps Script editor to grant Drive permissions
  DriveApp.getRootFolder();
  // Force full drive access by creating and deleting a dummy folder
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
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {}
  }
  
  // If no active sheet and no stored ID, create a new spreadsheet
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

function sheetToObjects(sheet, headers) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1)
    .filter(r => r[6] !== true && r[6] !== 'TRUE' && r[6] !== true)  // exclude deleted
    .map(r => ({
      id:       r[0],
      date:     r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : r[1],
      location: r[2] || 'Unspecified',
      category: r[3],
      amount:   parseFloat(r[4]) || 0,
      notes:    r[5] || '',
    }));
}

function corsResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET — load all records ─────────────────────────
function doGet() {
  try {
    const invSheet  = getOrCreateSheet(SHEET_NAME_INV,  HEADERS_INV);
    const cashSheet = getOrCreateSheet(SHEET_NAME_CASH, HEADERS_CASH);
    const scoutSheet = getOrCreateSheet(SHEET_NAME_SCOUT, HEADERS_SCOUT);
    
    // Custom mapper for scouting sheet
    const scoutData = sheetToObjects(scoutSheet, HEADERS_SCOUT).map(r => ({
      ...r,
      observation: r.Category, // Using Category field from generic mapper for pos 3
      photoUrl: r.Amount || '', // Using Amount field from generic mapper for pos 4
      audioUrl: r.Notes || ''   // Using Notes field from generic mapper for pos 5
    }));

    return corsResponse({
      success: true,
      investments: sheetToObjects(invSheet,  HEADERS_INV),
      cashInflows:  sheetToObjects(cashSheet, HEADERS_CASH),
      scouting: scoutData,
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

    if (action === 'add_investment') {
      const sheet = getOrCreateSheet(SHEET_NAME_INV, HEADERS_INV);
      sheet.appendRow([body.id, body.date, body.location || '', body.category, body.amount, body.notes || '', false]);
      return corsResponse({ success: true });
    }

    if (action === 'add_cashinflow') {
      const sheet = getOrCreateSheet(SHEET_NAME_CASH, HEADERS_CASH);
      sheet.appendRow([body.id, body.date, body.location || '', body.category, body.amount, body.notes || '', false]);
      return corsResponse({ success: true });
    }

    if (action === 'add_scouting') {
      const sheet = getOrCreateSheet(SHEET_NAME_SCOUT, HEADERS_SCOUT);
      let photoUrl = '';
      let audioUrl = '';
      
      let folder;
      const folderIterator = DriveApp.getFoldersByName('freshBABA_ScoutingFiles');
      if (folderIterator.hasNext()) {
        folder = folderIterator.next();
      } else {
        folder = DriveApp.createFolder('freshBABA_ScoutingFiles');
      }

      if (body.photoBase64) {
        try {
          const decoded = Utilities.base64Decode(body.photoBase64.split(',')[1]);
          const blob = Utilities.newBlob(decoded, body.photoMimeType || 'image/jpeg', 'photo_' + body.id + '.jpg');
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          photoUrl = file.getUrl();
        } catch (e) {
          Logger.log('Photo upload failed: ' + e.message);
        }
      }
      
      if (body.audioBase64) {
        try {
          const decoded = Utilities.base64Decode(body.audioBase64.split(',')[1]);
          const blob = Utilities.newBlob(decoded, body.audioMimeType || 'audio/webm', 'audio_' + body.id + '.webm');
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          audioUrl = file.getUrl();
        } catch (e) {
          Logger.log('Audio upload failed: ' + e.message);
        }
      }
      
      sheet.appendRow([body.id, body.date, body.location || '', body.observation, photoUrl, audioUrl, false]);
      return corsResponse({ success: true, photoUrl: photoUrl, audioUrl: audioUrl });
    }

    if (action === 'delete') {
      const sheetName = body.type === 'investment' ? SHEET_NAME_INV :
                        body.type === 'cashinflow' ? SHEET_NAME_CASH :
                        SHEET_NAME_SCOUT;
      const sheet     = getOrCreateSheet(sheetName, HEADERS_INV);
      const rows      = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === body.id) {
          sheet.getRange(i + 1, 7).setValue(true); // mark Deleted = true
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
  
  // 1. Create Investments Form
  const invForm = FormApp.create('freshBABA FARMS - Add Investment');
  invForm.setDescription('Record a new farm investment.');
  invForm.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  
  invForm.addDateItem().setTitle('Date').setRequired(true);
  invForm.addTextItem().setTitle('Site / Location').setRequired(true);
  invForm.addTextItem().setTitle('Amount (TZS)').setRequired(true);
  
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

  // 2. Create Cash Inflows Form
  const cashForm = FormApp.create('freshBABA FARMS - Add Cash Inflow');
  cashForm.setDescription('Record a new farm cash inflow.');
  cashForm.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  
  cashForm.addDateItem().setTitle('Date').setRequired(true);
  cashForm.addTextItem().setTitle('Site / Location').setRequired(true);
  cashForm.addTextItem().setTitle('Amount (TZS)').setRequired(true);
  
  const cashCat = cashForm.addListItem().setTitle('Category').setRequired(true);
  cashCat.setChoiceValues([
    'Maize Sale', 'Rice Sale', 'Wheat Sale', 'Cassava Sale', 'Sweet Potato Sale', 
    'Irish Potato Sale', 'Sunflower Sale', 'Sorghum Sale', 'Millet Sale', 
    'Beans / Legumes Sale', 'Groundnut Sale', 'Sesame Sale', 'Cotton Sale', 
    'Tobacco Sale', 'Sugarcane Sale', 'Vegetables Sale', 'Fruits Sale', 
    'Other Crop Sale', 'Cattle Sale', 'Goat / Sheep Sale', 'Pig Sale', 
    'Poultry / Chicken Sale', 'Eggs Sale', 'Milk / Dairy Sale', 
    'Fish / Aquaculture Sale', 'Equipment Rental Income', 'Land Rental Income', 
    'By-Product Sale (Straw, Husks…)', 'Processed Product Sale', 
    'Government Subsidy', 'NGO / Development Grant', 'Loan Received', 
    'Insurance Claim Payout', 'Advance Payment from Buyer', 'Other Income'
  ]);
  
  cashForm.addParagraphTextItem().setTitle('Notes');

  // 3. Create Trigger
  ScriptApp.newTrigger('onFormSubmitHandler')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
    
  const msg = 'Forms created successfully! Two forms (Investments and Cash Inflows) have been added to your Google Drive and linked to this spreadsheet.';
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    Logger.log(msg);
  }
}

// 4. Form Submit Handler
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

  if (sheetName.toLowerCase().includes('investment')) {
    const targetSheet = getOrCreateSheet(SHEET_NAME_INV, HEADERS_INV);
    targetSheet.appendRow([id, date, location, category, amount, notes, false]);
  } else if (sheetName.toLowerCase().includes('inflow') || sheetName.toLowerCase().includes('cash')) {
    const targetSheet = getOrCreateSheet(SHEET_NAME_CASH, HEADERS_CASH);
    targetSheet.appendRow([id, date, location, category, amount, notes, false]);
  }
}
