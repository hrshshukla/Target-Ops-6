import { useMutation } from "@tanstack/react-query";
import type { SalarySummary } from "./generated/api.schemas";
import { customFetch } from "./custom-fetch";

export type SalaryUpdateInput = {
  basicSalary: number;
  allowances: number;
  overtime: number;
  advance: number;
  fine: number;
  pf: number;
  esic: number;
  year: number;
  month: number;
};

export function updateSalary(
  employeeId: string,
  data: SalaryUpdateInput,
): Promise<SalarySummary> {
  return customFetch<SalarySummary>(`/api/employees/${employeeId}/salary`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function useUpdateSalary() {
  return useMutation({
    mutationFn: ({
      employeeId,
      data,
    }: {
      employeeId: string;
      data: SalaryUpdateInput;
    }) => updateSalary(employeeId, data),
  });
}