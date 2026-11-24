# Bugfix Requirements Document

## Introduction

ShoutHub is a Node.js + React notes application. A security audit and code review identified 11 confirmed bugs across the backend: hardcoded secrets, weak cryptographic configuration, missing input validation, absent credential protection, duplicated authentication logic, incorrect HTTP status codes, and stale project metadata. These bugs expose the application to credential theft, account enumeration, token forgery, and silent data corruption. This document captures the defective behaviors, the required correct behaviors, and the existing behaviors that must not regress.

---

## Bug Analysis

### Current Behavior (Defect)

**JWT Secret — Hardcoded in auth middleware and user routes**

1.1 WHEN the auth middleware (`midddlewere/auth.middlewere.js`) verifies a JWT THEN the system uses the hardcoded string `"coding"` as the secret instead of an environment variable

1.2 WHEN the login handler in `routes/user.route.js` signs a JWT THEN the system uses the hardcoded string `"coding"` as the secret instead of an environment variable

1.3 WHEN the `verifyToken` function in `routes/note.route.js` verifies a JWT THEN the system uses the hardcoded string `"coding"` as the secret instead of an environment variable

**Note Encryption Key — Hardcoded in note routes**

1.4 WHEN any note route encrypts or decrypts note content THEN the system uses the hardcoded string `"shouthub_notes_key_2024"` as the encryption key instead of an environment variable

**JWT Expiry — Tokens never expire**

1.5 WHEN a user logs in successfully THEN the system issues a JWT with no `expiresIn` field, causing tokens to be valid indefinitely

**bcrypt Salt Rounds — Too weak**

1.6 WHEN a new user registers THEN the system hashes the password with salt rounds of `5`, which is below the minimum secure threshold of `10`

**Duplicate Email — No uniqueness check on registration**

1.7 WHEN a user submits a registration request with an email address that already exists in the database THEN the system creates a second user record with the same email instead of rejecting the request

**Credential Exposure — `.env` and `node_modules` unprotected**

1.8 WHEN the project root directory is tracked by git THEN the system has no `.gitignore` file, so `.env` (containing the MongoDB Atlas connection string) and `node_modules` are committed to the repository

**Duplicated `verifyToken` — Middleware never used for notes**

1.9 WHEN a request arrives at any `/notes` route THEN the system uses a privately defined `verifyToken` function inside `routes/note.route.js` that duplicates the shared auth middleware, while the shared middleware (`midddlewere/auth.middlewere.js`) is never applied to the notes routes

1.10 WHEN the shared auth middleware in `midddlewere/auth.middlewere.js` verifies a valid JWT THEN the system does not set `req.userId` from the decoded token payload, making the user identity unavailable to downstream handlers

**HTTP Status Codes — All errors return 200**

1.11 WHEN registration or login fails (bad input, wrong password, user not found, or server error) THEN the system responds with HTTP status `200` and a plain message string instead of a semantically correct status code

**Package Metadata — Wrong name and entry point**

1.12 WHEN `package.json` is read THEN the system shows `"name": "index14"` and `"main": "index14.js"`, which do not correspond to the actual project name or entry file (`server.js`)

**Folder Name — Typo**

1.13 WHEN the middleware directory is referenced THEN the system uses the path `midddlewere` (three d's), which is a typo of the intended name `middleware`

---

### Expected Behavior (Correct)

**JWT Secret — Read from environment**

2.1 WHEN the auth middleware verifies a JWT THEN the system SHALL use `process.env.JWT_SECRET` as the signing secret

2.2 WHEN the login handler signs a JWT THEN the system SHALL use `process.env.JWT_SECRET` as the signing secret

2.3 WHEN any note route's token verification runs THEN the system SHALL use `process.env.JWT_SECRET` as the signing secret

**Note Encryption Key — Read from environment**

2.4 WHEN any note route encrypts or decrypts note content THEN the system SHALL derive the encryption key from `process.env.NOTE_ENCRYPTION_KEY`

**JWT Expiry — Tokens expire**

2.5 WHEN a user logs in successfully THEN the system SHALL issue a JWT with `expiresIn: "7d"` (or another documented finite duration)

**bcrypt Salt Rounds — Minimum 10**

2.6 WHEN a new user registers THEN the system SHALL hash the password with salt rounds of at least `10`

**Duplicate Email — Reject on conflict**

2.7 WHEN a user submits a registration request with an email address that already exists in the database THEN the system SHALL reject the request with HTTP status `409` and a message indicating the email is already in use, without creating a duplicate record

**Credential Exposure — `.gitignore` added**

2.8 WHEN the project root is tracked by git THEN the system SHALL have a `.gitignore` file that includes `.env` and `node_modules` entries so neither is committed

**Duplicated `verifyToken` — Consolidated**

2.9 WHEN a request arrives at any `/notes` route THEN the system SHALL apply the shared auth middleware (or a single consolidated token-verification function) rather than a private duplicate

2.10 WHEN the shared auth middleware verifies a valid JWT THEN the system SHALL set `req.userId` from the decoded token payload so downstream handlers can identify the requesting user

**HTTP Status Codes — Correct codes on all error paths**

2.11 WHEN a request body is missing required fields THEN the system SHALL respond with HTTP status `400`

2.12 WHEN login credentials are incorrect (wrong password or email not found) THEN the system SHALL respond with HTTP status `401`

2.13 WHEN registration is rejected due to a duplicate email THEN the system SHALL respond with HTTP status `409`

2.14 WHEN an unexpected server error occurs THEN the system SHALL respond with HTTP status `500`

**Package Metadata — Corrected**

2.15 WHEN `package.json` is read THEN the system SHALL show `"name": "shouthub"` (or a matching kebab-case project name) and `"main": "server.js"`

**Folder Name — Corrected**

2.16 WHEN the middleware directory is referenced THEN the system SHALL use the path `middleware` (two d's), and all imports SHALL be updated to match

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a valid JWT is presented to any protected route THEN the system SHALL CONTINUE TO grant access to the requested resource

3.2 WHEN a registered user submits correct credentials THEN the system SHALL CONTINUE TO return a JWT and the user's name and ID in the login response

3.3 WHEN an authenticated user creates a note THEN the system SHALL CONTINUE TO encrypt the note content before persisting it and return the plaintext content in the response

3.4 WHEN an authenticated user retrieves notes THEN the system SHALL CONTINUE TO decrypt note content before returning it

3.5 WHEN an authenticated user updates a note THEN the system SHALL CONTINUE TO apply encryption to the new content and return the plaintext content in the response

3.6 WHEN an authenticated user deletes a note THEN the system SHALL CONTINUE TO remove only that user's note and return a success message

3.7 WHEN a request arrives from an origin not in `ALLOWED_ORIGINS` THEN the system SHALL CONTINUE TO block it via CORS

3.8 WHEN the server starts THEN the system SHALL CONTINUE TO connect to MongoDB and log the connection status

3.9 WHEN `render.yaml` is used for deployment THEN the system SHALL CONTINUE TO reference `JWT_SECRET` and `mongourl` as `sync: false` environment variables requiring manual dashboard configuration

3.10 WHEN a request is made without a JWT THEN the system SHALL CONTINUE TO reject it with an unauthorized response before reaching any protected handler

---

## Bug Condition Pseudocode

### Bug Condition Functions

```pascal
FUNCTION isBugCondition_HardcodedJwtSecret(X)
  INPUT: X = source file containing jwt.verify or jwt.sign call
  OUTPUT: boolean
  RETURN X contains literal string "coding" as the JWT secret argument
END FUNCTION

FUNCTION isBugCondition_HardcodedEncryptionKey(X)
  INPUT: X = source file containing crypto operations
  OUTPUT: boolean
  RETURN X contains literal string "shouthub_notes_key_2024" as SECRET_KEY
END FUNCTION

FUNCTION isBugCondition_NoTokenExpiry(X)
  INPUT: X = jwt.sign call arguments
  OUTPUT: boolean
  RETURN X does not include expiresIn option
END FUNCTION

FUNCTION isBugCondition_WeakSalt(X)
  INPUT: X = bcrypt.hash call arguments
  OUTPUT: boolean
  RETURN X.saltRounds < 10
END FUNCTION

FUNCTION isBugCondition_DuplicateEmailAllowed(X)
  INPUT: X = registration request with { email }
  OUTPUT: boolean
  RETURN userModel.countDocuments({ email: X.email }) > 0
END FUNCTION

FUNCTION isBugCondition_MissingGitignore(X)
  INPUT: X = project root directory
  OUTPUT: boolean
  RETURN .gitignore does not exist OR .gitignore does not contain ".env" and "node_modules"
END FUNCTION

FUNCTION isBugCondition_WrongStatusCode(X)
  INPUT: X = error response from user routes
  OUTPUT: boolean
  RETURN X.httpStatus = 200 AND X.body contains error message
END FUNCTION
```

### Fix-Checking Properties

```pascal
// Property: Hardcoded secrets replaced
FOR ALL X WHERE isBugCondition_HardcodedJwtSecret(X) DO
  result ← scanSourceFile'(X)
  ASSERT NOT (result contains literal "coding" as JWT secret)
  ASSERT result contains process.env.JWT_SECRET
END FOR

// Property: Token expiry enforced
FOR ALL X WHERE isBugCondition_NoTokenExpiry(X) DO
  token ← jwt.sign'(payload, secret, options)
  ASSERT token.exp IS NOT NULL
END FOR

// Property: Duplicate email rejected
FOR ALL X WHERE isBugCondition_DuplicateEmailAllowed(X) DO
  response ← register'(X)
  ASSERT response.status = 409
  ASSERT userModel.countDocuments({ email: X.email }) = 1
END FOR

// Property: Correct status codes
FOR ALL X WHERE isBugCondition_WrongStatusCode(X) DO
  response ← errorPath'(X)
  ASSERT response.status IN {400, 401, 409, 500}
END FOR
```

### Preservation Property

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_*(X) DO
  ASSERT F(X) = F'(X)   // behavior of fixed code equals original for non-buggy inputs
END FOR
```
