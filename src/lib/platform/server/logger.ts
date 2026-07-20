import "server-only"

import { customAlphabet } from "nanoid"
import pino from "pino"
import pinoPretty from "pino-pretty"

import { env } from "@/lib/env/server"
import type { KebabCase } from "@/lib/utils/shared/kebab-case"
import type { ScreamingSnakeCase } from "@/lib/utils/shared/screaming-snake-case"

/**
 * Simple `nanoid` generator for unique request IDs with the base58 alphabet (no easily confused characters)
 */
const generateId = customAlphabet(
	"abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789",
	22
)

const createPinoLogger = () => {
	const isLocal = !env.VERCEL_ENV
	const isDevelopment = env.VERCEL_ENV
		? ["development", "preview"].includes(env.VERCEL_ENV)
		: true

	// Create pretty stream in development with custom formatting
	const prettyStream = isLocal
		? pinoPretty({
				colorize: true,
				ignore: "pid,hostname",
				translateTime: "SYS:HH:MM:ss.l",
				singleLine: true,
				messageFormat: (log, messageKey, _levelLabel, { colors }) => {
					let message = log[messageKey]

					const scope = log["scope"] as string | undefined
					const topic = log["topic"] as string | undefined

					// Remove scope/topic from log object to avoid duplication
					if ("scope" in log) {
						delete log["scope"]
					}
					if ("topic" in log) {
						delete log["topic"]
					}

					// Logs with scope/topic
					if (scope) {
						let formattedMessage = `(${scope}`
						if (topic) {
							formattedMessage += `:${colors.magenta(topic)}`
						}
						formattedMessage += ")"
						message = `${colors.white(`${formattedMessage}:`)} ${log[messageKey]}`
					}

					return `\b\b ${message}` // prepend "\b\b" to move cursor back and overwrite the ": " added by pino-pretty after the level label
				},
			})
		: undefined

	const pinoLoggerInstance = pino(
		{
			level: isDevelopment ? "debug" : "info",

			// Base fields for all logs
			base: {},

			// Timestamp configuration
			timestamp: pino.stdTimeFunctions.isoTime,

			// Serialize errors properly
			serializers: {
				error: pino.stdSerializers.err,
				req: pino.stdSerializers.req,
				res: pino.stdSerializers.res,
			},

			// Redact common sensitive fields so they never end up in log storage,
			// even if a call site accidentally logs a full object containing them
			// (e.g. an env object, a user record, request headers/cookies).
			// This is a safety net, not a substitute for not logging secrets in
			// the first place - extend this list as new sensitive field names
			// show up in the codebase.
			redact: {
				paths: [
					"*.password",
					"*.token",
					"*.secret",
					"*.apiKey",
					"*.accessToken",
					"*.refreshToken",
					"*.authorization",
					"*.cookie",
					"*.*.password",
					"*.*.token",
					"*.*.secret",
					"req.headers.authorization",
					"req.headers.cookie",
				],
				censor: "[REDACTED]",
			},
		},
		prettyStream
	)

	return pinoLoggerInstance
}

/**
 * Includes additional fields for structured log objects
 */
type LogObject<Scope extends string, Topic extends string> = {
	[key: string]: unknown
	ignore?: string[]
} & (
	| {
			scope: ScreamingSnakeCase<"scope", Scope>
			topic?: KebabCase<"topic", Topic>
	  }
	| {
			scope?: undefined
			topic?: undefined
	  }
)

/**
 * Logger method type with message first
 */
type LoggerMethod = <Scope extends string, Topic extends string>(
	msg: string,
	obj?: LogObject<Scope, Topic>
) => void

/**
 * Child logger instance returned by `Logger.child()`
 */
type ChildLogger = {
	trace: LoggerMethod
	debug: LoggerMethod
	info: LoggerMethod
	warn: LoggerMethod
	error: LoggerMethod
	fatal: LoggerMethod
}

/**
 * Logger interface defining the shape of the server-side logger
 */
type Logger = ChildLogger & {
	child: <Scope extends string, Topic extends string>(
		obj: LogObject<Scope, Topic>
	) => ChildLogger
}

/**
 * Wrap any pino logger instance (root or child) into our message-first
 * `ChildLogger` shape. Shared by both the root `Logger` and `Logger.child()`
 * so the six method wrappers aren't duplicated verbatim in two places.
 */
const wrapPinoInstance = (pinoInstance: pino.Logger): ChildLogger => ({
	trace: (msg, obj) => pinoInstance.trace(obj ?? {}, msg),
	debug: (msg, obj) => pinoInstance.debug(obj ?? {}, msg),
	info: (msg, obj) => pinoInstance.info(obj ?? {}, msg),
	warn: (msg, obj) => pinoInstance.warn(obj ?? {}, msg),
	error: (msg, obj) => pinoInstance.error(obj ?? {}, msg),
	fatal: (msg, obj) => pinoInstance.fatal(obj ?? {}, msg),
})

/**
 * Create and configure the server-side Pino logger instance
 */
const createLogger = (): Logger => {
	// Create the Pino logger instance
	const pinoLoggerInstance = createPinoLogger()

	return {
		...wrapPinoInstance(pinoLoggerInstance),
		child: <Scope extends string, Topic extends string>(
			obj: LogObject<Scope, Topic>
		) => {
			// Copy rather than `Object.assign(obj, ...)` - the caller passed
			// `obj` in and shouldn't see it mutated with a correlationId they
			// never asked to store.
			const childLogger = pinoLoggerInstance.child({
				...obj,
				correlationId: `corr_${generateId()}`,
			})
			return wrapPinoInstance(childLogger)
		},
	}
}

/**
 * Server-side logger instance - use this for all server-side logging
 *
 * Custom wrapper around Pino with message-first format: logger.method(message, dataObject)
 * The message is human-readable, the data object contains structured information
 *
 * @example
 * ```typescript
 * import { Logger } from '~/lib/logging/server/logger';
 *
 * Logger.info('User signed up', { userId: '123', email: 'user@example.com' });
 * Logger.error('Database error', { error: error.message, query: 'SELECT...' });
 * ```
 */
export const Logger = createLogger()
