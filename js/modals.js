/* Reusable modal engine */
function openModal({ kicker = '', title = '', meta = '', bodyHTML = '', actions = [] }) {
  const root = document.getElementById('modalRoot');
  document.getElementById('modalKicker').textContent = kicker;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMeta').textContent = meta;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  const box = document.getElementById('modalActions');
  box.innerHTML = '';
  actions.forEach(a => {
    const b = document.createElement(a.href ? 'a' : 'button');
    b.textContent = a.label;
    b.className = a.primary
      ? 'text-xs font-bold bg-buzz text-black px-4 py-2 rounded-lg hover:bg-yellow-300'
      : 'text-xs font-semibold border border-zinc-700 px-4 py-2 rounded-lg hover:border-buzz hover:text-buzz';
    if (a.href) { b.href = a.href; b.target = '_blank'; b.rel = 'noopener'; }
    if (a.onClick) b.onclick = a.onClick;
    box.appendChild(b);
  });
  root.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('modalClose').focus();
}
function closeModal() {
  document.getElementById('modalRoot').classList.add('hidden');
  document.body.style.overflow = '';
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalClose').onclick = closeModal;
  document.getElementById('modalBackdrop').onclick = closeModal;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});
