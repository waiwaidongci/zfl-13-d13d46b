import "./styles.css";

const STORAGE_KEY = "zfl-13-reading-club";
const today = new Date().toISOString().slice(0, 10);

let state = loadState();
const app = document.querySelector("#app");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return {
    selectedEventId: "",
    search: "",
    events: [
      {
        id: crypto.randomUUID(),
        book: "被讨厌的勇气",
        date: today,
        location: "城市书房二楼",
        capacity: 12,
        topic: "讨论自我接纳、关系边界和行动改变",
        signups: [
          { id: crypto.randomUUID(), name: "林西", contact: "linxi@example.com" },
          { id: crypto.randomUUID(), name: "周白", contact: "13800000000" }
        ]
      }
    ]
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  ensureSelectedEvent();
  const events = filteredEvents();
  const selectedEvent = state.events.find((event) => event.id === state.selectedEventId);
  const signupCount = state.events.reduce((total, event) => total + event.signups.length, 0);
  const remainingSeats = state.events.reduce((total, event) => total + Math.max(0, event.capacity - event.signups.length), 0);

  app.innerHTML = `
    <main class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">本地读书会工作台</p>
          <h1>读书会活动管理</h1>
          <p class="hero-copy">创建活动、收集报名、查看名单和剩余名额，适合小型读书会先跑通第一版流程。</p>
        </div>
        <section class="stats" aria-label="读书会统计">
          <div class="stat"><span>活动数</span><strong>${state.events.length}</strong></div>
          <div class="stat"><span>报名人数</span><strong>${signupCount}</strong></div>
          <div class="stat"><span>剩余名额</span><strong>${remainingSeats}</strong></div>
        </section>
      </header>

      <section class="layout">
        <aside class="panel">
          <h2>管理员创建活动</h2>
          <form class="form" id="event-form">
            <label>书名<input name="book" required placeholder="例如小王子"></label>
            <label>活动日期<input name="date" type="date" value="${today}" required></label>
            <label>地点<input name="location" required placeholder="例如社区书店"></label>
            <label>人数上限<input name="capacity" type="number" min="1" step="1" value="10" required></label>
            <label>讨论主题<textarea name="topic" required placeholder="这次主要聊什么"></textarea></label>
            <button class="primary" type="submit">创建活动</button>
          </form>
        </aside>

        <section class="content">
          <div class="toolbar">
            <label>搜索活动<input id="search" value="${escapeHtml(state.search)}" placeholder="按书名、地点或主题搜索"></label>
            <label>报名活动<select id="event-select">${state.events.map(renderEventOption).join("")}</select></label>
          </div>

          ${selectedEvent ? renderSignupPanel(selectedEvent) : ""}

          <div class="events">
            ${events.length ? events.map(renderEventCard).join("") : `<div class="empty">还没有匹配的读书会活动</div>`}
          </div>
        </section>
      </section>
    </main>
  `;

  bindEvents();
}

function renderEventOption(event) {
  return `<option value="${event.id}" ${event.id === state.selectedEventId ? "selected" : ""}>${escapeHtml(event.book)} · ${event.date}</option>`;
}

function renderSignupPanel(event) {
  const full = event.signups.length >= event.capacity;
  return `
    <section class="signup-panel">
      <div>
        <h2>参与者报名</h2>
        <p>${escapeHtml(event.book)} · 剩余${Math.max(0, event.capacity - event.signups.length)}个名额</p>
      </div>
      <form class="form" id="signup-form">
        <label>姓名<input name="name" required placeholder="参与者姓名" ${full ? "disabled" : ""}></label>
        <label>联系方式<input name="contact" required placeholder="手机号或邮箱" ${full ? "disabled" : ""}></label>
        <button class="primary" type="submit" ${full ? "disabled" : ""}>${full ? "名额已满" : "提交报名"}</button>
      </form>
    </section>
  `;
}

function renderEventCard(event) {
  const remaining = Math.max(0, event.capacity - event.signups.length);
  const full = remaining === 0;
  return `
    <article class="event-card">
      <div class="event-top">
        <div>
          <h3>${escapeHtml(event.book)}</h3>
          <p>${escapeHtml(event.topic)}</p>
        </div>
        <span class="seat-badge ${full ? "full" : ""}">${full ? "名额已满" : `剩余${remaining}人`}</span>
      </div>
      <div class="chips">
        <span class="chip">${event.date}</span>
        <span class="chip">${escapeHtml(event.location)}</span>
        <span class="chip">${event.signups.length}/${event.capacity}人</span>
      </div>
      <section class="admin-list">
        <strong>后台报名名单</strong>
        ${event.signups.length ? event.signups.map((signup) => renderSignupRow(event.id, signup)).join("") : `<p>暂无报名</p>`}
      </section>
      <div class="actions">
        <button class="secondary" data-select="${event.id}">选中报名</button>
        <button class="secondary" data-delete-event="${event.id}">删除活动</button>
      </div>
    </article>
  `;
}

function renderSignupRow(eventId, signup) {
  return `
    <div class="signup-row">
      <div><strong>${escapeHtml(signup.name)}</strong><span> · ${escapeHtml(signup.contact)}</span></div>
      <button class="secondary" data-event-id="${eventId}" data-delete-signup="${signup.id}">取消报名</button>
    </div>
  `;
}

function bindEvents() {
  document.querySelector("#event-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const newEvent = {
      id: crypto.randomUUID(),
      book: data.book.trim(),
      date: data.date,
      location: data.location.trim(),
      capacity: Number(data.capacity || 1),
      topic: data.topic.trim(),
      signups: []
    };
    state.events.unshift(newEvent);
    state.selectedEventId = newEvent.id;
    saveState();
    render();
  });

  document.querySelector("#event-select")?.addEventListener("change", (event) => {
    state.selectedEventId = event.target.value;
    saveState();
    render();
  });

  document.querySelector("#search").addEventListener("input", (event) => {
    state.search = event.target.value;
    saveState();
    render();
  });

  document.querySelector("#signup-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedEvent = state.events.find((item) => item.id === state.selectedEventId);
    if (!selectedEvent || selectedEvent.signups.length >= selectedEvent.capacity) return;
    const data = Object.fromEntries(new FormData(event.target));
    selectedEvent.signups.push({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      contact: data.contact.trim()
    });
    saveState();
    render();
  });

  document.querySelectorAll("[data-select]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedEventId = button.dataset.select;
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-delete-event]").forEach((button) => {
    button.addEventListener("click", () => {
      state.events = state.events.filter((event) => event.id !== button.dataset.deleteEvent);
      ensureSelectedEvent();
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-delete-signup]").forEach((button) => {
    button.addEventListener("click", () => {
      const event = state.events.find((item) => item.id === button.dataset.eventId);
      if (!event) return;
      event.signups = event.signups.filter((signup) => signup.id !== button.dataset.deleteSignup);
      saveState();
      render();
    });
  });
}

function filteredEvents() {
  const keyword = state.search.trim().toLowerCase();
  return state.events.filter((event) => {
    const text = `${event.book} ${event.location} ${event.topic}`.toLowerCase();
    return !keyword || text.includes(keyword);
  });
}

function ensureSelectedEvent() {
  if (state.events.length === 0) {
    state.selectedEventId = "";
    return;
  }
  if (!state.events.some((event) => event.id === state.selectedEventId)) {
    state.selectedEventId = state.events[0].id;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

render();
