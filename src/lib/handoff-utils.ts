/**
 * Detects whether a HANDOFF doc has grown past the recommended character budget.
 *
 * Design note: apex_synthesize is only callable from within an agent turn via MCP
 * transport — not in-process from server-side code. This helper avoids that coupling
 * entirely. Instead it returns a ready-to-emit instruction string the PO can include
 * in a [[DISPATCH]] so the target role self-summarizes via a [[NOTES]] block.
 */
export function summarizeHandoff(
  doc: string,
  maxChars = 8000,
): { needsSummarization: boolean; instruction: string } {
  const needsSummarization = doc.length > maxChars;
  const instruction = needsSummarization
    ? `Your HANDOFF doc (${doc.length} chars) exceeds the ${maxChars}-char budget. Emit a [[NOTES]] block that replaces it with a compact summary. Preserve: open next-steps, blockers, parked items. Compress completed work into 1-2 sentences. Target ≤6000 characters.`
    : "";
  return { needsSummarization, instruction };
}
