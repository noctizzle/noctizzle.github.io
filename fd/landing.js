/*
 * The Truth & Lies landing page: tags both store buttons with the source in the link (?s=share from an in-app share,
 * ?s=tiktok from a TikTok caption; anything else counts as "site"). Reads the address only; sends nothing.
 */
(function () {
  'use strict';
  function ready() {
    var source = TruthAndLiesLinks.sourceFromSearch(window.location.search, 'site');
    TruthAndLiesLinks.wireButtons(document, source);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
