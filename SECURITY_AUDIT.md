# Security Audit Report

**Date:** 2026-03-05
**Scope:** Full codebase — Go backend API, JavaScript frontend, build configuration

---

## Summary

Audited the Tetris with Scoreboard application for security vulnerabilities. Found **13 issues** across backend and frontend. **9 issues fixed**, 4 noted as advisories.

---

## Critical Issues (Fixed)

### 1. Denial of Service via `log.Fatal` in HTTP Handlers
**Severity:** CRITICAL
**Location:** `cmd/api/main.go` (multiple handlers)
**Description:** `log.Fatal()` was called inside request handlers on JSON marshal/write errors. `log.Fatal` calls `os.Exit(1)`, which terminates the entire server process. A malformed request or disk error could crash the server.
**Fix:** Replaced all `log.Fatal()` calls in handlers with `http.Error()` responses + `log.Printf()` for logging.

### 2. Missing Return After Method Check
**Severity:** CRITICAL
**Location:** `cmd/api/main.go:53-55` (original)
**Description:** After checking for non-GET/non-POST methods, the handler lacked a `return` statement. This allowed execution to fall through and process the request regardless of HTTP method.
**Fix:** Added `return` after the method check and changed status to `405 Method Not Allowed`.

### 3. No Request Body Size Limit
**Severity:** HIGH
**Location:** `cmd/api/main.go` — POST `/record/`
**Description:** No limit on request body size. An attacker could send a multi-gigabyte payload to exhaust server memory.
**Fix:** Added `http.MaxBytesReader(w, r.Body, 1024)` — limits POST body to 1KB.

---

## High Issues (Fixed)

### 4. Race Condition on File Access
**Severity:** HIGH
**Location:** `cmd/api/main.go` — all record handlers
**Description:** Multiple concurrent requests could read/write `record.json` simultaneously, causing data corruption or loss (read-modify-write without locking).
**Fix:** Added `sync.Mutex` (`fileMu`) protecting all file operations.

### 5. Array Index Out of Bounds Panic
**Severity:** HIGH
**Location:** `cmd/api/main.go:210-213` (original)
**Description:** URL parsing with `strings.Split` assumed exactly 3 path segments. Malformed URLs (e.g., `/record/`) could cause an index-out-of-bounds panic, crashing the server.
**Fix:** Added bounds checking on URL slice length before accessing elements. Invalid IDs return `400 Bad Request`.

### 6. Unbounded File Growth
**Severity:** HIGH
**Location:** `cmd/api/main.go` — POST handler
**Description:** Records were appended without limit, allowing `record.json` to grow indefinitely. Disk exhaustion or memory issues could result.
**Fix:** Added `maxRecords = 10000` limit. Returns `409 Conflict` when limit is reached.

---

## Medium Issues (Fixed)

### 7. Error Information Disclosure
**Severity:** MEDIUM
**Location:** `cmd/api/main.go:118` (original)
**Description:** Internal error details from `strconv.Atoi` were included in HTTP error responses (e.g., `"Invalid ID format: strconv.Atoi: parsing \"abc\": invalid syntax"`). This leaks implementation details.
**Fix:** Error responses now return generic messages. Details are logged server-side only.

### 8. Missing Input Validation
**Severity:** MEDIUM
**Location:** `cmd/api/main.go` — POST handler
**Description:** Score and time fields were accepted without validation. Player names had no length limit. Attackers could submit arbitrary data.
**Fix:** Added `validateScore()` (must be non-negative integer), `validateTime()` (must match `MM:SS`), and `sanitizeName()` (trims whitespace, enforces 50-char limit).

### 9. XSS Vector via innerHTML
**Severity:** MEDIUM
**Location:** `assets/index.js:58`
**Description:** Used `innerHTML` to set game instructions content. While currently using hardcoded strings (not exploitable), this is an unsafe pattern that could become exploitable if dynamic content is added later.
**Fix:** Replaced `innerHTML` with DOM API calls using `document.createElement()` and `textContent`.

---

## Low Issues (Fixed)

### 10. Missing File Handle Close
**Severity:** LOW
**Location:** `cmd/api/main.go:64` (original) — GET handler
**Description:** File opened with `os.OpenFile` was never closed, leaking file descriptors on each GET request.
**Fix:** Added `defer f.Close()` after all file opens.

### 11. Silently Ignored Unmarshal Errors
**Severity:** LOW
**Location:** `cmd/api/main.go:45` (original)
**Description:** `json.Unmarshal` errors were silently discarded. Corrupted `record.json` would result in empty data without any indication of error.
**Fix:** `getJsonData()` now returns errors which are handled by callers.

---

## Advisories (Not Fixed — Design-Level Issues)

### A1. Client-Side Score Submission (Score Tampering)
**Severity:** MEDIUM
**Description:** Score, time, and ID values are generated and submitted entirely client-side. Players can trivially fake scores using browser dev tools or curl. The backend has no way to verify legitimacy.
**Recommendation:** Implement server-side game session management with server-validated scoring, or accept this as a known limitation for a casual game.

### A2. No Rate Limiting
**Severity:** MEDIUM
**Description:** No rate limiting on any endpoint. An attacker could spam the POST endpoint to fill `record.json` (now capped at 10K records, but still abusable).
**Recommendation:** Add rate limiting middleware (e.g., per-IP token bucket).

### A3. No CORS Configuration
**Severity:** LOW
**Description:** The `rs/cors` package is imported in `go.mod` but not used in the server code. Any origin can make cross-origin requests to the API.
**Recommendation:** Configure CORS with an allowlist of permitted origins if the API should only be called from specific domains.

### A4. Outdated Go Version
**Severity:** LOW
**Description:** `go.mod` specifies Go 1.17, which is end-of-life and missing security patches for the Go runtime and standard library.
**Recommendation:** Upgrade to a supported Go version (1.22+).
