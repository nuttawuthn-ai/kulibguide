(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const state = { group: null, duration: null, start: "" };

  /* ---------- init state from URL or last use ---------- */
  const params = new URLSearchParams(location.search);
  const pg = params.get("g"), pt = Number(params.get("t"));
  state.group = GROUPS[pg] ? pg : (GROUPS[store.get("g")] ? store.get("g") : null);
  state.duration = DURATIONS.includes(pt) ? pt : (DURATIONS.includes(Number(store.get("t"))) ? Number(store.get("t")) : null);

  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);
  state.start = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  $("#startTime").value = state.start;

  /* ---------- helpers ---------- */
  const addMin = (hhmm, m) => {
    if (!hhmm) return "";
    const [h, mi] = hhmm.split(":").map(Number);
    const t = (h * 60 + mi + m) % 1440;
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  };
  const getRoute = () => {
    if (!state.group || !state.duration) return null;
    let acc = 0;
    return ROUTES[state.group][state.duration].map(([id, min], i) => {
      const s = STOPS[id];
      const item = { id, min, i, from: acc, ...s };
      acc += min;
      return item;
    });
  };
  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2000);
  };

  /* ---------- selectors ---------- */
  function renderGroups() {
    $("#groupGrid").innerHTML = Object.entries(GROUPS).map(([id, g]) => `
      <button type="button" class="group-card tone-${g.tone}" role="radio" aria-checked="${state.group === id}" data-g="${id}">
        <span class="group-icon" aria-hidden="true">${g.icon}</span>
        <span>
          <span class="group-name">${esc(g.name)}</span><br />
          <span class="group-en">${esc(g.en)}</span>
          <span class="group-desc">${esc(g.desc)}</span>
        </span>
      </button>`).join("");
  }
  function renderDurations() {
    $("#durGrid").innerHTML = DURATIONS.map((d) => `
      <button type="button" class="dur-btn" role="radio" aria-checked="${state.duration === d}" data-t="${d}">
        <span class="num">${d}</span><span class="unit">นาที</span>
      </button>`).join("");
  }

  $("#groupGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-g]");
    if (!b) return;
    state.group = b.dataset.g;
    store.set("g", state.group);
    renderGroups(); renderResult(true);
  });
  $("#durGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    state.duration = Number(b.dataset.t);
    store.set("t", state.duration);
    renderDurations(); renderResult(true);
  });
  $("#startTime").addEventListener("change", (e) => { state.start = e.target.value; renderResult(); });

  /* ---------- result ---------- */
  function renderResult(scroll) {
    const el = $("#result");
    const route = getRoute();
    if (!route) {
      const need = !state.group ? "กลุ่มผู้เยี่ยมชม" : "เวลานำชม";
      el.innerHTML = `<div class="empty"><div class="em">🧭</div>เลือก${need} เพื่อดูบทนำชมและเส้นทางที่แนะนำ</div>`;
      return;
    }
    const g = GROUPS[state.group];
    const floors = [...new Set(route.map((r) => r.floor).filter((f) => f.startsWith("ชั้น")))];
    const end = addMin(state.start, state.duration);

    el.innerHTML = `
      <div class="summary fade-in">
        <div class="summary-top">
          <div class="summary-icon" aria-hidden="true">${g.icon}</div>
          <div>
            <h2>บทนำชม: ${esc(g.name)} · ${state.duration} นาที</h2>
            <div class="sub">${esc(g.en)} — ${esc(g.desc)}</div>
          </div>
        </div>
        <div class="stats">
          <span class="stat">📍 ${route.length} จุด</span>
          <span class="stat">🏢 ${floors.join(", ")}</span>
          ${state.start ? `<span class="stat">🕒 ${state.start} – ${end} น.</span>` : ""}
        </div>
        <div class="actions">
          <button class="btn white" id="startTour">▶ เริ่มโหมดนำชม</button>
          <button class="btn glass" id="printBtn">🖨 พิมพ์ / บันทึก PDF</button>
          <button class="btn glass" id="shareBtn">🔗 คัดลอกลิงก์</button>
        </div>
      </div>

      <div class="layout">
        <ol class="timeline">
          ${route.map((r) => `
            <li class="stop fade-in" style="animation-delay:${r.i * 40}ms">
              <div class="stop-dot" aria-hidden="true">${r.icon}</div>
              <div class="stop-card">
                <div class="stop-head">
                  <div>
                    <div class="stop-time">${state.start ? `${addMin(state.start, r.from)} – ${addMin(state.start, r.from + r.min)} น. · ` : ""}จุดที่ ${r.i + 1}</div>
                    <h3 class="stop-name">${esc(r.name)}</h3>
                    <div class="stop-meta">${esc(r.floor)} · ${esc(r.en)}</div>
                  </div>
                  <span class="badge">${r.min} นาที</span>
                </div>
                <div class="script"><span class="script-label">บทนำชม</span>${esc(r.script[state.group])}</div>
                <ul class="points">${r.points[state.group].map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
              </div>
            </li>`).join("")}
        </ol>
        <aside class="side">
          <div class="card tone-${g.tone}">
            <h3>ประเด็นที่ควรเน้น</h3>
            <div class="chips">${g.focus.map((f) => `<span class="chip">${esc(f)}</span>`).join("")}</div>
          </div>
          <div class="card">
            <h3>💡 เคล็ดลับผู้นำชม</h3>
            <ul class="tips">${g.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          </div>
        </aside>
      </div>`;

    $("#startTour").onclick = () => Tour.open(route);
    $("#printBtn").onclick = () => window.print();
    $("#shareBtn").onclick = async () => {
      const url = `${location.origin}${location.pathname}?g=${state.group}&t=${state.duration}`;
      try { await navigator.clipboard.writeText(url); toast("คัดลอกลิงก์แล้ว"); }
      catch { prompt("คัดลอกลิงก์นี้", url); }
    };
    history.replaceState(null, "", `?g=${state.group}&t=${state.duration}`);
    if (scroll && state.group && state.duration) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Tour mode ---------- */
  const Tour = {
    route: [], idx: 0, stopSec: 0, totalSec: 0, paused: false, timer: null, wake: null,
    open(route) {
      Object.assign(this, { route, idx: 0, stopSec: 0, totalSec: 0, paused: false });
      $("#tour").hidden = false;
      document.body.style.overflow = "hidden";
      this.render();
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), 1000);
      this.keepAwake();
    },
    close() {
      clearInterval(this.timer);
      $("#tour").hidden = true;
      document.body.style.overflow = "";
      try { this.wake && this.wake.release(); } catch { /* ignore */ }
      this.wake = null;
    },
    async keepAwake() {
      try { if ("wakeLock" in navigator) this.wake = await navigator.wakeLock.request("screen"); } catch { /* ignore */ }
    },
    go(d) {
      const n = this.idx + d;
      if (n < 0) return;
      if (n >= this.route.length) { this.close(); toast("จบการนำชม ขอบคุณค่ะ/ครับ 💚"); return; }
      this.idx = n; this.stopSec = 0; this.render();
    },
    tick() {
      if (this.paused) return;
      this.stopSec++; this.totalSec++;
      this.updateTimer();
    },
    fmt(s) {
      const a = Math.abs(s);
      return `${s < 0 ? "+" : ""}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
    },
    updateTimer() {
      const r = this.route[this.idx];
      const total = r.min * 60;
      const left = total - this.stopSec;
      const over = left < 0;
      const C = 2 * Math.PI * 28;
      const ring = $("#ring");
      if (!ring) return;
      ring.classList.toggle("over", over);
      ring.querySelector(".val").style.strokeDashoffset = over ? 0 : C * (1 - left / total);
      const tt = $("#timerText");
      tt.textContent = this.fmt(left);
      tt.classList.toggle("over", over);
      $("#timerSub").textContent = over ? "เกินเวลาที่วางแผนไว้" : `เหลือเวลาที่จุดนี้ (จาก ${r.min} นาที)`;
      const planned = state.duration * 60;
      $("#tourClock").textContent = `${this.fmt(this.totalSec).replace("+", "")} / ${state.duration}:00`;
      $("#tourClock").style.color = this.totalSec > planned ? "#c66a3b" : "";
    },
    render() {
      const r = this.route[this.idx];
      const next = this.route[this.idx + 1];
      const g = state.group;
      const C = 2 * Math.PI * 28;
      $("#tourMeta").textContent = `จุดที่ ${this.idx + 1} / ${this.route.length} · ${GROUPS[g].name}`;
      $("#tourBar").style.width = `${((this.idx + 1) / this.route.length) * 100}%`;
      $("#tourBody").innerHTML = `
        <div class="fade-in">
          <div class="tour-stop-head">
            <div class="tour-icon" aria-hidden="true">${r.icon}</div>
            <div>
              <div class="stop-meta">${esc(r.floor)} · ${esc(r.en)}</div>
              <h2 id="tourTitle">${esc(r.name)}</h2>
            </div>
          </div>
          <div class="tour-timer">
            <svg class="ring" id="ring" viewBox="0 0 64 64" aria-hidden="true">
              <circle class="track" cx="32" cy="32" r="28" />
              <circle class="val" cx="32" cy="32" r="28" stroke-dasharray="${C}" stroke-dashoffset="0" />
            </svg>
            <div><div class="timer-text" id="timerText"></div><div class="timer-sub" id="timerSub"></div></div>
          </div>
          <div class="tour-script">${esc(r.script[g])}</div>
          <ul class="points">${r.points[g].map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
          ${next ? `<div class="tour-next">ถัดไป → ${next.icon} ${esc(next.name)} (${esc(next.floor)})</div>` : `<div class="tour-next">จุดสุดท้ายของการนำชม</div>`}
        </div>`;
      $("#tourPrev").disabled = this.idx === 0;
      $("#tourNext").textContent = next ? "ถัดไป ›" : "✓ จบการนำชม";
      $("#tourPause").textContent = this.paused ? "▶ ต่อ" : "⏸ พัก";
      this.updateTimer();
      $("#tourBody").scrollTop = 0;
    },
  };

  $("#tourClose").onclick = () => Tour.close();
  $("#tourPrev").onclick = () => Tour.go(-1);
  $("#tourNext").onclick = () => Tour.go(1);
  $("#tourPause").onclick = () => { Tour.paused = !Tour.paused; $("#tourPause").textContent = Tour.paused ? "▶ ต่อ" : "⏸ พัก"; };
  document.addEventListener("keydown", (e) => {
    if ($("#tour").hidden) return;
    if (e.key === "ArrowRight") Tour.go(1);
    else if (e.key === "ArrowLeft") Tour.go(-1);
    else if (e.key === "Escape") Tour.close();
  });
  document.addEventListener("visibilitychange", () => {
    if (!$("#tour").hidden && document.visibilityState === "visible") Tour.keepAwake();
  });

  renderGroups();
  renderDurations();
  renderResult();
})();
