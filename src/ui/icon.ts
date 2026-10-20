/** One renderer for original 24-unit talent/ability line glyphs. */
export function createIcon(pathData: string, className: string): SVGSVGElement {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true'); icon.setAttribute('class', className);
  const path = document.createElementNS(icon.namespaceURI, 'path'); path.setAttribute('d', pathData); icon.append(path);
  return icon;
}
