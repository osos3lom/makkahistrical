import type { Site } from "@/types/empire";
import { img, pins, SRC } from "./shared";

const ID = "madiq";

export const madiq: Site = {
  id: ID,
  kind: "village",
  typology: "reconstruction",
  name: "Al-Madiq",
  dwelling: "Al-Madiq — the valley narrows",
  subtitle: "Where Wadi Nakhla pinches between the mountains",
  period: "Pre-Islamic – today",
  description:
    "A village and administrative centre about 42 km north-east of Makkah. Its name means “the narrows”: here the valley floor closes in between mountain walls. Local tradition and Arabic Wikipedia identify this stretch with Wadi Nakhla al-Shamiya, once known as Wadi al-Laymun for its lemon groves.",
  geo: { lat: 21.660371, lng: 40.121055, googleFtid: "0x15ea0e6fb61aa851:0xad5864aaf920cc24" },
  modelPath: `/models/${ID}.glb`,
  tint: "#b9935f",
  camera: { azimuth: -38, elevation: 26, dist: 1.0, targetY: 0.22 },
  facts: [
    { label: "Period", value: "Settled since before Islam; village today", icon: "period" },
    { label: "Location", value: "42 km NE of Makkah, Taif governorate", icon: "region" },
    { label: "Landscape", value: "Granite mountain walls, alluvial valley floor", icon: "materials" },
    { label: "Known for", value: "Orchards — lemons, palms — fed by the wadi", icon: "feature" },
    { label: "Model", value: "Placeholder massing, not a survey", icon: "occupants" },
  ],
  hotspots: pins(ID, [
    {
      id: "narrows",
      title: "The Narrows",
      short: "The valley floor pinches in",
      detail:
        "The mountains close to a narrow passage here, which is what the name al-Madiq describes. Floodwater and travellers alike were funnelled through it.",
      category: "structure",
    },
    {
      id: "orchards",
      title: "Orchards",
      short: "Lemon and palm groves on the alluvium",
      detail:
        "The valley floor holds water below the surface after the rains. Sources describe the valley as Wadi al-Laymun for the lemon trees grown here.",
      category: "court",
    },
    {
      id: "farmhouse",
      title: "Farmhouses",
      short: "Flat-roofed earth and stone houses",
      detail:
        "Placeholder blocks stand in for the village's farmhouses: thick walls, flat roofs and parapets, set at the edge of the cultivated ground rather than on it.",
      category: "roof",
    },
    {
      id: "channel",
      title: "Water Channel",
      short: "Water led along the valley floor",
      detail:
        "Gardens in Wadi Nakhla were watered from springs and wells, and by channels that carried water along the valley. The line drawn here is schematic.",
      category: "court",
    },
    {
      id: "upper-valley",
      title: "Up the Valley",
      short: "Towards Dhat ‘Irq",
      detail:
        "Tradition places the idol al-‘Uzza in the upper valley, and Dhat ‘Irq — the miqat for pilgrims from Iraq and Najd — at its head.",
      category: "roof",
    },
  ]),
  interior: {
    kicker: "The Story",
    title: "A Valley Called the Narrows",
    cta: "Read the history",
    text:
      "Al-Madiq sits where Wadi Nakhla squeezes between mountains. The valley carried pilgrims and caravans between Makkah, Taif, Najd and Iraq for centuries, and Arabic sources tie it to pre-Islamic memory: al-‘Uzza in the upper valley, the Fijar wars, and remains attributed to the ‘Amaliqa buried under the gardens.",
    image: img(ID, "hero.webp"),
  },
  floorPlan: {
    kicker: "Site Plan",
    title: "Village and Gardens",
    cta: "View the plan",
    text: "A top view of the placeholder massing: the narrows at the centre, gardens and farmhouses on either side, a water channel along the floor.",
    image: img(ID, "plan.webp"),
    rooms: [
      { name: "The narrows", note: "valley pinch point" },
      { name: "West gardens", note: "orchards and palms" },
      { name: "East gardens", note: "orchards and palms" },
      { name: "Farmhouses", note: "four placeholder blocks" },
      { name: "Water channel", note: "schematic" },
    ],
  },
  artifacts: {
    kicker: "Features",
    title: "What to Look For",
    cta: "View features",
    text: "Features named in the sources and shown on the model.",
    image: img(ID, "aerial-2.webp"),
    items: [
      { name: "The narrows", purpose: "Gives the village its name", material: "Granite valley walls", context: "Floodwater and travellers pass through the same gap." },
      { name: "Lemon groves", purpose: "Cultivation", material: "Alluvial soil, groundwater", context: "Some sources call the valley Wadi al-Laymun." },
      { name: "Buried remains", purpose: "Archaeology", material: "Unknown", context: "Arabic Wikipedia records remains attributed to the ‘Amaliqa under the gardens. Unverified." },
      { name: "Road north", purpose: "Pilgrim route", material: "Cleared track", context: "Up-valley to Dhat ‘Irq, miqat of Iraq and Najd pilgrims." },
    ],
  },
  dailyLife: {
    kicker: "On the Road",
    title: "Between Makkah and Taif",
    cta: "See the route",
    text: "Wadi Nakhla was one of the old ways between Makkah and Taif, and the last approach to Makkah for pilgrims coming down Darb Zubayda from Iraq.",
    image: img(ID, "route.svg"),
  },
  geography: {
    kicker: "Location",
    title: "In Wadi Nakhla",
    cta: "View location",
    text: "Al-Madiq is the northernmost of the four sites, about 2 km up-valley from Birkat al-Mutawakkil.",
    image: img(ID, "location.svg"),
    regionLabel: "21.6604° N, 40.1211° E",
  },
  lesson: {
    title: "Reading Al-Madiq",
    intro: "A short walk through what the name, the landscape and the sources tell us.",
    blocks: [
      { heading: "The name", body: "Madiq means a narrow passage. The valley floor closes in here between mountain walls." },
      { heading: "Which Nakhla?", body: "Two valleys are called Nakhla: al-Yamaniya and al-Shamiya. Arabic Wikipedia places al-Madiq in Nakhla al-Shamiya, the northern one." },
      { heading: "Old memories", body: "Sources tie the upper valley to al-‘Uzza, one of the idols of pre-Islamic Makkah, and to Dhat ‘Irq, later the miqat for pilgrims from Iraq." },
      { heading: "A placeholder", body: "The model is simple massing on shaped terrain. It will be replaced by a model built from survey and photographs." },
    ],
  },
  quiz: [
    { q: "What does the name al-Madiq describe?", choices: ["A spring", "A narrow passage", "A fortress", "A market"], answer: 1, explanation: "Madiq means a narrows: the valley pinches between mountains here." },
    { q: "Which crop gave the valley the name Wadi al-Laymun?", choices: ["Dates", "Grapes", "Lemons", "Pomegranates"], answer: 2, explanation: "Some sources call it Wadi al-Laymun for its lemon groves." },
    { q: "What is Dhat ‘Irq, at the head of the valley?", choices: ["A miqat", "A castle", "A dam", "A port"], answer: 0, explanation: "Dhat ‘Irq is the miqat for pilgrims from Iraq and Najd." },
  ],
  timeline: [
    { era: "Pre-Islamic", year: "before 610", text: "Tradition places al-‘Uzza in the upper valley and remembers the Fijar wars here." },
    { era: "Abbasid", year: "8th–10th c.", text: "Darb Zubayda brings Iraqi pilgrims down Wadi Nakhla to Makkah." },
    { era: "Today", year: "now", text: "A village and administrative centre in Taif governorate." },
  ],
  keywords: ["narrows", "lemon", "Nakhla al-Shamiya", "al-Uzza", "Dhat Irq"],
  gallery: [],
  sources: [SRC.madiqWiki, SRC.zubaydahTrail],
  ar: {
    name: "المضيق",
    dwelling: "المضيق — مضيق الوادي",
    subtitle: "حيث يضيق وادي نخلة بين الجبال",
    period: "قبل الإسلام – اليوم",
    description:
      "قرية ومركز إداري على بعد نحو 42 كم شمال شرق مكة المكرمة. يصف اسمها موضعاً يضيق فيه بطن الوادي بين الجبال. وتربط المصادر المحلية وويكيبيديا العربية هذا الموضع بوادي نخلة الشامية، الذي عُرف أيضاً بوادي الليمون لكثرة أشجار الليمون فيه.",
    facts: [
      { label: "الحقبة", value: "مأهول منذ ما قبل الإسلام؛ قرية اليوم" },
      { label: "الموقع", value: "42 كم شمال شرق مكة، محافظة الطائف" },
      { label: "الطبيعة", value: "جبال جرانيتية وبطن وادٍ رسوبي" },
      { label: "يشتهر بـ", value: "البساتين — الليمون والنخيل" },
      { label: "النموذج", value: "كتل مبدئية، وليس مسحاً" },
    ],
    hotspots: [
      { id: "narrows", title: "المضيق", short: "يضيق بطن الوادي هنا", detail: "تقترب الجبال لتشكل ممراً ضيقاً، ومنه جاء اسم المضيق. وكانت السيول والمسافرون يمرون من الفتحة نفسها." },
      { id: "orchards", title: "البساتين", short: "الليمون والنخيل على الطمي", detail: "يحتفظ بطن الوادي بالماء تحت سطحه بعد الأمطار، وتسميه بعض المصادر وادي الليمون لكثرة أشجاره." },
      { id: "farmhouse", title: "البيوت الزراعية", short: "بيوت مسطحة من الطين والحجر", detail: "كتل مبدئية تمثل بيوت القرية: جدران سميكة وأسطح مسطحة وستائر، على حافة الأرض المزروعة لا فوقها." },
      { id: "channel", title: "قناة الماء", short: "ماء يُساق على طول الوادي", detail: "كانت بساتين وادي نخلة تُسقى من العيون والآبار وقنوات تجري في الوادي. الخط المرسوم هنا تخطيطي." },
      { id: "upper-valley", title: "أعلى الوادي", short: "نحو ذات عرق", detail: "تذكر الروايات صنم العزى في أعلى الوادي، وذات عرق — ميقات أهل العراق ونجد — عند رأسه." },
    ],
    interior: { kicker: "الحكاية", title: "وادٍ اسمه المضيق", cta: "اقرأ التاريخ", text: "يقع المضيق حيث ينحصر وادي نخلة بين الجبال. حمل الوادي الحجاج والقوافل بين مكة والطائف ونجد والعراق قروناً، وتربطه المصادر العربية بذاكرة ما قبل الإسلام: العزى في أعلى الوادي، وحروب الفجار، وآثار تُنسب إلى العماليق مطمورة تحت البساتين." },
    floorPlan: { kicker: "مخطط الموقع", title: "القرية والبساتين", cta: "عرض المخطط", text: "منظر علوي للكتل المبدئية: المضيق في الوسط، والبساتين والبيوت على الجانبين، وقناة ماء في بطن الوادي.", rooms: [{ name: "المضيق", note: "موضع انحصار الوادي" }, { name: "البساتين الغربية", note: "أشجار ونخيل" }, { name: "البساتين الشرقية", note: "أشجار ونخيل" }, { name: "البيوت", note: "أربع كتل مبدئية" }, { name: "قناة الماء", note: "تخطيطية" }] },
    artifacts: { kicker: "المعالم", title: "ما تبحث عنه", cta: "عرض المعالم", text: "معالم ورد ذكرها في المصادر وتظهر على النموذج.", items: [{ name: "المضيق", purpose: "أصل التسمية", material: "جدران الوادي الجرانيتية", context: "تمر السيول والمسافرون من الفتحة نفسها." }, { name: "بساتين الليمون", purpose: "الزراعة", material: "تربة رسوبية ومياه جوفية", context: "تسمي بعض المصادر الوادي وادي الليمون." }, { name: "آثار مطمورة", purpose: "آثار", material: "غير معروف", context: "تذكر ويكيبيديا العربية آثاراً تُنسب إلى العماليق تحت البساتين. غير مؤكد." }, { name: "الطريق شمالاً", purpose: "طريق الحج", material: "درب ممهد", context: "صعوداً إلى ذات عرق، ميقات أهل العراق ونجد." }] },
    dailyLife: { kicker: "على الطريق", title: "بين مكة والطائف", cta: "عرض الطريق", text: "كان وادي نخلة أحد الطرق القديمة بين مكة والطائف، والمدخل الأخير إلى مكة لحجاج العراق القادمين على درب زبيدة." },
    geography: { kicker: "الموقع", title: "في وادي نخلة", cta: "عرض الموقع", text: "المضيق أقصى المواقع الأربعة شمالاً، على بعد نحو 2 كم أعلى الوادي من بركة المتوكل.", regionLabel: "21.6604° شمالاً، 40.1211° شرقاً" },
    lesson: { title: "قراءة المضيق", intro: "جولة قصيرة فيما يخبرنا به الاسم والمكان والمصادر.", blocks: [{ heading: "الاسم", body: "المضيق موضع ضيق، وهنا ينحصر بطن الوادي بين الجبال." }, { heading: "أي نخلة؟", body: "واديان يحملان اسم نخلة: اليمانية والشامية. وتضع ويكيبيديا العربية المضيق في نخلة الشامية." }, { heading: "ذاكرة قديمة", body: "تربط المصادر أعلى الوادي بالعزى، أحد أصنام مكة قبل الإسلام، وبذات عرق التي صارت ميقات أهل العراق." }, { heading: "نموذج مبدئي", body: "النموذج كتل بسيطة على تضاريس مشكّلة، وسيُستبدل بنموذج مبني على المسح والصور." }] },
    quiz: [
      { q: "ماذا يصف اسم المضيق؟", choices: ["عيناً", "ممراً ضيقاً", "حصناً", "سوقاً"], explanation: "المضيق موضع ضيق، وهنا ينحصر الوادي بين الجبال." },
      { q: "أي شجر أعطى الوادي اسم وادي الليمون؟", choices: ["النخيل", "العنب", "الليمون", "الرمان"], explanation: "تسميه بعض المصادر وادي الليمون لكثرة أشجاره." },
      { q: "ما ذات عرق التي في رأس الوادي؟", choices: ["ميقات", "قلعة", "سد", "ميناء"], explanation: "ذات عرق ميقات حجاج العراق ونجد." },
    ],
    timeline: [
      { era: "ما قبل الإسلام", year: "قبل 610م", text: "تذكر الروايات العزى في أعلى الوادي وحروب الفجار فيه." },
      { era: "العصر العباسي", year: "القرن 8–10م", text: "درب زبيدة يحمل حجاج العراق عبر وادي نخلة إلى مكة." },
      { era: "اليوم", year: "الآن", text: "قرية ومركز إداري في محافظة الطائف." },
    ],
  },
};
