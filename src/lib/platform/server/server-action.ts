import "server-only"

import {
	ActionBindArgsValidationError,
	ActionMetadataValidationError,
	ActionOutputDataValidationError,
	createSafeActionClient,
} from "next-safe-action"
import { z } from "zod"

import { Logger } from "@/lib/platform/server/logger"
import { kebabCaseSchema, type KebabCase } from "@/lib/utils/shared/kebab-case"

/**
 * Default error message returned to clients when an unexpected server error occurs
 */
const DEFAULT_SERVER_ERROR_MESSAGE =
	"An unexpected error occurred. Please try again later."

/**
 * HTTP error codes used throughout the application for client and server errors
 */
const errorCodes = {
	// 4xx Client Errors
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	PAYMENT_REQUIRED: 402,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	IM_A_TEAPOT: 418,
	CONFLICT: 409,
	GONE: 410,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,

	// 5xx Server Errors
	INTERNAL_SERVER_ERROR: 500,
	NOT_IMPLEMENTED: 501,
	SERVICE_UNAVAILABLE: 503,
} as const

/**
 * Branded type for error codes to ensure type safety
 */
type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes] & {
	_brand: "ErrorCode"
}

/**
 * Exported HTTP status codes for use in error handling and responses
 */
export const ErrorCode = errorCodes as Record<
	keyof typeof errorCodes,
	ErrorCode
>

/**
 * Custom error class for known application errors with enhanced metadata
 *
 * @example
 * ```typescript
 * throw new ServerError('User not found', ErrorCode.NOT_FOUND);
 *
 * throw new ServerError('Invalid data', {
 *   errorCode: ErrorCode.BAD_REQUEST,
 *   context: { field: 'email' }
 * });
 * ```
 */
export class ServerError extends Error {
	readonly code?: string | undefined
	readonly errorCode: ErrorCode
	readonly context?: Record<string, unknown> | undefined

	constructor(message: string, errorCode?: ErrorCode)
	constructor(
		message: string,
		options?: {
			errorCode?: ErrorCode
			context?: Record<string, unknown>
		}
	)
	constructor(
		errorMessage: string,
		optionsOrErrorCode?:
			{ errorCode?: ErrorCode; context?: Record<string, unknown> } | ErrorCode
	) {
		super(errorMessage)
		this.name = "ServerError"
		this.errorCode =
			(typeof optionsOrErrorCode === "object"
				? optionsOrErrorCode.errorCode
				: optionsOrErrorCode) ?? (500 as ErrorCode)
		this.code = Object.entries(errorCodes).find(
			([_, value]) => value === this.errorCode
		)?.[0]
		this.context =
			typeof optionsOrErrorCode === "object"
				? optionsOrErrorCode.context
				: undefined

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ServerError)
		}
	}
}

/**
 * Zod schema for validating action metadata
 */
const metadataSchema = z.object({
	name: kebabCaseSchema(),
})

/**
 * Type for action metadata with kebab-case validation on the action name
 *
 * @template T - String literal type for the action name
 */
type ActionMetadata<T extends string> = {
	name: KebabCase<"name", T>
} & Omit<z.infer<typeof metadataSchema>, "name">

/**
 * Creates a configured server action client with logging, error handling, and execution tracking
 *
 * Features:
 * - Automatic request ID generation and logging
 * - Comprehensive error handling with structured logging
 * - Execution time tracking
 * - Validation error formatting
 * - Context injection (requestId, logger)
 *
 * @template T - String literal type for the action name (must be kebab-case)
 * @param metadata - Configuration object containing the action name
 * @returns A configured safe action client instance
 *
 * @example
 * ```typescript
 * export const myAction = ServerAction.create({ name: 'my-action' })
 *   .inputSchema(z.object({ email: z.string().email() }))
 *   .action(async ({ parsedInput, ctx }) => {
 *     ctx.logger.info('Processing action');
 *     return { success: true };
 *   });
 * ```
 */
const createServerAction = <T extends string>(metadata: ActionMetadata<T>) =>
	createSafeActionClient({
		defineMetadataSchema: () => metadataSchema,
		handleServerError: (e, utils) => {
			const { clientInput, ctx } = utils

			// `next-safe-action` types `ctx` as `unknown` at this point in the
			// config because the middleware that injects `logger` (see `.use()`
			// below) isn't known yet when `handleServerError` is defined. A cast
			// is unavoidable here, but casting to a real interface - instead of
			// `any` - keeps the expected shape documented and typo-checked
			// wherever `actionLogger` is used below.
			type ActionErrorContext = {
				logger?: ReturnType<(typeof Logger)["child"]>
			}
			const actionLogger =
				(ctx as ActionErrorContext).logger ??
				Logger.child({ scope: "SERVER_ACTION", topic: metadata.name as string })

			// Default to error logging and generic client message
			let logMethod = actionLogger.error
			let clientMessage = DEFAULT_SERVER_ERROR_MESSAGE
			let serverMessage = "Caught an unknown server error!"
			// NOTE: clientInput is logged wholesale here. The logger's `redact`
			// config catches common field names (password, token, secret, ...),
			// but action-specific sensitive fields with other names won't be
			// caught automatically. If a given action's input can carry
			// something sensitive under a non-standard key, scrub it before it
			// reaches this handler or add that key to the logger's redact paths.
			const data = {
				errorType: e.constructor.name,
				clientInput:
					typeof clientInput === "object" ? clientInput : { raw: clientInput },
				stack: e.stack,
			} as Record<string, unknown>

			if (e instanceof ServerError) {
				// Known server error - log as debug and return the message to the client
				logMethod = actionLogger.debug
				serverMessage = `Caught a known server error: ${e.message}`
				clientMessage = e.message
				Object.assign(data, {
					errorCode: e.errorCode,
					errorCodeName: e.code,
					context: e.context,
				})
			} else if (
				e instanceof ActionMetadataValidationError ||
				e instanceof ActionOutputDataValidationError ||
				e instanceof ActionBindArgsValidationError
			) {
				// Validation errors due to developer ignoring types - log as error, should only happen during development
				serverMessage = e.message
				Object.assign(data, {
					errorCause: e.cause,
					errorValidationErrors: e.validationErrors,
				})
			} else {
				// Unknown error - log as error with message, but return default message to client
				Object.assign(data, {
					errorMessage: e.message,
				})
			}

			logMethod(serverMessage, data)
			return clientMessage
		},
		defaultValidationErrorsShape: "flattened",
	})
		.metadata(metadata as z.infer<typeof metadataSchema>)
		.use(({ next }) => {
			const actionLogger = Logger.child({
				scope: "SERVER_ACTION",
				topic: metadata.name as string,
			})
			return next({
				ctx: { logger: actionLogger },
			})
		})
		.use(async ({ ctx: { logger }, next, clientInput }) => {
			const startTime = Date.now()

			logger.info("Starting execution!", {
				clientInput:
					typeof clientInput === "object" ? clientInput : { raw: clientInput },
			})

			try {
				const result = await next()
				const executionDuration = Date.now() - startTime

				if (result.success) {
					logger.info("Completed successfully!", {
						data: result.data,
						executionDuration,
					})
				} else if (result.validationErrors) {
					logger.error("Completed with validation errors!", {
						validationErrors: result.validationErrors,
						executionDuration,
					})
				} else if (result.serverError) {
					if (result.serverError === DEFAULT_SERVER_ERROR_MESSAGE) {
						logger.error("Completed with an unknown server error!", {
							executionDuration,
						})
					} else {
						logger.warn("Completed with a known server error!", {
							serverError: result.serverError,
							executionDuration,
						})
					}
				}

				return result
			} catch (error) {
				const executionDuration = Date.now() - startTime
				logger.error("Failed with an exception!", {
					executionDuration,
				})
				throw error
			}
		})

/**
 * ServerAction namespace for creating type safe server actions with built-in logging and error handling
 */
export const ServerAction = {
	create: createServerAction,
}
