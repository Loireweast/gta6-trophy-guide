// Leonida Legend v2 — offline GTA VI trophy guide + tracker.
// Loads app/data/trophies.json, renders the checklist, roadmap and detail panel,
// and saves earned trophies in localStorage. No network at run time.
const EARNED_KEY = 'leonida-legend-earned-v2';
const SPOILER_KEY = 'leonida-legend-spoiler-v2';

const $ = (id) => document.getElementById(id);
const listEl = $('trophy-list');
const detailEl = $('detail');
const searchEl = $('search');
const gradeEl = $('grade');
const earnedOnlyEl = $('earned-only');
const spoilerEl = $('spoiler');
const resultCountEl = $('result-count');
const shownCountEl = $('shown-count');
const emptyStateEl = $('empty-state');

let earned = new Set(readEarned());
let doc = null;
let kind = 'all';
let selectedId = null;

function readEarned() {
  try { return JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'); }
  catch { return []; }
}
function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}
function spoilerOn() { return spoilerEl.checked; }

function gradeLabel(grade) {
  return grade === 'platinum' ? 'Platinum' : grade === 'gold' ? 'Gold' : grade === 'silver' ? 'Silver' : 'Bronze';
}
function kindLabel(kindValue) {
  return kindValue === 'story' ? 'Story' : kindValue === 'missable' ? 'Missable' : kindValue === 'collectibles' ? 'Collectibles' : kindValue === 'activities' ? 'Activities' : 'Online';
}
function countText(t) {
  if (t.count == null) return null;
  if (t.id === 14) return '100%';
  if (t.id === 52) return '$250,000';
  if (t.id === 53) return '$100,000';
  return `× ${t.count}`;
}
function isHiddenFromSpoilers(t) {
  return spoilerOn() && t.kind === 'story' && !earned.has(t.id);
}
function displayName(t) { return isHiddenFromSpoilers(t) ? '???' : t.name; }
function displayDesc(t) { return isHiddenFromSpoilers(t) ? 'Hidden until earned — turn the spoiler setting off to peek.' : t.description; }

function renderRoadmap() {
  const stepsEl = $('steps');
  stepsEl.replaceChildren();
  for (const s of doc.roadmap.steps) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = `Step ${s.n}: ${s.title}`;
    const hours = document.createElement('p');
    hours.className = 'step-hours';
    hours.textContent = s.hours;
    const p = document.createElement('p');
    p.textContent = s.text;
    li.append(h, hours, p);
    stepsEl.append(li);
  }
}

function currentFilter() {
  const q = searchEl.value.trim().toLowerCase();
  return (t) => {
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (kind === 'online') return false;
    if (earnedOnlyEl.checked && !earned.has(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };
}

function renderProgress() {
  const total = doc.trophies.length;
  const n = earned.size;
  const pct = Math.round((n / total) * 100);
  $('progress-fill').style.width = `${pct}%`;
  $('progress').textContent = `${n} of ${total} earned · ${pct}%`;
  const byGrade = {};
  for (const t of doc.trophies) byGrade[t.grade] = (byGrade[t.grade] ?? 0) + 1;
  const earnedByGrade = {};
  for (const t of doc.trophies) if (earned.has(t.id)) earnedByGrade[t.grade] = (earnedByGrade[t.grade] ?? 0) + 1;
  $('grade-counts').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${gradeLabel(g)} ${earnedByGrade[g] ?? 0}/${byGrade[g]}`)
    .join(' · ');
}

function renderList() {
  const filter = currentFilter();
  const shown = doc.trophies.filter(filter);
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-card' + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    li.dataset.id = String(t.id);

    const top = document.createElement('div');
    top.className = 'card-top';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'card-check';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (e) => { e.stopPropagation(); toggleEarned(t.id); });

    const body = document.createElement('div');
    body.className = 'card-body';

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = displayName(t);
    if (t.hidden) {
      const tag = document.createElement('span');
      tag.className = 'hidden-tag';
      tag.textContent = 'HIDDEN';
      name.append(tag);
    }
    if (t.missable) {
      const tag = document.createElement('span');
      tag.className = 'missable-tag';
      tag.textContent = 'MISSABLE';
      name.append(tag);
    }

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = displayDesc(t);

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const badge = document.createElement('span');
    badge.className = `badge ${t.grade}`;
    badge.textContent = gradeLabel(t.grade);
    meta.append(badge);
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = kindLabel(t.kind);
    meta.append(kindTag);
    const c = countText(t);
    if (c) {
      const countTag = document.createElement('span');
      countTag.className = 'tag count';
      countTag.textContent = c;
      meta.append(countTag);
    }
    const stageTag = document.createElement('span');
    stageTag.className = 'tag';
    stageTag.textContent = `Roadmap step ${t.stage}`;
    meta.append(stageTag);

    body.append(name, desc, meta);
    top.append(box, body);
    li.append(top);
    li.addEventListener('click', () => selectTrophy(t.id, true));
    listEl.append(li);
  }
  emptyStateEl.hidden = shown.length !== 0;
  shownCountEl.textContent = `(${shown.length} of ${doc.trophies.length} shown)`;
  resultCountEl.textContent = kind === 'online'
    ? 'There are no online trophies in GTA VI — every one of the 55 is single-player.'
    : shown.length === doc.trophies.length
      ? ''
      : `${shown.length} of ${doc.trophies.length} trophies match.`;
  renderProgress();
}

function renderDetail() {
  const t = doc.trophies.find((x) => x.id === selectedId);
  if (!t) {
    detailEl.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Pick a trophy on the left to read its full guide and sources here. Every guide is written in our own words and cites where its facts come from.';
    detailEl.append(p);
    return;
  }
  detailEl.innerHTML = '';
  const h = document.createElement('h3');
  h.textContent = displayName(t);
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = displayDesc(t);
  const meta = document.createElement('div');
  meta.className = 'detail-meta';
  const badge = document.createElement('span');
  badge.className = `badge ${t.grade}`;
  badge.textContent = gradeLabel(t.grade);
  meta.append(badge);
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = kindLabel(t.kind);
  meta.append(kindTag);
  if (t.hidden) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = 'Hidden on PlayStation until earned';
    meta.append(tag);
  }
  if (t.missable) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = 'Missable — read before you play Chapter 1';
    meta.append(tag);
  }
  const c = countText(t);
  if (c) {
    const tag = document.createElement('span');
    tag.className = 'tag count';
    tag.textContent = c;
    meta.append(tag);
  }
  const guideH = document.createElement('h4');
  guideH.textContent = 'How to get it';
  const guide = document.createElement('p');
  guide.className = 'guide-text' + (t.id === 49 ? ' unconfirmed' : '');
  guide.textContent = t.guide;
  const srcH = document.createElement('h4');
  srcH.textContent = 'Sources';
  const srcList = document.createElement('ul');
  srcList.className = 'source-list';
  for (const s of t.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = `${s.name} — ${s.url}`;
    li.append(a);
    srcList.append(li);
  }
  const earnRow = document.createElement('div');
  earnRow.className = 'earn-row';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.id = 'detail-earned';
  box.checked = earned.has(t.id);
  box.addEventListener('change', () => toggleEarned(t.id));
  const label = document.createElement('label');
  label.htmlFor = 'detail-earned';
  label.textContent = earned.has(t.id) ? 'Earned — nice one.' : 'Mark as earned';
  earnRow.append(box, label);
  detailEl.append(h, desc, meta, guideH, guide, srcH, srcList, earnRow);
  if (isHiddenFromSpoilers(t)) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'Spoiler-safe mode is on and this story trophy is not earned yet, so its name and description are hidden. Tick it earned to reveal them.';
    detailEl.append(note);
  }
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id);
  else earned.add(id);
  saveEarned();
  renderList();
  renderDetail();
}

function selectTrophy(id, pushHash) {
  selectedId = id;
  renderList();
  renderDetail();
  if (pushHash) history.replaceState(null, '', `#trophy=${id}`);
}

function bindControls() {
  searchEl.addEventListener('input', renderList);
  gradeEl.addEventListener('change', renderList);
  earnedOnlyEl.addEventListener('change', renderList);
  spoilerEl.addEventListener('change', () => {
    localStorage.setItem(SPOILER_KEY, spoilerEl.checked ? '1' : '0');
    renderList();
    renderDetail();
  });
  document.querySelectorAll('.kind-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      kind = btn.dataset.kind;
      document.querySelectorAll('.kind-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderList();
    });
  });
  $('export').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned].sort((x, y) => x - y))], { type: 'application/json' }));
    a.download = 'leonida-legend-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const ids = JSON.parse(await file.text());
      const valid = new Set(doc.trophies.map((t) => t.id));
      earned = new Set(ids.filter((n) => valid.has(n)));
      saveEarned();
      renderList();
      renderDetail();
    } catch {
      alert('That file is not a valid progress export.');
    }
    e.target.value = '';
  });
  $('reset').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies?')) return;
    earned = new Set();
    saveEarned();
    renderList();
    renderDetail();
  });
}

async function boot() {
  spoilerEl.checked = localStorage.getItem(SPOILER_KEY) === '1';
  doc = await (await fetch('data/trophies.json')).json();
  renderRoadmap();
  bindControls();
  const m = location.hash.match(/#trophy=(\d+)/);
  if (m) {
    const id = Number(m[1]);
    if (doc.trophies.some((t) => t.id === id)) selectedId = id;
  }
  renderList();
  renderDetail();
}

boot();
