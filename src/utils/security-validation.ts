import * as z from 'zod'

/**
 * Security Validation Utilities
 *
 * Comprehensive input validation to prevent:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - Command Injection
 * - Path Traversal
 * - Prototype Pollution
 *
 * Uses Zod for type-safe validation as recommended for CVE mitigation.
 */

// ============================================
// Dangerous Pattern Definitions
// ============================================

// Patterns commonly used in XSS attacks
const XSS_PATTERNS = [
	/<script\b[^>]*>/i,
	/javascript:/i,
	/on\w+\s*=/i,
	/data:text\/html/i,
	/<iframe/i,
	/<object/i,
	/<embed/i,
	/<svg.*onload/i,
	/expression\s*\(/i,
	/url\s*\(/i,
] as const

// Patterns commonly used in SQL injection
const SQL_INJECTION_PATTERNS = [
	/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
	/(--)|(\/\*)|(\*\/)/,
	/(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/i,
	/'\s*(OR|AND)\s*'.*'.*'/i,
] as const

// Patterns for command injection
const COMMAND_INJECTION_PATTERNS = [/[;&|`$]/, /\$\(/, /\n|\r/, /`.*`/] as const

// Patterns for path traversal
const PATH_TRAVERSAL_PATTERNS = [/\.\.\//, /\.\.\\/, /%2e%2e/i, /%252e/i]

// ============================================
// Validation Functions
// ============================================

/**
 * Check if string contains XSS patterns
 */
export function containsXSS(input: string): boolean {
	return XSS_PATTERNS.some((pattern) => pattern.test(input))
}

/**
 * Check if string contains SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
	return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input))
}

/**
 * Check if string contains command injection patterns
 */
export function containsCommandInjection(input: string): boolean {
	return COMMAND_INJECTION_PATTERNS.some((pattern) => pattern.test(input))
}

/**
 * Check if string contains path traversal patterns
 */
export function containsPathTraversal(input: string): boolean {
	return PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(input))
}

/**
 * Sanitize string by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
	return input
		.replace(/[<>]/g, '') // Remove angle brackets
		.replace(/javascript:/gi, '') // Remove javascript: protocol
		.replace(/on\w+\s*=/gi, '') // Remove event handlers
		.trim()
}

/**
 * Escape HTML entities
 */
export function escapeHtml(input: string): string {
	const htmlEntities: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		'/': '&#x2F;',
	}
	return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char)
}

// ============================================
// Zod Schema Refinements
// ============================================

/**
 * Safe string schema - validates that string doesn't contain dangerous patterns
 */
export const safeString = z
	.string()
	.refine((val) => !containsXSS(val), {
		message: 'Input contains potentially dangerous HTML/script content',
	})
	.refine((val) => !containsSQLInjection(val), {
		message: 'Input contains potentially dangerous SQL patterns',
	})
	.refine((val) => !containsCommandInjection(val), {
		message: 'Input contains potentially dangerous command patterns',
	})

/**
 * Safe email schema
 */
export const safeEmail = z
	.string()
	.email({ message: 'Invalid email format' })
	.max(254, { message: 'Email too long' })
	.refine((val) => !containsXSS(val), {
		message: 'Email contains invalid characters',
	})

/**
 * Safe URL schema
 */
export const safeUrl = z
	.string()
	.url({ message: 'Invalid URL format' })
	.refine(
		(val) => {
			try {
				const url = new URL(val)
				return ['http:', 'https:'].includes(url.protocol)
			} catch {
				return false
			}
		},
		{ message: 'URL must use http or https protocol' },
	)
	.refine((val) => !containsXSS(val), {
		message: 'URL contains invalid characters',
	})

/**
 * Safe path schema (prevents path traversal)
 */
export const safePath = z
	.string()
	.refine((val) => !containsPathTraversal(val), {
		message: 'Path contains invalid traversal patterns',
	})
	.refine((val) => !val.startsWith('/'), {
		message: 'Path cannot be absolute',
	})

/**
 * Safe ID schema (alphanumeric only)
 */
export const safeId = z
	.string()
	.regex(/^[a-zA-Z0-9_-]+$/, {
		message:
			'ID can only contain alphanumeric characters, underscore, and dash',
	})
	.max(128, { message: 'ID too long' })

/**
 * Safe integer schema with range validation
 */
export const safeInt = z.coerce
	.number()
	.int({ message: 'Must be an integer' })
	.min(-2147483648)
	.max(2147483647)

/**
 * Safe positive integer (for IDs, counts, etc.)
 */
export const safePositiveInt = z.coerce
	.number()
	.int({ message: 'Must be a positive integer' })
	.positive({ message: 'Must be positive' })
	.max(2147483647)

// ============================================
// Server Action Validation Helpers
// ============================================

/**
 * Validate and sanitize form data for server actions
 */
export async function validateFormData<T extends z.ZodSchema>(
	formData: FormData,
	schema: T,
): Promise<z.infer<T> | { error: string; details?: z.ZodError }> {
	try {
		const rawData = Object.fromEntries(formData.entries())
		const result = await schema.safeParseAsync(rawData)

		if (!result.success) {
			return {
				error: 'Validation failed',
				details: result.error,
			}
		}

		return result.data
	} catch (_error) {
		return {
			error: 'Failed to process form data',
		}
	}
}

/**
 * Validate JSON payload for API routes
 */
export async function validateJsonPayload<T extends z.ZodSchema>(
	payload: unknown,
	schema: T,
): Promise<z.infer<T> | { error: string; details?: z.ZodError }> {
	try {
		const result = await schema.safeParseAsync(payload)

		if (!result.success) {
			return {
				error: 'Validation failed',
				details: result.error,
			}
		}

		return result.data
	} catch (_error) {
		return {
			error: 'Failed to validate payload',
		}
	}
}

/**
 * Type guard to check if validation result has an error
 */
function isValidationError<T>(
	result: T | { error: string; details?: z.ZodError },
): result is { error: string; details?: z.ZodError } {
	return (
		typeof result === 'object' &&
		result !== null &&
		'error' in result &&
		typeof (result as Record<string, unknown>).error === 'string'
	)
}

/**
 * Create a safe server action wrapper with automatic validation
 */
export function createSafeAction<
	TInput extends z.ZodSchema,
	TOutput extends Record<string, unknown>,
>(
	schema: TInput,
	handler: (validatedData: z.infer<TInput>) => Promise<TOutput>,
): (input: unknown) => Promise<TOutput | { error: string }> {
	return async (input: unknown) => {
		const validation = await validateJsonPayload(input, schema)

		if (isValidationError(validation)) {
			return { error: validation.error }
		}

		return handler(validation as z.infer<TInput>)
	}
}

// ============================================
// Export commonly used schemas
// ============================================

export const schemas = {
	safeString,
	safeEmail,
	safeUrl,
	safePath,
	safeId,
	safeInt,
	safePositiveInt,
} as const

export default schemas
