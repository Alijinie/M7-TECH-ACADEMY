/* App: tracks, filters, library, quizzes, favs */
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const Filters = { type: 'all', freeOnly: true, level: 'all', favOnly: false };
let libQuery = '';

function matchResource(r, q) {
  if (Filters.type !== 'all' && r.type !== Filters.type) return false;
  if (Filters.freeOnly && !r.free) return false;
  if (Filters.level !== 'all' && r.level !== Filters.level) return false;
  if (Filters.favOnly && !isFav(r.id)) return false;
  if (q && !(r.title + ' ' + r.note + ' ' + r.type).toLowerCase().includes(q)) return false;
  return true;
}

function renderTracks(query = '') {
  const grid = document.getElementById('trackGrid');
  grid.dataset.query = query;
  const q = query.trim().toLowerCase();
  const list = TRACKS.filter(t =>
    !q || t.title.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q) ||
    t.phases.some(p => p.title.toLowerCase().includes(q) || p.skills.join(' ').toLowerCase().includes(q)));
  document.getElementById('resultCount').textContent = list.length + ' track' + (list.length === 1 ? '' : 's');
  grid.innerHTML = list.map(t => {
    const pc = trackPct(t.id);
    const passed = t.phases.filter((_, pi) => isQuizPassed(t.id, pi)).length;
    return `<article class="track-card">
      <div class="flex items-start justify-between gap-2">
        ${iconFor(t.icon)}
        <span class="chip chip-hot">${esc(t.level)}</span>
      </div>
      <h3 class="font-display font-bold text-lg mt-2">${esc(t.title)}</h3>
      <p class="text-sm text-zinc-400 mt-1">${esc(t.tagline)}</p>
      <div class="flex flex-wrap gap-1.5 mt-3">
        <span class="chip">${esc(t.duration)}</span>
        <span class="chip">${t.phases.length} phases</span>
        ${passed ? `<span class="chip chip-hot">✓ ${passed}/${t.phases.length} quizzes</span>` : ''}
      </div>
      <div class="h-1.5 bg-zinc-800 rounded mt-3"><div data-pct-for="${t.id}" class="h-1.5 bg-buzz rounded transition-all" style="width:${pc}%"></div></div>
      <p class="text-[11px] text-zinc-500 mt-1 font-mono">${pc}% complete</p>
      <div class="flex gap-2 mt-3">
        <button onclick="openTrack('${t.id}')" class="flex-1 text-xs font-bold bg-buzz text-black px-4 py-2.5 rounded-lg hover:bg-yellow-300">View Roadmap →</button>
        <button onclick="openPhase('${t.id}', 0)" class="text-xs border border-zinc-700 px-3 py-2.5 rounded-lg hover:border-buzz hover:text-buzz" title="Start at phase 0">Phases</button>
      </div>
    </article>`;
  }).join('') || `<p class="text-sm text-zinc-500 col-span-2">No tracks match “${esc(query)}”. Try “python” or “LLM”.</p>`;
}

function resRow(id) {
  const r = RES_BY_ID[id]; if (!r) return '';
  const icon = { course: '◉', video: '▶', doc: '☰', tool: '⚙' }[r.type] || '•';
  const done = isResDone(r.id); const fav = isFav(r.id);
  return `<div class="res-row ${done ? 'opacity-60' : ''}" data-res-row="${r.id}">
    <button class="flex items-center gap-3 flex-1 min-w-0 text-left" onclick="openResource('${r.id}')">
      <span class="res-ico ${done ? 'done' : ''}">${done ? '✓' : icon}</span>
      <span class="flex-1 min-w-0"><span class="block text-[13px] font-semibold truncate">${esc(r.title)}</span>
      <span class="block text-[11px] text-zinc-500">${r.type} • ${r.free ? 'FREE' : 'paid'} • ${esc(r.level)}</span></span>
      <span class="text-buzz">→</span>
    </button>
    <button onclick="toggleFav('${r.id}')" title="Bookmark" class="star ${fav ? 'on' : ''}">${fav ? '★' : '☆'}</button>
  </div>`;
}
function refreshResRows() {
  document.querySelectorAll('[data-res-row]').forEach(el => {
    const tmp = document.createElement('div'); tmp.innerHTML = resRow(el.dataset.resRow);
    el.replaceWith(tmp.firstElementChild);
  });
}

function renderFilterBar() {
  const bar = document.getElementById('filterBar'); if (!bar) return;
  const types = [['all', 'All'], ['course', 'Courses'], ['video', 'Videos'], ['doc', 'Docs'], ['tool', 'Tools']];
  bar.innerHTML = `
    <div class="flex flex-wrap items-center gap-2">
      ${types.map(([v, l]) => `<button onclick="setFilter('type','${v}')" class="fchip ${Filters.type === v ? 'active' : ''}">${l}</button>`).join('')}
      <button onclick="setFilter('freeOnly',!Filters.freeOnly)" class="fchip ${Filters.freeOnly ? 'active' : ''}">${Filters.freeOnly ? '✓ Free only' : 'Free only'}</button>
      <button onclick="setFilter('favOnly',!Filters.favOnly)" class="fchip ${Filters.favOnly ? 'active' : ''}">${Filters.favOnly ? '★ Saved' : '☆ Saved'}</button>
      <select onchange="setFilter('level',this.value)" class="fchip bg-black">
        ${['all', 'Beginner', 'Beginner+', 'Intermediate', 'Intermediate+', 'All'].map(l => `<option value="${l}" ${Filters.level === l ? 'selected' : ''}>${l === 'all' ? 'All levels' : l}</option>`).join('')}
      </select>
      <span class="text-[11px] font-mono text-zinc-500 ml-auto" id="libCount"></span>
    </div>`;
  updateLibCount();
}
function setFilter(k, v) { Filters[k] = v; renderFilterBar(); if (document.getElementById('modalRoot') && !document.getElementById('modalRoot').classList.contains('hidden') && window._libOpen) openLibrary(true); }
function updateLibCount() {
  const el = document.getElementById('libCount'); if (!el) return;
  const n = RESOURCES.filter(r => matchResource(r, libQuery)).length;
  el.textContent = n + ' / ' + RESOURCES.length + ' shown';
}

function openTrack(trackId) {
  const t = TRACKS.find(t => t.id === trackId); if (!t) return;
  const body = `
    <div class="flex items-center gap-3">${iconFor(t.icon, 'track-icon lg')}<span class="font-display font-bold text-lg">${esc(t.title)}</span></div>
    <p class="text-sm text-zinc-300 border-l-2 border-buzz pl-3"><strong class="text-buzz font-mono text-[11px]">MISSION — </strong>${esc(t.mission)}</p>
    <p class="text-xs text-zinc-400"><strong>Leads to:</strong> ${esc(t.jobs)}</p>
    <div class="space-y-2 mt-2">${t.phases.map((p, i) => `
      <button class="phase-btn" onclick="openPhase('${t.id}', ${i})">
        <span class="font-mono text-buzz text-xs w-10 shrink-0">${String(i).padStart(2, '0')}</span>
        <span class="flex-1"><span class="block font-semibold text-[13px]">${isQuizPassed(t.id, i) ? '✓ ' : ''}${esc(p.title)}</span>
        <span class="block text-[11px] text-zinc-500">${esc(p.weeks)} • ${p.skills.length} skills • ${esc(p.goal)}</span></span>
        <span class="text-buzz">→</span></button>`).join('')}</div>`;
  openModal({
    kicker: `ROADMAP • ${t.phases.length} PHASES`,
    title: t.title, meta: `${t.level} • ${t.duration}`,
    bodyHTML: body,
    actions: [
      { label: 'Start Phase 0 →', primary: true, onClick: () => openPhase(t.id, 0) },
      { label: 'Copy share link', onClick: () => { navigator.clipboard?.writeText(location.href); closeModal(); } },
    ]
  });
}

function openPhase(trackId, pi) {
  const t = TRACKS.find(t => t.id === trackId); const p = t.phases[pi];
  const passed = isQuizPassed(trackId, pi);
  const body = `
    <p class="text-xs font-mono text-buzz">${esc(p.weeks).toUpperCase()} • GOAL: ${esc(p.goal)}</p>
    <div><p class="text-xs font-bold text-zinc-400 mb-2">SKILLS — tick as you finish (saves on this device)</p>
      <div class="space-y-2">${p.skills.map((s, si) => `
        <label class="flex items-center gap-3 bg-black border border-zinc-800 rounded-lg px-3 py-2.5 cursor-pointer hover:border-buzz/60">
          <input type="checkbox" class="tick" ${isStepDone(trackId, pi, si) ? 'checked' : ''} onchange="toggleStep('${trackId}', ${pi}, ${si}); this.closest('label').style.opacity = this.checked ? '.55' : '1'" />
          <span class="text-[13px]" style="opacity:${isStepDone(trackId, pi, si) ? '.55' : '1'}">${esc(s)}</span>
        </label>`).join('')}</div></div>
    <div><p class="text-xs font-bold text-zinc-400 mb-2">RESOURCES (${p.resources.length}) — click for preview, ☆ to save</p>
      <div class="space-y-2">${p.resources.map(resRow).join('')}</div></div>
    <div class="rounded-lg border ${passed ? 'border-green-500/60' : 'border-buzz/40'} bg-black/60 p-3">
      <p class="text-xs font-bold ${passed ? 'text-green-400' : 'text-buzz'}">${passed ? '✓ CHECKPOINT PASSED' : 'CHECKPOINT QUIZ — ' + p.quiz.length + ' questions, need 2/3'}</p>
      <p class="text-[13px] mt-1"><strong>Project:</strong> ${esc(p.project)}</p>
      <button onclick="openQuiz('${trackId}', ${pi})" class="mt-2 text-xs font-bold ${passed ? 'border border-green-500 text-green-400' : 'bg-buzz text-black'} px-4 py-2 rounded-lg">${passed ? 'Retake quiz' : 'Take checkpoint quiz →'}</button>
    </div>
    <div class="flex justify-between gap-2">
      ${pi > 0 ? `<button onclick="openPhase('${trackId}', ${pi - 1})" class="text-xs border border-zinc-700 px-3 py-2 rounded-lg">← Prev</button>` : '<span></span>'}
      ${pi < t.phases.length - 1 ? `<button onclick="openPhase('${trackId}', ${pi + 1})" class="text-xs font-bold bg-buzz text-black px-4 py-2 rounded-lg">Next phase →</button>` : `<button onclick="openTrack('${trackId}')" class="text-xs border border-buzz text-buzz px-4 py-2 rounded-lg">Back to overview</button>`}
    </div>`;
  openModal({ kicker: `${t.title.toUpperCase()} • PHASE ${pi}`, title: p.title, meta: p.weeks, bodyHTML: body, actions: [{ label: '← All phases', onClick: () => openTrack(trackId) }] });
}

function openQuiz(trackId, pi) {
  const t = TRACKS.find(t => t.id === trackId); const p = t.phases[pi];
  const body = `<div class="space-y-3" id="quizBox">${p.quiz.map((item, qi) => `
    <div class="bg-black border border-zinc-800 rounded-lg p-3" data-q="${qi}">
      <p class="text-[13px] font-semibold">Q${qi + 1}. ${esc(item.q)}</p>
      <div class="space-y-1.5 mt-2">${item.opts.map((o, oi) => `
        <label class="quiz-opt"><input type="radio" name="q${qi}" value="${oi}" class="accent-yellow-400" /> <span>${esc(o)}</span></label>`).join('')}</div>
    </div>`).join('')}</div>
    <p id="quizMsg" class="text-xs font-mono"></p>`;
  openModal({
    kicker: `CHECKPOINT • PHASE ${pi}`, title: 'Prove it — ' + p.title, meta: 'Need 2/3 to pass • saves on this device',
    bodyHTML: body,
    actions: [
      { label: 'Submit answers', primary: true, onClick: () => gradeQuiz(trackId, pi) },
      { label: 'Back to phase', onClick: () => openPhase(trackId, pi) },
    ]
  });
}
function gradeQuiz(trackId, pi) {
  const t = TRACKS.find(t => t.id === trackId); const p = t.phases[pi];
  let score = 0;
  p.quiz.forEach((item, qi) => {
    const sel = document.querySelector(`input[name="q${qi}"]:checked`);
    const box = document.querySelector(`[data-q="${qi}"]`);
    if (sel && Number(sel.value) === item.a) { score++; box.style.borderColor = '#22c55e'; }
    else if (box) box.style.borderColor = '#ef4444';
  });
  const msg = document.getElementById('quizMsg');
  if (score >= 2) {
    setQuizPassed(trackId, pi);
    msg.innerHTML = `<span class="text-green-400">✓ ${score}/${p.quiz.length} — PASSED. Project unlocked: ${esc(p.project)}</span>`;
  } else {
    msg.innerHTML = `<span class="text-red-400">✗ ${score}/${p.quiz.length} — review the phase resources and retry.</span>`;
  }
  renderTracks(document.getElementById('globalSearch').value || '');
}

function openResource(id) {
  const r = RES_BY_ID[id]; if (!r) return;
  const done = isResDone(id); const fav = isFav(id);
  openModal({
    kicker: 'RESOURCE PREVIEW', title: r.title, meta: `${r.type} • ${r.free ? 'FREE' : 'paid'} • ${r.level}`,
    bodyHTML: `<p class="text-sm text-zinc-300">${esc(r.note)}</p>
      <p class="text-[11px] font-mono text-zinc-500 break-all">${esc(r.url)}</p>
      <p class="text-xs text-zinc-500"><strong>Low-bandwidth tip:</strong> open once on Wi-Fi, save offline / download where offered.</p>`,
    actions: [
      { label: 'Open resource ↗', primary: true, href: r.url },
      { label: done ? '✓ Done — undo' : 'Mark done ✓', onClick: () => { toggleResDone(id); openResource(id); } },
      { label: fav ? '★ Saved — remove' : '☆ Save', onClick: () => { toggleFav(id); openResource(id); } },
      { label: 'Close', onClick: closeModal },
    ]
  });
}

function openLibrary(keepFilters) {
  window._libOpen = true;
  if (!keepFilters) libQuery = '';
  const list = RESOURCES.filter(r => matchResource(r, libQuery.toLowerCase()));
  const types = [['all', 'All'], ['course', 'Courses'], ['video', 'Videos'], ['doc', 'Docs'], ['tool', 'Tools']];
  openModal({
    kicker: 'RESOURCE LIBRARY', title: `${list.length} of ${RESOURCES.length} resources`,
    meta: 'Filters + search apply • ☆ saves to this device',
    bodyHTML: `
      <input id="libSearch" placeholder="Filter resources… (e.g. rag, git, python)" value="${esc(libQuery)}"
        class="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-buzz placeholder:text-zinc-600" />
      <div class="flex flex-wrap gap-1.5">
        ${types.map(([v, l]) => `<button onclick="setFilter('type','${v}')" class="fchip ${Filters.type === v ? 'active' : ''}">${l}</button>`).join('')}
        <button onclick="setFilter('favOnly',!Filters.favOnly)" class="fchip ${Filters.favOnly ? 'active' : ''}">${Filters.favOnly ? '★ Saved' : '☆ Saved'}</button>
      </div>
      <div class="space-y-2">${list.map(r => resRow(r.id)).join('') || '<p class="text-xs text-zinc-500">No matches — clear filters.</p>'}</div>`,
    actions: [{ label: 'Close', primary: true, onClick: () => { window._libOpen = false; closeModal(); } }]
  });
  const inp = document.getElementById('libSearch');
  if (inp) inp.addEventListener('input', e => { libQuery = e.target.value; openLibrary(true); const n = document.getElementById('libSearch'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
}

function openStarter() {
  openModal({
    kicker: '45-DAY STARTER CHALLENGE', title: 'From zero to shipping in 45 days',
    meta: '1–2 hrs/day • phone or laptop • all free',
    bodyHTML: `<div class="space-y-2">${STARTER_45.map(s => `
      <div class="bg-black border border-zinc-800 rounded-lg p-3"><p class="text-xs font-mono text-buzz">${esc(s.d)}</p>
      <p class="font-semibold text-[13px] mt-0.5">${esc(s.t)}</p><p class="text-xs text-zinc-400 mt-0.5">${esc(s.x)}</p></div>`).join('')}</div>
      <div class="rounded-lg border border-buzz/40 p-3 text-xs text-zinc-300">Rule: <strong class="text-buzz">never miss twice.</strong> Tick skills in the Coding track to track this challenge automatically.</div>`,
    actions: [{ label: 'Start with Coding →', primary: true, onClick: () => openTrack('coding') }, { label: 'Close', onClick: closeModal }]
  });
}

function openMission() {
  openModal({
    kicker: 'TEAM YOWERI 24/7', title: 'Creators, not seekers',
    meta: 'Peace, Unity and Social-Economic Transformation for Prosperity',
    bodyHTML: `<p class="text-sm text-zinc-300">We need men and women who know their responsibility to take on the African Agenda. 20 years from now, we should be able to become <strong>creators and distributors of opportunities</strong> — not searchers and hunters of them.</p>
      <p class="text-sm text-zinc-300">When are we going to train our next <strong class="text-buzz">200,000 world-class Scientists, Engineers and Technicians</strong> with deep understanding of the African Agenda?</p>
      <p class="text-xs text-zinc-500">This portal is one answer: free, detailed, phone-friendly roadmaps into coding & AI.</p>`,
    actions: [{ label: 'Join Facebook community ↗', primary: true, href: 'https://web.facebook.com/share/g/1GZ5wMAJMa/' }, { label: 'Start learning', onClick: () => openTrack('coding') }]
  });
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const ov = document.getElementById('sideOverlay'); if (ov) ov.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  renderTracks();
  renderFilterBar();
  refreshStats();
  const yr = document.getElementById('year'); if (yr) yr.textContent = new Date().getFullYear();
  document.getElementById('globalSearch').addEventListener('input', e => renderTracks(e.target.value));
  const menu = document.getElementById('menuBtn');
  if (menu) menu.onclick = () => {
    const sb = document.getElementById('sidebar'); const ov = document.getElementById('sideOverlay');
    const opening = !sb.classList.contains('open');
    sb.classList.toggle('open');
    if (ov) ov.classList.toggle('hidden', !opening);
  };
  const ov = document.getElementById('sideOverlay'); if (ov) ov.onclick = closeSidebar;
  document.querySelectorAll('#sideNav .nav-btn').forEach(b => b.onclick = () => {
    document.querySelectorAll('#sideNav .nav-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    closeSidebar();
    const r = b.dataset.route;
    if (r === 'roadmaps') document.getElementById('trackGrid').scrollIntoView({ behavior: 'smooth' });
    else if (r === 'ai-lab') openPhase('ai-ml', 0);
    else if (r === 'resources') openLibrary(false);
    else if (r === 'opportunities') openModal({ kicker: 'OPPORTUNITIES', title: 'Turn skills into income', meta: 'Freelance • internships • open source', bodyHTML: `<div class="text-sm space-y-2 text-zinc-300"><p><strong>Freelance:</strong> Upwork, Fiverr — start with small bug-fix gigs after the Coding track.</p><p><strong>Internships:</strong> Andela, tech hubs and fintechs in Lagos, Nairobi, Dhaka, Manila — portfolio required.</p><p><strong>Open source:</strong> freeCodeCamp, Hugging Face — contributions = proof.</p><p><strong>Community:</strong> post every project in the Facebook group for feedback.</p></div>`, actions: [{ label: 'Join Facebook ↗', primary: true, href: 'https://web.facebook.com/share/g/1GZ5wMAJMa/' }, { label: 'Close', onClick: closeModal }] });
    else if (r === 'mission') openMission();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
