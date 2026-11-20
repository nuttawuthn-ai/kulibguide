(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const paras = (s) => String(s).split(/\n\n+/).map((p) => `<p>${esc(p).replace(/\n/g, "<br />")}</p>`).join("");

  const state = { group: null, duration: null, start: "", lang: "th" };

  /* ---------- init state from URL or last use ---------- */
  const params = new URLSearchParams(location.search);
  const preview = params.has("draft");
  const pick = (v, ok) => (ok(v) ? v : null);
  function initState() {
    state.group = pick(params.get("g"), (v) => GROUPS[v]) || pick(store.get("g"), (v) => GROUPS[v]);
    state.duration = pick(Number(params.get("t")), (v) => DURATIONS.includes(v)) || pick(Number(store.get("t")), (v) => DURATIONS.includes(v));
    state.lang = pick(params.get("l"), (v) => v === "th" || v === "en") || pick(store.get("l"), (v) => v === "th" || v === "en") || "th";
  }
  /* หลังได้ข้อมูลชุดใหม่: ล้างค่าที่เลือกไว้ถ้ากลุ่ม/เวลานั้นไม่มีแล้ว */
  function keepValidState() {
    if (state.group && !GROUPS[state.group]) state.group = null;
    if (state.duration && !DURATIONS.includes(state.duration)) state.duration = null;
  }

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
  const locLabel = (s) => `${BUILDINGS[s.building].th} · ชั้น ${s.floor}`;

  /* คำแนะนำการเดินระหว่างจุด คำนวณจากอาคาร/ชั้น */
  const vert = (from, to) => (to > from ? `ขึ้นลิฟต์ไปชั้น ${to}` : from - to === 1 ? `ลงบันไดไปชั้น ${to}` : `ลงลิฟต์ไปชั้น ${to}`);
  function moveText(a, b) {
    const steps = [];
    if (a.building === b.building) {
      if (a.floor !== b.floor) steps.push(vert(a.floor, b.floor));
    } else {
      const linkF = a.floor === 1 && b.floor === 1 ? 1 : 2;
      if (a.building !== "bridge" && a.floor !== linkF) steps.push(vert(a.floor, linkF));
      if (b.building === "bridge") steps.push(`เดินไปทางเชื่อมอาคาร ชั้น ${linkF}`);
      else if (a.building === "bridge") steps.push(`เข้า${BUILDINGS[b.building].th}`);
      else steps.push(`เดินทางเชื่อมชั้น ${linkF} ไป${BUILDINGS[b.building].th}`);
      if (b.building !== "bridge" && b.floor !== linkF) steps.push(vert(linkF, b.floor));
    }
    return steps.join(" → ") || "เดินต่อในบริเวณเดียวกัน";
  }

  const getRoute = () => {
    if (!state.group || !state.duration) return null;
    let acc = 0, prev = null;
    return ROUTES[state.group][state.duration].map(([id, min], i) => {
      const s = STOPS[id];
      const item = { id, min, i, from: acc, move: prev ? moveText(prev, s) : "", ...s };
      acc += min; prev = s;
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
  const shareUrl = () => `?g=${state.group}&t=${state.duration}&l=${state.lang}`;

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
        <span class="num">${d}</span><span class="unit">นาที${d === FULL_DURATION ? " · ฉบับเต็ม" : ""}</span>
      </button>`).join("");
  }
  function renderLang() {
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.lang === state.lang)));
  }
  function setLang(l) {
    state.lang = l;
    store.set("l", l);
    renderLang(); renderResult();
    if (!$("#tour").hidden) Tour.render(true);
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
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]");
    if (b) setLang(b.dataset.lang);
  });
  $("#startTime").addEventListener("change", (e) => { state.start = e.target.value; renderResult(); });

  /* ---------- result ---------- */
  /* จอกว้าง (แท็บเล็ตแนวนอน/คอมพิวเตอร์) แสดงบทพูดเต็ม จอแคบพับไว้ให้เห็นภาพรวมเส้นทางก่อน */
  const isWide = () => matchMedia("(min-width: 820px)").matches;

  function stopBody(r, g, inTour) {
    const label = `บทนำชม · ${state.lang === "th" ? "ภาษาไทย" : "English"}`;
    const text = String(r.script[state.lang]).replaceAll("{min}", state.duration);
    const script = inTour
      ? `<div class="script" lang="${state.lang}"><span class="script-label">${label}</span>${paras(text)}</div>`
      : `<details class="script-box"${isWide() ? " open" : ""}>
           <summary>📖 ${label}</summary>
           <div class="script" lang="${state.lang}">${paras(text)}</div>
         </details>`;
    const openNotes = inTour;
    return `
      <div class="emphasis"><span>🎯 เน้นสำหรับ${esc(GROUPS[g].name)}</span>${esc(r.emphasis[g])}</div>
      ${script}
      ${r.facts && r.facts.length ? `<div class="facts">${r.facts.map((f) => `<span class="fact">${esc(f)}</span>`).join("")}</div>` : ""}
      ${r.link && /^https?:\/\//i.test(r.link.url) ? `<a class="ext-link" href="${esc(r.link.url)}" target="_blank" rel="noopener">🔗 ${esc(r.link.label)}</a>` : ""}
      ${r.notes && r.notes.length ? `
        <details class="notes"${openNotes ? " open" : ""}>
          <summary>📝 หมายเหตุผู้นำชม (${r.notes.length})</summary>
          <ul class="points">${r.notes.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </details>` : ""}`;
  }

  function renderResult(scroll) {
    const el = $("#result");
    const route = getRoute();
    if (!route) {
      const need = !state.group ? "กลุ่มผู้เยี่ยมชม" : "เวลานำชม";
      el.innerHTML = `<div class="empty"><div class="em">🧭</div>เลือก${need} เพื่อดูบทนำชมและเส้นทางที่แนะนำ</div>`;
      return;
    }
    const g = GROUPS[state.group];
    const blds = [...new Set(route.map((r) => r.building).filter((b) => b !== "bridge"))].map((b) => BUILDINGS[b].th);
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
          <span class="stat">🏢 ${blds.join(" + ")}</span>
          ${state.start ? `<span class="stat">🕒 ${state.start} – ${end} น.</span>` : ""}
          <span class="stat">🗣 ${state.lang === "th" ? "ภาษาไทย" : "English"}</span>
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
            ${r.move ? `<li class="move" aria-label="การเดินทาง">🚶 ${esc(r.move)}</li>` : ""}
            <li class="stop fade-in" style="animation-delay:${r.i * 30}ms">
              <div class="stop-dot" aria-hidden="true">${r.icon}</div>
              <div class="stop-card">
                <div class="stop-head">
                  <div>
                    <div class="stop-time">${state.start ? `${addMin(state.start, r.from)} – ${addMin(state.start, r.from + r.min)} น. · ` : ""}จุดที่ ${r.i + 1}</div>
                    <h3 class="stop-name"><span class="stop-ico" aria-hidden="true">${r.icon}</span>${esc(r.name)}</h3>
                    <div class="stop-meta"><span class="bld tone-${BUILDINGS[r.building].tone}">${esc(locLabel(r))}</span> ${esc(r.en)}</div>
                  </div>
                  <span class="badge">${r.min} นาที</span>
                </div>
                ${stopBody(r, state.group, false)}
              </div>
            </li>`).join("")}
        </ol>
        <aside class="side">
          <div class="card tone-${g.tone}">
            <h3>ประเด็นที่ควรเน้น</h3>
            <div class="chips">${g.focus.map((f) => `<span class="chip">${esc(f)}</span>`).join("")}</div>
          </div>
          <details class="card side-card"${isWide() ? " open" : ""}>
            <summary><h3>✅ เตรียมก่อนนำชม</h3></summary>
            <ul class="checklist">${PREP.map((p) => `<li><label><input type="checkbox" /> <span>${esc(p)}</span></label></li>`).join("")}</ul>
          </details>
          <details class="card side-card"${isWide() ? " open" : ""}>
            <summary><h3>💡 เคล็ดลับผู้นำชม</h3></summary>
            <ul class="tips">${g.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          </details>
        </aside>
      </div>
      <div class="mobile-bar">
        <button class="btn primary" id="startTour2">▶ เริ่มโหมดนำชม · ${state.duration} นาที</button>
      </div>`;

    $("#startTour").onclick = $("#startTour2").onclick = () => Tour.open(route);
    document.body.classList.add("has-bar");
    $("#printBtn").onclick = () => window.print();
    $("#shareBtn").onclick = async () => {
      const url = `${location.origin}${location.pathname}${shareUrl()}`;
      try { await navigator.clipboard.writeText(url); toast("คัดลอกลิงก์แล้ว"); }
      catch { prompt("คัดลอกลิงก์นี้", url); }
    };
    history.replaceState(null, "", shareUrl() + (preview ? "&draft=1" : ""));
    if (scroll) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* เปิดหมายเหตุทั้งหมดเมื่อพิมพ์ */
  window.addEventListener("beforeprint", () => document.querySelectorAll("#result details").forEach((d) => { d.dataset.wasOpen = d.open; d.open = true; }));
  window.addEventListener("afterprint", () => document.querySelectorAll("#result details").forEach((d) => { d.open = d.dataset.wasOpen === "true"; }));

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
      if (pending) { const c = pending; pending = null; useContent(c, true); }
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
      $("#tourClock").textContent = `${this.fmt(this.totalSec)} / ${state.duration}:00`;
      $("#tourClock").style.color = this.totalSec > planned ? "#c66a3b" : "";
    },
    render(keepScroll) {
      const r = this.route[this.idx];
      const next = this.route[this.idx + 1];
      const g = state.group;
      const C = 2 * Math.PI * 28;
      const body = $("#tourBody");
      const y = body.scrollTop;
      $("#tourMeta").textContent = `จุดที่ ${this.idx + 1} / ${this.route.length} · ${GROUPS[g].name}`;
      $("#tourBar").style.width = `${((this.idx + 1) / this.route.length) * 100}%`;
      body.innerHTML = `
        <div class="${keepScroll ? "" : "fade-in"}">
          ${r.move ? `<div class="move tour-move">🚶 ${esc(r.move)}</div>` : ""}
          <div class="tour-stop-head">
            <div class="tour-icon" aria-hidden="true">${r.icon}</div>
            <div>
              <div class="stop-meta"><span class="bld tone-${BUILDINGS[r.building].tone}">${esc(locLabel(r))}</span> ${esc(r.en)}</div>
              <h2 id="tourTitle">${esc(r.name)}</h2>
            </div>
          </div>
          <div class="tour-timer">
            <svg class="ring" id="ring" viewBox="0 0 64 64" aria-hidden="true">
              <circle class="track" cx="32" cy="32" r="28" />
              <circle class="val" cx="32" cy="32" r="28" stroke-dasharray="${C}" stroke-dashoffset="0" />
            </svg>
            <div><div class="timer-text" id="timerText"></div><div class="timer-sub" id="timerSub"></div></div>
            <div class="lang-switch small" role="radiogroup" aria-label="ภาษาบทพูด">
              <button type="button" role="radio" data-lang="th" aria-checked="${state.lang === "th"}">ไทย</button>
              <button type="button" role="radio" data-lang="en" aria-checked="${state.lang === "en"}">EN</button>
            </div>
          </div>
          <div class="tour-content">${stopBody(r, g, true)}</div>
          ${next ? `<div class="tour-next">ถัดไป → ${next.icon} ${esc(next.name)} (${esc(locLabel(next))})</div>` : `<div class="tour-next">จุดสุดท้ายของการนำชม</div>`}
        </div>`;
      $("#tourPrev").disabled = this.idx === 0;
      $("#tourNext").textContent = next ? "ถัดไป ›" : "✓ จบการนำชม";
      $("#tourPause").textContent = this.paused ? "▶ ต่อ" : "⏸ พัก";
      this.updateTimer();
      body.scrollTop = keepScroll ? y : 0;
    },
  };

  /* ขนาดตัวอักษรในโหมดนำชม (จำค่าไว้ในเครื่อง) */
  const FONT_SIZES = ["m", "l", "xl"];
  const applyFont = (f) => { $("#tour").dataset.font = f; store.set("font", f); };
  applyFont(FONT_SIZES.includes(store.get("font")) ? store.get("font") : "m");
  $("#tourFont").onclick = () => {
    const cur = FONT_SIZES.indexOf($("#tour").dataset.font);
    applyFont(FONT_SIZES[(cur + 1) % FONT_SIZES.length]);
    toast(`ขนาดตัวอักษร: ${["ปกติ", "ใหญ่", "ใหญ่มาก"][(cur + 1) % FONT_SIZES.length]}`);
  };

  /* ปัดซ้าย/ขวาเพื่อเปลี่ยนจุด (มือถือ/แท็บเล็ต) */
  let sx = 0, sy = 0, st = 0;
  $("#tourBody").addEventListener("touchstart", (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
  $("#tourBody").addEventListener("touchend", (e) => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Date.now() - st < 600 && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) Tour.go(dx < 0 ? 1 : -1);
  }, { passive: true });

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

  /* ---------- โหลดข้อมูลบทนำชม ----------
   * 1) ใช้สำเนาที่เก็บไว้ในเครื่อง (เปิดได้ทันที/ออฟไลน์)
   * 2) ดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์ ถ้ามีการแก้ไขจะอัปเดตหน้าให้เอง
   * 3) ถ้าไม่มีทั้งสองอย่าง ใช้ข้อมูลชุดตั้งต้นใน data.js */
  let started = false, pending = null, currentKey = "";
  function renderAll() { renderGroups(); renderDurations(); renderLang(); renderResult(); }
  function useContent(c, isUpdate) {
    Content.apply(c);
    currentKey = Content.key(c);
    if (!started) { started = true; initState(); renderAll(); return; }
    keepValidState(); renderAll();
    if (isUpdate) toast("อัปเดตบทนำชมเป็นฉบับล่าสุดแล้ว");
  }
  async function boot() {
    if (preview) {
      const draft = Content.draftGet();
      const bar = document.createElement("div");
      bar.className = "preview-bar";
      bar.textContent = draft ? "👁 ตัวอย่างข้อมูลที่ยังไม่ได้บันทึก (จากหน้าแอดมิน)" : "ไม่พบข้อมูลตัวอย่าง แสดงข้อมูลปัจจุบันแทน";
      document.body.prepend(bar);
      if (draft) { useContent(draft); return; }
    }
    const cached = Content.cacheGet();
    if (cached) useContent(cached);
    const remote = await Content.fetchRemote(cached ? 15000 : 5000);
    if (remote) {
      Content.cacheSet(remote);
      if (Content.key(remote) !== currentKey) {
        if (started && !$("#tour").hidden) { pending = remote; toast("มีบทนำชมฉบับใหม่ จะใช้หลังจบการนำชม"); }
        else useContent(remote, started);
      }
    }
    if (!started) useContent(DEFAULT_CONTENT);
  }
  boot();

  /* ใช้งานออฟไลน์ได้ (เฉพาะเมื่อเปิดผ่าน https หรือ localhost) */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  /* หมุนจอ/เปลี่ยนขนาด ข้ามจุด 820px → จัดหน้าใหม่ให้เหมาะกับจอ */
  let wasWide = isWide();
  window.addEventListener("resize", () => {
    if (isWide() !== wasWide) { wasWide = isWide(); renderResult(); }
  });
})();
