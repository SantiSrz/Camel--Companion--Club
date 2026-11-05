import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, LoaderCircle, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EduSelect } from "@/components/edu/EduSelect";
import {
  contractingSchema,
  type ContractingInput,
  type PackageAvailability,
} from "@/lib/licensing/rules";

type SubmissionStatus = "idle" | "processing" | "success";

export function ContractForm({ item, onBack }: { item: PackageAvailability; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const [institution, setInstitution] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"direct" | "solidarity">("direct");
  const [count, setCount] = useState(1);
  const [centres, setCentres] = useState<string[]>([""]);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [submission, setSubmission] = useState<ContractingInput | null>(null);
  const amount = new Intl.NumberFormat(i18n.language, {
    style: "currency",
    currency: "EUR",
  }).format(item.amount_cents / 100);

  function updateCount(value: number) {
    setCount(value);
    setCentres((old) => Array.from({ length: value }, (_, i) => old[i] ?? ""));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const contract = contractingSchema.safeParse({
      package_id: item.id,
      institution_name: institution,
      billing_email: email,
      beneficiary_mode: mode,
      centre_count: count,
      centres: mode === "direct" ? centres : [],
    });
    if (!contract.success) {
      setErrorKey("invalid");
      return;
    }

    setErrorKey(null);
    setStatus("processing");
    window.setTimeout(() => {
      setSubmission(contract.data);
      setStatus("success");
    }, 1000);
  }

  function downloadSummary() {
    if (!submission) return;
    const summary = [
      t("licensing.summary"),
      `${t("licensing.institution")}: ${submission.institution_name}`,
      `${t("licensing.email")}: ${submission.billing_email}`,
      `${t("licensing.select")}: ${t(`licensing.packages.${submission.package_id}.name`)}`,
      `${t("licensing.centreCount")}: ${submission.centre_count}`,
      `${t("licensing.beneficiaries")}: ${t(submission.beneficiary_mode === "solidarity" ? "licensing.solidarity" : "licensing.direct")}`,
      ...(submission.beneficiary_mode === "direct"
        ? submission.centres
        : [t("licensing.assignment")]),
      t("licensing.sandboxSuccess"),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([summary], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "institutional-assignment-demo.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  if (status === "success" && submission) {
    return (
      <section className="mt-8 border-t-2 pt-8" aria-live="polite">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-start gap-4 rounded-md border bg-muted/40 p-6">
            <CheckCircle2 className="mt-1 size-8 shrink-0 text-primary" aria-hidden />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{t("licensing.successTitle")}</h2>
              <p>{t("licensing.sandboxSuccess")}</p>
            </div>
          </div>
          <div className="space-y-4 rounded-md border p-6">
            <h3 className="text-xl font-bold">{t("licensing.summary")}</h3>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)]">
              <dt className="font-bold">{t("licensing.institution")}</dt>
              <dd className="break-words">{submission.institution_name}</dd>
              <dt className="font-bold">{t("licensing.email")}</dt>
              <dd className="break-all">{submission.billing_email}</dd>
              <dt className="font-bold">{t("licensing.select")}</dt>
              <dd>{t(`licensing.packages.${submission.package_id}.name`)}</dd>
              <dt className="font-bold">{t("licensing.centreCount")}</dt>
              <dd>{submission.centre_count}</dd>
              <dt className="font-bold">{t("licensing.beneficiaries")}</dt>
              <dd>
                {t(
                  submission.beneficiary_mode === "solidarity"
                    ? "licensing.solidarity"
                    : "licensing.direct",
                )}
              </dd>
              <dt className="font-bold">{t("licensing.centres")}</dt>
              <dd>
                {submission.beneficiary_mode === "solidarity" ? (
                  t("licensing.assignment")
                ) : (
                  <ul className="space-y-1">
                    {submission.centres.map((centre, index) => (
                      <li key={`${centre}-${index}`}>{centre}</li>
                    ))}
                  </ul>
                )}
              </dd>
            </dl>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadSummary}>
              <Download />
              {t("licensing.downloadSummary")}
            </Button>
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft />
              {t("licensing.back")}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const isProcessing = status === "processing";
  return (
    <section className="mt-8 border-t-2 pt-8">
      <Button variant="ghost" onClick={onBack} disabled={isProcessing}>
        <ArrowLeft />
        {t("licensing.back")}
      </Button>
      <div className="mt-6 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          <School className="size-10 text-primary" aria-hidden />
          <p className="text-sm font-bold text-muted-foreground">{t("licensing.select")}</p>
          <h2 className="text-2xl">{t(`licensing.packages.${item.id}.name`)}</h2>
          <p className="text-3xl font-black text-secondary">{amount}</p>
          <p className="text-sm text-muted-foreground">{t("licensing.fullPrice")}</p>
          <p className="font-bold">{t("licensing.demoAvailable", { count: item.available })}</p>
        </div>
        <form onSubmit={submit} className="min-w-0 space-y-5">
          <fieldset disabled={isProcessing} className="space-y-5 disabled:opacity-70">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 font-bold">
                {t("licensing.institution")}
                <Input
                  autoComplete="organization"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  minLength={2}
                  maxLength={200}
                  required
                />
              </label>
              <label className="block space-y-2 font-bold">
                {t("licensing.email")}
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                  required
                />
              </label>
            </div>
            <label className="block space-y-2 font-bold">
              {t("licensing.beneficiaries")}
              <EduSelect
                label={t("licensing.beneficiaries")}
                value={mode}
                onChange={(v) => {
                  if (v === "direct" || v === "solidarity") setMode(v);
                }}
                options={[
                  { value: "direct", label: t("licensing.direct") },
                  { value: "solidarity", label: t("licensing.solidarity") },
                ]}
              />
            </label>
            <label className="block space-y-2 font-bold">
              {t("licensing.centreCount")}
              <Input
                type="number"
                min={1}
                max={item.max_centres}
                value={count}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isInteger(v) && v >= 1 && v <= item.max_centres) updateCount(v);
                }}
                required
              />
            </label>
            {mode === "direct" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {centres.map((name, i) => (
                  <label key={i} className="block space-y-2 font-bold">
                    {t("licensing.centreName", { number: i + 1 })}
                    <Input
                      value={name}
                      minLength={2}
                      maxLength={200}
                      required
                      onChange={(e) =>
                        setCentres((old) =>
                          old.map((v, index) => (index === i ? e.target.value : v)),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("licensing.solidarityNote")}</p>
            )}
          </fieldset>
          {errorKey && (
            <p role="alert" className="text-destructive">
              {t(`licensing.${errorKey}`)}
            </p>
          )}
          {isProcessing && (
            <p role="status" aria-live="polite" className="font-bold text-secondary">
              {t("licensing.processing")}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="h-auto min-h-12 w-full whitespace-normal py-3"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <LoaderCircle className="shrink-0 animate-spin motion-reduce:animate-none" />
            ) : (
              <School className="shrink-0" />
            )}
            {t(isProcessing ? "licensing.processing" : "licensing.confirmAssignment")}
            {!isProcessing && <ArrowRight className="shrink-0" />}
          </Button>
          <p className="text-sm text-muted-foreground">{t("licensing.tax")}</p>
        </form>
      </div>
    </section>
  );
}
