/* AdSense scaffolding — static slots only (never inside modals, per AdSense policy).
   HOW TO GO LIVE:
   1. Apply at https://www.google.com/adsense with https://m7tech.name.ng/
   2. Paste your publisher ID below (ca-pub-XXXXXXXXXXXXXXXX)
   3. Create 3 display ad units, paste each slot ID into AD_SLOTS
   4. Add the same publisher ID to ads.txt, then push to GitHub Pages.
   Until ADSENSE_CLIENT is set, all .ad-slot placeholders stay hidden. */
const ADSENSE_CLIENT = ''; // e.g. 'ca-pub-1234567890123456'
const AD_SLOTS = {
  'ad-below-hero': '', // e.g. '1234567890'
  'ad-mid-content': '',
  'ad-footer': '',
};

function initAds() {
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
