/*
 * ข้อมูลบทนำชม สำนักหอสมุด มหาวิทยาลัยเกษตรศาสตร์
 * ที่มา: Script สำหรับการนำชม (ฉบับเต็ม 45 นาที) — 20260815-script-visitor-full-45mins.docx
 * ------------------------------------------------------------
 * แก้ไขเนื้อหาได้ที่ไฟล์นี้ไฟล์เดียว
 *  - BUILDINGS : อาคาร
 *  - GROUPS    : กลุ่มผู้เยี่ยมชม
 *  - PREP      : สิ่งที่ต้องเตรียมก่อนนำชม
 *  - STOPS     : จุดนำชม
 *       building/floor : ตำแหน่ง (ใช้คำนวณคำแนะนำการเดินอัตโนมัติ)
 *       script.th / script.en : บทพูด (ย่อหน้าคั่นด้วย \n\n)
 *       facts    : ตัวเลข/ข้อมูลสำคัญ
 *       notes    : หมายเหตุสำหรับผู้นำชม (ท่าทาง จุดยืน เกร็ดความรู้)
 *       emphasis : ประเด็นที่ควรเน้นแยกตามกลุ่ม
 *  - ROUTES    : เส้นทางของแต่ละกลุ่ม × เวลา  [รหัสจุด, นาที]
 *                ลำดับเป็นไปตามเส้นทางจริง ผลรวมนาทีเท่ากับเวลานำชม (รวมเวลาเดินแล้ว)
 */

const DURATIONS = [15, 30, 45, 60];

const BUILDINGS = {
  new: { th: "ตึกใหม่", full: "อาคารเทพรัตน์วิทยาโชติ (ตึกใหม่)", tone: "mint" },
  old: { th: "ตึกเก่า", full: "อาคารช่วงฯ (ตึกเก่า)", tone: "peach" },
  bridge: { th: "ทางเชื่อมอาคาร", full: "ทางเชื่อมระหว่างอาคาร", tone: "sky" },
};

const GROUPS = {
  exec: {
    name: "ผู้บริหาร",
    en: "Executives & VIP",
    icon: "🏛️",
    tone: "lavender",
    desc: "ผู้บริหาร แขกผู้มีเกียรติ คณะศึกษาดูงาน",
    focus: ["Green Library & การประหยัดพลังงาน", "มาตรฐาน ISO 14001 / ISO 9001", "นวัตกรรมพื้นที่และบริการ", "เครือข่ายความร่วมมือ"],
    tips: [
      "เปิดด้วยรางวัลและมาตรฐาน: Green Library แห่งแรกของไทย, Thailand Energy Award 2025, ISO 14001 และ ISO 9001",
      "ใช้เวลาที่ระบบคุณภาพอากาศ (ชั้น 4) ให้มากขึ้น เพราะเป็นตัวอย่างการจัดการพลังงานที่จับต้องได้",
      "ถ้าคณะเพิ่งมาจากหอประวัติ ไม่ต้องอธิบายความหมายของคำว่า Kasetsart",
    ],
  },
  student: {
    name: "นิสิต/นักศึกษา",
    en: "Students",
    icon: "🎓",
    tone: "mint",
    desc: "นิสิตใหม่ นักศึกษาจากสถาบันอื่น นักเรียน",
    focus: ["พื้นที่และอุปกรณ์ที่ใช้ได้ทันที", "การจองห้อง/อุปกรณ์ผ่านเว็บไซต์", "เวลาเปิดบริการช่วงสอบ", "AI Corner และบริการบรรณารักษ์"],
    tips: [
      "ชวนเปิดเว็บไซต์ห้องสมุดดูการจองห้อง/อุปกรณ์จริงระหว่างเดิน",
      "เน้นบริการที่ใช้ได้ฟรี: ยืม Laptop/Tablet, บอร์ดเกม, Theatre Room, AI Tools รุ่น Premium",
      "บอกเวลาเปิดช่วงสอบ (ไฟนอลเปิด 24 ชม. 3 สัปดาห์) และการใช้ห้องประชุม/Makerspace สำหรับชมรม",
    ],
  },
  public: {
    name: "ประชาชนทั่วไป",
    en: "General Public",
    icon: "🌿",
    tone: "peach",
    desc: "ประชาชน ผู้ปกครอง ชุมชน นักท่องเที่ยว",
    focus: ["เรื่องเล่าและความหมายของชื่อ", "ห้องสมุดสีเขียวที่จับต้องได้", "Eco-Library สำหรับทุกคนในครอบครัว", "ห้องสมุดในสวน"],
    tips: [
      "เล่าแบบชวนคุย ใช้คำถามให้ทาย เช่น ตู้บัตรรายการ เก้าอี้จากยางรถยนต์ เคาน์เตอร์จากเศษพลาสติก",
      "ผู้เยี่ยมชมสูงวัยมักรู้จักตู้ Card Catalog ให้ชวนเล่าความทรงจำ",
      "ดูแลผู้สูงอายุ/เด็ก ใช้ลิฟต์แทนบันไดเมื่อจำเป็น และเดินในจังหวะที่สบาย",
    ],
  },
};

const PREP = [
  "หูฟังสำหรับผู้เยี่ยมชม (แจกที่จุดเริ่มต้น ตึกใหม่ ชั้น 1)",
  "QR Code แบบประเมินความพึงพอใจ",
  "ตรวจสอบว่า Theatre Room ว่างหรือไม่ (เพื่อพาเข้าไปชมด้านใน)",
  "จุดถ่ายภาพหมู่: บันไดหน้าอาคารตึกใหม่",
];

const STOPS = {
  intro: {
    name: "Introduction & ภาพรวมห้องสมุด",
    en: "Introduction & Overview",
    building: "new", floor: 1,
    icon: "👋",
    script: {
      th: "ยินดีต้อนรับสู่สำนักหอสมุด มหาวิทยาลัยเกษตรศาสตร์ (แนะนำตัว) เราจะใช้เวลาเดินชมห้องสมุดประมาณ 40 นาที เพื่อแนะนำบริการและสิ่งอำนวยความสะดวกที่เราจัดให้กับนิสิต นักวิจัย และบุคลากรของ มก.\n\nนอกจากบริการแล้ว ท่านจะได้เห็นตัวอย่างการดำเนินงานที่เป็นมิตรกับสิ่งแวดล้อมและการอนุรักษ์พลังงานของเรา\n\nสำนักหอสมุด มก. เป็น Green Library แห่งแรกของประเทศไทย ได้รับการรับรองเป็นสำนักงานสีเขียว (Green Office) และได้รับรางวัล Thailand Energy Award 2025 และล่าสุดได้รับการรับรองมาตรฐานสากล ISO 14001 ระบบการจัดการสิ่งแวดล้อม และ ISO 9001 ระบบบริหารงานคุณภาพ\n\nห้องสมุดมี 2 อาคาร อาคารที่เรายืนอยู่คือตึกใหม่ ชื่อ \"อาคารเทพรัตน์วิทยาโชติ\" แปลว่า \"อาคารที่รุ่งเรืองด้วยความรู้\" มี 5 ชั้น ไม่มีหนังสือ แต่เป็นพื้นที่และสิ่งอำนวยความสะดวก ส่วนทรัพยากรสิ่งพิมพ์ทั้งหมดอยู่ที่ตึกเก่า",
      en: "Welcome to Kasetsart University Main Library. (Introduce yourself.) We will spend about 40 minutes walking around the library, and I'll show you the services and facilities that we provide for KU students, researchers and staff.\n\nBeyond our services and facilities, you will also see examples of how we are committed to environmentally friendly practices and energy conservation.\n\nKU Library is Thailand's first Green Library, officially certified as a Green Office, and won the Thailand Energy Award 2025. Recently, KU Library obtained international certifications for ISO 14001 Environmental Management System and ISO 9001 Quality Management System.\n\nThe library has 2 buildings. This is the new building, called \"เทพรัตน์วิทยาโชติ\". The name means \"A Building Where Knowledge Grows\". It has 5 floors with no books — it provides facilities. All printed materials are housed in the old building.",
    },
    facts: ["Green Library แห่งแรกของไทย", "Thailand Energy Award 2025", "ISO 14001 · ISO 9001", "2 อาคาร · ตึกใหม่ 5 ชั้น"],
    notes: [
      "แจกหูฟังให้ผู้เยี่ยมชมก่อนเริ่ม",
      "Tips: \"อาคารเทพรัตน์วิทยาโชติ\" เป็นชื่อพระราชทานจากสมเด็จพระเทพฯ แปลว่า \"อาคารที่รุ่งเรืองด้วยความรู้\"",
    ],
    emphasis: {
      exec: "เน้นรางวัลและมาตรฐานที่ได้รับ เป็นภาพรวมความสำเร็จขององค์กร",
      student: "บอกว่าตึกใหม่เป็นพื้นที่ทำงาน/อ่านหนังสือ ส่วนหนังสืออยู่ตึกเก่า",
      public: "เล่าความหมายของชื่ออาคาร และแนวคิดห้องสมุดสีเขียว",
    },
  },
  learning: {
    name: "New Learning Space",
    en: "New Learning Space",
    building: "new", floor: 1,
    icon: "🪴",
    script: {
      th: "นี่คือพื้นที่การเรียนรู้ที่เพิ่งปรับปรุงใหม่ ได้แรงบันดาลใจจากนิสิต มก. เพราะห้องสมุดเปิดประกวดแบบ และแบบที่ชนะได้รับการปรับโดยคณะสถาปัตยกรรมศาสตร์ มก. ให้ใช้งานได้จริงและถูกต้องตามกฎหมายอาคาร\n\nมีทั้งหมด 4 พื้นที่\n• Learning Space – ที่นั่งหลายรูปแบบ ตั้งแต่ที่นั่งเดี่ยวสำหรับอ่านเงียบ ๆ โต๊ะกลุ่มเล็ก โต๊ะประชุม ไปจนถึงพื้นที่สำหรับกลุ่มใหญ่\n• Meeting Space – สำหรับประชุมและทำงานร่วมกัน ผนังกระจกให้ความรู้สึกเปิดโล่ง โต๊ะปรับระดับได้สำหรับผู้ใช้วีลแชร์ และหน้าโต๊ะใช้เป็นไวท์บอร์ดได้\n• Exhibition Space – พื้นที่จัดนิทรรศการและกิจกรรมวิชาการ เช่น คณะสถาปัตยกรรมศาสตร์จัดแสดงงานออกแบบผลิตภัณฑ์ของนิสิต หรือชมรมถ่ายภาพจัดแสดงภาพและให้ผู้ชมโหวต\n• Makerspace – ส่งเสริมการเรียนรู้ผ่านการลงมือทำ เช่น เวิร์กช็อปทำบานอฟฟี่ที่นำโดยนิสิตที่ทำขายจริง\n\nชมรมนิสิตขอใช้ห้องประชุมและ Makerspace ได้ โดยส่งหนังสือแจ้งล่วงหน้า\n\nห้องสมุดมี Laptop และ Tablet ให้ยืมใช้ภายในอาคาร รวม 200 เครื่อง และมีคอมพิวเตอร์ตั้งโต๊ะ 100 เครื่อง โดยต้องจองก่อนใช้งาน ตรวจสอบและจองได้ทางเว็บไซต์ห้องสมุด",
      en: "This is the newly renovated learning space. It was inspired by KU students, as the library opened a design competition. The winning design was refined by the Faculty of Architecture at KU to make it practical and compliant with construction laws.\n\nThere are 4 spaces:\n• Learning Space – the seating supports different ways of working: individual seats for focused study, small-group workspaces, meeting tables for discussions, and larger collaborative areas.\n• Meeting Space – for meetings, group discussions and collaborative learning. Its flexible layout and glass walls create an open, welcoming environment. The table height can be adjusted for wheelchair users, and the tabletop can be used as a whiteboard.\n• Exhibition Space – an open area for exhibitions, creative works and academic events. For example, the Faculty of Architecture may display students' product design projects, or the KU Photography Club may display photographs and invite visitors to vote.\n• Makerspace – promotes hands-on learning, innovation and creativity. We recently held a Banoffee-making workshop, led by a KU student who actually makes and sells Banoffee as a business.\n\nStudent clubs are welcome to use the meeting room and makerspace — just send us an official letter in advance.\n\nThe library provides laptops and tablets for use within the building — 200 devices in total — and 100 desktop PCs. Students book devices before use via the library website.",
    },
    facts: ["4 พื้นที่: Learning · Meeting · Exhibition · Makerspace", "Laptop/Tablet 200 เครื่อง", "PC 100 เครื่อง", "จองผ่านเว็บไซต์"],
    notes: [
      "ตอนพูดถึง PC ให้ชี้ไปทางห้อง PC",
      "จบจุดนี้ ขึ้นลิฟต์ไปชั้น 4",
    ],
    emphasis: {
      exec: "การมีส่วนร่วมของนิสิตในการออกแบบ และความร่วมมือกับคณะสถาปัตยกรรมศาสตร์",
      student: "การยืม Laptop/Tablet การจองผ่านเว็บไซต์ และการขอใช้ห้องสำหรับชมรม",
      public: "พื้นที่ที่ออกแบบโดยนิสิต และโต๊ะที่รองรับผู้ใช้วีลแชร์",
    },
  },
  roof: {
    name: "The Edible Roof · พื้นที่อ่านหนังสือกลางแจ้ง",
    en: "The Edible Roof (Outdoor Reading Area)",
    building: "new", floor: 4,
    icon: "🥬",
    script: {
      th: "พื้นที่นี้เรียกว่า \"The Edible Roof\" เพราะพืชส่วนใหญ่ที่เห็นกินได้ ทั้งผักสวนครัวและสมุนไพร\n\nริเริ่มโดยคณะสถาปัตยกรรมศาสตร์ มก. เพื่อแสดงให้เห็นว่าแม้อยู่กลางเมืองและบนอาคารแบบนี้ ก็ยังปลูกพืชและทำเกษตรในเมืองได้\n\nเรายังใช้พื้นที่นี้สำหรับรับรองแขกและจัดกิจกรรมด้วย",
      en: "This area is called \"The Edible Roof\" because most of the plants you see are edible, such as kitchen-garden vegetables and herbs.\n\nIt was initiated by the Faculty of Architecture at Kasetsart University to demonstrate that even in the heart of the city, and on buildings like this, planting and urban cultivation are still possible.\n\nWe also use this area for receptions and activities.",
    },
    facts: ["ผักสวนครัว · สมุนไพร", "Urban farming"],
    notes: ["ทางออกอยู่ที่ประตูข้างลิฟต์ ชั้น 4"],
    emphasis: {
      exec: "ตัวอย่างความร่วมมือกับคณะ และพื้นที่รับรองแขก",
      student: "มุมอ่านหนังสือกลางแจ้งที่ใช้ได้",
      public: "เกษตรในเมือง ไอเดียปลูกผักที่บ้าน",
    },
  },
  air: {
    name: "ชั้น 4 · ระบบบริหารจัดการคุณภาพอากาศ",
    en: "Reading Floor & CO₂ Air-Quality System",
    building: "new", floor: 4,
    icon: "🌬️",
    script: {
      th: "ชั้น 4 เป็นพื้นที่อ่านหนังสือ ส่วนใหญ่เป็นโต๊ะกลุ่มสำหรับพูดคุย เป็นชั้นที่นิสิตนิยมที่สุด เราเดาว่าเพราะไม่มีเจ้าหน้าที่ประจำชั้นนี้ ช่วงสอบคนจะแน่นมาก เราจึงใส่ใจเรื่องคุณภาพอากาศ\n\nเราใช้ระบบตรวจวัด CO₂ แบบเรียลไทม์ หากค่าเกินมาตรฐาน ระบบจะแจ้งเตือนทีมบริหารอาคารอัตโนมัติ เพื่อดำเนินการทันที\n\nขั้นแรกคือนำเครื่องฟอกอากาศแบบเคลื่อนที่มาเพิ่ม หากยังสูงอยู่ จะแลกเปลี่ยนอากาศระหว่างภายในและภายนอก\n\nแต่อากาศภายนอกค่อนข้างร้อน การนำเข้ามาโดยตรงจะเพิ่มภาระเครื่องปรับอากาศ ใช้พลังงานและค่าไฟมากขึ้น เราจึงลดอุณหภูมิอากาศภายนอกก่อนนำเข้าอาคาร โดยใช้น้ำเย็นที่นำกลับมาจากระบบทำความเย็น ลดอุณหภูมิได้ประมาณ 4–6 องศาเซลเซียส\n\nนี่คือตัวอย่างหนึ่งของ Green Library ที่แสดงความมุ่งมั่นด้านประสิทธิภาพพลังงานและการอนุรักษ์สิ่งแวดล้อม",
      en: "The 4th floor is a reading area, mainly featuring group tables for discussion. It's the most popular floor for KU students — we guess it's because there is no library staff on this floor. It's fully crowded, especially during exams, so we are concerned about the air quality here.\n\nWe use a real-time CO₂ monitoring system to ensure good indoor air quality. If the CO₂ level rises above the standard, a notification is automatically sent to the building management team, who take immediate action.\n\nThe first step is to bring additional portable air purifiers into the area. If the level remains high, we proceed with air exchange between indoors and outdoors.\n\nHowever, the outdoor air is quite hot. Bringing it directly into the building would increase the workload of the air-conditioning system, leading to higher energy consumption and electricity costs. To address this, we cool the outdoor air before bringing it in, using chilled water recovered from the cooling system. This reduces the air temperature by approximately 4–6 °C.\n\nThis is one practical example of our Green Library initiatives, demonstrating our commitment to energy efficiency and environmental conservation.",
    },
    facts: ["วัด CO₂ แบบเรียลไทม์", "แจ้งเตือนทีมอาคารอัตโนมัติ", "ลดอุณหภูมิอากาศเข้า 4–6 °C"],
    notes: ["ยืนอธิบายตรงเครื่องวัด CO₂"],
    emphasis: {
      exec: "ระบบจัดการพลังงานและผลด้านค่าใช้จ่าย — ใช้เวลาจุดนี้ให้มาก",
      student: "ชั้นยอดนิยมช่วงสอบ และการดูแลอากาศให้ผู้ใช้",
      public: "อธิบายง่าย ๆ ว่าห้องสมุดประหยัดไฟอย่างไร",
    },
  },
  agrohub: {
    name: "Agro Hub ศูนย์ความรู้ด้านการเกษตร",
    en: "Agro Hub – Smart Agricultural Activities Center",
    building: "new", floor: 3,
    icon: "🌾",
    script: {
      th: "ทราบไหมว่าชื่อ \"เกษตรศาสตร์\" แปลว่าอะไร \"เกษตร\" คือการเกษตร \"ศาสตร์\" คือความรู้ รวมกันคือ \"ความรู้ด้านการเกษตร\" แรกเริ่ม มก. มีเพียงคณะด้านการเกษตร แต่วันนี้ครอบคลุมเกือบทุกสาขาทั้งวิทยาศาสตร์และสังคมศาสตร์ เปิดโรงเรียนแพทย์เมื่อ 2 ปีก่อน ปีที่แล้วเปิดโรงเรียนพยาบาล และปีนี้เปิดคณะเภสัชศาสตร์\n\nAgro Hub คือศูนย์กิจกรรมการเกษตรอัจฉริยะ ให้เข้าถึงแหล่งความรู้ด้านการเกษตร โดยมีบรรณารักษ์เฉพาะสาขาและผู้เชี่ยวชาญของ มก. สนับสนุน\n\nเป็นพื้นที่กิจกรรมแบบไฮบริด จัดกิจกรรมได้ทั้งออนไลน์และในสถานที่พร้อมกัน และมีนิทรรศการที่เชื่อมกับนิทรรศการเสมือนจริง (Virtual Exhibition) เข้าถึงผลงานวิจัยของ มก. และแหล่งสารสนเทศได้ง่าย",
      en: "Do you know the meaning of the university name, \"Kasetsart\"? \"Kaset\" means agriculture and \"Sart\" means knowledge — so \"Kasetsart\" means \"Knowledge about Agriculture\". At the very beginning, Kasetsart University only had faculties related to agriculture. Today we cover almost every field, in both the sciences and social sciences. We opened our School of Medicine two years ago, added the School of Nursing last year, and this year we are opening the Faculty of Pharmaceutical Sciences.\n\nAgro Hub is a Smart Agricultural Activities Center that provides access to agricultural knowledge resources, supported by subject librarians and KU experts.\n\nIt is a hybrid activity space, offering online and on-site events at the same time. The area also features exhibitions connected to a Virtual Exhibition, giving easy access to KU's research insights and a wide range of information resources.",
    },
    facts: ["Kaset = เกษตร · Sart = ความรู้", "กิจกรรมแบบ Hybrid", "Virtual Exhibition"],
    notes: [
      "ยืนหน้า Agro Hub ถามความหมายของ \"Kasetsart\" ก่อน",
      "ถ้าคณะเพิ่งมาจากหอประวัติ ไม่ต้องบอกความหมายของ Kasetsart",
      "พาเดินไปด้านขวา ให้มองผ่านกระจกเข้าไปในห้อง Agro Hub",
    ],
    link: { label: "Virtual Exhibition (lib.ku.ac.th/vr)", url: "https://lib.ku.ac.th/vr/" },
    emphasis: {
      exec: "บทบาทศูนย์ความรู้ด้านการเกษตร และการเชื่อมผลงานวิจัยสู่สาธารณะ",
      student: "บรรณารักษ์เฉพาะสาขา และการเข้าร่วมกิจกรรมออนไลน์",
      public: "เล่าความหมายของ \"เกษตรศาสตร์\" และการเติบโตของมหาวิทยาลัย",
    },
  },
  studyrooms: {
    name: "ห้องศึกษาเดี่ยว และห้องศึกษากลุ่ม",
    en: "Individual & Group Study Rooms",
    building: "new", floor: 3,
    icon: "🚪",
    script: {
      th: "ชั้นนี้มีห้องศึกษาเดี่ยว 22 ห้อง\n\nฝั่งตรงข้ามเป็นห้องศึกษากลุ่ม 5 ห้อง ใหญ่กว่าห้องที่ชั้น 2 รองรับได้สูงสุดห้องละ 12 คน",
      en: "There are 22 individual study rooms on this floor.\n\nOn the opposite side are 5 group study rooms — bigger than the rooms on the 2nd floor, accommodating up to 12 people per room.",
    },
    facts: ["ห้องเดี่ยว 22 ห้อง", "ห้องกลุ่ม 5 ห้อง (≤ 12 คน/ห้อง)"],
    notes: ["พาเดินวนไปทางห้องเดี่ยว ออกตรงใกล้ลิฟต์ แล้วลงบันไดไปชั้น 2"],
    emphasis: {
      exec: "ความหลากหลายของพื้นที่รองรับรูปแบบการเรียนรู้",
      student: "จองห้องผ่านเว็บไซต์ และขนาดห้องที่เหมาะกับกลุ่ม",
      public: "พื้นที่ส่วนตัวสำหรับการเรียน",
    },
  },
  edutainment: {
    name: "Edutainment Zone",
    en: "Edutainment Zone",
    building: "new", floor: 2,
    icon: "🎲",
    script: {
      th: "บอร์ดเกม – มีบอร์ดเกมให้ยืมเล่นภายในห้องสมุดมากกว่า 200 กล่อง โดยต้องเล่นในห้องบอร์ดเกม ช่วงสอบจะงดบริการ เพราะอาจมีเสียงรบกวนผู้ที่อ่านหนังสือ\n\nเก้าอี้นวด – เป็นบริการเดียวที่มีค่าใช้จ่าย เริ่มต้น 20 บาท ต่อ 10 นาที\n\nTheatre Room และ Mini Theatre – นิสิตเลือกโปรแกรมจากสตรีมมิ่ง เช่น Netflix, Disney+, HBO Go ไม่ต้องจองที่นั่ง ถ้ามีการฉายอยู่ก็เข้าไปร่วมชมได้เลย อาจารย์ยังจองห้องนี้เพื่อสอนหรือบรรยายได้ เช่น อาจารย์คณะมนุษยศาสตร์พานิสิตภาษาฝรั่งเศสมาชมภาพยนตร์ฝรั่งเศส ตามด้วยการบรรยายเรื่องภาษาและวัฒนธรรม เป็นอีกวิธีเปลี่ยนบรรยากาศการเรียนรู้\n\nห้องบอร์ดเกม – ช่วงสอบเราเปลี่ยนเป็นห้องอ่านหนังสือ เพราะช่วงสอบหาที่นั่งว่างได้ยาก\n\nห้องศึกษากลุ่ม – ชั้น 2 มี 4 ห้อง ตรวจสอบและจองได้จากเว็บไซต์ห้องสมุด\n\nส่วนชั้น 5 สงวนไว้สำหรับนิสิตบัณฑิตศึกษาและบุคลากร มก.",
      en: "Board games – we offer more than 200 boxes of board games for students to borrow and play inside the library, in the board game room. During exams, the board game service is closed, as playing can be noisy and disturb students who are studying.\n\nMassage chairs – the only service that requires payment, starting at 20 baht for 10 minutes.\n\nTheatre Room & Mini Theatre – students can choose programs from streaming services such as Netflix, Disney+ and HBO Go. No seat reservation is needed — if a program is showing, students can just walk in. Instructors can also reserve the theatre room to hold a class. For example, a lecturer from the Faculty of Humanities brought French-language students to watch a French movie, followed by a short lecture on French language and culture. It is one way to change the learning environment.\n\nThis is the board game room. During exams we turn it into a reading room — during exam periods it's usually hard to find an empty seat.\n\nGroup study rooms – there are 4 rooms on the 2nd floor. Students check availability and book via the library website.\n\nThe 5th floor is reserved for graduate students and KU staff.",
    },
    facts: ["บอร์ดเกม 200+ กล่อง", "เก้าอี้นวด 20 บาท/10 นาที", "ห้องกลุ่มชั้น 2: 4 ห้อง", "~1,000 ที่นั่ง", "ผู้ใช้ ~2,000 คน/วัน · ช่วงสอบ 4,000–5,000"],
    notes: [
      "ชี้ให้ดูกล่องบอร์ดเกมที่เคาน์เตอร์ก่อน ยังไม่ต้องเดินไปห้องบอร์ดเกม",
      "Theatre Room: พาไปดูหน้าห้อง หรือแง้มม่านให้เห็นจอ ถ้าห้องว่างพาเข้าไปได้เลย",
      "ปิดท้ายที่จุดที่มองเห็นทั้งห้องบอร์ดเกมและห้องศึกษากลุ่ม",
      "บอกเรื่องชั้น 5 โดยไม่ต้องขึ้นไป",
    ],
    emphasis: {
      exec: "แนวคิด Edutainment และการใช้ Theatre Room เป็นห้องเรียน",
      student: "บริการที่ใช้ได้ฟรี กติกาช่วงสอบ และการจองห้องกลุ่ม",
      public: "สีสันของห้องสมุดยุคใหม่ที่มากกว่าการอ่าน",
    },
  },
  bridge: {
    name: "ทางเชื่อมอาคาร · เวลาเปิดบริการ",
    en: "Link Bridge – Opening Hours",
    building: "bridge", floor: 2,
    icon: "🌉",
    script: {
      th: "ระหว่างเดินไปตึกเก่า: ช่วงปกติห้องสมุดเปิดถึง 2 ทุ่ม ช่วงสอบกลางภาคเปิดถึงเที่ยงคืน และช่วงสอบปลายภาคเปิด 24 ชั่วโมง ติดต่อกัน 3 สัปดาห์ (จันทร์–ศุกร์)\n\nเกร็ดน่ารู้: ตึกเก่าของห้องสมุดถูกใช้เป็นสถานที่ถ่ายทำละคร ภาพยนตร์ และมิวสิกวิดีโออยู่บ่อย ๆ",
      en: "During the normal period, we open until 8 PM. During mid-term exams, we open until midnight. During final exams, we open 24 hours for 3 weeks (Mon–Fri).\n\nFun fact: from time to time, film production teams use the old library building as a location for dramas, movies and music videos.",
    },
    facts: ["ปกติ: ถึง 20.00 น.", "สอบกลางภาค: ถึงเที่ยงคืน", "สอบปลายภาค: 24 ชม. 3 สัปดาห์ (จ.–ศ.)"],
    notes: [
      "พูดระหว่างเดิน ไม่ต้องหยุดนาน",
      "ตัวอย่างการถ่ายทำ: MV ของวง BUS, ละครช่อง 3, ละครช่องวัน และกำลังจะมีซีรีส์ Netflix มาถ่ายทำหลังสอบ",
    ],
    emphasis: {
      exec: "การขยายเวลาบริการตามความต้องการของผู้ใช้",
      student: "จำเวลาเปิดช่วงสอบไว้ใช้วางแผนอ่านหนังสือ",
      public: "เกร็ดการถ่ายทำละคร/MV ที่ตึกเก่า",
    },
  },
  eco: {
    name: "Eco-Library",
    en: "Eco-Library",
    building: "old", floor: 1,
    icon: "♻️",
    script: {
      th: "(หน้าตู้ Card Catalog) ทราบไหมว่านี่คืออะไร นี่คือ \"ตู้บัตรรายการ\" สมัยที่โลกยังไม่มีอินเทอร์เน็ต ห้องสมุดทั่วโลกมีตู้นี้ไว้ช่วยผู้ใช้หาหนังสือ แต่ปัจจุบันทุกอย่างอยู่ออนไลน์ ตู้นี้จึงเป็นของตกแต่งในฐานะสัญลักษณ์ของห้องสมุด และผู้ใช้สืบค้นทรัพยากรผ่านเว็บไซต์ห้องสมุดแทน\n\nEco-Library สร้างขึ้นด้วย 2 วัตถุประสงค์ หนึ่ง ส่งเสริมการอ่าน หนังสือด้านในเป็นหนังสืออ่านเล่นทั้งหมด สอง สร้างความตระหนักเรื่องการอนุรักษ์พลังงานและสิ่งแวดล้อม เฟอร์นิเจอร์ด้านใน 100% ทำจากวัสดุรีไซเคิลและนำกลับมาใช้ใหม่\n\nEco-Library ออกแบบสำหรับทุกคนในครอบครัว มีพื้นที่อ่านส่วนกลาง และ Kids' Reading Space สำหรับเด็กอายุต่ำกว่า 15 ปีโดยเฉพาะ\n\nนิสิตเสนอแนะหนังสือที่อยากอ่านได้ ห้องสมุดจะพิจารณาจัดซื้อ และผู้เสนอจะได้รับแจ้งเมื่อหนังสือพร้อม และได้ยืมเป็นคนแรก\n\nการยืมหนังสือทำได้หลายวิธี: 1) ที่เคาน์เตอร์ยืม-คืน 2) เครื่องยืม-คืนด้วยตนเอง 3) ขอให้ส่งทางไปรษณีย์ฟรี 4) ถ้ามาไม่ทันเวลาเปิด ขอให้ใส่ตู้ล็อกเกอร์หน้าอาคาร เราจะอีเมลหมายเลขตู้และรหัสให้มารับได้ตามสะดวก",
      en: "(In front of the card catalog cabinets) Do you know what these are? They are card catalog cabinets. When the world had no internet, every library had these cabinets to help users find the books they needed. Today everything is online, so these cabinets are here as decoration — a symbol of the library. Today, users search for resources via the library website.\n\nThe Eco-Library was built with 2 objectives: first, to encourage people to read — all the materials inside are recreational books; second, to raise awareness of energy and environmental conservation. 100% of the furniture inside is made from recycled and reused materials.\n\nThe Eco-Library is designed for every member of the family. There is a common reading area and a Kids' Reading Space, exclusively for children under 15.\n\nStudents can also recommend books they'd like to read, and the library will consider purchasing them. The requester is notified when the book is ready and gets to borrow it first.\n\nThere are many ways to borrow books: 1) at the circulation counter; 2) at the self-check machine; 3) by requesting delivery by post, free of charge; or 4) if users can't come during opening hours, we can put the books in a locker outside the building and email them the locker number and passcode.",
    },
    facts: ["เฟอร์นิเจอร์รีไซเคิล 100%", "Kids' Reading Space (< 15 ปี)", "ยืมได้ 4 ช่องทาง", "ส่งไปรษณีย์ฟรี"],
    notes: [
      "เริ่มที่หน้าตู้ Card Catalog: ถ้าผู้เยี่ยมชมมีอายุ ปรับคำพูด เช่น \"ทุกท่านคงรู้จักตู้นี้ แต่นิสิตปัจจุบันไม่มีใครรู้จักแล้ว\"",
      "Tips: บัตรในตู้เป็นบัตรดั้งเดิมที่เคยใช้ให้บริการจริง เก็บไว้ส่วนหนึ่ง",
      "เข้าห้อง: ให้ทายว่าเก้าอี้สตูลสีดำทำจากอะไร (เฉลย: ยางรถยนต์เก่า)",
      "พูดเรื่องวิธียืมหนังสือตรงเครื่อง Self-check",
      "แวะเคาน์เตอร์ก่อนออก ให้ทายวัสดุ counter top (เฉลย: เศษพลาสติกเหลือใช้จากโรงงานผลิตกระดุม ออกแบบโดยคณะสถาปัตยกรรมศาสตร์ มก. ตอนนั้นยังเป็นขั้นทดลอง ปัจจุบันวางขายเชิงพาณิชย์แล้ว)",
      "ถ่ายภาพหน้าห้อง Eco-Library",
    ],
    emphasis: {
      exec: "นวัตกรรมวัสดุรีไซเคิลร่วมกับคณะสถาปัตยกรรมศาสตร์ และบริการส่งหนังสือ",
      student: "เสนอซื้อหนังสือ และช่องทางยืมที่สะดวก (ล็อกเกอร์ ไปรษณีย์)",
      public: "กิจกรรมทายของ และพื้นที่อ่านสำหรับเด็ก",
    },
  },
  refdesk: {
    name: "Reference Desk & เครือข่ายห้องสมุด",
    en: "Reference Desk & Library Network",
    building: "old", floor: 1,
    icon: "💁",
    script: {
      th: "นี่คือโต๊ะบรรณารักษ์ (Reference Desk) ให้คำปรึกษาในเวลาทำการ และผู้ใช้ยังติดต่อบรรณารักษ์ได้หลายช่องทาง เช่น แชตบนเว็บไซต์และโซเชียลมีเดีย หรือนัดหมายปรึกษาออนไลน์สำหรับเรื่องซับซ้อน เช่น ปัญหา EndNote หรือ Turnitin\n\nที่นี่คือห้องสมุดหลักของ มก. นอกจากนี้ยังมีห้องสมุดวิทยาเขตอีก 3 แห่ง และในวิทยาเขตบางเขนยังมีห้องสมุดคณะอีก 12 แห่ง ผู้ใช้สืบค้นได้จากระบบสืบค้นกลางผ่านเว็บไซต์\n\nยืมระหว่างห้องสมุด: ผู้ใช้ที่บางเขนยืมหนังสือจากห้องสมุดวิทยาเขตอื่นของ มก. ได้ และในทางกลับกัน รวมทั้งยืมหนังสือหรือขอสำเนาบทจากมหาวิทยาลัยรัฐในประเทศไทยที่มีเครือข่ายร่วมกัน และในอีกไม่กี่เดือนจะขยายไปถึงมหาวิทยาลัยต่างประเทศในเครือข่าย",
      en: "This is the reference desk, where librarians provide consultation during opening hours. Users can also reach librarians in many ways, e.g. chat on the library website and social media. They can also book an online meeting for complicated consultations, such as problems with EndNote or Turnitin.\n\nThis is KU's main library. We also have 3 other campus libraries, and within Bangkhen campus another 12 branch (faculty) libraries. Users can access the centralized search system via the website.\n\nInterlibrary loan: users at Bangkhen can borrow books from other KU campus libraries, and vice versa. They can even borrow books, or request copies of book chapters, from other government universities in Thailand within our collaboration network. In a couple of months, users will also be able to borrow books or request chapter copies from overseas universities.",
    },
    facts: ["ห้องสมุดวิทยาเขต 3 แห่ง", "ห้องสมุดคณะที่บางเขน 12 แห่ง", "ยืมระหว่างห้องสมุดในเครือข่าย", "เร็ว ๆ นี้: เครือข่ายต่างประเทศ"],
    notes: ["เดินผ่านทางเข้าไปที่โต๊ะบรรณารักษ์", "บริการยืมจากต่างประเทศเป็นบริการใหม่ที่กำลังจะเปิด"],
    emphasis: {
      exec: "เครือข่ายความร่วมมือในประเทศ และการขยายสู่ต่างประเทศ",
      student: "ปรึกษาบรรณารักษ์ออนไลน์ (EndNote, Turnitin) และการยืมข้ามวิทยาเขต",
      public: "ห้องสมุด มก. มีหลายแห่ง ค้นได้จากระบบเดียว",
    },
  },
  ai: {
    name: "AI Corner",
    en: "AI Corner",
    building: "old", floor: 1,
    icon: "🤖",
    script: {
      th: "ห้องสมุดบอกรับ AI Tools รุ่น Premium เช่น Claude AI Pro, ChatGPT Pro, Perplexity Pro เป็นต้น ผู้ใช้เข้าใช้งานได้ผ่านคอมพิวเตอร์ที่จัดไว้ในมุมนี้",
      en: "The library subscribes to premium versions of AI tools such as Claude Pro, ChatGPT Pro and Perplexity Pro. Users access them via the computers provided here.",
    },
    facts: ["Claude · ChatGPT · Perplexity (Pro)", "ใช้ผ่านคอมพิวเตอร์ของห้องสมุด"],
    notes: [],
    emphasis: {
      exec: "การลงทุนด้านเครื่องมือ AI เพื่อการเรียนรู้และวิจัย",
      student: "ใช้ AI รุ่น Premium ได้ฟรีที่มุมนี้",
      public: "ห้องสมุดกับเทคโนโลยี AI",
    },
  },
  garden: {
    name: "ห้องสมุดในสวน",
    en: "Library in the Garden",
    building: "bridge", floor: 1,
    icon: "🌳",
    script: {
      th: "สวนที่เห็นด้านนอกเป็นส่วนหนึ่งของห้องสมุดเช่นกัน เรียกว่า \"ห้องสมุดในสวน\" (Library in the Garden)\n\nนั่งอ่านหนังสือ หรือพักผ่อนกับพื้นที่สีเขียวได้ มีต้นไม้มากมายรอบ ๆ\n\nยังมีเวทีเล็ก ๆ สำหรับกิจกรรม เช่น ชมรมนิสิตอย่างชมรมอะคูสติก ขอใช้จัดคอนเสิร์ตเล็ก ๆ หรือกิจกรรมอื่นได้",
      en: "The garden you can see outside is also part of our library, called the \"Library in the Garden\".\n\nYou can sit here, read a book, or simply relax and enjoy the green space — there are lots of trees and plants around.\n\nWe also have a small stage for activities. For example, student clubs such as the Acoustic Club can request this space for a small concert or other activities.",
    },
    facts: ["พื้นที่อ่านกลางแจ้ง", "เวทีกิจกรรมสำหรับชมรม"],
    notes: ["ยืนหน้าประตูกระจกตรงทางเชื่อมตึก (ดูพื้นตรงจุดสิ้นสุดปาร์เกต์)"],
    emphasis: {
      exec: "พื้นที่สีเขียวที่ส่งเสริมกิจกรรมนิสิต",
      student: "ขอใช้เวทีสำหรับกิจกรรมชมรมได้",
      public: "มุมพักผ่อนท่ามกลางธรรมชาติ",
    },
  },
  closing: {
    name: "Wrap-up · ถาม-ตอบ · ประเมิน · ถ่ายภาพ",
    en: "Wrap-up & Q&A",
    building: "new", floor: 1,
    icon: "💚",
    script: {
      th: "การนำชมของเราก็มาถึงตอนท้ายแล้ว หวังว่าทุกท่านจะเพลิดเพลินและได้รู้จักห้องสมุดของเรามากขึ้น ทั้งบริการ สิ่งอำนวยความสะดวก และพื้นที่การเรียนรู้\n\nก่อนจบ มีคำถามหรือเรื่องที่อยากทราบเพิ่มเติมไหม\n\nขอบคุณทุกท่าน ขอเชิญสแกน QR Code เพื่อประเมินความพึงพอใจ และเชิญถ่ายภาพร่วมกันที่หน้าอาคาร",
      en: "That brings us to the end of our library tour. I hope you've enjoyed it and learned a little more about our library — our services, facilities and learning spaces.\n\nBefore we finish, do you have any questions, or anything you'd like to know more about?\n\nThank you very much. Please scan the QR code to share your feedback, and let's take a group photo in front of the building.",
    },
    facts: ["คืนหูฟัง", "QR Code แบบประเมิน", "ถ่ายภาพหมู่"],
    notes: [
      "พากลับจุดเริ่มต้น (ตึกใหม่ ชั้น 1) เพื่อคืนหูฟัง",
      "เชิญสแกน QR Code ประเมินความพึงพอใจ",
      "ถ่ายภาพหน้าอาคารตึกใหม่ ยืนเรียงตรงบันได",
    ],
    emphasis: {
      exec: "ขอบคุณ เชิญให้ข้อเสนอแนะ และเปิดโอกาสความร่วมมือ",
      student: "ชวนกลับมาใช้บริการ และติดตามช่องทางออนไลน์",
      public: "ขอบคุณ และแนะนำการเข้าใช้บริการ",
    },
  },
};

/* เส้นทางนำชม: [รหัสจุด, นาที] — ลำดับตามเส้นทางจริง นาทีรวมเวลาเดินแล้ว
 * 45 นาที = เส้นทางฉบับเต็มตาม Script */
const ROUTES = {
  exec: {
    15: [["intro", 3], ["learning", 4], ["air", 5], ["closing", 3]],
    30: [["intro", 3], ["learning", 5], ["roof", 3], ["air", 5], ["agrohub", 5], ["edutainment", 4], ["closing", 5]],
    45: [["intro", 3], ["learning", 5], ["roof", 2], ["air", 5], ["agrohub", 5], ["studyrooms", 2], ["edutainment", 5], ["bridge", 2], ["eco", 6], ["refdesk", 3], ["ai", 2], ["garden", 2], ["closing", 3]],
    60: [["intro", 4], ["learning", 6], ["roof", 3], ["air", 7], ["agrohub", 6], ["studyrooms", 3], ["edutainment", 6], ["bridge", 3], ["eco", 8], ["refdesk", 4], ["ai", 3], ["garden", 2], ["closing", 5]],
  },
  student: {
    15: [["intro", 2], ["learning", 5], ["edutainment", 5], ["closing", 3]],
    30: [["intro", 2], ["learning", 5], ["air", 3], ["agrohub", 3], ["studyrooms", 3], ["edutainment", 5], ["bridge", 1], ["refdesk", 2], ["ai", 3], ["closing", 3]],
    45: [["intro", 2], ["learning", 6], ["roof", 2], ["air", 3], ["agrohub", 4], ["studyrooms", 3], ["edutainment", 7], ["bridge", 2], ["eco", 5], ["refdesk", 3], ["ai", 3], ["garden", 2], ["closing", 3]],
    60: [["intro", 3], ["learning", 8], ["roof", 3], ["air", 4], ["agrohub", 5], ["studyrooms", 4], ["edutainment", 9], ["bridge", 2], ["eco", 6], ["refdesk", 4], ["ai", 5], ["garden", 3], ["closing", 4]],
  },
  public: {
    15: [["intro", 3], ["learning", 4], ["roof", 4], ["air", 2], ["closing", 2]],
    30: [["intro", 3], ["learning", 4], ["roof", 3], ["agrohub", 4], ["edutainment", 4], ["bridge", 2], ["eco", 6], ["closing", 4]],
    45: [["intro", 3], ["learning", 5], ["roof", 3], ["air", 3], ["agrohub", 5], ["studyrooms", 2], ["edutainment", 4], ["bridge", 2], ["eco", 7], ["refdesk", 3], ["ai", 2], ["garden", 3], ["closing", 3]],
    60: [["intro", 4], ["learning", 6], ["roof", 4], ["air", 4], ["agrohub", 6], ["studyrooms", 2], ["edutainment", 6], ["bridge", 3], ["eco", 9], ["refdesk", 4], ["ai", 3], ["garden", 4], ["closing", 5]],
  },
};
