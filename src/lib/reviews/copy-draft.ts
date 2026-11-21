export async function copyDraft(
  text: string,
  clipboard: Pick<Clipboard, "writeText"> | undefined
): Promise<boolean> {
  if (!clipboard) return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Synchronous copy for browsers that block the Clipboard API. A read-only field keeps the keyboard closed. */
export function copyViaCommand(text: string, doc: Document = document): boolean {
  const field = doc.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  Object.assign(field.style, { position: "fixed", top: "0", left: "0", opacity: "0" });
  doc.body.appendChild(field);
  try {
    field.select();
    field.setSelectionRange(0, text.length);
    return doc.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
  }
}
