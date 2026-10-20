import type { Hotspot, SourceRef } from "@/types/empire";
import generated from "./generated.json";

type Generated = Record<string, { triangles: number; anchors: Record<string, { anchor: [number, number, number]; snap: Hotspot["snap"] }> }>;

/** Hotspot anchors come from `scripts/make_placeholder_models.mjs`, which
 *  places them in metres on the model it builds and converts them to the
 *  viewer's normalised box space. Data files name the pin and say what it is;
 *  they never carry hand-typed coordinates that would drift from the model. */
export function pins(
  siteId: string,
  defs: Array<Omit<Hotspot, "anchor" | "snap">>,
): Hotspot[] {
  const anchors = (generated as unknown as Generated)[siteId]?.anchors ?? {};
  return defs.map((d) => {
    const a = anchors[d.id];
    if (!a) throw new Error(`No generated anchor for ${siteId}/${d.id} — rerun npm run models:placeholder`);
    return { ...d, anchor: a.anchor, snap: a.snap };
  });
}

export const img = (siteId: string, file: string) => `/img/${siteId}/${file}`;

/** Sources shared by more than one site. */
export const SRC = {
  zaymahWiki: {
    title: "الزيمة — ويكيبيديا (citing the Makkah Region Emirate and the Ministry of Culture)",
    url: "https://ar.wikipedia.org/wiki/الزيمة",
    confidence: "medium",
  },
  madiqWiki: {
    title: "المضيق (مكة المكرمة) — ويكيبيديا",
    url: "https://ar.wikipedia.org/wiki/المضيق_(مكة_المكرمة)",
    confidence: "low",
  },
  saudipedia: {
    title: "Az-Zaymah Center — Saudipedia",
    url: "https://saudipedia.com/en/article/3688/geography/provinces-and-cities/az-zaymah-center",
    confidence: "medium",
  },
  alsahra: {
    title: "Al-Sahra team — Darb Zubayda (21): Wadi Nakhla, Bustan Ibn ‘Amir, al-Burud",
    url: "https://alsahra.org/2016/11/%D8%AF%D8%B1%D8%A8-%D8%A7%D9%84%D8%AD%D8%AC-%D8%A7%D9%84%D9%83%D9%88%D9%81%D9%8A-%D8%AF%D8%B1%D8%A8-%D8%B2%D8%A8%D9%8A%D8%AF%D8%A9-21-%D9%86%D9%87%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%B1%D8%AD",
    confidence: "low",
  },
  zubaydahTrail: {
    title: "Zubaydah Trail — Wikipedia",
    url: "https://en.wikipedia.org/wiki/Zubaydah_Trail",
    confidence: "medium",
  },
  ashar: {
    title: "SPA — al-‘Ashar pool on Darb Zubayda (comparison for pool form)",
    url: "https://www.spa.gov.sa/N2040396",
    confidence: "medium",
  },
} satisfies Record<string, SourceRef>;
