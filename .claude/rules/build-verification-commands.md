# Build Verification Commands by Tech Stack

## Syntax Check + Lint/Format Gate

Developer runs syntax checks plus lint/format upon task completion.
Lint errors **must be fixed before testing**.

| Language/FW | Syntax Check | Lint/Format | Test Execution |
|-------------|-------------|-------------|---------------|
| Python | `python -m py_compile {file}` | `uv run ruff check . && uv run ruff format --check .` | `uv run pytest` or `pytest` |
| TypeScript | `npx tsc --noEmit` | `npx eslint . && npx prettier --check .` | `npm test` or `npx vitest` |
| Go | `go build ./...` | `go vet ./... && gofmt -l .` | `go test ./...` |
| Rust | `cargo check` | `cargo clippy && cargo fmt --check` | `cargo test` |
| Node.js (JS) | `node --check {file}` | `npx eslint .` | `npm test` |

If lint/format tools are not installed, run syntax checks only and note this in the report.

## E2E / GUI Test Execution Commands

| Project Type | Tool | Install | Execute |
|-------------|------|---------|---------|
| Web (Python) | Playwright | `uv add pytest-playwright && playwright install` | `uv run pytest tests/e2e/` |
| Web (TypeScript) | Playwright | `npm i -D @playwright/test && npx playwright install` | `npx playwright test` |
| Desktop (Windows) | pywinauto | `uv add pywinauto` | `uv run pytest tests/gui/` |
| Desktop (cross-platform) | pyautogui | `uv add pyautogui Pillow` | `uv run pytest tests/gui/` |
| Desktop (Electron) | Playwright | Same as Web | `uv run pytest tests/e2e/` |

E2E tests are designed by `e2e-test-designer` and executed by `tester`. They run only when `HAS_UI: true`.
