import type { Site } from "@/types/empire";
import { img, pins, SRC } from "./shared";

const ID = "umm-dumayran";

export const ummDumayran: Site = {
  id: ID,
  kind: "cistern",
  typology: "reconstruction",
  name: "Umm al-Dumayran",
  dwelling: "Umm al-Dumayran — pool and ruins in Sawla",
  subtitle: "A cistern and old buildings in the Sawla district of al-Zaymah",
  period: "Undated — likely Islamic era",
  description:
    "A site in Sawla (سولة), one of the districts of al-Zaymah. Arabic Wikipedia lists it among al-Zaymah's landmarks as having a pool and old architectural structures. Sawla is old enough to appear in a verse quoted by the geographer Yaqut. Nothing about the site has been published in detail, so the model is an interpretation: a stone pool with the low walls of rooms beside it.",
  geo: { lat: 21.638662, lng: 40.091818, googleFtid: "0x15ea0f1a5eccdcd7:0xfd1bcc79e1f89b8a" },
  modelPath: `/models/${ID}.glb`,
  tint: "#ae8d63",
  camera: { azimuth: -36, elevation: 32, dist: 0.95, targetY: 0.12 },
  facts: [
    { label: "Period", value: "Undated; Sawla is named by Yaqut (13th c.)", icon: "period" },
    { label: "Location", value: "Sawla district, al-Zaymah", icon: "region" },
    { label: "Built of", value: "Stone and earth (assumed)", icon: "materials" },
    { label: "Recorded", value: "A pool and old structures", icon: "feature" },
    { label: "Model", value: "Interpretive — nothing published", icon: "occupants" },
  ],
  hotspots: pins(ID, [
    { id: "pool", title: "The Pool", short: "A stone-lined cistern", detail: "The site is recorded as having a pool (birka). Its size and shape are not published; the model shows a modest rectangular cistern.", category: "court" },
    { id: "pool-wall", title: "Pool Wall", short: "Coursed stone, partly fallen", detail: "Walls are drawn broken and uneven, as standing ruins in the valley usually are.", category: "structure" },
    { id: "rooms", title: "Ruined Rooms", short: "Old structures beside the pool", detail: "“Old architectural structures” are recorded at the site. The model suggests them as a cluster of small rooms surviving as low walls.", category: "interior" },
    { id: "enclosure", title: "Enclosure", short: "A wall around the complex", detail: "An enclosing wall is assumed, tying the rooms to the pool. It is not attested.", category: "structure" },
    { id: "sawla", title: "Sawla", short: "Named in Yaqut's dictionary", detail: "Yaqut quotes a poet: “my summer pasture in the land of Nakhla, on the slopes of Sawla and al-Zaymah”.", category: "roof" },
  ]),
  interior: {
    kicker: "The Story",
    title: "A Pool in Sawla",
    cta: "Read the history",
    text: "Umm al-Dumayran lies in Sawla, south-west of al-Madiq. Al-Zaymah's landmarks include two old pools in Sawla — Birkat Umm al-Salam and Umm al-Dumayran — on a valley that fed travellers between Makkah, Taif and the north.",
    image: img(ID, "hero.webp"),
  },
  floorPlan: {
    kicker: "Site Plan",
    title: "Pool and Rooms",
    cta: "View the plan",
    text: "The model's layout: a pool about 18 × 14 m, a cluster of four rooms to the west and an enclosure wall. All of it is assumed.",
    image: img(ID, "plan.webp"),
    rooms: [
      { name: "Pool", note: "~18 × 14 m (assumed)" },
      { name: "Rooms", note: "four low-walled rooms" },
      { name: "Enclosure", note: "assumed" },
      { name: "Tumble", note: "fallen stone" },
    ],
  },
  artifacts: {
    kicker: "Features",
    title: "What Is Recorded",
    cta: "View features",
    text: "What the sources record, and what the model adds.",
    image: img(ID, "aerial-2.webp"),
    items: [
      { name: "Pool", purpose: "Water storage", material: "Stone", context: "Recorded." },
      { name: "Old structures", purpose: "Unknown", material: "Stone and earth", context: "Recorded, not described." },
      { name: "Enclosure wall", purpose: "Boundary", material: "Stone", context: "Added by the model; not attested." },
    ],
  },
  dailyLife: {
    kicker: "On the Road",
    title: "Between Makkah and Taif",
    cta: "See the route",
    text: "Sawla lies on the valley route between Makkah and the highlands. Pools like this one served travellers and herds.",
    image: img(ID, "route.svg"),
  },
  geography: {
    kicker: "Location",
    title: "In Wadi Nakhla",
    cta: "View location",
    text: "West of the valley floor, between Birkat al-Mutawakkil and al-Zaymah.",
    image: img(ID, "location.svg"),
    regionLabel: "21.6387° N, 40.0918° E",
  },
  lesson: {
    title: "Reading Umm al-Dumayran",
    intro: "A site we know mostly by name — and what that means for the model.",
    blocks: [
      { heading: "The record", body: "Arabic Wikipedia lists Umm al-Dumayran among al-Zaymah's landmarks: “in Sawla, with a pool and old architectural structures”." },
      { heading: "Sawla", body: "Yaqut's 13th-century geographical dictionary quotes a verse naming Sawla beside al-Zaymah, so the place-name at least is old." },
      { heading: "The model", body: "Sizes, shapes and the enclosure are assumptions. The site needs survey and photographs." },
    ],
  },
  quiz: [
    { q: "Which district of al-Zaymah is Umm al-Dumayran in?", choices: ["Sawla", "Hadha", "al-Shajwa", "al-Dahil"], answer: 0, explanation: "It is recorded in Sawla." },
    { q: "What is recorded at the site?", choices: ["A mosque", "A pool and old structures", "A fort", "A market"], answer: 1, explanation: "A pool and old architectural structures." },
    { q: "Which other old pool is recorded in Sawla?", choices: ["Birkat al-‘Ashar", "Birkat Umm al-Salam", "Birkat al-Hasna", "Birkat Zubayda"], answer: 1, explanation: "Birkat Umm al-Salam is also in Sawla." },
  ],
  timeline: [
    { era: "Medieval", year: "13th c.", text: "Yaqut quotes a verse naming Sawla and al-Zaymah." },
    { era: "Today", year: "now", text: "Listed among al-Zaymah's landmarks: a pool and old structures." },
  ],
  keywords: ["Sawla", "pool", "cistern", "ruins", "Zaymah"],
  gallery: [],
  sources: [SRC.zaymahWiki],
  ar: {
    name: "أم الضيمران",
    dwelling: "أم الضيمران — بركة وأطلال في سولة",
    subtitle: "بركة ومبانٍ قديمة في سولة من أعمال الزيمة",
    period: "غير مؤرخ — على الأرجح إسلامي",
    description:
      "موقع في سولة، إحدى نواحي الزيمة. تذكره ويكيبيديا العربية بين معالم الزيمة: «بسولة وبها بركة ومنشآت معمارية قديمة». وسولة اسم قديم ورد في بيت شعر نقله ياقوت الحموي. لم يُنشر عن الموقع شيء مفصل، لذا فالنموذج تفسيري: بركة حجرية بجانبها جدران غرف منخفضة.",
    facts: [
      { label: "الحقبة", value: "غير مؤرخ؛ ذكر ياقوت سولة (القرن 7هـ)" },
      { label: "الموقع", value: "سولة، الزيمة" },
      { label: "البناء", value: "حجر وطين (مفترض)" },
      { label: "المسجَّل", value: "بركة ومنشآت قديمة" },
      { label: "النموذج", value: "تفسيري — لا شيء منشور" },
    ],
    hotspots: [
      { id: "pool", title: "البركة", short: "بركة مبطنة بالحجر", detail: "يُذكر للموقع بركة، ولم يُنشر حجمها ولا شكلها؛ والنموذج يعرض بركة مستطيلة متوسطة." },
      { id: "pool-wall", title: "جدار البركة", short: "مداميك حجرية متهدم بعضها", detail: "رُسمت الجدران متقطعة متفاوتة، كما تبقى الأطلال عادة في الأودية." },
      { id: "rooms", title: "غرف متهدمة", short: "منشآت قديمة بجانب البركة", detail: "يُذكر في الموقع «منشآت معمارية قديمة»، ويقترحها النموذج مجموعةَ غرف صغيرة بقيت منها جدران منخفضة." },
      { id: "enclosure", title: "السور", short: "جدار يحيط بالمجمع", detail: "السور مفترض يربط الغرف بالبركة، وليس موثقاً." },
      { id: "sawla", title: "سولة", short: "ورد اسمها عند ياقوت", detail: "نقل ياقوت بيتاً: «مرتعي من بلاد نخلة في الصيف بأكناف سولة والزيمة»." },
    ],
    interior: { kicker: "الحكاية", title: "بركة في سولة", cta: "اقرأ التاريخ", text: "تقع أم الضيمران في سولة جنوب غرب المضيق. ومن معالم الزيمة بركتان قديمتان في سولة — بركة أم السلم وأم الضيمران — على وادٍ كان يخدم المسافرين بين مكة والطائف والشمال." },
    floorPlan: { kicker: "مخطط الموقع", title: "البركة والغرف", cta: "عرض المخطط", text: "تخطيط النموذج: بركة نحو 18 × 14 م، وأربع غرف غربها، وسور. كل ذلك مفترض.", rooms: [{ name: "البركة", note: "~18 × 14 م (مفترض)" }, { name: "الغرف", note: "أربع غرف منخفضة الجدران" }, { name: "السور", note: "مفترض" }, { name: "الركام", note: "حجارة متساقطة" }] },
    artifacts: { kicker: "المعالم", title: "ما هو مسجَّل", cta: "عرض المعالم", text: "ما تسجله المصادر، وما يضيفه النموذج.", items: [{ name: "البركة", purpose: "خزن الماء", material: "حجر", context: "مسجلة." }, { name: "منشآت قديمة", purpose: "غير معروفة", material: "حجر وطين", context: "مسجلة دون وصف." }, { name: "السور", purpose: "حدّ", material: "حجر", context: "أضافه النموذج؛ غير موثق." }] },
    dailyLife: { kicker: "على الطريق", title: "بين مكة والطائف", cta: "عرض الطريق", text: "تقع سولة على طريق الوادي بين مكة والمرتفعات، وكانت البرك مثل هذه تخدم المسافرين والمواشي." },
    geography: { kicker: "الموقع", title: "في وادي نخلة", cta: "عرض الموقع", text: "غرب بطن الوادي، بين بركة المتوكل والزيمة.", regionLabel: "21.6387° شمالاً، 40.0918° شرقاً" },
    lesson: { title: "قراءة أم الضيمران", intro: "موقع نعرفه غالباً باسمه — وما يعنيه ذلك للنموذج.", blocks: [{ heading: "المسجَّل", body: "تذكر ويكيبيديا العربية أم الضيمران بين معالم الزيمة: «بسولة وبها بركة ومنشآت معمارية قديمة»." }, { heading: "سولة", body: "ينقل معجم البلدان لياقوت (القرن السابع الهجري) بيتاً يذكر سولة مع الزيمة، فالاسم على الأقل قديم." }, { heading: "النموذج", body: "المقاسات والأشكال والسور افتراضات، والموقع يحتاج إلى مسح وصور." }] },
    quiz: [
      { q: "في أي ناحية من الزيمة تقع أم الضيمران؟", choices: ["سولة", "حاذة", "الشجوة", "الدحيلة"], explanation: "مسجلة في سولة." },
      { q: "ما المسجَّل في الموقع؟", choices: ["مسجد", "بركة ومنشآت قديمة", "قلعة", "سوق"], explanation: "بركة ومنشآت معمارية قديمة." },
      { q: "ما البركة القديمة الأخرى المسجلة في سولة؟", choices: ["بركة العشار", "بركة أم السلم", "بركة الحسناء", "بركة زبيدة"], explanation: "بركة أم السلم في سولة أيضاً." },
    ],
    timeline: [
      { era: "العصور الوسطى", year: "القرن 13م", text: "ياقوت ينقل بيتاً يذكر سولة والزيمة." },
      { era: "اليوم", year: "الآن", text: "مدرجة بين معالم الزيمة: بركة ومنشآت قديمة." },
    ],
  },
};
