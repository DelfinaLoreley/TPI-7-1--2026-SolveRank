import assert from 'node:assert/strict';
import { DOMParser } from '@xmldom/xmldom';

export function parseSvg(svg) {
  const issues = [];
  const document = new DOMParser({
    errorHandler: { warning: message => issues.push(message), error: message => issues.push(message), fatalError: message => issues.push(message) },
  }).parseFromString(svg, 'image/svg+xml');
  assert.deepEqual(issues, []);
  assert.equal(document.documentElement.localName, 'svg');
  assert.equal(document.documentElement.namespaceURI, 'http://www.w3.org/2000/svg');
  assert.ok(document.documentElement.getAttribute('viewBox'));
  assert.equal(document.getElementsByTagName('script').length, 0);
  assert.equal(document.getElementsByTagName('image').length, 0);
  return document;
}

export function canonicalSvg(svg, { unorderedSiblings = false } = {}) {
  const document = parseSvg(svg);
  function visit(element) {
    const attributes = [];
    for (let i = 0; i < element.attributes.length; i++) {
      const attribute = element.attributes.item(i);
      const normalized = attribute.value.startsWith('#') ? attribute.value :
        attribute.value.replace(/[-+]?(?:\d*\.)?\d+(?:[Ee][-+]?\d+)?/gu, number => String(Number(Number(number).toFixed(7))));
      const value = attribute.name === 'style'
        ? normalized.split(';').map(declaration => declaration.trim()).filter(Boolean).sort().join(';')
        : normalized;
      attributes.push([attribute.name, value]);
    }
    attributes.sort(([a], [b]) => a.localeCompare(b));
    const children = [];
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes.item(i);
      if (child.nodeType === 1) children.push(visit(child));
      else if (child.nodeType === 3 && child.data.trim()) children.push(child.data.trim());
    }
    if (unorderedSiblings) children.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return [element.tagName, attributes, children];
  }
  return visit(document.documentElement);
}
