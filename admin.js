(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const WORK_KEY = "kulib-admin-work";
  const NAME_KEY = "kulib-admin-name";

  let pin = "";
  let demo = false;          // ทดลองใช้โดยไม่มี API
  let server = null;         // ข้อมูลฉบับที่เผยแพร่อยู่ (normalized)
  let meta = {};             // { savedAt, editor, row }
  let work = null;           // ข้อมูลที่กำลังแก้ไข
  let tab = "stops";
  let sel = 0;               // จุดนำชมที่เลือก
  let historyItems = null;

  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  };
  const fmtDate = (s) => {
    if (!s) return "";
    const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}+07:00`);
    return isNaN(d) ? s : d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  };
  const locLabel = (s) => `${BUILDINGS[s.building] ? BUILDINGS[s.building].th : ""} · ชั้น ${s.floor}`;
  const linesVal = (a) => (a || []).join("\n");

  /* ปุ่มที่ต้องกดสองครั้งเพื่อยืนยัน (แทนกล่องยืนยันของเบราว์เซอร์) */
  function armed(btn) {
    if (btn.dataset.armed === "1") { clearTimeout(btn._t); return true; }
    btn.dataset.armed = "1";
    btn.dataset.label = btn.textContent;
    btn.textContent = "กดอีกครั้งเพื่อยืนยัน";
    btn._t = setTimeout(() => { btn.dataset.armed = ""; btn.textContent = btn.dataset.label; }, 3500);
    return false;
  }

  /* ================= เข้าสู่ระบบ ================= */
  if (!Content.API_URL) $("#noApi").hidden = false;

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const p = $("#pinInput").value.trim();
    const msg = $("#loginMsg");
    if (!Content.API_URL) { msg.textContent = "ยังไม่ได้ตั้งค่า API ใช้ปุ่ม \"ทดลองใช้แบบไม่บันทึก\" ด้านล่างได้"; return; }
    $("#loginBtn").disabled = true;
    msg.className = "msg"; msg.textContent = "กำลังตรวจสอบ…";
    try {
      await Content.call({ action: "verify", pin: p });
      pin = p;
      msg.textContent = "กำลังโหลดข้อมูล…";
      const data = await Content.call(null);
      start(data.content, { savedAt: data.savedAt, editor: data.editor, row: data.row || 0 });
      msg.textContent = "";
    } catch (err) {
      msg.className = "msg err"; msg.textContent = err.message;
    } finally {
      $("#loginBtn").disabled = false;
      $("#pinInput").value = "";
    }
  });
  $("#demoBtn").onclick = () => { demo = true; start(null, { row: 0 }); };
  $("#logoutBtn").onclick = () => {
    if (isDirty() && !armed($("#logoutBtn"))) return;
    pin = ""; demo = false; server = work = null;
    $("#app").hidden = true; $("#savebar").hidden = true; $("#logoutBtn").hidden = true;
    $("#login").hidden = false;
    $("#logoutBtn").textContent = "ออกจากระบบ"; $("#logoutBtn").dataset.armed = "";
    store.del(WORK_KEY);
  };

  function start(content, m) {
    server = Content.normalize(content || DEFAULT_CONTENT);
    meta = m;
    work = clone(server);
    sel = 0; historyItems = null;
    $("#login").hidden = true;
    $("#app").hidden = false;
    $("#savebar").hidden = false;
    $("#logoutBtn").hidden = false;
    document.body.classList.add("has-savebar");

    /* งานที่แก้ค้างไว้ในเครื่องนี้ */
    let saved = null;
    try { saved = JSON.parse(store.get(WORK_KEY) || "null"); } catch { saved = null; }
    $("#resume").hidden = !(saved && saved.work && Content.key(saved.work) !== Content.key(server));
    $("#resumeYes").onclick = () => { work = Content.normalize(saved.work); $("#resume").hidden = true; render(); toast("โหลดงานที่แก้ค้างไว้แล้ว"); };
    $("#resumeNo").onclick = () => { store.del(WORK_KEY); $("#resume").hidden = true; };
    render();
  }

  /* ================= สถานะ ================= */
  const isDirty = () => work && Content.key(work) !== Content.key(server);
  let saveTimer = null;
  function changed() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (isDirty()) store.set(WORK_KEY, JSON.stringify({ work, at: Date.now() }));
      else store.del(WORK_KEY);
    }, 400);
    updateBar();
  }

  function renderMeta() {
    const el = $("#metaLine");
    if (demo) { el.innerHTML = `<span class="pill warn">โหมดทดลอง</span> ยังไม่ได้เชื่อมต่อ API — แก้ไขและดูตัวอย่างได้ แต่บันทึกขึ้นเว็บไม่ได้ (ใช้ “ดาวน์โหลดไฟล์สำรอง” ในแท็บเวลา & เตรียมการ)`; return; }
    el.innerHTML = meta.savedAt
      ? `ฉบับที่เผยแพร่อยู่: บันทึกเมื่อ <b>${esc(fmtDate(meta.savedAt))}</b> โดย <b>${esc(meta.editor)}</b>`
      : `<span class="pill warn">ยังไม่เคยบันทึก</span> ตอนนี้เว็บใช้ข้อมูลตั้งต้นจากสคริปต์ rev2 — กด <b>💾 บันทึก</b> มุมขวาล่างเพื่อเก็บเป็นฉบับแรก`;
  }

  function updateBar() {
    const v = Content.validate(work);
    const chip = $("#checkBtn");
    chip.className = "check-chip " + (v.errors.length ? "bad" : v.warnings.length ? "warn" : "ok");
    chip.textContent = v.errors.length ? `✕ ต้องแก้ ${v.errors.length} ข้อ` : v.warnings.length ? `⚠ ควรตรวจ ${v.warnings.length} ข้อ` : "✓ ข้อมูลครบถ้วน";
    const list = $("#checkList");
    list.innerHTML = `
      ${v.errors.length ? `<h3>ต้องแก้ก่อนบันทึก</h3><ul class="bad">${v.errors.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${v.warnings.length ? `<h3>ควรตรวจ (บันทึกได้)</h3><ul class="warn">${v.warnings.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${!v.errors.length && !v.warnings.length ? `<p>ไม่พบปัญหา เส้นทางทุกเส้นมีเวลารวมตรงกับเวลานำชม</p>` : ""}`;
    const first = !demo && !meta.row;   /* ยังไม่เคยบันทึก: ให้กดบันทึกฉบับแรกได้เลย */
    const dirty = isDirty() || first;
    $("#dirtyText").textContent = first ? "● ยังไม่เคยบันทึก กดบันทึกเพื่อเริ่มใช้งาน" : dirty ? "● มีการแก้ไขที่ยังไม่ได้บันทึก" : "ไม่มีการแก้ไข";
    $("#dirtyText").classList.toggle("on", dirty);
    $("#saveBtn").disabled = demo || !dirty || v.errors.length > 0;
    $("#saveBtn").title = demo ? "โหมดทดลอง บันทึกไม่ได้" : v.errors.length ? "แก้ข้อที่ต้องแก้ก่อน" : !dirty ? "ยังไม่มีการแก้ไข" : "";
    $("#discardBtn").hidden = !isDirty();
  }
  $("#checkBtn").onclick = () => {
    const l = $("#checkList");
    l.hidden = !l.hidden;
    $("#checkBtn").setAttribute("aria-expanded", String(!l.hidden));
  };
  $("#discardBtn").onclick = () => {
    if (!armed($("#discardBtn"))) return;
    work = clone(server); store.del(WORK_KEY);
    $("#discardBtn").textContent = "↺ ทิ้งการแก้ไข"; $("#discardBtn").dataset.armed = "";
    sel = Math.min(sel, work.stops.length - 1);
    render(); toast("ทิ้งการแก้ไขแล้ว กลับเป็นฉบับที่เผยแพร่อยู่");
  };
  window.addEventListener("beforeunload", (e) => { if (isDirty()) { e.preventDefault(); e.returnValue = ""; } });

  /* ================= แท็บ ================= */
  document.querySelector(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tab = b.dataset.tab;
    render();
  });

  function render() {
    document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
    renderMeta();
    const p = $("#panel");
    if (tab === "stops") p.innerHTML = stopsHtml();
    else if (tab === "routes") p.innerHTML = routesHtml();
    else if (tab === "groups") p.innerHTML = groupsHtml();
    else if (tab === "settings") p.innerHTML = settingsHtml();
    else if (tab === "history") { p.innerHTML = historyHtml(); if (!historyItems && !demo) loadHistory(); }
    updateBar();
  }

  /* ---------- จุดนำชม ---------- */
  function routeSummary(s) {
    const chips = [];
    work.groups.forEach((g) => work.durations.forEach((d) => {
      const m = work.routes[g.id] && work.routes[g.id][d] && work.routes[g.id][d][s.id];
      if (m > 0) chips.push(`<span class="mini tone-${g.tone}">${esc(g.icon)} ${d} น. · ${m}′</span>`);
    }));
    return chips.length ? chips.join("") : `<span class="muted">ยังไม่อยู่ในเส้นทางใด</span>`;
  }
  function stopListHtml() {
    return work.stops.map((s, i) => `
      <li class="${i === sel ? "on" : ""}">
        <button type="button" class="stop-item" data-act="sel" data-i="${i}" aria-current="${i === sel}">
          <span class="ico">${esc(s.icon)}</span>
          <span class="txt"><b>${s.ref ? `<span class="ref">${esc(s.ref)}</span>` : ""}${esc(s.name || "(ยังไม่มีชื่อ)")}</b><small>${esc(locLabel(s))}</small></span>
        </button>
        <span class="mv">
          <button type="button" data-act="up" data-i="${i}" aria-label="เลื่อนขึ้น" ${i === 0 ? "disabled" : ""}>▲</button>
          <button type="button" data-act="down" data-i="${i}" aria-label="เลื่อนลง" ${i === work.stops.length - 1 ? "disabled" : ""}>▼</button>
        </span>
      </li>`).join("");
  }
  function stopsHtml() {
    if (!work.stops.length) return `<div class="card empty-card">ยังไม่มีจุดนำชม <button type="button" class="btn primary sm" data-act="addStop">＋ เพิ่มจุดแรก</button></div>`;
    sel = Math.max(0, Math.min(sel, work.stops.length - 1));
    const s = work.stops[sel];
    const bOpts = Object.entries(BUILDINGS).map(([k, b]) => `<option value="${k}" ${s.building === k ? "selected" : ""}>${esc(b.full)}</option>`).join("");
    return `
    <div class="split">
      <div class="card list-card">
        <div class="card-head"><h2>จุดนำชม <span class="count">${work.stops.length}</span></h2>
          <button type="button" class="btn soft sm" data-act="addStop">＋ เพิ่มจุด</button></div>
        <p class="hint">ลำดับในรายการ = ลำดับการเดินจริงของทุกเส้นทาง ใช้ ▲▼ เพื่อสลับลำดับ</p>
        <ol class="stop-list" id="stopList">${stopListHtml()}</ol>
      </div>

      <div class="card form-card" id="stopForm">
        <div class="card-head">
          <h2>${esc(s.icon)} แก้ไขจุดนำชม</h2>
          <span class="head-actions">
            <button type="button" class="btn ghost sm" data-act="dupStop">⧉ ทำสำเนา</button>
            <button type="button" class="btn danger sm" data-act="delStop">🗑 ลบจุดนี้</button>
          </span>
        </div>

        <div class="grid g4">
          <label class="field"><span>เลขจุด</span><input data-f="ref" value="${esc(s.ref)}" placeholder="เช่น 6" /></label>
          <label class="field"><span>ไอคอน</span><input data-f="icon" value="${esc(s.icon)}" maxlength="8" /></label>
          <label class="field span2"><span>ชื่อจุด (ไทย)</span><input data-f="name" value="${esc(s.name)}" required /></label>
        </div>
        <div class="grid g4">
          <label class="field span2"><span>ชื่อจุด (อังกฤษ)</span><input data-f="en" value="${esc(s.en)}" /></label>
          <label class="field"><span>อาคาร</span><select data-f="building">${bOpts}</select></label>
          <label class="field"><span>ชั้น</span><input data-f="floor" type="number" min="1" max="9" inputmode="numeric" value="${esc(s.floor)}" /></label>
        </div>
        <p class="hint">อาคาร/ชั้นใช้คำนวณคำแนะนำการเดินระหว่างจุดให้อัตโนมัติ (เช่น “ขึ้นลิฟต์ไปชั้น 4”)</p>

        <label class="field"><span>บทพูดภาษาไทย</span>
          <textarea data-f="script.th" rows="10">${esc(s.script.th)}</textarea></label>
        <label class="field"><span>บทพูดภาษาอังกฤษ</span>
          <textarea data-f="script.en" rows="10" lang="en">${esc(s.script.en)}</textarea></label>
        <p class="hint">เว้นบรรทัดว่าง 1 บรรทัด = ขึ้นย่อหน้าใหม่ · พิมพ์ <code>{min}</code> แทนเวลานำชมที่ผู้นำชมเลือก (เช่น “ประมาณ {min} นาที”)</p>

        <div class="grid g2">
          <label class="field"><span>ตัวเลข/ข้อมูลสำคัญ <small>(บรรทัดละ 1 ข้อ)</small></span>
            <textarea data-lines="facts" rows="4">${esc(linesVal(s.facts))}</textarea></label>
          <label class="field"><span>หมายเหตุผู้นำชม <small>(บรรทัดละ 1 ข้อ)</small></span>
            <textarea data-lines="notes" rows="4">${esc(linesVal(s.notes))}</textarea></label>
        </div>

        <fieldset class="fs">
          <legend>ประเด็นที่ควรเน้นแยกตามกลุ่ม</legend>
          ${work.groups.map((g) => `<label class="field"><span>${esc(g.icon)} ${esc(g.name)}</span><input data-emph="${esc(g.id)}" value="${esc(s.emphasis[g.id])}" /></label>`).join("")}
        </fieldset>

        <div class="grid g2">
          <label class="field"><span>ลิงก์เพิ่มเติม: ข้อความ <small>(ไม่บังคับ)</small></span><input data-link="label" value="${esc(s.link ? s.link.label : "")}" /></label>
          <label class="field"><span>ลิงก์เพิ่มเติม: URL</span><input data-link="url" type="url" inputmode="url" placeholder="https://" value="${esc(s.link ? s.link.url : "")}" /></label>
        </div>

        <div class="route-sum"><span>อยู่ในเส้นทาง:</span> <span id="routeChips">${routeSummary(s)}</span>
          <button type="button" class="linkish" data-act="goRoutes">แก้ไขเส้นทาง →</button></div>
      </div>
    </div>`;
  }

  /* ---------- เส้นทาง ---------- */
  function sumOf(g, d) { return Object.values(work.routes[g][d] || {}).reduce((a, b) => a + b, 0); }
  function sumCell(g, d) {
    const s = sumOf(g, d);
    const cls = s === d ? "ok" : s > d ? "over" : "under";
    const txt = s === d ? `${s} ✓` : `${s}/${d}`;
    return `<td class="sum ${cls}" id="sum-${esc(g)}-${d}" title="${s === d ? "ตรงกับเวลานำชม" : s > d ? `เกิน ${s - d} นาที` : `ขาด ${d - s} นาที`}">${txt}</td>`;
  }
  function routesHtml() {
    const D = work.durations.length;
    return `
    <div class="card">
      <div class="card-head"><h2>เส้นทางนำชม</h2></div>
      <p class="hint">ใส่ <b>จำนวนนาที</b> ในช่องของจุดที่แวะ เว้นว่าง = ไม่แวะ (เหมือนตาราง ✓ ในสคริปต์) · ลำดับการเดินตามลำดับจุด เปลี่ยนลำดับได้ที่แท็บจุดนำชม · แถวล่างสุดคือเวลารวม ต้องเท่ากับเวลานำชม</p>
      <div class="table-scroll">
        <table class="route-table">
          <thead>
            <tr><th rowspan="2" class="stick">จุดนำชม</th>${work.groups.map((g) => `<th colspan="${D}" class="gh tone-${g.tone}">${esc(g.icon)} ${esc(g.name)}</th>`).join("")}</tr>
            <tr>${work.groups.map(() => work.durations.map((d) => `<th class="dh">${d} น.${d === work.fullDuration ? "<small>เต็ม</small>" : ""}</th>`).join("")).join("")}</tr>
          </thead>
          <tbody>
            ${work.stops.map((s) => `<tr>
              <th scope="row" class="stick"><span class="ref">${esc(s.ref)}</span>${esc(s.icon)} ${esc(s.name || "(ยังไม่มีชื่อ)")}<small>${esc(locLabel(s))}</small></th>
              ${work.groups.map((g) => work.durations.map((d) => {
                const v = work.routes[g.id][d][s.id];
                return `<td class="${v > 0 ? "on" : ""}"><input type="number" min="0" max="180" inputmode="numeric" aria-label="${esc(g.name)} ${d} นาที · ${esc(s.name)}" data-route="${esc(g.id)}|${d}|${esc(s.id)}" value="${v > 0 ? v : ""}" /></td>`;
              }).join("")).join("")}
            </tr>`).join("")}
          </tbody>
          <tfoot><tr><th class="stick">เวลารวม (นาที)</th>${work.groups.map((g) => work.durations.map((d) => sumCell(g.id, d)).join("")).join("")}</tr></tfoot>
        </table>
      </div>
    </div>`;
  }

  /* ---------- กลุ่มผู้เยี่ยมชม ---------- */
  function groupsHtml() {
    return `
    <div class="card-head outside"><h2>กลุ่มผู้เยี่ยมชม <span class="count">${work.groups.length}</span></h2>
      <button type="button" class="btn soft sm" data-act="addGroup">＋ เพิ่มกลุ่ม</button></div>
    <div class="group-edit-list">
    ${work.groups.map((g, i) => `
      <div class="card group-edit tone-edge-${g.tone}">
        <div class="card-head">
          <h3>${esc(g.icon)} ${esc(g.name || "(ยังไม่มีชื่อ)")}</h3>
          <span class="head-actions">
            <button type="button" class="btn ghost sm" data-act="gUp" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="เลื่อนขึ้น">▲</button>
            <button type="button" class="btn ghost sm" data-act="gDown" data-i="${i}" ${i === work.groups.length - 1 ? "disabled" : ""} aria-label="เลื่อนลง">▼</button>
            <button type="button" class="btn danger sm" data-act="delGroup" data-i="${i}">🗑 ลบกลุ่ม</button>
          </span>
        </div>
        <div class="grid g4">
          <label class="field span2"><span>ชื่อกลุ่ม</span><input data-gi="${i}" data-gf="name" value="${esc(g.name)}" /></label>
          <label class="field"><span>ไอคอน</span><input data-gi="${i}" data-gf="icon" value="${esc(g.icon)}" maxlength="8" /></label>
          <label class="field"><span>สี</span><select data-gi="${i}" data-gf="tone">${TONES.map((t) => `<option value="${t}" ${g.tone === t ? "selected" : ""}>${{ mint: "เขียวมิ้นต์", lavender: "ม่วงลาเวนเดอร์", peach: "ส้มพีช", butter: "เหลืองครีม", sky: "ฟ้า" }[t]}</option>`).join("")}</select></label>
        </div>
        <div class="grid g2">
          <label class="field"><span>ชื่อภาษาอังกฤษ</span><input data-gi="${i}" data-gf="en" value="${esc(g.en)}" /></label>
          <label class="field"><span>คำอธิบาย</span><input data-gi="${i}" data-gf="desc" value="${esc(g.desc)}" /></label>
        </div>
        <div class="grid g2">
          <label class="field"><span>ประเด็นที่ควรเน้น <small>(บรรทัดละ 1 ข้อ)</small></span><textarea data-gi="${i}" data-glines="focus" rows="4">${esc(linesVal(g.focus))}</textarea></label>
          <label class="field"><span>เคล็ดลับผู้นำชม <small>(บรรทัดละ 1 ข้อ)</small></span><textarea data-gi="${i}" data-glines="tips" rows="4">${esc(linesVal(g.tips))}</textarea></label>
        </div>
        <p class="hint">รหัสในลิงก์: <code>?g=${esc(g.id)}</code> · กลุ่มใหม่ต้องไปกำหนดนาทีในแท็บเส้นทาง</p>
      </div>`).join("")}
    </div>`;
  }

  /* ---------- เวลา & เตรียมการ ---------- */
  function settingsHtml() {
    return `
    <div class="grid g2 top">
      <div class="card">
        <div class="card-head"><h2>เวลานำชม</h2></div>
        <div class="dur-chips">
          ${work.durations.map((d) => `<span class="dur-chip">${d} นาที${d === work.fullDuration ? " · ฉบับเต็ม" : ""}
            <button type="button" data-act="delDur" data-d="${d}" aria-label="ลบ ${d} นาที" ${work.durations.length < 2 ? "disabled" : ""}>×</button></span>`).join("")}
        </div>
        <div class="inline-add">
          <input id="newDur" type="number" min="5" max="180" step="5" inputmode="numeric" placeholder="เช่น 60" aria-label="เพิ่มเวลานำชม (นาที)" />
          <button type="button" class="btn soft sm" data-act="addDur">＋ เพิ่มเวลา</button>
        </div>
        <label class="field"><span>ฉบับเต็ม (แสดงป้าย “ฉบับเต็ม”)</span>
          <select data-set="fullDuration">${work.durations.map((d) => `<option value="${d}" ${d === work.fullDuration ? "selected" : ""}>${d} นาที</option>`).join("")}</select></label>
        <p class="hint">เพิ่มเวลาใหม่แล้วไปใส่นาทีของแต่ละจุดในแท็บเส้นทาง · ลบเวลาจะลบเส้นทางของเวลานั้นทุกกลุ่ม</p>
      </div>
      <div class="card">
        <div class="card-head"><h2>เตรียมก่อนนำชม</h2></div>
        <label class="field"><span>รายการเช็กลิสต์ <small>(บรรทัดละ 1 ข้อ)</small></span>
          <textarea data-prep rows="7">${esc(linesVal(work.prep))}</textarea></label>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h2>ไฟล์สำรอง</h2></div>
      <p class="hint">ดาวน์โหลดข้อมูลทั้งหมดเก็บไว้ หรือนำเข้าไฟล์สำรองเพื่อแก้ไขต่อ (นำเข้าแล้วต้องกดบันทึกจึงจะขึ้นเว็บ)</p>
      <div class="row-actions">
        <button type="button" class="btn soft" data-act="export">⬇ ดาวน์โหลดไฟล์สำรอง (.json)</button>
        <label class="btn ghost file-btn">⬆ นำเข้าไฟล์สำรอง<input type="file" accept="application/json,.json" id="importFile" hidden /></label>
        <button type="button" class="btn ghost" data-act="resetDefault">↺ ใช้ข้อมูลตั้งต้น (สคริปต์ rev2)</button>
      </div>
    </div>`;
  }

  /* ---------- ประวัติ ---------- */
  function historyHtml() {
    if (demo) return `<div class="card empty-card">โหมดทดลองไม่มีประวัติ เชื่อมต่อ API แล้วทุกการบันทึกจะเก็บเป็นประวัติให้กู้คืนได้</div>`;
    if (!historyItems) return `<div class="card empty-card">กำลังโหลดประวัติ…</div>`;
    if (!historyItems.length) return `<div class="card empty-card">ยังไม่มีการบันทึก</div>`;
    return `
    <div class="card">
      <div class="card-head"><h2>ประวัติการแก้ไข</h2><button type="button" class="btn ghost sm" data-act="reloadHistory">⟳ โหลดใหม่</button></div>
      <p class="hint">กู้คืน = นำฉบับเก่ามาบันทึกเป็นฉบับล่าสุด (ฉบับปัจจุบันยังอยู่ในประวัติ กู้กลับได้)</p>
      <ol class="history">
        ${historyItems.map((h) => `<li class="${h.current ? "current" : ""}">
          <div><b>${esc(fmtDate(h.savedAt))}</b> · ${esc(h.editor)} ${h.current ? `<span class="pill ok">ฉบับปัจจุบัน</span>` : ""}
            <div class="muted">${esc(h.note || "—")}</div></div>
          ${h.current ? "" : `<button type="button" class="btn ghost sm" data-act="restore" data-row="${h.row}">↺ กู้คืนฉบับนี้</button>`}
        </li>`).join("")}
      </ol>
    </div>`;
  }
  async function loadHistory() {
    try {
      const r = await Content.call({ action: "history", pin });
      historyItems = r.items || [];
    } catch (e) { historyItems = []; toast(e.message); }
    if (tab === "history") render();
  }

  /* ================= แก้ไขข้อมูล ================= */
  const panel = $("#panel");

  panel.addEventListener("input", (e) => {
    const t = e.target;
    const s = work.stops[sel];
    if (t.dataset.f && s) {
      const f = t.dataset.f;
      if (f === "floor") s.floor = Math.max(1, Number(t.value) || 1);
      else if (f.startsWith("script.")) s.script[f.slice(7)] = t.value;
      else s[f] = t.value;
      $("#stopList").innerHTML = stopListHtml();
    } else if (t.dataset.lines && s) {
      s[t.dataset.lines] = t.value.split("\n");
    } else if (t.dataset.emph != null && s) {
      s.emphasis[t.dataset.emph] = t.value;
    } else if (t.dataset.link && s) {
      s.link = s.link || { label: "", url: "" };
      s.link[t.dataset.link] = t.value;
      if (!s.link.label && !s.link.url) delete s.link;
    } else if (t.dataset.route) {
      const [g, d, id] = t.dataset.route.split("|");
      const v = Math.max(0, Math.round(Number(t.value) || 0));
      if (v > 0) work.routes[g][d][id] = v; else delete work.routes[g][d][id];
      t.parentElement.classList.toggle("on", v > 0);
      $(`#sum-${CSS.escape(g)}-${d}`).outerHTML = sumCell(g, Number(d));
    } else if (t.dataset.gf) {
      work.groups[Number(t.dataset.gi)][t.dataset.gf] = t.value;
      if (t.dataset.gf === "tone" || t.dataset.gf === "icon" || t.dataset.gf === "name") {
        const h = t.closest(".group-edit").querySelector("h3");
        const g = work.groups[Number(t.dataset.gi)];
        h.textContent = `${g.icon} ${g.name || "(ยังไม่มีชื่อ)"}`;
        t.closest(".group-edit").className = `card group-edit tone-edge-${g.tone}`;
      }
    } else if (t.dataset.glines) {
      work.groups[Number(t.dataset.gi)][t.dataset.glines] = t.value.split("\n");
    } else if (t.hasAttribute("data-prep")) {
      work.prep = t.value.split("\n");
    } else if (t.dataset.set === "fullDuration") {
      work.fullDuration = Number(t.value);
      render();
    } else return;
    changed();
  });
  panel.addEventListener("change", (e) => {
    if (e.target.id === "importFile") importFile(e.target.files[0]);
  });

  panel.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const i = Number(b.dataset.i);
    const act = b.dataset.act;
    const swap = (list, a, c) => { [list[a], list[c]] = [list[c], list[a]]; };

    if (act === "sel") { sel = i; render(); if (matchMedia("(max-width: 900px)").matches) $("#stopForm").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (act === "up" && i > 0) { swap(work.stops, i, i - 1); if (sel === i) sel--; else if (sel === i - 1) sel++; }
    else if (act === "down" && i < work.stops.length - 1) { swap(work.stops, i, i + 1); if (sel === i) sel++; else if (sel === i + 1) sel--; }
    else if (act === "addStop") {
      const s = Content.normalize({ groups: work.groups, stops: [{ id: uid("s"), name: "", icon: "📍", building: "new", floor: 1, script: { th: "", en: "" } }] }).stops[0];
      work.stops.splice(sel + 1, 0, s);
      sel = Math.min(sel + 1, work.stops.length - 1);
      if (work.stops.length === 1) sel = 0;
      toast("เพิ่มจุดใหม่แล้ว อย่าลืมกำหนดนาทีในแท็บเส้นทาง");
    } else if (act === "dupStop") {
      const s = clone(work.stops[sel]);
      s.id = uid("s"); s.name = `${s.name} (สำเนา)`;
      work.stops.splice(sel + 1, 0, s);
      sel++;
      toast("ทำสำเนาแล้ว (สำเนายังไม่อยู่ในเส้นทางใด)");
    } else if (act === "delStop") {
      if (!armed(b)) return;
      const id = work.stops[sel].id;
      work.stops.splice(sel, 1);
      Object.values(work.routes).forEach((byD) => Object.values(byD).forEach((r) => delete r[id]));
      sel = Math.max(0, sel - 1);
      toast("ลบจุดนำชมแล้ว");
    } else if (act === "goRoutes") { tab = "routes"; render(); return; }
    else if (act === "addGroup") {
      const id = uid("g");
      work.groups.push({ id, name: "กลุ่มใหม่", en: "", icon: "👥", tone: TONES[work.groups.length % TONES.length], desc: "", focus: [], tips: [] });
      work.routes[id] = Object.fromEntries(work.durations.map((d) => [d, {}]));
      work.stops.forEach((s) => { s.emphasis[id] = ""; });
      toast("เพิ่มกลุ่มแล้ว อย่าลืมกำหนดเส้นทางในแท็บเส้นทาง");
    } else if (act === "gUp" && i > 0) swap(work.groups, i, i - 1);
    else if (act === "gDown" && i < work.groups.length - 1) swap(work.groups, i, i + 1);
    else if (act === "delGroup") {
      if (!armed(b)) return;
      const id = work.groups[i].id;
      work.groups.splice(i, 1);
      delete work.routes[id];
      work.stops.forEach((s) => { delete s.emphasis[id]; });
      toast("ลบกลุ่มแล้ว");
    } else if (act === "addDur") {
      const d = Math.round(Number($("#newDur").value));
      if (!(d > 0)) { toast("ใส่จำนวนนาทีก่อน"); return; }
      if (work.durations.includes(d)) { toast(`มี ${d} นาทีอยู่แล้ว`); return; }
      work.durations = [...work.durations, d].sort((a, c) => a - c);
      work.groups.forEach((g) => { work.routes[g.id][d] = {}; });
      toast(`เพิ่ม ${d} นาทีแล้ว ไปกำหนดเส้นทางในแท็บเส้นทาง`);
    } else if (act === "delDur") {
      if (!armed(b)) return;
      const d = Number(b.dataset.d);
      work.durations = work.durations.filter((x) => x !== d);
      work.groups.forEach((g) => { delete work.routes[g.id][d]; });
      if (work.fullDuration === d) work.fullDuration = work.durations[work.durations.length - 1];
    } else if (act === "export") { exportFile(); return; }
    else if (act === "resetDefault") {
      if (!armed(b)) return;
      work = Content.normalize(DEFAULT_CONTENT); sel = 0;
      toast("โหลดข้อมูลตั้งต้นแล้ว (ยังไม่ได้บันทึก)");
    } else if (act === "reloadHistory") { historyItems = null; render(); return; }
    else if (act === "restore") { if (armed(b)) restore(Number(b.dataset.row), b); return; }
    else return;
    work = Content.normalize(work);
    changed();
    render();
  });

  /* ================= ไฟล์สำรอง ================= */
  function exportFile() {
    const blob = new Blob([JSON.stringify(Content.normalize(work), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `kulib-tour-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importFile(f) {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const c = JSON.parse(r.result);
        if (!Array.isArray(c.stops) || !Array.isArray(c.groups)) throw new Error();
        work = Content.normalize(c); sel = 0;
        changed(); render();
        toast("นำเข้าไฟล์แล้ว ตรวจสอบแล้วกดบันทึก");
      } catch { toast("ไฟล์ไม่ถูกต้อง ต้องเป็นไฟล์สำรองจากหน้านี้"); }
    };
    r.readAsText(f);
  }

  /* ================= ดูตัวอย่าง / บันทึก / กู้คืน ================= */
  $("#previewBtn").onclick = () => {
    Content.draftSet(Content.normalize(work));
    const g = work.groups[0] ? work.groups[0].id : "";
    window.open(`./?draft=1&g=${encodeURIComponent(g)}&t=${work.fullDuration}`, "_blank", "noopener");
  };

  const dlg = $("#saveDlg");
  let force = false;
  $("#saveBtn").onclick = () => {
    force = false;
    $("#editorInput").value = store.get(NAME_KEY) || "";
    $("#noteInput").value = "";
    $("#saveMsg").textContent = "";
    const v = Content.validate(work);
    $("#saveWarn").hidden = !v.warnings.length;
    $("#saveWarn").textContent = v.warnings.length ? `มี ${v.warnings.length} ข้อควรตรวจ (เช่น ${v.warnings[0]}) — บันทึกได้ แต่ควรตรวจก่อน` : "";
    $("#saveConfirm").textContent = "บันทึก";
    dlg.showModal();
    ($("#editorInput").value ? $("#noteInput") : $("#editorInput")).focus();
  };
  $("#saveCancel").onclick = () => dlg.close();
  $("#saveForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const editor = $("#editorInput").value.trim();
    if (!editor) { $("#saveMsg").textContent = "กรุณาใส่ชื่อผู้แก้ไข"; return; }
    store.set(NAME_KEY, editor);
    const btn = $("#saveConfirm");
    btn.disabled = true; $("#saveMsg").className = "msg"; $("#saveMsg").textContent = "กำลังบันทึก…";
    const content = Content.normalize(work);
    try {
      const r = await Content.call({ action: "save", pin, content, editor, note: $("#noteInput").value.trim(), baseRow: meta.row || 0, force });
      server = content; work = clone(content);
      meta = { savedAt: r.savedAt, editor, row: r.row };
      store.del(WORK_KEY); Content.cacheSet(content); Content.draftClear();
      historyItems = null;
      dlg.close(); render();
      toast("บันทึกแล้ว เว็บนำชมใช้ข้อมูลใหม่ทันที ✓");
    } catch (err) {
      $("#saveMsg").className = "msg err";
      if (/บันทึกฉบับใหม่/.test(err.message)) {
        force = true;
        $("#saveMsg").textContent = `${err.message} — ถ้าบันทึกต่อ งานของคุณจะเป็นฉบับล่าสุด (ฉบับของอีกคนยังอยู่ในประวัติ)`;
        btn.textContent = "บันทึกทับ";
      } else $("#saveMsg").textContent = err.message;
    } finally { btn.disabled = false; }
  });

  async function restore(row, btn) {
    btn.disabled = true;
    try {
      const editor = store.get(NAME_KEY) || "แอดมิน";
      const r = await Content.call({ action: "restore", pin, row, editor });
      server = Content.normalize(r.content); work = clone(server);
      meta = { savedAt: r.savedAt, editor, row: r.row };
      store.del(WORK_KEY); Content.cacheSet(server);
      historyItems = null; sel = 0;
      render();
      toast("กู้คืนแล้ว เว็บนำชมใช้ฉบับนี้ทันที");
    } catch (e) { toast(e.message); btn.disabled = false; }
  }
})();
