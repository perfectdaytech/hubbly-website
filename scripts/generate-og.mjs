/* Generates the social-share (Open Graph) image at public/og-image.png.
   Run once with: node scripts/generate-og.mjs
   Pure-vector → rasterised with sharp, so it stays crisp and on-brand. */
import sharp from 'sharp';

const W = 1200;
const H = 630;

// The Hubbly house mark as a reusable group (64-unit space, scaled on use).
const houseMark = `
  <g>
    <g fill="#88D9C0">
      <circle cx="46" cy="50" r="7"/><circle cx="53" cy="51" r="5.5"/><circle cx="50" cy="46" r="5"/>
    </g>
    <path d="M14 39.4l2 4 4.4.6-3.2 3 .8 4.4-3.9-2-3.9 2 .8-4.4-3.2-3 4.4-.6z" fill="#FFD166"/>
    <rect x="18" y="30" width="28" height="22" rx="6" fill="#FBF0DA"/>
    <path d="M11.5 31.5 32 13l20.5 18.5a3 3 0 0 1-2 5.2H13.5a3 3 0 0 1-2-5.2Z" fill="#F4836F"/>
    <rect x="39" y="17" width="5.2" height="9" rx="2" fill="#E9705E"/>
    <path d="M32 29.4c-2.4-2.6-5.6-1.2-5.6 1.4 0 2 2.2 3.6 5.6 6 3.4-2.4 5.6-4 5.6-6 0-2.6-3.2-4-5.6-1.4Z" fill="#FFF6E6"/>
    <path d="M28 52v-6.5a4 4 0 0 1 8 0V52Z" fill="#F4836F"/>
    <circle cx="26.5" cy="39.5" r="1.7" fill="#2D3142"/>
    <circle cx="37.5" cy="39.5" r="1.7" fill="#2D3142"/>
    <path d="M28.8 43.2a4 4 0 0 0 6.4 0" fill="none" stroke="#2D3142" stroke-width="1.8" stroke-linecap="round"/>
  </g>`;

const star = (x, y, s, fill, op = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" opacity="${op}"
     d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.3 5 21.1l1.4-6.8L1.3 9.7l6.9-.7z" fill="${fill}"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF8EE"/><stop offset="1" stop-color="#FBEFD8"/>
    </linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="42"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1110" cy="70" r="300" fill="#FFB088" opacity="0.26" filter="url(#soft)"/>
  <circle cx="120" cy="610" r="320" fill="#88D9C0" opacity="0.24" filter="url(#soft)"/>
  <circle cx="930" cy="320" r="250" fill="#FFD166" opacity="0.30" filter="url(#soft)"/>

  ${star(150, 120, 1.7, '#FFD166', 0.8)}
  ${star(560, 92, 1.1, '#C5A3FF', 0.7)}
  ${star(112, 430, 1.3, '#7FC8E4', 0.7)}
  ${star(640, 520, 1.5, '#FF6B6B', 0.55)}

  <!-- house mark, right side -->
  <g transform="translate(742 122) scale(5.85)">${houseMark}</g>

  <!-- wordmark -->
  <text x="92" y="298" font-family="Trebuchet MS, Verdana, sans-serif" font-size="132"
    font-weight="700" fill="#2D3142" letter-spacing="-3">hubbly</text>
  <rect x="96" y="330" width="232" height="12" rx="6" fill="#FF6B6B" opacity="0.9"/>

  <!-- tagline -->
  <text x="96" y="416" font-family="Trebuchet MS, Verdana, sans-serif" font-size="42"
    font-weight="600" fill="#2D3142">A happy little home</text>
  <text x="96" y="470" font-family="Trebuchet MS, Verdana, sans-serif" font-size="42"
    font-weight="600" fill="#4A4F66">for your family's day <tspan fill="#FF6B6B">&#9829;</tspan></text>

  <!-- url pill -->
  <rect x="96" y="520" width="300" height="58" rx="29" fill="#2D3142"/>
  <text x="246" y="558" text-anchor="middle" font-family="Trebuchet MS, Verdana, sans-serif"
    font-size="26" font-weight="700" fill="#FFF8EE">gethubbly.app</text>
</svg>`;

const out = new URL('../public/og-image.png', import.meta.url);
await sharp(Buffer.from(svg)).png({ quality: 92 }).toFile(out.pathname.replace(/^\//, ''));
console.log('✓ og-image.png written to public/');
