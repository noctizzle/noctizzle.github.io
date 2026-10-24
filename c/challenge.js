/*
 * Brick Rivals challenge links: the challenge page's copy of codeFromHash and challengeAppLink from
 * apps/brick-brawl/src/logic/challengeLink.ts (the website has no build step, so it can't import them).
 * challengeLink.test.ts runs both copies on the same cases, so change them together.
 *
 * Race my run links (Brick Rivals 1.1) put "R-" and a shared run's id after the # instead of a code:
 * https://noctizzle.github.io/c/#R-<runId>. raceFromHash reads the id and raceAppLink makes the game's own
 * link for it, brickrivals://race/<runId>; challengePage.test.ts covers them.
 *
 * It only reads the text it is given. Nothing here sends anything anywhere.
 */
var BrickRivalsChallenge = (function () {
  'use strict';

  var MAX_LINK_CHARS = 512;
  var MAX_CODE_TEXT = 32;
  var BOARD = /^[0-9A-HJKMNP-TV-Z]{8}$/;
  var LOOKALIKE = { O: '0', I: '1', L: '1' };
  /** A shared run's id: 6 to 64 letters, digits, _ and -, as the server makes them. */
  var RUN_ID = /^[A-Za-z0-9_-]{6,64}$/;
  /** A race link's hash: R- and the id. Anything a chat app tacks on the end (a full stop, a bracket) is let go. */
  var RACE_HASH = /^R-([A-Za-z0-9_-]+)[^A-Za-z0-9_-]*$/;

  function decoded(part) {
    try {
      return decodeURIComponent(part);
    } catch (e) {
      return part;
    }
  }

  function cleanCodeText(part) {
    return decoded(part)
      .toUpperCase()
      .replace(/[^0-9A-Z\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_CODE_TEXT)
      .trim();
  }

  function codeShape(text) {
    var bare = text.toUpperCase().replace(/[\s-]/g, '');
    var m = /^([0-9A-Z]{8})(\d{1,7})$/.exec(bare);
    if (!m) return null;
    var board = m[1].replace(/[OIL]/g, function (ch) {
      return LOOKALIKE[ch];
    });
    var digits = m[2].replace(/^0+/, '');
    if (!BOARD.test(board) || digits === '') return null;
    return board.slice(0, 4) + '-' + board.slice(4) + '-' + digits;
  }

  /** The code in location.hash ("#q7k2-m9xp-58400"), written as the game writes it, or null. */
  function codeFromHash(hash) {
    if (typeof hash !== 'string' || hash.length > MAX_LINK_CHARS) return null;
    return codeShape(cleanCodeText(hash.replace(/^#/, '')));
  }

  /** The game's own link for a code: brickrivals://challenge/Q7K2-M9XP-58400 (null if it isn't one). */
  function appLink(code) {
    var shaped = typeof code === 'string' ? codeShape(code) : null;
    return shaped ? 'brickrivals://challenge/' + shaped : null;
  }

  /** The run id in a Race my run link's location.hash ("#R-<runId>"), or null when the hash isn't one. */
  function raceFromHash(hash) {
    if (typeof hash !== 'string' || hash.length > MAX_LINK_CHARS) return null;
    var m = RACE_HASH.exec(decoded(hash.replace(/^#/, '')).trim());
    return m && RUN_ID.test(m[1]) ? m[1] : null;
  }

  /** The game's own link for a shared run: brickrivals://race/<runId> (null if it isn't a run id). */
  function raceAppLink(runId) {
    return typeof runId === 'string' && RUN_ID.test(runId) ? 'brickrivals://race/' + runId : null;
  }

  return { codeFromHash: codeFromHash, appLink: appLink, raceFromHash: raceFromHash, raceAppLink: raceAppLink };
})();
