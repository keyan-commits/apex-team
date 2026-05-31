# Glossary

_Owned by Business Analyst. Last updated: 2026-05-31._

| Term | Definition |
|------|-----------|
| **Thread** | A conversation session; scoped by `thread_id`. Each role maintains its own state per thread. |
| **DISPATCH** | Orchestrator-to-team channel. Auto-triggers the target role's turn. PO-only. |
| **HANDOFF** | Peer-to-peer channel. Async inbox drop; does NOT auto-trigger. Used by all non-PO roles. |
| **NOTES** | A role's self-update block — overwrites its persistent working-state doc in the DB. |
| **Pane** | One role's UI panel in the dashboard (composer + message stream + HANDOFF doc viewer). |
| **Workspace** | The directory on disk that agents' file tools target. Persisted in `localStorage`. |
| **Turn** | One LLM call for a role — loads state + history + inbox, runs, persists output. |
| **Wave** | A named batch of parallel implementation streams (Wave 1, Wave 2, …). |
| **Skills injection** | Appending domain-expertise text to a role's system prompt at turn time. |
