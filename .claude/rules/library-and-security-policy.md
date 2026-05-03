# Library Usage Policy

Before implementing from scratch, search for existing libraries that can solve the problem concisely.
However, follow these guidelines to ensure security and maintainability.

## Core Principles

1. **Prefer standard libraries** — Use the language's standard library when it can accomplish the task
2. **Avoid reinventing the wheel** — Do not build custom solutions in areas where established libraries exist (encryption, auth, date handling, validation, etc.)
3. **Minimize dependencies** — Do not introduce libraries with large dependency trees for small features

## Adoption Criteria

When adopting a library, verify:

- **Actively maintained** — Recent releases exist; issues/PRs are being addressed
- **Widely adopted** — Community track record (download counts, GitHub stars, etc.)
- **No known vulnerabilities** — No unpatched CVEs or security advisories
- **License compatible** — MIT / Apache-2.0 / BSD etc., no conflict with project license
- **Reasonable dependency depth** — Transitive dependencies are not excessive

If any of the above are uncertain, confirm with the user before adoption.

## Responsibility Distribution

| Agent | Role |
|-------|------|
| **architect** | List major libraries in ARCHITECTURE.md. Perform library selection during tech stack selection and record adoption rationale |
| **developer** | Follow ARCHITECTURE.md library list. Search for libraries only when needed functionality is not in the list. Verify adoption criteria before use. Record added libraries in TASK.md |
| **security-auditor** | Final verification via dependency vulnerability scanning (pip-audit / npm audit, etc.) |

## Vulnerability Scanning Commands

| Language | Command |
|----------|---------|
| Python | `pip-audit` or `uv run pip-audit` |
| Node.js | `npm audit` |
| Go | `govulncheck ./...` |
| Rust | `cargo audit` |

---

# security-auditor Mandatory Execution Rule

`security-auditor` **must run on all Delivery plans (including Minimal)**.

Verification items:
1. OWASP Top 10 verification
2. Dependency vulnerability scanning
3. Authentication/authorization implementation gap detection
4. Hardcoded secrets detection
5. Input validation verification
6. CWE checklist
