(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  /* บทพูด: แยกย่อหน้า + ตัวหนา/สี/ไฮไลต์ (content.js → Rich) */
  const paras = (s) => Rich.paras(s);

  /* venue = รหัสสถานที่ หรือการนำชมต่อเนื่อง "library>history" · dur = เวลาที่เลือกของแต่ละสถานที่ */
  const state = { venue: null, group: null, dur: {}, start: "", lang: "th" };

  /* ---------- init state from URL or last use ---------- */
  const params = new URLSearchParams(location.search);
  const preview = params.has("draft");
  const pick = (v, ok) => (ok(v) ? v : null);
  const parts = (v) => (v ? String(v).split(">") : []);
  /* สถานที่ที่ให้เลือก: เฉพาะที่เปิดแสดง (ตอนดูตัวอย่างจากหน้าแอดมิน แสดงทุกแห่ง) + การนำชมต่อเนื่องทุกลำดับ */
  const visibleVenues = () => Object.keys(VENUES).filter((id) => preview || VENUES[id].published);
  function venueOptions() {
    const ids = visibleVenues();
    const opts = ids.map((id) => ({ key: id, parts: [id] }));
    if (ids.length > 1) ids.forEach((a) => ids.forEach((b) => { if (a !== b) opts.push({ key: `${a}>${b}`, parts: [a, b] }); }));
    return opts;
  }
  const validVenue = (k) => venueOptions().some((o) => o.key === k);
  const validDur = (vid, d) => !!VENUES[vid] && VENUES[vid].durations.includes(d);
  const ready = () => !!(state.venue && state.group && parts(state.venue).every((p) => state.dur[p]));
  const readJson = (k) => { try { return JSON.parse(store.get(k) || "null"); } catch { return null; } };

  function initState() {
    const opts = venueOptions();
    state.venue = pick(params.get("p"), validVenue) || pick(store.get("p"), validVenue) || (opts.length === 1 ? opts[0].key : null);
    if (!state.venue && params.get("t") && validVenue("library")) state.venue = "library"; /* ลิงก์รุ่นเก่า ?g=&t= */
    state.group = pick(params.get("g"), (v) => GROUPS[v]) || pick(store.get("g"), (v) => GROUPS[v]);
    const saved = readJson("dur") || {};
    if (!saved.library && store.get("t")) saved.library = Number(store.get("t"));
    state.dur = {};
    Object.keys(VENUES).forEach((id) => { if (validDur(id, Number(saved[id]))) state.dur[id] = Number(saved[id]); });
    if (state.venue && params.get("t")) {
      const ts = params.get("t").split(",").map(Number);
      parts(state.venue).forEach((p, i) => { if (validDur(p, ts[i])) state.dur[p] = ts[i]; });
    }
    state.lang = pick(params.get("l"), (v) => v === "th" || v === "en") || pick(store.get("l"), (v) => v === "th" || v === "en") || "th";
    loadCustom();
    if (ready() && params.get("o")) { custom = parseCustom(params.get("o")); saveCustom(); }
  }
  /* หลังได้ข้อมูลชุดใหม่: ล้างค่าที่เลือกไว้ถ้าสถานที่/กลุ่ม/เวลานั้นไม่มีแล้ว */
  function keepValidState() {
    const opts = venueOptions();
    if (state.venue && !validVenue(state.venue)) state.venue = null;
    if (!state.venue && opts.length === 1) state.venue = opts[0].key;
    if (state.group && !GROUPS[state.group]) state.group = null;
    Object.keys(state.dur).forEach((id) => { if (!validDur(id, state.dur[id])) delete state.dur[id]; });
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
  const locLabel = (s) => (s.travel ? `ไป${BUILDINGS[s.building].th}` : `${BUILDINGS[s.building].th} · ชั้น ${s.floor}`);

  /* คำแนะนำการเดินระหว่างจุด คำนวณจากอาคาร/ชั้น */
  const vert = (bld, from, to) => (BUILDINGS[bld].stepWords === "plain"
    ? (to > from ? `ขึ้นไปชั้น ${to}` : `ลงไปชั้น ${to}`)
    : (to > from ? `ขึ้นลิฟต์ไปชั้น ${to}` : from - to === 1 ? `ลงบันไดไปชั้น ${to}` : `ลงลิฟต์ไปชั้น ${to}`));
  function moveText(a, b) {
    const steps = [];
    if (a.travel) {
      steps.push(`ลงรถที่${BUILDINGS[b.building].full}`);
      if (b.floor !== 1) steps.push(vert(b.building, 1, b.floor));
    } else if (a.building === b.building) {
      if (a.floor !== b.floor) steps.push(vert(a.building, a.floor, b.floor));
    } else {
      const linkF = a.floor === 1 && b.floor === 1 ? 1 : 2;
      if (a.building !== "bridge" && a.floor !== linkF) steps.push(vert(a.building, a.floor, linkF));
      if (b.building === "bridge") steps.push(`เดินไปทางเชื่อมอาคาร ชั้น ${linkF}`);
      else if (a.building === "bridge") steps.push(`เข้า${BUILDINGS[b.building].th}`);
      else steps.push(`เดินทางเชื่อมชั้น ${linkF} ไป${BUILDINGS[b.building].th}`);
      if (b.building !== "bridge" && b.floor !== linkF) steps.push(vert(b.building, linkF, b.floor));
    }
    return steps.join(" → ") || "เดินต่อในบริเวณเดียวกัน";
  }

  /* ---------- ปรับลำดับเฉพาะรอบนี้ ----------
   * ผู้นำชมสลับลำดับ/ข้ามจุดได้เอง เก็บไว้ในเครื่องนี้ถึงสิ้นวัน (และในลิงก์ที่คัดลอก)
   * ไม่ส่งขึ้นเซิร์ฟเวอร์ เส้นทางหลักของคนอื่นจึงไม่เปลี่ยน
   * custom = { [venueId]: { order: [stopId ตามลำดับใหม่], skip: [stopId ที่ข้าม], min: { stopId: นาทีที่ปรับ } } } */
  const MIN_STOP = 1, MAX_STOP = 30;
  let custom = null, editing = false;
  const routeKey = () => `${state.venue}|${state.group}|${parts(state.venue).map((p) => state.dur[p]).join(",")}`;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function loadCustom() {
    editing = false; custom = null;
    if (!ready()) return;
    const c = (readJson("custom") || {})[routeKey()];
    if (c && c.day === today() && c.v && typeof c.v === "object") custom = c.v;
  }
  function saveCustom() {
    const all = readJson("custom") || {};
    Object.keys(all).forEach((k) => { if (!all[k] || all[k].day !== today()) delete all[k]; });
    if (custom) all[routeKey()] = { day: today(), v: custom }; else delete all[routeKey()];
    store.set("custom", JSON.stringify(all));
  }
  /* ลิงก์: o=id,id:5,!id~id,... (คั่นสถานที่ด้วย ~ · ! = ข้าม · :5 = ปรับเป็น 5 นาที) */
  function parseCustom(str) {
    const out = {};
    String(str).split("~").forEach((seg, i) => {
      const vid = parts(state.venue)[i];
      if (!vid || !seg) return;
      const order = [], skip = [], min = {};
      seg.split(",").forEach((t) => {
        const m = /^(!?)([^:]+)(?::(\d+))?$/.exec(t);
        if (!m) return;
        const id = m[2];
        if (!STOPS[id] || STOPS[id].venue !== vid || order.includes(id) || min[id]) return;
        if (m[3]) min[id] = Math.min(MAX_STOP, Math.max(MIN_STOP, Number(m[3])));
        if (STOPS[id].closing) return; /* จุดปิดท้าย: ปรับได้เฉพาะเวลา */
        order.push(id);
        if (m[1]) skip.push(id);
      });
      if (order.length || Object.keys(min).length) out[vid] = { order, skip, min };
    });
    return Object.keys(out).length ? out : null;
  }
  const customParam = () => (custom ? parts(state.venue).map((vid) => {
    const c = custom[vid];
    if (!c) return "";
    const mins = c.min || {};
    const tok = (id) => `${c.skip.includes(id) ? "!" : ""}${id}${mins[id] ? `:${mins[id]}` : ""}`;
    return [...c.order.map(tok), ...Object.keys(mins).filter((id) => !c.order.includes(id)).map(tok)].join(",");
  }).join("~") : "");
  /* จุดของสถานที่หนึ่งตามเส้นทางหลัก (จุดปิดท้ายใช้เฉพาะสถานที่สุดท้าย) */
  const baseList = (vid, vi, n) => (ROUTES[vid][state.group][state.dur[vid]] || [])
    .filter(([id]) => STOPS[id] && !(STOPS[id].closing && vi < n - 1));
  /* แถวสำหรับหน้าปรับลำดับ: จุดที่ย้ายได้ตามลำดับใหม่ (รวมจุดที่ข้าม) + จุดปิดท้ายท้ายสุดเสมอ */
  function arranged(vid, vi, n) {
    const list = baseList(vid, vi, n);
    const c = custom && custom[vid];
    const movable = list.filter(([id]) => !STOPS[id].closing);
    const fixed = list.filter(([id]) => STOPS[id].closing);
    const pos = new Map(c ? c.order.map((id, k) => [id, k]) : []);
    const sorted = movable.map((x, k) => [x, pos.has(x[0]) ? pos.get(x[0]) : 1e4 + k]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
    const skip = new Set(c ? c.skip : []);
    const mins = (c && c.min) || {};
    const row = (fixedRow) => ([id, base]) => ({ id, base, min: mins[id] || base, skip: !fixedRow && skip.has(id), fixed: fixedRow });
    return [...sorted.map(row(false)), ...fixed.map(row(true))];
  }
  function editCustom(vid, fn) {
    const ps = parts(state.venue), vi = ps.indexOf(vid);
    const all = arranged(vid, vi, ps.length);
    const rows = all.filter((r) => !r.fixed);
    const min = {};
    all.forEach((r) => { if (r.min !== r.base) min[r.id] = r.min; });
    const c = { order: rows.map((r) => r.id), skip: rows.filter((r) => r.skip).map((r) => r.id), min };
    fn(c);
    Object.keys(c.min).forEach((id) => { if (c.min[id] === all.find((r) => r.id === id).base) delete c.min[id]; });
    custom = { ...(custom || {}), [vid]: c };
    /* กลับมาเหมือนเส้นทางหลักทุกสถานที่ → ไม่ถือว่าปรับเอง */
    const same = ps.every((v, i) => {
      const cc = custom[v];
      if (!cc) return true;
      const base = baseList(v, i, ps.length).filter(([id]) => !STOPS[id].closing).map(([id]) => id);
      return !cc.skip.length && !Object.keys(cc.min || {}).length && cc.order.join(",") === base.join(",");
    });
    if (same) custom = null;
    saveCustom();
  }

  /* เส้นทาง = จุดของแต่ละสถานที่ต่อกัน คั่นด้วยช่วงเดินทางโดยรถ
     จุดปิดท้าย (closing) ใช้เฉพาะของสถานที่สุดท้าย */
  const getRoute = () => {
    if (!ready()) return null;
    const ps = parts(state.venue);
    const items = [];
    let acc = 0, prev = null;
    const push = (it) => { it.i = items.length; it.from = acc; acc += it.min; items.push(it); prev = it; };
    ps.forEach((vid, vi) => {
      const list = arranged(vid, vi, ps.length).filter((r) => !r.skip).map((r) => [r.id, r.min]);
      if (vi > 0 && list.length) {
        const dest = VENUES[vid], first = STOPS[list[0][0]];
        push({
          id: `_travel-${vid}`, travel: true, venue: vid, min: TRAVEL.minutes, icon: "🚐",
          name: `เดินทางไป${dest.name}`, en: `Travel to ${dest.en || dest.name}`, building: first.building, floor: 1,
          move: `ออกจาก${VENUES[ps[vi - 1]].name} ขึ้นรถ`,
          script: { th: TRAVEL.th.replaceAll("{to}", dest.name), en: TRAVEL.en.replaceAll("{to}", dest.en || dest.name) },
          facts: [`ประมาณ ${TRAVEL.minutes} นาที`], notes: [], emphasis: {},
        });
      }
      list.forEach(([id, min]) => {
        const s = STOPS[id];
        push({ ...s, id, min, venueMin: state.dur[vid], move: prev ? moveText(prev, s) : "" });
      });
    });
    return items;
  };
  const routeTotal = (route) => route.reduce((a, r) => a + r.min, 0);
  const venueTitle = () => parts(state.venue).map((p) => VENUES[p].name).join(" → ");
  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2000);
  };
  const shareUrl = () => `?p=${encodeURIComponent(state.venue)}&g=${state.group}&t=${parts(state.venue).map((p) => state.dur[p]).join(",")}&l=${state.lang}${custom ? `&o=${encodeURIComponent(customParam())}` : ""}`;

  /* ---------- selectors ---------- */
  const venueTone = (vid) => BUILDINGS[Content.buildingsOf(vid)[0]].tone;
  function renderVenues() {
    const opts = venueOptions();
    const show = opts.length > 1;
    $("#venueStep").hidden = !show;
    $("#numGroup").textContent = show ? "2" : "1";
    $("#numDur").textContent = show ? "3" : "2";
    $("#heroLead").textContent = `${show ? "เลือกสถานที่ กลุ่มผู้เยี่ยมชม และเวลา" : "เลือกกลุ่มผู้เยี่ยมชมและเวลา"} ระบบจะจัดเส้นทาง พร้อมบทนำชมที่เหมาะสมให้ทันที`;
    if (!show) return;
    $("#venueGrid").innerHTML = opts.map((o) => {
      const vs = o.parts.map((p) => VENUES[p]);
      const combo = vs.length > 1;
      const hidden = o.parts.filter((p) => !VENUES[p].published).length ? " · ยังไม่เปิดแสดง" : "";
      return `
      <button type="button" class="group-card tone-${combo ? "sky" : venueTone(o.key)}" role="radio" aria-checked="${state.venue === o.key}" data-p="${esc(o.key)}">
        <span class="group-icon" aria-hidden="true">${combo ? "🔄" : esc(vs[0].icon)}</span>
        <span>
          <span class="group-name">${combo ? `ต่อเนื่อง: ${esc(vs[0].name)} → ${esc(vs[1].name)}` : esc(vs[0].name)}</span><br />
          <span class="group-en">${combo ? `${esc(vs[0].en)} → ${esc(vs[1].en)}` : esc(vs[0].en)}</span>
          <span class="group-desc">${combo ? `รวมเดินทางโดยรถประมาณ ${TRAVEL.minutes} นาที` : esc(vs[0].desc)}${hidden}</span>
        </span>
      </button>`;
    }).join("");
  }
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
    const ps = parts(state.venue);
    if (!ps.length) { $("#durGrid").innerHTML = `<p class="dur-label">เลือกสถานที่ก่อน แล้วจึงเลือกเวลา</p>`; return; }
    $("#durGrid").innerHTML = ps.map((vid) => {
      const v = VENUES[vid];
      const btns = v.durations.map((d) => `
      <button type="button" class="dur-btn" role="radio" aria-checked="${state.dur[vid] === d}" data-v="${esc(vid)}" data-t="${d}">
        <span class="num">${d}</span><span class="unit">นาที${d === v.fullDuration ? " · ฉบับเต็ม" : ""}</span>
      </button>`).join("");
      return ps.length > 1 ? `<div class="dur-label">${esc(v.icon)} ${esc(v.name)}</div>${btns}` : btns;
    }).join("");
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

  $("#venueGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-p]");
    if (!b) return;
    state.venue = b.dataset.p;
    store.set("p", state.venue);
    loadCustom();
    renderVenues(); renderDurations(); renderResult(true);
  });
  $("#groupGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-g]");
    if (!b) return;
    state.group = b.dataset.g;
    store.set("g", state.group);
    loadCustom();
    renderGroups(); renderResult(true);
  });
  $("#durGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    state.dur[b.dataset.v] = Number(b.dataset.t);
    store.set("dur", JSON.stringify(state.dur));
    loadCustom();
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
    const text = String(r.script[state.lang]).replaceAll("{min}", r.venueMin || "");
    const script = inTour
      ? `<div class="script" lang="${state.lang}"><span class="script-label">${label}</span>${paras(text)}</div>`
      : `<details class="script-box"${isWide() ? " open" : ""}>
           <summary>📖 ${label}</summary>
           <div class="script" lang="${state.lang}">${paras(text)}</div>
         </details>`;
    const openNotes = inTour;
    const imgs = r.images || [];
    const photos = imgs.length ? `
      <div class="stop-photos n${imgs.length}">${imgs.map((im) => `
        <button type="button" class="photo" data-full="${esc(im.src)}" data-fid="${esc(im.id || "")}" data-cap="${esc(im.caption)}" aria-label="ดูภาพ${esc(im.caption ? ` ${im.caption}` : "")}">
          <img src="${esc(im.src)}" data-fid="${esc(im.id || "")}" alt="${esc(im.caption || r.name)}" loading="lazy" referrerpolicy="no-referrer" />
          ${im.caption ? `<span class="photo-cap">${esc(im.caption)}</span>` : ""}
        </button>`).join("")}
      </div>` : "";
    return `
      ${r.emphasis && r.emphasis[g] ? `<div class="emphasis"><span>🎯 เน้นสำหรับ${esc(GROUPS[g].name)}</span>${esc(r.emphasis[g])}</div>` : ""}
      ${photos}
      ${script}
      ${r.facts && r.facts.length ? `<div class="facts">${r.facts.map((f) => `<span class="fact">${esc(f)}</span>`).join("")}</div>` : ""}
      ${r.link && /^https?:\/\//i.test(r.link.url) ? `<a class="ext-link" href="${esc(r.link.url)}" target="_blank" rel="noopener">🔗 ${esc(r.link.label)}</a>` : ""}
      ${r.notes && r.notes.length ? `
        <details class="notes"${openNotes ? " open" : ""}>
          <summary>📝 หมายเหตุผู้นำชม (${r.notes.length})</summary>
          <ul class="points">${r.notes.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </details>` : ""}`;
  }

  /* เวลารวมหลังปรับ เทียบกับเส้นทางหลัก */
  function timeInfo() {
    const route = getRoute() || [];
    const ps = parts(state.venue);
    const total = routeTotal(route);
    let skipMin = 0, skipN = 0, adj = 0;
    ps.forEach((vid, vi) => arranged(vid, vi, ps.length).forEach((r) => {
      if (r.skip) { skipMin += r.base; skipN++; } else adj += r.min - r.base;
    }));
    return { total, base: total + skipMin - adj, skipMin, skipN, adj, end: addMin(state.start, total) };
  }
  const sign = (n) => (n > 0 ? `+${n}` : `−${-n}`);
  const timeLine = (t) => {
    const bits = [];
    if (t.skipN) bits.push(`ข้าม ${t.skipN} จุด −${t.skipMin}`);
    if (t.adj) bits.push(`ปรับเวลา ${sign(t.adj)}`);
    const diff = t.total - t.base;
    const gap = !diff ? "เท่ากับเส้นทางหลักพอดี" : diff < 0 ? `น้อยกว่าเส้นทางหลัก ${-diff} นาที` : `เกินเส้นทางหลัก ${diff} นาที`;
    return `ใช้เวลาจริง <b>${t.total} นาที</b>${state.start ? ` (${state.start} – ${t.end} น.)` : ""} · เส้นทางหลัก ${t.base} นาที${bits.length ? ` (${bits.join(", ")} นาที)` : ""} · <span class="gap ${diff < 0 ? "under" : diff > 0 ? "over" : "even"}">${gap}</span>`;
  };

  /* เกลี่ยส่วนต่างระหว่างเวลาจริงกับเส้นทางหลัก ให้จุดที่ยังแวะ (ไม่รวมจุดปิดท้าย) ทีละ 1 นาทีวนไป
     เพิ่ม: เริ่มจากจุดที่ใช้เวลานานกว่าเดิมน้อยที่สุด · ลด: เริ่มจากจุดที่เพิ่มไว้มากที่สุด */
  function fillTime() {
    const ps = parts(state.venue);
    let diff = timeInfo().base - timeInfo().total;
    const rows = [];
    ps.forEach((vid, vi) => arranged(vid, vi, ps.length).forEach((r) => { if (!r.skip && !r.fixed) rows.push({ ...r, vid }); }));
    if (!rows.length || !diff) return;
    const step = diff > 0 ? 1 : -1;
    let guard = 2000;
    while (diff && guard--) {
      const ok = rows.filter((r) => (step > 0 ? r.min < MAX_STOP : r.min > MIN_STOP));
      if (!ok.length) break;
      ok.sort((a, b) => (step > 0 ? (a.min - a.base) - (b.min - b.base) || a.min - b.min : (b.min - b.base) - (a.min - a.base) || b.min - a.min));
      ok[0].min += step; diff -= step;
    }
    ps.forEach((vid) => {
      const mine = rows.filter((r) => r.vid === vid);
      if (mine.length) editCustom(vid, (c) => { mine.forEach((r) => { c.min[r.id] = r.min; }); });
    });
    toast(diff ? "ปรับได้เท่าที่ทำได้ (แต่ละจุดไม่เกิน 30 นาที)" : "เกลี่ยเวลาแล้ว ตรวจและปรับต่อด้วย − + ได้");
  }

  function reorderHtml() {
    const ps = parts(state.venue);
    const t = timeInfo();
    return `
      <section class="card reorder fade-in" aria-labelledby="reorderTitle">
        <h3 id="reorderTitle">✏️ ปรับลำดับเฉพาะรอบนี้</h3>
        <div class="ro-top">
          <p class="ro-total top">⏱ ${timeLine(t)}</p>
          ${t.total !== t.base ? `<button type="button" class="btn soft ro-fill" data-ro="fill">⚖️ ${t.total < t.base ? `เกลี่ยเวลาเพิ่มให้ครบ ${t.base} นาที` : `เกลี่ยเวลาลดให้เหลือ ${t.base} นาที`}</button>` : ""}
        </div>
        <p class="ro-hint">กด ▲▼ เพื่อสลับลำดับ กด − + เพื่อปรับนาทีของแต่ละจุด หรือกด "ข้าม" ถ้ารอบนี้ไม่แวะจุดนั้น ใช้ได้ในเครื่องนี้ถึงสิ้นวัน และในลิงก์ที่คัดลอกจากหน้านี้ เส้นทางหลักของคนอื่นไม่เปลี่ยน</p>
        ${ps.map((vid, vi) => {
          const rows = arranged(vid, vi, ps.length);
          const last = rows.filter((r) => !r.fixed).length - 1;
          return `
          ${ps.length > 1 ? `<h4 class="ro-venue">${esc(VENUES[vid].icon)} ${esc(VENUES[vid].name)}</h4>` : ""}
          <ol class="ro-list">${rows.map((r, k) => {
            const s = STOPS[r.id];
            const a = `data-v="${esc(vid)}" data-id="${esc(r.id)}"`;
            return `
            <li class="ro-row${r.skip ? " skipped" : ""}">
              <span class="ro-ico" aria-hidden="true">${s.icon}</span>
              <span class="ro-txt"><b>${esc(s.name)}</b><small>${esc(locLabel(s))}${r.skip ? " · ข้ามรอบนี้" : r.min !== r.base ? ` · เดิม ${r.base} นาที` : ""}${r.fixed ? " · 🏁 ท้ายสุดเสมอ" : ""}</small></span>
              <span class="ro-min${r.min !== r.base ? " changed" : ""}" role="group" aria-label="เวลาที่ ${esc(s.name)}">
                <button type="button" data-ro="minus" ${a} ${r.skip || r.min <= MIN_STOP ? "disabled" : ""} aria-label="ลด 1 นาที">−</button>
                <span class="ro-val">${r.skip ? "–" : r.min}<small>นาที</small></span>
                <button type="button" data-ro="plus" ${a} ${r.skip || r.min >= MAX_STOP ? "disabled" : ""} aria-label="เพิ่ม 1 นาที">+</button>
              </span>
              ${r.fixed ? `<span class="ro-btns ro-btns-fixed" aria-hidden="true"></span>` : `
              <span class="ro-btns">
                <button type="button" data-ro="up" ${a} ${k === 0 ? "disabled" : ""} aria-label="เลื่อน ${esc(s.name)} ขึ้น">▲</button>
                <button type="button" data-ro="down" ${a} ${k === last ? "disabled" : ""} aria-label="เลื่อน ${esc(s.name)} ลง">▼</button>
                <button type="button" class="ro-skip" data-ro="skip" ${a} aria-pressed="${r.skip}">${r.skip ? "↩ นำกลับ" : "ข้าม"}</button>
              </span>`}
            </li>`;
          }).join("")}</ol>`;
        }).join("")}
        <div class="ro-foot">
          <p class="ro-total" aria-live="polite">⏱ ${timeLine(t)}</p>
          <button type="button" class="btn ghost" data-ro="reset" ${custom ? "" : "disabled"}>↺ คืนค่าเส้นทางหลัก</button>
          <button type="button" class="btn primary" data-ro="done">✓ เสร็จ</button>
        </div>
      </section>`;
  }

  function renderResult(scroll, quiet) {
    const el = $("#result");
    el.classList.toggle("quiet", !!quiet); /* กดปรับลำดับ: ไม่เล่นภาพเคลื่อนไหวซ้ำทุกครั้ง */
    const route = getRoute();
    if (!route) {
      const need = !state.venue ? "สถานที่" : !state.group ? "กลุ่มผู้เยี่ยมชม" : "เวลานำชม";
      el.innerHTML = `<div class="empty"><div class="em">🧭</div>เลือก${need} เพื่อดูบทนำชมและเส้นทางที่แนะนำ</div>`;
      return;
    }
    const g = GROUPS[state.group];
    const blds = [...new Set(route.filter((r) => !r.travel).map((r) => r.building).filter((b) => b !== "bridge"))].map((b) => BUILDINGS[b].th);
    const total = routeTotal(route);
    const end = addMin(state.start, total);
    const ps = parts(state.venue);
    const skippedMin = (vid) => (custom && custom[vid] ? arranged(vid, ps.indexOf(vid), ps.length).reduce((x, r) => x + (r.skip ? r.base : r.base - r.min), 0) : 0);
    const skipped = custom ? ps.reduce((a, vid, vi) => a + arranged(vid, vi, ps.length).filter((r) => r.skip).length, 0) : 0;

    el.innerHTML = `
      <div class="summary fade-in">
        <div class="summary-top">
          <div class="summary-icon" aria-hidden="true">${g.icon}</div>
          <div>
            <h2>บทนำชม: ${esc(venueTitle())} · ${esc(g.name)} · ${total} นาที</h2>
            <div class="sub">${esc(g.en)} — ${esc(g.desc)}</div>
          </div>
        </div>
        <div class="stats">
          <span class="stat">📍 ${route.filter((r) => !r.travel).length} จุด</span>
          ${ps.length > 1 ? `<span class="stat">🧭 ${ps.map((p) => `${esc(VENUES[p].icon)} ${state.dur[p] - skippedMin(p)}`).join(" + ")} + 🚐 ${TRAVEL.minutes} นาที</span>` : ""}
          <span class="stat">🏢 ${blds.join(" + ")}</span>
          ${state.start ? `<span class="stat">🕒 ${state.start} – ${end} น.</span>` : ""}
          <span class="stat">🗣 ${state.lang === "th" ? "ภาษาไทย" : "English"}</span>
        </div>
        <div class="actions">
          <button class="btn white" id="startTour">▶ เริ่มโหมดนำชม</button>
          <button class="btn glass" id="printBtn">🖨 พิมพ์ / บันทึก PDF</button>
          <button class="btn glass" id="shareBtn">🔗 คัดลอกลิงก์</button>
          <button class="btn glass" data-ro="edit" aria-pressed="${editing}">✏️ ปรับลำดับรอบนี้</button>
        </div>
        ${custom ? `<div class="custom-note">✏️ รอบนี้ปรับเอง · ใช้เวลาจริง ${total} นาที (เส้นทางหลัก ${timeInfo().base} นาที${skipped ? ` ข้าม ${skipped} จุด` : ""}) <span>(เฉพาะเครื่องนี้ ไม่กระทบเส้นทางหลัก)</span>
          <button type="button" data-ro="reset">↺ คืนค่าเส้นทางหลัก</button></div>` : ""}
      </div>
      ${editing ? reorderHtml() : ""}

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
        <button class="btn primary" id="startTour2">▶ เริ่มโหมดนำชม · ${total} นาที</button>
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

  $("#result").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ro]");
    if (!b || b.disabled) return;
    const act = b.dataset.ro, vid = b.dataset.v, id = b.dataset.id;
    if (act === "edit") { editing = !editing; renderResult(false, true); if (editing) $(".reorder").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (act === "done") { editing = false; renderResult(true); toast(custom ? "ใช้ลำดับที่ปรับแล้ว" : "ใช้เส้นทางหลัก"); return; }
    if (act === "fill") { fillTime(); renderResult(false, true); return; }
    if (act === "reset") { custom = null; saveCustom(); renderResult(false, true); toast("คืนค่าเส้นทางหลักแล้ว"); return; }
    editCustom(vid, (c) => {
      const k = c.order.indexOf(id);
      if (act === "skip") c.skip = c.skip.includes(id) ? c.skip.filter((x) => x !== id) : [...c.skip, id];
      else if (act === "plus" || act === "minus") {
        const r = arranged(vid, parts(state.venue).indexOf(vid), parts(state.venue).length).find((x) => x.id === id);
        c.min[id] = Math.min(MAX_STOP, Math.max(MIN_STOP, r.min + (act === "plus" ? 1 : -1)));
      }
      else {
        const j = k + (act === "up" ? -1 : 1);
        if (k < 0 || j < 0 || j >= c.order.length) return;
        [c.order[k], c.order[j]] = [c.order[j], c.order[k]];
      }
    });
    if (act === "skip" && parts(state.venue).every((v, vi, ps) => !arranged(v, vi, ps.length).some((r) => !r.skip))) {
      editCustom(vid, (c) => { c.skip = c.skip.filter((x) => x !== id); });
      toast("ต้องเหลืออย่างน้อย 1 จุด");
    }
    renderResult(false, true);
    const again = document.querySelector(`[data-ro="${act}"][data-id="${CSS.escape(id)}"]`);
    if (again && !again.disabled) again.focus();
    else { const row = document.querySelector(`[data-id="${CSS.escape(id)}"]`); if (row) row.focus(); }
  });

  /* เปิดหมายเหตุทั้งหมดเมื่อพิมพ์ */
  window.addEventListener("beforeprint", () => { if (editing) { editing = false; renderResult(); } });
  window.addEventListener("beforeprint", () => document.querySelectorAll("#result details").forEach((d) => { d.dataset.wasOpen = d.open; d.open = true; }));
  window.addEventListener("afterprint", () => document.querySelectorAll("#result details").forEach((d) => { d.open = d.dataset.wasOpen === "true"; }));

  /* ---------- Tour mode ---------- */
  const Tour = {
    route: [], idx: 0, stopSec: 0, totalSec: 0, paused: false, timer: null, wake: null,
    open(route) {
      Object.assign(this, { route, idx: 0, stopSec: 0, totalSec: 0, paused: false, total: routeTotal(route) });
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
      const planned = this.total * 60;
      $("#tourClock").textContent = `${this.fmt(this.totalSec)} / ${this.total}:00`;
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
  /* ---------- ภาพจุดนำชม: ดูเต็มจอ + ลิงก์สำรองของ Google Drive ---------- */
  const Lightbox = {
    open(src, fid, cap) {
      const img = $("#lightboxImg");
      img.dataset.fid = fid || ""; img.dataset.tried = "";
      img.src = src; img.alt = cap || "";
      $("#lightboxCap").textContent = cap || "";
      $("#lightbox").hidden = false;
      $("#lightboxClose").focus();
    },
    close() { $("#lightbox").hidden = true; $("#lightboxImg").removeAttribute("src"); },
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".photo[data-full]");
    if (b) { e.preventDefault(); Lightbox.open(b.dataset.full, b.dataset.fid, b.dataset.cap); }
  });
  $("#lightbox").addEventListener("click", (e) => { if (e.target.id !== "lightboxImg") Lightbox.close(); });
  /* ลิงก์หลักโหลดไม่ขึ้น → ลองลิงก์ภาพย่อของ Google Drive อีกครั้ง */
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName !== "IMG" || !img.dataset.fid || img.dataset.tried) return;
    img.dataset.tried = "1";
    img.src = driveThumb(img.dataset.fid);
  }, true);

  document.addEventListener("keydown", (e) => {
    if (!$("#lightbox").hidden) { if (e.key === "Escape") Lightbox.close(); return; }
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
  function renderAll() { renderVenues(); renderGroups(); renderDurations(); renderLang(); renderResult(); }
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
