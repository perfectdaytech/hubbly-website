// Keyboard users need a focusable region to scroll a wide legal table.

/** @param {import('hast').Element | import('hast').Root} node */
function textOf(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (!('children' in node) || !node.children) return '';
  return node.children.map((child) => textOf(child)).join('');
}

/** @param {import('hast').Element} table */
function labelFor(table) {
  const header = textOf(table).slice(0, 120);
  if (header.includes('Expiry')) return 'Cookie table';
  if (header.includes('Provider')) return 'Service providers';
  return 'Scrollable table';
}

/** @param {import('hast').Root | import('hast').Element} node */
function wrap(node) {
  if (!node || !('children' in node) || !node.children) return;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === 'element' && child.tagName === 'table') {
      node.children[i] = {
        type: 'element',
        tagName: 'div',
        properties: {
          tabIndex: 0,
          role: 'region',
          ariaLabel: labelFor(child),
          className: ['legal-scroll'],
        },
        children: [child],
      };
    } else if (child.type === 'element') {
      wrap(child);
    }
  }
}

export function rehypeScrollRegion() {
  return (tree) => {
    wrap(tree);
  };
}
