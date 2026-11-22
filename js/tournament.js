const primarchs = [
 {id:1,name:"Лион Эль’Джонсон",image:"images/primarchs/lion-el-jonson.webp",legion:"I легион — Тёмные Ангелы",world:"Калибан",symbol:"I",alias:"Первый",bio:"",character:"",armor:"",weapon:""},
 {id:2,name:"Фулгрим",image:"images/primarchs/fulgrim.webp",legion:"III легион — Дети Императора",world:"Хемос",symbol:"III",alias:"Фениксий",bio:"",character:"",armor:"",weapon:""},
 {id:3,name:"Пертурабо",image:"images/primarchs/perturabo.webp",legion:"IV легион — Железные Воины",world:"Олимпия",symbol:"IV",alias:"Мастер осады",bio:"",character:"",armor:"",weapon:""},
 {id:4,name:"Джагатай-хан",image:"images/primarchs/jaghatai-khan.webp",legion:"V легион — Белые Шрамы",world:"Чогорис",symbol:"V",alias:"Великий хан",bio:"",character:"",armor:"",weapon:""},
 {id:5,name:"Леман Русс",image:"images/primarchs/leman-russ.webp",legion:"VI легион — Космические Волки",world:"Фенрис",symbol:"VI",alias:"Волчий король",bio:"",character:"",armor:"",weapon:""},
 {id:6,name:"Рогал Дорн",image:"images/primarchs/rogal-dorn.webp",legion:"VII легион — Имперские Кулаки",world:"Инwit",symbol:"VII",alias:"Имперский скала",bio:"",character:"",armor:"",weapon:""},
 {id:7,name:"Конрад Кёрз",image:"images/primarchs/konrad-curze.webp",legion:"VIII легион — Повелители Ночи",world:"Нострамо",symbol:"VIII",alias:"Ночной призрак",bio:"",character:"",armor:"",weapon:""},
 {id:8,name:"Сангвиний",image:"images/primarchs/sanguinius.webp",legion:"IX легион — Кровавые Ангелы",world:"Баал",symbol:"IX",alias:"Великий Ангел",bio:"",character:"",armor:"",weapon:""},
 {id:9,name:"Феррус Манус",image:"images/primarchs/ferrus-manus.webp",legion:"X легион — Железные Руки",world:"Медуза",symbol:"X",alias:"Горгон",bio:"",character:"",armor:"",weapon:""},
 {id:10,name:"Ангрон",image:"images/primarchs/angron.webp",legion:"XII легион — Пожиратели Миров",world:"Нуцерия",symbol:"XII",alias:"Красный Ангел",bio:"",character:"",armor:"",weapon:""},
 {id:11,name:"Робут Жиллиман",image:"images/primarchs/roboute-guilliman.webp",legion:"XIII легион — Ультрамарины",world:"Макрагг",symbol:"XIII",alias:"Господарь Ультрамара",bio:"",character:"",armor:"",weapon:""},
 {id:12,name:"Мортарион",image:"images/primarchs/mortarion.webp",legion:"XIV легион — Гвардия Смерти",world:"Барбарус",symbol:"XIV",alias:"Бледный король",bio:"",character:"",armor:"",weapon:""},
 {id:13,name:"Магнус Красный",image:"images/primarchs/magnus-the-red.webp",legion:"XV легион — Тысяча Сынов",world:"Просперо",symbol:"XV",alias:"Красный король",bio:"",character:"",armor:"",weapon:""},
 {id:14,name:"Хорус Луперкаль",image:"images/primarchs/horus-lupercal.webp",legion:"XVI легион — Лунные Волки",world:"Ктания",symbol:"XVI",alias:"Воитель",bio:"",character:"",armor:"",weapon:""},
 {id:15,name:"Лоргар Аврелиан",image:"images/primarchs/lorgar.webp",legion:"XVII легион — Несущие Слово",world:"Колхида",symbol:"XVII",alias:"Первосвященник",bio:"",character:"",armor:"",weapon:""},
 {id:16,name:"Вулкан",image:"images/primarchs/vulkan.webp",legion:"XVIII легион — Саламандры",world:"Nocturne",symbol:"XVIII",alias:"Повелитель огня",bio:"",character:"",armor:"",weapon:""},
 {id:17,name:"Коракс",image:"images/primarchs/corvus-corax.webp",legion:"XIX легион — Гвардия Ворона",world:"Deliverance (Ликей)",symbol:"XIX",alias:"Тень Императора",bio:"",character:"",armor:"",weapon:""},
 {id:20,name:"Альфарий / Омегон",image:"images/primarchs/alpharius-omegon.webp",legion:"XX легион — Альфа-Легион",world:"Не подтверждена однозначно",symbol:"XX",alias:"Два примарха, один участник",bio:"",character:"",armor:"Братья выступают как один участник: их ранняя броня практически идентична.",weapon:""}
];

const ROUND_NAMES = ["Предварительный этап", "1/8 финала", "Четвертьфинал", "Полуфинал", "Финал"];
const $ = selector => document.querySelector(selector);
let tournament = null;
let activeRoundIndex = -1;
let activeMatchIndex = 0;
let viewedRoundIndex = -1;
let votingLocked = false;
let drawing = false;
let transitionTimer = null;

function esc(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function makeMatch(a, b, label) { return {a, b, label, winner:null}; }
function currentMatches() {
  if (!tournament) return [];
  return activeRoundIndex === -1 ? tournament.prelim : tournament.rounds[activeRoundIndex];
}
function allResolved(matches) { return matches.length > 0 && matches.every(match => match && match.winner); }
function countWinners() {
  if (!tournament) return 0;
  return [...tournament.prelim, ...tournament.rounds.filter(Boolean).flat()].filter(match => match && match.winner).length;
}
function getChampion() { return tournament?.champion || null; }
function totalRoundsAvailable() { return activeRoundIndex + 2; }
function stageLabel(index) { return ROUND_NAMES[index + 1]; }

function renderParticipants() {
  $('#participantGrid').innerHTML = primarchs.map(p => `
    <article class="card">
      <div class="card-top"><span>Легион ${esc(p.symbol)}</span><span class="status">Участник</span></div>
      <div class="sig">${esc(p.symbol)}</div>
      <h3>${esc(p.name)}</h3><p>${esc(p.legion)}</p>
      <div class="open"><button class="btn secondary" data-profile="${p.id}">Открыть досье →</button></div>
    </article>`).join('');
}

function openProfile(id) {
  const p = primarchs.find(item => item.id === id);
  if (!p) return;
  const fields = [
    ["Кто он", "bio", "Биография участника будет добавлена в досье."],
    ["Характер", "character", "Разберём темперамент, привычки и особенности личности."],
    ["Броня и стиль", "armor", "Здесь будет подробный разбор брони начала Ереси Хоруса."],
    ["Оружие", "weapon", "Добавим основное оружие и его особенности."]
  ];
  $('#profileContent').innerHTML = `
    <div class="profile-kicker">Досье участника · Легион ${esc(p.symbol)}</div>
    <h2 class="profile-title" id="profileTitle">${esc(p.name)}</h2>
    <div class="profile-sub">${esc(p.alias)} · ${esc(p.legion)}</div>
    <div class="profile-art"><img src="${esc(p.image)}" alt="${esc(p.name)} — полный образ" loading="lazy" decoding="async"></div>
    <div class="profile-grid">
      <div class="info"><h4>Родная планета</h4><p>${esc(p.world)}</p></div>
      <div class="info"><h4>Легион</h4><p>${esc(p.legion)}</p></div>
      ${fields.map(([title,key,fallback]) => `<div class="info full"><h4>${title}</h4><p>${esc(p[key] || fallback)}</p></div>`).join('')}
    </div>
    <div class="note">Историческая рамка проекта: начало Ереси Хоруса. Поздние демонические и послевоенные облики в основной конкурс не включаются.</div>`;
  $('#profileModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeProfile() {
  $('#profileModal').classList.remove('show');
  document.body.style.overflow = '';
}

function drawTournament() {
  if (drawing) return;
  if (tournament && !window.confirm('Новая жеребьёвка сбросит текущие результаты. Продолжить?')) return;

  const tabs = document.querySelector('nav[aria-label="Навигация турнира"]');
  if (tabs) {
    const stickyHeader = document.querySelector('.top');
    const topOffset = stickyHeader ? stickyHeader.getBoundingClientRect().height : 0;
    const targetY = window.scrollY + tabs.getBoundingClientRect().top - topOffset - 8;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  }

  clearTimeout(transitionTimer);
  tournament = null;
  activeRoundIndex = -1;
  activeMatchIndex = 0;
  viewedRoundIndex = -1;
  votingLocked = false;
  drawing = true;

  const shuffled = shuffle(primarchs);
  tournament = {
    prelim: [
      makeMatch(shuffled[0], shuffled[1], 'Предварительная пара I'),
      makeMatch(shuffled[2], shuffled[3], 'Предварительная пара II')
    ],
    byes: shuffled.slice(4),
    rounds: [null, null, null, null],
    champion: null
  };

  drawing = false;
  $('#drawBtn').disabled = false;
  $('#drawBtn').classList.remove('primary');
  $('#drawBtn').textContent = 'Провести новую жеребьёвку';
  renderAll();
}
function createRoundOf16() {
  const matches = [];
  for (let i = 0; i < 14; i += 2) {
    matches.push(makeMatch(tournament.byes[i], tournament.byes[i + 1], `Бой ${matches.length + 1}`));
  }
  matches.push(makeMatch(tournament.prelim[0].winner, tournament.prelim[1].winner, 'Бой 8'));
  tournament.rounds[0] = matches;
}
function createNextRound(roundIndex) {
  const previous = tournament.rounds[roundIndex];
  const nextSize = previous.length / 2;
  const next = [];
  for (let i = 0; i < nextSize; i++) {
    const left = previous[i * 2].winner;
    const right = previous[i * 2 + 1].winner;
    const label = roundIndex === 2 ? 'За корону' : `Бой ${i + 1}`;
    next.push(makeMatch(left, right, label));
  }
  tournament.rounds[roundIndex + 1] = next;
}

function vote(side) {
  if (!tournament || votingLocked || drawing || getChampion()) return;
  const matches = currentMatches();
  const match = matches[activeMatchIndex];
  if (!match || match.winner) return;
  const winner = side === 0 ? match.a : match.b;
  if (!winner) return;
  match.winner = winner;
  votingLocked = true;
  renderAll();
  transitionTimer = setTimeout(() => {
    const finished = allResolved(matches);
    if (finished) {
      if (activeRoundIndex === -1) {
        createRoundOf16();
        activeRoundIndex = 0;
      } else if (activeRoundIndex < 3) {
        if (activeRoundIndex === 2) {
          createNextRound(2);
          activeRoundIndex = 3;
        } else {
          createNextRound(activeRoundIndex);
          activeRoundIndex += 1;
        }
      } else {
        tournament.champion = match.winner;
      }
      activeMatchIndex = 0;
      viewedRoundIndex = activeRoundIndex;
    } else {
      activeMatchIndex += 1;
    }
    votingLocked = false;
    renderAll();
  }, 2300);
}

function getRoundMatches(index) {
  if (!tournament) return [];
  if (index === -1) return tournament.prelim;
  return tournament.rounds[index] || [];
}
function renderStats() {
  const completed = countWinners();
  const champion = getChampion();
  $('#arenaStats').innerHTML = `
    <div class="stat"><strong>18</strong><span>Примархов</span></div>
    <div class="stat"><strong>${completed}<small>/ 17</small></strong><span>Поединков решено</span></div>
    <div class="stat"><strong>${champion ? '♛' : '—'}</strong><span>${champion ? 'Чемпион' : 'Одна корона'}</span></div>`;
}
function renderArena() {
  if (!tournament) return;
  const champion = getChampion();
  if (champion) {
    $('#arenaContent').innerHTML = `
      <div class="champion"><div class="crown">♛</div><div class="kicker">Победитель турнира</div>
        <h3>${esc(champion.name)}</h3><p class="small">${esc(champion.legion)}</p></div>`;
    return;
  }
  const matches = currentMatches();
  const match = matches[activeMatchIndex];
  if (!match) {
    const champion = getChampion();
    if (champion) {
      $('#arenaContent').innerHTML = `
        <div class="champion"><div class="crown">♛</div><div class="kicker">Победитель турнира</div>
          <h3>${esc(champion.name)}</h3><p class="small">${esc(champion.legion)}</p></div>`;
    }
    return;
  }
  const stageIndex = activeRoundIndex + 1;
  const stageName = ROUND_NAMES[stageIndex];
  const isResolved = Boolean(match.winner);
  const renderFighter = (p, side) => {
    const isWinner = isResolved && match.winner === p;
    const isLoser = isResolved && match.winner !== p;
    return `
      <article class="card fighter-card ${isWinner ? 'is-winner' : ''} ${isLoser ? 'is-loser' : ''}">
        <div class="card-top"><span>Легион ${esc(p.symbol)}</span><span class="status">${isWinner ? 'Победитель' : isLoser ? 'Участник' : 'Претендент'}</span></div>
        <div class="fighter-art"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></div>
        <h3>${esc(p.name)}</h3><p>${esc(p.legion)}</p>
        <div class="fighter-actions">
          <button class="btn primary vote-button" data-vote="${side}" ${isResolved ? 'disabled' : ''}>${isResolved ? (isWinner ? 'Победитель' : 'Голос принят') : 'Проголосовать'}</button>
          <button class="btn secondary" data-profile="${p.id}">Подробнее</button>
        </div>
      </article>`;
  };
  $('#arenaContent').innerHTML = `
    <div class="arena-eyebrow">${esc(stageName)} · ${esc(match.label)}</div>
    <h2 class="arena-title">Выбери победителя поединка</h2>
    <div class="fighters-grid">${renderFighter(match.a, 0)}${renderFighter(match.b, 1)}</div>`;
}

function renderRoundHistory() {
  if (!tournament || activeRoundIndex < 0) {
    $('#roundHistory').hidden = true;
    return;
  }
  const previousIndices = [];
  for (let i = -1; i < activeRoundIndex; i++) previousIndices.push(i);
  const currentName = ROUND_NAMES[activeRoundIndex + 1];
  $('#roundHistory').hidden = false;
  $('#roundHistory').innerHTML = `
    ${previousIndices.length ? '<span class="history-label">Завершённые этапы</span>' : ''}
    ${previousIndices.map((index, position) => `
      ${position ? '<span class="history-separator">›</span>' : ''}
      <button class="history-button ${viewedRoundIndex === index ? 'selected' : ''}" data-round-view="${index}">${esc(ROUND_NAMES[index + 1])}</button>`).join('')}
    ${previousIndices.length ? '<span class="history-separator">›</span>' : ''}
    <button class="current-stage-label ${viewedRoundIndex === activeRoundIndex ? 'selected' : ''}" data-round-view="${activeRoundIndex}">${tournament.champion ? 'Завершён: ' : 'Сейчас: '}${esc(currentName)}</button>`;
}
function renderBracketMatch(match, index) {
  const winner = match.winner;
  const contender = p => `
    <div class="bracket-contender ${winner === p ? 'winner' : ''}">
      <span>${esc(p.name)}</span><span class="crown">${winner === p ? '♛' : ''}</span>
    </div>`;
  return `
    <article class="bracket-match ${winner ? 'has-winner' : ''}">
      <div class="match-label">${esc(match.label || `Поединок ${index + 1}`)}</div>
      ${contender(match.a)}${contender(match.b)}
    </article>`;
}
function renderBracket() {
  if (!tournament) {
    $('#roundHistory').hidden = true;
    $('#bracketSubheading').textContent = 'Результаты будут появляться здесь по мере голосования.';
    $('#bracketArea').innerHTML = '<div class="bracket-empty">После жеребьёвки здесь появятся пары текущего этапа. Будущие этапы откроются постепенно.</div>';
    return;
  }
  renderRoundHistory();
  const index = viewedRoundIndex;
  const matches = getRoundMatches(index);
  const roundClass = index === -1 ? 'prelim' : ['r16','qf','sf','final'][index];
  const isCurrent = index === activeRoundIndex;
  const stageDone = allResolved(matches);
  $('#bracketSubheading').textContent = isCurrent ? 'Текущий этап' : 'Завершённый этап';
  $('#bracketArea').innerHTML = `
    <div class="bracket-view-heading"><span>${matches.filter(match => match.winner).length} из ${matches.length} поединков решено${stageDone ? ' · этап завершён' : ''}</span></div>
    <div class="bracket-grid ${roundClass}">${matches.map(renderBracketMatch).join('')}</div>
    ${stageDone ? '<div class="bracket-stage-complete">ЭТАП ЗАВЕРШЁН</div>' : ''}`;
}
function renderHall() {
  const champion = getChampion();
  $('#hallContent').innerHTML = champion
    ? `<div class="champion"><div class="crown">♛</div><div class="kicker">Победитель турнира</div><h3>${esc(champion.name)}</h3><p class="small">${esc(champion.legion)}</p></div>`
    : '<div class="empty">Корона пока ждёт своего владельца.</div>';
}
function renderDrawStatus() {
  const status = $('#drawStatus');
  if (!tournament || getChampion()) {
    status.innerHTML = '';
    return;
  }
  const matches = currentMatches();
  const match = matches[activeMatchIndex];
  if (!match || !match.winner) {
    status.innerHTML = '';
    return;
  }
  status.innerHTML = `<strong>Голос принят · Победитель — ${esc(match.winner.name)}!</strong>`;
}

function renderAll() {
  renderStats();
  renderDrawStatus();
  renderArena();
  renderBracket();
  renderHall();
}

// Делегирование событий: работает и для карточек, которые перерисовываются после каждого голоса.
document.addEventListener('click', event => {
  const profileButton = event.target.closest('[data-profile]');
  if (profileButton) {
    openProfile(Number(profileButton.dataset.profile));
    return;
  }
  const voteButton = event.target.closest('[data-vote]');
  if (voteButton) {
    vote(Number(voteButton.dataset.vote));
    return;
  }
  const historyButton = event.target.closest('[data-round-view]');
  if (historyButton) {
    if (votingLocked) return;
    viewedRoundIndex = Number(historyButton.dataset.roundView);
    renderRoundHistory();
    renderBracket();
    return;
  }
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    document.querySelectorAll('.tab').forEach(item => item.classList.toggle('active', item === tab));
    document.querySelectorAll('.section').forEach(item => item.classList.toggle('active', item.id === tab.dataset.tab));
  }
});

$('#closeModal').addEventListener('click', closeProfile);
$('#profileModal').addEventListener('click', event => { if (event.target.id === 'profileModal') closeProfile(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeProfile(); });
$('#drawBtn').addEventListener('click', drawTournament);


renderParticipants();
renderAll();