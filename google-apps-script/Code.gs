// Deploy this Google Apps Script as a Web App (execute as Me, access Anyone).
// In Script Properties set SPREADSHEET_ID to the ID of your private response spreadsheet.
function doPost(e) {
  const out = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  try {
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) return out({ok:false,error:'Missing sheet configuration'});
    const data = JSON.parse(e.postData.contents);
    if (!data.consent || !data.name || !data.whatsapp) return out({ok:false,error:'Invalid registration'});
    const ss = SpreadsheetApp.openById(id);
    const sheet = ss.getSheetByName('Registrations') || ss.insertSheet('Registrations');
    const keys = ['createdAt','name','whatsapp','email','college','collegeOther','year','exam','plan','groupSize','referredBy','notes','consent'];
    const safe = (value) => {
      const s = String(value == null ? '' : value).slice(0,500);
      return /^[=+@-]/.test(s) ? "'" + s : s;
    };
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (sheet.getLastRow() === 0) sheet.appendRow(keys);
      sheet.appendRow(keys.map(k=>safe(data[k])));
    } finally {lock.releaseLock();}
    return out({ok:true});
  } catch (err) {return out({ok:false,error:'Unable to save registration'});}
}
