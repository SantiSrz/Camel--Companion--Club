import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, RefreshCw, School, Network, Globe } from "lucide-react";
import camelWave from "@/assets/camel-wave.png";
import { licensingOptions } from "@/lib/licensing/queries";
import { eduPageHead } from "@/lib/edu/meta";
import { PageTitle } from "@/components/edu/ui";
import { Button } from "@/components/ui/button";
import { ContractForm } from "@/components/licensing/ContractForm";
import type { PackageId } from "@/lib/licensing/rules";

export const Route = createFileRoute("/contratacion/")({
  head: () => eduPageHead("licensing"),
  loader: ({ context }) => context.queryClient.ensureQueryData(licensingOptions),
  component: InstitutionalLicensing,
});

const ICONS = { pilot: School, district: Network, regional: Globe };

function InstitutionalLicensing() {
  const { t, i18n } = useTranslation();
  const { data, refetch, isFetching } = useSuspenseQuery(licensingOptions);
  const [selected, setSelected] = useState<PackageId | null>(null);

  const packagesWithStock = data.packages;

  const item = packagesWithStock.find((p) => p.id === selected);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageTitle title={t("licensing.title")} subtitle={t("licensing.subtitle")} />
        <img
          src={camelWave}
          alt={t("home.mascotAlt")}
          width={1024}
          height={1024}
          className="hidden size-24 shrink-0 object-contain sm:block"
        />
      </div>

      <p className="mb-6 rounded-md border-l-4 border-primary bg-muted p-4 text-sm font-medium">
        {t("licensing.contributionNote")}
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-y-2 py-4">
        <p className="font-bold text-secondary">
          {!data.ready || !data.environment
            ? t("licensing.notReady")
            : t(data.environment === "sandbox" ? "licensing.test" : "licensing.live")}
        </p>
        <Button variant="ghost" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? "animate-spin motion-reduce:animate-none" : ""} />
          {t("licensing.refresh")}
        </Button>
      </div>

      {item ? (
        <ContractForm key={item.id} item={item} onBack={() => setSelected(null)} />
      ) : (
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {packagesWithStock.map((p) => {
            const Icon = ICONS[p.id as keyof typeof ICONS] ?? School;

            return (
              <article key={p.id} className="card-sticker flex min-w-0 flex-col p-6">
                <Icon className="mb-5 size-9 text-primary" aria-hidden />
                <h2 className="min-h-16 break-words text-2xl leading-snug">
                  {t(`licensing.packages.${p.id}.name`)}
                </h2>
                <p className="mt-3 min-h-12 text-muted-foreground">
                  {t(`licensing.packages.${p.id}.description`)}
                </p>
                <p className="mt-6 text-4xl font-black text-secondary">
                  {new Intl.NumberFormat(i18n.language, {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format((p.amount_cents ?? 0) / 100)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("licensing.once")} · {t("licensing.tax")}
                </p>
                <p className="mt-5 font-extrabold">
                  {t("licensing.coverage", { count: p.max_centres ?? 1 })}
                </p>
                <ul className="mt-4 flex-1 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                      <span>{t(`licensing.packages.${p.id}.features.${i}`)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mb-4 mt-8 text-sm font-extrabold text-secondary">
                  {t("licensing.available", { count: p.available })}
                </p>
                <Button
                  className="h-auto min-h-11 whitespace-normal py-3"
                  disabled={!data.ready || p.available <= 0}
                  onClick={() => setSelected(p.id)}
                >
                  {t("licensing.contract")}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
