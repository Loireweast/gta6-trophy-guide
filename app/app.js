// Leonida Legend: a GTA VI trophy guide and tracker. Loads its data from
// data/trophies.json (same folder, no network), keeps earned trophies in
// localStorage, and exports/imports that progress as a JSON file.
const EARNED_KEY = 'leonida-legend-earned';
const SPOILER_KEY = 'leonida-legend-spoiler';

const ROADMAP = [
  {
    stage: 1,
    title: 'Step 1 — Finish the story',
    hours: '60–80 hours',
    text: 'Play the five chapters, take optional missions as they appear, scan vehicles with the WAiNK app and study animals with the binoculars on the way. Keep a save at the start and end of each chapter (15 manual slots) — there is no mission replay. Do the Chapter 1 balcony meditation for Positive Mental Attitude: it is the one thing that can be missed.',
  },
  {
    stage: 2,
    title: 'Step 2 — 100% Completion Checklist & 70 of 80 Challenges',
    hours: 'About 100 hours',
    text: 'After the credits, work the checklist under Progress > Stats > 100% Completion. It is closer to 60% of true completion: 200 of 277 vehicles scanned, 100 of 255 animals studied, any 70 of 80 challenges. Only robberies, underwater discoveries, shooting ranges, drone races and Bret’s quests need everything.',
  },
  {
    stage: 3,
    title: 'Step 3 — Strangers & Freaks & cleanup',
    hours: 'About 10 hours',
    text: 'Finish the 8 stranger strands and the character questlines, then sweep up the one-off trophies. The platinum pops the moment the last of the other 54 is earned.',
  },
];

const doc = await loadTrophies();
const trophies = doc.trophies;
const sourceMap = doc.sources || {};

let earned = loadProgress();
let kindFilter = 'all';
let gradeFilter = 'all';
let searchText = '';
let spoilerOn = localStorage.getItem(SPOILER_KEY) === '1';
let earnedOnly = false;

renderRoadmap();
renderSources();
bindControls();
renderTrophies();
updateProgress();

async function loadTrophies() {
  const res = await fetch('data/trophies.json');
  return res.json();
}

function loadProgress() {
  try {
    return new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function saveProgress() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
}

function renderRoadmap() {
  const steps = document.getElementById('steps');
  for (const step of ROADMAP) {
    const covered = trophies.filter((t) => t.stage === step.stage);
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = `${step.title} — ${step.hours}`;
    const p = document.createElement('p');
    p.textContent = step.text;
    const names = document.createElement('p');
    names.className = 'step-trophies';
    names.textContent = `Covers ${covered.length} trophies: ${covered.map((t) => t.name).join(' · ')}`;
    li.append(h, p, names);
    steps.append(li);
  }
  document.getElementById('missable-note').textContent =
    'Missable: only one trophy is potentially missable — Positive Mental Attitude, whose first meditation is offered at Jason’s house in Chapter 1 and never comes back. Everything else can be earned after the story in free-roam (PowerPyx).';
}

function renderSources() {
  const ul = document.getElementById('source-list');
  for (const s of Object.values(sourceMap)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    ul.append(li);
  }
}

function bindControls() {
  document.getElementById('kinds').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-kind]');
    if (!btn) return;
    kindFilter = btn.dataset.kind;
    for (const b of document.querySelectorAll('#kinds button')) b.classList.toggle('active', b === btn);
    renderTrophies();
  });
  document.getElementById('grade').addEventListener('change', (e) => {
    gradeFilter = e.target.value;
    renderTrophies();
  });
  document.getElementById('search').addEventListener('input', (e) => {
    searchText = e.target.value.trim().toLowerCase();
    renderTrophies();
  });
  const spoiler = document.getElementById('spoiler');
  spoiler.checked = spoilerOn;
  spoiler.addEventListener('change', () => setSpoilerMode(spoiler.checked));
  document.getElementById('earned-only').addEventListener('change', (e) => {
    earnedOnly = e.target.checked;
    renderTrophies();
  });
  document.getElementById('export').addEventListener('click', exportProgress);
  document.getElementById('import').addEventListener('change', importProgress);
}

function setSpoilerMode(on) {
  spoilerOn = on;
  localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
  renderTrophies();
}

function trophyMatches(t) {
  if (kindFilter === 'missable') {
    if (!t.missable) return false;
  } else if (kindFilter === 'online') {
    return false;
  } else if (kindFilter !== 'all' && !t.kind.includes(kindFilter)) {
    return false;
  }
  if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
  if (earnedOnly && !earned.has(t.name)) return false;
  if (searchText) {
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(searchText)) return false;
  }
  return true;
}

function renderTrophies() {
  const list = document.getElementById('list');
  const empty = document.getElementById('empty');
  list.replaceChildren();
  const shown = trophies.filter(trophyMatches);
  document.getElementById('count-line').textContent =
    `Showing ${shown.length} of ${trophies.length} trophies` +
    (kindFilter === 'online' ? ' — the whole list is single-player; PowerPyx lists 0 online trophies.' : '');
  if (shown.length === 0) {
    empty.hidden = false;
    empty.textContent = kindFilter === 'online'
      ? 'No online trophies. Every one of the 55 is earned in single-player (PowerPyx: 0 online trophies).'
      : 'No trophies match these filters.';
    return;
  }
  empty.hidden = true;
  for (const t of shown) {
    list.append(buildCard(t));
  }
}

function buildCard(t) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.trophy = t.name;
  if (earned.has(t.name)) card.classList.add('earned');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', `Earned: ${t.name}`);
  box.addEventListener('change', () => toggleEarned(t, box.checked));
  card.append(box);

  const body = document.createElement('div');
  const head = document.createElement('div');
  head.className = 'card-head';
  const badge = document.createElement('span');
  badge.className = `grade grade-${t.grade}`;
  badge.textContent = t.grade;
  head.append(badge);

  const isStory = t.kind.includes('story');
  const hiddenBySpoiler = spoilerOn && isStory && !earned.has(t.name);
  const title = document.createElement('h3');
  if (hiddenBySpoiler) {
    title.textContent = 'Hidden story trophy';
    title.className = 'spoiler-name';
  } else {
    title.textContent = t.name;
  }
  head.append(title);
  if (t.hidden) {
    const tag = document.createElement('span');
    tag.className = 'tag hidden-tag';
    tag.textContent = 'Hidden on PSN';
    head.append(tag);
  }
  if (t.missable) {
    const tag = document.createElement('span');
    tag.className = 'tag missable-tag';
    tag.textContent = '⚠ Potentially missable';
    head.append(tag);
  }
  if (t.count != null) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = `× ${t.count.toLocaleString('en-US')}`;
    head.append(tag);
  }
  for (const k of t.kind) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = k;
    head.append(tag);
  }
  body.append(head);

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = hiddenBySpoiler
    ? 'Hidden until earned — turn off “Hide story spoilers” or earn it to reveal its name and description.'
    : t.description;
  body.append(desc);

  if (!hiddenBySpoiler) {
    const details = document.createElement('details');
    details.className = 'card-guide';
    const summary = document.createElement('summary');
    summary.textContent = 'Guide & sources';
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    const src = document.createElement('p');
    src.className = 'sources';
    src.textContent = 'Sources: ';
    t.sources.forEach((key, i) => {
      const s = sourceMap[key];
      if (!s) return;
      if (i > 0) src.append(document.createTextNode(' · '));
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      src.append(a);
    });
    details.append(summary, guide, src);
    body.append(details);
  }
  card.append(body);
  return card;
}

function toggleEarned(t, on) {
  if (on) earned.add(t.name);
  else earned.delete(t.name);
  saveProgress();
  updateProgress();
  renderTrophies();
}

function updateProgress() {
  const total = trophies.length;
  const n = earned.size;
  const pct = Math.round((n / total) * 100);
  document.getElementById('progress-text').textContent = `${n} of ${total} earned`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || [0, 0];
    byGrade[t.grade][1] += 1;
    if (earned.has(t.name)) byGrade[t.grade][0] += 1;
  }
  document.getElementById('progress-grades').textContent =
    ['platinum', 'gold', 'silver', 'bronze']
      .map((g) => `${byGrade[g][0]}/${byGrade[g][1]} ${g}`)
      .join(' · ') + (n === total - 1 ? ' — one more earns the platinum!' : n === total ? ' — platinum earned!' : '');
}

function exportProgress() {
  const data = { game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned] };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('bad file');
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => known.has(n)));
    saveProgress();
    updateProgress();
    renderTrophies();
  } catch {
    alert('That file is not a Leonida Legend progress export.');
  }
  e.target.value = '';
}
