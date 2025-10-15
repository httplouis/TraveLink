export function isTypingTarget(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName?.toLowerCase();
  if (t.isContentEditable) return true;
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  const role = t.getAttribute?.("role");
  if (role && role.toLowerCase() === "textbox") return true;
  return false;
}
