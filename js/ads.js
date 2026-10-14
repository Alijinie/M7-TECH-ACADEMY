/* Ad provider switch — static slots only (never inside modals, per AdSense policy).
   CURRENT: AD_PROVIDER = 'adsterra' (Banner 300x250, key in index.html + Adsterra Banner300x250.txt).
   TO SHIFT TO ADSENSE LATER:
   1. Set AD_PROVIDER = 'adsense'.
   2. Paste your publisher ID into ADSENSE_CLIENT (ca-pub-XXXXXXXXXXXXXXXX).
   3. Create 3 display ad units, paste each slot ID into AD_SLOTS.
   4. Remove the two static Adsterra <script> blocks from index.html
      (ad-below-hero + ad-mid-content), keep the empty slot divs.
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
    // Just hide the reserved footer slot while on the 2-slot Adsterra setup.
    const footer = document.getElementById('ad-footer');
    if (footer) footer.style.display = 'none';
    document.querySelectorAll('.ad-slot').forEach(s => {
      if (s.id === 'ad-footer') return;
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
