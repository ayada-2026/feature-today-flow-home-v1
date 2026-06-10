const app = document.getElementById("app");
const liveRegion = document.getElementById("liveRegion");

const state = {
  activeTab: "home",
  editingRailId: null,
  addPanelOpen: false,
  addPanelMode: "record",
  toastMessage: "",
  railItems: [
    {
      id: "rail-premiere",
      time: "2시",
      title: "프리미어프로",
      note: "20분만",
      started: false
    },
    {
      id: "rail-home",
      time: "4시",
      title: "집안일 정리",
      note: "15분만",
      started: false
    },
    {
      id: "rail-dinner",
      time: "6시",
      title: "저녁준비",
      note: "시작만",
      started: false
    }
  ],
  records: [
    {
      id: "record-premiere",
      icon: "🎬",
      text: "프리미어프로 20분 함",
      category: "record",
      stamped: true
    },
    {
      id: "record-dishes",
      icon: "🍽",
      text: "설거지 15분 함",
      category: "chore",
      stamped: true
    },
    {
      id: "record-water",
      icon: "🥛",
      text: "물 한 컵 마심",
      category: "care",
      stamped: true
    },
    {
      id: "record-wash",
      icon: "🫧",
      text: "세수함",
      category: "care",
      stamped: true
    }
  ]
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

function formatToday() {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());
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
  const titleBlock = createElement("div");

  const eyebrow = createElement("p", "eyebrow", "TODAY FLOW");
  const title = createElement("h1", null, "오늘의 흐름");
  title.id = "pageTitle";
  const subtitle = createElement("p", "subtitle", "시작할 시간은 가볍게 정하고, 해낸 일은 도장으로 남겨보세요.");

  titleBlock.append(eyebrow, title, subtitle);

  const datePill = createElement("div", "date-pill");
  datePill.setAttribute("aria-label", "오늘 날짜");
  datePill.append(createElement("span", null, "📅"));
  datePill.append(createElement("span", null, formatToday()));

  titleRow.append(titleBlock, datePill);
  copy.append(titleRow);
  hero.append(copy);

  return hero;
}

function renderPostIts() {
  const layer = createElement("div", "sticky-layer");
  const shownItems = state.railItems.slice(-3);

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
  const section = renderCardShell("🚂", "오늘의 레일");
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
  header.append(createElement("span", "section-icon", icon), createElement("h2", null, title));
  section.append(header);
  return section;
}

function renderRailItem(item) {
  const listItem = createElement("li", "rail-item");

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
  const timerStatus = item.timerStatus || "idle";
  const startButton = createButton("pill-button rail-timer-button", getRailButtonLabel(item), getRailButtonAction(item), item.id);

  if (timerStatus === "running") {
    startButton.classList.add("is-started");
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
  const form = createElement("form", "rail-edit");
  form.dataset.action = "save-rail";
  form.dataset.id = item.id;

  form.append(
    renderInputRow("시간", "time", item.time, 8),
    renderInputRow("항목", "title", item.title, 28),
    renderInputRow("문구", "note", item.note, 32)
  );

  const actions = createElement("div", "rail-edit-actions");
  const saveButton = createElement("button", "pill-button", "저장");
  saveButton.type = "submit";

  actions.append(
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
  const section = renderCardShell("📝", "오늘 기록");
  section.id = "recordsSection";
  const list = createElement("ul", "record-list");

  state.records.forEach((record) => {
    const item = createElement("li", "record-item");
    item.append(
      createElement("span", "record-emoji", record.icon),
      createElement("span", "record-text", record.text),
      createElement("span", "stamp-badge", "참 잘했어요")
    );
    list.append(item);
  });

  section.append(list);
  return section;
}

function renderSummary() {
  const summary = createElement("section", "section-card summary-card");
  summary.setAttribute("aria-label", "오늘 요약");

  const summaryItems = [
    {
      icon: "📋",
      label: "기록",
      value: state.records.length
    },
    {
      icon: "🌱",
      label: "몸 돌봄",
      value: countRecordsByCategory("care")
    },
    {
      icon: "🏠",
      label: "집안일",
      value: countRecordsByCategory("chore")
    }
  ];

  summaryItems.forEach((item) => {
    const block = createElement("article", "summary-item");
    block.append(
      createElement("span", "summary-icon", item.icon),
      createElement("span", "summary-label", item.label),
      createElement("strong", "summary-value", String(item.value))
    );
    summary.append(block);
  });

  return summary;
}

function countRecordsByCategory(category) {
  return state.records.filter((record) => record.category === category).length;
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

  if (timerStatus === "running") {
    return formatRemainingTime(item.remainingSeconds ?? getRailDurationSeconds(item));
  }

  if (timerStatus === "done") {
    return "기록";
  }

  return "시작";
}

function getRailButtonAction(item) {
  const timerStatus = item.timerStatus || "idle";

  if (timerStatus === "running") {
    return "timer-running";
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
    { id: "records", icon: "▤", label: "기록", action: "go-records" },
    { id: "add", icon: "+", label: "", action: "open-add-panel" },
    { id: "stamps", icon: "♙", label: "스탬프", action: "show-stamps" },
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

    button.append(createElement("span", "tab-icon", tab.icon), createElement("span", null, tab.label));
    nav.append(button);
  });

  return nav;
}

function renderAddPanel() {
  const overlay = createElement("div", "add-panel-overlay");
  overlay.dataset.action = "close-add-panel";

  const panel = createElement("section", "add-panel");
  panel.setAttribute("aria-labelledby", "addPanelTitle");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");

  const handle = createElement("span", "panel-handle");
  const title = createElement("h2", null, "무엇을 남길까요?");
  title.id = "addPanelTitle";
  const subtitle = createElement("p", "panel-subtitle", "오늘의 작은 흐름을 가볍게 남겨보세요.");

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
    maxLength: 44
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
      maxLength: 8
    }),
    renderPanelField({
      label: "활동명",
      name: "title",
      placeholder: "예: 집안일 정리",
      maxLength: 28
    }),
    renderPanelField({
      label: "보조 문구",
      name: "note",
      placeholder: "예: 15분만",
      maxLength: 32
    }),
    renderPanelActions("추가")
  );

  return form;
}

function renderPanelField({ label, name, placeholder, maxLength }) {
  const wrap = createElement("label", "panel-field");
  wrap.append(createElement("span", null, label));

  const input = createElement("input");
  input.name = name;
  input.placeholder = placeholder;
  input.maxLength = maxLength;
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

function renderToast() {
  const toast = createElement("div", "toast", state.toastMessage);
  toast.setAttribute("role", "status");
  return toast;
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
    render();
  }, 1800);
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
  state.editingRailId = null;
}

function closeAddPanel() {
  state.addPanelOpen = false;
}

function getRecordIcon(text) {
  if (text.includes("물")) return "🥛";
  if (text.includes("세수") || text.includes("씻")) return "🫧";
  if (text.includes("설거지") || text.includes("집안")) return "🍽";
  if (text.includes("스트레칭") || text.includes("운동")) return "🌱";
  if (text.includes("프리미어") || text.includes("편집")) return "🎬";
  return "✦";
}

function getRecordCategory(text) {
  if (text.includes("물") || text.includes("세수") || text.includes("스트레칭") || text.includes("운동")) {
    return "care";
  }

  if (text.includes("설거지") || text.includes("집안") || text.includes("정리")) {
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

  state.records = [
    {
      id: `record-${Date.now()}`,
      icon: getRecordIcon(text),
      text,
      category: getRecordCategory(text),
      stamped: true
    },
    ...state.records
  ];
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
    {
      id: `rail-${Date.now()}`,
      time,
      title,
      note: note || "가볍게",
      started: false,
      timerStatus: "idle"
    }
  ];
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
    started: true,
    timerStatus: "running",
    durationSeconds,
    remainingSeconds: durationSeconds
  });
  render();

  const intervalId = setInterval(() => {
    tickRailTimer(id);
  }, 1000);

  railTimerIntervals.set(id, intervalId);
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
    render();
    return;
  }

  updateRailItem(id, {
    remainingSeconds: nextRemaining
  });
  render();
}

function recordRailResult(id) {
  const item = state.railItems.find((railItem) => railItem.id === id);

  if (!item) {
    return;
  }

  const durationSeconds = item.durationSeconds || getRailDurationSeconds(item);
  const recordText = `${item.title} ${formatDurationForRecord(durationSeconds)} 함`;

  state.records = [
    {
      id: `record-${Date.now()}`,
      icon: getRecordIcon(recordText),
      text: recordText,
      category: getRecordCategory(recordText),
      stamped: true
    },
    ...state.records
  ];
  updateRailItem(id, {
    started: false,
    timerStatus: "idle",
    durationSeconds: null,
    remainingSeconds: null
  });
  state.activeTab = "records";
  showToast("오늘 기록에 남겼어요.");
  render();
  scrollToSection("recordsSection");
}

app.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");

  if (!actionTarget) {
    return;
  }

  const { action, id } = actionTarget.dataset;

  if (action === "start-rail") {
    startRailTimer(id);
    return;
  }

  if (action === "timer-running") {
    return;
  }

  if (action === "record-rail") {
    recordRailResult(id);
    return;
  }

  if (action === "edit-rail") {
    state.editingRailId = state.editingRailId === id ? null : id;
    state.addPanelOpen = false;
    render();
    return;
  }

  if (action === "cancel-edit") {
    state.editingRailId = null;
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
    render();
    scrollToSection("recordsSection");
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

app.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action]");

  if (!form) {
    return;
  }

  event.preventDefault();

  if (form.dataset.action === "save-rail") {
    const formData = new FormData(form);
    const nextItem = {
      time: String(formData.get("time") || "").trim() || "시간",
      title: String(formData.get("title") || "").trim() || "새 항목",
      note: String(formData.get("note") || "").trim() || "가볍게"
    };

    updateRailItem(form.dataset.id, nextItem);
    state.editingRailId = null;
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
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.addPanelOpen) {
    closeAddPanel();
    render();
  }
});

render();
