import i18n from "@/i18n";

export function eduPageHead(
  page:
    | "home"
    | "auth"
    | "reset"
    | "students"
    | "student"
    | "panel"
    | "alerts"
    | "predictions"
    | "plans"
    | "ethics"
    | "licensing"
    | "paymentResult",
) {
  return eduHead(i18n.t(`meta.${page}.title`), i18n.t(`meta.${page}.description`));
}
export function eduHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — EduPulse Intelligence` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — EduPulse Intelligence` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
