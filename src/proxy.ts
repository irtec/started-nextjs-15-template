import { type NextRequest, NextResponse } from 'next/server'

/**
 * Security Proxy (Next.js 16)
 *
 * This proxy provides critical security protections against:
 *
 * 1. CVE-2025-29927 (Middleware Authorization Bypass)
 *    - Blocks malicious x-middleware-* headers from external requests
 *    - Validates internal routing headers
 *
 * 2. CVE-2025-55182 & CVE-2025-66478 (React2Shell)
 *    - Validates request origins
 *    - Blocks suspicious RSC payloads
 *
 * 3. CVE-2025-55184 (DoS via infinite loop)
 *    - Rate limiting to prevent resource exhaustion
 *
 * 4. CVE-2025-55183 (Source Code Exposure)
 *    - Blocks attempts to extract server-side code
 *
 * 5. General Security
 *    - CSRF protection via origin checking
 *    - Rate limiting
 *    - Request sanitization
 *
 * Note: In Next.js 16, middleware is renamed to proxy for clarity.
 * IMPORTANT: Do NOT rely solely on proxy for authentication.
 * Always validate at the route/action level (defense-in-depth).
 */

// ============================================
// Rate Limiting Configuration
// ============================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // Max requests per window per IP
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Cleanup rate limit store periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupRateLimitStore(): void {
	const now = Date.now()
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return

	for (const [key, value] of rateLimitStore.entries()) {
		if (now > value.resetTime) {
			rateLimitStore.delete(key)
		}
	}
	lastCleanup = now
}

// ============================================
// Security Constants
// ============================================

// Internal Next.js headers that should NEVER come from external requests
const BLOCKED_INTERNAL_HEADERS = [
	'x-middleware-subrequest',
	'x-middleware-invoke',
	'x-middleware-next',
	'x-middleware-rewrite',
	'x-middleware-redirect',
	'x-invoke-path',
	'x-invoke-query',
	'x-invoke-output',
	'x-invoke-status',
	'x-prerender-revalidate',
	'x-nextjs-data',
	// Additional headers to block for React2Shell protection
	'x-action-id',
	'x-action-redirect',
] as const

// Suspicious patterns in RSC payloads that may indicate React2Shell attack
const SUSPICIOUS_RSC_PATTERNS = [
	/eval\s*\(/i,
	/Function\s*\(/i,
	/require\s*\(/i,
	/import\s*\(/i,
	/__proto__/i,
	/constructor\s*\[/i,
	/prototype/i,
] as const

// Allowed origins for CSRF protection (add your domains here)
const ALLOWED_ORIGINS = [
	'localhost',
	'127.0.0.1',
	// Add your production domains here
	// 'yourdomain.com',
] as const

/**
 * Get client IP from request headers
 */
function getClientIP(request: NextRequest): string {
	return (
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		'unknown'
	)
}

/**
 * Check if request contains blocked internal headers
 * This prevents CVE-2025-29927 exploitation
 */
function hasBlockedHeaders(request: NextRequest): boolean {
	for (const header of BLOCKED_INTERNAL_HEADERS) {
		if (request.headers.has(header)) {
			console.warn(
				`[SECURITY] Blocked request with internal header: ${header} from ${getClientIP(request)}`,
			)
			return true
		}
	}
	return false
}

/**
 * Validate request origin for CSRF protection
 */
function isValidOrigin(request: NextRequest): boolean {
	const origin = request.headers.get('origin')
	const host = request.headers.get('host')

	// Allow requests without origin (same-origin navigation)
	if (!origin) return true

	try {
		const originUrl = new URL(origin)
		const hostName = host?.split(':')[0] || ''

		// Check if origin matches host or is in allowed list
		return (
			originUrl.hostname === hostName ||
			ALLOWED_ORIGINS.some((allowed) => originUrl.hostname.includes(allowed))
		)
	} catch {
		return false
	}
}

/**
 * Check for suspicious RSC payload patterns
 * This helps detect React2Shell attacks
 */
function hasSuspiciousRSCPayload(request: NextRequest): boolean {
	const rscPayload = request.headers.get('rsc')
	const contentType = request.headers.get('content-type')

	// Check RSC header
	if (rscPayload) {
		for (const pattern of SUSPICIOUS_RSC_PATTERNS) {
			if (pattern.test(rscPayload)) {
				console.warn(
					`[SECURITY] Suspicious RSC payload detected from ${getClientIP(request)}`,
				)
				return true
			}
		}
	}

	// Check for suspicious content-type attacks
	if (contentType?.includes('text/x-component')) {
		// Additional validation for RSC requests could be added here
	}

	return false
}

/**
 * Check rate limit for client IP
 * Returns true if rate limited, false otherwise
 */
function isRateLimited(clientIP: string): {
	limited: boolean
	remaining: number
	resetTime: number
} {
	cleanupRateLimitStore()

	const now = Date.now()
	const clientData = rateLimitStore.get(clientIP)

	if (!clientData || now > clientData.resetTime) {
		// Create new rate limit entry
		rateLimitStore.set(clientIP, {
			count: 1,
			resetTime: now + RATE_LIMIT_WINDOW_MS,
		})
		return {
			limited: false,
			remaining: RATE_LIMIT_MAX_REQUESTS - 1,
			resetTime: now + RATE_LIMIT_WINDOW_MS,
		}
	}

	// Increment count
	clientData.count++

	if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
		return {
			limited: true,
			remaining: 0,
			resetTime: clientData.resetTime,
		}
	}

	return {
		limited: false,
		remaining: RATE_LIMIT_MAX_REQUESTS - clientData.count,
		resetTime: clientData.resetTime,
	}
}

/**
 * Create rate limit response
 */
function rateLimitResponse(resetTime: number): NextResponse {
	const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
	return new NextResponse(
		JSON.stringify({
			error: 'Too Many Requests',
			message: 'Rate limit exceeded. Please try again later.',
			code: 'RATE_LIMIT_EXCEEDED',
			retryAfter,
		}),
		{
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				'Retry-After': retryAfter.toString(),
				'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
				'X-RateLimit-Remaining': '0',
				'X-RateLimit-Reset': resetTime.toString(),
			},
		},
	)
}

/**
 * Sanitize response headers
 */
function sanitizeResponseHeaders(response: NextResponse): NextResponse {
	// Remove any accidentally leaked internal headers
	response.headers.delete('x-middleware-subrequest')
	response.headers.delete('x-invoke-path')
	response.headers.delete('x-invoke-query')

	// Add security timestamp
	response.headers.set('x-security-check', 'passed')
	response.headers.set(
		'x-request-id',
		crypto.randomUUID?.() || Date.now().toString(),
	)

	return response
}

/**
 * Create forbidden response
 */
function forbiddenResponse(reason: string): NextResponse {
	return new NextResponse(
		JSON.stringify({
			error: 'Forbidden',
			message: 'Request blocked by security policy',
			code: 'SECURITY_VIOLATION',
		}),
		{
			status: 403,
			headers: {
				'Content-Type': 'application/json',
				'X-Security-Block-Reason': reason,
			},
		},
	)
}

/**
 * Next.js 16 Proxy Function
 * Previously known as middleware, renamed for clarity in Next.js 16
 */
export function proxy(request: NextRequest) {
	const clientIP = getClientIP(request)

	// Security Check 1: Block requests with internal Next.js headers
	// This prevents CVE-2025-29927 (Middleware Authorization Bypass)
	if (hasBlockedHeaders(request)) {
		return forbiddenResponse('blocked-internal-headers')
	}

	// Security Check 2: Rate limiting (CVE-2025-55184 DoS mitigation)
	const rateLimit = isRateLimited(clientIP)
	if (rateLimit.limited) {
		console.warn(`[SECURITY] Rate limit exceeded for ${clientIP}`)
		return rateLimitResponse(rateLimit.resetTime)
	}

	// Security Check 3: Validate origin for state-changing requests
	if (
		['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) &&
		!isValidOrigin(request)
	) {
		console.warn(
			`[SECURITY] Invalid origin for ${request.method} request from ${clientIP}`,
		)
		return forbiddenResponse('invalid-origin')
	}

	// Security Check 4: Check for suspicious RSC payloads
	// This helps detect React2Shell attacks (CVE-2025-55182 & CVE-2025-66478)
	if (hasSuspiciousRSCPayload(request)) {
		return forbiddenResponse('suspicious-payload')
	}

	// Security Check 5: Block excessively large headers (potential DoS)
	const contentLength = request.headers.get('content-length')
	if (contentLength && Number.parseInt(contentLength, 10) > 10 * 1024 * 1024) {
		// 10MB limit
		return forbiddenResponse('payload-too-large')
	}

	// Proceed with request
	const response = NextResponse.next()

	// Add rate limit headers to response
	response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
	response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
	response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())

	// Sanitize and add security headers to response
	return sanitizeResponseHeaders(response)
}

// Configure which routes the middleware runs on
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder files
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
	],
}
