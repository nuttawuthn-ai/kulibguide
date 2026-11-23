/*
 * ชั้นข้อมูลที่ใช้ร่วมกันระหว่างเว็บนำชม (index.html) และหน้าแอดมิน (admin.html)
 *  - แปลงข้อมูลที่แก้ไขได้ (DEFAULT_CONTENT / ข้อมูลจาก API) เป็นตัวแปรที่ app.js ใช้
 *  - ปรับข้อมูลรุ่นเก่า (มีแต่สำนักหอสมุด) ให้เป็นรุ่นที่มีหลายสถานที่โดยอัตโนมัติ
 *  - ตรวจความถูกต้องของข้อมูล
 *  - ดึงข้อมูลล่าสุดจาก Apps Script และเก็บสำเนาไว้ในเครื่องเพื่อใช้ออฟไลน์
 */

/* อาคาร: venue = สถานที่ที่อาคารนี้อยู่ · stepWords = คำบอกการขึ้นลงชั้น ("lift" = ลิฟต์/บันไดแบบสำนักหอสมุด) */
const BUILDINGS = {
  new: { th: "ตึกใหม่", full: "อาคารเทพรัตน์วิทยาโชติ (ตึกใหม่)", tone: "mint", venue: "library", stepWords: "lift" },
  old: { th: "ตึกเก่า", full: "อาคารช่วงเกษตรศิลปการ (ตึกเก่า)", tone: "peach", venue: "library", stepWords: "lift" },
  bridge: { th: "ทางเชื่อมอาคาร", full: "ทางเชื่อมระหว่างอาคาร", tone: "sky", venue: "library", stepWords: "lift" },
  history: { th: "หอประวัติ", full: "หอประวัติมหาวิทยาลัยเกษตรศาสตร์", tone: "butter", venue: "history", stepWords: "plain" },
};
const TONES = ["mint", "lavender", "peach", "butter", "sky"];
const PLACEHOLDER_MARKS = ["[รอบทพูด]", "[Script pending]"];
const MAX_IMAGES = 6; /* ภาพสูงสุดต่อจุด */
/* ลิงก์สำรองของภาพใน Google Drive (ใช้เมื่อลิงก์หลักโหลดไม่ขึ้น) */
const driveThumb = (id) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`;

/* ตัวแปรที่ app.js ใช้ (กำหนดค่าโดย Content.apply) */
let VENUES = {}, GROUPS = {}, STOPS = {}, ROUTES = {}, PREP = [], TRAVEL = { minutes: 7, th: "", en: "" };

const Content = (() => {
  const API_URL = ((window.KULIB_CONFIG && window.KULIB_CONFIG.apiUrl) || "").trim();
  const CACHE_KEY = "kulib-content";
  const DRAFT_KEY = "kulib-draft";

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };
  const readJson = (k) => { try { const v = store.get(k); return v ? JSON.parse(v) : null; } catch { return null; } };

  const arr = (v) => (Array.isArray(v) ? v : []);
  const str = (v) => (v == null ? "" : String(v));
  const lines = (v) => arr(v).map(str).map((s) => s.trim()).filter(Boolean);
  const nums = (v) => [...new Set(arr(v).map(Number).filter((n) => n > 0))].sort((a, b) => a - b);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const buildingsOf = (venueId) => Object.keys(BUILDINGS).filter((k) => BUILDINGS[k].venue === venueId);

  /* ข้อมูลรุ่นแรก (ยังไม่มี venues) → สำนักหอสมุดแห่งเดียว แล้วเติมสถานที่อื่นจากชุดตั้งต้น (ยังไม่เปิดแสดง) */
  function migrate(c) {
    if (Array.isArray(c.venues)) return c;
    const def = typeof DEFAULT_CONTENT !== "undefined" ? DEFAULT_CONTENT : { venues: [], stops: [], routes: {} };
    const libDef = arr(def.venues).find((v) => v.id === "library") || { id: "library", name: "สำนักหอสมุด", en: "KU Main Library", icon: "📚", desc: "" };
    const out = {
      ...c,
      venues: [{ ...libDef, published: true, durations: c.durations, fullDuration: c.fullDuration }],
      travel: def.travel,
      stops: arr(c.stops).map((s) => ({ ...s, venue: "library", ...(s.id === "closing" ? { closing: true } : {}) })),
      routes: { library: c.routes || {} },
    };
    const groupIds = arr(c.groups).map((g) => g.id);
    arr(def.venues).filter((v) => v.id !== "library").forEach((v) => {
      out.venues.push({ ...clone(v), published: false });
      arr(def.stops).filter((s) => s.venue === v.id).forEach((s) => {
        const copy = clone(s);
        copy.emphasis = Object.fromEntries(groupIds.map((g) => [g, str(s.emphasis && s.emphasis[g])]));
        out.stops.push(copy);
      });
      const r = (def.routes && def.routes[v.id]) || {};
      const sample = r[Object.keys(r)[0]] || {};
      out.routes[v.id] = Object.fromEntries(groupIds.map((g) => [g, clone(r[g] || sample)]));
    });
    return out;
  }

  /* เติมค่าที่ขาด ให้โครงสร้างครบเสมอ */
  function normalize(raw) {
    const c = migrate(raw && typeof raw === "object" ? raw : {});
    const groups = arr(c.groups).map((g) => ({
      id: str(g.id), name: str(g.name), en: str(g.en), icon: str(g.icon) || "👥",
      tone: TONES.includes(g.tone) ? g.tone : "mint", desc: str(g.desc),
      focus: lines(g.focus), tips: lines(g.tips),
    }));
    const venues = arr(c.venues).filter((v) => buildingsOf(str(v.id)).length).map((v) => {
      const durations = nums(v.durations);
      return {
        id: str(v.id), name: str(v.name), en: str(v.en), icon: str(v.icon) || "📍", desc: str(v.desc),
        published: v.published !== false, durations,
        fullDuration: durations.includes(Number(v.fullDuration)) ? Number(v.fullDuration) : durations[durations.length - 1] || 0,
      };
    });
    const venueIds = venues.map((v) => v.id);
    const stops = arr(c.stops).map((s) => {
      const venue = venueIds.includes(s.venue) ? s.venue : venueIds[0] || "library";
      const building = BUILDINGS[s.building] && BUILDINGS[s.building].venue === venue ? s.building : buildingsOf(venue)[0];
      const link = s.link && str(s.link.url).trim() ? { label: str(s.link.label) || str(s.link.url), url: str(s.link.url).trim() } : null;
      const out = {
        id: str(s.id), ref: str(s.ref), venue, name: str(s.name), en: str(s.en), icon: str(s.icon) || "📍",
        building, floor: Math.max(1, Number(s.floor) || 1),
        script: { th: str(s.script && s.script.th), en: str(s.script && s.script.en) },
        facts: lines(s.facts), notes: lines(s.notes),
        emphasis: Object.fromEntries(groups.map((g) => [g.id, str(s.emphasis && s.emphasis[g.id])])),
      };
      if (s.closing) out.closing = true;
      if (link) out.link = link;
      /* ภาพจุดนำชม: { src (https), caption, id (รหัสไฟล์ Google Drive ถ้าอัปโหลดผ่านหน้าแอดมิน) } */
      const images = arr(s.images)
        .map((im) => ({ src: str(im && im.src).trim(), caption: str(im && im.caption), id: str(im && im.id) }))
        .filter((im) => /^https:\/\//i.test(im.src))
        .slice(0, MAX_IMAGES)
        .map((im) => (im.id ? im : { src: im.src, caption: im.caption }));
      if (images.length) out.images = images;
      return out;
    });
    const routes = {};
    const src = c.routes && typeof c.routes === "object" ? c.routes : {};
    venues.forEach((v) => {
      routes[v.id] = {};
      const vs = src[v.id] || {};
      groups.forEach((g) => {
        routes[v.id][g.id] = {};
        v.durations.forEach((d) => {
          const r = (vs[g.id] && vs[g.id][d]) || {};
          routes[v.id][g.id][d] = {};
          stops.filter((s) => s.venue === v.id).forEach((s) => { const m = Number(r[s.id]); if (m > 0) routes[v.id][g.id][d][s.id] = Math.round(m); });
        });
      });
    });
    const t = c.travel || {};
    const travel = { minutes: Math.max(1, Math.round(Number(t.minutes) || 7)), th: str(t.th), en: str(t.en) };
    return { schema: 2, venues, travel, groups, prep: lines(c.prep), stops, routes };
  }

  const usedIn = (c, venueId, stopId, groupId) => {
    const v = c.venues.find((x) => x.id === venueId);
    return !!v && v.durations.some((d) => c.routes[venueId][groupId] && c.routes[venueId][groupId][d] && c.routes[venueId][groupId][d][stopId] > 0);
  };

  /* ตรวจข้อมูล: errors = ต้องแก้ก่อนบันทึก, warnings = ควรตรวจ */
  function validate(raw) {
    const c = normalize(raw);
    const errors = [], warnings = [];
    if (!c.groups.length) errors.push("ยังไม่มีกลุ่มผู้เยี่ยมชม");
    if (!c.venues.some((v) => v.published)) errors.push("ต้องเปิดแสดงบนเว็บนำชมอย่างน้อย 1 สถานที่");
    const dup = (list, what) => {
      const seen = new Set();
      list.forEach((x) => { if (!x.id) errors.push(`${what}ไม่มีรหัส`); else if (seen.has(x.id)) errors.push(`${what}รหัสซ้ำ: ${x.id}`); seen.add(x.id); });
    };
    dup(c.groups, "กลุ่ม"); dup(c.stops, "จุดนำชม");
    c.groups.forEach((g, i) => { if (!g.name.trim()) errors.push(`กลุ่มที่ ${i + 1} ยังไม่มีชื่อ`); });

    c.venues.forEach((v) => {
      const vn = v.name.trim() || v.id;
      /* สถานที่ที่ยังไม่เปิดแสดง: ปัญหาเส้นทางเป็นแค่ข้อควรตรวจ */
      const must = v.published ? errors : warnings;
      if (!v.name.trim()) errors.push(`สถานที่ ${v.id} ยังไม่มีชื่อ`);
      if (!v.durations.length) must.push(`${vn}: ยังไม่มีเวลานำชม`);
      if (!c.stops.some((s) => s.venue === v.id)) must.push(`${vn}: ยังไม่มีจุดนำชม`);
      c.groups.forEach((g) => v.durations.forEach((d) => {
        const r = c.routes[v.id][g.id][d];
        const n = Object.keys(r).length;
        const sum = Object.values(r).reduce((a, b) => a + b, 0);
        if (!n) must.push(`${vn} · ${g.name} ${d} นาที: ยังไม่มีจุดในเส้นทาง`);
        else if (sum !== d) warnings.push(`${vn} · ${g.name} ${d} นาที: รวม ${sum} นาที (${sum > d ? "เกิน" : "ขาด"} ${Math.abs(sum - d)} นาที)`);
      }));
    });

    c.stops.forEach((s, i) => {
      const nm = s.name.trim() || `จุดที่ ${i + 1}`;
      if (!s.name.trim()) errors.push(`จุดที่ ${i + 1} ยังไม่มีชื่อ`);
      if (!s.script.th.trim()) errors.push(`${nm}: ยังไม่มีบทพูดภาษาไทย`);
      else if (PLACEHOLDER_MARKS.some((m) => s.script.th.includes(m))) warnings.push(`${nm}: บทพูดภาษาไทยยังเป็นข้อความชั่วคราว`);
      if (!s.script.en.trim()) warnings.push(`${nm}: ยังไม่มีบทพูดภาษาอังกฤษ`);
      else if (PLACEHOLDER_MARKS.some((m) => s.script.en.includes(m))) warnings.push(`${nm}: บทพูดภาษาอังกฤษยังเป็นข้อความชั่วคราว`);
      if (s.link && !/^https?:\/\//i.test(s.link.url)) warnings.push(`${nm}: ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://`);
      c.groups.forEach((g) => { if (!s.emphasis[g.id].trim() && usedIn(c, s.venue, s.id, g.id)) warnings.push(`${nm}: ยังไม่มีประเด็นเน้นสำหรับ${g.name}`); });
      if (!c.groups.some((g) => usedIn(c, s.venue, s.id, g.id))) warnings.push(`${nm}: ไม่ได้อยู่ในเส้นทางใดเลย`);
    });
    if (c.venues.filter((v) => v.published).length > 1 && !c.travel.th.trim()) warnings.push("การเดินทางระหว่างสถานที่: ยังไม่มีบทพูดภาษาไทย");
    return { errors, warnings, content: c };
  }

  /* ใช้ได้จริงไหม (สำหรับข้อมูลจาก API/แคช) — ไม่ผ่าน = ใช้ข้อมูลสำรองแทน */
  const usable = (raw) => { try { return validate(raw).errors.length === 0; } catch { return false; } };

  /* แปลงเป็นตัวแปรที่ app.js ใช้ */
  function apply(raw) {
    const c = normalize(raw);
    PREP = c.prep;
    TRAVEL = c.travel;
    VENUES = Object.fromEntries(c.venues.map(({ id, ...v }) => [id, v]));
    GROUPS = Object.fromEntries(c.groups.map(({ id, ...g }) => [id, g]));
    STOPS = Object.fromEntries(c.stops.map(({ id, ...s }) => [id, s]));
    ROUTES = Object.fromEntries(c.venues.map((v) => [v.id, Object.fromEntries(c.groups.map((g) => [g.id, Object.fromEntries(v.durations.map((d) => [d,
      c.stops.filter((s) => s.venue === v.id && c.routes[v.id][g.id][d][s.id] > 0).map((s) => [s.id, c.routes[v.id][g.id][d][s.id]])]))]))]));
    return c;
  }

  const key = (c) => (c ? JSON.stringify(normalize(c)) : "");

  /* เรียก API */
  async function call(payload, timeoutMs = 20000) {
    if (!API_URL) throw new Error("ยังไม่ได้ตั้งค่า apiUrl ในไฟล์ config.js");
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = payload
        ? await fetch(API_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" }, signal: ctl.signal })
        : await fetch(`${API_URL}${API_URL.includes("?") ? "&" : "?"}action=content&t=${Date.now()}`, { signal: ctl.signal, cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      return data;
    } catch (e) {
      if (e.name === "AbortError") throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ทันเวลา ลองใหม่อีกครั้ง");
      throw e;
    } finally { clearTimeout(t); }
  }

  /* ข้อมูลล่าสุดจากเซิร์ฟเวอร์ (null = ยังไม่มีข้อมูลบนเซิร์ฟเวอร์ หรือเชื่อมต่อไม่ได้) */
  async function fetchRemote(timeoutMs) {
    if (!API_URL) return null;
    try {
      const data = await call(null, timeoutMs);
      return data.content && usable(data.content) ? data.content : null;
    } catch { return null; }
  }

  return {
    API_URL, normalize, validate, usable, apply, key, call, fetchRemote, buildingsOf, PLACEHOLDER_MARKS,
    cacheGet: () => { const c = readJson(CACHE_KEY); return c && usable(c) ? c : null; },
    cacheSet: (c) => store.set(CACHE_KEY, JSON.stringify(c)),
    draftGet: () => { const c = readJson(DRAFT_KEY); return c && usable(c) ? c : null; },
    draftSet: (c) => store.set(DRAFT_KEY, JSON.stringify(c)),
    draftClear: () => store.del(DRAFT_KEY),
  };
})();
