# ShoutHub Security Fixes — Bugfix Design

## Overview

ShoutHub has 11 confirmed security bugs across its Node.js backend. The bugs fall into five
categories: hardcoded secrets, missing credential hygiene (weak hashing, no token expiry,
duplicate accounts), absent `.gitignore`, wrong HTTP status codes, and stale project
metadata/naming. No single function owns all defects — changes span
`midddlewere/auth.middlewere.js`, `routes/note.route.js`, `routes/user.route.js`,
`server.js`, `package.json`, `.env`, and the filesystem folder name itself.

The fix strategy is **surgical and minimal**: replace literals with environment reads, add one
uniqueness guard, correct status codes, rename the directory and its references, consolidate
the duplicated token-verification logic into the shared middleware, and add the missing
`.gitignore`. No business logic changes — every existing happy-path flow must continue to work
identically after the fix.

---

## Glossary

- **Bug_Condition (C)**: A predicate over source code or runtime state that evaluates to `true`
  when a defect is present (e.g., a JWT secret is a hardcoded literal, a status code is 200
  when it should be 4xx).
- **Property (P)**: The required postcondition for inputs where C holds — the behavior the
  fixed code must produce.
- **Preservation**: For inputs where C does NOT hold, the fixed code must produce exactly the
  same observable result as the original code.
- **`auth` middleware**: The Express middleware exported from
  `midddlewere/auth.middlewere.js` (pre-fix) / `middleware/auth.middleware.js` (post-fix).
- **`verifyToken`**: The private function currently defined inside `routes/note.route.js` that
  duplicates the shared middleware logic.
- **`noteRouter`**: The Express router exported from `routes/note.route.js`, handling all
  `/notes` CRUD operations.
- **`userRouter`**: The Express router exported from `routes/user.route.js`, handling
  `/user/register` and `/user/login`.
- **`SECRET_KEY`**: The AES-256-CBC encryption key used in `encrypt`/`decrypt` inside
  `note.route.js`, currently hardcoded as `"shouthub_notes_key_2024"`.
- **`saltRounds`**: The bcrypt work factor passed to `bcrypt.hash`; currently `5`.

---

## Bug Details

### Bug Condition

The 11 bugs activate under distinct, non-overlapping conditions. Each has its own formal
specification below.

**Formal Specifications:**

```
FUNCTION isBugCondition_HardcodedJwtSecret(X)
  INPUT: X = AST node of a jwt.verify or jwt.sign call
  OUTPUT: boolean
  RETURN second argument of X is the string literal "coding"
END FUNCTION

FUNCTION isBugCondition_HardcodedEncryptionKey(X)
  INPUT: X = top-level variable declaration in note.route.js
  OUTPUT: boolean
  RETURN X declares SECRET_KEY with the string literal "shouthub_notes_key_2024"
END FUNCTION

FUNCTION isBugCondition_NoTokenExpiry(X)
  INPUT: X = options object passed to jwt.sign
  OUTPUT: boolean
  RETURN X does NOT contain an expiresIn field
END FUNCTION

FUNCTION isBugCondition_WeakSaltRounds(X)
  INPUT: X = numeric argument to bcrypt.hash
  OUTPUT: boolean
  RETURN X < 10
END FUNCTION

FUNCTION isBugCondition_DuplicateEmailAllowed(X)
  INPUT: X = HTTP POST /user/register request with { email }
  OUTPUT: boolean
  RETURN userModel.countDocuments({ email: X.body.email }) > 0
         AND handler does NOT reject before saving
END FUNCTION

FUNCTION isBugCondition_MissingGitignore(X)
  INPUT: X = project root directory
  OUTPUT: boolean
  RETURN .gitignore does not exist
         OR .gitignore does not contain ".env"
         OR .gitignore does not contain "node_modules"
END FUNCTION

FUNCTION isBugCondition_WrongStatusCode(X)
  INPUT: X = error response from userRouter handler
  OUTPUT: boolean
  RETURN X.httpStatusCode = 200 AND X.body signals an error condition
END FUNCTION

FUNCTION isBugCondition_MissingReqUserId(X)
  INPUT: X = execution of the shared auth middleware after jwt.verify succeeds
  OUTPUT: boolean
  RETURN req.userId is NOT set after X completes
END FUNCTION

FUNCTION isBugCondition_DuplicateVerifyToken(X)
  INPUT: X = route handler in note.route.js
  OUTPUT: boolean
  RETURN X uses private verifyToken instead of imported shared auth middleware
END FUNCTION

FUNCTION isBugCondition_BadPackageMetadata(X)
  INPUT: X = package.json parsed object
  OUTPUT: boolean
  RETURN X.name = "index14" OR X.main = "index14.js"
END FUNCTION

FUNCTION isBugCondition_TypoFolderName(X)
  INPUT: X = filesystem path of the middleware directory
  OUTPUT: boolean
  RETURN X ends with "midddlewere"
END FUNCTION
```

### Examples

| Bug | Trigger | Current (broken) behavior | Expected (fixed) behavior |
|-----|---------|--------------------------|--------------------------|
| Hardcoded JWT secret | Any `jwt.sign` or `jwt.verify` call | Uses literal `"coding"` | Uses `process.env.JWT_SECRET` |
| Hardcoded encryption key | Any `encrypt` / `decrypt` call | Uses literal `"shouthub_notes_key_2024"` | Uses `process.env.NOTE_ENCRYPTION_KEY` |
| No token expiry | Successful login | Token has no `exp` claim | Token expires after `"7d"` |
| Weak salt rounds | New user registers | Password hashed with 5 rounds | Password hashed with 10 rounds |
| Duplicate email | Register with existing email | Second user record created, 200 returned | 409 returned, no duplicate saved |
| Missing `.gitignore` | `git add .` in project root | `.env` and `node_modules` committed | Both excluded by `.gitignore` |
| Wrong status 200 on error | Login with wrong password | `{ msg: "wrong credientials" }` with HTTP 200 | `{ msg: "..." }` with HTTP 401 |
| Missing `req.userId` | Valid JWT hits shared middleware | `req.userId` undefined downstream | `req.userId` set from decoded token |
| Duplicate `verifyToken` | Any `/notes` request | Private copy in `note.route.js` used | Shared middleware imported and used |
| Bad `package.json` metadata | Tooling reads `package.json` | `name: "index14"`, `main: "index14.js"` | `name: "shouthub"`, `main: "server.js"` |
| Typo folder name | Any import of auth middleware | Path `midddlewere/auth.middlewere` | Path `middleware/auth.middleware` |

---

## Expected Behavior

### Preservation Requirements

**Unchanged behaviors that must survive the fix:**

- A valid JWT presented to any protected route continues to grant access.
- A registered user with correct credentials continues to receive a JWT, their name, and their
  user ID in the login response.
- Authenticated `POST /notes` continues to encrypt content before persisting and returns
  plaintext content in the response.
- Authenticated `GET /notes` continues to decrypt content before returning it.
- Authenticated `PUT /notes/:id` continues to encrypt new content and returns plaintext.
- Authenticated `DELETE /notes/:id` continues to remove only that user's note.
- CORS continues to block origins not in `ALLOWED_ORIGINS`.
- Server continues to connect to MongoDB on startup and log connection status.
- `render.yaml` environment variable references remain unchanged.
- Requests without a JWT continue to be rejected before reaching protected handlers.

**Scope:**
All inputs that do NOT satisfy any `isBugCondition_*` function must produce output identical to
the original code after the fix. This includes valid authenticated requests, correct-credential
logins, all note CRUD operations, and CORS handling.

---

## Hypothesized Root Cause

The bugs share a common root cause pattern: the application was developed to a "working demo"
standard without a production hardening pass.

1. **Copy-paste secret literals**: `"coding"` appears in three separate files
   (`auth.middlewere.js`, `user.route.js`, `note.route.js`). The developer set a placeholder
   during initial development and never replaced it with an environment variable.

2. **Incomplete middleware wiring**: The shared `auth` middleware was written but wired to
   `app.use(auth)` after the note routes were already registered, so `/notes` is never guarded
   by it. The developer instead wrote a parallel `verifyToken` inside `note.route.js` and
   forgot to remove it when wiring should have been fixed.

3. **Missing `req.userId` assignment in shared middleware**: The shared middleware calls
   `jwt.verify` but discards the decoded payload — `next()` is called without storing
   `decoded.userId` on `req`. This means any handler that depends on `req.userId` from the
   shared middleware would fail silently.

4. **Default error handling pattern**: All error branches use `res.send({ msg: "..." })` which
   defaults to HTTP 200. The developer never switched to `res.status(N).send(...)` for the
   error paths.

5. **No uniqueness guard on registration**: The `userModel` schema may not enforce email
   uniqueness at the database level, and the route handler never queries for an existing user
   before inserting — the simplest path was taken during initial development.

6. **Weak bcrypt configuration**: Salt rounds of 5 is a common tutorial-level default; it was
   not updated for production use.

7. **No `.gitignore`**: The project root has no `.gitignore`, indicating the initial `git init`
   was done without the standard Node template.

8. **Stale metadata**: `package.json` was not renamed after the project was repurposed from an
   earlier scaffold named `index14`.

---

## Correctness Properties

Property 1: Bug Condition — Hardcoded Secrets Replaced

_For any_ source file where `isBugCondition_HardcodedJwtSecret` or
`isBugCondition_HardcodedEncryptionKey` returns true, the fixed files SHALL contain
`process.env.JWT_SECRET` and `process.env.NOTE_ENCRYPTION_KEY` respectively at every call
site, and SHALL NOT contain the literal strings `"coding"` or `"shouthub_notes_key_2024"` as
secret/key arguments.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

Property 2: Bug Condition — Token Expiry Enforced

_For any_ `jwt.sign` call where `isBugCondition_NoTokenExpiry` returns true, the fixed call
SHALL include `{ expiresIn: "7d" }` in the options object, so the resulting token's `exp`
claim is set to approximately 7 days from issuance.

**Validates: Requirements 2.5**

---

Property 3: Bug Condition — Sufficient bcrypt Salt Rounds

_For any_ `bcrypt.hash` call where `isBugCondition_WeakSaltRounds` returns true, the fixed
call SHALL use salt rounds `>= 10`.

**Validates: Requirements 2.6**

---

Property 4: Bug Condition — Duplicate Email Rejected

_For any_ registration request where `isBugCondition_DuplicateEmailAllowed` returns true (the
email already exists), the fixed handler SHALL return HTTP 409 with
`{ msg: "Email already in use" }` and SHALL NOT create a second user document with that email.

**Validates: Requirements 2.7**

---

Property 5: Bug Condition — Correct HTTP Status Codes

_For any_ error response where `isBugCondition_WrongStatusCode` returns true, the fixed
handler SHALL return the semantically correct status code: 400 for missing required fields,
401 for bad credentials, 409 for duplicate email, 500 for unexpected server errors.

**Validates: Requirements 2.11, 2.12, 2.13, 2.14**

---

Property 6: Bug Condition — `req.userId` Set by Shared Middleware

_For any_ execution of the shared `auth` middleware where `isBugCondition_MissingReqUserId`
returns true, the fixed middleware SHALL assign `req.userId = decoded.userId` before calling
`next()`, making the user identity available to all downstream handlers.

**Validates: Requirements 2.10**

---

Property 7: Bug Condition — Consolidated Token Verification

_For any_ `/notes` route handler where `isBugCondition_DuplicateVerifyToken` returns true, the
fixed code SHALL use the shared `auth` middleware imported from `middleware/auth.middleware.js`
and SHALL NOT define or call a private `verifyToken` function.

**Validates: Requirements 2.9**

---

Property 8: Preservation — All Existing Happy-Path Behaviors Unchanged

_For any_ input where NO `isBugCondition_*` function returns true (valid JWT, correct
credentials, authenticated CRUD operations, CORS-allowed origins), the fixed code SHALL
produce the same observable result — response body, HTTP status, and database side-effect — as
the original code.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

---

## Fix Implementation

### Dependency Order

The changes must be applied in this order because later steps depend on earlier ones:

1. Rename `midddlewere/` → `middleware/` and `auth.middlewere.js` → `auth.middleware.js`
2. Fix shared `auth` middleware (set `req.userId`, correct status on failure)
3. Update `server.js` import path and wire `noteRouter` through shared middleware
4. Fix `note.route.js` (remove private `verifyToken`, use shared middleware, replace `SECRET_KEY`)
5. Fix `user.route.js` (salt rounds, `expiresIn`, `JWT_SECRET`, status codes, duplicate check)
6. Add `.gitignore`
7. Update `package.json` metadata
8. Add `JWT_SECRET` and `NOTE_ENCRYPTION_KEY` to `.env`

---

### Step 1 — Rename middleware directory and file

**Action**: Rename the directory `midddlewere/` to `middleware/` and rename the file
`auth.middlewere.js` to `auth.middleware.js` inside it.

This is a filesystem rename only. All imports that reference these paths must be updated in
steps 2–4.

---

### Step 2 — Fix `middleware/auth.middleware.js`

**File**: `middleware/auth.middleware.js` (renamed from `midddlewere/auth.middlewere.js`)

**Specific changes:**

1. **Replace hardcoded secret**: Change `jwt.verify(token, "coding")` to
   `jwt.verify(token, process.env.JWT_SECRET)`.
2. **Set `req.userId`**: After `jwt.verify` succeeds, add `req.userId = decoded.userId;`
   before calling `next()`.
3. **Return 401 on failure**: Change `res.send({ msg: "login First" })` to
   `res.status(401).send({ msg: "Login first" })` in the catch block.
4. **Remove `console.log(token)`**: This logs tokens to stdout — a minor information-exposure
   issue that is out of scope for a required fix but should be removed as part of cleanup.

**Before → After (pseudocode):**
```
// Before
const decoded = jwt.verify(token, "coding");
next();
// catch: res.send({ msg: "login First" })

// After
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.userId = decoded.userId;
next();
// catch: res.status(401).send({ msg: "Login first" })
```

---

### Step 3 — Fix `server.js` imports and middleware wiring

**File**: `server.js`

**Specific changes:**

1. **Update import path**: Change
   `require("./midddlewere/auth.middlewere")` to `require("./middleware/auth.middleware")`.
2. **Apply shared middleware to `noteRouter`**: Change
   `app.use("/notes", noteRouter)` to `app.use("/notes", auth, noteRouter)`.
   This routes all `/notes` requests through the shared `auth` middleware before they reach
   `noteRouter`, making the private `verifyToken` in `note.route.js` redundant.
3. **Remove misplaced `app.use(auth)`**: The current `app.use(auth)` call appears after the
   route registrations and only guards `/dashboard`. After moving `auth` to the `/notes`
   registration, the loose `app.use(auth)` can remain for `/dashboard` or be restructured —
   but it must NOT be removed from protecting `/dashboard`.

---

### Step 4 — Fix `routes/note.route.js`

**File**: `routes/note.route.js`

**Specific changes:**

1. **Remove private `verifyToken` function entirely** (the shared middleware now handles this).
2. **Remove `const jwt = require("jsonwebtoken")`** — no longer needed once `verifyToken` is
   removed.
3. **Replace all `verifyToken` references** in route definitions with the shared `auth`
   middleware. Since `server.js` now applies `auth` at the router level
   (`app.use("/notes", auth, noteRouter)`), the per-route references to `verifyToken` can
   simply be removed from each route handler signature — `req.userId` will already be set.
4. **Replace `SECRET_KEY`**: Change
   `const SECRET_KEY = "shouthub_notes_key_2024";` to
   `const SECRET_KEY = process.env.NOTE_ENCRYPTION_KEY;`.

> **Note on `encrypt`/`decrypt`**: `crypto.scryptSync` is called with `SECRET_KEY` as input.
> When the key comes from an environment variable, the same 32-byte derived key is produced as
> long as the same `NOTE_ENCRYPTION_KEY` value is used. Existing encrypted notes will only
> remain readable if `NOTE_ENCRYPTION_KEY` is set to a value whose `scryptSync` output matches
> the original `"shouthub_notes_key_2024"` derivation. For a fresh deployment this is
> irrelevant; for an existing database, the value in `.env` must be set to
> `"shouthub_notes_key_2024"` to preserve decryptability of stored notes.

---

### Step 5 — Fix `routes/user.route.js`

**File**: `routes/user.route.js`

**Specific changes:**

1. **Validate required fields** in both handlers: If `name`, `email`, or `password` are
   missing in register, return `400`. If `email` or `password` are missing in login,
   return `400`.

2. **Add duplicate-email check in `register`**: Before hashing, call
   `userModel.findOne({ email })`. If a document is found, return
   `res.status(409).send({ msg: "Email already in use" })`.

3. **Increase salt rounds**: Change `bcrypt.hash(password, 5, ...)` to
   `bcrypt.hash(password, 10, ...)`.

4. **Return 500 when hash fails**: In the bcrypt callback, if `err` is set (hash is falsy),
   return `res.status(500).send({ msg: "Error creating account" })` instead of sending 200.

5. **Add `expiresIn` to token**: Change
   `jwt.sign({ userId: user[0]._id, foo: "bar" }, "coding")` to
   `jwt.sign({ userId: user[0]._id }, process.env.JWT_SECRET, { expiresIn: "7d" })`.
   Remove the unused `foo: "bar"` claim.

6. **Replace hardcoded JWT secret in sign**: Done above in change 5.

7. **Fix login error status codes**:
   - User not found: `res.status(401).send({ msg: "Invalid credentials" })`
   - Wrong password: `res.status(401).send({ msg: "Invalid credentials" })`
   - Server error: `res.status(500).send({ msg: "Something went wrong" })`

> **Note on generic error message**: "Invalid credentials" is used for both "user not found"
> and "wrong password" to prevent account enumeration. This matches requirement 2.12.

---

### Step 6 — Add `.gitignore`

**File**: `.gitignore` (new file at project root)

**Content:**
```
.env
node_modules/
frontend/Shout/node_modules/
frontend/Shout/dist/
```

---

### Step 7 — Update `package.json` metadata

**File**: `package.json`

**Specific changes:**
- `"name": "index14"` → `"name": "shouthub"`
- `"main": "index14.js"` → `"main": "server.js"`

---

### Step 8 — Update `.env`

**File**: `.env`

**Add entries:**
```
JWT_SECRET=replace_with_secure_random_secret
NOTE_ENCRYPTION_KEY=shouthub_notes_key_2024
```

`NOTE_ENCRYPTION_KEY` is set to the original hardcoded value so that existing encrypted notes
in development databases remain decryptable. On Render (production), both values must be set
via the dashboard — `render.yaml` already marks them as `sync: false`.

---

## Testing Strategy

### Validation Approach

Testing follows two phases:

1. **Exploratory / bug-condition checking**: Run tests against the *unfixed* code to observe
   failures and confirm the root cause hypotheses.
2. **Fix + preservation checking**: Run the same tests against the *fixed* code to verify bugs
   are gone and no regressions introduced.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug on the unfixed code. Confirm or
refute root cause hypotheses.

**Test Plan**: For each bug condition, write a test that exercises the defective path and
asserts the expected (post-fix) behavior. All of these tests WILL FAIL on unfixed code —
that's the point.

**Test Cases:**

1. **Hardcoded JWT secret** (will fail on unfixed code): Call `jwt.verify` with a token signed
   using `process.env.JWT_SECRET`; verify it succeeds in the fixed middleware and fails in the
   unfixed one (which uses `"coding"`).

2. **No token expiry** (will fail on unfixed code): Decode a token issued by the unfixed login
   handler; assert `decoded.exp` is `undefined`.

3. **Weak salt rounds** (will fail on unfixed code): Register a user; retrieve the stored hash;
   assert `bcrypt.getRounds(hash) < 10` on unfixed code.

4. **Duplicate email allowed** (will fail on unfixed code): Register the same email twice; on
   unfixed code the second registration returns 200 and creates a second document.

5. **Wrong status codes** (will fail on unfixed code): Submit a login with wrong password;
   assert the response status is 200 (should be 401) on unfixed code.

6. **Missing `req.userId`** (will fail on unfixed code): Issue a valid JWT; pass a request
   through the unfixed shared middleware; assert `req.userId` is `undefined`.

**Expected counterexamples:**
- `jwt.verify` with `process.env.JWT_SECRET` fails when middleware uses `"coding"`
- Registered user hash has `bcrypt.getRounds === 5`
- Second registration with same email returns 200 and `userModel.countDocuments === 2`
- Login failure response has `statusCode === 200`
- `req.userId` is `undefined` after unfixed middleware runs

---

### Fix Checking

**Goal**: For all inputs where a bug condition holds, verify the fixed code produces the
expected correct behavior.

**Pseudocode:**
```
FOR ALL file WHERE isBugCondition_HardcodedJwtSecret(file) DO
  ASSERT file contains process.env.JWT_SECRET
  ASSERT file does NOT contain literal "coding" as JWT secret
END FOR

FOR ALL jwt.sign call WHERE isBugCondition_NoTokenExpiry(call) DO
  token := jwt.sign(payload, secret, options_fixed)
  ASSERT jwt.decode(token).exp IS NOT NULL
END FOR

FOR ALL bcrypt.hash call WHERE isBugCondition_WeakSaltRounds(call) DO
  ASSERT saltRounds >= 10
END FOR

FOR ALL request WHERE isBugCondition_DuplicateEmailAllowed(request) DO
  response := POST /user/register (duplicate email, fixed handler)
  ASSERT response.status = 409
  ASSERT userModel.countDocuments({ email }) = 1
END FOR

FOR ALL error response WHERE isBugCondition_WrongStatusCode(response) DO
  ASSERT response.status IN {400, 401, 409, 500}
END FOR
```

---

### Preservation Checking

**Goal**: For all inputs where no bug condition holds, verify the fixed code produces the same
result as the original.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition_*(request) DO
  ASSERT fixedHandler(request).status   = originalHandler(request).status
  ASSERT fixedHandler(request).body     = originalHandler(request).body
  ASSERT sideEffects(fixedHandler)      = sideEffects(originalHandler)
END FOR
```

**Testing Approach**: Property-based testing is well-suited here because:
- It generates many random inputs automatically (random valid JWTs, random note payloads, etc.)
- It catches edge cases (empty strings, Unicode content, very long titles) that manual tests miss
- It provides strong guarantees that CRUD behavior is unchanged across the input domain

**Test Cases:**

1. **Valid login preservation**: Users with valid credentials continue to receive a JWT, name,
   and userId in the response body (now with HTTP 200, same as before).

2. **Note CRUD preservation**: Authenticated create/read/update/delete operations return the
   same body structure as before the fix (content encrypted at rest, plaintext in response).

3. **CORS preservation**: Origins in `ALLOWED_ORIGINS` continue to pass; unlisted origins
   continue to be blocked.

4. **Unauthorized rejection preservation**: Requests without a token continue to receive a 401
   before reaching any route handler.

---

### Unit Tests

- Test `auth` middleware with a valid token: `req.userId` is set, `next()` is called.
- Test `auth` middleware with an expired token: `next()` is NOT called, 401 returned.
- Test `auth` middleware with no token: 401 returned immediately.
- Test `register` with missing fields: 400 returned.
- Test `register` with duplicate email: 409 returned, DB count unchanged.
- Test `register` happy path: 201 returned (or 200 — maintain existing), user saved with
  `bcrypt.getRounds(hash) >= 10`.
- Test `login` with unknown email: 401 returned.
- Test `login` with wrong password: 401 returned.
- Test `login` happy path: token returned, `jwt.decode(token).exp` is set.
- Test `encrypt` → `decrypt` round-trip with `NOTE_ENCRYPTION_KEY` from env.

### Property-Based Tests

- **Property 8 (Preservation)**: Generate random `{ title, content, color }` payloads; verify
  that `encrypt(content)` followed by `decrypt(encrypted)` returns the original `content` for
  any string input (round-trip fidelity).
- **Property 3 (Salt rounds)**: For any password string, the hash produced by the fixed
  `register` handler satisfies `bcrypt.getRounds(hash) >= 10`.
- **Property 4 (No duplicate)**: For any email, registering twice never produces
  `userModel.countDocuments({ email }) > 1` after both requests complete.
- **Property 5 (Status codes)**: For any request to an error path, the response status code
  is never 200.

### Integration Tests

- Full register → login → create note → read notes → update note → delete note flow with the
  fixed backend running against a test database.
- Verify that switching `JWT_SECRET` in `.env` invalidates previously issued tokens (token
  signed with old secret fails `jwt.verify` with new secret).
- Verify that `NOTE_ENCRYPTION_KEY` set to the original hardcoded value preserves
  decryptability of notes encrypted before the fix.
- Verify that `render.yaml` deployment config still references `JWT_SECRET` and `mongourl`
  correctly after all file changes.
