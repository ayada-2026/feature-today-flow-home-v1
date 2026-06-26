const app = document.getElementById("app");
const liveRegion = document.getElementById("liveRegion");

const STORAGE_KEYS = {
  railItems: "todayFlowRailItems",
  recordsByDate: "todayFlowRecordsByDate",
  weatherByDate: "todayFlowWeatherByDate",
  selectedStampId: "todayFlowSelectedStampId",
  soundEnabled: "todayFlowSoundEnabled",
  homeLayout: "todayFlowHomeLayout"
};

const SOUND_PATHS = {
  timerDone: "assets/sounds/timer-done.mp3"
};

const STAMP_SOUND_DELAY_MS = 140;
const HOME_BLOCK_IDS = ["recordSet", "railSet"];
const DEFAULT_HOME_LAYOUT = {
  order: ["recordSet", "railSet"],
  collapsed: {
    recordSet: false,
    railSet: true
  }
};

const ICONS = {
  train: "assets/icons/train.png",
  note: "assets/icons/note.png",
  calendar: "assets/icons/calendar.png",
  stamp: "assets/icons/stamp.png",
  stampResult: "assets/icons/stamp1.png",
  water: "assets/icons/water.png",
  rice: "assets/icons/rice.png",
  housework: "assets/icons/housework.png",
  work: "assets/icons/work.png",
  exercise: "assets/icons/exercise.png",
  hygiene: "assets/icons/hygiene.png",
  rest: "assets/icons/rest.png",
  hobby: "assets/icons/hobby.png",
  misc: "assets/icons/misc.png",
  weatherSunny: "assets/icons/sun.png",
  weatherPartly: "assets/icons/suncloud.png",
  weatherCloudy: "assets/icons/cloud.png",
  weatherRainy: "assets/icons/rain.png",
  weatherSnowy: "assets/icons/snow.png"
};

const RECORD_ICON_RULES = [
  { icon: ICONS.water, keywords: ["물", "마심", "차", "음료"] },
  { icon: ICONS.rice, keywords: ["밥", "식사", "과일", "간식", "먹음"] },
  { icon: ICONS.housework, keywords: ["설거지", "청소", "빨래", "정리", "집안일"] },
  { icon: ICONS.work, keywords: ["프리미어프로", "작업", "공부", "편집", "코덱스", "컴퓨터"] },
  { icon: ICONS.exercise, keywords: ["스트레칭", "운동", "걷기", "산책"] },
  { icon: ICONS.hygiene, keywords: ["세수", "샤워", "양치", "씻"] },
  { icon: ICONS.rest, keywords: ["쉬기", "휴식", "낮잠", "멍", "잠"] },
  { icon: ICONS.hobby, keywords: ["우쿨렐레", "책", "독서", "영화", "드라마", "취미"] }
];

const WEATHER_OPTIONS = [
  { id: "sunny", label: "맑음", image: ICONS.weatherSunny },
  { id: "partly", label: "해+구름", image: ICONS.weatherPartly },
  { id: "cloudy", label: "흐림", image: ICONS.weatherCloudy },
  { id: "rainy", label: "비", image: ICONS.weatherRainy },
  { id: "snowy", label: "눈", image: ICONS.weatherSnowy }
];

const DEFAULT_STAMP_ID = "well-done";

const STAMP_DEFINITIONS = [
  {
    id: DEFAULT_STAMP_ID,
    name: "참 잘했어요",
    description: "처음부터 사용할 수 있어요.",
    unlockText: "기본 스탬프",
    isUnlocked: () => true,
    image: ICONS.stampResult
  },
  {
    id: "small-start",
    name: "작은 시작",
    description: "첫 기록을 남기면 열려요.",
    unlockText: "기록 1개를 남기면 열려요",
    isUnlocked: (stats) => stats.totalRecords >= 1
  },
  {
    id: "records-10",
    name: "기록 10개",
    description: "작은 기록이 10개 쌓였어요.",
    unlockText: "기록 10개를 남기면 열려요",
    isUnlocked: (stats) => stats.totalRecords >= 10
  },
  {
    id: "records-30",
    name: "기록 30개",
    description: "기록이 제법 단단히 쌓였어요.",
    unlockText: "기록 30개를 남기면 열려요",
    isUnlocked: (stats) => stats.totalRecords >= 30
  },
  {
    id: "rails-5",
    name: "레일 5개",
    description: "레일에서 시작한 기록이 5개예요.",
    unlockText: "레일 5개를 실행하면 열려요",
    isUnlocked: (stats) => stats.totalRailRecords >= 5
  },
  {
    id: "rails-20",
    name: "레일 20개",
    description: "레일 흐름이 많이 쌓였어요.",
    unlockText: "레일 20개를 실행하면 열려요",
    isUnlocked: (stats) => stats.totalRailRecords >= 20
  },
  {
    id: "days-3",
    name: "3일 기록",
    description: "기록한 날이 3일이 되었어요.",
    unlockText: "3일 동안 기록을 남기면 열려요",
    isUnlocked: (stats) => stats.recordedDays >= 3
  },
  {
    id: "days-7",
    name: "7일 기록",
    description: "기록한 날이 7일이 되었어요.",
    unlockText: "7일 동안 기록을 남기면 열려요",
    isUnlocked: (stats) => stats.recordedDays >= 7
  }
];

const DEFAULT_RAIL_ITEMS = [
  {
    id: "rail-premiere",
    time: "2시",
    title: "프리미어프로",
    note: "20분만"
  },
  {
    id: "rail-home",
    time: "4시",
    title: "집안일 정리",
    note: "15분만"
  },
  {
    id: "rail-dinner",
    time: "6시",
    title: "저녁준비",
    note: "시작만"
  }
];

const todayKey = formatDateKey(new Date());

const state = {
  activeTab: "home",
  selectedDateKey: todayKey,
  editingRailId: null,
  pendingRailDeleteId: null,
  addPanelOpen: false,
  addPanelMode: "record",
  datePanelOpen: false,
  weatherPanelOpen: false,
  stampPanelOpen: false,
  recordSheetOpen: false,
  recordSheetMode: "view",
  selectedRecordId: null,
  pendingRecordDeleteId: null,
  recordEditDraft: "",
  stampingRecordId: null,
  stampingRecordDateKey: null,
  addPanelDraft: {
    record: {
      recordText: ""
    },
    rail: {
      time: "",
      title: "",
      note: ""
    }
  },
  toastMessage: "",
  railItems: loadRailItems(),
  recordsByDate: loadRecordsByDate(),
  weatherByDate: loadWeatherByDate(),
  selectedStampId: loadSelectedStampId(),
  soundEnabled: loadSoundEnabled(),
  homeLayout: loadHomeLayout()
};

let toastTimer = null;
const railTimerIntervals = new Map();
let effectAudioContext = null;

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function createButton(className, text, action, id) {
  const button = createElement("button", className, text);
  button.type = "button";
  button.dataset.action = action;

  if (id) {
    button.dataset.id = id;
  }

  return button;
}

function createIconImage(src, className, alt = "") {
  const image = createElement("img", className);
  image.src = src;
  image.alt = alt;
  image.loading = "lazy";
  image.decoding = "async";
  return image;
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : fallback;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeRailItem(item) {
  const timerStatus = ["running", "paused", "done"].includes(item.timerStatus)
    ? item.timerStatus
    : "idle";
  const durationSeconds = Number.isFinite(Number(item.durationSeconds)) && Number(item.durationSeconds) > 0
    ? Number(item.durationSeconds)
    : null;
  const remainingSeconds = Number.isFinite(Number(item.remainingSeconds))
    ? Math.max(0, Number(item.remainingSeconds))
    : null;
  const startedAt = Number.isFinite(Number(item.startedAt)) && Number(item.startedAt) > 0
    ? Number(item.startedAt)
    : null;
  const pausedAt = Number.isFinite(Number(item.pausedAt)) && Number(item.pausedAt) > 0
    ? Number(item.pausedAt)
    : null;
  const elapsedBeforePause = Number.isFinite(Number(item.elapsedBeforePause))
    ? Math.max(0, Number(item.elapsedBeforePause))
    : 0;

  return {
    id: item.id || createId("rail"),
    time: item.time || "시간",
    title: item.title || "새 항목",
    note: item.note || "가볍게",
    timerStatus,
    durationSeconds,
    remainingSeconds,
    startedAt,
    pausedAt,
    elapsedBeforePause
  };
}

function stripRailForStorage(item) {
  return {
    id: item.id,
    time: item.time,
    title: item.title,
    note: item.note,
    timerStatus: item.timerStatus || "idle",
    durationSeconds: item.durationSeconds ?? null,
    remainingSeconds: item.remainingSeconds ?? null,
    startedAt: item.startedAt ?? null,
    pausedAt: item.pausedAt ?? null,
    elapsedBeforePause: item.elapsedBeforePause ?? 0
  };
}

function loadRailItems() {
  const parsed = readJson(STORAGE_KEYS.railItems, null);
  const source = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RAIL_ITEMS;
  return source.map(normalizeRailItem);
}

function saveRailItems() {
  writeJson(STORAGE_KEYS.railItems, state.railItems.map(stripRailForStorage));
}

function defaultRecordsForToday() {
  return [
    {
      id: "record-premiere",
      text: "프리미어프로 20분 함",
      icon: getRecordIcon("프리미어프로 20분 함"),
      category: "record",
      source: "manual",
      stamped: false
    },
    {
      id: "record-dishes",
      text: "설거지 15분 함",
      icon: getRecordIcon("설거지 15분 함"),
      category: "chore",
      source: "manual",
      stamped: false
    },
    {
      id: "record-water",
      text: "물 한 컵 마심",
      icon: getRecordIcon("물 한 컵 마심"),
      category: "care",
      source: "manual",
      stamped: false
    },
    {
      id: "record-wash",
      text: "세수함",
      icon: getRecordIcon("세수함"),
      category: "care",
      source: "manual",
      stamped: false
    }
  ];
}

function loadRecordsByDate() {
  const parsed = readJson(STORAGE_KEYS.recordsByDate, null);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }

  return {
    [todayKey]: defaultRecordsForToday()
  };
}

function saveRecordsByDate() {
  writeJson(STORAGE_KEYS.recordsByDate, state.recordsByDate);
}

function loadWeatherByDate() {
  const parsed = readJson(STORAGE_KEYS.weatherByDate, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([dateKey, weatherId]) => [dateKey, normalizeWeatherId(weatherId)])
  );
}

function saveWeatherByDate() {
  writeJson(STORAGE_KEYS.weatherByDate, state.weatherByDate);
}

function normalizeWeatherId(weatherId) {
  if (weatherId === "rain") {
    return "rainy";
  }

  if (weatherId === "snow") {
    return "snowy";
  }

  return weatherId;
}

function loadSelectedStampId() {
  const savedStampId = localStorage.getItem(STORAGE_KEYS.selectedStampId);
  const stamp = STAMP_DEFINITIONS.find((item) => item.id === savedStampId);
  return stamp ? stamp.id : DEFAULT_STAMP_ID;
}

function saveSelectedStampId() {
  localStorage.setItem(STORAGE_KEYS.selectedStampId, state.selectedStampId);
}

function loadSoundEnabled() {
  return localStorage.getItem(STORAGE_KEYS.soundEnabled) === "true";
}

function saveSoundEnabled() {
  localStorage.setItem(STORAGE_KEYS.soundEnabled, String(state.soundEnabled));
}

function normalizeHomeLayout(layout) {
  const savedOrder = Array.isArray(layout?.order) ? layout.order : [];
  const order = [
    ...savedOrder.filter((id) => HOME_BLOCK_IDS.includes(id)),
    ...HOME_BLOCK_IDS.filter((id) => !savedOrder.includes(id))
  ];
  const collapsed = {
    ...DEFAULT_HOME_LAYOUT.collapsed,
    ...(layout?.collapsed && typeof layout.collapsed === "object" ? layout.collapsed : {})
  };

  return {
    order,
    collapsed: {
      recordSet: Boolean(collapsed.recordSet),
      railSet: Boolean(collapsed.railSet)
    }
  };
}

function loadHomeLayout() {
  return normalizeHomeLayout(readJson(STORAGE_KEYS.homeLayout, DEFAULT_HOME_LAYOUT));
}

function saveHomeLayout() {
  writeJson(STORAGE_KEYS.homeLayout, state.homeLayout);
}

function playEffectSound(soundName) {
  if (!state.soundEnabled) {
    return;
  }

  if (soundName === "stamp") {
    playStampSound();
    return;
  }

  if (soundName === "timerDone") {
    playTimerDoneSound();
    return;
  }

  playAudioFileEffect(soundName);
}

function playAudioFileEffect(soundName) {
  const soundPath = SOUND_PATHS[soundName];

  if (!soundPath) {
    return;
  }

  try {
    const audio = new Audio(soundPath);
    audio.volume = 0.72;
    const playPromise = audio.play();

    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
  } catch {
    // Sound files are optional. Playback failures should not block the app.
  }
}

function getEffectAudioContext() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  if (!effectAudioContext) {
    effectAudioContext = new AudioContextConstructor();
  }

  return effectAudioContext;
}

function unlockEffectAudioContext() {
  try {
    const audioContext = getEffectAudioContext();

    if (audioContext?.state === "suspended") {
      const resumePromise = audioContext.resume();
      if (resumePromise?.catch) {
        resumePromise.catch(() => {});
      }
    }
  } catch {
    // Audio unlock is best-effort only.
  }
}

function playStampSound() {
  try {
    const audioContext = getEffectAudioContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state === "suspended") {
      const resumePromise = audioContext.resume();
      if (resumePromise?.catch) {
        resumePromise
          .then(() => {
            synthesizeStampSound(audioContext);
          })
          .catch(() => {});
      }
      return;
    }

    synthesizeStampSound(audioContext);
  } catch {
    // Synthetic sound is optional. Fail silently to keep stamping reliable.
  }
}

function synthesizeStampSound(audioContext) {
  try {
    const now = audioContext.currentTime;
    const endTime = now + 0.13;
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.28, now + 0.008);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    masterGain.connect(audioContext.destination);

    const bodyOscillator = audioContext.createOscillator();
    const bodyGain = audioContext.createGain();
    bodyOscillator.type = "sine";
    bodyOscillator.frequency.setValueAtTime(230, now);
    bodyOscillator.frequency.exponentialRampToValueAtTime(118, now + 0.095);
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.34, now + 0.006);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.115);
    bodyOscillator.connect(bodyGain);
    bodyGain.connect(masterGain);
    bodyOscillator.start(now);
    bodyOscillator.stop(endTime);

    const softTap = audioContext.createOscillator();
    const softTapGain = audioContext.createGain();
    softTap.type = "triangle";
    softTap.frequency.setValueAtTime(380, now);
    softTap.frequency.exponentialRampToValueAtTime(240, now + 0.045);
    softTapGain.gain.setValueAtTime(0.0001, now);
    softTapGain.gain.exponentialRampToValueAtTime(0.055, now + 0.004);
    softTapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    softTap.connect(softTapGain);
    softTapGain.connect(masterGain);
    softTap.start(now);
    softTap.stop(now + 0.055);

    const noiseDuration = 0.075;
    const noiseBuffer = audioContext.createBuffer(1, Math.max(1, Math.floor(audioContext.sampleRate * noiseDuration)), audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let index = 0; index < noiseData.length; index += 1) {
      const fade = 1 - index / noiseData.length;
      noiseData[index] = (Math.random() * 2 - 1) * fade * 0.35;
    }

    const noiseSource = audioContext.createBufferSource();
    const noiseFilter = audioContext.createBiquadFilter();
    const noiseGain = audioContext.createGain();
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(980, now);
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.05, now + 0.004);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDuration);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(now);
    noiseSource.stop(now + noiseDuration);
  } catch {
    // Synthetic sound is optional. Fail silently to keep stamping reliable.
  }
}

function playTimerDoneSound() {
  try {
    const audioContext = getEffectAudioContext();

    if (!audioContext) {
      playAudioFileEffect("timerDone");
      return;
    }

    if (audioContext.state === "suspended") {
      const resumePromise = audioContext.resume();
      if (resumePromise?.catch) {
        resumePromise
          .then(() => {
            synthesizeTimerDoneSound(audioContext);
          })
          .catch(() => {
            playAudioFileEffect("timerDone");
          });
      }
      return;
    }

    synthesizeTimerDoneSound(audioContext);
  } catch {
    playAudioFileEffect("timerDone");
  }
}

function synthesizeTimerDoneSound(audioContext) {
  try {
    const now = audioContext.currentTime;
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    masterGain.connect(audioContext.destination);

    const firstTone = audioContext.createOscillator();
    const firstGain = audioContext.createGain();
    firstTone.type = "sine";
    firstTone.frequency.setValueAtTime(330, now);
    firstGain.gain.setValueAtTime(0.0001, now);
    firstGain.gain.exponentialRampToValueAtTime(0.14, now + 0.014);
    firstGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    firstTone.connect(firstGain);
    firstGain.connect(masterGain);
    firstTone.start(now);
    firstTone.stop(now + 0.19);

    const secondTone = audioContext.createOscillator();
    const secondGain = audioContext.createGain();
    secondTone.type = "sine";
    secondTone.frequency.setValueAtTime(430, now + 0.105);
    secondGain.gain.setValueAtTime(0.0001, now + 0.095);
    secondGain.gain.exponentialRampToValueAtTime(0.11, now + 0.12);
    secondGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.31);
    secondTone.connect(secondGain);
    secondGain.connect(masterGain);
    secondTone.start(now + 0.095);
    secondTone.stop(now + 0.32);
  } catch {
    playAudioFileEffect("timerDone");
  }
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function shiftDateKey(dateKey, days) {
  const date = dateFromKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

function formatDateLabel(dateKey) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(dateFromKey(dateKey));
}

function formatCompactDateLabel(dateKey) {
  const date = dateFromKey(dateKey);
  const weekday = new Intl.DateTimeFormat("ko-KR", {
    weekday: "short"
  }).format(date);
  return `${date.getMonth() + 1}.${date.getDate()} ${weekday}`;
}

function getSelectedRecords() {
  return state.recordsByDate[state.selectedDateKey] || [];
}

function setSelectedRecords(records) {
  state.recordsByDate = {
    ...state.recordsByDate,
    [state.selectedDateKey]: records
  };
  saveRecordsByDate();
}

function updateSelectedRecord(id, nextValues) {
  setSelectedRecords(getSelectedRecords().map((record) => (
    record.id === id ? { ...record, ...nextValues } : record
  )));
}

function deleteSelectedRecord(id) {
  setSelectedRecords(getSelectedRecords().filter((record) => record.id !== id));
}

function getSelectedRecord() {
  return getSelectedRecords().find((record) => record.id === state.selectedRecordId);
}

function getRecordSource(record) {
  return record?.source === "rail" ? "rail" : "manual";
}

function getSelectedWeather() {
  return WEATHER_OPTIONS.find((option) => option.id === normalizeWeatherId(state.weatherByDate[state.selectedDateKey]));
}

function getAllRecords() {
  return Object.values(state.recordsByDate).flatMap((records) => (
    Array.isArray(records) ? records : []
  ));
}

function getStampStats() {
  const allRecords = getAllRecords();

  return {
    totalRecords: allRecords.length,
    totalRailRecords: allRecords.filter((record) => getRecordSource(record) === "rail").length,
    recordedDays: Object.values(state.recordsByDate).filter((records) => (
      Array.isArray(records) && records.length > 0
    )).length,
    selectedDateRecords: getSelectedRecords().length,
    selectedDateRailRecords: getSelectedRecords().filter((record) => getRecordSource(record) === "rail").length
  };
}

function isStampUnlocked(stamp, stats = getStampStats()) {
  return stamp.isUnlocked(stats);
}

function getStampById(id) {
  return STAMP_DEFINITIONS.find((stamp) => stamp.id === id) || STAMP_DEFINITIONS[0];
}

function getSelectedStamp() {
  const stats = getStampStats();
  const stamp = getStampById(state.selectedStampId);
  return isStampUnlocked(stamp, stats) ? stamp : STAMP_DEFINITIONS[0];
}

function render() {
  app.innerHTML = "";

  const shell = createElement("section", "phone-shell");
  shell.append(renderHomeBlocks());

  app.append(shell);
  app.append(renderTabBar());

  if (state.addPanelOpen) {
    app.append(renderAddPanel());
  }

  if (state.datePanelOpen) {
    app.append(renderDatePanel());
  }

  if (state.weatherPanelOpen) {
    app.append(renderWeatherPanel());
  }

  if (state.stampPanelOpen) {
    app.append(renderStampCollectionPanel());
  }

  if (state.recordSheetOpen) {
    app.append(renderRecordSheet());
  }

  if (state.toastMessage) {
    app.append(renderToast());
  }
}

function renderHero() {
  const hero = createElement("section", "hero");
  hero.id = "heroSection";
  hero.setAttribute("aria-labelledby", "pageTitle");

  hero.append(renderPostIts());

  const copy = createElement("div", "hero-copy");
  const titleRow = createElement("div", "hero-title-row");
  const titleBlock = createElement("div", "hero-title-block");

  const eyebrow = createElement("p", "eyebrow", "TODAY FLOW");
  const title = createElement("h1", null, "오늘의 흐름");
  title.id = "pageTitle";
  const subtitle = createElement("p", "subtitle", "시작할 시간은 가볍게 정하고,\n해낸 일은 도장으로 남겨요.");

  const datePill = createElement("div", "date-pill");
  datePill.setAttribute("aria-label", "날짜 이동");
  const previousDateButton = createButton("date-arrow-button", "‹", "shift-date", "-1");
  previousDateButton.setAttribute("aria-label", "전날로 이동");
  const nextDateButton = createButton("date-arrow-button", "›", "shift-date", "1");
  nextDateButton.setAttribute("aria-label", "다음날로 이동");
  datePill.append(
    previousDateButton,
    createIconImage(ICONS.calendar, "date-icon"),
    createElement("span", "date-label", formatCompactDateLabel(state.selectedDateKey)),
    nextDateButton
  );

  titleBlock.append(eyebrow, title, subtitle);
  titleRow.append(titleBlock, datePill);
  copy.append(titleRow);
  hero.append(copy);

  return hero;
}

function renderPostIts() {
  const layer = createElement("div", "sticky-layer");
  const shownItems = state.railItems.slice(0, 3);

  shownItems.forEach((item) => {
    const note = createElement("article", "post-it");
    note.setAttribute("aria-label", `${item.time} ${item.title} ${item.note}`);
    note.append(
      createElement("span", "post-time", item.time),
      createElement("strong", "post-title", item.title),
      createElement("span", "post-note", item.note)
    );
    layer.append(note);
  });

  return layer;
}

function renderHomeBlocks() {
  const stack = createElement("div", "home-block-stack");
  stack.id = "homeSection";

  state.homeLayout.order.forEach((blockId) => {
    if (blockId === "recordSet") {
      stack.append(renderRecordSetBlock());
    }

    if (blockId === "railSet") {
      stack.append(renderRailSetBlock());
    }
  });

  return stack;
}

function renderRecordSetBlock() {
  const block = createElement("section", "home-block record-set-block");
  block.id = "recordSet";
  block.append(
    renderHomeBlockHeader({
      blockId: "recordSet",
      icon: ICONS.note,
      title: "기록 세트",
      subtitle: "오늘 남긴 기록과 요약을 정리해요.",
      collapsible: false
    }),
    renderTodayRecords(),
    renderSummary()
  );
  return block;
}

function renderRailSetBlock() {
  const isCollapsed = Boolean(state.homeLayout.collapsed.railSet);
  const block = createElement("section", `home-block rail-set-block${isCollapsed ? " is-collapsed" : ""}`);
  block.id = "railSet";

  if (isCollapsed) {
    block.append(renderCollapsedRailSet());
    return block;
  }

  block.append(
    renderHomeBlockHeader({
      blockId: "railSet",
      icon: ICONS.train,
      title: "레일 세트",
      subtitle: `${state.railItems.length}개의 레일을 펼쳐두었어요.`,
      collapsible: true
    }),
    renderHero(),
    renderTodayRail()
  );
  return block;
}

function renderCollapsedRailSet() {
  const card = createElement("section", "section-card home-block-collapsed");
  const header = renderHomeBlockHeader({
    blockId: "railSet",
    icon: ICONS.train,
    title: "오늘의 레일",
    subtitle: `${state.railItems.length}개의 레일이 있어요. 필요할 때만 펼쳐서 시작해요.`,
    collapsible: true
  });
  card.append(header);
  return card;
}

function renderHomeBlockHeader({ blockId, icon, title, subtitle, collapsible }) {
  const header = createElement("header", "home-block-header");
  const copy = createElement("div", "home-block-copy");
  copy.append(
    createIconImage(icon, "home-block-icon"),
    createElement("strong", null, title),
    createElement("span", null, subtitle)
  );

  const controls = createElement("div", "home-block-controls");
  if (collapsible) {
    const isCollapsed = Boolean(state.homeLayout.collapsed[blockId]);
    controls.append(createButton(
      "home-block-control home-block-primary-control",
      isCollapsed ? "펼치기" : "접기",
      "toggle-home-block",
      blockId
    ));
  }
  controls.append(renderHomeBlockMenu(blockId));

  header.append(copy, controls);
  return header;
}

function renderHomeBlockMenu(blockId) {
  const menu = createElement("details", "home-block-menu");
  const trigger = createElement("summary", "home-block-menu-trigger", "⋯");
  trigger.setAttribute("aria-label", "블럭 편집 메뉴");

  const list = createElement("div", "home-block-menu-list");
  list.append(
    createButton("home-block-menu-item", "위로 이동", "move-home-block", `${blockId}:up`),
    createButton("home-block-menu-item", "아래로 이동", "move-home-block", `${blockId}:down`)
  );

  menu.append(trigger, list);
  return menu;
}

function renderTodayRail() {
  const section = renderCardShell(ICONS.train, "오늘의 레일");
  section.id = "railSection";
  const list = createElement("ul", "rail-list");

  state.railItems.forEach((item) => {
    list.append(renderRailItem(item));
  });

  section.append(list);
  return section;
}

function renderCardShell(icon, title) {
  const section = createElement("section", "section-card");
  const header = createElement("header", "section-header");
  header.append(createIconImage(icon, "section-icon"), createElement("h2", null, title));
  section.append(header);
  return section;
}

function renderRailItem(item) {
  const listItem = createElement("li", "rail-item");
  listItem.dataset.railId = item.id;

  listItem.append(
    createElement("span", "rail-time", item.time),
    renderRailMain(item),
    renderRailActions(item)
  );

  if (state.editingRailId === item.id) {
    listItem.append(renderRailEditor(item));
  }

  return listItem;
}

function renderRailMain(item) {
  const main = createElement("div", "rail-main");
  main.append(createElement("span", "rail-title", item.title), createElement("span", "rail-note", item.note));
  return main;
}

function renderRailActions(item) {
  const actions = createElement("div", "rail-actions");
  actions.dataset.railActionsFor = item.id;
  const timerStatus = item.timerStatus || "idle";
  const startButton = createButton("pill-button rail-timer-button", getRailButtonLabel(item), getRailButtonAction(item), item.id);

  if (timerStatus === "running") {
    startButton.classList.add("is-started");
  }

  if (timerStatus === "paused") {
    startButton.classList.add("is-paused");
    startButton.textContent = "";
    startButton.append(
      createElement("span", "rail-paused-time", formatRemainingTime(getRailRemainingSeconds(item))),
      createElement("span", "rail-paused-icon")
    );
  }

  if (timerStatus === "done") {
    startButton.classList.add("is-ready-to-record");
  }

  const editButton = createButton("icon-button", "✎", "edit-rail", item.id);
  editButton.setAttribute("aria-label", `${item.title} 수정`);

  actions.append(startButton, editButton);
  return actions;
}

function renderRailEditor(item) {
  if (state.pendingRailDeleteId === item.id) {
    const confirm = createElement("div", "rail-delete-confirm");
    confirm.append(createElement("p", "rail-delete-question", "이 레일을 지울까요?"));

    const actions = createElement("div", "rail-delete-confirm-actions");
    actions.append(
      createButton("pill-button rail-secondary-button", "취소", "cancel-rail-delete", item.id),
      createButton("record-delete-confirm-button", "지우기", "confirm-rail-delete", item.id)
    );
    confirm.append(actions);
    return confirm;
  }

  const form = createElement("form", "rail-edit");
  form.dataset.action = "save-rail";
  form.dataset.id = item.id;

  form.append(
    renderInputRow("시간", "time", item.time, 8, "예: 4시"),
    renderInputRow("항목", "title", item.title, 28, "예: 집안일 정리"),
    renderInputRow("문구", "note", item.note, 32, "예: 15분만")
  );

  const actions = createElement("div", "rail-edit-actions");
  const saveButton = createElement("button", "pill-button", "저장");
  saveButton.type = "submit";

  actions.append(
    createButton("rail-delete-button", "삭제", "delete-rail", item.id),
    createButton("pill-button rail-secondary-button", "취소", "cancel-edit", item.id),
    saveButton
  );

  form.append(actions);
  return form;
}

function renderInputRow(labelText, name, value, maxLength, placeholder = "") {
  const fragment = document.createDocumentFragment();
  const label = createElement("label", null, labelText);
  const input = createElement("input");
  input.name = name;
  input.value = value;
  input.maxLength = maxLength;
  input.placeholder = placeholder;

  fragment.append(label, input);
  return fragment;
}

function renderTodayRecords() {
  const section = renderCardShell(ICONS.note, "오늘 기록");
  section.id = "recordsSection";
  const list = createElement("ul", "record-list");
  const records = getSelectedRecords();

  if (records.length === 0) {
    section.append(renderRecordEmptyState());
    return section;
  }

  records.forEach((record) => {
    const item = createElement("li", "record-item");
    const display = createElement("div", "record-display");
    display.append(
      renderRecordIcon(record.text),
      createElement("span", "record-text", record.text)
    );

    item.append(display, renderStampButton(record));
    list.append(item);
  });

  section.append(list);
  return section;
}

function renderRecordEmptyState() {
  const empty = createElement("div", "record-empty-card");
  const illustration = createElement("div", "record-empty-illustration");
  illustration.append(
    createIconImage(ICONS.note, "record-empty-note", "빈 기록 노트"),
    createIconImage(ICONS.stamp, "record-empty-stamp", "도장")
  );

  const copy = createElement("div", "record-empty-copy");
  copy.append(
    createElement("strong", null, "아직 남긴 기록이 없어요."),
    createElement("span", null, "작은 일 하나만 남겨볼까요?")
  );

  empty.append(
    illustration,
    copy,
    createButton("record-empty-action", "+ 한 줄 남기기", "open-add-panel")
  );
  return empty;
}

function renderRecordIcon(text) {
  const wrap = createElement("span", "record-icon-wrap");
  wrap.append(createIconImage(getRecordIcon(text), "record-icon"));
  return wrap;
}

function renderStampButton(record) {
  const stamp = createButton("stamp-badge stamp-button", "", "stamp-record", record.id);
  stamp.dataset.stampFor = record.id;
  const isStamping = state.stampingRecordId === record.id && state.stampingRecordDateKey === state.selectedDateKey;

  if (record.stamped) {
    stamp.append(renderStampedRecordMark(record.stampId || DEFAULT_STAMP_ID));
  } else if (isStamping) {
    stamp.append(createIconImage(ICONS.stamp, "stamp-action-image"));
  } else {
    stamp.append(createElement("span", "stamp-label", "도장 찍기"));
  }
  stamp.setAttribute("aria-label", `${record.text} 도장 찍기`);

  if (record.stamped) {
    stamp.classList.add("is-stamped");
  } else if (isStamping) {
    stamp.classList.add("is-stamping");
    stamp.disabled = true;
  } else {
    stamp.classList.add("is-empty");
  }

  return stamp;
}

function renderStampedRecordMark(stampId) {
  const stamp = getStampById(stampId);

  if (stamp.image) {
    return createIconImage(stamp.image, "stamp-result-image");
  }

  return createElement("span", "stamp-result-custom", stamp.name);
}

function renderSummary() {
  const summary = createElement("section", "section-card summary-card");
  summary.setAttribute("aria-label", "오늘 요약");
  const records = getSelectedRecords();
  const stampedRecords = records.filter((record) => record.stamped);
  const railRecordCount = stampedRecords.filter((record) => getRecordSource(record) === "rail").length;
  const weather = getSelectedWeather();

  const summaryItems = [
    {
      icon: ICONS.note,
      label: "기록",
      value: stampedRecords.length
    },
    {
      icon: ICONS.train,
      label: "레일",
      value: railRecordCount
    },
    {
      type: "weather",
      label: "날씨",
      weather,
      action: "open-weather-panel"
    }
  ];

  summaryItems.forEach((item) => {
    const block = item.action
      ? createButton("summary-item summary-button", "", item.action)
      : createElement("article", "summary-item");

    if (item.type === "weather") {
      block.classList.add("summary-weather-item");
      block.setAttribute("aria-label", item.weather ? `날씨 ${item.weather.label}` : "날씨 선택");
      block.append(renderSummaryWeatherSticker(item.weather));
    } else {
      block.append(
        createIconImage(item.icon, "summary-icon"),
        createElement("span", "summary-label", item.label),
        createElement("strong", "summary-value", String(item.value))
      );
    }

    summary.append(block);
  });

  return summary;
}

function renderSummaryWeatherSticker(weather) {
  const sticker = createElement("strong", "summary-value summary-weather-sticker");
  sticker.dataset.weather = weather ? weather.id : "empty";
  sticker.setAttribute("aria-label", weather ? weather.label : "날씨 선택");

  if (weather) {
    sticker.append(createIconImage(weather.image, "summary-weather-image", weather.label));
  } else {
    sticker.append(createElement("span", "summary-weather-empty", "—"));
  }

  return sticker;
}

function countRecordsByCategory(category, records = getSelectedRecords()) {
  return records.filter((record) => getRecordCategory(record.text) === category).length;
}

function getRailDurationSeconds(item) {
  const note = item.note || "";
  const minuteMatch = note.match(/(\d+)\s*분/);

  if (minuteMatch) {
    return Number(minuteMatch[1]) * 60;
  }

  if (note.includes("시작만")) {
    return 5 * 60;
  }

  return 5 * 60;
}

function formatRemainingTime(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const minutesPart = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secondsPart = String(seconds % 60).padStart(2, "0");
  return `${minutesPart}:${secondsPart}`;
}

function getRailStoredDuration(item) {
  return item.durationSeconds || getRailDurationSeconds(item);
}

function getRailRemainingSeconds(item, now = Date.now()) {
  const durationSeconds = getRailStoredDuration(item);
  const timerStatus = item.timerStatus || "idle";

  if (timerStatus === "done") {
    return 0;
  }

  if (timerStatus === "paused") {
    return Math.max(0, item.remainingSeconds ?? durationSeconds);
  }

  if (timerStatus !== "running") {
    return Math.max(0, item.remainingSeconds ?? durationSeconds);
  }

  const startedAt = item.startedAt || now;
  const elapsedBeforePause = Math.max(0, item.elapsedBeforePause || 0);
  const elapsedSinceStart = Math.max(0, Math.floor((now - startedAt) / 1000));

  return Math.max(0, durationSeconds - elapsedBeforePause - elapsedSinceStart);
}

function getRailButtonLabel(item) {
  const timerStatus = item.timerStatus || "idle";
  const remaining = formatRemainingTime(getRailRemainingSeconds(item));

  if (timerStatus === "running") {
    return remaining;
  }

  if (timerStatus === "paused") {
    return remaining;
  }

  if (timerStatus === "done") {
    return "기록";
  }

  return "시작";
}

function getRailButtonAction(item) {
  const timerStatus = item.timerStatus || "idle";

  if (timerStatus === "running") {
    return "pause-rail";
  }

  if (timerStatus === "paused") {
    return "resume-rail";
  }

  if (timerStatus === "done") {
    return "record-rail";
  }

  return "start-rail";
}

function formatDurationForRecord(totalSeconds) {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes}분`;
}

function renderTabBar() {
  const nav = createElement("nav", "tab-bar");
  nav.setAttribute("aria-label", "하단 탭");

  const tabs = [
    { id: "home", icon: "home", label: "홈", action: "go-home", svg: true },
    { id: "records", icon: "organize", label: "정리", action: "go-records", svg: true },
    { id: "add", icon: "+", label: "", action: "open-add-panel" },
    { id: "stamps", icon: ICONS.stamp, label: "스탬프", action: "show-stamps", image: true },
    { id: "my-flow", icon: "flow", label: "나의 흐름", action: "show-my-flow", svg: true }
  ];

  tabs.forEach((tab) => {
    if (tab.id === "add") {
      const addButton = createButton("add-tab", tab.icon, tab.action);
      addButton.setAttribute("aria-label", "남기기 패널 열기");
      nav.append(addButton);
      return;
    }

    const button = createButton("tab-button", "", tab.action, tab.id);

    if (state.activeTab === tab.id) {
      button.classList.add("is-active");
    }

    const tabIcon = renderTabIcon(tab);
    button.append(tabIcon, createElement("span", null, tab.label));
    nav.append(button);
  });

  return nav;
}

function renderTabIcon(tab) {
  if (tab.image) {
    return createIconImage(tab.icon, "tab-icon tab-image-icon");
  }

  if (!tab.svg) {
    return createElement("span", "tab-icon", tab.icon);
  }

  const icon = createElement("span", `tab-icon tab-svg-icon tab-${tab.icon}-icon`);
  icon.setAttribute("aria-hidden", "true");

  const svgMap = {
    home: `
      <svg viewBox="0 0 32 32" role="img" focusable="false">
        <path class="tab-svg-fill" d="M7.4 14.1 16 6.8l8.6 7.3v10.4a2 2 0 0 1-2 2h-4.1v-6.8h-5v6.8H9.4a2 2 0 0 1-2-2Z" />
        <path class="tab-svg-line" d="M5.6 15.5 16 6.6l10.4 8.9M10.1 13.5v10.2h3.4v-6.4h5v6.4h3.4V13.5" />
      </svg>
    `,
    organize: `
      <svg viewBox="0 0 32 32" role="img" focusable="false">
        <path class="tab-svg-fill" d="M9.2 6.9h12.3a2.4 2.4 0 0 1 2.4 2.4v15.5a2.4 2.4 0 0 1-2.4 2.4H9.2a2.4 2.4 0 0 1-2.4-2.4V9.3a2.4 2.4 0 0 1 2.4-2.4Z" />
        <path class="tab-svg-line" d="M11 6.2v4.1M16 6.2v4.1M21 6.2v4.1M10.8 15h8.8M10.8 19.2h6.3" />
        <path class="tab-svg-accent" d="m19.1 24.2 4.5-4.5 1.9 1.9-4.5 4.5-2.3.4Z" />
      </svg>
    `,
    flow: `
      <svg viewBox="0 0 32 32" role="img" focusable="false">
        <path class="tab-svg-line" d="M6.1 18.9c3.5-5.7 8.4-5.5 11.4-2.6 2.4 2.4 5.7 2.7 8.4-1.9" />
        <path class="tab-svg-line tab-svg-line-soft" d="M7.5 23c3.2-2.7 6.7-2.4 9.5-.3 2.4 1.8 5.2 1.8 7.5-.7" />
        <path class="tab-svg-fill tab-flow-leaf" d="M19.4 10.2c3.1-.7 5.2.5 6.5 3.2-3 .7-5.2-.3-6.5-3.2Z" />
      </svg>
    `
  };

  icon.innerHTML = svgMap[tab.icon] || "";
  return icon;
}

function renderAddPanel() {
  const overlay = createElement("div", "add-panel-overlay sheet-overlay");
  overlay.dataset.action = "close-add-panel";

  const panel = createElement("section", "add-panel");
  panel.setAttribute("aria-labelledby", "addPanelTitle");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");

  const handle = createElement("span", "panel-handle");
  const title = createElement("h2", null, "무엇을 남길까요?");
  title.id = "addPanelTitle";
  const subtitle = createElement("p", "panel-subtitle", `${formatDateLabel(state.selectedDateKey)}에 작은 흐름을 남겨보세요.`);

  panel.append(handle, title, subtitle, renderPanelModeTabs());

  if (state.addPanelMode === "record") {
    panel.append(renderRecordForm());
  } else {
    panel.append(renderRailAddForm());
  }

  overlay.append(panel);
  return overlay;
}

function renderPanelModeTabs() {
  const modeTabs = createElement("div", "panel-mode-tabs");
  const recordButton = createButton("panel-mode-button", "오늘 한 일 기록하기", "set-panel-mode", "record");
  const railButton = createButton("panel-mode-button", "오늘의 레일 추가하기", "set-panel-mode", "rail");

  if (state.addPanelMode === "record") {
    recordButton.classList.add("is-active");
  } else {
    railButton.classList.add("is-active");
  }

  modeTabs.append(recordButton, railButton);
  return modeTabs;
}

function renderRecordForm() {
  const form = createElement("form", "panel-form");
  form.dataset.action = "save-record";

  const field = renderPanelField({
    label: "기록 내용",
    name: "recordText",
    placeholder: "예: 물 한 컵 마심",
    maxLength: 44,
    value: state.addPanelDraft.record.recordText
  });

  const actions = renderPanelActions("기록하기");
  form.append(field, actions);
  return form;
}

function renderRailAddForm() {
  const form = createElement("form", "panel-form");
  form.dataset.action = "save-new-rail";

  form.append(
    renderPanelField({
      label: "시작 시간",
      name: "time",
      placeholder: "예: 4시",
      maxLength: 8,
      value: state.addPanelDraft.rail.time
    }),
    renderPanelField({
      label: "활동명",
      name: "title",
      placeholder: "예: 집안일 정리",
      maxLength: 28,
      value: state.addPanelDraft.rail.title
    }),
    renderPanelField({
      label: "보조 문구",
      name: "note",
      placeholder: "예: 15분만",
      maxLength: 32,
      value: state.addPanelDraft.rail.note
    }),
    renderPanelActions("추가")
  );

  return form;
}

function renderPanelField({ label, name, placeholder, maxLength, value = "" }) {
  const wrap = createElement("label", "panel-field");
  wrap.append(createElement("span", null, label));

  const input = createElement("input");
  input.name = name;
  input.placeholder = placeholder;
  input.maxLength = maxLength;
  input.value = value;
  input.autocomplete = "off";

  wrap.append(input);
  return wrap;
}

function renderPanelActions(saveText) {
  const actions = createElement("div", "panel-actions");
  const cancelButton = createButton("panel-cancel", "취소", "close-add-panel");
  const saveButton = createElement("button", "panel-save", saveText);
  saveButton.type = "submit";

  actions.append(cancelButton, saveButton);
  return actions;
}

function renderDatePanel() {
  const overlay = createElement("div", "add-panel-overlay sheet-overlay");
  overlay.dataset.action = "close-date-panel";
  const panel = createElement("section", "add-panel date-panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "datePanelTitle");

  const handle = createElement("span", "panel-handle");
  const title = createElement("h2", null, "날짜를 고를까요?");
  title.id = "datePanelTitle";
  const subtitle = createElement("p", "panel-subtitle", formatDateLabel(state.selectedDateKey));
  const actions = createElement("div", "date-panel-actions");

  actions.append(
    createButton("panel-cancel", "전날", "shift-date", "-1"),
    createButton("panel-save", "오늘", "select-today"),
    createButton("panel-cancel", "다음날", "shift-date", "1"),
    createButton("panel-cancel", "닫기", "close-date-panel")
  );

  panel.append(handle, title, subtitle, actions);
  overlay.append(panel);
  return overlay;
}

function renderWeatherPanel() {
  const overlay = createElement("div", "add-panel-overlay sheet-overlay");
  overlay.dataset.action = "close-weather-panel";
  const panel = createElement("section", "add-panel weather-panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "weatherPanelTitle");

  const handle = createElement("span", "panel-handle");
  const title = createElement("h2", null, "오늘 날씨");
  title.id = "weatherPanelTitle";
  const subtitle = createElement("p", "panel-subtitle", `${formatDateLabel(state.selectedDateKey)} 날씨를 남겨두세요.`);
  const options = createElement("div", "weather-options");
  const selectedWeather = normalizeWeatherId(state.weatherByDate[state.selectedDateKey]);

  WEATHER_OPTIONS.forEach((option) => {
    const button = createButton("weather-option", "", "select-weather", option.id);

    if (selectedWeather === option.id) {
      button.classList.add("is-selected");
    }

    button.append(
      createIconImage(option.image, "weather-option-icon", option.label),
      createElement("span", null, option.label)
    );
    options.append(button);
  });

  panel.append(handle, title, subtitle, options, createButton("panel-cancel record-sheet-close", "닫기", "close-weather-panel"));
  overlay.append(panel);
  return overlay;
}

function renderStampCollectionPanel() {
  const overlay = createElement("div", "add-panel-overlay sheet-overlay");
  overlay.dataset.action = "close-stamp-panel";
  const panel = createElement("section", "add-panel stamp-panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "stampPanelTitle");

  const stats = getStampStats();
  const currentStamp = getSelectedStamp();
  const unlockedStamps = STAMP_DEFINITIONS.filter((stamp) => isStampUnlocked(stamp, stats));
  const lockedStamps = STAMP_DEFINITIONS.filter((stamp) => !isStampUnlocked(stamp, stats));

  const handle = createElement("span", "panel-handle");
  const title = createElement("h2", null, "스탬프 보관함");
  title.id = "stampPanelTitle";
  const subtitle = createElement("p", "panel-subtitle", "작은 완료가 쌓이면 새 스탬프가 열려요.");

  const current = createElement("section", "stamp-current");
  current.append(
    createElement("span", "stamp-section-label", "현재 사용 중"),
    renderStampPreview(currentStamp),
    createElement("strong", null, currentStamp.name)
  );

  const unlockedSection = renderStampSection("획득한 스탬프", unlockedStamps, stats, true);
  const lockedSection = renderStampSection("아직 잠긴 스탬프", lockedStamps, stats, false);

  panel.append(handle, title, subtitle, current, renderSoundToggle(), unlockedSection, lockedSection, createButton("panel-cancel record-sheet-close", "닫기", "close-stamp-panel"));
  overlay.append(panel);
  return overlay;
}

function renderSoundToggle() {
  const button = createButton(
    `sound-toggle${state.soundEnabled ? " is-on" : ""}`,
    "",
    "toggle-sound"
  );
  button.setAttribute("aria-pressed", String(state.soundEnabled));
  button.append(
    createElement("span", "sound-toggle-copy", "효과음"),
    createElement("span", "sound-toggle-state", state.soundEnabled ? "켜짐" : "꺼짐"),
    createElement("span", "sound-toggle-switch")
  );

  return button;
}

function renderStampSection(title, stamps, stats, selectable) {
  const section = createElement("section", "stamp-locker-section");
  section.append(createElement("h3", null, title));

  const list = createElement("div", "stamp-locker-list");

  if (stamps.length === 0) {
    list.append(createElement("p", "panel-subtitle", selectable ? "아직 획득한 스탬프가 없어요." : "잠긴 스탬프가 없어요."));
  }

  stamps.forEach((stamp) => {
    const item = createButton(
      `stamp-locker-item${selectable ? "" : " is-locked"}${state.selectedStampId === stamp.id ? " is-selected" : ""}`,
      "",
      selectable ? "select-stamp" : "show-locked-stamp",
      stamp.id
    );
    item.append(
      renderStampPreview(stamp),
      createElement("strong", null, stamp.name),
      createElement("span", null, selectable ? stamp.description : stamp.unlockText)
    );
    list.append(item);
  });

  section.append(list);
  return section;
}

function renderStampPreview(stamp) {
  const preview = createElement("span", "stamp-preview");

  if (stamp.image) {
    preview.append(createIconImage(stamp.image, "stamp-preview-image"));
  } else {
    preview.append(createElement("span", "stamp-preview-text", stamp.name.slice(0, 2)));
  }

  return preview;
}

function renderRecordSheet() {
  const overlay = createElement("div", "add-panel-overlay sheet-overlay");
  overlay.dataset.action = "close-record-sheet";
  const panel = createElement("section", "add-panel record-sheet");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "recordSheetTitle");

  const handle = createElement("span", "panel-handle");
  const titleText = state.recordSheetMode === "edit"
    ? "기록 수정하기"
    : state.recordSheetMode === "delete"
      ? "기록 지우기"
      : "기록 관리하기";
  const title = createElement("h2", null, titleText);
  title.id = "recordSheetTitle";
  panel.append(handle, title);

  if (state.recordSheetMode === "edit") {
    const record = getSelectedRecord();

    if (!record) {
      state.recordSheetMode = "view";
      state.selectedRecordId = null;
      return renderRecordSheet();
    }

    const form = createElement("form", "panel-form");
    form.dataset.action = "save-record-edit";
    form.append(renderPanelField({
      label: "기록 내용",
      name: "recordEditText",
      placeholder: "기록을 적어주세요",
      maxLength: 44,
      value: state.recordEditDraft
    }));

    const actions = createElement("div", "panel-actions");
    const saveButton = createElement("button", "panel-save", "저장");
    saveButton.type = "submit";
    actions.append(
      createButton("panel-cancel", "취소", "cancel-record-edit"),
      saveButton
    );
    form.append(actions);
    panel.append(form);
  } else if (state.recordSheetMode === "delete") {
    panel.append(renderRecordDeleteConfirm());
  } else {
    panel.append(createElement("p", "panel-subtitle", `${formatDateLabel(state.selectedDateKey)} 기록을 정리해요.`));
    panel.append(renderRecordManageList());
  }

  overlay.append(panel);
  return overlay;
}

function renderRecordDeleteConfirm() {
  const record = getSelectedRecord();
  const wrap = createElement("div", "record-delete-confirm");

  if (!record) {
    state.recordSheetMode = "view";
    state.selectedRecordId = null;
    state.pendingRecordDeleteId = null;
    return renderRecordManageList();
  }

  wrap.append(createElement("p", "record-delete-question", "이 기록을 지울까요?"));

  const target = createElement("div", "record-delete-target");
  target.append(
    renderRecordIcon(record.text),
    createElement("span", "record-manage-text", record.text)
  );
  wrap.append(target);

  const actions = createElement("div", "record-delete-actions");
  actions.append(
    createButton("panel-cancel", "취소", "cancel-record-delete"),
    createButton("record-delete-confirm-button", "지우기", "confirm-record-delete")
  );
  wrap.append(actions);

  return wrap;
}

function renderRecordManageList() {
  const wrap = createElement("div", "record-manage-list");
  const records = getSelectedRecords();

  if (records.length === 0) {
    wrap.append(createElement("p", "record-empty", "이 날짜에는 아직 관리할 기록이 없어요."));
    wrap.append(createButton("panel-cancel record-sheet-close", "닫기", "close-record-sheet"));
    return wrap;
  }

  records.forEach((record) => {
    const item = createElement("article", "record-manage-item");
    const main = createElement("div", "record-manage-main");
    main.append(
      renderRecordIcon(record.text),
      createElement("span", "record-manage-text", record.text)
    );

    const status = createElement("span", "record-manage-stamp", record.stamped ? "도장 찍힘" : "도장 전");
    const actions = createElement("div", "record-manage-actions");
    actions.append(
      createButton("panel-save compact-action", "수정", "edit-record", record.id),
      createButton("rail-delete-button compact-action", "삭제", "delete-record", record.id)
    );

    item.append(main, status, actions);
    wrap.append(item);
  });

  wrap.append(createButton("panel-cancel record-sheet-close", "닫기", "close-record-sheet"));
  return wrap;
}

function renderToast() {
  const toast = createElement("div", "toast", state.toastMessage);
  toast.setAttribute("role", "status");
  return toast;
}

function getRailItemById(id) {
  return state.railItems.find((railItem) => railItem.id === id);
}

function findElementByData(root, dataName, value) {
  const attributeName = dataName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

  return [...root.querySelectorAll(`[data-${attributeName}]`)]
    .find((element) => element.dataset[dataName] === value);
}

function refreshRailActions(id) {
  const item = getRailItemById(id);

  if (!item) {
    return false;
  }

  const railItem = findElementByData(app, "railId", id);
  const currentActions = railItem?.querySelector(".rail-actions");

  if (!currentActions) {
    return false;
  }

  currentActions.replaceWith(renderRailActions(item));
  return true;
}

function refreshRecordStamp(id, dateKey = state.selectedDateKey) {
  if (dateKey !== state.selectedDateKey) {
    return false;
  }

  const record = getSelectedRecords().find((item) => item.id === id);
  const currentStamp = findElementByData(app, "stampFor", id);

  if (!record || !currentStamp) {
    return false;
  }

  currentStamp.replaceWith(renderStampButton(record));
  return true;
}

function refreshSummary() {
  const currentSummary = app.querySelector(".summary-card");

  if (!currentSummary) {
    return false;
  }

  currentSummary.replaceWith(renderSummary());
  return true;
}

function refreshToast() {
  app.querySelector(".toast")?.remove();

  if (state.toastMessage) {
    app.append(renderToast());
  }
}

function updateRailItem(id, nextValues, options = {}) {
  state.railItems = state.railItems.map((item) => (
    item.id === id ? { ...item, ...nextValues } : item
  ));

  if (options.persist) {
    saveRailItems();
  }
}

function clearRailTimer(id) {
  const timer = railTimerIntervals.get(id);

  if (!timer) {
    return;
  }

  clearInterval(timer);
  railTimerIntervals.delete(id);
}

function announce(message) {
  liveRegion.textContent = message;
}

function showToast(message) {
  state.toastMessage = message;
  announce(message);

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    state.toastMessage = "";
    refreshToast();
  }, 1800);

  refreshToast();
}

function scrollToSection(sectionId) {
  window.requestAnimationFrame(() => {
    const target = document.getElementById(sectionId);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function openAddPanel(mode = "record") {
  state.addPanelOpen = true;
  state.addPanelMode = mode;
  resetAddPanelDraft();
  state.editingRailId = null;
  state.pendingRailDeleteId = null;
  state.datePanelOpen = false;
  state.recordSheetOpen = false;
  state.weatherPanelOpen = false;
  state.stampPanelOpen = false;
}

function closeAddPanel() {
  state.addPanelOpen = false;
  resetAddPanelDraft();
}

function resetAddPanelDraft() {
  state.addPanelDraft = {
    record: {
      recordText: ""
    },
    rail: {
      time: "",
      title: "",
      note: ""
    }
  };
}

function updateAddPanelDraft(input) {
  if (!state.addPanelOpen || !input.name) {
    return;
  }

  const mode = state.addPanelMode;
  state.addPanelDraft = {
    ...state.addPanelDraft,
    [mode]: {
      ...state.addPanelDraft[mode],
      [input.name]: input.value
    }
  };
}

function getRecordIcon(text) {
  const recordText = String(text || "");
  const matchedRule = RECORD_ICON_RULES.find((rule) => (
    rule.keywords.some((keyword) => recordText.includes(keyword))
  ));
  return matchedRule ? matchedRule.icon : ICONS.misc;
}

function getRecordCategory(text) {
  const recordText = String(text || "");
  const includesAny = (keywords) => keywords.some((keyword) => recordText.includes(keyword));

  if (includesAny(["우쿨렐레", "코덱스", "책읽기", "책", "독서", "기록", "글쓰기", "프리미어프로", "편집", "공부", "작업", "사진정리", "만들기", "취미"])) {
    return "focus";
  }

  if (includesAny(["물", "마심", "차", "음료", "밥", "식사", "과일", "간식", "먹음", "먹기", "세수", "샤워", "양치", "씻", "스트레칭", "운동", "걷기", "산책", "병원", "약", "쉬기", "휴식", "낮잠", "잠", "미용실", "머리컷", "뿌리염색", "염색"])) {
    return "care";
  }

  if (includesAny(["설거지", "청소", "빨래", "정리", "장보기", "저녁준비", "요리", "쓰레기", "분리수거", "집안일", "집안"])) {
    return "chore";
  }

  return "focus";
}

function saveRecord(form) {
  const formData = new FormData(form);
  const text = String(formData.get("recordText") || "").trim();

  if (!text) {
    showToast("남길 내용을 적어주세요.");
    return;
  }

  setSelectedRecords([
    {
      id: createId("record"),
      icon: getRecordIcon(text),
      text,
      category: getRecordCategory(text),
      source: "manual",
      stamped: false
    },
    ...getSelectedRecords()
  ]);
  state.activeTab = "records";
  closeAddPanel();
  showToast("오늘 기록에 남겼어요.");
  render();
  scrollToSection("recordsSection");
}

function saveNewRail(form) {
  const formData = new FormData(form);
  const time = String(formData.get("time") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!time || !title) {
    showToast("시간과 활동명을 적어주세요.");
    return;
  }

  state.railItems = [
    ...state.railItems,
    normalizeRailItem({
      id: createId("rail"),
      time,
      title,
      note: note || "가볍게"
    })
  ];
  saveRailItems();
  state.homeLayout = normalizeHomeLayout({
    ...state.homeLayout,
    collapsed: {
      ...state.homeLayout.collapsed,
      railSet: false
    }
  });
  saveHomeLayout();
  closeAddPanel();
  showToast("오늘의 레일에 추가했어요.");
  render();
  scrollToSection("railSection");
}

function startRailTimer(id) {
  const item = state.railItems.find((railItem) => railItem.id === id);

  if (!item) {
    return;
  }

  const durationSeconds = getRailDurationSeconds(item);
  const now = Date.now();
  clearRailTimer(id);
  updateRailItem(id, {
    timerStatus: "running",
    durationSeconds,
    remainingSeconds: durationSeconds,
    startedAt: now,
    pausedAt: null,
    elapsedBeforePause: 0
  }, { persist: true });
  if (!refreshRailActions(id)) {
    render();
  }
  runRailTimer(id);
}

function runRailTimer(id) {
  clearRailTimer(id);
  const intervalId = setInterval(() => {
    tickRailTimer(id);
  }, 1000);
  railTimerIntervals.set(id, intervalId);
}

function syncRailTimersWithClock(options = {}) {
  const now = Date.now();
  let changed = false;

  state.railItems = state.railItems.map((item) => {
    if ((item.timerStatus || "idle") !== "running") {
      return item;
    }

    const durationSeconds = getRailStoredDuration(item);
    const remainingSeconds = getRailRemainingSeconds(item, now);
    const nextItem = {
      ...item,
      durationSeconds,
      remainingSeconds
    };

    if (remainingSeconds === 0) {
      changed = true;
      if (options.playSound) {
        playEffectSound("timerDone");
      }
      return {
        ...nextItem,
        timerStatus: "done",
        startedAt: null,
        pausedAt: null,
        elapsedBeforePause: durationSeconds
      };
    }

    if (remainingSeconds !== item.remainingSeconds) {
      changed = true;
    }

    return nextItem;
  });

  if (changed && options.persist) {
    saveRailItems();
  }

  if (changed && options.refresh) {
    const refreshed = state.railItems.every((item) => {
      if ((item.timerStatus || "idle") !== "running" && item.remainingSeconds !== 0) {
        return true;
      }

      return refreshRailActions(item.id);
    });

    if (!refreshed) {
      render();
    }
  }

  return changed;
}

function startActiveRailTimers() {
  state.railItems.forEach((item) => {
    if ((item.timerStatus || "idle") === "running") {
      runRailTimer(item.id);
    }
  });
}

function resyncVisibleRailTimers() {
  syncRailTimersWithClock({ persist: true, refresh: true, playSound: true });
  startActiveRailTimers();
}

function pauseRailTimer(id) {
  const item = state.railItems.find((railItem) => railItem.id === id);

  if (!item) {
    return;
  }

  const now = Date.now();
  const durationSeconds = getRailStoredDuration(item);
  const remainingSeconds = getRailRemainingSeconds(item, now);
  const elapsedBeforePause = Math.max(0, durationSeconds - remainingSeconds);

  clearRailTimer(id);
  updateRailItem(id, {
    timerStatus: remainingSeconds === 0 ? "done" : "paused",
    durationSeconds,
    remainingSeconds,
    startedAt: null,
    pausedAt: now,
    elapsedBeforePause
  }, { persist: true });
  if (!refreshRailActions(id)) {
    render();
  }
}

function resumeRailTimer(id) {
  const item = state.railItems.find((railItem) => railItem.id === id);

  if (!item) {
    return;
  }

  const now = Date.now();
  const durationSeconds = getRailStoredDuration(item);
  const remainingSeconds = getRailRemainingSeconds(item, now);

  if (remainingSeconds === 0) {
    updateRailItem(id, {
      timerStatus: "done",
      durationSeconds,
      remainingSeconds: 0,
      startedAt: null,
      pausedAt: null,
      elapsedBeforePause: durationSeconds
    }, { persist: true });
    if (!refreshRailActions(id)) {
      render();
    }
    return;
  }

  updateRailItem(id, {
    timerStatus: "running",
    durationSeconds,
    remainingSeconds,
    startedAt: now,
    pausedAt: null,
    elapsedBeforePause: Math.max(0, durationSeconds - remainingSeconds)
  }, { persist: true });
  if (!refreshRailActions(id)) {
    render();
  }
  runRailTimer(id);
}

function tickRailTimer(id) {
  const item = state.railItems.find((railItem) => railItem.id === id);

  if (!item || item.timerStatus !== "running") {
    clearRailTimer(id);
    return;
  }

  const durationSeconds = getRailStoredDuration(item);
  const nextRemaining = getRailRemainingSeconds(item);

  if (nextRemaining === 0) {
    clearRailTimer(id);
    updateRailItem(id, {
      remainingSeconds: 0,
      timerStatus: "done",
      durationSeconds,
      startedAt: null,
      pausedAt: null,
      elapsedBeforePause: durationSeconds
    }, { persist: true });
    playEffectSound("timerDone");
    showToast(`${item.title} 기록할 준비가 됐어요.`);
    if (!refreshRailActions(id) && !isRailSetCollapsed()) {
      render();
    }
    return;
  }

  updateRailItem(id, {
    remainingSeconds: nextRemaining
  });
  if (!refreshRailActions(id) && !isRailSetCollapsed()) {
    render();
  }
}

function recordRailResult(id) {
  const item = state.railItems.find((railItem) => railItem.id === id);

  if (!item) {
    return;
  }

  const durationSeconds = item.durationSeconds || getRailDurationSeconds(item);
  const recordText = `${item.title} ${formatDurationForRecord(durationSeconds)} 함`;

  setSelectedRecords([
    {
      id: createId("record"),
      icon: getRecordIcon(recordText),
      text: recordText,
      category: getRecordCategory(recordText),
      source: "rail",
      stamped: false
    },
    ...getSelectedRecords()
  ]);
  updateRailItem(id, {
    timerStatus: "idle",
    durationSeconds: null,
    remainingSeconds: null,
    startedAt: null,
    pausedAt: null,
    elapsedBeforePause: 0
  }, { persist: true });
  state.activeTab = "records";
  showToast("선택한 날짜 기록에 남겼어요.");
  render();
  scrollToSection("recordsSection");
}

function deleteRail(id) {
  const item = state.railItems.find((railItem) => railItem.id === id);

  if (!item) {
    return;
  }

  clearRailTimer(id);
  state.railItems = state.railItems.filter((railItem) => railItem.id !== id);
  state.editingRailId = null;
  state.pendingRailDeleteId = null;
  saveRailItems();
  showToast("레일을 지웠어요.");
  render();
}

function stampRecord(id) {
  const record = getSelectedRecords().find((item) => item.id === id);

  if (!record || record.stamped || state.stampingRecordId) {
    return;
  }

  const stampDateKey = state.selectedDateKey;
  const selectedStampId = getSelectedStamp().id;
  state.stampingRecordId = id;
  state.stampingRecordDateKey = stampDateKey;
  window.setTimeout(() => {
    if (state.stampingRecordId === id && state.stampingRecordDateKey === stampDateKey) {
      playEffectSound("stamp");
    }
  }, STAMP_SOUND_DELAY_MS);
  if (!refreshRecordStamp(id, stampDateKey)) {
    render();
  }

  setTimeout(() => {
    const records = state.recordsByDate[stampDateKey] || [];
    state.recordsByDate = {
      ...state.recordsByDate,
      [stampDateKey]: records.map((item) => (
        item.id === id ? { ...item, stamped: true, stampId: selectedStampId } : item
      ))
    };
    state.stampingRecordId = null;
    state.stampingRecordDateKey = null;
    saveRecordsByDate();
    if (refreshRecordStamp(id, stampDateKey)) {
      refreshSummary();
    } else {
      render();
    }
  }, 640);
}

function openRecordSheet() {
  state.selectedRecordId = null;
  state.pendingRecordDeleteId = null;
  state.pendingRailDeleteId = null;
  state.recordEditDraft = "";
  state.recordSheetMode = "view";
  state.recordSheetOpen = true;
  state.addPanelOpen = false;
  state.datePanelOpen = false;
  state.weatherPanelOpen = false;
  state.stampPanelOpen = false;
}

function closeRecordSheet() {
  state.recordSheetOpen = false;
  state.selectedRecordId = null;
  state.pendingRecordDeleteId = null;
  state.recordEditDraft = "";
  state.recordSheetMode = "view";
}

function openWeatherPanel() {
  state.weatherPanelOpen = true;
  state.addPanelOpen = false;
  state.datePanelOpen = false;
  state.recordSheetOpen = false;
  state.stampPanelOpen = false;
}

function closeWeatherPanel() {
  state.weatherPanelOpen = false;
}

function openStampPanel() {
  state.stampPanelOpen = true;
  state.activeTab = "stamps";
  state.addPanelOpen = false;
  state.datePanelOpen = false;
  state.weatherPanelOpen = false;
  state.recordSheetOpen = false;
}

function closeStampPanel() {
  state.stampPanelOpen = false;
}

function changeSelectedDate(nextDateKey) {
  state.selectedDateKey = nextDateKey;
  state.activeTab = "home";
  state.pendingRailDeleteId = null;
  closeRecordSheet();
  closeAddPanel();
  closeWeatherPanel();
  closeStampPanel();
}

function toggleHomeBlock(blockId) {
  state.homeLayout = normalizeHomeLayout({
    ...state.homeLayout,
    collapsed: {
      ...state.homeLayout.collapsed,
      [blockId]: !state.homeLayout.collapsed[blockId]
    }
  });
  saveHomeLayout();
}

function moveHomeBlock(blockId, direction) {
  const order = [...state.homeLayout.order];
  const currentIndex = order.indexOf(blockId);

  if (currentIndex < 0) {
    return;
  }

  const nextIndex = direction === "up"
    ? Math.max(0, currentIndex - 1)
    : Math.min(order.length - 1, currentIndex + 1);

  if (nextIndex === currentIndex) {
    return;
  }

  [order[currentIndex], order[nextIndex]] = [order[nextIndex], order[currentIndex]];
  state.homeLayout = normalizeHomeLayout({
    ...state.homeLayout,
    order
  });
  saveHomeLayout();
}

function isRailSetCollapsed() {
  return Boolean(state.homeLayout.collapsed.railSet);
}

app.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");

  if (!actionTarget) {
    return;
  }

  const { action, id } = actionTarget.dataset;

  if (action.endsWith("panel") || action.endsWith("sheet")) {
    const isOverlayClick = actionTarget.classList.contains("sheet-overlay") && event.target !== actionTarget;

    if (isOverlayClick) {
      return;
    }
  }

  if (action === "move-home-block") {
    const [blockId, direction] = String(id || "").split(":");
    moveHomeBlock(blockId, direction);
    render();
    return;
  }

  if (action === "toggle-home-block") {
    toggleHomeBlock(id);
    render();
    return;
  }

  if (action === "open-date-panel") {
    state.datePanelOpen = true;
    state.addPanelOpen = false;
    state.recordSheetOpen = false;
    state.weatherPanelOpen = false;
    state.stampPanelOpen = false;
    render();
    return;
  }

  if (action === "close-date-panel") {
    state.datePanelOpen = false;
    render();
    return;
  }

  if (action === "shift-date") {
    changeSelectedDate(shiftDateKey(state.selectedDateKey, Number(id)));
    render();
    return;
  }

  if (action === "select-today") {
    changeSelectedDate(todayKey);
    render();
    return;
  }

  if (action === "open-weather-panel") {
    openWeatherPanel();
    render();
    return;
  }

  if (action === "close-weather-panel") {
    closeWeatherPanel();
    render();
    return;
  }

  if (action === "select-weather") {
    state.weatherByDate = {
      ...state.weatherByDate,
      [state.selectedDateKey]: id
    };
    saveWeatherByDate();
    closeWeatherPanel();
    render();
    return;
  }

  if (action === "start-rail") {
    startRailTimer(id);
    return;
  }

  if (action === "pause-rail") {
    pauseRailTimer(id);
    return;
  }

  if (action === "resume-rail") {
    resumeRailTimer(id);
    return;
  }

  if (action === "record-rail") {
    recordRailResult(id);
    return;
  }

  if (action === "edit-rail") {
    state.editingRailId = state.editingRailId === id ? null : id;
    state.pendingRailDeleteId = null;
    state.addPanelOpen = false;
    state.datePanelOpen = false;
    state.recordSheetOpen = false;
    render();
    return;
  }

  if (action === "cancel-edit") {
    state.editingRailId = null;
    state.pendingRailDeleteId = null;
    render();
    return;
  }

  if (action === "delete-rail") {
    state.editingRailId = id;
    state.pendingRailDeleteId = id;
    render();
    return;
  }

  if (action === "cancel-rail-delete") {
    state.pendingRailDeleteId = null;
    render();
    return;
  }

  if (action === "confirm-rail-delete") {
    deleteRail(id);
    return;
  }

  if (action === "stamp-record") {
    stampRecord(id);
    return;
  }

  if (action === "edit-record") {
    state.selectedRecordId = id;
    state.pendingRecordDeleteId = null;
    const record = getSelectedRecord();
    state.recordSheetMode = "edit";
    state.recordEditDraft = record ? record.text : "";
    render();
    return;
  }

  if (action === "cancel-record-edit") {
    state.recordSheetMode = "view";
    render();
    return;
  }

  if (action === "delete-record") {
    const recordId = id || state.selectedRecordId;

    if (recordId) {
      state.selectedRecordId = recordId;
      state.pendingRecordDeleteId = recordId;
      state.recordEditDraft = "";
      state.recordSheetMode = "delete";
      render();
    }
    return;
  }

  if (action === "cancel-record-delete") {
    state.selectedRecordId = null;
    state.pendingRecordDeleteId = null;
    state.recordSheetMode = "view";
    render();
    return;
  }

  if (action === "confirm-record-delete") {
    const recordId = state.pendingRecordDeleteId || state.selectedRecordId;

    if (recordId) {
      deleteSelectedRecord(recordId);
      state.selectedRecordId = null;
      state.pendingRecordDeleteId = null;
      state.recordEditDraft = "";
      state.recordSheetMode = "view";
      showToast("기록을 지웠어요.");
      render();
    }
    return;
  }

  if (action === "close-record-sheet") {
    closeRecordSheet();
    render();
    return;
  }

  if (action === "go-home") {
    state.activeTab = "home";
    render();
    scrollToSection("homeSection");
    return;
  }

  if (action === "go-records") {
    state.activeTab = "records";
    openRecordSheet();
    render();
    return;
  }

  if (action === "open-add-panel") {
    openAddPanel();
    render();
    window.requestAnimationFrame(() => {
      document.querySelector(".add-panel input")?.focus();
    });
    return;
  }

  if (action === "close-add-panel") {
    closeAddPanel();
    render();
    return;
  }

  if (action === "set-panel-mode") {
    state.addPanelMode = id;
    render();
    window.requestAnimationFrame(() => {
      document.querySelector(".add-panel input")?.focus();
    });
    return;
  }

  if (action === "show-stamps") {
    openStampPanel();
    render();
    return;
  }

  if (action === "close-stamp-panel") {
    closeStampPanel();
    render();
    return;
  }

  if (action === "toggle-sound") {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      unlockEffectAudioContext();
    }
    saveSoundEnabled();
    showToast(state.soundEnabled ? "효과음을 켰어요." : "효과음을 껐어요.");
    render();
    return;
  }

  if (action === "select-stamp") {
    const stamp = getStampById(id);

    if (isStampUnlocked(stamp)) {
      state.selectedStampId = stamp.id;
      saveSelectedStampId();
      showToast(`${stamp.name} 스탬프를 사용할게요.`);
      render();
    }
    return;
  }

  if (action === "show-locked-stamp") {
    const stamp = getStampById(id);
    showToast(stamp.unlockText);
    refreshToast();
    return;
  }

  if (action === "show-my-flow") {
    showToast("나의 흐름 화면은 준비 중이에요.");
    render();
  }
});

app.addEventListener("input", (event) => {
  if (event.target.matches(".add-panel input")) {
    updateAddPanelDraft(event.target);
  }

  if (event.target.matches("[name='recordEditText']")) {
    state.recordEditDraft = event.target.value;
  }
});

app.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action]");

  if (!form) {
    return;
  }

  event.preventDefault();

  if (form.dataset.action === "save-rail") {
    const formData = new FormData(form);
    const id = form.dataset.id;
    const nextItem = {
      time: String(formData.get("time") || "").trim() || "시간",
      title: String(formData.get("title") || "").trim() || "새 항목",
      note: String(formData.get("note") || "").trim() || "가볍게",
      timerStatus: "idle",
      durationSeconds: null,
      remainingSeconds: null,
      startedAt: null,
      pausedAt: null,
      elapsedBeforePause: 0
    };

    clearRailTimer(id);
    updateRailItem(id, nextItem);
    saveRailItems();
    state.editingRailId = null;
    state.pendingRailDeleteId = null;
    showToast("레일 수정이 포스트잇에도 반영됐어요.");
    render();
    return;
  }

  if (form.dataset.action === "save-record") {
    saveRecord(form);
    return;
  }

  if (form.dataset.action === "save-new-rail") {
    saveNewRail(form);
    return;
  }

  if (form.dataset.action === "save-record-edit") {
    const formData = new FormData(form);
    const text = String(formData.get("recordEditText") || "").trim();

    if (!text) {
      showToast("기록 내용을 적어주세요.");
      return;
    }

    updateSelectedRecord(state.selectedRecordId, {
      text,
      icon: getRecordIcon(text),
      category: getRecordCategory(text)
    });
    state.recordSheetMode = "view";
    state.pendingRecordDeleteId = null;
    state.recordEditDraft = text;
    showToast("기록을 수정했어요.");
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (state.addPanelOpen) {
      closeAddPanel();
    }

    state.datePanelOpen = false;
    closeRecordSheet();
    render();
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    resyncVisibleRailTimers();
  }
});

window.addEventListener("pageshow", () => {
  resyncVisibleRailTimers();
});

syncRailTimersWithClock({ persist: true });
startActiveRailTimers();
render();
