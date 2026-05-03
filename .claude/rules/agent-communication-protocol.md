# Inter-Agent Communication Protocol

## AGENT_RESULT Block (Required)

All agents must output an `AGENT_RESULT` block upon work completion.
Each domain's flow orchestrator parses this output to determine next-phase decisions.

> **Flow orchestrator exception:** Discovery Flow / Delivery Flow / Operations Flow themselves do not output `AGENT_RESULT`. The flow orchestrator's final artifact is the handoff file (e.g., DISCOVERY_RESULT.md), and completion is reported via the approval gate.

```
AGENT_RESULT: {agent-name}
STATUS: success | error | failure | suspended | blocked | approved | conditional | rejected
...(agent-specific fields)
NEXT: {next-agent-name | done | suspended}
```

## STATUS Definitions

| STATUS | Meaning | Orchestrator Action |
|--------|---------|-------------------|
| `success` | Completed successfully | Proceed to approval gate |
| `error` | Failed to complete due to error | Report to user and ask for decision |
| `failure` | Quality issue (e.g., test failure) | Follow rollback rules |
| `suspended` | Session interrupted | Prompt user to resume |
| `blocked` | Cannot continue due to design ambiguity | Flow orchestrator launches lightweight query to the target agent |
| `approved` / `conditional` / `rejected` | Review result | Rollback or completion decision |

## blocked STATUS Usage

Used when `developer` discovers design ambiguity or contradiction during implementation.

```
AGENT_RESULT: developer
STATUS: blocked
BLOCKED_REASON: {reason}
BLOCKED_TARGET: architect
CURRENT_TASK: TASK-005
NEXT: suspended
```
