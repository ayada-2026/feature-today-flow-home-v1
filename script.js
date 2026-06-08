const app = document.getElementById("app");
const liveRegion = document.getElementById("liveRegion");

const state = {
  activeTab: "home",
  editingRailId: null,
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
}

function renderHero() {
  const hero = createElement("section", "hero");
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
  const section = renderCardShell("🚂", "오늘의 레일");
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
  const startButton = createButton("pill-button", item.started ? "진행중" : "시작", "toggle-start", item.id);

  if (item.started) {
    startButton.classList.add("is-started");
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

function renderInputRow(labelText, name, value, maxLength) {
  const fragment = document.createDocumentFragment();
  const label = createElement("label", null, labelText);
  const input = createElement("input");
  input.name = name;
  input.value = value;
  input.maxLength = maxLength;

  fragment.append(label, input);
  return fragment;
}

function renderTodayRecords() {
  const section = renderCardShell("📝", "오늘 기록");
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

function renderTabBar() {
  const nav = createElement("nav", "tab-bar");
  nav.setAttribute("aria-label", "하단 탭");

  const tabs = [
    { id: "home", icon: "⌂", label: "홈" },
    { id: "records", icon: "▤", label: "기록" },
    { id: "add", icon: "+", label: "" },
    { id: "stamps", icon: "♙", label: "스탬프" },
    { id: "my-flow", icon: "♡", label: "나의 흐름" }
  ];

  tabs.forEach((tab) => {
    if (tab.id === "add") {
      const addButton = createButton("add-tab", tab.icon, "add-record");
      addButton.setAttribute("aria-label", "기록 추가");
      nav.append(addButton);
      return;
    }

    const button = createButton("tab-button", "", "change-tab", tab.id);

    if (state.activeTab === tab.id) {
      button.classList.add("is-active");
    }

    button.append(createElement("span", "tab-icon", tab.icon), createElement("span", null, tab.label));
    nav.append(button);
  });

  return nav;
}

function updateRailItem(id, nextValues) {
  state.railItems = state.railItems.map((item) => (
    item.id === id ? { ...item, ...nextValues } : item
  ));
}

function announce(message) {
  liveRegion.textContent = message;
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "toggle-start") {
    const item = state.railItems.find((railItem) => railItem.id === id);
    updateRailItem(id, { started: !item.started });
    announce(`${item.title} ${item.started ? "시작을 취소했어요." : "시작했어요."}`);
  }

  if (action === "edit-rail") {
    state.editingRailId = state.editingRailId === id ? null : id;
  }

  if (action === "cancel-edit") {
    state.editingRailId = null;
  }

  if (action === "change-tab") {
    state.activeTab = id;
    announce(`${button.textContent} 탭을 눌렀어요.`);
  }

  if (action === "add-record") {
    addQuickRecord();
  }

  render();
});

app.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action='save-rail']");

  if (!form) {
    return;
  }

  event.preventDefault();

  const formData = new FormData(form);
  const nextItem = {
    time: String(formData.get("time") || "").trim() || "시간",
    title: String(formData.get("title") || "").trim() || "새 항목",
    note: String(formData.get("note") || "").trim() || "가볍게"
  };

  updateRailItem(form.dataset.id, nextItem);
  state.editingRailId = null;
  announce("레일이 수정되어 포스트잇에도 반영됐어요.");
  render();
});

function addQuickRecord() {
  const nextRecord = {
    id: `record-${Date.now()}`,
    icon: "✦",
    text: "작은 일 하나 해냄",
    category: "record",
    stamped: true
  };

  state.records = [nextRecord, ...state.records];
  state.activeTab = "records";
  announce("오늘 기록을 하나 추가했어요.");
}

render();
