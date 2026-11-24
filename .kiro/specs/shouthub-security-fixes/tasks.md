# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Hardcoded Secrets, Weak Config, and Wrong Status Codes
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist on the unfixed codebase
  - **Scoped PBT Approach**: For deterministic bugs, scope each property to its concrete failing case to ensure reproducibility
  - Test case 1 — Hardcoded JWT secret: Read `midddlewere/auth.middlewere.js` and `routes/user.route.js`; assert neither file contains the literal string `"coding"` as a jwt.verify/jwt.sign argument (isBugCondition_HardcodedJwtSecret)
  - Test case 2 — Hardcoded encryption key: Read `routes/note.route.js`; assert it does NOT declare `SECRET_KEY` with the literal `"shouthub_notes_key_2024"` (isBugCondition_HardcodedEncryptionKey)
  - Test case 3 — No token expiry: Inspect the `jwt.sign` call in `routes/user.route.js`; assert options include an `expiresIn` field (isBugCondition_NoTokenExpiry)
  - Test case 4 — Weak salt rounds: Inspect the `bcrypt.hash` call in `routes/user.route.js`; assert salt rounds >= 10 (isBugCondition_WeakSalt)
  - Test case 5 — Duplicate email: Mock `userModel.findOne` to return an existing user; call the register handler with the same email twice; assert the second response status is 409 and countDocuments remains 1 (isBugCondition_DuplicateEmailAllowed)
  - Test case 6 — Wrong status codes: Call the login handler with a wrong password on the unfixed route; assert the response status is NOT 200 (isBugCondition_WrongStatusCode)
  - Test case 7 — Missing req.userId: Call the unfixed auth middleware with a valid token; assert `req.userId` is set after `next()` (isBugCondition_MissingReqUserId)
  - Run all test cases on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found (e.g., "auth.middlewere.js contains 'coding'", "saltRounds === 5", "login with bad password returns HTTP 200")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.11_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Happy-Path Behaviors Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Valid JWT presented to auth middleware → `next()` called, `req.userId` set (once fixed baseline exists, verify no regression)
  - Observe: Correct credentials to login handler → response body contains `token`, `name`, `userId` with HTTP 200
  - Observe: Authenticated POST /notes → note saved with encrypted content, response contains plaintext content
  - Observe: Authenticated GET /notes → response contains decrypted plaintext content
  - Observe: Authenticated PUT /notes/:id → note updated with encrypted content, response contains plaintext
  - Observe: Authenticated DELETE /notes/:id → note removed, success message returned
  - Observe: Request without JWT → 401 returned before reaching route handler
  - Write property-based test: for all valid `{ title, content, color }` payloads, `encrypt(content)` followed by `decrypt(encrypted)` returns the original `content` (round-trip fidelity — Preservation Requirements 3.3, 3.4, 3.5)
  - Write property-based test: for any password string, the hash produced by the register handler satisfies `bcrypt.getRounds(hash) >= 10` after the fix (Preservation Requirements 3.2)
  - Write property-based test: for any email, registering twice never produces countDocuments > 1 (Preservation Requirements 3.2)
  - Write property-based test: for any request to an error path (missing fields, bad credentials), the response status code is never 200 (Preservation Requirements 3.10)
  - Run these tests on UNFIXED code (some will pass, some may fail — record baseline)
  - **EXPECTED OUTCOME**: Tests PASS on non-buggy inputs (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing baseline is documented
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [ ] 3. Fix ShoutHub security bugs (all 11)

  - [ ] 3.1 Rename middleware directory and file
    - Rename directory `midddlewere/` to `middleware/`
    - Rename file `auth.middlewere.js` to `auth.middleware.js` inside the renamed directory
    - Update all import paths in `server.js`, `routes/note.route.js` (if any) to reference `./middleware/auth.middleware`
    - _Bug_Condition: isBugCondition_TypoFolderName(X) where X ends with "midddlewere"_
    - _Expected_Behavior: All imports resolve to `middleware/auth.middleware` path_
    - _Preservation: No change to middleware logic, only path rename_
    - _Requirements: 2.16_

  - [ ] 3.2 Fix `middleware/auth.middleware.js`
    - Replace `jwt.verify(token, "coding")` with `jwt.verify(token, process.env.JWT_SECRET)`
    - After `jwt.verify` succeeds, add `req.userId = decoded.userId;` before calling `next()`
    - Change the catch block from `res.send({ msg: "login First" })` to `res.status(401).send({ msg: "Login first" })`
    - Remove `console.log(token)` to eliminate token logging
    - _Bug_Condition: isBugCondition_HardcodedJwtSecret(X) AND isBugCondition_MissingReqUserId(X)_
    - _Expected_Behavior: JWT verified with process.env.JWT_SECRET; req.userId set from decoded payload; 401 returned on failure_
    - _Preservation: Valid JWTs continue to pass through; next() still called on success_
    - _Requirements: 2.1, 2.3, 2.10_

  - [ ] 3.3 Fix `server.js` import path and middleware wiring
    - Update `require("./midddlewere/auth.middlewere")` to `require("./middleware/auth.middleware")`
    - Change `app.use("/notes", noteRouter)` to `app.use("/notes", auth, noteRouter)` so all note routes pass through the shared auth middleware
    - Ensure `app.use(auth)` for `/dashboard` is preserved (do NOT remove it)
    - _Bug_Condition: isBugCondition_TypoFolderName(X) AND isBugCondition_DuplicateVerifyToken(X) (notes routes bypass shared middleware)_
    - _Expected_Behavior: Import resolves correctly; all /notes requests pass through shared auth before reaching noteRouter_
    - _Preservation: /dashboard and other protected routes continue to work; CORS config unchanged_
    - _Requirements: 2.9, 2.16_

  - [ ] 3.4 Fix `routes/note.route.js`
    - Remove the private `verifyToken` function entirely
    - Remove `const jwt = require("jsonwebtoken")` (no longer needed)
    - Remove `verifyToken` from each route handler's middleware chain (shared middleware now applied at router level in server.js)
    - Change `const SECRET_KEY = "shouthub_notes_key_2024"` to `const SECRET_KEY = process.env.NOTE_ENCRYPTION_KEY`
    - _Bug_Condition: isBugCondition_HardcodedEncryptionKey(X) AND isBugCondition_DuplicateVerifyToken(X)_
    - _Expected_Behavior: Encryption key read from process.env.NOTE_ENCRYPTION_KEY; no private verifyToken; req.userId available from shared middleware_
    - _Preservation: encrypt/decrypt logic unchanged; all CRUD routes continue to work; content encrypted at rest, plaintext in response_
    - _Requirements: 2.4, 2.9_

  - [ ] 3.5 Fix `routes/user.route.js`
    - Add input validation in `register`: if `name`, `email`, or `password` are missing, return `res.status(400).send({ msg: "Missing required fields" })`
    - Add duplicate-email check in `register`: call `userModel.findOne({ email })`; if found, return `res.status(409).send({ msg: "Email already in use" })`
    - Change `bcrypt.hash(password, 5, ...)` to `bcrypt.hash(password, 10, ...)`
    - In the bcrypt callback error branch, return `res.status(500).send({ msg: "Error creating account" })`
    - Change `jwt.sign({ userId: user[0]._id, foo: "bar" }, "coding")` to `jwt.sign({ userId: user[0]._id }, process.env.JWT_SECRET, { expiresIn: "7d" })`
    - Fix login error status codes: user not found → `res.status(401).send({ msg: "Invalid credentials" })`; wrong password → `res.status(401).send({ msg: "Invalid credentials" })`; server error → `res.status(500).send({ msg: "Something went wrong" })`
    - Add input validation in `login`: if `email` or `password` are missing, return `res.status(400).send({ msg: "Missing required fields" })`
    - _Bug_Condition: isBugCondition_HardcodedJwtSecret(X) AND isBugCondition_NoTokenExpiry(X) AND isBugCondition_WeakSalt(X) AND isBugCondition_DuplicateEmailAllowed(X) AND isBugCondition_WrongStatusCode(X)_
    - _Expected_Behavior: JWT signed with process.env.JWT_SECRET and expiresIn "7d"; password hashed with saltRounds=10; duplicate email returns 409; all error paths return 400/401/409/500_
    - _Preservation: Valid credentials continue to return JWT + name + userId with HTTP 200; register happy path continues to create user and return response_
    - _Requirements: 2.2, 2.5, 2.6, 2.7, 2.11, 2.12, 2.13, 2.14_

  - [ ] 3.6 Add `.gitignore` at project root
    - Create `.gitignore` file at project root with the following entries: `.env`, `node_modules/`, `frontend/Shout/node_modules/`, `frontend/Shout/dist/`
    - _Bug_Condition: isBugCondition_MissingGitignore(X) where .gitignore does not exist or does not contain ".env" and "node_modules"_
    - _Expected_Behavior: .env and node_modules excluded from git tracking_
    - _Preservation: No runtime behavior changed; render.yaml and existing files unaffected_
    - _Requirements: 2.8_

  - [ ] 3.7 Update `package.json` metadata
    - Change `"name": "index14"` to `"name": "shouthub"`
    - Change `"main": "index14.js"` to `"main": "server.js"`
    - _Bug_Condition: isBugCondition_BadPackageMetadata(X) where X.name = "index14"_
    - _Expected_Behavior: package.json reflects actual project name and entry point_
    - _Preservation: All other package.json fields (dependencies, scripts, etc.) unchanged_
    - _Requirements: 2.15_

  - [ ] 3.8 Update `.env` with required environment variables
    - Add `JWT_SECRET=replace_with_secure_random_secret` to `.env`
    - Add `NOTE_ENCRYPTION_KEY=shouthub_notes_key_2024` to `.env` (preserves decryptability of existing notes in development databases)
    - Confirm `render.yaml` already references `JWT_SECRET` and `mongourl` as `sync: false` — no change needed there
    - _Bug_Condition: isBugCondition_HardcodedJwtSecret and isBugCondition_HardcodedEncryptionKey (env vars must exist for fixed code to function)_
    - _Expected_Behavior: process.env.JWT_SECRET and process.env.NOTE_ENCRYPTION_KEY resolve to non-empty values at runtime_
    - _Preservation: Existing mongourl and other .env entries unchanged; render.yaml deployment config unaffected_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.9 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Hardcoded Secrets, Weak Config, and Wrong Status Codes Resolved
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, they confirm the expected behavior is satisfied across all 11 bug conditions
    - Run all bug condition test cases from step 1 against the fixed code
    - **EXPECTED OUTCOME**: All tests PASS (confirms all bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15, 2.16_

  - [ ] 3.10 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Happy-Path Behaviors Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2 against the fixed code
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions in happy-path flows)
    - Confirm encrypt → decrypt round-trip still works with NOTE_ENCRYPTION_KEY from env
    - Confirm valid login still returns token + name + userId
    - Confirm authenticated CRUD operations still work correctly
    - Confirm unauthenticated requests still receive 401

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite (bug condition tests + preservation property tests)
  - Confirm all 11 bug conditions are resolved
  - Confirm all 10 preservation requirements still hold
  - If any test fails, resolve the failure before marking this task complete
  - Ask the user if any questions arise during this step
