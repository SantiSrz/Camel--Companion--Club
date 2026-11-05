import { describe, expect, it } from "vitest";
import { DEMO_MODEL, getDemoPrediction } from "./prediction-demo";
import { findHandoffStudent, planHandoffSearch } from "./plan-handoff";
import { parseStudentsCsv, STUDENT_CSV_TEMPLATE } from "./csv";

describe("explicit hackathon simulation", () => {
  const sample = {
    code: "DEMO-001",
    is_sample: true,
    attendance: 80,
    grade: 6,
    submissions: 50,
    resource_usage: 40,
    connectivity: "intermittent",
  };
  it("calculates a transparent illustrative score from the selected sample's actual metrics", () => {
    const prediction = getDemoPrediction(sample);
    expect(prediction?.riskIndex).toBe(41);
    expect(prediction?.factors.map((factor) => factor.points)).toEqual([6, 10, 10, 9, 6]);
    expect(prediction?.factors.reduce((sum, factor) => sum + factor.points, 0)).toBe(41);
  });
  it("scores a sample with no measured gaps as zero and the maximum gaps as 100", () => {
    expect(
      getDemoPrediction({
        ...sample,
        attendance: 100,
        grade: 10,
        submissions: 100,
        resource_usage: 100,
        connectivity: "good",
      })?.riskIndex,
    ).toBe(0);
    expect(
      getDemoPrediction({
        ...sample,
        attendance: 0,
        grade: 0,
        submissions: 0,
        resource_usage: 0,
        connectivity: "low_none",
      })?.riskIndex,
    ).toBe(100);
  });
  it("renders a demo score for every row in the downloadable 30-student sample", () => {
    const csv = parseStudentsCsv(STUDENT_CSV_TEMPLATE);
    expect(csv.rows).toHaveLength(30);
    expect(csv.rows.every((student) => getDemoPrediction(student) !== null)).toBe(true);
  });
  it("reports the checked-in synthetic-data audit metrics", () => {
    expect(DEMO_MODEL).toMatchObject({
      mode: "simulation",
      accuracy: 80.83,
      weightedRecall: 80.83,
      weightedF1: 0.81,
    });
  });
  it("uses audited global feature importance, not per-student probability contributions", () => {
    expect(DEMO_MODEL.factors.map((factor) => factor.weight)).toEqual([
      31.13, 20.16, 17.9, 17.11, 7.35, 6.34,
    ]);
    expect(DEMO_MODEL.factors.reduce((sum, factor) => sum + factor.weight, 0)).toBeCloseTo(100, 1);
  });
  it("never generates a demo score for a real student", () => {
    expect(getDemoPrediction({ ...sample, is_sample: false })).toBeNull();
  });
});
describe("human review handoff", () => {
  const studentId = "11111111-1111-4111-8111-111111111111";
  it("keeps only the selected student reference and simulation source, not predictions", () => {
    expect(
      planHandoffSearch.parse({
        studentId,
        source: "predictionDemo",
        riskIndex: 41,
        reviewed: true,
      }),
    ).toEqual({ studentId, source: "predictionDemo" });
  });
  it("ignores malformed student links", () => {
    expect(planHandoffSearch.parse({ studentId: "not-an-id", source: "anything" })).toEqual({
      studentId: undefined,
      source: undefined,
    });
  });
  it("cannot select a student outside the caller's accessible records", () => {
    expect(
      findHandoffStudent([{ id: studentId }], "22222222-2222-4222-8222-222222222222"),
    ).toBeUndefined();
    expect(findHandoffStudent([{ id: studentId }], studentId)?.id).toBe(studentId);
  });
});
