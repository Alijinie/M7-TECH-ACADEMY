/* Ad provider switch — static slots only (never inside modals, per AdSense policy).
   CURRENT: AD_PROVIDER = 'adsterra' (responsive mix: 728x90 leaderboard key db636df2f0cc4b9ccbfeb5019fb4536c,
   468x60 key 2d56b7395434ad8122bded94fe696f05, 320x50 mobile key 56d15401577ed32907f8b75fd98a1555,
   160x300 sidebar key 3fd1feec440067272ac4b38e3831aef0, 160x600 footer key 71ab28a25e6c644353512bc028069345).
   See banner*.txt for each key. CSS in css/custom.css handles desktop/tablet/mobile visibility.
   TO SHIFT TO ADSENSE LATER:
   1. Set AD_PROVIDER = 'adsense'.
   2. Paste your publisher ID into ADSENSE_CLIENT (ca-pub-XXXXXXXXXXXXXXXX).
   3. Create 3 display ad units, paste each slot ID into AD_SLOTS.
   4. Remove the static Adsterra <script> blocks from index.html, keep the empty slot divs.
   5. Put the same publisher ID in ads.txt, then push to GitHub Pages. */
const AD_PROVIDER = 'adsterra'; // 'adsterra' | 'adsense'
const ADSENSE_CLIENT = ''; // e.g. 'ca-pub-1234567890123456'
const AD_SLOTS = {
  'ad-below-hero': '', // e.g. '1234567890'
  'ad-mid-content': '',
  'ad-footer': '',
};

function initAds() {
  if (AD_PROVIDER === 'adsterra') {
    // Adsterra banners are statically embedded in index.html (reliable vs document.write).
    // All slots visible — CSS controls which size shows per viewport.
    document.querySelectorAll('.ad-slot').forEach(s => {
      s.style.display = 'block';
    });
    return;
  }
  if (!ADSENSE_CLIENT) {
    document.querySelectorAll('.ad-slot').forEach(s => { s.style.display = 'none'; });
    return;
  }
  const loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
  loader.crossOrigin = 'anonymous';
  document.head.appendChild(loader);
  document.querySelectorAll('.ad-slot').forEach(slot => {
    const slotId = AD_SLOTS[slot.id];
    if (!slotId) { slot.style.display = 'none'; return; }
    slot.style.display = 'block';
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', ADSENSE_CLIENT);
    ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    slot.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* adblock or offline */ }
  });
}
document.addEventListener('DOMContentLoaded', initAds);
