/** The audit metrics come from the checked-in synthetic-data training report; student risks remain demo fixtures. */
export const DEMO_MODEL = {
  mode: "simulation",
  name: "Random Forest",
  version: "1.0",
  accuracy: 80.83,
  weightedRecall: 80.83,
  weightedF1: 0.81,
  horizonMonths: 3,
  confidence: 92,
  factors: [
    { key: "grades", weight: 31.13 },
    { key: "consecutiveAbsences", weight: 20.16 },
    { key: "resources", weight: 17.9 },
    { key: "attendance", weight: 17.11 },
    { key: "connectivity", weight: 7.35 },
    { key: "teacherTraining", weight: 6.34 },
  ],
} as const;

const EXAMPLE_RISKS: Readonly<Record<string, number>> = {
  "ALU-8102": 78,
  "ALU-4319": 34,
  "ALU-9025": 8,
  "ALU-3140": 73,
  "ALU-5521": 19,
};

/** Never attach a simulated probability to a real student, even with a matching code. */
export function getDemoPrediction(student: { code: string; is_sample: boolean }) {
  const risk = student.is_sample ? EXAMPLE_RISKS[student.code] : undefined;
  if (risk === undefined) return null;
  return { ...DEMO_MODEL, risk, code: student.code };
}
