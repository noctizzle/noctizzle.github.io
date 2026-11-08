/*
 * Truth & Lies store links for the website: the site's copy of apps/frontdesk/src/logic/links.ts (the website has no
 * build step, so it can't import it). ship.site.test.ts runs both copies on every source, so change them together.
 *
 * The landing page (/fd/?s=share) and the second-opinion page show both store buttons, tagged with the source the
 * visitor came from: Apple's campaign token `ct`, Google Play's install referrer with UTM tags. The `s` value is
 * only a source name; anything else falls back to "site". Nothing here sends anything anywhere.
 */
var TruthAndLiesLinks = (function () {
  'use strict';

  var PLAY_PACKAGE = 'com.noctizzle.truthandlies';
  /** App Store Connect's Apple ID and the campaign provider token: null until the owner creates the listing. */
  var ASC_APP_ID = '6831348627';
  var PROVIDER_TOKEN = null;
  /** Whether each store page is public yet (the buttons say "coming soon" until then). */
  var APPLE_LIVE = false;
  var PLAY_LIVE = false;

  var LINK_SOURCES = ['share', 'second-opinion', 'tiktok', 'site'];
  var PLAY_UTM = {
    share: { source: 'share', medium: 'app', campaign: 'share' },
    'second-opinion': { source: 'second-opinion', medium: 'web', campaign: 'second-opinion' },
    tiktok: { source: 'tiktok', medium: 'social', campaign: 'poll' },
    site: { source: 'site', medium: 'web', campaign: 'site' },
  };
  var LANDING_URL = 'https://noctizzle.github.io/fd/';
  var DIGITS = /^\d{1,12}$/;

  function isLinkSource(s) {
    return typeof s === 'string' && LINK_SOURCES.indexOf(s) >= 0;
  }

  function landingLink(source) {
    return LANDING_URL + '?s=' + encodeURIComponent(source);
  }

  function appStoreCampaignLink(source, ids) {
    var asc = ids ? ids.ascAppId : ASC_APP_ID;
    var pt = ids ? ids.providerToken : PROVIDER_TOKEN;
    if (!asc || !pt || !DIGITS.test(asc) || !DIGITS.test(pt)) return null;
    return (
      'https://apps.apple.com/app/apple-store/id' + asc + '?pt=' + pt + '&ct=' + encodeURIComponent(source) + '&mt=8'
    );
  }

  function appStoreLink(source, ids) {
    return appStoreCampaignLink(source, ids) || landingLink(source);
  }

  function playReferrer(source) {
    var t = PLAY_UTM[source];
    return 'utm_source=' + t.source + '&utm_medium=' + t.medium + '&utm_campaign=' + t.campaign;
  }

  function playLink(source) {
    return (
      'https://play.google.com/store/apps/details?id=' +
      PLAY_PACKAGE +
      '&referrer=' +
      encodeURIComponent(playReferrer(source))
    );
  }

  /**
   * The source a page was opened from: `?s=` when it is one of the four names, else "site". A mangled address
   * (a stray "%" from a chat app) falls back too, rather than throwing and leaving the store buttons unwired.
   */
  function sourceFromSearch(search, fallback) {
    var m = /[?&]s=([^&#]*)/.exec(search || '');
    var s = '';
    try {
      s = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    } catch (e) {
      s = '';
    }
    return isLinkSource(s) ? s : fallback || 'site';
  }

  /** Points every [data-store] button in `root` at its store with `source`'s tags, or marks it "coming soon". */
  function wireButtons(root, source) {
    var buttons = root.querySelectorAll('[data-store]');
    for (var i = 0; i < buttons.length; i++) {
      var el = buttons[i];
      var apple = el.getAttribute('data-store') === 'apple';
      var live = apple ? APPLE_LIVE && appStoreCampaignLink(source) : PLAY_LIVE;
      if (live) {
        el.setAttribute('href', apple ? appStoreCampaignLink(source) : playLink(source));
        el.removeAttribute('aria-disabled');
        el.classList.remove('soon');
      } else {
        el.removeAttribute('href');
        el.setAttribute('aria-disabled', 'true');
        el.classList.add('soon');
        var note = el.querySelector('.store-note');
        if (note) note.textContent = 'Coming soon';
      }
    }
  }

  return {
    PLAY_PACKAGE: PLAY_PACKAGE,
    LINK_SOURCES: LINK_SOURCES,
    PLAY_UTM: PLAY_UTM,
    LANDING_URL: LANDING_URL,
    APPLE_LIVE: APPLE_LIVE,
    PLAY_LIVE: PLAY_LIVE,
    isLinkSource: isLinkSource,
    landingLink: landingLink,
    appStoreCampaignLink: appStoreCampaignLink,
    appStoreLink: appStoreLink,
    playReferrer: playReferrer,
    playLink: playLink,
    sourceFromSearch: sourceFromSearch,
    wireButtons: wireButtons,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = TruthAndLiesLinks;
