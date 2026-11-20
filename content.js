/*
 * ชั้นข้อมูลที่ใช้ร่วมกันระหว่างเว็บนำชม (index.html) และหน้าแอดมิน (admin.html)
 *  - แปลงข้อมูลที่แก้ไขได้ (DEFAULT_CONTENT / ข้อมูลจาก API) เป็นตัวแปรที่ app.js ใช้
 *  - ตรวจความถูกต้องของข้อมูล
 *  - ดึงข้อมูลล่าสุดจาก Apps Script และเก็บสำเนาไว้ในเครื่องเพื่อใช้ออฟไลน์
 */

const BUILDINGS = {
  new: { th: "ตึกใหม่", full: "อาคารเทพรัตน์วิทยาโชติ (ตึกใหม่)", tone: "mint" },
  old: { th: "ตึกเก่า", full: "อาคารช่วงเกษตรศิลปการ (ตึกเก่า)", tone: "peach" },
  bridge: { th: "ทางเชื่อมอาคาร", full: "ทางเชื่อมระหว่างอาคาร", tone: "sky" },
};
const TONES = ["mint", "lavender", "peach", "butter", "sky"];

/* ตัวแปรที่ app.js ใช้ (กำหนดค่าโดย Content.apply) */
let DURATIONS = [], FULL_DURATION = 0, GROUPS = {}, STOPS = {}, ROUTES = {}, PREP = [];

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

  /* เติมค่าที่ขาด ให้โครงสร้างครบเสมอ */
  function normalize(c) {
    c = c && typeof c === "object" ? c : {};
    const durations = [...new Set(arr(c.durations).map(Number).filter((n) => n > 0))].sort((a, b) => a - b);
    const groups = arr(c.groups).map((g) => ({
      id: str(g.id), name: str(g.name), en: str(g.en), icon: str(g.icon) || "👥",
      tone: TONES.includes(g.tone) ? g.tone : "mint", desc: str(g.desc),
      focus: lines(g.focus), tips: lines(g.tips),
    }));
    const stops = arr(c.stops).map((s) => {
      const link = s.link && str(s.link.url).trim() ? { label: str(s.link.label) || str(s.link.url), url: str(s.link.url).trim() } : null;
      const out = {
        id: str(s.id), ref: str(s.ref), name: str(s.name), en: str(s.en), icon: str(s.icon) || "📍",
        building: BUILDINGS[s.building] ? s.building : "new", floor: Math.max(1, Number(s.floor) || 1),
        script: { th: str(s.script && s.script.th), en: str(s.script && s.script.en) },
        facts: lines(s.facts), notes: lines(s.notes),
        emphasis: Object.fromEntries(groups.map((g) => [g.id, str(s.emphasis && s.emphasis[g.id])])),
      };
      if (link) out.link = link;
      return out;
    });
    const routes = {};
    const src = c.routes && typeof c.routes === "object" ? c.routes : {};
    groups.forEach((g) => {
      routes[g.id] = {};
      durations.forEach((d) => {
        const r = (src[g.id] && src[g.id][d]) || {};
        routes[g.id][d] = {};
        stops.forEach((s) => { const m = Number(r[s.id]); if (m > 0) routes[g.id][d][s.id] = m; });
      });
    });
    const full = durations.includes(Number(c.fullDuration)) ? Number(c.fullDuration) : durations[durations.length - 1] || 0;
    return { schema: 1, durations, fullDuration: full, groups, prep: lines(c.prep), stops, routes };
  }

  /* ตรวจข้อมูล: errors = ต้องแก้ก่อนบันทึก, warnings = ควรตรวจ */
  function validate(raw) {
    const c = normalize(raw);
    const errors = [], warnings = [];
    if (!c.durations.length) errors.push("ยังไม่มีเวลานำชม");
    if (!c.groups.length) errors.push("ยังไม่มีกลุ่มผู้เยี่ยมชม");
    if (!c.stops.length) errors.push("ยังไม่มีจุดนำชม");
    const dup = (list, what) => {
      const seen = new Set();
      list.forEach((x) => { if (!x.id) errors.push(`${what}ไม่มีรหัส`); else if (seen.has(x.id)) errors.push(`${what}รหัสซ้ำ: ${x.id}`); seen.add(x.id); });
    };
    dup(c.groups, "กลุ่ม"); dup(c.stops, "จุดนำชม");
    c.groups.forEach((g, i) => { if (!g.name.trim()) errors.push(`กลุ่มที่ ${i + 1} ยังไม่มีชื่อ`); });
    c.stops.forEach((s, i) => {
      const nm = s.name.trim() || `จุดที่ ${i + 1}`;
      if (!s.name.trim()) errors.push(`จุดที่ ${i + 1} ยังไม่มีชื่อ`);
      if (!s.script.th.trim()) errors.push(`${nm}: ยังไม่มีบทพูดภาษาไทย`);
      if (!s.script.en.trim()) warnings.push(`${nm}: ยังไม่มีบทพูดภาษาอังกฤษ`);
      if (s.link && !/^https?:\/\//i.test(s.link.url)) warnings.push(`${nm}: ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://`);
      c.groups.forEach((g) => { if (!s.emphasis[g.id].trim() && usedBy(c, s.id, g.id)) warnings.push(`${nm}: ยังไม่มีประเด็นเน้นสำหรับ${g.name}`); });
      if (!c.groups.some((g) => usedBy(c, s.id, g.id))) warnings.push(`${nm}: ไม่ได้อยู่ในเส้นทางใดเลย`);
    });
    c.groups.forEach((g) => c.durations.forEach((d) => {
      const r = c.routes[g.id][d];
      const n = Object.keys(r).length;
      const sum = Object.values(r).reduce((a, b) => a + b, 0);
      if (!n) errors.push(`${g.name} ${d} นาที: ยังไม่มีจุดในเส้นทาง`);
      else if (sum !== d) warnings.push(`${g.name} ${d} นาที: รวม ${sum} นาที (${sum > d ? "เกิน" : "ขาด"} ${Math.abs(sum - d)} นาที)`);
    }));
    return { errors, warnings, content: c };
  }
  function usedBy(c, stopId, groupId) { return c.durations.some((d) => c.routes[groupId] && c.routes[groupId][d] && c.routes[groupId][d][stopId] > 0); }

  /* ใช้ได้จริงไหม (สำหรับข้อมูลจาก API/แคช) — ไม่ผ่าน = ใช้ข้อมูลสำรองแทน */
  const usable = (raw) => { try { return validate(raw).errors.length === 0; } catch { return false; } };

  /* แปลงเป็นตัวแปรที่ app.js ใช้ */
  function apply(raw) {
    const c = normalize(raw);
    DURATIONS = c.durations;
    FULL_DURATION = c.fullDuration;
    PREP = c.prep;
    GROUPS = Object.fromEntries(c.groups.map(({ id, ...g }) => [id, g]));
    STOPS = Object.fromEntries(c.stops.map(({ id, ...s }) => [id, s]));
    ROUTES = Object.fromEntries(c.groups.map((g) => [g.id, Object.fromEntries(c.durations.map((d) => [d,
      c.stops.filter((s) => c.routes[g.id][d][s.id] > 0).map((s) => [s.id, c.routes[g.id][d][s.id]])]))]));
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
    API_URL, normalize, validate, usable, apply, key, call, fetchRemote,
    cacheGet: () => { const c = readJson(CACHE_KEY); return c && usable(c) ? c : null; },
    cacheSet: (c) => store.set(CACHE_KEY, JSON.stringify(c)),
    draftGet: () => { const c = readJson(DRAFT_KEY); return c && usable(c) ? c : null; },
    draftSet: (c) => store.set(DRAFT_KEY, JSON.stringify(c)),
    draftClear: () => store.del(DRAFT_KEY),
  };
})();
