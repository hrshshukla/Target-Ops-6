import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { pool } from "../db";
import { logger } from "../lib/logger";
import { pathParams, sendError, type ApiRequest, type ApiResponse, type UserRecord, type UserRole } from "../lib/http";

type Role = UserRole;

const money = (value: unknown) => Number(Number(value ?? 0).toFixed(2));

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
const profileUpdateSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  mobileNumber: z.string().trim().max(30).nullish(),
  profilePictureUrl: z.string().url().nullish(),
});
const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
const documentSchema = z.object({ imageUrl: z.string().url() });
const companySchema = z.object({
  name: z.string().trim().min(1),
  logoUrl: z.string().trim().nullish(),
  gst: z.string().trim().optional(),
  accountNo: z.string().trim().optional(),
  officeNumber: z.string().trim().optional(),
});
const employeeSchema = z.object({
  name: z.string().trim().min(1),
  contact: z.string().trim().min(1),
  salary: z.number().finite().nonnegative(),
  site: z.string().trim().min(1),
  role: z.enum(["Security Guard", "Supervisor"]),
  basicSalary: z.number().finite().nonnegative(),
  allowances: z.number().finite().nonnegative(),
  overtime: z.number().finite().nonnegative(),
  pf: z.number().finite().nonnegative(),
  esic: z.number().finite().nonnegative(),
  profilePictureUrl: z.string().trim().nullish(),
  dateOfJoining: z.string().date(),
});
const attendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT"]),
});
const salaryTransactionSchema = z.object({
  type: z.enum(["ADVANCE", "FINE"]),
  amount: z.number().finite().nonnegative(),
  note: z.string(),
  year: z.number().int().min(2020),
  month: z.number().int().min(1).max(12),
});
const salaryUpdateSchema = z.object({
  basicSalary: z.number().finite().nonnegative(),
  allowances: z.number().finite().nonnegative(),
  overtime: z.number().finite().nonnegative(),
  advance: z.number().finite().nonnegative(),
  fine: z.number().finite().nonnegative(),
  pf: z.number().finite().nonnegative(),
  esic: z.number().finite().nonnegative(),
  year: z.number().int().min(2020),
  month: z.number().int().min(1).max(12),
});
const monthYearSchema = z.object({
  year: z.coerce.number().int().min(2020).default(2026),
  month: z.coerce.number().int().min(1).max(12).default(6),
});

function hashPassword(password: string) {
  const salt = "target-ops-development-salt";
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(hash, "hex"));
}

function parseBody<T>(schema: z.ZodType<T>, req: ApiRequest, res: ApiResponse) {
  let raw = req.body;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = undefined;
    }
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    sendError(res, 400, "INVALID_REQUEST", "Request data is invalid.");
    return null;
  }
  return result.data;
}

function parseMonthYear(req: ApiRequest, res: ApiResponse) {
  const result = monthYearSchema.safeParse(req.query);
  if (!result.success) {
    sendError(res, 400, "INVALID_DATE_RANGE", "Year and month must be valid.");
    return null;
  }
  return result.data;
}

async function ensureSeed() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT`);
  await pool.query(`CREATE TABLE IF NOT EXISTS user_documents (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, document_type TEXT NOT NULL,
    image_url TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const companies = [
    ["company-isf", "INDUSTRIAL SECURITY FORCE"],
    ["company-tis", "TARGET INDUSTRIAL SECURITY"],
    ["company-tssm", "TARGET SECURITY SERVICE&MANPOWER"],
    ["company-tisf", "TARGET INDUSTRIAL SECURITY FORCE Pvt Ltd"],
    ["company-ke", "KARNIKA ENTERPRISES"],
  ];
  const adminId = "user-admin";
  const supervisorId = "user-supervisor";
  const guardId = "user-guard";

  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15)
      ON CONFLICT (id) DO NOTHING`,
    [
      adminId,
      "Aarav Mehta",
      "admin@targetops.local",
      hashPassword("admin123"),
      "ADMIN",
      supervisorId,
      "Riya Sharma",
      "supervisor@targetops.local",
      hashPassword("supervisor123"),
      "SUPERVISOR",
      guardId,
      "Kabir Singh",
      "guard@targetops.local",
      hashPassword("guard123"),
      "SECURITY_GUARD",
    ],
  );

  for (const [id, name] of companies) {
    await pool.query(
      `INSERT INTO companies (id, name, gst, account_no, office_number)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
      [id, name, "GSTIN pending", "Account pending", "+91 00000 00000"],
    );
  }

  for (const companyId of ["company-isf", "company-tis", "company-tssm"]) {
    await pool.query(
      `INSERT INTO company_assignments (user_id, company_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [supervisorId, companyId],
    );
  }
  await pool.query(
    `INSERT INTO company_assignments (user_id, company_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [guardId, "company-isf"],
  );

  const employees = [
    ["employee-001", "company-isf", "EMP-0001", "ID-000001", "Kabir Singh", "9876543210", "Night Gate", "Security Guard", 28000, 24000],
    ["employee-002", "company-isf", "EMP-0002", "ID-000002", "Ananya Rao", "9876543211", "Control Room", "Supervisor", 42000, 36000],
    ["employee-003", "company-tis", "EMP-0003", "ID-000003", "Vikram Yadav", "9876543212", "Warehouse A", "Security Guard", 26500, 23000],
    ["employee-004", "company-tis", "EMP-0004", "ID-000004", "Meera Nair", "9876543213", "Main Entrance", "Security Guard", 27500, 24000],
    ["employee-005", "company-tssm", "EMP-0005", "ID-000005", "Arjun Patel", "9876543214", "Staff Parking", "Security Guard", 25000, 22000],
    ["employee-006", "company-ke", "EMP-0006", "ID-000006", "Sana Khan", "9876543215", "Reception", "Supervisor", 39000, 33000],
  ] as const;
  for (const employee of employees) {
    const [id, companyId, employeeNumber, idCard, name, contact, site, role, salary, basicSalary] = employee;
    await pool.query(
      `INSERT INTO employees
       (id, company_id, employee_number, id_card, name, contact, salary, site, role,
        basic_salary, allowances, overtime, pf, esic, date_of_joining)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (id) DO NOTHING`,
      [id, companyId, employeeNumber, idCard, name, contact, salary, site, role, basicSalary, 1500, 0, 1800, 450, "2025-06-15"],
    );
  }

  const accountRows = [
    ["company-isf", 999999, 0, 0, 0, 0, 0],
    ["company-tis", 772099, 617999, 57000, 0, 0, 0],
    ["company-tssm", 733319, 0, 0, 0, 0, 0],
    ["company-tisf", 101000, 19000, 0, 0, 0, 0],
    ["company-ke", 495600, 0, 0, 0, 0, 0],
  ] as const;
  for (const [companyId, billing, receiving, cash, salary, expense, dressStock] of accountRows) {
    await pool.query(
      `INSERT INTO account_sheets
       (id, company_id, month, year, total_billing, total_receiving, cash_received, salary, expense, dress_stock)
       VALUES ($1,$2,6,2026,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [`account-2026-06-${companyId}`, companyId, billing, receiving, cash, salary, expense, dressStock],
    );
  }
}


async function authenticate(req: ApiRequest, res: ApiResponse) {
  try {
    const rawAuthorization = req.headers.authorization;
    const authorization = Array.isArray(rawAuthorization) ? rawAuthorization[0] : rawAuthorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!token) {
      sendError(res, 401, "UNAUTHORIZED", "Sign in to continue.");
      return false;
    }
    const result = await pool.query<UserRecord & {
      mobile_number: string | null;
      profile_picture_url: string | null;
      expires_at: Date;
    }>(
      `SELECT u.id, u.name, u.email, u.mobile_number, u.profile_picture_url, u.role, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = $1`,
      [token],
    );
    const user = result.rows[0];
    if (!user || new Date(user.expires_at).getTime() <= Date.now()) {
      sendError(res, 401, "UNAUTHORIZED", "Your session has expired.");
      return false;
    }
    req.auth = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobile_number,
      profilePictureUrl: user.profile_picture_url,
      role: user.role,
    };
    req.token = token;
    return true;
  } catch (error) {
    logger.error({ err: error }, "Authentication failed");
    sendError(res, 500, "AUTH_ERROR", "Unable to verify the session.");
    return false;
  }
}

function requireRole(req: ApiRequest, res: ApiResponse, ...roles: Role[]) {
  if (!req.auth || !roles.includes(req.auth.role)) {
    sendError(res, 403, "FORBIDDEN", "You do not have permission for this action.");
    return false;
  }
  return true;
}

function requireManagementRole(req: ApiRequest, res: ApiResponse) {
  return requireRole(req, res, "ADMIN", "SUPERVISOR");
}

async function canAccessCompany(user: UserRecord, companyId: string) {
  if (user.role === "ADMIN") return true;
  const result = await pool.query("SELECT 1 FROM company_assignments WHERE user_id = $1 AND company_id = $2", [user.id, companyId]);
  return (result.rowCount ?? 0) > 0;
}

async function employeeForRequest(req: ApiRequest, res: ApiResponse) {
  const user = req.auth!;
  const result = await pool.query("SELECT * FROM employees WHERE id = $1 AND deleted_at IS NULL", [req.params.employeeId]);
  const employee = result.rows[0];
  if (!employee) {
    sendError(res, 404, "NOT_FOUND", "Employee not found.");
    return null;
  }
  if (!(await canAccessCompany(user, employee.company_id))) {
    sendError(res, 403, "FORBIDDEN", "This employee is outside your assigned companies.");
    return null;
  }
  return employee;
}

async function guardEmployee(req: ApiRequest, res: ApiResponse) {
  if (req.auth!.role !== "SECURITY_GUARD") {
    sendError(res, 403, "FORBIDDEN", "This endpoint is only available to security guards.");
    return null;
  }
  const result = await pool.query(
    `SELECT e.* FROM employees e
     JOIN company_assignments ca ON ca.company_id = e.company_id
     WHERE ca.user_id = $1 AND e.name = $2 AND e.role = 'Security Guard'
       AND e.deleted_at IS NULL
     ORDER BY e.id LIMIT 1`,
    [req.auth!.id, req.auth!.name],
  );
  const employee = result.rows[0];
  if (!employee) {
    sendError(res, 404, "NOT_FOUND", "Your guard profile is not assigned.");
    return null;
  }
  return employee;
}

function employeePayload(row: Record<string, unknown>) {
  return {
    id: row.id,
    companyId: row.company_id,
    employeeNumber: row.employee_number,
    idCard: row.id_card,
    name: row.name,
    contact: row.contact,
    salary: money(row.salary),
    site: row.site,
    role: row.role,
    basicSalary: money(row.basic_salary),
    allowances: money(row.allowances),
    overtime: money(row.overtime),
    pf: money(row.pf),
    esic: money(row.esic),
    profilePictureUrl: row.profile_picture_url,
    dateOfJoining: row.date_of_joining,
  };
}

function financialPayload(row: Record<string, unknown>) {
  const totalBilling = money(row.total_billing);
  const totalReceiving = money(row.total_receiving);
  const cashReceived = money(row.cash_received);
  const salary = money(row.salary);
  const expense = money(row.expense);
  const dressStock = money(row.dress_stock);
  const balance = totalReceiving + cashReceived - salary - expense;
  return { totalBilling, totalReceiving, cashReceived, salary, balance, expense, dressStock, profit: balance - dressStock };
}

async function companyPayload(companyId: string) {
  const result = await pool.query(
    `SELECT c.*, COALESCE(employee_counts.employee_count, 0)::int AS employee_count,
      COALESCE(a.total_billing,0) AS total_billing,
      COALESCE(a.total_receiving,0) AS total_receiving,
      COALESCE(a.cash_received,0) AS cash_received,
      COALESCE(a.salary,0) AS salary,
      COALESCE(a.expense,0) AS expense,
      COALESCE(a.dress_stock,0) AS dress_stock
     FROM companies c
      LEFT JOIN (
        SELECT company_id, COUNT(*) AS employee_count
        FROM employees
        WHERE deleted_at IS NULL
        GROUP BY company_id
      ) employee_counts ON employee_counts.company_id = c.id
      LEFT JOIN account_sheets a ON a.company_id = c.id AND a.month = 6 AND a.year = 2026
     WHERE c.id = $1
      `,
    [companyId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    gst: row.gst,
    accountNo: row.account_no,
    officeNumber: row.office_number,
    employeeCount: Number(row.employee_count),
    financials: financialPayload(row),
  };
}

async function salaryPayload(employee: Record<string, unknown>, year: number, month: number) {
  const transactions = await pool.query(
    `SELECT type, COALESCE(SUM(amount),0) AS total
     FROM salary_transactions WHERE employee_id = $1 AND year = $2 AND month = $3 GROUP BY type`,
    [employee.id, year, month],
  );
  const advance = money(transactions.rows.find((row) => row.type === "ADVANCE")?.total);
  const fine = money(transactions.rows.find((row) => row.type === "FINE")?.total);
  const basicSalary = money(employee.basic_salary);
  const allowances = money(employee.allowances);
  const overtime = money(employee.overtime);
  const grossSalary = basicSalary + allowances + overtime;
  const pf = money(employee.pf);
  const esic = money(employee.esic);
  const totalDeduction = advance + fine + pf + esic;
  return { year, month, basicSalary, allowances, overtime, grossSalary, advance, fine, pf, esic, totalDeduction, netSalary: grossSalary - totalDeduction };
}

function route(req: ApiRequest, method: string, pattern: string) {
  if (req.method !== method) return null;
  return pathParams(req.path, pattern);
}

export async function handleManagement(req: ApiRequest, res: ApiResponse): Promise<boolean> {
  let params = route(req, "POST", "/auth/login");
  if (params) {
    req.params = params;
    await ensureSeed();
    const body = parseBody(loginSchema, req, res);
    if (!body) return true;
    const result = await pool.query(
      "SELECT id, name, email, mobile_number, profile_picture_url, role, password_hash FROM users WHERE lower(email) = $1",
      [body.email.toLowerCase()],
    );
    const row = result.rows[0];
    if (!row || !verifyPassword(body.password, row.password_hash)) {
      sendError(res, 401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
      return true;
    }
    const token = randomBytes(32).toString("hex");
    await pool.query(
      `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [token, row.id],
    );
    res.json({
      token,
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        mobileNumber: row.mobile_number,
        profilePictureUrl: row.profile_picture_url,
        role: row.role,
      },
    });
    return true;
  }

  params = route(req, "GET", "/settings/imagekit-auth");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res))) return true;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
    if (!privateKey || !publicKey || !urlEndpoint) {
      sendError(res, 503, "IMAGEKIT_NOT_CONFIGURED", "ImageKit is not configured yet.");
      return true;
    }
    const expire = Math.floor(Date.now() / 1000) + 600;
    const token = randomBytes(16).toString("hex");
    const signature = createHmac("sha1", privateKey).update(token + expire).digest("hex");
    res.json({ token, expire, signature, publicKey, urlEndpoint });
    return true;
  }

  params = route(req, "PATCH", "/settings/profile");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res))) return true;
    const body = parseBody(profileUpdateSchema, req, res);
    if (!body) return true;
    const duplicate = await pool.query(
      "SELECT id FROM users WHERE lower(email) = lower($1) AND id <> $2",
      [body.email, req.auth!.id],
    );
    if (duplicate.rowCount) {
      sendError(res, 409, "EMAIL_IN_USE", "That email is already in use.");
      return true;
    }
    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2, mobile_number=$3, profile_picture_url=$4, updated_at=NOW()
       WHERE id=$5
       RETURNING id, name, email, mobile_number, profile_picture_url, role`,
      [body.name, body.email, body.mobileNumber || null, body.profilePictureUrl || null, req.auth!.id],
    );
    const row = result.rows[0];
    res.json({
      id: row.id, name: row.name, email: row.email, mobileNumber: row.mobile_number,
      profilePictureUrl: row.profile_picture_url, role: row.role,
    });
    return true;
  }

  params = route(req, "PATCH", "/settings/password");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res))) return true;
    const body = parseBody(passwordUpdateSchema, req, res);
    if (!body) return true;
    const result = await pool.query("SELECT password_hash FROM users WHERE id=$1", [req.auth!.id]);
    if (!result.rows[0] || !verifyPassword(body.currentPassword, result.rows[0].password_hash)) {
      sendError(res, 400, "INVALID_PASSWORD", "Current password is incorrect.");
      return true;
    }
    await pool.query("UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2", [
      hashPassword(body.newPassword), req.auth!.id,
    ]);
    res.status(204).send();
    return true;
  }

  params = route(req, "GET", "/settings/documents");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireRole(req, res, "SUPERVISOR", "SECURITY_GUARD")) return true;
    const result = await pool.query(
      "SELECT id, document_type, image_url, created_at FROM user_documents WHERE user_id=$1 ORDER BY created_at DESC",
      [req.auth!.id],
    );
    res.json(result.rows.map((row) => ({
      id: row.id, documentType: row.document_type, imageUrl: row.image_url, createdAt: row.created_at,
    })));
    return true;
  }

  params = route(req, "PUT", "/settings/documents/aadhaar");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireRole(req, res, "SUPERVISOR", "SECURITY_GUARD")) return true;
    const body = parseBody(documentSchema, req, res);
    if (!body) return true;
    const result = await pool.query(
      `INSERT INTO user_documents (id, user_id, document_type, image_url)
       VALUES ($1, $2, 'AADHAAR', $3)
       ON CONFLICT (id) DO UPDATE SET image_url=EXCLUDED.image_url, updated_at=NOW()
       RETURNING id, document_type, image_url, created_at`,
      [`aadhaar-${req.auth!.id}`, req.auth!.id, body.imageUrl],
    );
    const row = result.rows[0];
    res.json({ id: row.id, documentType: row.document_type, imageUrl: row.image_url, createdAt: row.created_at });
    return true;
  }

  params = route(req, "GET", "/guard/me");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res))) return true;
    const employee = await guardEmployee(req, res);
    if (employee) res.json(employeePayload(employee));
    return true;
  }

  params = route(req, "GET", "/guard/attendance");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res))) return true;
    const employee = await guardEmployee(req, res);
    if (!employee) return true;
    const values = parseMonthYear(req, res);
    if (!values) return true;
    const result = await pool.query(
      `SELECT date::text, status FROM attendance
       WHERE employee_id=$1 AND EXTRACT(YEAR FROM date)=$2 AND EXTRACT(MONTH FROM date)=$3
       ORDER BY date`,
      [employee.id, values.year, values.month],
    );
    const records = result.rows;
    const presentDays = records.filter((row) => row.status === "PRESENT").length;
    const absentDays = records.filter((row) => row.status === "ABSENT").length;
    res.json({ year: values.year, month: values.month, presentDays, absentDays, net: presentDays - absentDays, records });
    return true;
  }

  params = route(req, "GET", "/guard/salary");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res))) return true;
    const employee = await guardEmployee(req, res);
    if (!employee) return true;
    const values = parseMonthYear(req, res);
    if (!values) return true;
    res.json(await salaryPayload(employee, values.year, values.month));
    return true;
  }

  params = route(req, "GET", "/auth/me");
  if (params) {
    req.params = params;
    if (await authenticate(req, res)) res.json(req.auth);
    return true;
  }

  params = route(req, "POST", "/auth/logout");
  if (params) {
    req.params = params;
    if (await authenticate(req, res)) res.status(204).send();
    if (req.token) await pool.query("DELETE FROM sessions WHERE token = $1", [req.token]);
    return true;
  }

  params = route(req, "GET", "/companies");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireManagementRole(req, res)) return true;
    await ensureSeed();
    const user = req.auth!;
    const result = user.role === "ADMIN"
      ? await pool.query("SELECT id FROM companies ORDER BY name")
      : await pool.query(
        `SELECT c.id FROM companies c
         JOIN company_assignments ca ON ca.company_id = c.id
         WHERE ca.user_id = $1 ORDER BY c.name`,
        [user.id],
      );
    const companies = [];
    for (const row of result.rows) {
      const company = await companyPayload(row.id);
      if (company) companies.push(company);
    }
    res.json(companies);
    return true;
  }

  params = route(req, "POST", "/companies");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireRole(req, res, "ADMIN")) return true;
    const body = parseBody(companySchema, req, res);
    if (!body) return true;
    const id = `company-${createHash("sha1").update(`${Date.now()}-${body.name}`).digest("hex").slice(0, 10)}`;
    await pool.query(
      `INSERT INTO companies (id, name, logo_url, gst, account_no, office_number)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, body.name, body.logoUrl ?? null, body.gst ?? "—", body.accountNo ?? "—", body.officeNumber ?? "—"],
    );
    res.status(201).json(await companyPayload(id));
    return true;
  }

  params = route(req, "GET", "/companies/:companyId");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireManagementRole(req, res)) return true;
    const user = req.auth!;
    if (!(await canAccessCompany(user, req.params.companyId))) {
      sendError(res, 403, "FORBIDDEN", "This company is outside your assigned companies.");
      return true;
    }
    const company = await companyPayload(req.params.companyId);
    if (!company) {
      sendError(res, 404, "NOT_FOUND", "Company not found.");
      return true;
    }
    res.json(company);
    return true;
  }

  params = route(req, "PATCH", "/companies/:companyId");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireRole(req, res, "ADMIN")) return true;
    const body = parseBody(companySchema, req, res);
    if (!body) return true;
    await pool.query(
      `UPDATE companies SET name=$1, logo_url=$2, gst=$3, account_no=$4, office_number=$5, updated_at=NOW() WHERE id=$6`,
      [body.name, body.logoUrl ?? null, body.gst ?? "—", body.accountNo ?? "—", body.officeNumber ?? "—", req.params.companyId],
    );
    const company = await companyPayload(req.params.companyId);
    if (!company) {
      sendError(res, 404, "NOT_FOUND", "Company not found.");
      return true;
    }
    res.json(company);
    return true;
  }

  params = route(req, "GET", "/companies/:companyId/employees");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireManagementRole(req, res)) return true;
    const user = req.auth!;
    if (!(await canAccessCompany(user, req.params.companyId))) {
      sendError(res, 403, "FORBIDDEN", "This company is outside your assigned companies.");
      return true;
    }
    const search = String(req.query.search ?? "").trim();
    const result = await pool.query(
      `SELECT * FROM employees
       WHERE company_id = $1 AND deleted_at IS NULL
       AND ($2 = '' OR name ILIKE '%' || $2 || '%' OR employee_number ILIKE '%' || $2 || '%' OR site ILIKE '%' || $2 || '%' OR id_card ILIKE '%' || $2 || '%')
       ORDER BY name LIMIT 100`,
      [req.params.companyId, search],
    );
    res.json(result.rows.map(employeePayload));
    return true;
  }

  params = route(req, "POST", "/companies/:companyId/employees");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireRole(req, res, "ADMIN", "SUPERVISOR")) return true;
    if (!(await canAccessCompany(req.auth!, req.params.companyId))) {
      sendError(res, 403, "FORBIDDEN", "This company is outside your assigned companies.");
      return true;
    }
    const body = parseBody(employeeSchema, req, res);
    if (!body) return true;
    const role = req.auth!.role === "SUPERVISOR" ? "Security Guard" : body.role;
    const id = `employee-${randomBytes(8).toString("hex")}`;
    const numberResult = await pool.query("SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 5) AS integer)),0)+1 AS next FROM employees");
    const cardResult = await pool.query("SELECT COALESCE(MAX(CAST(SUBSTRING(id_card FROM 4) AS integer)),0)+1 AS next FROM employees");
    const employeeNumber = `EMP-${String(numberResult.rows[0].next).padStart(4, "0")}`;
    const idCard = `ID-${String(cardResult.rows[0].next).padStart(6, "0")}`;
    await pool.query(
      `INSERT INTO employees
       (id, company_id, employee_number, id_card, name, contact, salary, site, role, basic_salary, allowances, overtime, pf, esic, profile_picture_url, date_of_joining)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [id, req.params.companyId, employeeNumber, idCard, body.name, body.contact, body.salary, body.site, role, body.basicSalary, body.allowances, body.overtime, body.pf, body.esic, body.profilePictureUrl ?? null, body.dateOfJoining],
    );
    const employee = await pool.query("SELECT * FROM employees WHERE id = $1", [id]);
    res.status(201).json(employeePayload(employee.rows[0]));
    return true;
  }

  params = route(req, "GET", "/employees/:employeeId");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireManagementRole(req, res)) return true;
    const employee = await employeeForRequest(req, res);
    if (employee) res.json(employeePayload(employee));
    return true;
  }

  params = route(req, "PATCH", "/employees/:employeeId");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireRole(req, res, "ADMIN")) return true;
    const body = parseBody(employeeSchema, req, res);
    if (!body) return true;
    const employee = await employeeForRequest(req, res);
    if (!employee) return true;
    await pool.query(
      `UPDATE employees SET name=$1, contact=$2, salary=$3, site=$4, role=$5, basic_salary=$6,
       allowances=$7, overtime=$8, pf=$9, esic=$10, profile_picture_url=$11, date_of_joining=$12, updated_at=NOW()
       WHERE id=$13`,
      [body.name, body.contact, body.salary, body.site, body.role, body.basicSalary, body.allowances, body.overtime, body.pf, body.esic, body.profilePictureUrl ?? null, body.dateOfJoining, req.params.employeeId],
    );
    const updated = await pool.query("SELECT * FROM employees WHERE id = $1", [req.params.employeeId]);
    res.json(employeePayload(updated.rows[0]));
    return true;
  }

  params = route(req, "DELETE", "/employees/:employeeId");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireRole(req, res, "ADMIN")) return true;
    const employee = await employeeForRequest(req, res);
    if (!employee) return true;
    await pool.query("UPDATE employees SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1", [req.params.employeeId]);
    res.status(204).send();
    return true;
  }

  params = route(req, "GET", "/employees/:employeeId/attendance");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireManagementRole(req, res)) return true;
    const employee = await employeeForRequest(req, res);
    if (!employee) return true;
    const values = parseMonthYear(req, res);
    if (!values) return true;
    const { year, month } = values;
    const result = await pool.query(
      `SELECT date::text, status FROM attendance WHERE employee_id=$1 AND EXTRACT(YEAR FROM date)=$2 AND EXTRACT(MONTH FROM date)=$3 ORDER BY date`,
      [req.params.employeeId, year, month],
    );
    const records = result.rows;
    const presentDays = records.filter((row) => row.status === "PRESENT").length;
    const absentDays = records.filter((row) => row.status === "ABSENT").length;
    res.json({ year, month, presentDays, absentDays, net: presentDays - absentDays, records });
    return true;
  }

  params = route(req, "PUT", "/employees/:employeeId/attendance/:date");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireManagementRole(req, res)) return true;
    const body = parseBody(attendanceSchema, req, res);
    if (!body) return true;
    const employee = await employeeForRequest(req, res);
    if (!employee) return true;
    const dateValue = new Date(`${req.params.date}T00:00:00Z`);
    if (Number.isNaN(dateValue.getTime()) || dateValue > new Date()) {
      sendError(res, 400, "INVALID_DATE", "Future dates cannot be marked as attendance.");
      return true;
    }
    await pool.query(
      `INSERT INTO attendance (id, employee_id, date, status) VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status, updated_at=NOW()`,
      [`attendance-${req.params.employeeId}-${req.params.date}`, req.params.employeeId, req.params.date, body.status],
    );
    const summary = await pool.query(
      `SELECT date::text, status FROM attendance WHERE employee_id=$1 AND EXTRACT(YEAR FROM date)=$2 AND EXTRACT(MONTH FROM date)=$3 ORDER BY date`,
      [req.params.employeeId, dateValue.getUTCFullYear(), dateValue.getUTCMonth() + 1],
    );
    const records = summary.rows;
    const presentDays = records.filter((row) => row.status === "PRESENT").length;
    const absentDays = records.filter((row) => row.status === "ABSENT").length;
    res.json({ year: dateValue.getUTCFullYear(), month: dateValue.getUTCMonth() + 1, presentDays, absentDays, net: presentDays - absentDays, records });
    return true;
  }

  params = route(req, "GET", "/employees/:employeeId/salary");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireManagementRole(req, res)) return true;
    const employee = await employeeForRequest(req, res);
    if (!employee) return true;
    const values = parseMonthYear(req, res);
    if (!values) return true;
    res.json(await salaryPayload(employee, values.year, values.month));
    return true;
  }

  params = route(req, "POST", "/employees/:employeeId/salary/transaction");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireRole(req, res, "ADMIN")) return true;
    const body = parseBody(salaryTransactionSchema, req, res);
    if (!body) return true;
    const employee = await employeeForRequest(req, res);
    if (!employee) return true;
    await pool.query(
      `INSERT INTO salary_transactions (id, employee_id, type, amount, note, month, year) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [`salary-${randomBytes(10).toString("hex")}`, req.params.employeeId, body.type, body.amount, body.note, body.month, body.year],
    );
    res.status(201).json(await salaryPayload(employee, body.year, body.month));
    return true;
  }

  params = route(req, "PATCH", "/employees/:employeeId/salary");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireManagementRole(req, res)) return true;
    const body = parseBody(salaryUpdateSchema, req, res);
    if (!body) return true;
    const employee = await employeeForRequest(req, res);
    if (!employee) return true;
    if (req.auth!.role !== "ADMIN" && employee.role !== "Security Guard") {
      sendError(res, 403, "FORBIDDEN", "Supervisors can only edit security guard salaries.");
      return true;
    }
    await pool.query(
      `UPDATE employees
       SET salary=$1, basic_salary=$2, allowances=$3, overtime=$4, pf=$5, esic=$6, updated_at=NOW()
       WHERE id=$7`,
      [
        body.basicSalary + body.allowances + body.overtime,
        body.basicSalary,
        body.allowances,
        body.overtime,
        body.pf,
        body.esic,
        req.params.employeeId,
      ],
    );
    await pool.query(
      "DELETE FROM salary_transactions WHERE employee_id=$1 AND year=$2 AND month=$3",
      [req.params.employeeId, body.year, body.month],
    );
    const transactions = [
      ["ADVANCE", body.advance],
      ["FINE", body.fine],
    ] as const;
    for (const [type, amount] of transactions) {
      if (amount > 0) {
        await pool.query(
          `INSERT INTO salary_transactions (id, employee_id, type, amount, note, month, year)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            `salary-${randomBytes(10).toString("hex")}`,
            req.params.employeeId,
            type,
            amount,
            "Updated from salary details",
            body.month,
            body.year,
          ],
        );
      }
    }
    const updatedEmployee = await pool.query("SELECT * FROM employees WHERE id = $1", [
      req.params.employeeId,
    ]);
    res.json(await salaryPayload(updatedEmployee.rows[0], body.year, body.month));
    return true;
  }

  params = route(req, "GET", "/account-sheet/:year/:month");
  if (params) {
    req.params = params;
    if (!(await authenticate(req, res)) || !requireRole(req, res, "ADMIN")) return true;
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const result = await pool.query(
      `SELECT c.id AS company_id, c.name AS company_name,
       COALESCE(a.total_billing,0) AS total_billing, COALESCE(a.total_receiving,0) AS total_receiving,
       COALESCE(a.cash_received,0) AS cash_received, COALESCE(a.salary,0) AS salary,
       COALESCE(a.expense,0) AS expense, COALESCE(a.dress_stock,0) AS dress_stock
       FROM companies c LEFT JOIN account_sheets a ON a.company_id=c.id AND a.year=$1 AND a.month=$2
       ORDER BY c.name`,
      [year, month],
    );
    const rows = result.rows.map((row) => ({ companyId: row.company_id, companyName: row.company_name, ...financialPayload(row) }));
    const totals = rows.reduce((acc, row) => ({
      totalBilling: acc.totalBilling + row.totalBilling,
      totalReceiving: acc.totalReceiving + row.totalReceiving,
      cashReceived: acc.cashReceived + row.cashReceived,
      salary: acc.salary + row.salary,
      balance: acc.balance + row.balance,
      expense: acc.expense + row.expense,
      dressStock: acc.dressStock + row.dressStock,
      profit: acc.profit + row.profit,
    }), { totalBilling: 0, totalReceiving: 0, cashReceived: 0, salary: 0, balance: 0, expense: 0, dressStock: 0, profit: 0 });
    res.json({ year, month, rows, totals });
    return true;
  }

  return false;
}