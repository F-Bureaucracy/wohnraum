// Generation of AI data reports via the deployed f-omnes service
// (https://omnes.f-bau.ai). f-omnes takes a Postgres connection string plus a
// prompt and returns the report as HTML together with a rendered PDF.
//
// Generation can take a while, so callers create the `report` row (status
// `generating`) and then trigger `generateReport` without awaiting it — the
// detail page polls for completion. This module owns talking to f-omnes,
// persisting the returned HTML, and copying the PDF into our own S3 bucket.

import { env } from "$env/dynamic/private";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { report } from "./db/schema";
import { putObject } from "./s3";

const OMNES_URL = (env.OMNES_URL ?? "https://omnes.f-bau.ai").replace(
  /\/+$/,
  "",
);

function omnesHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    ...(env.OMNES_API_KEY
      ? { authorization: `Bearer ${env.OMNES_API_KEY}` }
      : {}),
    ...extra,
  };
}

type CreateReportResponse = {
  report_id: string;
  source_html: string;
  pdf_url: string;
};

/**
 * Drives a report row from `generating` to `ready` (or `error`). Safe to call
 * without awaiting; it persists its own outcome and never throws.
 */
export async function generateReport(
  reportId: string,
  prompt: string,
): Promise<void> {
  try {
    const connectionString = env.DATABASE_URL;
    if (!connectionString) throw new Error("Missing env var DATABASE_URL");

    const res = await fetch(`${OMNES_URL}/reports`, {
      method: "POST",
      headers: omnesHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({ connection_string: connectionString, prompt }),
    });
    if (!res.ok) {
      throw new Error(
        `f-omnes /reports responded ${res.status}: ${await safeText(res)}`,
      );
    }
    const data = (await res.json()) as CreateReportResponse;

    // Copy the rendered PDF into our own bucket so downloads don't depend on
    // f-omnes staying reachable. Best-effort: a missing PDF must not fail the
    // whole report, the HTML is the primary artifact.
    let pdfStorageKey: string | null = null;
    try {
      const pdfBytes = await fetchPdf(data.report_id, data.pdf_url);
      if (pdfBytes) {
        pdfStorageKey = `reports/${reportId}.pdf`;
        await putObject(pdfStorageKey, pdfBytes, "application/pdf");
      }
    } catch (err) {
      console.error(`report ${reportId}: PDF copy failed`, err);
    }

    await db
      .update(report)
      .set({
        status: "ready",
        sourceHtml: data.source_html,
        omnesReportId: data.report_id,
        pdfStorageKey,
        errorMessage: null,
      })
      .where(eq(report.id, reportId));
  } catch (err) {
    console.error(`report ${reportId}: generation failed`, err);
    await db
      .update(report)
      .set({
        status: "error",
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .where(eq(report.id, reportId));
  }
}

async function fetchPdf(
  omnesReportId: string,
  pdfUrl: string,
): Promise<Uint8Array | null> {
  const url = pdfUrl.startsWith("http")
    ? pdfUrl
    : `${OMNES_URL}/reports/${omnesReportId}/pdf`;
  const res = await fetch(url, { headers: omnesHeaders() });
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "";
  }
}
