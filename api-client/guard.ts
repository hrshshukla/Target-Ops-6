import { useQuery } from "@tanstack/react-query";
import type { AttendanceSummary, Employee, SalarySummary } from "./generated/api.schemas";
import { customFetch } from "./custom-fetch";

export const getGuardMe = () => customFetch<Employee>("/api/guard/me");

export const getGuardAttendance = (year: number, month: number) =>
  customFetch<AttendanceSummary>(`/api/guard/attendance?year=${year}&month=${month}`);

export const getGuardSalary = (year: number, month: number) =>
  customFetch<SalarySummary>(`/api/guard/salary?year=${year}&month=${month}`);

export function useGuardMe() {
  return useQuery({ queryKey: ["guard", "me"], queryFn: getGuardMe });
}

export function useGuardAttendance(year: number, month: number) {
  return useQuery({
    queryKey: ["guard", "attendance", year, month],
    queryFn: () => getGuardAttendance(year, month),
  });
}

export function useGuardSalary(year: number, month: number) {
  return useQuery({
    queryKey: ["guard", "salary", year, month],
    queryFn: () => getGuardSalary(year, month),
  });
}