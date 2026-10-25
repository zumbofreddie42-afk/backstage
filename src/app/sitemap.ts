import type { MetadataRoute } from "next";
import { PUBLIC_PATHS } from "@/lib/nav";
import { getSiteUrl } from "@/server/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return PUBLIC_PATHS.flatMap((path) =>
    (["it", "en"] as const).map((lang) => ({
      url: `${base}/${lang}${path}`,
      alternates: { languages: { it: `${base}/it${path}`, en: `${base}/en${path}` } },
    })),
  );
}
