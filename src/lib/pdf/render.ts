import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import type { ReactElement } from "react"

export interface GeneratedPdf {
	buffer: Buffer
	filename: string
}

/**
 * Thin wrapper so route handlers and the email sender both go through one
 * place. @react-pdf/renderer's types describe its output as Node's Buffer;
 * that's already exactly what NextResponse and nodemailer attachments want.
 */
export async function renderPdfBuffer(document: ReactElement<DocumentProps>): Promise<Buffer> {
	return renderToBuffer(document)
}

/** Best-effort filename-safe slug, e.g. "INV-0001" -> "INV-0001". */
export function pdfFileName(kind: "invoice" | "quote" | "receipt", number: string): string {
	const safeNumber = number.replace(/[^a-zA-Z0-9-_]/g, "_")
	return `${kind}-${safeNumber}.pdf`
}
