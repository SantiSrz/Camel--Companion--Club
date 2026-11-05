import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, FlaskConical, GitBranch } from "lucide-react";
import { DEMO_MODEL, getDemoPrediction } from "@/lib/edu/prediction-demo";
import type { CloudStudent } from "@/lib/edu/store";
import { EduSelect } from "@/components/edu/EduSelect";
import { Button } from "@/components/ui/button";

const FACTOR_TONES = [
  "prediction-factor-primary",
  "prediction-factor-secondary",
  "prediction-factor-warning",
  "prediction-factor-muted",
  "prediction-factor-secondary",
];
const GLOBAL_FACTOR_TONES = [...FACTOR_TONES, "prediction-factor-warning"];

export function PredictionDemo({ students }: { students: CloudStudent[] }) {
  const { t, i18n } = useTranslation();
  const [selectedId, setSelectedId] = useState("");
  const demoStudents = students.filter((s) => s.is_sample);
  const student =
    demoStudents.find((s) => s.id === selectedId) ??
    demoStudents.find((s) => s.code === "ALU-8102") ??
    demoStudents[0];
  const result = student ? getDemoPrediction(student) : null;
  const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
  const percent = (value: number) => `${number.format(value)}%`;
  const score = (value: number) => number.format(value);
  return (
    <>
      <section className="border-y-2 py-5" aria-label={t("predictionDemo.modelHeader")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <GitBranch className="mt-1 size-6 shrink-0 text-secondary" aria-hidden />
            <div className="min-w-0">
              <h2 className="text-xl leading-snug">{t("predictionDemo.modelBadge")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("predictionDemo.method")}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md border border-warning bg-accent px-3 py-2 text-xs font-extrabold text-secondary">
            <FlaskConical className="size-4 shrink-0" aria-hidden />
            {t("predictionDemo.simulationBadge")}
          </span>
        </div>
        <dl className="mt-6 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3">
          {(
            [
              ["accuracy", DEMO_MODEL.accuracy],
              ["weightedRecall", DEMO_MODEL.weightedRecall],
              ["weightedF1", DEMO_MODEL.weightedF1],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="rounded-xl border bg-muted/50 p-3">
              <dt className="text-xs font-bold text-muted-foreground">
                {t(`predictionDemo.${key}`)}
              </dt>
              <dd className="mt-1 text-2xl font-black tabular-nums">
                {key === "weightedF1"
                  ? new Intl.NumberFormat(i18n.language, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(value)
                  : percent(value)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">{t("predictionDemo.training")}</p>
      </section>
      <p
        className="my-5 border-l-4 border-warning bg-muted px-4 py-3 text-sm text-secondary"
        role="note"
      >
        {t("predictionDemo.disclaimer")}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-sm space-y-2">
          <p className="text-sm font-extrabold">{t("predictionDemo.student")}</p>
          <EduSelect
            label={t("predictionDemo.student")}
            value={student?.id ?? ""}
            onChange={setSelectedId}
            placeholder={t("cloud.select")}
            options={demoStudents.map((s) => ({
              value: s.id,
              label: `${s.code} · ${s.course} · ${t("common.demoData")}`,
            }))}
          />
        </div>
        <span className="text-sm font-bold text-muted-foreground">
          {t("predictionDemo.noForecastHorizon")}
        </span>
      </div>
      {student && result ? (
        <section
          className="mt-6 grid min-w-0 gap-8 border-b-2 pb-8 lg:grid-cols-[0.85fr_1.4fr]"
          aria-label={t("predictionDemo.results")}
        >
          <div className="min-w-0">
            <h2 className="text-xl">{t("predictionDemo.risk")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("predictionDemo.exampleFor", { code: student.code })}
            </p>
            <div className="my-5 flex flex-wrap items-center gap-5" aria-live="polite">
              <svg
                className="size-36 shrink-0"
                viewBox="0 0 144 144"
                role="img"
                aria-label={t("predictionDemo.riskValue", { value: score(result.riskIndex) })}
              >
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="10"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray={`${result.riskIndex} 100`}
                  transform="rotate(-90 72 72)"
                />
                <text
                  x="72"
                  y="77"
                  textAnchor="middle"
                  className="fill-foreground text-3xl font-black"
                >
                  {score(result.riskIndex)}
                </text>
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-secondary">
                  {t("predictionDemo.estimatedRisk")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("predictionDemo.simulatedValue")}
                </p>
              </div>
            </div>
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-black">{t("predictionDemo.studentFactorsTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("predictionDemo.scoreMethod")}</p>
              {result.factors.map((factor, index) => {
                const observed =
                  factor.unit === "connectivity"
                    ? t(`students.connectivityOptions.${factor.value}`)
                    : factor.unit === "grade"
                      ? `${number.format(Number(factor.value))}/10`
                      : `${number.format(Number(factor.value))}%`;
                return (
                  <div key={factor.key} className={FACTOR_TONES[index]}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold">{t(`predictionDemo.factors.${factor.key}`)}</span>
                      <span className="shrink-0 tabular-nums">
                        {observed} · {number.format(factor.points)} {t("predictionDemo.points")}
                      </span>
                    </div>
                    <progress
                      className="prediction-factor-meter block h-2 w-full"
                      value={factor.share}
                      max={100}
                      aria-label={t(`predictionDemo.factors.${factor.key}`)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="min-w-0 border-t-2 pt-6 lg:border-l-2 lg:border-t-0 lg:pl-8 lg:pt-0">
            <h2 className="text-xl">{t("predictionDemo.factorsTitle")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("predictionDemo.factorsSubtitle")}
            </p>
            <div className="mt-6 space-y-5">
              {DEMO_MODEL.factors.map((factor, index) => (
                <div key={factor.key} className={GLOBAL_FACTOR_TONES[index]}>
                  <div className="mb-2 flex items-start justify-between gap-4 text-sm">
                    <span className="min-w-0 font-bold">
                      {t(`predictionDemo.factors.${factor.key}`)}
                    </span>
                    <span className="shrink-0 font-black tabular-nums text-secondary">
                      +{percent(factor.weight)}
                    </span>
                  </div>
                  <progress
                    className="prediction-factor-meter block h-3 w-full"
                    value={factor.weight}
                    max={100}
                    aria-label={t(`predictionDemo.factors.${factor.key}`)}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>{percent(0)}</span>
              <span>{percent(50)}</span>
              <span>{percent(100)}</span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{t("predictionDemo.weightsNote")}</p>
          </div>
        </section>
      ) : (
        <p className="my-8 text-sm text-muted-foreground" role="status">
          {t(
            demoStudents.length > 0 ? "predictionDemo.noExample" : "predictionDemo.noDemoStudents",
          )}
        </p>
      )}
      {student && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-lg text-sm text-muted-foreground">
            {t("predictionDemo.humanReview")}
          </p>
          <Button asChild className="h-auto min-h-11 max-w-full whitespace-normal py-3 text-left">
            <Link to="/planes" search={{ studentId: student.id, source: "predictionDemo" }}>
              <span>{t("predictionDemo.toPlan")}</span>
              <ArrowRight className="shrink-0" />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
