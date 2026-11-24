/** Returns the payee name of a valid UPI pay link, or null if it cannot take a payment. Safe for client code. */
export function upiPayee(value?: string): string | null {
  if (!value?.startsWith("upi://pay?") || !URL.canParse(value)) return null;
  const params = new URL(value).searchParams;
  return params.get("pa") ? (params.get("pn") ?? "") : null;
}
