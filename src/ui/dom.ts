export function element<T extends HTMLElement>(selector: string, root: ParentNode = document): T {
  const result = root.querySelector<T>(selector);
  if (!result) throw new Error(`Missing game element: ${selector}`);
  return result;
}

export const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
export const setText = (node: HTMLElement, text: string) => { if (node.textContent !== text) node.textContent = text; };

/** Fractional wards should not expose floating-point residue in the HUD. */
export function formatAmount(amount: number): string {
  return String(Number(amount.toFixed(1)));
}
