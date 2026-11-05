import { studentSchema, type StudentInput } from "./cloud-schema";

type CsvField = keyof StudentInput | "record_type";

const HEADER_ALIASES: Record<string, CsvField> = {
  codigo: "code",
  code: "code",
  estudiante_id: "code",
  curso: "course",
  course: "course",
  grupo: "course",
  asistencia: "attendance",
  attendance: "attendance",
  entregas: "submissions",
  submissions: "submissions",
  tareas_entregadas: "submissions",
  uso_recursos: "resource_usage",
  resource_usage: "resource_usage",
  nota: "grade",
  grade: "grade",
  nota_media: "grade",
  conectividad: "connectivity",
  connectivity: "connectivity",
  estado: "enrollment_status",
  enrollment_status: "enrollment_status",
  observaciones: "observations",
  observations: "observations",
  tipo_registro: "record_type",
  record_type: "record_type",
};

const REQUIRED_COLUMNS: (keyof StudentInput)[] = [
  "code",
  "course",
  "attendance",
  "submissions",
  "resource_usage",
  "grade",
];

export type CsvResult = {
  rows: (StudentInput & { is_sample: boolean })[];
  errors: { line: number; message: string }[];
  missingColumns: string[];
};

function parseRecords(text: string, separator: string) {
  const records: { cells: string[]; line: number }[] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let recordLine = 1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i] ?? "";
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === separator && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else if (char === "\n" && !quoted) {
      cells.push(cell.trim());
      if (cells.some((value) => value !== "")) records.push({ cells, line: recordLine });
      cells = [];
      cell = "";
      line++;
      recordLine = line;
    } else {
      cell += char;
      if (char === "\n") line++;
    }
  }
  if (quoted) throw new Error("malformed_csv");
  cells.push(cell.trim());
  if (cells.some((value) => value !== "")) records.push({ cells, line: recordLine });
  return records;
}

function detectSeparator(header: string) {
  let quoted = false;
  let commas = 0;
  let semicolons = 0;
  for (let i = 0; i < header.length; i++) {
    const char = header[i];
    if (char === '"') {
      if (quoted && header[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted && char === ",") commas++;
    else if (!quoted && char === ";") semicolons++;
  }
  return semicolons > commas ? ";" : ",";
}

export function parseStudentsCsv(text: string, existingCodes: Iterable<string> = []): CsvResult {
  const content = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const firstLine = content.split("\n").find((value) => value.trim() !== "") ?? "";
  if (!firstLine) return { rows: [], errors: [], missingColumns: [] };

  const separator = detectSeparator(firstLine);
  const records = parseRecords(content, separator);
  const header = (records.shift()?.cells ?? []).map((value) => value.trim().toLowerCase());
  const columns = header.map((name) => HEADER_ALIASES[name]);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missingColumns.length) return { rows: [], errors: [], missingColumns };

  const existing = new Set([...existingCodes].map((code) => code.trim().toUpperCase()));
  const seen = new Set<string>();
  const rows: (StudentInput & { is_sample: boolean })[] = [];
  const errors: CsvResult["errors"] = [];

  records.forEach(({ cells, line }) => {
    const values: Partial<Record<CsvField, string>> = {};
    columns.forEach((column, index) => {
      if (!column) return;
      const value = cells[index] ?? "";
      const isNumeric =
        column === "attendance" ||
        column === "submissions" ||
        column === "resource_usage" ||
        column === "grade";
      values[column] = separator === ";" && isNumeric ? value.replace(",", ".") : value;
    });

    const parsed = studentSchema.safeParse({
      code: values.code,
      course: values.course,
      attendance: values.attendance,
      submissions: values.submissions,
      resource_usage: values.resource_usage,
      grade: values.grade,
      connectivity: values.connectivity || "unknown",
      enrollment_status: values.enrollment_status || "active",
      observations: values.observations || "",
    });
    if (!parsed.success) {
      errors.push({
        line,
        message: `invalid:${[...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))].join(",")}`,
      });
      return;
    }

    const code = parsed.data.code;
    if (existing.has(code)) {
      errors.push({ line, message: `duplicate_existing:${code}` });
    } else if (seen.has(code)) {
      errors.push({ line, message: `duplicate_file:${code}` });
    } else {
      seen.add(code);
      const recordType = values.record_type?.trim().toLowerCase();
      if (recordType && recordType !== "demo" && recordType !== "real") {
        errors.push({ line, message: "invalid:record_type" });
        return;
      }
      rows.push({ ...parsed.data, is_sample: recordType === "demo" });
    }
  });

  return { rows, errors, missingColumns: [] };
}

const CSV_HEADER =
  "codigo,curso,asistencia,entregas,uso_recursos,nota,conectividad,estado,observaciones,tipo_registro";

const DEMO_STUDENTS = Array.from({ length: 30 }, (_, index) => {
  const number = index + 1;
  const groups = ["1ºA", "1ºB", "2ºA", "2ºB", "3ºA"];
  const connectivity = ["good", "medium", "intermittent", "low_none", "unknown"];
  const attendance = 62 + ((number * 11) % 39);
  const submissions = 38 + ((number * 17) % 63);
  const resourceUsage = 12 + ((number * 23) % 89);
  const grade = (3 + ((number * 7) % 71) / 10).toFixed(1);
  return [
    `DEMO-${String(number).padStart(3, "0")}`,
    groups[index % groups.length],
    attendance,
    submissions,
    resourceUsage,
    grade,
    connectivity[index % connectivity.length],
    "active",
    "",
    "demo",
  ].join(",");
});

export const STUDENT_CSV_TEMPLATE = `${CSV_HEADER}\n${DEMO_STUDENTS.join("\n")}\n`;
export const STUDENT_CSV_EMPTY_TEMPLATE = `${CSV_HEADER}\n${Array.from(
  { length: 30 },
  () => ",,,,,,,,,",
).join("\n")}\n`;
