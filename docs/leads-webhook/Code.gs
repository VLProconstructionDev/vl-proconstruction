/**
 * VL Proconstruction — estimate-form lead webhook.
 *
 * Lives inside the client's Google Sheet (Extensions → Apps Script).
 * Receives a JSON POST from the website's estimate wizard, appends the lead
 * as a row on the "Leads" tab, and emails a notification.
 *
 * Deploy as: Web app → Execute as "Me" → Who has access: "Anyone".
 * Paste the resulting /exec URL into `estimateWebhook` in src/lib/site.ts.
 */

// Bump on every script update — echoed in webhook responses (`v`) so the
// live deployment's version can be checked without opening the editor.
var VERSION = 5;
// Where new-lead notifications go — add as many addresses as needed.
// Every recipient counts against the daily Gmail send quota (~100/day on a
// consumer account), so 3 recipients = 3 quota units per lead.
// TODO: switch to the client's inbox (vlconstruction100@gmail.com) at launch.
var NOTIFY_EMAILS = [
  'vlad@vlproco.com',
  'abel@vlproco.com'
];
var SHEET_NAME = 'Leads';
// Display timezone for the sheet (the client's local time, not the visitor's).
var SHEET_TIME_ZONE = 'America/New_York';
// reCAPTCHA v3 SECRET key (from https://www.google.com/recaptcha/admin —
// the same registration whose SITE key goes into src/lib/site.ts).
// Deliberately EMPTY in the repo: the real value lives only in the deployed
// Apps Script (paste it there after copying this file in). '' = verification
// skipped, honeypot filtering still applies.
var RECAPTCHA_SECRET = '';
// v3 returns a 0–1 score (1 = human). Leads below this are still SAVED but
// flagged "possible spam" — a false alarm must never cost a real lead.
var RECAPTCHA_MIN_SCORE = 0.5;
// Lead pipeline stages for the sheet's Status column (dropdown + colors).
// New leads always start at STATUSES[0]; the rest are picked by hand.
var STATUSES = ['New', 'Contacted', 'Estimate scheduled', 'Quote sent', 'Won', 'Lost', 'Spam'];

function doPost(e) {
  // Wrapped so an unexpected crash returns clean JSON (the site can show a
  // real message) AND leaves a row on the "Log" tab — instead of a bare HTML
  // error page that the browser sees as "Failed to fetch" with no trace.
  var t0 = Date.now();
  try {
    var out = handleLead(e);
    var ms = Date.now() - t0;
    if (ms > 8000) logIssue('slow', 'doPost took ' + ms + ' ms');
    return out;
  } catch (err) {
    logIssue('doPost crashed', err);
    return respond({ ok: false, error: 'server', message: String(err).slice(0, 200) });
  }
}

function handleLead(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ ok: false, error: 'bad payload' });
  }

  // Honeypot: real users never fill "company". Pretend success so bots move on.
  if (data.company) return respond({ ok: true });

  // reCAPTCHA policy: only token-less/invalid-token requests are rejected —
  // those are bots POSTing at the webhook directly, never the website form.
  // A real token with a low score saves the lead anyway, flagged for review.
  var captcha = { pass: true, flag: '' };
  if (RECAPTCHA_SECRET) {
    captcha = checkRecaptcha(data.recaptchaToken);
    if (!captcha.pass) return respond({ ok: false, error: 'captcha' });
  }

  var HEADERS = [
    'Date', 'Status', 'Name', 'Phone', 'Email', 'Project', 'Budget', 'Timeline', 'Address', 'Page',
    'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Term', 'UTM Content', 'Click ID', 'Landing page',
  ];

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    // Timestamps must read as Florida-local. The spreadsheet's display
    // timezone follows whoever created it, so pin it here instead of relying
    // on a manual File → Settings step. Handles EST/EDT automatically.
    if (ss.getSpreadsheetTimeZone() !== SHEET_TIME_ZONE) {
      ss.setSpreadsheetTimeZone(SHEET_TIME_ZONE);
    }
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      setupStatusColumn(sheet);
    } else if (sheet.getLastColumn() < HEADERS.length) {
      // Self-heal: new columns were added in a script update — refresh row 1.
      // NOTE: only safe for columns appended at the END. The Status column
      // (B) predates any real data; if your sheet somehow has old rows
      // without it, delete the Leads tab and let it recreate.
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }
    // US 12-hour date display (e.g. 7/31/2026 6:45 PM). Applied to the whole
    // column on every lead — unconditionally, because sampling one cell to
    // decide proved wrong the moment the column got mixed formats. Costs a
    // few ms; keeps every row (old and new) consistent, and Date values stay
    // real dates so sorting/filtering keep working.
    sheet.getRange('A2:A').setNumberFormat('M/d/yyyy h:mm AM/PM');
    sheet.appendRow([
      new Date(),
      STATUSES[0],
      data.name || '',
      data.phone || '',
      data.email || '',
      data.project || '',
      data.budget || '',
      data.timeline || '',
      data.address || '',
      data.page || '',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      data.utm_term || '',
      data.utm_content || '',
      data.clickId || '',
      data.landing || '',
    ]);
  } finally {
    lock.releaseLock();
  }

  // Email is sent OUTSIDE this request (one-shot trigger fires ~seconds
  // later) so the visitor isn't kept waiting on the mail service.
  queueLeadEmail({ data: data, flag: captcha.flag });

  return respond({ ok: true });
}

// Queue the notification email via a one-shot time-based trigger. If the
// trigger can't be created (quota etc.), send inline — the notification is
// worth the extra wait, it must never be silently dropped.
function queueLeadEmail(payload) {
  try {
    var trigger = ScriptApp.newTrigger('sendQueuedLeadEmail').timeBased().after(1000).create();
    PropertiesService.getScriptProperties().setProperty(
      'email_' + trigger.getUniqueId(),
      JSON.stringify(payload)
    );
  } catch (err) {
    logIssue('email trigger failed — sent inline instead', err);
    sendLeadEmail(payload);
  }
}

// Trigger handler: look up the queued payload, clean up after itself
// (one-shot triggers otherwise pile up toward the 20-trigger cap), send.
function sendQueuedLeadEmail(e) {
  var props = PropertiesService.getScriptProperties();
  var key = 'email_' + e.triggerUid;
  var raw = props.getProperty(key);
  props.deleteProperty(key);
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getUniqueId() === e.triggerUid) ScriptApp.deleteTrigger(t);
  });
  if (raw) sendLeadEmail(JSON.parse(raw));
}

function sendLeadEmail(payload) {
  var data = payload.data;
  var flag = payload.flag;
  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAILS.join(','),
      subject:
        (flag ? '[possible spam] ' : '') +
        'New estimate request — ' + (data.name || 'Unknown') + (data.project ? ' (' + data.project + ')' : ''),
      body: [
        'New lead from the website estimate form:',
        flag ? '(⚠ ' + flag + ' — verify before driving out)' : '',
        '',
        'Name:     ' + (data.name || '—'),
        'Phone:    ' + (data.phone || '—'),
        'Email:    ' + (data.email || '—'),
        'Project:  ' + (data.project || '—'),
        'Budget:   ' + (data.budget || '—'),
        'Timeline: ' + (data.timeline || '—'),
        'Address:  ' + (data.address || '—'),
        'Source:   ' + (data.utm_source
          ? data.utm_source + ' / ' + (data.utm_medium || '—') + ' / ' + (data.utm_campaign || '—')
          : 'direct or organic'),
        '',
        'Full list: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      ].join('\n'),
    });
  } catch (err) {
    // Lead row is already saved — a mail hiccup must not break anything,
    // but it must not be invisible either.
    logIssue('notification email failed (lead row IS saved)', err);
  }
}

// Appends a row to the "Log" tab (created on first use). Errors, slow runs,
// and silent fallbacks land here so problems are visible in the spreadsheet
// itself — no digging through Apps Script's Executions screen.
// Logging must never break lead handling, hence its own try/catch.
function logIssue(type, detail) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var log = ss.getSheetByName('Log');
    if (!log) {
      log = ss.insertSheet('Log');
      log.appendRow(['Date', 'What happened', 'Details']);
      log.setFrozenRows(1);
    }
    var msg = detail && detail.stack ? detail.stack : String(detail || '');
    log.appendRow([new Date(), type, msg.slice(0, 800)]);
  } catch (ignore) {}
}

function respond(obj) {
  obj.v = VERSION;
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Status column (B): dropdown with the pipeline stages + a color per stage.
// Runs once, when the Leads tab is first created.
function setupStatusColumn(sheet) {
  var col = sheet.getRange('B2:B');
  col.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build()
  );
  var colors = {
    'New': '#fce8e6',                // soft red — needs attention
    'Contacted': '#fef7e0',          // amber
    'Estimate scheduled': '#e8f0fe', // blue
    'Quote sent': '#f3e8fd',         // purple
    'Won': '#e6f4ea',                // green
    'Lost': '#f1f3f4',               // gray
    'Spam': '#f1f3f4',               // gray
  };
  var rules = sheet.getConditionalFormatRules();
  STATUSES.forEach(function (s) {
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(s)
        .setBackground(colors[s])
        .setRanges([col])
        .build()
    );
  });
  sheet.setConditionalFormatRules(rules);
}

// One-time: run this from the editor to grant the trigger permission
// (Apps Script only asks for the permissions the function you RUN needs —
// running testSetup is not enough). Creates and immediately deletes a
// throwaway trigger, forcing the authorization prompt.
function authorizeTriggers() {
  var t = ScriptApp.newTrigger('sendQueuedLeadEmail').timeBased().after(60000).create();
  ScriptApp.deleteTrigger(t);
  PropertiesService.getScriptProperties().getProperty('warmup');
  Logger.log('✅ Trigger permission granted — async email is active. No redeploy needed.');
}

// Setup self-test — run manually in the Apps Script editor:
// select "testSetup" in the toolbar dropdown → Run → read the log below.
function testSetup() {
  if (!RECAPTCHA_SECRET) {
    Logger.log('RECAPTCHA_SECRET is empty — captcha checks are OFF (honeypot only).');
    return;
  }
  var resp = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'post',
    payload: { secret: RECAPTCHA_SECRET, response: 'not-a-real-token' },
    muteHttpExceptions: true,
  });
  var v = JSON.parse(resp.getContentText());
  var codes = (v['error-codes'] || []).join(', ');
  if (codes.indexOf('invalid-input-secret') !== -1) {
    Logger.log('❌ RECAPTCHA_SECRET is WRONG. Copy the SECRET key from the SAME registration as the site key at https://www.google.com/recaptcha/admin');
  } else if (codes.indexOf('invalid-input-response') !== -1) {
    Logger.log('✅ Secret key is valid (dummy token correctly rejected). If the form still fails, the web app was not redeployed: Deploy → Manage deployments → edit → New version.');
  } else {
    Logger.log('Unexpected siteverify answer: ' + resp.getContentText());
  }
}

// Verifies a reCAPTCHA v3 token with Google.
// Returns { pass, flag }: pass=false only for missing/invalid tokens
// (direct bot POSTs). A genuine token with a low score passes with a flag,
// and a Google-side failure fails OPEN — an outage never costs a real lead.
function checkRecaptcha(token) {
  if (!token) return { pass: false, flag: '' };
  try {
    var resp = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'post',
      payload: { secret: RECAPTCHA_SECRET, response: token },
      muteHttpExceptions: true,
    });
    var v = JSON.parse(resp.getContentText());
    if (!v.success) return { pass: false, flag: '' };
    if (v.action && v.action !== 'estimate_submit') return { pass: false, flag: '' };
    if (typeof v.score === 'number' && v.score < RECAPTCHA_MIN_SCORE) {
      return { pass: true, flag: 'low reCAPTCHA score (' + v.score + ')' };
    }
    return { pass: true, flag: '' };
  } catch (err) {
    return { pass: true, flag: 'reCAPTCHA check unavailable' };
  }
}
