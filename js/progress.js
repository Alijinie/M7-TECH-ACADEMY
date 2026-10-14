/* Progress via localStorage — static-first, no backend. Now: skills + resources + quiz + favs */
const LS_KEY = 'ty247:v1:progress';
const LS_RES = 'ty247:v1:resdone';
const LS_FAV = 'ty247:v1:favs';
const LS_QUIZ = 'ty247:v1:quiz';
function _read(k, fb) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; } catch { return fb; } }
function _write(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function loadProgress() { return _read(LS_KEY, {}); }
function saveProgress(p) { _write(LS_KEY, p); }
function stepKey(trackId, phaseIdx, skillIdx) { return `${trackId}|${phaseIdx}|${skillIdx}`; }
function isStepDone(trackId, pi, si) { return !!loadProgress()[stepKey(trackId, pi, si)]; }
function toggleStep(trackId, pi, si) {
  const p = loadProgress(); const k = stepKey(trackId, pi, si);
  p[k] ? delete p[k] : p[k] = Date.now();
  saveProgress(p); refreshStats();
}
/* resources done */
function loadResDone() { return _read(LS_RES, {}); }
function isResDone(id) { return !!loadResDone()[id]; }
function toggleResDone(id) {
  const d = loadResDone(); d[id] ? delete d[id] : d[id] = Date.now();
  _write(LS_RES, d); refreshStats();
  if (typeof refreshResRows === 'function') refreshResRows();
}
/* favorites */
function loadFavs() { return _read(LS_FAV, []); }
function isFav(id) { return loadFavs().includes(id); }
function toggleFav(id) {
  let f = loadFavs(); f = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
  _write(LS_FAV, f); refreshStats();
  if (typeof refreshResRows === 'function') refreshResRows();
  if (typeof renderFilterBar === 'function') renderFilterBar();
}
/* quizzes */
function loadQuiz() { return _read(LS_QUIZ, {}); }
function quizKey(t, pi) { return `${t}|${pi}`; }
function isQuizPassed(t, pi) { return !!loadQuiz()[quizKey(t, pi)]; }
function setQuizPassed(t, pi) { const q = loadQuiz(); q[quizKey(t, pi)] = Date.now(); _write(LS_QUIZ, q); refreshStats(); }

function trackPct(trackId) {
  const t = TRACKS.find(t => t.id === trackId); if (!t) return 0;
  let total = 0, done = 0; const p = loadProgress();
  t.phases.forEach((ph, pi) => ph.skills.forEach((_, si) => { total++; if (p[stepKey(trackId, pi, si)]) done++; }));
  return total ? Math.round(done / total * 100) : 0;
}
function overallStats() {
  const p = loadProgress(); const r = loadResDone(); const q = loadQuiz();
  const stamps = [...Object.values(p), ...Object.values(r), ...Object.values(q)];
  const days = new Set(stamps.map(ts => new Date(ts).toDateString())).size;
  const done = Object.keys(p).length + Object.keys(r).length;
  return { done, days, favs: loadFavs().length, passed: Object.keys(q).length };
}
function refreshStats() {
  const { done, days, favs } = overallStats();
  const st = document.getElementById('streak'); if (st) st.textContent = `${days}-day streak`;
  const badge = document.getElementById('levelBadge');
  if (badge) badge.textContent = done >= 40 ? 'CREATOR' : done >= 15 ? 'BUILDER' : 'EXPLORER';
  const kr = document.getElementById('kpiResources'); if (kr) kr.textContent = String(RESOURCES.length);
  const kt = document.getElementById('kpiTracks'); if (kt) kt.textContent = String(TRACKS.length);
  const kp = document.getElementById('kpiDone'); if (kp) kp.textContent = String(done);
  const fc = document.getElementById('favCount'); if (fc) { fc.textContent = `★ ${favs} saved`; fc.classList.toggle('hidden', favs === 0); }
  let best = null, bestPct = 0;
  TRACKS.forEach(t => { const pc = trackPct(t.id); if (pc > 0 && pc < 100 && pc >= bestPct) { bestPct = pc; best = t; } });
  const bar = document.getElementById('continueBar');
  if (bar) {
    if (best) {
      bar.classList.remove('hidden'); bar.classList.add('flex');
      document.getElementById('continueText').textContent = `${best.title} — ${bestPct}% complete`;
      document.getElementById('continueFill').style.width = bestPct + '%';
      document.getElementById('continueBtn').onclick = () => openTrack(best.id);
    } else { bar.classList.add('hidden'); bar.classList.remove('flex'); }
  }
  document.querySelectorAll('[data-pct-for]').forEach(el => {
    const pc = trackPct(el.dataset.pctFor);
    el.style.width = pc + '%';
    if (el.parentElement.nextElementSibling) el.parentElement.nextElementSibling.textContent = pc + '% complete';
  });
}
