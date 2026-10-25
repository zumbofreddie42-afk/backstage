import type { MetadataRoute } from "next";
import { getSiteMode, getSiteUrl } from "@/server/config";

export default function robots(): MetadataRoute.Robots {
  if (getSiteMode() === "preview") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/staff", "/api", "/it/area", "/en/area"] },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
