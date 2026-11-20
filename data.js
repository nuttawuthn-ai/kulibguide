/*
 * ข้อมูลบทนำชมชุดตั้งต้น (สำรอง) — สำนักหอสมุด มหาวิทยาลัยเกษตรศาสตร์
 * ที่มา: สคริปต์นำชม 40 นาที rev2 (20261118-script-visitor-full-40mins-rev2.docx)
 * ------------------------------------------------------------
 * ปกติแก้เนื้อหาผ่านหน้าแอดมิน (admin.html) ไม่ต้องแก้ไฟล์นี้
 * ไฟล์นี้ใช้เมื่อยังไม่ได้ตั้งค่า API หรือเปิดเว็บครั้งแรกแบบออฟไลน์
 *
 * โครงสร้าง
 *  durations    : เวลานำชมที่ให้เลือก (นาที)  fullDuration : ฉบับเต็ม
 *  groups[]     : กลุ่มผู้เยี่ยมชม (id ใช้ในลิงก์ ?g=)
 *  prep[]       : สิ่งที่ต้องเตรียมก่อนนำชม
 *  stops[]      : จุดนำชม เรียงตามเส้นทางจริง  ({min} ในบทพูด = เวลาที่เลือก)
 *  routes       : routes[กลุ่ม][เวลา][จุด] = นาที  (ไม่มี = ไม่แวะจุดนั้น)
 */
const DEFAULT_CONTENT = {
  "schema": 1,
  "durations": [
    20,
    30,
    40
  ],
  "fullDuration": 40,
  "groups": [
    {
      "id": "student",
      "name": "นิสิต ป.ตรี",
      "en": "Undergraduate Students",
      "icon": "🎓",
      "tone": "mint",
      "desc": "นิสิตปริญญาตรี นิสิตใหม่ นักศึกษาจากสถาบันอื่น",
      "focus": [
        "พื้นที่และอุปกรณ์ที่ใช้ได้ทันที",
        "การจองห้อง/อุปกรณ์ผ่านเว็บไซต์",
        "เวลาเปิดบริการช่วงสอบ",
        "KULib Points และ AI Corner"
      ],
      "tips": [
        "ชวนเปิดเว็บไซต์ห้องสมุดดูการจองห้อง/อุปกรณ์จริงระหว่างเดิน",
        "เน้นบริการที่ใช้ได้ฟรี: ยืม Laptop/Tablet, บอร์ดเกม, Theatre Room, AI Tools รุ่น Premium",
        "บอกเวลาเปิดช่วงสอบ (ไฟนอลเปิด 24 ชม. 3 สัปดาห์) และการขอใช้ห้องประชุม/Makerspace สำหรับชมรม",
        "ปิดท้ายด้วย KULib Points ชวนเข้าร่วมกิจกรรมสะสมแต้ม"
      ]
    },
    {
      "id": "exec",
      "name": "ผู้บริหาร อาจารย์ นิสิต ป.โท-เอก",
      "en": "Executives, Faculty & Graduate Students",
      "icon": "🏛️",
      "tone": "lavender",
      "desc": "ผู้บริหาร แขกผู้มีเกียรติ คณะศึกษาดูงาน อาจารย์ นิสิตบัณฑิตศึกษา",
      "focus": [
        "Green Library & การประหยัดพลังงาน",
        "มาตรฐาน ISO 14001 / ISO 9001",
        "บริการสนับสนุนการวิจัย",
        "เครือข่ายความร่วมมือ"
      ],
      "tips": [
        "เส้นทาง 30/40 นาทีเริ่มด้วย Slide Welcome บนจอทีวี ชั้น 1 ใช้แนะนำบริการสนับสนุนการวิจัย (EndNote, Turnitin, SciVal, Research Buddy)",
        "เปิดด้วยรางวัลและมาตรฐาน: Green Library แห่งแรกของไทย, Thailand Energy Award 2025, ISO 14001 และ ISO 9001",
        "ใช้เวลาที่ระบบคุณภาพอากาศ (ชั้น 4) ให้มากขึ้น เพราะเป็นตัวอย่างการจัดการพลังงานที่จับต้องได้",
        "ที่ Reference Desk ใช้บทฉบับยาว เน้นเครือข่ายยืมระหว่างห้องสมุดที่จะขยายสู่ต่างประเทศในเดือนธันวาคม"
      ]
    }
  ],
  "prep": [
    "หูฟังสำหรับผู้เยี่ยมชม (แจกที่จุดเริ่มต้น ตึกใหม่ ชั้น 1)",
    "เปิด Slide Welcome & Intro บนจอทีวี ชั้น 1 (เส้นทางผู้บริหาร 30/40 นาที)",
    "QR Code แบบประเมินความพึงพอใจ",
    "ตรวจสอบว่า Theatre Room ว่างหรือไม่ (เพื่อพาเข้าไปชมด้านใน)",
    "จุดถ่ายภาพหมู่: บันไดหน้าอาคารตึกใหม่"
  ],
  "stops": [
    {
      "id": "welcomeSlide",
      "ref": "1.1",
      "name": "Welcome & Introduction (เปิด Slide)",
      "en": "Welcome & Introduction – with slides",
      "building": "new",
      "floor": 1,
      "icon": "🖥️",
      "script": {
        "th": "ยินดีต้อนรับสู่สำนักหอสมุด มหาวิทยาลัยเกษตรศาสตร์ (แนะนำตัว) เราจะใช้เวลาเดินชมห้องสมุดประมาณ {min} นาที เพื่อแนะนำบริการและสิ่งอำนวยความสะดวกที่เราจัดให้กับนิสิต นักวิจัย และบุคลากรของ มก.\n\nนอกจากบริการแล้ว ท่านจะได้เห็นตัวอย่างการดำเนินงานที่เป็นมิตรกับสิ่งแวดล้อมและการอนุรักษ์พลังงานของเรา\n\nสำนักหอสมุด มก. เป็น Green Library แห่งแรกของประเทศไทย ได้รับการรับรองเป็นสำนักงานสีเขียว (Green Office) และได้รับรางวัล Thailand Energy Award 2025 และล่าสุดได้รับการรับรองมาตรฐานสากล ISO 14001 ระบบการจัดการสิ่งแวดล้อม และ ISO 9001 ระบบบริหารงานคุณภาพ\n\nภาพรวม ห้องสมุดมี 2 อาคาร อาคารที่เรายืนอยู่คือตึกใหม่ ชื่อ \"อาคารเทพรัตน์วิทยาโชติ\" แปลว่า \"อาคารที่รุ่งเรืองด้วยความรู้\" มี 5 ชั้น ไม่มีหนังสือ แต่เป็นพื้นที่และสิ่งอำนวยความสะดวก ส่วนทรัพยากรสิ่งพิมพ์ทั้งหมดอยู่ที่ตึกเก่า\n\n(เปิด Slide ประกอบ)\n\nทรัพยากรดิจิทัล – ห้องสมุดมี e-book, e-journal และฐานข้อมูลวิชาการหลากหลายสาขา ประชาคม มก. เข้าใช้ได้ทุกที่ทุกเวลาด้วยบัญชี KU แม้อยู่นอกมหาวิทยาลัย\n\nการยืมหนังสือ – มีหลายช่องทาง ทั้งตู้ล็อกเกอร์รับหนังสือด้วยตนเอง บริการจัดส่ง และส่งทางไปรษณีย์ และผ่านบริการยืมระหว่างห้องสมุด ผู้ใช้ยังขอยืมทรัพยากรจากห้องสมุดอื่นได้\n\nบริการอัจฉริยะ (Smart Services) – จองห้องออนไลน์ เข้าห้องสมุดด้วยระบบจดจำใบหน้า ผู้ช่วยห้องสมุด AI ยืมต่อออนไลน์ และยืม-คืนด้วยตนเอง\n\nสนับสนุนการเรียนการสอน – อบรมการรู้สารสนเทศ อบรม AI literacy ห้องเรียนอัจฉริยะ และพื้นที่เรียนรู้ร่วมกัน รวมทั้งอบรมและให้คำปรึกษาออนไลน์ เพื่อพัฒนาทักษะของนิสิตและอาจารย์\n\nบรรณารักษ์พร้อมช่วยเหลือ – ทั้งแบบตัวต่อตัว แชตออนไลน์ หรือประชุมออนไลน์ ไม่ว่าจะเป็นการค้นหาข้อมูลหรือการทำวิจัย\n\nสนับสนุนการวิจัยตลอดเส้นทาง – มี AI tools, EndNote จัดการรายการอ้างอิง, Turnitin ตรวจความซ้ำซ้อน และ SciVal วิเคราะห์ผลงานวิจัย บรรณารักษ์ให้คำปรึกษาด้านการตีพิมพ์และ Open Access และบริการ Research Buddy ช่วยเหลืองานวิจัยแบบเฉพาะบุคคลครบจบในที่เดียวสำหรับอาจารย์ มก.\n\nนี่คือพื้นที่การเรียนรู้ที่เพิ่งปรับปรุงใหม่ ได้แรงบันดาลใจจากนิสิต มก. เพราะห้องสมุดเปิดประกวดแบบ และแบบที่ชนะได้รับการปรับโดยคณะสถาปัตยกรรมศาสตร์ มก. ให้ใช้งานได้จริงและถูกต้องตามกฎหมายอาคาร มีทั้งหมด 4 พื้นที่\n\n• Learning Space – ไม่ได้มีที่นั่งแบบเดียว แต่ออกแบบให้รองรับการทำงานหลายรูปแบบ ตั้งแต่ที่นั่งเดี่ยวสำหรับอ่านเงียบ ๆ โต๊ะกลุ่มเล็ก โต๊ะประชุม ไปจนถึงพื้นที่สำหรับกลุ่มใหญ่\n• Exhibition Space – พื้นที่เปิดสำหรับนิทรรศการ ผลงานสร้างสรรค์ และกิจกรรมวิชาการของมหาวิทยาลัยหรือชมรมนิสิต เช่น คณะสถาปัตยกรรมศาสตร์จัดแสดงงานออกแบบผลิตภัณฑ์ของนิสิตช่วงท้ายภาค พร้อมนำเสนอผลงานและดูว่าผู้ชมชอบหรือไม่ หรือชมรมถ่ายภาพ มก. จัดแสดงภาพและเชิญผู้ชมโหวตภาพที่ชอบ",
        "en": "Welcome to Kasetsart University Main Library. (Introduce yourself.) We will spend about {min} minutes walking around the library, and I'll show you the services and facilities that we provide for KU students, researchers and staff.\n\nBeyond our services and facilities, you will also see examples of how we are committed to environmentally friendly practices and energy conservation.\n\nKU Library is Thailand's first Green Library, officially certified as a Green Office, and won the Thailand Energy Award 2025. Recently, KU Library obtained international certifications for ISO 14001 Environmental Management System and ISO 9001 Quality Management System.\n\nFor an overview, the library has 2 buildings. This is the new building, called \"เทพรัตน์วิทยาโชติ\". The name means \"A Building Where Knowledge Grows\". It has 5 floors with no books — it provides facilities. All printed materials are housed in the old building.\n\n(Show the slides.)\n\nKU Library provides a wide range of digital resources, including e-books, e-journals and academic databases across various subject areas. Our university community can access these resources anytime, anywhere, using their KU account, even when they are off campus.\n\nWe also offer convenient ways to borrow books, including self-service lockers, delivery services and postal delivery. Through our interlibrary loan service, users can also request materials from other libraries.\n\nTo make library services easier and more convenient, we've introduced several smart services, such as online room booking, facial recognition for library entry, AI library assistance, online book renewal, and self-service borrowing and returns.\n\nMore than providing information resources, KU Library supports teaching and learning through information literacy training, AI literacy programs, smart classrooms and collaborative learning spaces. We also offer online training and consultations to help students and faculty develop essential skills.\n\nOur librarians are always ready to help. Users can receive personalised assistance in person, through online chat, or via online meetings — whether they need help finding information or conducting research.\n\nKU Library supports researchers throughout their research journey. We provide AI tools, EndNote for reference management, Turnitin for similarity checking, and SciVal for research analysis. Our librarians also offer consultations on academic publishing and open access, and our Research Buddy service offers personalised, one-stop research assistance for KU faculty members.\n\nThis is the newly renovated learning space. It was inspired by KU students, as the library opened a design competition. The winning design was refined by the Faculty of Architecture at KU to make it practical and compliant with construction laws. There are 4 spaces.\n\n• Learning Space – we don't have just one type of workspace here. The seating is designed to support different ways of working: individual seats for focused study, small-group workspaces, meeting tables for discussions, and larger collaborative areas for bigger groups.\n• Exhibition Space – an open area for exhibitions, creative works and academic events hosted by the university or student clubs. For example, the Faculty of Architecture may display students' product design projects, especially before the end of the semester, and give presentations about their work — we can see whether visitors like or dislike the designs. The KU Photography Club may display students' photographs and invite visitors to vote for their favourites."
      },
      "facts": [
        "Green Library แห่งแรกของไทย",
        "Thailand Energy Award 2025",
        "ISO 14001 · ISO 9001",
        "EndNote · Turnitin · SciVal",
        "Research Buddy"
      ],
      "notes": [
        "แจกหูฟังให้ผู้เยี่ยมชมก่อนเริ่ม",
        "ยืนหน้าจอทีวี ตึกใหม่ ชั้น 1 เปิด Slide Presentation ไล่ตามหัวข้อ",
        "Tips: \"อาคารเทพรัตน์วิทยาโชติ\" เป็นชื่อพระราชทานจากสมเด็จพระเทพฯ แปลว่า \"อาคารที่รุ่งเรืองด้วยความรู้\"",
        "จบจุดนี้ เดินไปหน้าห้อง Meeting Space"
      ],
      "emphasis": {
        "exec": "รางวัลและมาตรฐานที่ได้รับ และบริการสนับสนุนการวิจัยครบวงจร",
        "student": "บริการดิจิทัลที่ใช้ได้จากทุกที่ และบริการอัจฉริยะ"
      }
    },
    {
      "id": "welcome",
      "ref": "1.2",
      "name": "Welcome & Introduction",
      "en": "Welcome & Introduction – no slides",
      "building": "new",
      "floor": 1,
      "icon": "👋",
      "script": {
        "th": "ยินดีต้อนรับสู่สำนักหอสมุด มหาวิทยาลัยเกษตรศาสตร์ (แนะนำตัว) เราจะใช้เวลาเดินชมห้องสมุดประมาณ {min} นาที เพื่อแนะนำบริการและสิ่งอำนวยความสะดวกที่เราจัดให้กับนิสิต นักวิจัย และบุคลากรของ มก.\n\nนอกจากบริการแล้ว ท่านจะได้เห็นตัวอย่างการดำเนินงานที่เป็นมิตรกับสิ่งแวดล้อมและการอนุรักษ์พลังงานของเรา\n\nสำนักหอสมุด มก. เป็น Green Library แห่งแรกของประเทศไทย ได้รับการรับรองเป็นสำนักงานสีเขียว (Green Office) และได้รับรางวัล Thailand Energy Award 2025 และล่าสุดได้รับการรับรองมาตรฐานสากล ISO 14001 ระบบการจัดการสิ่งแวดล้อม และ ISO 9001 ระบบบริหารงานคุณภาพ\n\nภาพรวม ห้องสมุดมี 2 อาคาร อาคารที่เรายืนอยู่คือตึกใหม่ ชื่อ \"อาคารเทพรัตน์วิทยาโชติ\" แปลว่า \"อาคารที่รุ่งเรืองด้วยความรู้\" มี 5 ชั้น ไม่มีหนังสือ แต่เป็นพื้นที่และสิ่งอำนวยความสะดวก ส่วนทรัพยากรสิ่งพิมพ์ทั้งหมดอยู่ที่ตึกเก่า\n\nนี่คือพื้นที่การเรียนรู้ที่เพิ่งปรับปรุงใหม่ ได้แรงบันดาลใจจากนิสิต มก. เพราะห้องสมุดเปิดประกวดแบบ และแบบที่ชนะได้รับการปรับโดยคณะสถาปัตยกรรมศาสตร์ มก. ให้ใช้งานได้จริงและถูกต้องตามกฎหมายอาคาร มีทั้งหมด 4 พื้นที่\n\n• Learning Space – ไม่ได้มีที่นั่งแบบเดียว แต่ออกแบบให้รองรับการทำงานหลายรูปแบบ ตั้งแต่ที่นั่งเดี่ยวสำหรับอ่านเงียบ ๆ โต๊ะกลุ่มเล็ก โต๊ะประชุม ไปจนถึงพื้นที่สำหรับกลุ่มใหญ่\n• Exhibition Space – พื้นที่เปิดสำหรับนิทรรศการ ผลงานสร้างสรรค์ และกิจกรรมวิชาการของมหาวิทยาลัยหรือชมรมนิสิต เช่น คณะสถาปัตยกรรมศาสตร์จัดแสดงงานออกแบบผลิตภัณฑ์ของนิสิตช่วงท้ายภาค พร้อมนำเสนอผลงานและดูว่าผู้ชมชอบหรือไม่ หรือชมรมถ่ายภาพ มก. จัดแสดงภาพและเชิญผู้ชมโหวตภาพที่ชอบ",
        "en": "Welcome to Kasetsart University Main Library. (Introduce yourself.) We will spend about {min} minutes walking around the library, and I'll show you the services and facilities that we provide for KU students, researchers and staff.\n\nBeyond our services and facilities, you will also see examples of how we are committed to environmentally friendly practices and energy conservation.\n\nKU Library is Thailand's first Green Library, officially certified as a Green Office, and won the Thailand Energy Award 2025. Recently, KU Library obtained international certifications for ISO 14001 Environmental Management System and ISO 9001 Quality Management System.\n\nFor an overview, the library has 2 buildings. This is the new building, called \"เทพรัตน์วิทยาโชติ\". The name means \"A Building Where Knowledge Grows\". It has 5 floors with no books — it provides facilities. All printed materials are housed in the old building.\n\nThis is the newly renovated learning space. It was inspired by KU students, as the library opened a design competition. The winning design was refined by the Faculty of Architecture at KU to make it practical and compliant with construction laws. There are 4 spaces.\n\n• Learning Space – we don't have just one type of workspace here. The seating is designed to support different ways of working: individual seats for focused study, small-group workspaces, meeting tables for discussions, and larger collaborative areas for bigger groups.\n• Exhibition Space – an open area for exhibitions, creative works and academic events hosted by the university or student clubs. For example, the Faculty of Architecture may display students' product design projects, especially before the end of the semester, and give presentations about their work — we can see whether visitors like or dislike the designs. The KU Photography Club may display students' photographs and invite visitors to vote for their favourites."
      },
      "facts": [
        "Green Library แห่งแรกของไทย",
        "Thailand Energy Award 2025",
        "ISO 14001 · ISO 9001",
        "2 อาคาร · ตึกใหม่ 5 ชั้น"
      ],
      "notes": [
        "แจกหูฟังให้ผู้เยี่ยมชมก่อนเริ่ม",
        "บริเวณตึกใหม่ ชั้น 1 หน้าจอทีวี (ไม่ใช้ Slide)",
        "Tips: \"อาคารเทพรัตน์วิทยาโชติ\" เป็นชื่อพระราชทานจากสมเด็จพระเทพฯ แปลว่า \"อาคารที่รุ่งเรืองด้วยความรู้\"",
        "จบจุดนี้ เดินไปหน้าห้อง Meeting Space"
      ],
      "emphasis": {
        "exec": "เน้นรางวัลและมาตรฐานที่ได้รับ เป็นภาพรวมความสำเร็จขององค์กร",
        "student": "ตึกใหม่เป็นพื้นที่ทำงาน/อ่านหนังสือ ส่วนหนังสืออยู่ตึกเก่า"
      }
    },
    {
      "id": "meeting",
      "ref": "2",
      "name": "Meeting Space & Makerspace",
      "en": "Meeting Space & Makerspace",
      "building": "new",
      "floor": 1,
      "icon": "🤝",
      "script": {
        "th": "Meeting Space ออกแบบสำหรับการประชุม การอภิปรายกลุ่ม และการเรียนรู้ร่วมกัน ผังที่ยืดหยุ่นและผนังกระจกให้บรรยากาศเปิดโล่ง ส่งเสริมการทำงานเป็นทีมและแลกเปลี่ยนความรู้\n\nโต๊ะปรับความสูงได้ เหมาะกับผู้ใช้วีลแชร์ และหน้าโต๊ะใช้เป็นไวท์บอร์ดได้\n\nMakerspace ส่งเสริมการเรียนรู้ผ่านการลงมือทำ นวัตกรรม และความคิดสร้างสรรค์ ล่าสุดเราจัดเวิร์กช็อปทำบานอฟฟี่ นำโดยนิสิต มก. ที่ทำบานอฟฟี่ขายเป็นธุรกิจ\n\nนิสิตขอใช้ห้องประชุมและ Makerspace สำหรับกิจกรรมชมรมเป็นการส่วนตัวได้ เพียงส่งหนังสือแจ้งล่วงหน้า",
        "en": "The Meeting Space is designed for meetings, group discussions and collaborative learning. Its flexible layout and glass walls create an open, welcoming environment that encourages teamwork and knowledge sharing.\n\nThe height of the table can be adjusted to suit wheelchair users, and the tabletop can be used as a whiteboard.\n\nThe Makerspace promotes hands-on learning, innovation and creativity. We recently held a Banoffee-making workshop, led by a KU student who makes and sells Banoffee as a business.\n\nStudents are welcome to use the meeting room and makerspace privately for club activities — just send us an official letter in advance."
      },
      "facts": [
        "โต๊ะปรับระดับสำหรับวีลแชร์",
        "หน้าโต๊ะเป็นไวท์บอร์ด",
        "ชมรมขอใช้ได้ (ส่งหนังสือล่วงหน้า)"
      ],
      "notes": [
        "ยืนหน้าห้อง Meeting Space",
        "จบจุดนี้ เดินไปหน้าเคาน์เตอร์ Laptop"
      ],
      "emphasis": {
        "exec": "การออกแบบที่คำนึงถึงผู้ใช้วีลแชร์ และพื้นที่ส่งเสริมนวัตกรรม",
        "student": "การขอใช้ห้องประชุมและ Makerspace สำหรับกิจกรรมชมรม"
      }
    },
    {
      "id": "laptop",
      "ref": "3",
      "name": "Laptop Counter",
      "en": "Laptop Counter",
      "building": "new",
      "floor": 1,
      "icon": "💻",
      "script": {
        "th": "ห้องสมุดมี Laptop และ Tablet ให้นิสิตยืมใช้ภายในอาคาร รวม 200 เครื่อง\n\nนิสิตยังใช้คอมพิวเตอร์ตั้งโต๊ะที่จัดไว้ได้ (ชี้ไปทางห้อง PC) มีทั้งหมด 100 เครื่อง\n\nต้องจองอุปกรณ์ก่อนใช้งาน ตรวจสอบและจองได้ทางเว็บไซต์ห้องสมุด",
        "en": "The library provides laptops and tablets for students to borrow for use within the library building — 200 devices in total.\n\nStudents may also use the desktop computers provided here. (Point towards the PC room.) We offer 100 PCs.\n\nStudents are required to book a device before use. Availability and reservations can be checked via the library website."
      },
      "facts": [
        "Laptop/Tablet 200 เครื่อง",
        "PC 100 เครื่อง",
        "จองผ่านเว็บไซต์"
      ],
      "notes": [
        "ยืนหน้าเคาน์เตอร์ Laptop",
        "ตอนพูดถึง PC ให้ชี้ไปทางห้อง PC"
      ],
      "emphasis": {
        "exec": "จำนวนอุปกรณ์ที่ให้บริการ และระบบจองออนไลน์",
        "student": "การยืม Laptop/Tablet และการจองผ่านเว็บไซต์"
      }
    },
    {
      "id": "roof",
      "ref": "4",
      "name": "The Edible Roof · Outdoor Reading Area",
      "en": "The Edible Roof (Outdoor Reading Area)",
      "building": "new",
      "floor": 4,
      "icon": "🥬",
      "script": {
        "th": "พื้นที่นี้เรียกว่า \"The Edible Roof\" เพราะพืชส่วนใหญ่ที่เห็นกินได้ ทั้งผักสวนครัวและสมุนไพร\n\nริเริ่มโดยคณะสถาปัตยกรรมศาสตร์ มก. เพื่อแสดงให้เห็นว่าแม้อยู่กลางเมืองและบนอาคารแบบนี้ ก็ยังปลูกพืชและทำเกษตรในเมืองได้\n\nเรายังใช้พื้นที่นี้สำหรับรับรองแขกและจัดกิจกรรมด้วย",
        "en": "This area is called \"The Edible Roof\" because most of the plants you see are edible, such as kitchen-garden vegetables and herbs.\n\nIt was initiated by the Faculty of Architecture at Kasetsart University to demonstrate that even in the heart of the city, and within buildings like this, planting and urban cultivation are still possible.\n\nWe also use this area for receptions and activities."
      },
      "facts": [
        "ผักสวนครัว · สมุนไพร",
        "Urban farming"
      ],
      "notes": [
        "ออกลิฟต์ชั้น 4 เลี้ยวซ้ายออกไป Outdoor",
        "จบจุดนี้ เดินเข้าไปข้างในชั้น 4 ตรงเสาที่มีเครื่องวัด CO₂"
      ],
      "emphasis": {
        "exec": "ตัวอย่างความร่วมมือกับคณะ และพื้นที่รับรองแขก",
        "student": "มุมอ่านหนังสือกลางแจ้งที่ใช้ได้"
      }
    },
    {
      "id": "air",
      "ref": "5",
      "name": "เครื่องวัด CO₂ · ระบบบริหารจัดการคุณภาพอากาศ",
      "en": "Reading Floor & CO₂ Air-Quality System",
      "building": "new",
      "floor": 4,
      "icon": "🌬️",
      "script": {
        "th": "ชั้น 4 เป็นพื้นที่อ่านหนังสือ ส่วนใหญ่เป็นโต๊ะกลุ่มสำหรับพูดคุย เป็นชั้นที่นิสิตนิยมที่สุด เราเดาว่าเพราะไม่มีเจ้าหน้าที่ประจำชั้นนี้ ช่วงสอบคนจะแน่นมาก เราจึงใส่ใจเรื่องคุณภาพอากาศ\n\nเราใช้ระบบตรวจวัด CO₂ แบบเรียลไทม์ หากค่าเกินมาตรฐาน ระบบจะแจ้งเตือนทีมบริหารอาคารอัตโนมัติ เพื่อดำเนินการทันที\n\nขั้นแรกคือนำเครื่องฟอกอากาศแบบเคลื่อนที่มาเพิ่ม หากยังสูงอยู่ จะแลกเปลี่ยนอากาศระหว่างภายในและภายนอก\n\nแต่อากาศภายนอกค่อนข้างร้อน การนำเข้ามาโดยตรงจะเพิ่มภาระเครื่องปรับอากาศ ใช้พลังงานและค่าไฟมากขึ้น เราจึงลดอุณหภูมิอากาศภายนอกก่อนนำเข้าอาคาร โดยใช้น้ำเย็นที่นำกลับมาจากระบบทำความเย็น ลดอุณหภูมิได้ประมาณ 4–6 องศาเซลเซียส\n\nนี่คือตัวอย่างหนึ่งของ Green Library ที่แสดงความมุ่งมั่นด้านประสิทธิภาพพลังงานและการอนุรักษ์สิ่งแวดล้อม",
        "en": "The 4th floor is a reading area, mainly featuring group tables for discussion. It's the most popular floor for KU students — we guess it's because there is no library staff on this floor. It's fully crowded, especially during exams, so we are concerned about the air quality here.\n\nWe use a real-time CO₂ monitoring system to ensure good indoor air quality. If the CO₂ level rises above the standard, a notification is automatically sent to the building management team, who take immediate action.\n\nThe first step is to bring additional portable air purifiers into the area. If the level remains high, we proceed with air exchange between indoors and outdoors.\n\nHowever, the outdoor air is quite hot. Bringing it directly into the building would increase the workload of the air-conditioning system, leading to higher energy consumption and electricity costs. To address this, we cool the outdoor air before bringing it in, using chilled water recovered from the cooling system. This reduces the air temperature by approximately 4–6 °C.\n\nThis is one practical example of our Green Library initiatives, demonstrating our commitment to energy efficiency and environmental conservation."
      },
      "facts": [
        "วัด CO₂ แบบเรียลไทม์",
        "แจ้งเตือนทีมอาคารอัตโนมัติ",
        "ลดอุณหภูมิอากาศเข้า 4–6 °C"
      ],
      "notes": [
        "ยืนอธิบายตรงเสาที่มีเครื่องวัด CO₂",
        "จบจุดนี้ ลงบันไดไปชั้น 3 Agro Hub"
      ],
      "emphasis": {
        "exec": "ระบบจัดการพลังงานและผลด้านค่าใช้จ่าย — ใช้เวลาจุดนี้ให้มาก",
        "student": "ชั้นยอดนิยมช่วงสอบ และการดูแลอากาศให้ผู้ใช้"
      }
    },
    {
      "id": "agrohub",
      "ref": "6",
      "name": "Agro Hub · ห้องศึกษาเดี่ยว/กลุ่ม",
      "en": "Agro Hub & Study Rooms",
      "building": "new",
      "floor": 3,
      "icon": "🌾",
      "script": {
        "th": "ทราบไหมว่าชื่อ \"เกษตรศาสตร์\" แปลว่าอะไร \"เกษตร\" คือการเกษตร \"ศาสตร์\" คือความรู้ รวมกันคือ \"ความรู้ด้านการเกษตร\" แรกเริ่ม มก. มีเพียงคณะด้านการเกษตร แต่วันนี้ครอบคลุมเกือบทุกสาขาทั้งวิทยาศาสตร์และสังคมศาสตร์ เปิดโรงเรียนแพทย์เมื่อ 2 ปีก่อน ปีที่แล้วเปิดโรงเรียนพยาบาล และปีนี้เปิดคณะเภสัชศาสตร์\n\nAgro Hub คือศูนย์กิจกรรมการเกษตรอัจฉริยะ ให้เข้าถึงแหล่งความรู้ด้านการเกษตร โดยมีบรรณารักษ์เฉพาะสาขาและผู้เชี่ยวชาญของ มก. สนับสนุน\n\nเป็นพื้นที่กิจกรรมแบบไฮบริด จัดกิจกรรมได้ทั้งออนไลน์และในสถานที่พร้อมกัน และมีนิทรรศการที่เชื่อมกับนิทรรศการเสมือนจริง (Virtual Exhibition) เข้าถึงผลงานวิจัยของ มก. และแหล่งสารสนเทศได้ง่าย\n\nห้องศึกษาเดี่ยว – มี 22 ห้อง\n\nห้องศึกษากลุ่ม (ฝั่งตรงข้าม) – มี 5 ห้อง ใหญ่กว่าห้องที่ชั้น 2 รองรับได้สูงสุดห้องละ 12 คน",
        "en": "Do you know the meaning of the university name, \"Kasetsart\"? \"Kaset\" means agriculture and \"Sart\" means knowledge — so \"Kasetsart\" means \"Knowledge about Agriculture\". At the very beginning, Kasetsart University only had faculties related to agriculture. Today we cover almost every field, in both the sciences and social sciences. We opened our School of Medicine two years ago, added the School of Nursing last year, and this year we are opening the Faculty of Pharmaceutical Sciences.\n\nAgro Hub is a Smart Agricultural Activities Center that provides access to agricultural knowledge resources, supported by subject librarians and KU experts.\n\nIt is a hybrid activity space, offering online and on-site events at the same time. The area also features exhibitions connected to a Virtual Exhibition, giving easy access to KU's research insights and a wide range of information resources.\n\nIndividual study rooms – there are 22 individual rooms.\n\nGroup study rooms (opposite side) – there are 5 group study rooms, bigger than the rooms on the 2nd floor, accommodating up to 12 people per room."
      },
      "facts": [
        "Kaset = เกษตร · Sart = ความรู้",
        "กิจกรรมแบบ Hybrid",
        "ห้องเดี่ยว 22 ห้อง",
        "ห้องกลุ่ม 5 ห้อง (≤ 12 คน/ห้อง)"
      ],
      "notes": [
        "ยืนหน้า Agro Hub ถามความหมายของ \"Kasetsart\" ก่อน",
        "พาเดินไปด้านขวา ให้มองผ่านกระจกเข้าไปในห้อง Agro Hub",
        "พาเดินวนไปทางห้องเดี่ยว ไปออกใกล้ลิฟต์",
        "จบจุดนี้ ลงบันไดไปชั้น 2 Edutainment Zone"
      ],
      "link": {
        "label": "Virtual Exhibition (lib.ku.ac.th/vr)",
        "url": "https://lib.ku.ac.th/vr/"
      },
      "emphasis": {
        "exec": "บทบาทศูนย์ความรู้ด้านการเกษตร และการเชื่อมผลงานวิจัยสู่สาธารณะ",
        "student": "บรรณารักษ์เฉพาะสาขา กิจกรรมออนไลน์ และห้องศึกษาที่จองได้"
      }
    },
    {
      "id": "edutainment",
      "ref": "7",
      "name": "Edutainment Zone",
      "en": "Edutainment Zone",
      "building": "new",
      "floor": 2,
      "icon": "🎲",
      "script": {
        "th": "บอร์ดเกม – มีบอร์ดเกมให้ยืมเล่นภายในห้องสมุดมากกว่า 200 กล่อง โดยต้องเล่นในห้องบอร์ดเกม ช่วงสอบจะงดบริการ เพราะการเล่นอาจมีเสียงรบกวนผู้ที่อ่านหนังสือเตรียมสอบ\n\nเก้าอี้นวด – เป็นบริการเดียวที่มีค่าใช้จ่าย เริ่มต้น 20 บาท ต่อ 10 นาที\n\nTheatre Room และ Mini Theatre Room – นิสิตเลือกโปรแกรมจากสตรีมมิ่ง เช่น Netflix, Disney+, HBO Go ไม่ต้องจองที่นั่ง ถ้ามีการฉายอยู่ก็เข้าไปร่วมชมกับเพื่อนได้เลย\n\nห้องนี้ยังใช้เป็นพื้นที่บรรยายได้ อาจารย์จองห้องเพื่อสอนหรือบรรยายได้ เช่น อาจารย์คณะมนุษยศาสตร์พานิสิตภาษาฝรั่งเศสมาชมภาพยนตร์ฝรั่งเศส ตามด้วยการบรรยายสั้น ๆ เรื่องภาษาและวัฒนธรรมฝรั่งเศส เป็นอีกวิธีเปลี่ยนบรรยากาศการเรียนรู้",
        "en": "Board games – we offer a variety of board games for students to borrow and play inside the library — more than 200 boxes. Students are required to play in the board game room. During exams, the board game service is closed, as playing can be noisy and may disturb students who are studying.\n\nMassage chairs – the only service that requires payment, starting at 20 baht for 10 minutes.\n\nTheatre Room & Mini Theatre Room – students can choose programs from streaming services: Netflix, Disney+ and HBO Go. There's no need to reserve a seat — if a program is showing, students can just walk in and join their friends.\n\nThis room can also be used as a lecture space. Instructors can reserve the theatre room to hold a class. For example, a lecturer from the Faculty of Humanities brought French-language students to watch a French movie, followed by a short lecture about French language and culture. It is one way to change the learning environment."
      },
      "facts": [
        "บอร์ดเกม 200+ กล่อง",
        "เก้าอี้นวด 20 บาท/10 นาที",
        "Netflix · Disney+ · HBO Go"
      ],
      "notes": [
        "เริ่มที่หน้าเคาน์เตอร์ Board Game ชี้ให้ดูกล่องที่เคาน์เตอร์ก่อน ยังไม่ต้องเดินไปห้องบอร์ดเกม",
        "Theatre Room: พาไปดูหน้าห้อง หรือแง้มม่านให้เห็นจอ ถ้าห้องว่างพาเข้าไปได้เลย"
      ],
      "emphasis": {
        "exec": "แนวคิด Edutainment และการใช้ Theatre Room เป็นห้องเรียน",
        "student": "บริการที่ใช้ได้ฟรี กติกาช่วงสอบ และ Theatre Room"
      }
    },
    {
      "id": "boardgame",
      "ref": "8",
      "name": "ห้อง Board Game & ห้องศึกษากลุ่ม",
      "en": "Board Game Room & Group Study Rooms",
      "building": "new",
      "floor": 2,
      "icon": "🧩",
      "script": {
        "th": "นี่คือห้องบอร์ดเกม ช่วงสอบเราเปลี่ยนเป็นห้องอ่านหนังสือ เพราะช่วงสอบหาที่นั่งว่างได้ยากมาก\n\nห้องศึกษากลุ่ม – ชั้น 2 มี 4 ห้อง ตรวจสอบและจองได้จากเว็บไซต์ห้องสมุด ตั้งแต่ปีการศึกษานี้ เรานำเทคโนโลยีมาใช้กับการจองและเข้าห้อง ผู้ใช้ไม่ต้องใช้กุญแจ แต่เข้าห้องด้วยระบบจดจำใบหน้า หรือ QR Code ที่ได้รับตอนจอง",
        "en": "This is the board game room. During exams, we turn it into a reading room — during exam periods it's usually hard to find an empty seat.\n\nGroup study rooms – there are 4 rooms on the 2nd floor. Students check availability and book the rooms via the library website. Starting this academic year, we have applied technology to study-room reservation and access: users don't need keys, but use facial recognition or the QR code received when booking to enter the room."
      },
      "facts": [
        "~1,000 ที่นั่ง",
        "ผู้ใช้ ~2,000 คน/วัน · ช่วงสอบ 4,000–5,000",
        "ห้องกลุ่มชั้น 2: 4 ห้อง",
        "เข้าห้องด้วยใบหน้า/QR Code"
      ],
      "notes": [
        "ยืนจุดที่มองเห็นทั้งห้องบอร์ดเกมและห้องศึกษากลุ่ม",
        "Tips: ห้องสมุดมีประมาณ 1,000 ที่นั่ง ผู้ใช้เฉลี่ยช่วงปกติ ~2,000 คน/วัน ช่วงสอบสูงถึง 4,000–5,000 คน/วัน",
        "จบจุดนี้ เดินทางเชื่อมอาคารชั้น 2 ไปอาคารช่วงเกษตรศิลปการ"
      ],
      "emphasis": {
        "exec": "การนำเทคโนโลยีจดจำใบหน้า/QR มาใช้กับการเข้าห้อง และความต้องการที่นั่งช่วงสอบ",
        "student": "ห้องบอร์ดเกมเป็นห้องอ่านช่วงสอบ และการจองห้องกลุ่ม"
      }
    },
    {
      "id": "bridge",
      "ref": "9",
      "name": "อาคารช่วงเกษตรศิลปการ · เวลาเปิดบริการ",
      "en": "Old Building (via Link Bridge) – Opening Hours",
      "building": "bridge",
      "floor": 2,
      "icon": "🌉",
      "script": {
        "th": "เรากำลังเข้าสู่อาคารเก่าของห้องสมุด ชื่อ \"อาคารช่วงเกษตรศิลปการ\" ทรัพยากรสิ่งพิมพ์ทั้งหมดอยู่ในอาคารนี้ ชั้น 3 เก็บสิ่งพิมพ์ที่ตีพิมพ์มานานกว่า 13 ปี ส่วนสิ่งพิมพ์ที่ใหม่กว่าอยู่ชั้น 1\n\nเราจะเดินลงไปชั้น 1 เพื่อแนะนำ Eco-Library\n\n(ระหว่างเดิน) ช่วงปกติห้องสมุดเปิดถึง 2 ทุ่ม ช่วงสอบกลางภาคเปิดถึงเที่ยงคืน และช่วงสอบปลายภาคเปิด 24 ชั่วโมง ติดต่อกัน 3 สัปดาห์ (จันทร์–ศุกร์)",
        "en": "We are now at the old building of the library, named \"ช่วงเกษตรศิลปการ\". All printed materials are housed in this building. The 3rd floor houses printed materials published more than 13 years ago; newer materials are on the first floor.\n\nWe will be walking down to the first floor, where I'll introduce you to the Eco-Library.\n\n(While walking) During the normal period, we open until 8 PM. During mid-term exams, we open until midnight. During final exams, we open 24 hours for 3 weeks (Mon–Fri)."
      },
      "facts": [
        "ชั้น 3: สิ่งพิมพ์เก่ากว่า 13 ปี",
        "ชั้น 1: สิ่งพิมพ์ใหม่",
        "ปกติ: ถึง 20.00 น.",
        "สอบกลางภาค: ถึงเที่ยงคืน",
        "สอบปลายภาค: 24 ชม. 3 สัปดาห์ (จ.–ศ.)"
      ],
      "notes": [
        "พูดระหว่างเดิน ไม่ต้องหยุดนาน",
        "เวลาเปิดบริการเป็นข้อมูลเสริม (Tips) พูดระหว่างเดินลงบันได"
      ],
      "emphasis": {
        "exec": "การจัดเก็บทรัพยากรสิ่งพิมพ์ และการขยายเวลาบริการตามความต้องการของผู้ใช้",
        "student": "จำเวลาเปิดช่วงสอบไว้ใช้วางแผนอ่านหนังสือ"
      }
    },
    {
      "id": "ecoFront",
      "ref": "10",
      "name": "ด้านหน้า Eco-Library · ตู้ Card Catalog",
      "en": "Card Catalog Cabinets & Eco-Library Entrance",
      "building": "old",
      "floor": 1,
      "icon": "🗂️",
      "script": {
        "th": "ทราบไหมว่านี่คืออะไร นี่คือ \"ตู้บัตรรายการ\" (Card Catalog Cabinet) สมัยที่โลกยังไม่มีอินเทอร์เน็ต ห้องสมุดทั่วโลกมีตู้นี้ไว้ช่วยผู้ใช้หาหนังสือ แต่ปัจจุบันทุกอย่างอยู่ออนไลน์ ตู้นี้จึงเป็นของตกแต่งในฐานะสัญลักษณ์ของห้องสมุด และวันนี้ผู้ใช้ต้องสืบค้นทรัพยากรผ่านเว็บไซต์ห้องสมุด\n\n(หน้าห้อง) Eco-Library สร้างขึ้นด้วย 2 วัตถุประสงค์ หนึ่ง ส่งเสริมการอ่าน หนังสือด้านในเป็นหนังสืออ่านเล่นทั้งหมด สอง สร้างความตระหนักเรื่องการอนุรักษ์พลังงานและสิ่งแวดล้อม เฟอร์นิเจอร์ด้านใน 100% ทำจากวัสดุรีไซเคิลและนำกลับมาใช้ใหม่",
        "en": "Do you know what these are? They are card catalog cabinets. When the world had no internet, every library around the world had these cabinets and cards to help users find the books they needed. Today everything is online, so these cabinets are here just for decoration, as a symbol of the library. Today, library users must search for resources via the library website.\n\n(In front of the Eco-Library) The Eco-Library was built with 2 objectives: first, to encourage people to read — all the materials inside are recreational books; second, to help people realise the importance of energy and environmental conservation. 100% of the furniture inside the Eco-Library is made from recycled and reused materials."
      },
      "facts": [
        "ตู้ Card Catalog ของจริง",
        "เฟอร์นิเจอร์รีไซเคิล 100%"
      ],
      "notes": [
        "ยืนหน้าตู้ Card Catalog: ถ้าผู้เยี่ยมชมมีอายุ ปรับคำพูด เช่น \"ทุกท่านคงรู้จักตู้นี้ แต่นิสิตปัจจุบันไม่มีใครรู้จักแล้ว\"",
        "Tips: บัตรในตู้เป็นบัตรดั้งเดิมที่เคยใช้ให้บริการจริงในห้องสมุดนี้ เลือกเก็บไว้ส่วนหนึ่ง",
        "จบจุดนี้ เดินเข้าไปในห้อง Eco-Library"
      ],
      "emphasis": {
        "exec": "จากระบบบัตรรายการสู่การสืบค้นออนไลน์ และแนวคิดวัสดุรีไซเคิล",
        "student": "ปัจจุบันสืบค้นทรัพยากรทั้งหมดผ่านเว็บไซต์ห้องสมุด"
      }
    },
    {
      "id": "eco",
      "ref": "11",
      "name": "ห้อง Eco-Library · การยืมหนังสือ",
      "en": "Inside the Eco-Library – Ways to Borrow",
      "building": "old",
      "floor": 1,
      "icon": "♻️",
      "script": {
        "th": "(ช่องหนังสือช่องแรก) ลองทายดูว่าเก้าอี้สตูลสีดำนี้ทำจากอะไร … เฉลย ทำจากยางรถยนต์เก่า\n\n(หน้าชั้นหนังสือเด็ก) Eco-Library ออกแบบสำหรับทุกคนในครอบครัว มีพื้นที่อ่านส่วนกลางที่ทุกคนใช้ได้ และ Kids' Reading Space สำหรับเด็กอายุต่ำกว่า 15 ปีโดยเฉพาะ\n\nนิสิตเสนอแนะหนังสือที่อยากอ่านได้ ห้องสมุดจะพิจารณาจัดซื้อ และผู้เสนอจะได้รับแจ้งเมื่อหนังสือพร้อม และได้ยืมเป็นคนแรก\n\n(ตรงเครื่อง Self-check) การยืมหนังสือทำได้หลายวิธี: 1) ที่เคาน์เตอร์ยืม-คืน 2) เครื่องยืม-คืนด้วยตนเอง 3) ขอให้ส่งทางไปรษณีย์ฟรี 4) ถ้ามาไม่ทันเวลาเปิด ขอให้ใส่ตู้ล็อกเกอร์หน้าอาคาร เราจะอีเมลหมายเลขตู้และรหัสให้มารับได้ตามสะดวก",
        "en": "(At the first bookshelf) Can you guess what this black stool is made of? … It's made from old car tyres.\n\n(At the children's shelves) The Eco-Library is designed for every member of the family. There is a common reading area and a Kids' Reading Space, exclusively for children under 15.\n\nStudents can also recommend books they'd like to read, and the library will consider purchasing them. The requester is notified when the book is ready and gets to borrow it first.\n\n(At the self-check machine) There are many ways to borrow books: 1) at the circulation counter; 2) at the self-check machine; 3) by requesting delivery by post, free of charge; or 4) if users can't come during opening hours, they can ask us to put the books in a locker outside the building — we'll email them the locker number and passcode so they can pick them up at their convenience."
      },
      "facts": [
        "สตูลจากยางรถยนต์เก่า",
        "Kids' Reading Space (< 15 ปี)",
        "ยืมได้ 4 ช่องทาง",
        "ส่งไปรษณีย์ฟรี"
      ],
      "notes": [
        "เข้าห้อง: ให้ทายว่าเก้าอี้สตูลสีดำทำจากอะไร (เฉลย: ยางรถยนต์เก่า)",
        "พาวนเดินออก แล้วพูดเรื่องวิธียืมหนังสือตรงเครื่อง Self-check",
        "ถ่ายภาพหน้าห้อง Eco-Library",
        "จบจุดนี้ เดินผ่านทางเข้าไป Reference Desk (โต๊ะบรรณารักษ์)"
      ],
      "emphasis": {
        "exec": "นวัตกรรมวัสดุรีไซเคิล และบริการส่งหนังสือถึงผู้ใช้",
        "student": "เสนอซื้อหนังสือ และช่องทางยืมที่สะดวก (ล็อกเกอร์ ไปรษณีย์)"
      }
    },
    {
      "id": "refdesk",
      "ref": "12.1",
      "name": "Reference Desk · เครือข่ายห้องสมุด · AI Corner",
      "en": "Reference Desk, Library Network & AI Corner (full)",
      "building": "old",
      "floor": 1,
      "icon": "💁",
      "script": {
        "th": "นี่คือโต๊ะบรรณารักษ์ (Reference Desk) ให้คำปรึกษาในเวลาทำการ และผู้ใช้ยังติดต่อบรรณารักษ์ได้หลายช่องทาง เช่น แชตบนเว็บไซต์ห้องสมุด และโซเชียลมีเดีย หรือนัดหมายประชุมออนไลน์สำหรับเรื่องซับซ้อน เช่น ปัญหา EndNote หรือ Turnitin\n\nประชาคม มก. เข้าใช้ทรัพยากรออนไลน์ เช่น ฐานข้อมูลออนไลน์ ได้ทุกที่ทุกเวลาด้วยบัญชี KU แม้อยู่นอกมหาวิทยาลัย และแม้ไม่ได้มาห้องสมุดก็ยังปรึกษาบรรณารักษ์ทางออนไลน์ได้\n\nที่นี่คือห้องสมุดหลักของ มก. นอกจากนี้ยังมีห้องสมุดวิทยาเขตอีก 3 แห่ง และในวิทยาเขตบางเขนยังมีห้องสมุดคณะอีก 12 แห่ง ผู้ใช้สืบค้นได้จากระบบสืบค้นกลางผ่านเว็บไซต์\n\nการยืมระหว่างห้องสมุด\n• ผู้ใช้ที่บางเขนยืมหนังสือจากห้องสมุดวิทยาเขตอื่นของ มก. ได้ และในทางกลับกัน\n• ยืมหนังสือหรือขอสำเนาบทจากมหาวิทยาลัยรัฐในประเทศไทยที่มีเครือข่ายร่วมกันได้\n• เริ่มเดือนธันวาคม ผู้ใช้จะยืมหนังสือหรือขอสำเนาบทจากมหาวิทยาลัยต่างประเทศได้ด้วย\n\nAI Corner – ห้องสมุดบอกรับ AI Tools รุ่น Premium เช่น Claude AI Pro, ChatGPT Pro, Perplexity Pro เป็นต้น ผู้ใช้ต้องเข้าใช้งานผ่านคอมพิวเตอร์ที่จัดไว้ในมุมนี้",
        "en": "This is the reference desk, where librarians provide consultation during library opening hours. Users can also talk to a librarian in many ways, e.g. chat on the library website or social media. They can also make an appointment for an online meeting for complicated consultations, such as problems with EndNote or Turnitin.\n\nThe KU community can access online resources such as online databases anytime, anywhere, using their KU account, even when off campus. Even if they don't visit the library in person, they can still talk to a librarian online.\n\nThe library you're standing in is KU's main library. We also have another 3 campus libraries, and within Bangkhen campus another 12 branch (faculty) libraries. Library users can access the centralised search system via the website.\n\nInterlibrary loan:\n• Users at Bangkhen can borrow books from other KU campus libraries, and vice versa.\n• They can even borrow books, or request a copy of a book chapter, from other government universities in Thailand within our collaboration network.\n• Starting in December, users will also be able to borrow books or request chapter copies from overseas universities.\n\nAI Corner – the library subscribes to premium versions of AI tools such as Claude AI Pro, ChatGPT Pro and Perplexity Pro, but users must access them via the computers provided here."
      },
      "facts": [
        "ห้องสมุดวิทยาเขต 3 แห่ง",
        "ห้องสมุดคณะที่บางเขน 12 แห่ง",
        "ยืมระหว่างห้องสมุด: มก. · ม.รัฐ",
        "ธ.ค.: เครือข่ายต่างประเทศ",
        "Claude · ChatGPT · Perplexity (Pro)"
      ],
      "notes": [
        "เดินผ่านทางเข้าไปที่โต๊ะบรรณารักษ์",
        "จบจุดนี้ เดินไปหน้าตู้ KULib Points"
      ],
      "emphasis": {
        "exec": "เครือข่ายความร่วมมือในประเทศ และการขยายสู่ต่างประเทศ (ธ.ค.)",
        "student": "ปรึกษาบรรณารักษ์ออนไลน์ (EndNote, Turnitin) และการยืมข้ามวิทยาเขต"
      }
    },
    {
      "id": "refdeskShort",
      "ref": "12.2",
      "name": "Reference Desk · AI Corner (ฉบับย่อ)",
      "en": "Reference Desk & AI Corner (short)",
      "building": "old",
      "floor": 1,
      "icon": "💁",
      "script": {
        "th": "นี่คือโต๊ะบรรณารักษ์ (Reference Desk) ที่บรรณารักษ์ให้ความช่วยเหลือ ผู้ใช้ยังติดต่อเราได้ทางแชตออนไลน์ โซเชียลมีเดีย หรือนัดปรึกษาออนไลน์\n\nประชาคม มก. เข้าใช้ทรัพยากรออนไลน์ เช่น ฐานข้อมูลออนไลน์ ได้ทุกที่ทุกเวลาด้วยบัญชี KU แม้อยู่นอกมหาวิทยาลัย และแม้ไม่ได้มาห้องสมุดก็ยังปรึกษาบรรณารักษ์ทางออนไลน์ได้\n\nมก. มีห้องสมุดวิทยาเขต 4 แห่ง และห้องสมุดคณะที่บางเขน 12 แห่ง ทั้งหมดเชื่อมกันด้วยระบบสืบค้นกลาง\n\nบริการยืมระหว่างห้องสมุดให้ผู้ใช้ยืมหนังสือจากวิทยาเขตอื่นของ มก. และมหาวิทยาลัยในเครือข่ายในประเทศไทย และเริ่มเดือนธันวาคม จะขยายไปถึงมหาวิทยาลัยต่างประเทศ\n\nAI Corner – ห้องสมุดบอกรับ AI Tools รุ่น Premium เช่น Claude AI Pro, ChatGPT Pro, Perplexity Pro เป็นต้น ผู้ใช้ต้องเข้าใช้งานผ่านคอมพิวเตอร์ที่จัดไว้ในมุมนี้",
        "en": "This is our Reference Desk, where librarians provide assistance. Users can also contact us via online chat, social media, or scheduled online consultations.\n\nThe KU community can access online resources such as online databases anytime, anywhere, using their KU account, even when off campus. Even if they don't visit the library in person, they can still talk to a librarian online.\n\nKU has 4 campus libraries and 12 faculty libraries at Bangkhen, all connected through a centralised search system.\n\nOur interlibrary loan service allows users to borrow books from other KU campuses and partner universities in Thailand. Starting in December, this service will expand to overseas universities.\n\nAI Corner – the library subscribes to premium versions of AI tools such as Claude AI Pro, ChatGPT Pro and Perplexity Pro, but users must access them via the computers provided here."
      },
      "facts": [
        "ห้องสมุดวิทยาเขต 4 แห่ง",
        "ห้องสมุดคณะที่บางเขน 12 แห่ง",
        "ธ.ค.: ยืมจากต่างประเทศ",
        "AI Tools รุ่น Pro"
      ],
      "notes": [
        "เดินผ่านทางเข้าไปที่โต๊ะบรรณารักษ์",
        "จบจุดนี้ เดินไปหน้าตู้ KULib Points"
      ],
      "emphasis": {
        "exec": "เครือข่ายห้องสมุดและการขยายสู่ต่างประเทศ",
        "student": "ปรึกษาบรรณารักษ์ได้หลายช่องทาง และใช้ AI รุ่น Premium ได้ฟรีที่มุมนี้"
      }
    },
    {
      "id": "kulib",
      "ref": "13",
      "name": "KULib Points",
      "en": "KULib Points",
      "building": "old",
      "floor": 1,
      "icon": "🏅",
      "script": {
        "th": "ห้องสมุดอยากส่งเสริมให้นิสิตเข้าร่วมกิจกรรมของห้องสมุด จึงจัดโครงการสะสมแต้ม เมื่อนิสิตเข้าร่วมกิจกรรมจะได้รับแต้ม และเมื่อสะสมถึงระดับที่กำหนด ก็นำแต้มมาแลกของที่ระลึกเหล่านี้ได้\n\nได้กี่แต้มต่อกิจกรรม ขึ้นอยู่กับเวลาที่นิสิตใช้ เช่น เข้าร่วมปฐมนิเทศห้องสมุด 2 ชั่วโมง ได้ 20 แต้ม ร่วมตอบคำถามออนไลน์ได้ 5 แต้ม",
        "en": "The library wants to encourage students to take part in library activities, so we set up a points collection program. When students participate in library activities, they receive points. Once they collect enough points, they can trade them for these freebies.\n\nHow many points per activity? It depends on how much time students devote. For example, joining the 2-hour library orientation earns 20 points, and joining an online quiz earns 5 points."
      },
      "facts": [
        "ปฐมนิเทศ 2 ชม. = 20 แต้ม",
        "ตอบคำถามออนไลน์ = 5 แต้ม",
        "แลกของที่ระลึกได้"
      ],
      "notes": [
        "ยืนหน้าตู้โชว์รางวัลการสะสมแต้ม KULib Points",
        "ชี้ชวนดูของที่ระลึก ว่าขั้นต่ำที่จะได้ของใช้กี่แต้ม"
      ],
      "emphasis": {
        "exec": "กลไกสร้างแรงจูงใจให้นิสิตมีส่วนร่วมกับห้องสมุด",
        "student": "เข้าร่วมกิจกรรมสะสมแต้ม แลกของที่ระลึก"
      }
    },
    {
      "id": "closing",
      "ref": "13",
      "name": "Wrap-up · ถาม-ตอบ · ประเมิน · ถ่ายภาพ",
      "en": "Wrap-up, Q&A & Evaluation",
      "building": "new",
      "floor": 1,
      "icon": "💚",
      "script": {
        "th": "การนำชมของเราก็มาถึงตอนท้ายแล้ว หวังว่าทุกท่านจะเพลิดเพลินและได้รู้จักห้องสมุดของเรามากขึ้น ก่อนจบ มีคำถามหรือเรื่องที่อยากทราบเพิ่มเติมไหม\n\nขอบคุณมากที่มาเยี่ยมชมในวันนี้ ก่อนกลับ รบกวนช่วยทำแบบประเมินสั้น ๆ เกี่ยวกับประสบการณ์วันนี้ เพื่อช่วยเราพัฒนาการนำชมให้ดีขึ้น",
        "en": "That brings us to the end of our library tour. I hope you've enjoyed the tour and learned a little more about our library. Before we finish, do you have any questions or anything you'd like to know more about?\n\nThank you very much for visiting us today. Before you leave, we'd really appreciate it if you could help us improve the tour program by filling out a short evaluation form about your experience today."
      },
      "facts": [
        "คืนหูฟัง",
        "QR Code แบบประเมิน",
        "ถ่ายภาพหมู่"
      ],
      "notes": [
        "พากลับตึกใหม่ ชั้น 1 เพื่อคืนหูฟัง และทำแบบประเมิน",
        "ถ่ายภาพหมู่หน้าอาคารตึกใหม่ ยืนเรียงตรงบันได"
      ],
      "emphasis": {
        "exec": "ขอบคุณ เชิญให้ข้อเสนอแนะ และเปิดโอกาสความร่วมมือ",
        "student": "ชวนกลับมาใช้บริการ และติดตามช่องทางออนไลน์"
      }
    }
  ],
  "routes": {
    "student": {
      "20": {
        "welcome": 3,
        "meeting": 2,
        "laptop": 2,
        "edutainment": 3,
        "boardgame": 2,
        "bridge": 2,
        "refdeskShort": 2,
        "kulib": 2,
        "closing": 2
      },
      "30": {
        "welcome": 4,
        "meeting": 3,
        "laptop": 2,
        "agrohub": 3,
        "edutainment": 4,
        "boardgame": 2,
        "bridge": 2,
        "ecoFront": 2,
        "eco": 3,
        "refdeskShort": 2,
        "kulib": 2,
        "closing": 1
      },
      "40": {
        "welcome": 4,
        "meeting": 3,
        "laptop": 2,
        "roof": 2,
        "air": 4,
        "agrohub": 4,
        "edutainment": 4,
        "boardgame": 3,
        "bridge": 2,
        "ecoFront": 2,
        "eco": 4,
        "refdeskShort": 2,
        "kulib": 2,
        "closing": 2
      }
    },
    "exec": {
      "20": {
        "welcome": 3,
        "meeting": 2,
        "laptop": 2,
        "edutainment": 3,
        "boardgame": 2,
        "bridge": 2,
        "refdesk": 3,
        "kulib": 2,
        "closing": 1
      },
      "30": {
        "welcomeSlide": 6,
        "meeting": 2,
        "laptop": 2,
        "agrohub": 3,
        "edutainment": 3,
        "bridge": 2,
        "ecoFront": 2,
        "eco": 3,
        "refdesk": 3,
        "kulib": 2,
        "closing": 2
      },
      "40": {
        "welcomeSlide": 6,
        "meeting": 2,
        "laptop": 2,
        "roof": 2,
        "air": 5,
        "agrohub": 4,
        "edutainment": 3,
        "boardgame": 2,
        "bridge": 2,
        "ecoFront": 2,
        "eco": 3,
        "refdesk": 3,
        "kulib": 2,
        "closing": 2
      }
    }
  }
};
