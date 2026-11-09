/**
 * newsletters: mark subscriptions as read.
 *
 * Runs inside the owner's Google account on a daily time trigger. Reads the
 * sender list and settings from the public spikes repo on GitHub, marks
 * matching unread mail as read, and does nothing else to the mailbox.
 *
 * Setup (once): paste this file into a new project at script.google.com,
 * run setupTrigger() from the editor and approve the permissions it asks for
 * (Gmail, external requests, send mail as you). Then run runNow() once and
 * read the log (View > Executions, or Logger output) to see the result.
 */

var RAW_BASE = 'https://raw.githubusercontent.com/gynciuz/spikes/main/newsletters/';
var CANDIDATE_QUERY = 'is:unread newer_than:7d (category:updates OR category:promotions) unsubscribe';
var MAX_THREADS = 500;

// Fallback copies, used only when GitHub cannot be reached.
var FALLBACK_SENDERS = [
  'substack.com', 'buttondown.email', 'semafor.com', 'ian@gzeromedia.com',
  'ed@edwardconard.com', 'peter@builtformars.com', 'alertbox@nngroup.com',
  'tamas@heydesigner.com', 'hello@goodui.org', 'barryseconomics@creator.patreon.com',
  'newsletter@contentdesign.london', '6nuliai'
];
var FALLBACK_SETTINGS = { enabled: 'yes', lookback_days: '14', candidates: 'yes', report_email: 'no' };

/** Entry point for the daily trigger. */
function markNewslettersRead() {
  var source = 'github';
  var settings, senders;
  try {
    settings = parseSettings(fetchText('settings.txt'));
    senders = parseList(fetchText('senders.txt'));
  } catch (e) {
    source = 'fallback (' + e.message + ')';
    settings = FALLBACK_SETTINGS;
    senders = FALLBACK_SENDERS;
  }
  var lines = ['newsletters run ' + nowVilnius() + ', list from ' + source];

  if (String(settings.enabled).toLowerCase() !== 'yes') {
    lines.push('paused by settings.txt (enabled: ' + settings.enabled + '); nothing marked');
    finish(lines, settings);
    return;
  }

  var lookback = parseInt(settings.lookback_days, 10) || 14;
  var query = 'is:unread newer_than:' + lookback + 'd (' +
    senders.map(function (s) { return 'from:' + quoteIfNeeded(s); }).join(' OR ') + ')';

  var threads = GmailApp.search(query, 0, MAX_THREADS);
  var marked = 0, skipped = 0, perSender = {};
  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (msg) {
      if (!msg.isUnread()) return;
      var from = msg.getFrom();
      var hit = matchSender(from, senders);
      if (!hit) { skipped++; return; }
      msg.markRead();
      marked++;
      var name = displayName(from);
      perSender[name] = (perSender[name] || 0) + 1;
    });
  });

  lines.push('marked read: ' + marked + (skipped ? ' (skipped ' + skipped + ' that matched the query but not the list)' : ''));
  Object.keys(perSender).sort(function (a, b) { return perSender[b] - perSender[a]; })
    .forEach(function (k) { lines.push('  ' + perSender[k] + '  ' + k); });

  if (String(settings.candidates).toLowerCase() === 'yes') {
    var cands = {};
    GmailApp.search(CANDIDATE_QUERY, 0, 100).forEach(function (thread) {
      thread.getMessages().forEach(function (msg) {
        if (!msg.isUnread()) return;
        var from = msg.getFrom();
        if (matchSender(from, senders)) return;
        var key = displayName(from) + ' <' + address(from) + '>';
        if (!cands[key]) cands[key] = msg.getSubject();
      });
    });
    var keys = Object.keys(cands).slice(0, 10);
    if (keys.length) {
      lines.push('candidates not on the list (untouched):');
      keys.forEach(function (k) { lines.push('  ' + k + ' — ' + cands[k]); });
    }
  }

  finish(lines, settings);
}

/** Alias for a manual run from the editor. */
function runNow() { markNewslettersRead(); }

/** Creates the daily trigger (around 07:00 Europe/Vilnius). Safe to re-run: replaces any existing one. */
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'markNewslettersRead') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('markNewslettersRead')
    .timeBased().everyDays(1).atHour(7).nearMinute(0).inTimezone('Europe/Vilnius')
    .create();
  Logger.log('daily trigger set: markNewslettersRead, ~07:00 Europe/Vilnius');
}

/** Removes the daily trigger. */
function removeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'markNewslettersRead') ScriptApp.deleteTrigger(t);
  });
  Logger.log('trigger removed');
}

// ---- helpers ---------------------------------------------------------------

function finish(lines, settings) {
  var text = lines.join('\n');
  Logger.log(text);
  if (String(settings.report_email).toLowerCase() === 'yes') {
    MailApp.sendEmail(Session.getActiveUser().getEmail(), 'newsletters: ' + lines[1], text);
  }
}

function fetchText(name) {
  var res = UrlFetchApp.fetch(RAW_BASE + name + '?t=' + Date.now(), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error(name + ' HTTP ' + res.getResponseCode());
  return res.getContentText();
}

function parseList(text) {
  return text.split('\n').map(function (l) { return l.trim(); })
    .filter(function (l) { return l && l.charAt(0) !== '#'; });
}

function parseSettings(text) {
  var out = {};
  for (var k in FALLBACK_SETTINGS) out[k] = FALLBACK_SETTINGS[k];
  parseList(text).forEach(function (l) {
    var i = l.indexOf(':');
    if (i > 0) out[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  });
  return out;
}

function quoteIfNeeded(s) { return /\s/.test(s) ? '"' + s + '"' : s; }

function address(from) {
  var m = from.match(/<([^>]+)>/);
  return (m ? m[1] : from).trim().toLowerCase();
}

function displayName(from) {
  var m = from.match(/^\s*"?([^"<]*)"?\s*</);
  var n = m ? m[1].trim() : '';
  return n || address(from);
}

/** Domain match, exact address match, or a word of the display name. */
function matchSender(from, senders) {
  var addr = address(from);
  var name = displayName(from).toLowerCase();
  for (var i = 0; i < senders.length; i++) {
    var s = senders[i].toLowerCase().replace(/^"|"$/g, '');
    if (s.indexOf('@') >= 0) { if (addr === s) return true; }
    else if (s.indexOf('.') >= 0) { if (endsWith(addr, '@' + s) || endsWith(addr, '.' + s)) return true; }
    else if (name.indexOf(s) >= 0) return true;
  }
  return false;
}

function endsWith(str, suffix) { return str.length >= suffix.length && str.slice(-suffix.length) === suffix; }

function nowVilnius() {
  return Utilities.formatDate(new Date(), 'Europe/Vilnius', 'yyyy-MM-dd HH:mm');
}
