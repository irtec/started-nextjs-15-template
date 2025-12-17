# 🔐 Next.js Secure Template

A modern, **security-hardened Next.js 16 starter** with built-in protections against critical vulnerabilities (CVE-2025-\*). Fork, customize, and start building secure web apps!

## 🛡️ Security Features

### Protected Against CVEs

| CVE            | Name                 | CVSS     | Description                               |
| -------------- | -------------------- | -------- | ----------------------------------------- |
| CVE-2025-55182 | React2Shell          | **10.0** | RCE via RSC deserialization               |
| CVE-2025-29927 | Middleware Bypass    | **9.1**  | Authorization bypass via internal headers |
| CVE-2025-55184 | DoS                  | High     | Infinite loop via malformed RSC requests  |
| CVE-2025-67779 | DoS (Follow-up)      | High     | Follow-up fix for CVE-2025-55184          |
| CVE-2025-55183 | Source Code Exposure | Medium   | Server code leak via RSC                  |

> **Note:** CVE-2025-66478 was rejected as a duplicate of CVE-2025-55182.

### Security Layers

- **Security Proxy** (`/src/proxy.ts`) - Request validation, header blocking, rate limiting
- **Comprehensive Security Headers** - CSP, HSTS, X-Frame-Options, Permissions-Policy
- **Input Validation Utilities** - Zod-based XSS, SQL injection, command injection prevention
- **Image Optimization Security** - Resource exhaustion protection

## ✨ Features

- **⚡ Next.js 16 + TypeScript** - Latest Next.js with full TypeScript support
- **🎨 Tailwind CSS** - Utility-first CSS for rapid styling
- **🛠️ Biome.js** - All-in-one linter and formatter for clean code
- **🚀 Hero UI** - Modern and accessible UI components
- **💎 HugeIcons** - Beautiful and customizable icon set
- **📝 React Hook Form + Zod** - Easy and type-safe form validation
- **🔔 Sonner** - Elegant toast notifications
- **📊 next-nprogress-bar** - Smooth progress bar for route transitions
- **🌗 Dark/Light Mode Toggle** - Built-in theme switcher
- **🐶 Husky & Commitlint** - Enforce Conventional Commits

## 📌 Template Repository

This repository is set up as a **GitHub template repository**. Click **"Use this template"** on GitHub to create a new project based on this starter.

---

## 🚀 Getting Started

The easiest way to start using this template:

```bash
npx create-next-app@latest my-app -e https://github.com/irtec/nextjs-secure-template
```

or

```bash
pnpm create next-app my-app -e https://github.com/irtec/nextjs-secure-template
```

Alternatively, clone the repository and run:

```bash
pnpm install
pnpm dev
```

Then, open [http://localhost:3000](http://localhost:3000) to see it in action.

---

## 🌍 Environment Variables

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

For production, update this to your domain.

---

## 🔒 Security Configuration

### Proxy (`/src/proxy.ts`)

The proxy provides multiple security protections:

1. **Blocked Internal Headers** - Prevents CVE-2025-29927
2. **Rate Limiting** - 100 requests/minute per IP (CVE-2025-55184 mitigation)
3. **CSRF Protection** - Origin validation for state-changing requests
4. **RSC Payload Detection** - Blocks suspicious patterns

Update allowed origins for your production domain:

```typescript
const ALLOWED_ORIGINS = [
  "localhost",
  "127.0.0.1",
  "yourdomain.com", // Add your domain
] as const;
```

Adjust rate limiting if needed:

```typescript
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Requests per window
```

### Input Validation

Use the provided security utilities for all user inputs:

```typescript
import {
  safeString,
  safeEmail,
  createSafeAction,
} from "@/utils/security-validation";

const schema = z.object({
  name: safeString,
  email: safeEmail,
});
```

### Defense in Depth

> ⚠️ **IMPORTANT**: Do NOT rely solely on proxy for authentication. Always validate at the route/action level.

```typescript
// ✅ Correct - Validate in server actions/routes
export async function getSecretData() {
  const session = await verifySession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return fetchData();
}
```

---

## 📦 Tech Stack

| Package      | Version | Security Status |
| ------------ | ------- | --------------- |
| Next.js      | 16.0.10 | ✅ Patched      |
| React        | 19.2.3  | ✅ Patched      |
| TypeScript   | 5.9.2   | ✅ Latest       |
| Tailwind CSS | 4.1.11  | ✅ Latest       |
| Zod          | 4.0.17  | ✅ Latest       |

---

## 🚨 Production Checklist

Before deploying to production:

- [ ] Update Next.js and React to latest patched versions
- [ ] Add production domains to `ALLOWED_ORIGINS` in `proxy.ts`
- [ ] Review and customize CSP headers in `next.config.ts`
- [ ] Replace in-memory rate limiting with Redis for multi-instance deployments
- [ ] Set up monitoring for `[SECURITY]` warnings in logs
- [ ] Implement proper session management
- [ ] Use HTTPS in production
- [ ] Set up WAF to block `x-middleware-subrequest` at edge (if available)

---

## 📖 Next.js 16 Migration Notes

> **Released:** October 21, 2025

### Breaking Changes from Next.js 15

| Change                  | Before (v15)          | After (v16)             | Notes                                |
| ----------------------- | --------------------- | ----------------------- | ------------------------------------ |
| **Request Interceptor** | `middleware.ts`       | `proxy.ts`              | Function: `middleware()` → `proxy()` |
| **Default Bundler**     | Turbopack (dev only)  | Turbopack (dev + build) | 2-5x faster production builds        |
| **Node.js**             | 18.17+                | **20.9+**               | Node 18 deprecated                   |
| **TypeScript**          | 4.7+                  | **5.0+**                | Minimum version increased            |
| **AMP Support**         | Supported             | **Removed**             | No longer available                  |
| **Async Params**        | Sync allowed (legacy) | **Async required**      | `params` must be awaited             |

### New Features in Next.js 16

| Feature                     | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| **Cache Components**        | New `use cache` directive for granular caching control |
| **React Compiler**          | Stable support - automatic memoization                 |
| **Next.js DevTools MCP**    | AI-assisted debugging integration                      |
| **Layout Deduplication**    | Shared layouts downloaded once when prefetching        |
| **Incremental Prefetching** | Only prefetches parts not already in cache             |
| **Build Adapters API**      | Custom adapters for deployment platforms (alpha)       |
| **React 19.2 Features**     | View Transitions, `useEffectEvent()`, `<Activity/>`    |

### `proxy.ts` vs `middleware.ts`

```typescript
// ❌ Before (Next.js 15) - middleware.ts
export function middleware(request: NextRequest) {
  // ...
}

// ✅ After (Next.js 16) - proxy.ts
export function proxy(request: NextRequest) {
  // ...
}
```

**Auto-migration command:**

```bash
npx @next/codemod@canary middleware-to-proxy
```

### Important Notes

1. **Proxy is NOT for Authentication** - Due to CVE-2025-29927, never rely solely on proxy for security. Always validate at route/action level.

2. **Proxy runs on Node.js runtime** - Unlike middleware which ran on Edge Runtime, proxy runs on Node.js for better compatibility.

3. **Single proxy file per project** - Only one `proxy.ts` file is supported. Organize logic into modules and import them.

---

## 🔄 Security Changelog

### December 2025 (v1.0.0)

- ✅ Updated to Next.js 16.0.10 with `proxy.ts` (replaces `middleware.ts`)
- ✅ Added rate limiting (100 req/min per IP)
- ✅ Enhanced RSC payload detection for React2Shell
- ✅ Added CVE-2025-67779 mitigation
- ✅ Blocked additional internal headers (`x-action-id`, `x-action-redirect`)
- ✅ CSRF protection via origin validation for POST/PUT/DELETE/PATCH requests
- ✅ Comprehensive security headers in `next.config.ts`
- ✅ Input validation utilities with Zod

**Last Security Review:** December 18, 2025

---

## 📄 License

MIT License - Feel free to use this template for your projects!
