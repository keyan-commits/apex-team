---
name: architectural-diagramming
description: Architectural Diagramming & Execution Protocol. Use when authoring or auto-generating software/cloud architecture diagrams (AWS network topologies, C4 model layers, system context maps, container/component breakdowns) destined for Draw.io, Lucid, Miro, Mermaid, Graphviz, or hand-authored SVG/HTML canvases. Enforces hierarchical containment (no flattened topologies), an automated render-inspect-patch validation loop (never ship a diagram you have not rendered and looked at), and a single-source-of-truth schema for actors/systems/containers/components so labels and relationships stay consistent across abstraction levels. Triggers on requests like "draw the architecture", "export to Lucid", "C4 diagram", "VPC topology", "infrastructure map".
---

# architectural-diagramming

The invariant this skill enforces:

> **Architecture diagrams must be hierarchically nested, visually validated, and traceable to a single-source-of-truth schema. Never ship a diagram you have not rendered and audited.**

Applies to ANY project. Owners: whichever agent is authoring or auto-generating the diagram (typically Architect, UI Developer, or the orchestrator running a render pipeline).

## 1. Required tooling / MCP surface

Before authoring a diagram for any target, verify the corresponding execution environment is available:

- **Draw.io MCP server** (`@drawio/mcp`) — generates native `.drawio` XML with explicit parent–child `mxCell` groups and an `app.diagrams.net` handoff URL.
- **Lucid MCP server** (`mcp__lucid__*`) — `lucid_create_diagram_from_specification`, `lucid_export_document_as_PNG`, `lucid_search_document`, `fetch` for round-tripping structured content.
- **Headless browser** (Playwright / Puppeteer) — renders local HTML/JS/SVG to PNG so the result can be piped back to the vision window.
- **CLI compilers** — `mmdc` (mermaid), `dot` (Graphviz) for instant text-to-image verification.
- **Miro / Lucidchart REST adapters** — for programmatic edits to existing whiteboards (move, recolor, reflow shapes by ID).

If a required tool is missing for the chosen target, stop and either install it, switch targets, or hand off — do not author a diagram you cannot render.

## 2. Mandatory capabilities

### A. Hierarchical Layer Compilation (no flat topologies)

Every diagram must follow explicit parent → child containment:

- **Layer 1 — Bounds.** Global networks, VPC boundaries, cloud regions, internet/customer gateways.
- **Layer 2 — Isolation.** Public vs. Private subnets, CIDR blocks, Availability Zones, VPC peering / Transit Gateway bridges.
- **Layer 3 — Workloads.** Compute instances, containers, databases, ASGs, microservices placed inside their respective Layer-2 perimeters.

For C4: Context → Container → Component → Code (only as deep as the audience needs).

A shape whose bounding box crosses its parent's edge is NOT contained. Verify every child fits strictly inside its parent before emitting JSON/XML.

### B. Automated Visual Validation Loop (mandatory before shipping)

You may not declare a diagram done until you have rendered it and looked at it. The loop:

1. Emit the structural file (`.drawio` XML, Lucid Standard Import JSON, self-contained HTML canvas).
2. Render it — locally via headless browser / `mmdc` / `dot`, or remotely via `lucid_export_document_as_PNG` / equivalent.
3. Inspect the rendered image using multimodal vision. Audit for: overlapping labels, unreadable text, collapsed boundaries, misaligned containment, label/icon collision, dead space, contrast failures.
4. Patch the source. Re-render. Repeat until the result matches the drafting standard you were asked to meet (or until you have explicitly bounded the iteration count and reported remaining gaps).

If the render reveals a property the target tool silently drops (e.g. custom labels on a named-library shape), document the limitation and pick an alternative — do not keep iterating against a property the tool ignores.

### C. Unified State Management & Schema Synchronization

Before drawing any multi-tier diagram, establish a single JSON schema describing every actor, system, container, component, relationship, and the level each belongs to. Drive every level of the output from this schema so:

- Names match across levels (no "UserService" on L2 and "user-svc" on L3).
- Relationships stay traceable (a line on L2 is justified by a fact in the schema).
- Recolors / renames flow from one place.

Treat the schema as the source of truth — if a diagram and the schema disagree, the schema wins until the schema is updated.

## 3. Per-target standards

| Target | Strategy | Layout requirements |
| --- | --- | --- |
| **Draw.io** | Native XML | `<mxGraphModel>` parent wrappers so groups move as one. Semi-transparent fills for bounding frames so children remain visible. |
| **HTML / JS canvas** | GoJS, Cytoscape.js, AntV X6 | Responsive widths. High text contrast (WCAG-AA: 4.5:1 normal text, 3:1 large text / icon labels). Self-contained — no CDN dependency at render time. |
| **Lucid / Miro** | REST / MCP JSON | Precise `(x, y)` per element, explicit `className` from the supported shape library, explicit connection endpoints (`shapeId` + relative position). NEVER rely on `text` property for AWS-library named containers — probe first; if dropped, use plain `rectangle` + sibling `text` shapes (see Lucid pitfalls below). |
| **Mermaid** | `graph TD` / `flowchart LR` | One concept per node label. Avoid `\n` in node labels — use Mermaid's `<br>` if multi-line is needed. |
| **ASCII** | Strict box-drawing | 80-char width cap. Use ┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼. No mixed glyph styles. |

### Lucid-specific pitfalls (learned the hard way)

- `lucid_create_diagram_from_specification` silently drops `text`, `title`, `TextAreas`, `containerTitle`, and `label` properties on AWS-named shapes/containers (`PublicSubnetAWS2024`, `VirtualPrivateCloudVPCAWS2024`, `ArchAmazonEC2AWS2024`, `GenericGroupAWS2024`, etc.). The shape renders its library default. Custom labels only render on plain `rectangle` / `text` shapes.
- `\n` inside a `text` shape collapses to a space at render time. For multi-line labels, emit two sibling `text` shapes, one per line.
- AWS19 classes (`AmazonEC2AWS19`, `AmazonRDSAWS19`) appear in fetched docs that were hand-authored in the Lucid UI but are NOT accepted by `create_diagram_from_specification` — calls fail with 400. Use AWS2024 classes for create.
- The canonical service-name label below an icon (e.g. "Amazon EC2") cannot be suppressed. Position resource-identity labels ABOVE the icon (`y = icon.y - 24`), not below, so they don't collide with the canonical label.
- Set outer containers `assistedLayout: false` when they hold other containers (nested containers shouldn't be re-laid-out). Leaf-only containers can be `true`.

## 4. Framework-specific rules

### AWS infrastructure topologies

- **Isolation segregation.** Public edge routing, core private application tier, backend secure storage tier sit in visually distinct hemispheres (top/middle/bottom or left/center/right).
- **Explicit connectivity.** Every line has an arrowhead, a protocol/port label where relevant (e.g. `HTTPS:443`, `TCP:5432`), and zero unnecessary intersections. Use elbow connectors and route around containers, not through them.
- **Standardized iconography.** AWS components mapped to the target's official AWS shape library (AWS2024 for Lucid, AWS-official SVGs for HTML). Consistent palette across the whole document.
- **Cross-AZ overlays** for ASGs / RDS clusters / EKS clusters spanning multiple subnets — one container that visually spans both AZ columns, with the cluster's leaf icons centered.

### C4 model hierarchies

- **Horizontal logical flow.** Context (L1) → Container (L2) → Component (L3) reads left → right (or top → bottom for vertical layouts).
- **Progressive disclosure.** Dashed projection lines connect a zoomed-in child diagram back to its parent boundary on the higher tier.
- **Interface/protocol typing.** Every interaction line carries `[protocol]` in brackets (`[JSON/HTTPS]`, `[gRPC]`, `[SQL/TCP]`) plus an active-voice verb ("Queries user records from", "Publishes events to").
- **C4 color identity.**
  - External actor / system → Deep Navy `#1F3864` (or similar)
  - Internal system scope → Mid-tone Azure `#2E75B6`
  - Microservice / container → Light Steel Blue `#9DC3E6`
  - Software component → Soft Gray `#F2F2F2` or white with dark text
- **Legend mandatory.** Every C4 diagram has a "Level & Key" legend block in a corner.

## 5. Failure modes to refuse

- Shipping a diagram without rendering it.
- Using `text` properties on shape classes that probe results have shown silently drop them.
- Flat topologies — services drawn next to each other without a containing VPC/region.
- Color choices that fail WCAG-AA contrast for the rendered label size.
- Skipping the schema when the diagram has more than ~10 nodes — naming drift becomes inevitable.

## 6. When to invoke this skill

Trigger phrases: "draw the architecture", "diagram this", "export to Lucid / Draw.io / Miro", "C4 model", "VPC topology", "network diagram", "system context", "container diagram".

Also self-invoke whenever you find yourself emitting Standard Import JSON, Draw.io XML, Mermaid, or canvas coordinates without having read this skill yet in the current session.
