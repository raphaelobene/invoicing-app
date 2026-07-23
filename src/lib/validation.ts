/**
 * HTML inputs send "" for an empty optional field, not undefined. Without
 * this, `z.string().email().optional()` still runs the email check against
 * "" and fails. Wrap optional fields with z.preprocess(emptyToUndefined, ...).
 */
export function emptyToUndefined(value: unknown) {
	return value === "" ? undefined : value
}
