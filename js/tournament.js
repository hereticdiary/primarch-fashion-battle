const primarchs = [{"id":1,"name":"Лев Эль’Джонсон","image":"images/primarchs/lion-el-jonson.webp","legion":"I легион — Тёмные Ангелы","world":"Калибан","symbol":"I","alias":"Первый"},{"id":2,"name":"Фулгрим","image":"images/primarchs/fulgrim.webp","legion":"III легион — Дети Императора","world":"Хемос","symbol":"III","alias":"Фениксий"},{"id":3,"name":"Пертурабо","image":"images/primarchs/perturabo.webp","legion":"IV легион — Железные Воины","world":"Олимпия","symbol":"IV","alias":"Мастер осады"},{"id":4,"name":"Джагатай Хан","image":"images/primarchs/jaghatai-khan.webp","legion":"V легион — Белые Шрамы","world":"Чогорис","symbol":"V","alias":"Великий хан"},{"id":5,"name":"Леман Русс","image":"images/primarchs/leman-russ.webp","legion":"VI легион — Космические Волки","world":"Фенрис","symbol":"VI","alias":"Волчий король"},{"id":6,"name":"Рогал Дорн","image":"images/primarchs/rogal-dorn.webp","legion":"VII легион — Имперские Кулаки","world":"Инвит","symbol":"VII","alias":"Имперский претор"},{"id":7,"name":"Конрад Кёрз","image":"images/primarchs/konrad-curze.webp","legion":"VIII легион — Повелители Ночи","world":"Нострамо","symbol":"VIII","alias":"Ночной призрак"},{"id":8,"name":"Сангвиний","image":"images/primarchs/sanguinius.webp","legion":"IX легион — Кровавые Ангелы","world":"Баал","symbol":"IX","alias":"Великий Ангел"},{"id":9,"name":"Феррус Манус","image":"images/primarchs/ferrus-manus.webp","legion":"X легион — Железные Руки","world":"Медуза","symbol":"X","alias":"Горгон"},{"id":10,"name":"Ангрон","image":"images/primarchs/angron.webp","legion":"XII легион — Пожиратели Миров","world":"Нуцерия","symbol":"XII","alias":"Красный Ангел"},{"id":11,"name":"Робаут Жиллиман","image":"images/primarchs/roboute-guilliman.webp","legion":"XIII легион — Ультрамарины","world":"Макрагг","symbol":"XIII","alias":"Господарь Ультрамара"},{"id":12,"name":"Мортарион","image":"images/primarchs/mortarion.webp","legion":"XIV легион — Гвардия Смерти","world":"Барбарус","symbol":"XIV","alias":"Бледный король"},{"id":13,"name":"Магнус Красный","image":"images/primarchs/magnus-the-red.webp","legion":"XV легион — Тысяча Сынов","world":"Просперо","symbol":"XV","alias":"Красный король"},{"id":14,"name":"Хорус Луперкаль","image":"images/primarchs/horus-lupercal.webp","legion":"XVI легион — Лунные Волки","world":"Хтония","symbol":"XVI","alias":"Воитель"},{"id":15,"name":"Лоргар Аврелиан","image":"images/primarchs/lorgar.webp","legion":"XVII легион — Несущие Слово","world":"Колхида","symbol":"XVII","alias":"Первосвященник"},{"id":16,"name":"Вулкан","image":"images/primarchs/vulkan.webp","legion":"XVIII легион — Саламандры","world":"Ноктюрн","symbol":"XVIII","alias":"Повелитель огня"},{"id":17,"name":"Корвус Коракс","image":"images/primarchs/corvus-corax.webp","legion":"XIX легион — Гвардия Ворона","world":"Освобождение (бывший Ликей, луна Киавара)","symbol":"XIX","alias":"Тень Императора"},{"id":20,"name":"Альфарий и Омегон","image":"images/primarchs/alpharius-omegon.webp","legion":"XX легион — Альфа-Легион","world":"Терра? (Альфарий); Омегон — неизвестно","symbol":"XX","alias":"Два примарха, один участник"}];

const ROUND_NAMES = ["Предварительный этап", "1/8 финала", "Четвертьфинал", "Полуфинал", "Финал"];
const TOTAL_MATCHES = 17;
const $ = selector => document.querySelector(selector);
let tournament = null;
let activeRoundIndex = -1;
let activeMatchIndex = 0;
let viewedRoundIndex = -1;
let votingLocked = false;
let drawing = false;
let currentProfileIndex = -1;
const preloadedPrimarchImages = new Map();
let transitionTimer = null;

let profileDossiersPromise = null;
let profileLoadToken = 0;

function loadProfileDossiers() {
  if (!profileDossiersPromise) {
    profileDossiersPromise = fetch("data/primarch-dossiers.json?v=20261122-1")
      .then(response => {
        if (!response.ok) throw new Error("Не удалось загрузить данные досье");
        return response.json();
      })
      .catch(error => {
        profileDossiersPromise = null;
        throw error;
      });
  }
  return profileDossiersPromise;
}

let pendingTransition = false;
let hallTournaments = [];
const CURRENT_SAVE_KEY = "primarchFashionBattle.current.v1";
const HALL_SAVE_KEY = "primarchFashionBattle.hall.v1";

function safeReadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("Не удалось прочитать сохранение турнира:", error);
    return fallback;
  }
}
function saveCurrentTournament() {
  if (!tournament) return;
  try {
    localStorage.setItem(CURRENT_SAVE_KEY, JSON.stringify({
      version: 1,
      tournament,
      activeRoundIndex,
      activeMatchIndex,
      viewedRoundIndex,
      pendingTransition
    }));
  } catch (error) {
    console.warn("Не удалось сохранить текущий турнир:", error);
  }
}
function clearCurrentTournamentSave() {
  try { localStorage.removeItem(CURRENT_SAVE_KEY); }
  catch (error) { console.warn("Не удалось удалить сохранение турнира:", error); }
}
function compactPrimarch(p) {
  if (!p) return null;
  return { id:p.id, name:p.name, image:p.image, legion:p.legion, symbol:p.symbol };
}
function compactMatch(match) {
  if (!match) return null;
  return {
    a:compactPrimarch(match.a),
    b:compactPrimarch(match.b),
    label:match.label || "",
    winnerId:match.winner?.id ?? null
  };
}
function createHallEntry(source) {
  const champion = source.champion || getChampion();
  return {
    id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
    completedAt: new Date().toISOString(),
    champion: compactPrimarch(champion),
    prelim: (source.prelim || []).map(compactMatch),
    rounds: (source.rounds || []).map(round => Array.isArray(round) ? round.map(compactMatch) : null)
  };
}
function saveHallArchive() {
  try { localStorage.setItem(HALL_SAVE_KEY, JSON.stringify(hallTournaments)); }
  catch (error) { console.warn("Не удалось сохранить Зал славы:", error); }
}
function archiveCompletedTournament() {
  if (!getChampion()) return;
  hallTournaments.unshift(createHallEntry(tournament));
  saveHallArchive();
  clearCurrentTournamentSave();
}
function restoreMatchReferences(match) {
  if (!match || !match.a || !match.b) return;
  const winnerId = match.winner?.id ?? null;
  match.winner = winnerId === null ? null
    : (match.a.id === winnerId ? match.a : match.b.id === winnerId ? match.b : null);
}
function restoreSavedTournament() {
  const savedHall = safeReadStorage(HALL_SAVE_KEY, []);
  hallTournaments = Array.isArray(savedHall) ? savedHall : [];
  const saved = safeReadStorage(CURRENT_SAVE_KEY, null);
  if (!saved || saved.version !== 1 || !saved.tournament) return;

  tournament = saved.tournament;
  (tournament.prelim || []).forEach(restoreMatchReferences);
  (tournament.rounds || []).forEach(round => Array.isArray(round) && round.forEach(restoreMatchReferences));
  activeRoundIndex = Number.isInteger(saved.activeRoundIndex) ? saved.activeRoundIndex : -1;
  activeMatchIndex = Number.isInteger(saved.activeMatchIndex) ? saved.activeMatchIndex : 0;
  viewedRoundIndex = Number.isInteger(saved.viewedRoundIndex) ? saved.viewedRoundIndex : activeRoundIndex;
  pendingTransition = Boolean(saved.pendingTransition);

  if (tournament.champion) {
    const finalMatch = tournament.rounds?.[3]?.[0];
    if (finalMatch?.winner) tournament.champion = finalMatch.winner;
  }
  if (pendingTransition) {
    votingLocked = true;
    transitionTimer = setTimeout(completeVoteTransition, 2300);
  }
}

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
function preloadPrimarchImage(src) {
  if (!src || preloadedPrimarchImages.has(src)) return;
  const image = new Image();
  image.decoding = 'async';
  image.fetchPriority = 'low';
  image.src = src;
  preloadedPrimarchImages.set(src, image);
}

function preloadMatchImages(match) {
  if (!match) return;
  preloadPrimarchImage(match.a?.image);
  preloadPrimarchImage(match.b?.image);
}
function championMarkup(champion) {
  return `
    <div class="champion">
      <div class="crown">♛</div>
      <div class="kicker">Победитель турнира</div>
      <h3>${esc(champion.name)}</h3>
      <p class="small">${esc(champion.legion)}</p>
      <div class="champion-art">
        <img src="${esc(champion.image)}" alt="${esc(champion.name)} — чемпион турнира" decoding="async">
      </div>
    </div>`;
}
function stageLabel(index) { return ROUND_NAMES[index + 1]; }
const PRIMARY_ART_SOURCE = "https://www.israelllona.com/horusheresylegions";

function getProfileImages(primarch) {
  const primary = {
    src: primarch.image,
    title: "Основная иллюстрация",
    author: "Israel Llona",
    source: PRIMARY_ART_SOURCE,
    sourceLabel: "Портфолио: Horus Heresy: Legions"
  };
  const additional = Array.isArray(primarch.extraImages) ? primarch.extraImages : [];
  return [primary, ...additional];
}

function renderProfileGallery(primarch, images, activeIndex) {
  const item = images[activeIndex];
  const hasMany = images.length > 1;
  return `
    <div class="profile-gallery" data-gallery-profile="${primarch.id}" data-gallery-current="${activeIndex}">
      <div class="profile-art">
        <img src="${esc(item.src)}" alt="${esc(item.title || primarch.name)}" loading="eager" fetchpriority="high" decoding="async">
        ${hasMany ? `
          <button class="gallery-arrow gallery-prev" type="button" data-gallery-step="-1" aria-label="Предыдущее изображение">‹</button>
          <button class="gallery-arrow gallery-next" type="button" data-gallery-step="1" aria-label="Следующее изображение">›</button>
        ` : ""}
      </div>
      <div class="gallery-credit">
        <span class="gallery-count">${activeIndex + 1} / ${images.length}</span>
        <span>Автор: <strong>${esc(item.author || "Автор не указан")}</strong></span>
        ${item.source ? `<a href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">${esc(item.sourceLabel || "Открыть работу / источник")} ↗</a>` : ""}
      </div>
      ${hasMany ? `
        <div class="gallery-thumbnails" aria-label="Другие изображения">
          ${images.map((image, index) => `
            <button class="gallery-thumb ${index === activeIndex ? "active" : ""}" type="button" data-gallery-index="${index}" data-gallery-profile="${primarch.id}" aria-label="Изображение ${index + 1}">
              <img src="${esc(image.src)}" alt="" loading="lazy">
            </button>
          `).join("")}
        </div>
      ` : ""}
    </div>`;
}

function renderParticipants() {
  $('#participantGrid').innerHTML = primarchs.map(p => {
    const legionName = p.legion.replace(/^[IVXLCDM]+\s+легион\s+—\s+/i, '');
    return '<article class="card participant-card" data-profile="' + p.id + '" role="button" tabindex="0" aria-label="Открыть досье: ' + esc(p.name) + '">' +
      '<div class="participant-roman" aria-hidden="true">' + esc(p.symbol) + '</div>' +
      '<h3>' + esc(p.name) + '</h3>' +
      '<p class="participant-legion">' + esc(legionName) + '</p>' +
      '<div class="participant-world"><span>МИР</span><strong>' + esc(p.world) + '</strong></div>' +
    '</article>';
  }).join('');
}

async function openProfile(id, requestedImageIndex = 0) {
  const participant = primarchs.find(item => item.id === id);
  if (!participant) return;

  currentProfileIndex = primarchs.findIndex(item => item.id === id);
  const loadToken = ++profileLoadToken;

  document.body.style.overflow = 'hidden';
  $('#profileModal').classList.add('show');
  $('#profileModal').scrollTop = 0;
  $('#profileContent').innerHTML = `
    <div class="profile-kicker">Досье участника · Легион ${esc(participant.symbol)} / XX</div>
    <h2 class="profile-title" id="profileTitle">${esc(participant.name)}</h2>
    <div class="profile-sub">Загружаем архивные материалы…</div>`;
  syncProfileSwitcherPosition();

  let dossiers;
  try {
    dossiers = await loadProfileDossiers();
  } catch (error) {
    if (loadToken !== profileLoadToken) return;
    console.error(error);
    $('#profileContent').innerHTML = `
      <div class="profile-kicker">Досье участника</div>
      <h2 class="profile-title" id="profileTitle">${esc(participant.name)}</h2>
      <div class="empty">Не удалось загрузить материалы досье. Проверь соединение и открой карточку ещё раз.</div>`;
    return;
  }
  if (loadToken !== profileLoadToken) return;

  const dossier = dossiers[String(id)];
  if (!dossier) {
    $('#profileContent').innerHTML = `
      <div class="profile-kicker">Досье участника</div>
      <h2 class="profile-title" id="profileTitle">${esc(participant.name)}</h2>
      <div class="empty">Для этого участника пока нет архивного досье.</div>`;
    return;
  }

  const p = { ...participant, ...dossier };
  const fields = [['Кто он', 'bio'], ['Характер', 'character'], ['Броня и стиль', 'armor'], ['Оружие', 'weapon']];
  const images = getProfileImages(p);
  const imageIndex = ((requestedImageIndex % images.length) + images.length) % images.length;
  const fieldsHtml = fields.map(([title, key]) => '<div class="info full"><h4>' + title + '</h4><p>' + esc(p[key]) + '</p></div>').join('');
  const html = [
    '<div class="profile-kicker">Досье участника · Легион ' + esc(p.symbol) + ' / XX</div>',
    '<h2 class="profile-title" id="profileTitle">' + esc(p.name) + '</h2>',
    '<div class="profile-sub">' + esc(p.alias) + '</div>',
    '<div class="profile-switcher" aria-label="Переключение между примархами">',
      '<button type="button" data-profile-step="-1" aria-label="Предыдущий примарх"><svg class="profile-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 4 8 12l8 8"/></svg></button>',
      '<button type="button" data-profile-step="1" aria-label="Следующий примарх"><svg class="profile-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4 16 12l-8 8"/></svg></button>',
    '</div>',
    renderProfileGallery(p, images, imageIndex),
    '<div class="profile-grid">',
      '<div class="info"><h4>Родной мир</h4><p>' + esc(p.world) + '</p></div>',
      '<div class="info"><h4>Легион</h4><p>' + esc(p.legion) + '</p></div>',
      fieldsHtml,
    '</div>',
    '<div class="profile-source"><span>Материал WHArchive:</span> <a href="' + esc(p.loreSource) + '" target="_blank" rel="noopener noreferrer">' + (p.id === 20 ? 'Альфарий' : esc(p.name)) + ' ↗</a>' + (p.loreSource2 ? ' <span class="profile-source-separator">·</span> <a href="' + esc(p.loreSource2) + '" target="_blank" rel="noopener noreferrer">Омегон ↗</a>' : '') + '</div>',
    '<div class="note">Историческая рамка проекта: Великий крестовый поход и начало Ереси Хоруса. Описания брони и оружия относятся к этому периоду; поздние демонические и послевоенные облики не смешиваются с ранними версиями.</div>'
  ].join('');
  $('#profileContent').innerHTML = html;
  $('#profileModal').scrollTop = 0;
  syncProfileSwitcherPosition();
  requestAnimationFrame(() => requestAnimationFrame(syncProfileSwitcherPosition));
}
function toRoman(number) {
  const values = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let value = number, result = '';
  for (const [amount, numeral] of values) while (value >= amount) { result += numeral; value -= amount; }
  return result;
}
function stepProfile(direction) {
  if (currentProfileIndex < 0) return;
  const nextIndex = (currentProfileIndex + direction + primarchs.length) % primarchs.length;
  openProfile(primarchs[nextIndex].id);
}

function syncProfileSwitcherPosition() {
  const modal = $('#profileModal');
  const modalBox = modal?.querySelector('.modal-box');
  const switcher = modal?.querySelector('.profile-switcher');
  if (!modal || !modal.classList.contains('show') || !modalBox || !switcher) return;
  const rect = modalBox.getBoundingClientRect();
  switcher.style.setProperty('--profile-modal-left', rect.left + 'px');
  switcher.style.setProperty('--profile-modal-width', rect.width + 'px');
}
function closeProfile() {
  profileLoadToken += 1;
  $('#profileModal').classList.remove('show');
  document.body.style.overflow = '';
  currentProfileIndex = -1;
}

function scrollToTournamentTabs() {
  requestAnimationFrame(() => {
    const tabs = document.querySelector('nav[aria-label="Навигация турнира"]');
    if (!tabs) return;

    const stickyHeader = document.querySelector('.top');
    const topOffset = stickyHeader ? stickyHeader.getBoundingClientRect().height : 0;
    const targetY = window.scrollY + tabs.getBoundingClientRect().top - topOffset - 10;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });
}

function startTournament() {
  if (drawing || tournament) return;

  clearTimeout(transitionTimer);
  transitionTimer = null;
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
  pendingTransition = false;
  saveCurrentTournament();
  renderAll();
  scrollToTournamentTabs();
}

function resetTournament() {
  if (drawing) return;

  clearTimeout(transitionTimer);
  transitionTimer = null;
  tournament = null;
  activeRoundIndex = -1;
  activeMatchIndex = 0;
  viewedRoundIndex = -1;
  votingLocked = false;
  drawing = false;
  pendingTransition = false;

  clearCurrentTournamentSave();
  renderAll();
}

function handleDrawButtonClick() {
  if (tournament) resetTournament();
  else startTournament();
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
  if (activeMatchIndex + 1 < matches.length) {
    preloadMatchImages(matches[activeMatchIndex + 1]);
  } else if (allResolved(matches) && activeRoundIndex < 3) {
    if (activeRoundIndex === -1) {
      preloadPrimarchImage(tournament.byes[0]?.image);
      preloadPrimarchImage(tournament.byes[1]?.image);
    } else {
      preloadPrimarchImage(matches[0]?.winner?.image);
      preloadPrimarchImage(matches[1]?.winner?.image);
    }
  }
  votingLocked = true;
  pendingTransition = true;
  saveCurrentTournament();
  renderAll();
  transitionTimer = setTimeout(completeVoteTransition, 2300);
}

function completeVoteTransition() {
  if (!tournament || !pendingTransition) return;
  const matches = currentMatches();
  const match = matches[activeMatchIndex];
  if (!match || !match.winner) {
    pendingTransition = false;
    votingLocked = false;
    saveCurrentTournament();
    return;
  }

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

  pendingTransition = false;
  votingLocked = false;
  if (getChampion()) archiveCompletedTournament();
  else saveCurrentTournament();
  renderAll();
}

function getRoundMatches(index) {
  if (!tournament) return [];
  if (index === -1) return tournament.prelim;
  return tournament.rounds[index] || [];
}
function renderDrawButton() {
  const controls = $('.arena-controls');
  const button = $('#drawBtn');
  const isActive = Boolean(tournament);

  controls.classList.toggle('is-idle', !isActive);
  controls.classList.toggle('is-active', isActive);
  button.classList.toggle('primary', !isActive);
  button.textContent = isActive ? 'Сбросить поединок' : 'Начать поединок';
  button.disabled = drawing;
}

function renderStats() {
  if (!tournament) {
    $('#arenaStats').innerHTML = `
      <div class="arena-prelude">
        <strong>Здесь оценивают не силу легионов, а стиль их примархов.</strong>
      </div>`;
    return;
  }

  const completed = countWinners();
  const percentage = Math.round(completed / TOTAL_MATCHES * 100);
  $('#arenaStats').innerHTML = `
    <div class="progress-line-wrap">
      <span class="progress-count">${completed} / ${TOTAL_MATCHES}</span>
      <div class="progress-track" role="progressbar" aria-label="Прогресс турнира"
           aria-valuemin="0" aria-valuemax="${TOTAL_MATCHES}" aria-valuenow="${completed}"
           aria-valuetext="${completed} из ${TOTAL_MATCHES} поединков завершено">
        <span class="progress-fill" style="width:${percentage}%"></span>
      </div>
    </div>`;
}
function renderArena() {
  if (!tournament) {
    $('#arenaContent').innerHTML = `
      <div class="arena-empty">
        <span class="arena-emblem">✦</span>
        <strong>Арена ждёт начала поединка</strong>
        <span>Нажми «Начать поединок», чтобы случайным образом выбрать первую пару.</span>
      </div>`;
    return;
  }
  const champion = getChampion();
  if (champion) {
    $('#arenaContent').innerHTML = championMarkup(champion);
    return;
  }
  const matches = currentMatches();
  const match = matches[activeMatchIndex];
  if (!match) {
    const champion = getChampion();
    if (champion) {
      $('#arenaContent').innerHTML = championMarkup(champion);
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
        <button type="button" class="fighter-art fighter-art-trigger" data-profile="${p.id}" aria-label="Открыть досье: ${esc(p.name)}">
          <img src="${esc(p.image)}" alt="" loading="eager" fetchpriority="high" decoding="async">
        </button>
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
function hallLosers(matches) {
  return (matches || [])
    .filter(match => match?.winnerId !== null && match?.winnerId !== undefined)
    .map(match => {
      if (match.a?.id === match.winnerId) return match.b;
      if (match.b?.id === match.winnerId) return match.a;
      return null;
    })
    .filter(Boolean);
}
function hallNodeMarkup(p, large = false) {
  return `
    <button type="button" class="hall-node ${large ? 'hall-node-champion' : ''}" data-profile="${p.id}" aria-label="Открыть досье: ${esc(p.name)}">
      <span class="hall-node-art"><img src="${esc(p.image)}" alt="" loading="lazy" decoding="async"></span>
      <span class="hall-node-name">${esc(p.name)}</span>
      ${large ? `<span class="hall-node-legion">${esc(p.legion)}</span>` : ''}
    </button>`;
}
function hallLevelMarkup(title, participants, levelClass, seen) {
  const unique = participants.filter(p => {
    if (!p || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  if (!unique.length) return "";
  return `
    <section class="hall-level ${levelClass}">
      <h3>${esc(title)}</h3>
      <div class="hall-level-grid">${unique.map(p => hallNodeMarkup(p)).join("")}</div>
    </section>`;
}
function renderHallEntry(entry, index) {
  const date = new Date(entry.completedAt);
  const dateLabel = Number.isNaN(date.getTime()) ? "Дата не указана" : date.toLocaleDateString("ru-RU", {day:"numeric", month:"long", year:"numeric"});
  const rounds = entry.rounds || [];
  const seen = new Set();
  if (entry.champion) seen.add(entry.champion.id);

  const finalist = hallLosers(rounds[3]);
  const semifinalists = hallLosers(rounds[2]);
  const quarterfinalists = hallLosers(rounds[1]);
  const roundOf16 = hallLosers(rounds[0]);
  const preliminary = hallLosers(entry.prelim);

  return `
    <article class="hall-entry">
      <div class="hall-entry-heading">
        <div><span class="hall-entry-date">ТУРНИР · ${esc(dateLabel)}</span><h3>Модный приговор</h3></div>
        <span class="hall-entry-number">#${hallTournaments.length - index}</span>
      </div>
      <div class="hall-tree">
        <div class="hall-champion-label">♛ ЧЕМПИОН ТУРНИРА</div>
        ${entry.champion ? hallNodeMarkup(entry.champion, true) : '<div class="empty">Победитель не найден</div>'}
        ${hallLevelMarkup("Финалист", finalist, "hall-level-finalists", seen)}
        ${hallLevelMarkup("Выбыли в полуфинале", semifinalists, "hall-level-semifinalists", seen)}
        ${hallLevelMarkup("Выбыли в четвертьфинале", quarterfinalists, "hall-level-quarter", seen)}
        ${hallLevelMarkup("Выбыли в 1/8 финала", roundOf16, "hall-level-r16", seen)}
        ${hallLevelMarkup("Выбыли на предварительном этапе", preliminary, "hall-level-prelim", seen)}
      </div>
    </article>`;
}
function renderHall() {
  if (!hallTournaments.length) {
    $('#hallContent').innerHTML = '<div class="empty">Пока ни один турнир не завершён. Первый чемпион появится здесь вместе с деревом своего пути к короне.</div>';
    return;
  }
  $('#hallContent').innerHTML = `<div class="hall-archive">${hallTournaments.map(renderHallEntry).join("")}</div>`;
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
  renderDrawButton();
  renderStats();
  renderDrawStatus();
  renderArena();
  renderBracket();
  renderHall();
}

// Делегирование событий: работает и для карточек, которые перерисовываются после каждого голоса.
document.addEventListener('click', event => {
  const galleryStep = event.target.closest('[data-gallery-step]');
  if (galleryStep) {
    const gallery = galleryStep.closest('[data-gallery-profile]');
    if (gallery) {
      openProfile(Number(gallery.dataset.galleryProfile), Number(gallery.dataset.galleryCurrent) + Number(galleryStep.dataset.galleryStep));
    }
    return;
  }
  const galleryThumb = event.target.closest('[data-gallery-index]');
  if (galleryThumb) {
    openProfile(Number(galleryThumb.dataset.galleryProfile), Number(galleryThumb.dataset.galleryIndex));
    return;
  }
  const profileStep = event.target.closest('[data-profile-step]');
  if (profileStep) {
    stepProfile(Number(profileStep.dataset.profileStep));
    return;
  }
  const profileTrigger = event.target.closest('[data-profile]');
  if (profileTrigger) {
    openProfile(Number(profileTrigger.dataset.profile));
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
    saveCurrentTournament();
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

document.addEventListener('keydown', event => {
  if (!event.target.matches('.participant-card')) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openProfile(Number(event.target.dataset.profile));
  }
});
window.addEventListener('resize', syncProfileSwitcherPosition);
$('#closeModal').addEventListener('click', closeProfile);
$('#profileModal').addEventListener('click', event => { if (event.target.id === 'profileModal') closeProfile(); });
document.addEventListener('keydown', event => {
  if (!$('#profileModal').classList.contains('show')) return;
  if (event.key === 'Escape') { closeProfile(); return; }
  if (event.target.matches('input, textarea, select') || event.target.closest('[data-gallery-step], [data-gallery-index]')) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); stepProfile(-1); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); stepProfile(1); }
});
$('#drawBtn').addEventListener('click', handleDrawButtonClick);


renderParticipants();
restoreSavedTournament();
renderAll();