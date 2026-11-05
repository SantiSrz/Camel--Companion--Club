import { describe, expect, it } from "vitest";
import { evaluateStudent } from "./alerts";
import { parseStudentsCsv, STUDENT_CSV_TEMPLATE } from "./csv";

const base = {
  estudiante_id: "x",
  grupo: "1A",
  asistencia: 95,
  nota_media: 8,
  tareas_entregadas: 90,
};

describe("alert rules", () => {
  it("green when all indicators are above thresholds", () => {
    expect(evaluateStudent(base).level).toBe("verde");
  });
  it("red when attendance is below 75%", () => {
    expect(evaluateStudent({ ...base, asistencia: 74 }).level).toBe("rojo");
  });
  it("yellow when grade is between 5 and 6", () => {
    expect(evaluateStudent({ ...base, nota_media: 5.5 }).level).toBe("amarillo");
  });
  it("red when tasks delivered are below 60%", () => {
    expect(evaluateStudent({ ...base, tareas_entregadas: 59 }).level).toBe("rojo");
  });
  it("exposes attendance factors without changing the 75% threshold", () => {
    expect(evaluateStudent({ ...base, asistencia: 72.5 }).factors).toEqual([
      { metric: "asistencia", value: 72.5, threshold: 75, unit: "%" },
    ]);
  });
});

describe("csv validation", () => {
  const header =
    "codigo,curso,asistencia,entregas,uso_recursos,nota,conectividad,estado,observaciones";

  it("reports missing required columns", () => {
    expect(parseStudentsCsv("codigo,curso\nALU-001,1A").missingColumns).toEqual([
      "attendance",
      "submissions",
      "resource_usage",
      "grade",
    ]);
  });
  it("rejects grade out of range with line number", () => {
    const r = parseStudentsCsv(`${header}\nALU-001,1A,90,80,60,11,unknown,active,`);
    expect(r.rows).toHaveLength(0);
    expect(r.errors[0]).toMatchObject({ line: 2, message: "invalid:grade" });
  });
  it("supports semicolon with decimal comma", () => {
    const r = parseStudentsCsv(
      "codigo;curso;asistencia;entregas;uso_recursos;nota\nALU-001;1A;90;80;60;6,5",
    );
    expect(r.rows[0]?.grade).toBe(6.5);
    expect(r.rows[0]).toMatchObject({
      connectivity: "unknown",
      enrollment_status: "active",
      observations: "",
    });
  });
  it("supports quoted commas and the legacy column names", () => {
    const r = parseStudentsCsv(
      'estudiante_id,grupo,asistencia,tareas_entregadas,uso_recursos,nota,observaciones\nALU-001,1A,90,80,60,7,"Seguimiento, semana 1"',
    );
    expect(r.rows[0]).toMatchObject({
      code: "ALU-001",
      course: "1A",
      observations: "Seguimiento, semana 1",
    });
  });
  it("preserves commas in text fields when semicolons separate decimal-comma values", () => {
    const r = parseStudentsCsv(
      'codigo;curso;asistencia;entregas;uso_recursos;nota;observaciones\nALU-001;1A;90;80;60;6,5;"Seguimiento, semana 1"',
    );
    expect(r.rows[0]).toMatchObject({ grade: 6.5, observations: "Seguimiento, semana 1" });
  });
  it("rejects malformed quoted CSV", () => {
    expect(() => parseStudentsCsv(`${header}\nALU-001,1A,90,80,60,7,"unfinished`)).toThrow(
      "malformed_csv",
    );
  });
  it("provides at least 30 synthetic demo students and preserves their demo marker", () => {
    const result = parseStudentsCsv(STUDENT_CSV_TEMPLATE);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(30);
    expect(result.rows.every((row) => row.is_sample)).toBe(true);
    expect(result.rows[0]).toMatchObject({ code: "DEMO-001", connectivity: "good" });
  });
  it("skips duplicate codes in the existing school and in the uploaded file", () => {
    const r = parseStudentsCsv(
      `${header}\nALU-001,1A,90,80,60,7\nALU-002,1A,90,80,60,7\nALU-002,1A,90,80,60,7`,
      ["alu-001"],
    );
    expect(r.rows.map((row) => row.code)).toEqual(["ALU-002"]);
    expect(r.errors.map((error) => error.message)).toEqual([
      "duplicate_existing:ALU-001",
      "duplicate_file:ALU-002",
    ]);
  });
});
