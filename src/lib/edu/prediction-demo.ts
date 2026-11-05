/** Audit metrics are from the checked-in synthetic-data report; classroom scores are separate demo heuristics. */
export const DEMO_MODEL = {
  mode: "simulation",
  name: "Random Forest",
  version: "1.0",
  accuracy: 80.83,
  weightedRecall: 80.83,
  weightedF1: 0.81,
  factors: [
    { key: "grades", weight: 31.13 },
    { key: "consecutiveAbsences", weight: 20.16 },
    { key: "resources", weight: 17.9 },
    { key: "attendance", weight: 17.11 },
    { key: "connectivity", weight: 7.35 },
    { key: "teacherTraining", weight: 6.34 },
  ],
} as const;

const SCORE_WEIGHTS = {
  attendance: 0.3,
  grades: 0.25,
  submissions: 0.2,
  resources: 0.15,
  connectivity: 0.1,
} as const;

const CONNECTIVITY_GAP: Record<string, number> = {
  good: 0,
  medium: 25,
  intermittent: 60,
  low_none: 100,
  unknown: 50,
};

type DemoStudent = {
  code: string;
  is_sample: boolean;
  attendance: number;
  grade: number;
  submissions: number;
  resource_usage: number;
  connectivity: string;
};

/** A transparent demo score, not model inference or a calibrated dropout probability. */
export function getDemoPrediction(student: DemoStudent) {
  if (!student.is_sample) return null;
  const rawFactors = [
    {
      key: "attendance",
      value: student.attendance,
      unit: "percent",
      gap: 100 - student.attendance,
      weight: SCORE_WEIGHTS.attendance,
    },
    {
      key: "grades",
      value: student.grade,
      unit: "grade",
      gap: (10 - student.grade) * 10,
      weight: SCORE_WEIGHTS.grades,
    },
    {
      key: "submissions",
      value: student.submissions,
      unit: "percent",
      gap: 100 - student.submissions,
      weight: SCORE_WEIGHTS.submissions,
    },
    {
      key: "resources",
      value: student.resource_usage,
      unit: "percent",
      gap: 100 - student.resource_usage,
      weight: SCORE_WEIGHTS.resources,
    },
    {
      key: "connectivity",
      value: student.connectivity,
      unit: "connectivity",
      gap: CONNECTIVITY_GAP[student.connectivity] ?? CONNECTIVITY_GAP.unknown,
      weight: SCORE_WEIGHTS.connectivity,
    },
  ];
  const riskIndex = Math.round(
    rawFactors.reduce((sum, factor) => sum + factor.gap * factor.weight, 0),
  );
  const factors = rawFactors.map((factor) => {
    const points = Math.round(factor.gap * factor.weight * 10) / 10;
    return {
      key: factor.key,
      value: factor.value,
      unit: factor.unit,
      points,
      share: riskIndex === 0 ? 0 : (points / riskIndex) * 100,
    };
  });
  return { mode: "simulation" as const, riskIndex, code: student.code, factors };
}
