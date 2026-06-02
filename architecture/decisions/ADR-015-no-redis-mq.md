# ADR-015 — No Redis / message queue: in-process SQLite + single-process model is sufficient

- **Status:** Accepted
- **Date:** 2026-06-02
- **Wave:** 97
- **Issue:** #208 (`arch: 'do we need Redis/MQ?' — documented NO decision + tripwire`)
- **Relates to:** ADR-005 (PO state externalized into thread-scoped SQLite tables), CLAUDE.md "Single-user, single-machine only" caveat

## Context

The question recurs whenever a new async-looking surface appears — tick scheduling,
inbox draining, the stall detector, cross-agent HANDOFF delivery, the merge-train
heartbeat. Each *looks* like the kind of thing a job queue or pub/sub broker exists to
serve, so "should we pull in Redis / BullMQ / RabbitMQ?" keeps getting re-asked from
first principles. Re-deriving the same NO every time is waste, and worse, an undocumented
NO invites someone to quietly answer YES in a PR and bolt on infrastructure the product's
constraints don't justify.

The forces at play:

- **The hard product constraint** (CLAUDE.md): apex-team is **single-user, single-machine
  only**. The Claude Agent SDK reuses the local Claude Code OAuth — there is no
  multi-tenant story, no second node, no horizontal-scale requirement. This is not an
  accident of the current implementation; it is the product definition.
- **State already lives in SQLite** (`data/apex-team.db`, `better-sqlite3`): two tables
  `messages` + `agent_state`, plus the thread-scoped PO tables from ADR-005. Reads/writes
  are synchronous, in-process, single-writer. No network hop, no serialization boundary.
- **"Concurrency" here is cooperative, not distributed.** The 7 agents run as in-process
  SDK sessions driven by one Next.js server (`server.ts`). Tick scheduling, inbox polling,
  and DISPATCH/HANDOFF delivery are all orchestrated inside that one process against the
  one SQLite file. There is no work that crosses a process or machine boundary and
  therefore nothing that needs an out-of-process broker to coordinate.
- **A broker is not free.** Redis/MQ adds a daemon to run, a connection to manage, a
  failure mode to handle, a version to patch (NFR-security: CVE surface), and a second
  source of truth to keep consistent with SQLite. For a single-process app, that is pure
  liability against zero benefit.

## Decision

**apex-team uses in-process SQLite (`better-sqlite3`) as its only state and coordination
store. We do NOT add Redis, a message queue, or any external broker.** Tick scheduling,
inbox draining, stall detection, and cross-agent message delivery are all implemented as
in-process logic over the existing SQLite tables and the single Next.js server.

This is a **documented NO with a tripwire** (below), not a "not yet" — under the current
single-user/single-machine product constraint, the answer is settled. Reopening it
requires the tripwire to fire, not a fresh from-scratch debate.

## Tripwire — the concrete condition that reopens this decision

Revisit this ADR (move to `Superseded`) **only if one of these becomes a real requirement**:

1. **Multi-machine** — the team must run across more than one host (e.g. a hosted/shared
   deployment), so state can no longer live in one local SQLite file.
2. **Multi-user / multi-tenant** — concurrent users with isolated workspaces sharing one
   backend, requiring a coordination layer SQLite's single-writer model can't serve
   cleanly.
3. **Out-of-process workers** — work must be handed to a separate process/worker pool
   (e.g. long-running agent turns moved off the request process), creating a genuine
   cross-process queue need.
4. **Sustained write contention** — the single SQLite writer becomes a measured
   bottleneck (writer-lock wait observable in the stall/latency metrics), not a
   hypothetical one.

Until one of these is an actual, scoped requirement, the answer stays NO. A PR proposing
Redis/MQ without citing a fired tripwire should be sent back to this ADR.

## Standard encoded

> **Do not add out-of-process infrastructure (broker, queue, cache daemon) to a
> single-process, single-machine app to serve coordination that in-process state already
> handles. Record the NO with a concrete tripwire so the decision is settled, not
> re-litigated — and so a YES requires a named, fired condition rather than a fresh
> opinion.**

## Consequences

**Positive**
- **Zero operational surface for coordination** — no broker daemon to run, monitor, patch,
  or secure. One process, one SQLite file. Matches the "Keep it lean / minimal deps"
  engineering standard (CLAUDE.md).
- **Single source of truth** — all state in SQLite; no SQLite↔broker consistency problem.
- **Smaller CVE/supply-chain surface** (NFR-security) — no Redis/MQ client or daemon in the
  dependency graph.
- **The recurring "do we need a queue?" question is now answered by reference** — point at
  this ADR instead of re-deriving.

**Negative / accepted trade-offs**
- **No horizontal scale.** The app cannot be sharded across processes or machines as built.
  This is explicitly **acceptable** — it is the product's stated single-user/single-machine
  constraint (CLAUDE.md), not a regression. The tripwire is exactly the boundary at which
  this trade-off stops being acceptable.
- **Single SQLite writer** — concurrent writes serialize. Fine at single-user volume;
  tripwire #4 covers the case where it stops being fine.

## Fitness function

- **F (no-broker guard):** a dependency-graph check (dependency-cruiser rule or a CI grep)
  that **fails the build** if `redis`, `ioredis`, `bullmq`, `amqplib`, or a comparable
  broker client appears in `package.json` / the import graph without an accompanying ADR
  superseding this one. Wire into CI alongside the existing fitness functions. This turns
  the "documented NO" into an *enforced* NO — a YES must come with a deliberate ADR change,
  not a silent dependency add. (Drafted here per the "NFR accepted ≠ NFR measured" rule;
  implementation tracked as a follow-up for DevSecOps to wire into `ci.yml`.)
