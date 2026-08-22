import { customFetch } from "./custom-fetch";

export type GuardRegistration = {
  name: string;
  phoneNumber: string;
  email?: string;
  age?: number;
  companyCode: string;
  password: string;
};

export type GuardRegistrationResponse = {
  message: string;
  companyId: string;
  user: { id: string; name: string; role: "SECURITY_GUARD" };
};

export type GuardEmployeeRegistration = {
  name: string;
  phoneNumber: string;
  email?: string;
  age: number;
  password: string;
  site?: string;
  basicSalary?: number;
};

export type GuardEmployeeRegistrationResponse = GuardRegistrationResponse & {
  employee: { id: string; name: string; role: "Security Guard" };
};

export const registerGuard = (body: GuardRegistration) =>
  customFetch<GuardRegistrationResponse>("/api/auth/register-guard", {
    method: "POST",
    body: JSON.stringify(body),
    responseType: "json",
  });

export const createGuardEmployee = (
  companyId: string,
  body: GuardEmployeeRegistration,
) =>
  customFetch<GuardEmployeeRegistrationResponse>(
    `/api/companies/${companyId}/guard-accounts`,
    {
      method: "POST",
      body: JSON.stringify(body),
      responseType: "json",
    },
  );