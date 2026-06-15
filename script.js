const app = document.getElementById("app");
const liveRegion = document.getElementById("liveRegion");

const STORAGE_KEYS = {
  railItems: "todayFlowRailItems",
  recordsByDate: "todayFlowRecordsByDate"
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
  misc: "assets/icons/misc.png"
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
  recordsByDate: loadRecordsByDate()
};

let toastTimer = null;
const railTimerIntervals = new Map();

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
  return {
    id: item.id || createId("rail"),
    time: item.time || "시간",
    title: item.title || "새 항목",
    note: item.note || "가볍게",
    timerStatus: "idle",
    durationSeconds: null,
    remainingSeconds: null
  };
}

function stripRailForStorage(item) {
  return {
    id: item.id,
    time: item.time,
    title: item.title,
    note: item.note
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
      stamped: false
    },
    {
      id: "record-dishes",
      text: "설거지 15분 함",
      icon: getRecordIcon("설거지 15분 함"),
      category: "chore",
      stamped: false
    },
    {
      id: "record-water",
      text: "물 한 컵 마심",
      icon: getRecordIcon("물 한 컵 마심"),
      category: "care",
      stamped: false
    },
    {
      id: "record-wash",
      text: "세수함",
      icon: getRecordIcon("세수함"),
      category: "care",
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

function render() {
  app.innerHTML = "";

  const shell = createElement("section", "phone-shell");
  shell.append(renderHero());
  shell.append(renderSectionStack());

  app.append(shell);
  app.append(renderTabBar());

  if (state.addPanelOpen) {
    app.append(renderAddPanel());
  }

  if (state.datePanelOpen) {
    app.append(renderDatePanel());
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
  hero.id = "homeSection";
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

function renderSectionStack() {
  const stack = createElement("div", "section-stack");
  stack.append(renderTodayRail(), renderTodayRecords(), renderSummary());
  return stack;
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
      createElement("span", "rail-paused-time", formatRemainingTime(item.remainingSeconds ?? getRailDurationSeconds(item))),
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
    const empty = createElement("p", "record-empty", "이 날짜에는 아직 남긴 기록이 없어요.");
    section.append(empty);
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
    stamp.append(createIconImage(ICONS.stampResult, "stamp-result-image"));
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

function renderSummary() {
  const summary = createElement("section", "section-card summary-card");
  summary.setAttribute("aria-label", "오늘 요약");
  const stampedRecords = getSelectedRecords().filter((record) => record.stamped);

  const summaryItems = [
    {
      icon: ICONS.note,
      label: "기록",
      value: stampedRecords.length
    },
    {
      icon: ICONS.hygiene,
      label: "몸 돌봄",
      value: countRecordsByCategory("care", stampedRecords)
    },
    {
      icon: ICONS.housework,
      label: "집안일",
      value: countRecordsByCategory("chore", stampedRecords)
    }
  ];

  summaryItems.forEach((item) => {
    const block = createElement("article", "summary-item");
    block.append(
      createIconImage(item.icon, "summary-icon"),
      createElement("span", "summary-label", item.label),
      createElement("strong", "summary-value", String(item.value))
    );
    summary.append(block);
  });

  return summary;
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

function getRailButtonLabel(item) {
  const timerStatus = item.timerStatus || "idle";
  const remaining = formatRemainingTime(item.remainingSeconds ?? getRailDurationSeconds(item));

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
    { id: "home", icon: "⌂", label: "홈", action: "go-home" },
    { id: "records", icon: ICONS.note, label: "기록", action: "go-records", image: true },
    { id: "add", icon: "+", label: "", action: "open-add-panel" },
    { id: "stamps", icon: ICONS.stamp, label: "스탬프", action: "show-stamps", image: true },
    { id: "my-flow", icon: "♡", label: "나의 흐름", action: "show-my-flow" }
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

    const tabIcon = tab.image
      ? createIconImage(tab.icon, "tab-icon tab-image-icon")
      : createElement("span", "tab-icon", tab.icon);
    button.append(tabIcon, createElement("span", null, tab.label));
    nav.append(button);
  });

  return nav;
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

function refreshToast() {
  app.querySelector(".toast")?.remove();

  if (state.toastMessage) {
    app.append(renderToast());
  }
}

function updateRailItem(id, nextValues) {
  state.railItems = state.railItems.map((item) => (
    item.id === id ? { ...item, ...nextValues } : item
  ));
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

  if (
    recordText.includes("물")
    || recordText.includes("마심")
    || recordText.includes("차")
    || recordText.includes("음료")
    || recordText.includes("밥")
    || recordText.includes("식사")
    || recordText.includes("과일")
    || recordText.includes("간식")
    || recordText.includes("먹음")
    || recordText.includes("먹기")
    || recordText.includes("세수")
    || recordText.includes("샤워")
    || recordText.includes("양치")
    || recordText.includes("씻")
    || recordText.includes("스트레칭")
    || recordText.includes("운동")
    || recordText.includes("걷기")
    || recordText.includes("산책")
    || recordText.includes("쉬기")
    || recordText.includes("휴식")
    || recordText.includes("낮잠")
    || recordText.includes("잠")
  ) {
    return "care";
  }

  if (
    recordText.includes("설거지")
    || recordText.includes("청소")
    || recordText.includes("빨래")
    || recordText.includes("정리")
    || recordText.includes("집안")
  ) {
    return "chore";
  }

  return "record";
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
  clearRailTimer(id);
  updateRailItem(id, {
    timerStatus: "running",
    durationSeconds,
    remainingSeconds: durationSeconds
  });
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

function pauseRailTimer(id) {
  clearRailTimer(id);
  updateRailItem(id, {
    timerStatus: "paused"
  });
  if (!refreshRailActions(id)) {
    render();
  }
}

function resumeRailTimer(id) {
  const item = state.railItems.find((railItem) => railItem.id === id);

  if (!item) {
    return;
  }

  updateRailItem(id, {
    timerStatus: "running"
  });
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

  const nextRemaining = Math.max(0, (item.remainingSeconds ?? getRailDurationSeconds(item)) - 1);

  if (nextRemaining === 0) {
    clearRailTimer(id);
    updateRailItem(id, {
      remainingSeconds: 0,
      timerStatus: "done"
    });
    showToast(`${item.title} 기록할 준비가 됐어요.`);
    if (!refreshRailActions(id)) {
      render();
    }
    return;
  }

  updateRailItem(id, {
    remainingSeconds: nextRemaining
  });
  if (!refreshRailActions(id)) {
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
      stamped: false
    },
    ...getSelectedRecords()
  ]);
  updateRailItem(id, {
    timerStatus: "idle",
    durationSeconds: null,
    remainingSeconds: null
  });
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
  state.stampingRecordId = id;
  state.stampingRecordDateKey = stampDateKey;
  if (!refreshRecordStamp(id, stampDateKey)) {
    render();
  }

  setTimeout(() => {
    const records = state.recordsByDate[stampDateKey] || [];
    state.recordsByDate = {
      ...state.recordsByDate,
      [stampDateKey]: records.map((item) => (
        item.id === id ? { ...item, stamped: true } : item
      ))
    };
    state.stampingRecordId = null;
    state.stampingRecordDateKey = null;
    saveRecordsByDate();
    if (!refreshRecordStamp(id, stampDateKey)) {
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
}

function closeRecordSheet() {
  state.recordSheetOpen = false;
  state.selectedRecordId = null;
  state.pendingRecordDeleteId = null;
  state.recordEditDraft = "";
  state.recordSheetMode = "view";
}

function changeSelectedDate(nextDateKey) {
  state.selectedDateKey = nextDateKey;
  state.activeTab = "home";
  state.pendingRailDeleteId = null;
  closeRecordSheet();
  closeAddPanel();
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

  if (action === "open-date-panel") {
    state.datePanelOpen = true;
    state.addPanelOpen = false;
    state.recordSheetOpen = false;
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
    showToast("스탬프 화면은 준비 중이에요.");
    render();
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
      remainingSeconds: null
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

render();
