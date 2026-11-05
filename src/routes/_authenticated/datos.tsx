import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, ArrowUpRight, FileSpreadsheet } from "lucide-react";
import { useDataset, loadEducation } from "@/lib/edu/store";
import { eduPageHead } from "@/lib/edu/meta";
import { StudentEditor } from "@/components/edu/StudentEditor";
import { CloudError, CloudPending } from "@/components/edu/CloudFeedback";
import { PageTitle, EmptyState } from "@/components/edu/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LevelBadge } from "@/components/edu/ui";
import { evaluateStudent } from "@/lib/edu/alerts";
import { asStudentRecord } from "@/lib/edu/store";
import { StudentCsvImport } from "@/components/edu/StudentCsvImport";

export const Route = createFileRoute("/_authenticated/datos")({
  head: () => eduPageHead("students"),
  loader: ({ context }) => loadEducation(context.queryClient),
  errorComponent: CloudError,
  pendingComponent: CloudPending,
  notFoundComponent: CloudError,
  component: Students,
});
function Students() {
  const { t, i18n } = useTranslation();
  const nf = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
  const { students, account } = useDataset();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  if (account.membership?.role === "director")
    return (
      <EmptyState title={t("school.director")} text={t("school.aggregateOnly")}>
        <Button asChild>
          <Link to="/panel">{t("nav.panel")}</Link>
        </Button>
      </EmptyState>
    );
  const visible = students.filter((s) =>
    `${s.code} ${s.course}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div>
      <PageTitle title={t("students.title")} subtitle={account.school?.name ?? ""}>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet />
            {t("students.importCsv")}
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus />
            {t("students.new")}
          </Button>
        </div>
      </PageTitle>
      <Input
        className="mb-6 max-w-sm"
        placeholder={t("students.search")}
        aria-label={t("students.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {students.length === 0 ? (
        <EmptyState title={t("students.empty")} text={t("students.emptyText")}>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet />
              {t("students.importCsv")}
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus />
              {t("students.new")}
            </Button>
          </div>
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState title={t("students.noMatches")} text={t("students.noMatchesText")} />
      ) : (
        <div className="relative max-w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  "code",
                  "course",
                  "attendance",
                  "submissions",
                  "resource_usage",
                  "grade",
                  "connectivity",
                  "risk",
                  "enrollment",
                ].map((k) => (
                  <th key={k} className="pb-3 pr-4 text-muted-foreground">
                    {t(`students.${k}`)}
                  </th>
                ))}
                <th>
                  <span className="sr-only">{t("students.open")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-4 pr-4 font-black">
                    <Link
                      to="/estudiantes/$studentId"
                      params={{ studentId: s.id }}
                      className="text-secondary"
                    >
                      {s.code}
                    </Link>
                    {s.is_sample && (
                      <p className="mt-1 text-xs font-bold text-muted-foreground">
                        {t("common.demoData")}
                      </p>
                    )}
                  </td>
                  <td className="pr-4">{s.course}</td>
                  <td>{nf.format(s.attendance)}%</td>
                  <td>{nf.format(s.submissions)}%</td>
                  <td>{nf.format(s.resource_usage)}%</td>
                  <td>{nf.format(s.grade)}</td>
                  <td>{t(`students.connectivityOptions.${s.connectivity}`)}</td>
                  <td className="px-3">
                    <LevelBadge level={evaluateStudent(asStudentRecord(s)).level} />
                  </td>
                  <td>{t(`students.status.${s.enrollment_status}`)}</td>
                  <td>
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        to="/estudiantes/$studentId"
                        params={{ studentId: s.id }}
                        aria-label={t("students.open")}
                        title={t("students.open")}
                      >
                        <ArrowUpRight />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>{t("students.new")}</DialogTitle>
          </DialogHeader>
          {account.school && (
            <StudentEditor
              schoolId={account.school.id}
              teacherId={account.user.id}
              onSaved={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("students.importCsv")}</DialogTitle>
          </DialogHeader>
          {account.school && (
            <StudentCsvImport
              schoolId={account.school.id}
              teacherId={account.user.id}
              students={students}
              onImported={() => setImportOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
