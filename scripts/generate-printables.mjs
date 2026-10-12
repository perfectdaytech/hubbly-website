// Builds the printable PDFs hosted on the site.
// Run: node scripts/generate-printables.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const LIBRARY_OUT = 'public/printables';
const SUPPLIED_BY_AVA = ['calm-down-cards.pdf', 'family-adventure-bingo.pdf'];

/** @param {string} text */
function esc(text) {
  return text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

/**
 * @param {string[]} commands
 */
function page(commands) {
  const stream = commands.join('\n');
  return { stream, length: Buffer.byteLength(stream) };
}

/**
 * @param {{ title: string, pages: string[][] }} doc
 */
function render(doc) {
  /** @type {string[]} */
  const objects = [];
  let id = 1;
  const catalogId = id++;
  const pagesId = id++;
  const fontId = id++;

  /** @type {number[]} */
  const contentIds = [];
  /** @type {number[]} */
  const pageIds = [];
  for (const commands of doc.pages) {
    const contentId = id++;
    const pageId = id++;
    contentIds.push(contentId);
    pageIds.push(pageId);
    const built = page(commands);
    objects[contentId] = `<< /Length ${built.length} >>\nstream\n${built.stream}\nendstream`;
    objects[pageId] =
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`;
  }

  objects[fontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

  let body = '%PDF-1.4\n';
  /** @type {number[]} */
  const offsets = [0];
  for (let n = 1; n < objects.length; n++) {
    offsets[n] = Buffer.byteLength(body);
    body += `${n} 0 obj\n${objects[n]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length}\n`;
  body += '0000000000 65535 f \n';
  for (let n = 1; n < objects.length; n++) {
    body += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer << /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return body;
}

/** @param {string} text @param {number} size @param {number} x @param {number} y */
function text(textValue, size, x, y) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${esc(textValue)}) Tj ET`;
}

/** @param {string[]} lines @param {number} [size] */
function story(lines, size = 14) {
  /** @type {string[]} */
  const commands = [text('Hubbly', 12, 48, 800)];
  let y = 760;
  for (const line of lines) {
    const heading = line.startsWith('# ');
    const body = heading ? line.slice(2) : line;
    const used = heading ? 18 : size;
    if (heading) y -= 8;
    commands.push(text(body, used, 48, y));
    y -= heading ? 28 : 20;
    if (y < 64) break;
  }
  commands.push(text('PerfectDay Technologies Ltd. For families. Print and colour, or tick as you go.', 9, 48, 40));
  return commands;
}

function wrap(paragraph, width = 64) {
  const words = paragraph.split(' ');
  /** @type {string[]} */
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

/** @param {string} title @param {string[]} paragraphs */
function prosePage(title, paragraphs) {
  /** @type {string[]} */
  const lines = [`# ${title}`];
  for (const paragraph of paragraphs) {
    lines.push(...wrap(paragraph));
    lines.push('');
  }
  return story(lines);
}

function starChart() {
  const lines = ['# Star chart', ...wrap('Goal for this week:'), '', 'Mon  Tue  Wed  Thu  Fri  Sat  Sun', ''];
  for (let row = 1; row <= 4; row++) {
    lines.push(`[ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]`);
  }
  lines.push('', 'A star is for effort. Miss a day and just start again tomorrow.');
  return story(lines);
}

function mascotPage(title, caption) {
  return [
    text('Hubbly', 12, 48, 800),
    text(title, 22, 48, 750),
    text(caption, 12, 48, 720),
    // Simple mascot outlines to colour. No speech bubble.
    '2 w',
    '200 430 80 0 360 arc S',
    '175 470 10 0 360 arc S',
    '225 470 10 0 360 arc S',
    '180 410 m 200 390 220 410 c S',
    '160 360 80 70 0 360 arc S',
    '120 400 m 150 470 l S',
    '280 400 m 250 470 l S',
    '175 300 m 165 220 l S',
    '225 300 m 235 220 l S',
    text('Colour Hubbly. Add a pattern, a hat, or a sunny sky.', 12, 48, 140),
    text('PerfectDay Technologies Ltd. The mascot does not speak.', 9, 48, 40),
  ];
}

const docs = {
  'calmer-mornings-starter.pdf': {
    title: 'Calmer Mornings Starter',
    pages: [
      prosePage('Morning routine', [
        'Tick the steps that belong in your morning. Leave the rest.',
        'Wake. Toilet. Wash face and hands. Get dressed. Breakfast. Shoes and coat. Out the door.',
        'Blank row for a step that is yours:',
        '[ ] ____________________',
      ]),
      prosePage('Bedtime routine', [
        'A short list beats a long negotiation.',
        'Bath or wash. Pyjamas. Teeth. Story. Lights low. Sleep.',
        'Blank row:',
        '[ ] ____________________',
      ]),
      starChart(),
    ],
  },
  'chore-cards.pdf': {
    title: 'Chore Cards',
    pages: [
      prosePage('Chore cards', [
        'Cut these into cards. One card, one job. A blank card is at the end for a job that is yours.',
        'Make the bed.',
        'Lay the table.',
        'Put toys away.',
        'Water the plants.',
        'Feed the pet.',
        'Sort the recycling.',
      ]),
      prosePage('More cards', [
        'Wipe the table.',
        'Put clothes away.',
        'Carry a shopping bag.',
        'Tidy the shoes.',
        'Check the family calendar.',
        'Blank card: ____________________',
      ]),
    ],
  },
  'colour-in-mascot.pdf': {
    title: 'Colour-in mascot sheets',
    pages: [
      mascotPage('Colour-in sheet 1', 'Hubbly on a quiet morning.'),
      mascotPage('Colour-in sheet 2', 'Hubbly under a big sun.'),
      mascotPage('Colour-in sheet 3', 'Hubbly with space for your own pattern.'),
    ],
  },
  'family-cleaning-day.pdf': {
    title: 'Family Cleaning Day',
    pages: [
      prosePage('Picture sheet', [
        'A Saturday plan the whole family can see.',
        'Shoes away. Toys in the basket. Table cleared. Recycling to the door. One kind job for a grown-up.',
        '[ ] ____________________   [ ] ____________________   [ ] ____________________',
      ]),
      prosePage('Grown-ups plan', [
        'Keep it to one hour. Pick three jobs, not thirty.',
        'Who is doing what, and when you stop for a drink.',
        'Job 1 ____________________',
        'Job 2 ____________________',
        'Job 3 ____________________',
        'Stop time ____________________',
      ]),
    ],
  },
  'wind-down-cards.pdf': {
    title: 'Wind-down cards',
    pages: [
      prosePage('Six bedtime cards', [
        'Cut them out. Turn one over at a time.',
        '1. Bath or a warm wash.',
        '2. Pyjamas.',
        '3. Story.',
        '4. Three slow breaths together.',
        '5. A cuddle.',
        '6. Lights low.',
      ]),
    ],
  },
  'advent-kindness-stars.pdf': {
    title: 'Advent kindness stars',
    pages: [
      prosePage('24 small kind things', [
        'Colour one star a day through December. Not a present. Just a small kind thing.',
        '1 Say good morning. 2 Hold a door. 3 Draw a picture for someone. 4 Tidy one surface. 5 Share a snack. 6 Text a grandparent. 7 Let someone else choose the story. 8 Water a plant.',
        '9 Make a card. 10 Pick up litter on a walk. 11 Tell someone what they are good at. 12 Set the table. 13 Leave a kind note. 14 Feed the birds. 15 Thank a shop worker. 16 Read to someone.',
        '17 Give a hug. 18 Sort the recycling. 19 Make a hot drink for a grown-up. 20 Share a toy. 21 Say sorry if you need to. 22 Help carry something. 23 Tell a joke. 24 Say what you liked about today.',
      ]),
    ],
  },
  'christmas-holidays-routine.pdf': {
    title: 'Christmas holidays routine',
    pages: [
      prosePage('A loose holiday rhythm', [
        'School is out. Keep a soft shape to the day, not a strict timetable.',
        'Wake window ____________________',
        'Fresh air ____________________',
        'One job ____________________',
        'Quiet time ____________________',
        'Bed window ____________________',
      ]),
      prosePage('Boredom busters', [
        'Build a den. Bake something simple. A board game. A walk to the same tree. Draw the weather. Write a letter. Sort old toys to give away. Dance in the kitchen.',
        'Add your own: ____________________',
      ]),
    ],
  },
  'january-family-reset.pdf': {
    title: 'January family reset',
    pages: [
      prosePage('A fresh page, not a new personality', [
        'Five short pages you can fill in an evening.',
        'One family aim for this month: ____________________',
        'A weekly rhythm: which nights are busy, which night is quiet.',
        'Mon ____ Tue ____ Wed ____ Thu ____ Fri ____ Sat ____ Sun ____',
      ]),
      prosePage('Jobs, rewards, habits', [
        'Chore rota: who, which job, which day.',
        'Reward shop: three things that cost stars, written by you. Stars are for effort.',
        'One habit to keep. One habit to drop.',
      ]),
    ],
  },
  'screen-time-star-tokens.pdf': {
    title: 'Screen-time star tokens',
    pages: [
      prosePage('Earn and spend', [
        'Screens cost stars you have already earned. Agree the price before you start.',
        '30 minutes of a screen costs ____ stars.',
        'Stars are earned from the jobs you already do. They are not a fight.',
      ]),
      prosePage('Family screen agreement', [
        'Where screens stay at bedtime: ____________________',
        'Who can change the agreement: the grown-ups.',
        'Review date: ____________________',
        'Signed: ____________________',
      ]),
    ],
  },
  'sick-day-tracker.pdf': {
    title: 'Sick-day tracker',
    pages: [
      prosePage('When someone is poorly', [
        'Write the time, what you gave, and how they seem. Follow the dose on the packet, or your pharmacist or GP. Call 111 if you are worried.',
        'Name ____________________  Date ____________________',
        'Time ______  What ______  How they seem ______',
        'Time ______  What ______  How they seem ______',
        'Time ______  What ______  How they seem ______',
        'Temperature, if you take it: ______  ______  ______',
        'A small thing that helped: ____________________',
      ]),
    ],
  },
  'half-term-planner.pdf': {
    title: 'Half-term planner',
    pages: [
      prosePage('Five days off', [
        'One page so the week does not disappear.',
        'Day 1 ____________________',
        'Day 2 ____________________',
        'Day 3 ____________________',
        'Day 4 ____________________',
        'Day 5 ____________________',
      ]),
      prosePage('Rainy-day ideas', [
        'Den. Library. Baking. A puzzle. A film with the lights low. Draw your street. Sort a drawer. Phone someone you miss.',
        'Your ideas: ____________________',
      ]),
    ],
  },
};

for (const name of SUPPLIED_BY_AVA) {
  if (Object.hasOwn(docs, name)) {
    throw new Error(`${name} is supplied by Ava and must not be generated.`);
  }
}

await mkdir(LIBRARY_OUT, { recursive: true });
for (const [name, doc] of Object.entries(docs)) {
  await writeFile(path.join(LIBRARY_OUT, name), render(doc));
}
console.log(`Wrote library printables to ${LIBRARY_OUT}`);
