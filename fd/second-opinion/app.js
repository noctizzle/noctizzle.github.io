/*
 * Truth & Lies' "Second opinion" page (DRAFT, ship lane; docs/FRONTDESK_DESIGN.md 14.4): today's visitor from this
 * month's file (YYYY-MM.json, written by apps/frontdesk/scripts/second-opinion-export.mjs), picked by this device's
 * own date. With no file for this month it shows the latest month's last visitor. Two buttons, then the truth and
 * the store buttons with the "second-opinion" tags (../links.js).
 *
 * Privacy: it fetches only this folder's own JSON and pictures, sets no cookies and sends nothing about you. The
 * one thing it keeps is "you answered today" in this browser's localStorage, so a reload shows your answer; every
 * storage call is wrapped, so a private window plays the same. Every text goes in with textContent, never as HTML.
 */
var SecondOpinion = (function () {
  'use strict';

  var STORE_KEY = 'fd-second-opinion-v1';
  /** How many months back the page looks for a file when this month has none. */
  var LOOK_BACK = 12;

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  /** This device's local date, 'YYYY-MM-DD'. */
  function localDay(d) {
    var t = d || new Date();
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }

  /** '2026-12-03' → '2026-12'. */
  function monthOf(day) {
    return String(day).slice(0, 7);
  }

  /** The month before 'YYYY-MM'. */
  function prevMonth(month) {
    var y = Number(month.slice(0, 4));
    var m = Number(month.slice(5, 7)) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    return y + '-' + pad(m);
  }

  /** True for a month file this page can show. */
  function validFile(file) {
    return !!file && file.format === 1 && Array.isArray(file.days) && file.days.length > 0;
  }

  /**
   * Today's entry, else the latest entry dated before today (an older month's last day). Never a later day's
   * visitor: that would hand out tomorrow's answer early. Null when every entry is still to come.
   */
  function pickEntry(file, day) {
    if (!validFile(file)) return null;
    var best = null;
    for (var i = 0; i < file.days.length; i++) {
      var e = file.days[i];
      if (!e || typeof e.day !== 'string') continue;
      if (e.day === day) return e;
      if (e.day < day && (!best || e.day > best.day)) best = e;
    }
    return best;
  }

  /** Whether a call was right: believe a true claim, doubt a fib or a mix-up. */
  function isRight(entry, pick) {
    return entry.answer === pick;
  }

  /** The reveal's heading for a truth. */
  function truthHeading(truth) {
    if (truth === 'true') return 'Telling the truth';
    if (truth === 'lie') return 'Fibbing!';
    return 'An honest mix-up';
  }

  /** The line above the heading. */
  function callLine(entry, pick) {
    if (isRight(entry, pick))
      return pick === 'believe' ? 'You believed them. Well judged!' : 'You doubted them. Sharp!';
    return pick === 'believe' ? 'You believed them. Not this time.' : 'You doubted them. Not this time.';
  }

  // ---------------------------------------------------------------- storage (this device only)

  function loadAnswer() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var a = raw ? JSON.parse(raw) : null;
      return a && typeof a.day === 'string' && typeof a.id === 'string' ? a : null;
    } catch (e) {
      return null;
    }
  }

  function saveAnswer(day, id, pick) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({ day: day, id: id, pick: pick }));
    } catch (e) {
      // A private window: the answer just isn't remembered.
    }
  }

  // ---------------------------------------------------------------- the page

  function $(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    $(id).textContent = text || '';
  }

  /** Shows a picture, or hides it if it is missing (pictures are rendered after the art lands). */
  function setImage(id, src, alt) {
    var img = $(id);
    img.addEventListener('error', function () {
      img.hidden = true;
    });
    img.alt = alt || '';
    img.src = src;
  }

  function fetchMonth(month) {
    return fetch(month + '.json', { credentials: 'omit', cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(month + ': ' + r.status);
      return r.json();
    });
  }

  /**
   * This month's file, else the newest of the previous LOOK_BACK months with an entry for today or earlier (null if
   * none).
   */
  function findFile(month, day, left) {
    return fetchMonth(month)
      .then(function (file) {
        if (!pickEntry(file, day)) throw new Error('nothing for ' + day);
        return file;
      })
      .catch(function () {
        return left > 0 ? findFile(prevMonth(month), day, left - 1) : null;
      });
  }

  /**
   * Shows the answer. After a tap the Believe/Doubt row disappears from under the thumb, so the answer is brought
   * into view and focused (screen readers read it; keyboards keep their place). A reload shows it quietly.
   */
  function reveal(entry, pick, tapped) {
    $('verdicts').hidden = true;
    setText('call', callLine(entry, pick));
    setText('truth', truthHeading(entry.truth));
    setText('line', entry.reveal);
    $('reveal').hidden = false;
    if (!tapped) return;
    var heading = $('truth');
    try {
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      heading.focus({ preventScroll: true });
      $('reveal').scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    } catch (e) {
      // An old browser: the answer is still on the page, just below.
    }
  }

  function show(entry, today) {
    setImage('bust', entry.bust, entry.name);
    setText('name', entry.name);
    setText('claim', entry.claim);
    var ev = entry.evidence || {};
    setImage('ev', ev.img, ev.alt);
    setText('ev-label', ev.label);
    setText('ev-detail', ev.detail);
    $('visit').hidden = false;

    var answered = loadAnswer();
    if (answered && answered.day === today && answered.id === entry.id) {
      reveal(entry, answered.pick);
      return;
    }
    function choose(pick) {
      saveAnswer(today, entry.id, pick);
      reveal(entry, pick, true);
    }
    $('believe').addEventListener('click', function () {
      choose('believe');
    });
    $('doubt').addEventListener('click', function () {
      choose('doubt');
    });
  }

  function start() {
    if (typeof TruthAndLiesLinks !== 'undefined') TruthAndLiesLinks.wireButtons(document, 'second-opinion');
    var today = localDay();
    findFile(monthOf(today), today, LOOK_BACK).then(function (file) {
      var entry = pickEntry(file, today);
      if (entry) show(entry, today);
      else $('empty').hidden = false;
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }

  return {
    STORE_KEY: STORE_KEY,
    LOOK_BACK: LOOK_BACK,
    localDay: localDay,
    monthOf: monthOf,
    prevMonth: prevMonth,
    validFile: validFile,
    pickEntry: pickEntry,
    isRight: isRight,
    truthHeading: truthHeading,
    callLine: callLine,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SecondOpinion;
