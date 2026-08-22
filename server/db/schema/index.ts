// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

import {
  bigint,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  mobileNumber: text("mobile_number"),
  profilePictureUrl: text("profile_picture_url"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  ...timestamps,
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const userDocuments = pgTable("user_documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  documentType: text("document_type").notNull(),
  imageUrl: text("image_url").notNull(),
  ...timestamps,
});

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  gst: text("gst").notNull().default("—"),
  accountNo: text("account_no").notNull().default("—"),
  officeNumber: text("office_number").notNull().default("—"),
  ...timestamps,
});

export const companyAssignments = pgTable("company_assignments", {
  userId: text("user_id").notNull(),
  companyId: text("company_id").notNull(),
  ...timestamps,
});

export const employees = pgTable("employees", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  employeeId: bigint("employee_id", { mode: "number" }).notNull(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  salary: numeric("salary").notNull().default("0"),
  site: text("site").notNull(),
  role: text("role").notNull(),
  basicSalary: numeric("basic_salary").notNull().default("0"),
  allowances: numeric("allowances").notNull().default("0"),
  overtime: numeric("overtime").notNull().default("0"),
  pf: numeric("pf").notNull().default("0"),
  esic: numeric("esic").notNull().default("0"),
  profilePictureUrl: text("profile_picture_url"),
  dateOfJoining: date("date_of_joining").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  employeeIdIdx: uniqueIndex("employees_employee_id_idx").on(table.employeeId),
}));

export const attendance = pgTable("attendance", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull(),
  ...timestamps,
});

export const salaryRecords = pgTable("salary_records", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  ...timestamps,
});

export const salaryTransactions = pgTable("salary_transactions", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  type: text("type").notNull(),
  amount: numeric("amount").notNull(),
  note: text("note").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  ...timestamps,
});

export const accountSheets = pgTable("account_sheets", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalBilling: numeric("total_billing").notNull().default("0"),
  totalReceiving: numeric("total_receiving").notNull().default("0"),
  cashReceived: numeric("cash_received").notNull().default("0"),
  salary: numeric("salary").notNull().default("0"),
  expense: numeric("expense").notNull().default("0"),
  dressStock: numeric("dress_stock").notNull().default("0"),
  ...timestamps,
});