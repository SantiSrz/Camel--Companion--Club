import { useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Download, FileUp, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseStudentsCsv, STUDENT_CSV_EMPTY_TEMPLATE, STUDENT_CSV_TEMPLATE } from "@/lib/edu/csv";
import type { CloudStudent } from "@/lib/edu/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_IMPORT_ROWS = 500;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export function StudentCsvImport({
  schoolId,
  teacherId,
  students,
  onImported,
}: {
  schoolId: string;
  teacherId: string;
  students: CloudStudent[];
  onImported: () => void;
}) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [result, setResult] = useState<ReturnType<typeof parseStudentsCsv> | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const importRows = useMutation({
    mutationFn: async () => {
      if (!result || result.rows.length === 0 || result.rows.length > MAX_IMPORT_ROWS) {
        throw new Error("invalid_import");
      }
      const { error } = await supabase
        .from("students")
        .insert(result.rows.map((row) => ({ ...row, school_id: schoolId, teacher_id: teacherId })));
      if (error) throw error;
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["edu"] });
      toast.success(t("students.importSuccess", { count: result?.rows.length ?? 0 }));
      setResult(null);
      setFileName("");
      onImported();
    },
    onError: (error: { code?: string; message?: string }) => {
      const duplicate = error.code === "23505" || error.message?.includes("duplicate key");
      toast.error(t(duplicate ? "students.importDuplicateRace" : "students.importFailed"));
    },
  });

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setResult(null);
    setFileError(null);
    setFileName(file?.name ?? "");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError(t("students.importCsvOnly"));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(t("students.importFileTooLarge"));
      return;
    }
    try {
      const parsed = parseStudentsCsv(
        await file.text(),
        students.map((student) => student.code),
      );
      setResult(parsed);
      if (parsed.rows.length > MAX_IMPORT_ROWS)
        setFileError(t("students.importLimit", { count: MAX_IMPORT_ROWS }));
    } catch {
      setFileError(t("students.importReadError"));
    }
  }

  function downloadTemplate(content: string, fileName: string) {
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("students.importHelp")}</p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadTemplate(STUDENT_CSV_TEMPLATE, "demo-30-estudiantes-edupulse.csv")}
        >
          <Download />
          {t("students.downloadDemoCsv")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            downloadTemplate(STUDENT_CSV_EMPTY_TEMPLATE, "plantilla-vacia-estudiantes.csv")
          }
        >
          <Download />
          {t("students.downloadEmptyTemplate")}
        </Button>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
          <FileUp className="size-4" aria-hidden />
          {t("students.chooseCsv")}
          <Input className="sr-only" type="file" accept=".csv,text/csv" onChange={selectFile} />
        </label>
      </div>
      {fileName && <p className="text-sm font-bold">{fileName}</p>}
      {fileError && (
        <p className="text-sm text-destructive" role="alert">
          {fileError}
        </p>
      )}
      {result && (
        <div className="space-y-3 rounded-xl border bg-muted/40 p-4" aria-live="polite">
          {result.missingColumns.length > 0 ? (
            <p className="text-sm text-destructive" role="alert">
              {t("students.importMissingColumns", {
                columns: result.missingColumns
                  .map((column) => t(`students.importFields.${column}`))
                  .join(", "),
              })}
            </p>
          ) : (
            <>
              <p className="font-bold">
                {result.rows.length > 0
                  ? t("students.importPreview", { count: result.rows.length })
                  : t("students.importNoRows")}
              </p>
              {result.rows.some((row) => row.is_sample) && (
                <p className="text-sm font-bold text-secondary" role="note">
                  {t("students.importDemoNotice", {
                    count: result.rows.filter((row) => row.is_sample).length,
                  })}
                </p>
              )}
              {result.rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr>
                        {[
                          "code",
                          "course",
                          "attendance",
                          "submissions",
                          "resource_usage",
                          "grade",
                        ].map((field) => (
                          <th key={field} className="px-2 py-1 font-bold">
                            {t(`students.importFields.${field}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.slice(0, 5).map((row) => (
                        <tr key={row.code} className="border-t">
                          <td className="px-2 py-1 font-bold">{row.code}</td>
                          <td className="px-2 py-1">{row.course}</td>
                          <td className="px-2 py-1">{row.attendance}%</td>
                          <td className="px-2 py-1">{row.submissions}%</td>
                          <td className="px-2 py-1">{row.resource_usage}%</td>
                          <td className="px-2 py-1">{row.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.rows.length > 5 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("students.importMoreValid", { count: result.rows.length - 5 })}
                    </p>
                  )}
                </div>
              )}
              {result.errors.length > 0 && (
                <div
                  className="max-h-40 space-y-1 overflow-y-auto text-sm text-destructive"
                  role="alert"
                >
                  <p>{t("students.importSkipped", { count: result.errors.length })}</p>
                  {result.errors.slice(0, 8).map((error, index) => (
                    <p key={`${error.line}-${index}`}>
                      {t("students.importLineError", {
                        line: error.line,
                        message: error.message.startsWith("duplicate_existing:")
                          ? t("students.importDuplicateExisting", {
                              code: error.message.slice("duplicate_existing:".length),
                            })
                          : error.message.startsWith("duplicate_file:")
                            ? t("students.importDuplicateFile", {
                                code: error.message.slice("duplicate_file:".length),
                              })
                            : t("students.importInvalidFields", {
                                fields: error.message
                                  .replace("invalid:", "")
                                  .split(",")
                                  .map((field) => t(`students.importFields.${field}`))
                                  .join(", "),
                              }),
                      })}
                    </p>
                  ))}
                  {result.errors.length > 8 && (
                    <p>{t("students.importMoreErrors", { count: result.errors.length - 8 })}</p>
                  )}
                </div>
              )}
              {result.rows.length > 0 && result.rows.length <= MAX_IMPORT_ROWS && (
                <Button
                  type="button"
                  disabled={importRows.isPending}
                  onClick={() => importRows.mutate()}
                >
                  {importRows.isPending && (
                    <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                  )}
                  {t(importRows.isPending ? "students.importing" : "students.importConfirm", {
                    count: result.rows.length,
                  })}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
