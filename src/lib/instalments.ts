"use client";

import { resolveApiError } from "@/lib/errors";

// === Types

export type InstalmentStatus =
  | "SCHEDULED"
  | "AWAITING_PAYMENT"
  | "OVERDUE"
  | "PAID"
  | "RELEASING"
  | "RELEASED"
  | "REFUNDED"
  | "CANCELLED";

/** One part of a yearly rent paid in parts. */
export interface Instalment {
  amount: number;
  bookingId: number;
  commissionAmount: number | null;
  dueDate: string;
  hostAmount: number | null;
  id: number;
  /** How many parts the rent is split into. */
  of: number;
  paidAt: string | null;
  /** The first part is paid through the booking payment itself. */
  paidWithBooking: boolean;
  releasedAt: string | null;
  sequenceNumber: number;
  status: InstalmentStatus;
}

export interface ReceiptLine {
  amount: number;
  label: string;
}

export interface Receipt {
  commission: number | null;
  currency: string;
  hostAmount: number | null;
  hostName: string;
  kind: "PAYMENT" | "INSTALMENT";
  lines: ReceiptLine[];
  paidAt: string;
  payerEmail: string | null;
  payerName: string;
  period: string;
  propertyAddress: string;
  propertyTitle: string;
  receiptNumber: string;
  reference: string;
  refundedAt: string | null;
  status: string;
  total: number;
}

export interface StatementRow {
  commission: number | null;
  counterparty: string;
  date: string;
  gross: number;
  net: number;
  propertyTitle: string;
  reference: string | null;
  status: string | null;
  type: string;
}

export interface Statement {
  currency: string;
  from: string;
  rows: StatementRow[];
  to: string;
  totalCommission: number;
  totalGross: number;
  totalNet: number;
  view: "HOST" | "TENANT";
}

export interface MoneyResult<TValue> {
  data: TValue;
  message?: string;
}

// === Helpers

function getAccessToken(): string {
  return localStorage.getItem("rello_token") ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

async function send(
  path: string,
  init: RequestInit,
  fallback: string,
): Promise<{ data: unknown; message?: string }> {
  const token = getAccessToken();

  if (!token) {
    return { data: null, message: "Your session has expired. Log in again." };
  }

  try {
    const response = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return { data: null, message: resolveApiError(payload, fallback) };
    }

    return { data: isRecord(payload) && "data" in payload ? payload.data : null };
  } catch {
    return { data: null, message: fallback };
  }
}

function toInstalments(value: unknown): Instalment[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Instalment =>
          isRecord(item) && typeof item.id === "number" && typeof item.amount === "number",
      )
    : [];
}

// === Plans and payments

export async function getInstalments(
  bookingId: number,
): Promise<MoneyResult<Instalment[]>> {
  const result = await send(
    `/api/escrow/bookings/${bookingId}/instalments`,
    {},
    "The payment plan could not be loaded.",
  );

  return { data: toInstalments(result.data), message: result.message };
}

/** 1 pays everything at once; 2, 4 or 12 split the rent. Allowed until the first payment. */
export async function choosePaymentPlan(
  bookingId: number,
  instalments: number,
): Promise<MoneyResult<Instalment[] | null>> {
  const result = await send(
    `/api/escrow/bookings/${bookingId}/plan`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instalments }),
    },
    "That payment plan could not be saved.",
  );

  return result.message
    ? { data: null, message: result.message }
    : { data: toInstalments(result.data) };
}

/** Returns the Paystack checkout URL. */
export async function startInstalmentPayment(
  instalmentId: number,
): Promise<MoneyResult<string | null>> {
  const result = await send(
    `/api/escrow/instalments/${instalmentId}/pay`,
    { method: "POST" },
    "The payment could not start.",
  );
  const url =
    isRecord(result.data) && typeof result.data.authorizationUrl === "string"
      ? result.data.authorizationUrl
      : null;

  return url ? { data: url } : { data: null, message: result.message ?? "The payment could not start." };
}

export async function verifyInstalmentPayment(
  reference: string,
): Promise<MoneyResult<Instalment | null>> {
  const result = await send(
    `/api/escrow/instalments/payments/${encodeURIComponent(reference)}/verify`,
    { method: "POST" },
    "The payment could not be checked.",
  );
  const [instalment] = toInstalments(result.data ? [result.data] : []);

  return instalment ? { data: instalment } : { data: null, message: result.message };
}

// === Receipts and statements

function isReceipt(value: unknown): value is Receipt {
  return isRecord(value) && typeof value.receiptNumber === "string" && Array.isArray(value.lines);
}

export async function getPaymentReceipt(
  escrowId: number,
): Promise<MoneyResult<Receipt | null>> {
  const result = await send(`/api/escrow/${escrowId}/receipt`, {}, "The receipt could not be loaded.");

  return isReceipt(result.data) ? { data: result.data } : { data: null, message: result.message };
}

export async function getInstalmentReceipt(
  instalmentId: number,
): Promise<MoneyResult<Receipt | null>> {
  const result = await send(
    `/api/escrow/instalments/${instalmentId}/receipt`,
    {},
    "The receipt could not be loaded.",
  );

  return isReceipt(result.data) ? { data: result.data } : { data: null, message: result.message };
}

/** Dates as yyyy-MM-dd. Defaults to the last year. */
export async function getStatement(
  from: string,
  to: string,
): Promise<MoneyResult<Statement | null>> {
  const query = new URLSearchParams();

  if (from) {
    query.set("from", from);
  }

  if (to) {
    query.set("to", to);
  }

  const result = await send(
    `/api/escrow/statement?${query.toString()}`,
    {},
    "The statement could not be loaded.",
  );

  return isRecord(result.data) && Array.isArray(result.data.rows)
    ? { data: result.data as unknown as Statement }
    : { data: null, message: result.message };
}

/** A spreadsheet-safe CSV of a statement, built in the browser from the rows on screen. */
export function statementCsv(statement: Statement): string {
  const escape = (value: string | number | null): string => {
    const text = value === null ? "" : String(value);
    const safe = /^[=+\-@\t\r]/.test(text) && typeof value === "string" ? `'${text}` : text;

    return `"${safe.replace(/"/g, '""')}"`;
  };
  const header = ["date", "type", "property", "counterparty", "gross_ngn", "commission_ngn", "net_ngn", "reference", "status"];
  const lines = statement.rows.map((row) =>
    [row.date, row.type, row.propertyTitle, row.counterparty, row.gross, row.commission, row.net, row.reference, row.status]
      .map(escape)
      .join(","),
  );

  return [header.join(","), ...lines].join("\r\n");
}
