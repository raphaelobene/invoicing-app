import nodemailer, { type Transporter } from "nodemailer"

import { unexpectedError, validationError, type AppError } from "@/lib/errors"
import { err, ok, type Result } from "@/lib/utils/result"

import { env } from "./env/server"

let cachedTransporter: Transporter | null = null

/**
 * Any SMTP provider works here (Postmark, SendGrid, SES, Gmail, your own
 * mail server) — nodemailer over SMTP rather than a vendor SDK, so
 * switching providers later is an env var change, not a code change.
 * Built lazily and cached, same reasoning as lib/prisma.ts: don't pay the
 * connection-pool setup cost on every import, and don't crash at module
 * load time in environments (tests, `next build`) that never send mail.
 */
function getTransporter(): Transporter {
	if (cachedTransporter) return cachedTransporter

	const host = env.SMTP_HOST
	const port = Number(env.SMTP_PORT ?? 587)
	const user = env.SMTP_USER
	const pass = env.SMTP_PASS

	if (!host || !user || !pass) {
		throw new Error(
			"SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing)."
		)
	}

	cachedTransporter = nodemailer.createTransport({
		host,
		port,
		// env.SMTP_SECURE may be a boolean or a string; accept both true and "true".
		secure: env.SMTP_SECURE === "true" || port === 465,
		auth: { user, pass },
	})
	return cachedTransporter
}

/** Escape text before interpolating it into an HTML email body. */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")
}

export interface SendDocumentEmailInput {
	to: string
	fromName: string
	replyTo?: string
	subject: string
	/** Plain-text body; a matching HTML body is generated from it automatically. */
	bodyText: string
	attachment: { filename: string; content: Buffer }
}

export async function sendDocumentEmail(
	input: SendDocumentEmailInput
): Promise<Result<void, AppError>> {
	// Defense in depth: the service layer already checks the client has an
	// email before calling this, but a helper this side-effecting shouldn't
	// trust its caller alone to have validated the address shape.
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to)) {
		return err(
			validationError("That client doesn't have a valid email address on file.")
		)
	}

	try {
		const transporter = getTransporter()
		const from = env.EMAIL_FROM
			? `"${input.fromName}" <${env.EMAIL_FROM}>`
			: input.fromName

		const htmlBody = input.bodyText
			.split("\n\n")
			.map(
				(paragraph) =>
					`<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`
			)
			.join("\n")

		await transporter.sendMail({
			from,
			to: input.to,
			replyTo: input.replyTo,
			subject: input.subject,
			text: input.bodyText,
			html: htmlBody,
			attachments: [
				{
					filename: input.attachment.filename,
					content: input.attachment.content,
					contentType: "application/pdf",
				},
			],
		})
		return ok(undefined)
	} catch (cause) {
		return err(
			unexpectedError(
				"Couldn't send the email. Check the SMTP configuration.",
				cause
			)
		)
	}
}
