import type { MetadataRoute } from "next";

const SITE_URL = "https://certificadoencasa.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/configurar-pago/",
        "/cancelar/",
        "/valorar/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
