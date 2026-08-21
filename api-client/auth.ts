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

export const registerGuard = (body: GuardRegistration) =>
  customFetch<GuardRegistrationResponse>("/auth/register-guard", {
    method: "POST",
    body: JSON.stringify(body),
    responseType: "json",
  });