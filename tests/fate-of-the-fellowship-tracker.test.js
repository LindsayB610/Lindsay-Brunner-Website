/**
 * Tests for the Fate of the Fellowship tracker.
 *
 * Current coverage:
 * - Phase 1 scaffold and published-page guard
 * - Phase 2 exact hero/objective metadata and session validation contracts
 * - Phase 3 custom rendered tracker shell and empty-state rendering
 * - Phase 4 populated aggregate rendering with temporary fixture sessions
 * - Phase 5 image contract and lightbox markup
 * - Phase 6 scoped visual design and browser render checks
 */

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const yaml = require('js-yaml');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const contentPath = path.join(root, 'content', 'fate-of-the-fellowship', '_index.md');
const heroesPath = path.join(root, 'data', 'fate-of-the-fellowship', 'heroes.yaml');
const objectivesPath = path.join(root, 'data', 'fate-of-the-fellowship', 'objectives.yaml');
const sessionsDir = path.join(root, 'data', 'fate-of-the-fellowship', 'sessions');
const sessionPhotosDir = path.join(root, 'static', 'images', 'fate-of-the-fellowship', 'session-photos');
const sectionBorderPath = path.join(root, 'static', 'images', 'fate-of-the-fellowship', 'scrollwork-section-border.svg');
const cardBorderPath = path.join(root, 'static', 'images', 'fate-of-the-fellowship', 'scrollwork-card-border.svg');
const titleDividerPath = path.join(root, 'static', 'images', 'fate-of-the-fellowship', 'scrollwork-title-divider.svg');
const kenneyAssetsDir = path.join(root, 'static', 'images', 'fate-of-the-fellowship', 'kenney');
const kenneyNoticePath = path.join(kenneyAssetsDir, 'KENNEY-FANTASY-UI-BORDERS-NOTICE.txt');
const kenneyRequiredAssetPaths = [
  'frame-hero-gold.png',
  'frame-section-gold.png',
  'frame-card-gold.png',
  'panel-hero-parchment.png',
  'panel-card-parchment.png',
  'divider-green.png',
  'divider-gold.png',
].map((file) => path.join(kenneyAssetsDir, file));
const docsPath = path.join(root, 'docs', 'fate-of-the-fellowship-tracker.md');
const planPath = path.join(root, 'docs', 'fate-of-the-fellowship-tracker-plan.md');
const readmePath = path.join(root, 'README.md');
const headerPath = path.join(root, 'layouts', 'partials', 'header.html');
const footerPath = path.join(root, 'layouts', 'partials', 'footer.html');
const layoutPath = path.join(root, 'layouts', 'fate-of-the-fellowship', 'list.html');
const customCssPath = path.join(root, 'static', 'css', 'custom.css');
const renderedPagePath = path.join(root, 'public', 'fate-of-the-fellowship', 'index.html');
const TEMP_FIXTURE_IMAGE_PATH = '/images/fate-of-the-fellowship/session-photos/2026-06-12-win-test-fixture.jpg';
const TEMP_NON_PROGRESSIVE_IMAGE_PATH = '/images/fate-of-the-fellowship/session-photos/2026-06-12-win-non-progressive-test-fixture.jpg';
const TEMP_PNG_IMAGE_PATH = '/images/fate-of-the-fellowship/session-photos/2026-06-12-win-png-test-fixture.png';
const MAX_SESSION_IMAGE_BYTES = 1024 * 1024;
const MAX_SESSION_IMAGE_DIMENSION = 2400;
const SESSION_IMAGE_WIDTH = 2400;
const SESSION_IMAGE_HEIGHT = 1350;
const TEMP_FIXTURE_SESSIONS = {
  '2026-06-12-win.yaml': {
    date: '2026-06-12',
    result: 'win',
    players: 3,
    heroes: ['Legolas', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Challenge Sauron'],
    final_state_image: TEMP_FIXTURE_IMAGE_PATH,
    note: 'The fellowship kept its nerve at the edge of the fire.',
  },
  '2026-06-01-win.yaml': {
    date: '2026-06-01',
    result: 'win',
    players: 3,
    heroes: ['Legolas', 'Gimli'],
    objectives: ['Destroy the One Ring', 'Challenge Sauron'],
    note: 'A hard road, but the Shadow broke before the company did.',
  },
  '2026-05-30-loss.yaml': {
    date: '2026-05-30',
    result: 'loss',
    players: 2,
    heroes: ['Aragorn', 'Boromir'],
    objectives: ['Destroy the One Ring', 'Infiltrate Minas Morgul'],
    note: 'The road bent toward Minas Morgul and did not bend back.',
  },
};
const EXPECTED_HEROES = [
  { key: 'legolas', name: 'Legolas' },
  { key: 'arwen', name: 'Arwen' },
  { key: 'faramir', name: 'Faramir' },
  { key: 'eowyn', name: 'Eowyn' },
  { key: 'frodo-and-sam', name: 'Frodo & Sam' },
  { key: 'galadriel', name: 'Galadriel' },
  { key: 'gandalf', name: 'Gandalf' },
  { key: 'eomer', name: 'Eomer' },
  { key: 'gimli', name: 'Gimli' },
  { key: 'aragorn', name: 'Aragorn' },
  { key: 'merry-and-pippin', name: 'Merry & Pippin' },
  { key: 'gollum', name: 'Gollum' },
  { key: 'boromir', name: 'Boromir' },
];

const EXPECTED_OBJECTIVES = [
  { key: 'destroy-the-one-ring', name: 'Destroy the One Ring', required: true },
  { key: 'bring-light-to-mirkwood', name: 'Bring Light to Mirkwood' },
  { key: 'hobbits-pledge-their-loyalty', name: 'Hobbits Pledge Their Loyalty' },
  { key: 'ride-with-the-eored', name: 'Ride with the Eored' },
  { key: 'free-theodens-mind', name: "Free Theoden's Mind" },
  { key: 'lay-bare-the-pits', name: 'Lay Bare the Pits' },
  { key: 'unseat-denethor', name: 'Unseat Denethor' },
  { key: 'oathbreakers-fulfil-their-duty', name: 'Oathbreakers Fulfil their Duty' },
  { key: 'shieldmaiden-no-longer', name: 'Shieldmaiden No Longer' },
  { key: 'arwen-unfurls-the-banner', name: 'Arwen Unfurls the Banner' },
  { key: 'boromir-reclaims-his-honor', name: 'Boromir Reclaims his Honor' },
  { key: 'deal-with-frecas-heirs', name: "Deal with Freca's Heirs" },
  { key: 'lift-shadow-from-dwarven-lands', name: 'Lift Shadow from Dwarven Lands' },
  { key: 'attain-the-blessing-of-the-elves', name: 'Attain the Blessing of the Elves' },
  { key: 'saruman-your-staff-is-broken', name: 'Saruman Your Staff is Broken' },
  { key: 'avenge-balin', name: 'Avenge Balin' },
  { key: 'rangers-secure-eriador', name: 'Rangers Secure Eriador' },
  { key: 'challenge-sauron', name: 'Challenge Sauron' },
  { key: 'subdue-umbar', name: 'Subdue Umbar' },
  { key: 'confront-the-balrog', name: 'Confront the Balrog' },
  { key: 'shelobs-lair', name: "Shelob's Lair" },
  { key: 'secure-the-crossing-of-the-anduin', name: 'Secure the Crossing of the Anduin' },
  { key: 'that-makes-six', name: 'That Makes Six' },
  { key: 'infiltrate-minas-morgul', name: 'Infiltrate Minas Morgul' },
];

const ALLOWED_RESULTS = ['win', 'loss'];
const ALLOWED_PLAYERS = [1, 2, 3, 4, 5];
const SESSION_FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}-(win|loss)\.ya?ml$/;

function loadYamlFile(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

function extractFrontMatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return null;
  }

  return yaml.load(match[1]);
}

function assert(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });

  return Array.from(duplicates);
}

function normalizeText(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(value) {
  return normalizeText(
    value
      .replace(/<span[^>]*class=(?:"fate-amp"|'fate-amp'|fate-amp)[^>]*><\/span>/gi, ' & ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function runHugoBuild() {
  childProcess.execFileSync('hugo', ['--gc', '--minify', '--cleanDestinationDir'], {
    cwd: root,
    stdio: 'pipe',
  });
}

async function screenshotHasVisualContent(screenshotBuffer) {
  const { data, info } = await sharp(screenshotBuffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const totals = [0, 0, 0];
  const mins = [255, 255, 255];
  const maxes = [0, 0, 0];
  const pixelCount = info.width * info.height;

  for (let index = 0; index < data.length; index += 3) {
    for (let channel = 0; channel < 3; channel += 1) {
      const value = data[index + channel];
      totals[channel] += value;
      mins[channel] = Math.min(mins[channel], value);
      maxes[channel] = Math.max(maxes[channel], value);
    }
  }

  const average = totals.reduce((sum, total) => sum + total, 0) / (pixelCount * 3);
  const range = Math.max(...maxes) - Math.min(...mins);

  return average > 4 && average < 251 && range > 24;
}

function writeTempFixtureSessions() {
  Object.entries(TEMP_FIXTURE_SESSIONS).forEach(([file, session]) => {
    fs.writeFileSync(path.join(sessionsDir, file), yaml.dump(session, { lineWidth: -1 }), 'utf8');
  });
}

function getSessionFiles() {
  return fs
    .readdirSync(sessionsDir)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'));
}

async function withRealSessionFilesHidden(callback) {
  const sessionFiles = getSessionFiles();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fate-session-files-'));
  const movedFiles = [];

  try {
    sessionFiles.forEach((file) => {
      const originalPath = path.join(sessionsDir, file);
      const tempPath = path.join(tempDir, file);
      fs.renameSync(originalPath, tempPath);
      movedFiles.push({ originalPath, tempPath });
    });

    await callback();
  } finally {
    movedFiles.forEach(({ originalPath, tempPath }) => {
      if (fs.existsSync(tempPath)) {
        fs.renameSync(tempPath, originalPath);
      }
    });
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function writeTempFixtureImage() {
  fs.mkdirSync(sessionPhotosDir, { recursive: true });
  await sharp({
    create: {
      width: SESSION_IMAGE_WIDTH,
      height: SESSION_IMAGE_HEIGHT,
      channels: 3,
      background: '#4f6b3a',
    },
  })
    .jpeg({
      quality: 72,
      progressive: true,
    })
    .toFile(path.join(root, 'static', TEMP_FIXTURE_IMAGE_PATH.replace(/^\//, '')));
}

async function writeInvalidTempFixtureImages() {
  fs.mkdirSync(sessionPhotosDir, { recursive: true });
  await sharp({
    create: {
      width: SESSION_IMAGE_WIDTH,
      height: SESSION_IMAGE_HEIGHT,
      channels: 3,
      background: '#4f6b3a',
    },
  })
    .jpeg({
      quality: 72,
      progressive: false,
    })
    .toFile(path.join(root, 'static', TEMP_NON_PROGRESSIVE_IMAGE_PATH.replace(/^\//, '')));

  await sharp({
    create: {
      width: SESSION_IMAGE_WIDTH,
      height: SESSION_IMAGE_HEIGHT,
      channels: 3,
      background: '#4f6b3a',
    },
  })
    .png()
    .toFile(path.join(root, 'static', TEMP_PNG_IMAGE_PATH.replace(/^\//, '')));
}

function removeTempFixtureSessions() {
  Object.keys(TEMP_FIXTURE_SESSIONS).forEach((file) => {
    const filePath = path.join(sessionsDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

function removeTempFixtureImage() {
  [
    TEMP_FIXTURE_IMAGE_PATH,
    TEMP_NON_PROGRESSIVE_IMAGE_PATH,
    TEMP_PNG_IMAGE_PATH,
  ].forEach((imagePath) => {
    const filePath = path.join(root, 'static', imagePath.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

function validateMetadataItems(label, actualItems, expectedItems, errors) {
  assert(Array.isArray(actualItems), `${label}.yaml must expose an items array`, errors);

  if (!Array.isArray(actualItems)) {
    return;
  }

  assert(actualItems.length === expectedItems.length, `${label}.yaml must include ${expectedItems.length} item(s)`, errors);

  const actualKeys = actualItems.map((item) => item?.key);
  const actualNames = actualItems.map((item) => item?.name);
  const expectedKeys = expectedItems.map((item) => item.key);
  const expectedNames = expectedItems.map((item) => item.name);

  findDuplicates(actualKeys).forEach((key) => {
    errors.push(`${label}.yaml contains duplicate key "${key}"`);
  });
  findDuplicates(actualNames).forEach((name) => {
    errors.push(`${label}.yaml contains duplicate name "${name}"`);
  });

  actualItems.forEach((item, index) => {
    assert(item && typeof item === 'object' && !Array.isArray(item), `${label}.yaml item ${index} must be an object`, errors);
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return;
    }

    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.key || ''), `${label}.yaml item "${item.name || index}" has invalid key "${item.key}"`, errors);
    assert(typeof item.name === 'string' && item.name.trim() !== '', `${label}.yaml item "${item.key || index}" must have a non-empty name`, errors);
  });

  expectedKeys.forEach((expectedKey) => {
    assert(actualKeys.includes(expectedKey), `${label}.yaml is missing expected key "${expectedKey}"`, errors);
  });
  expectedNames.forEach((expectedName) => {
    assert(actualNames.includes(expectedName), `${label}.yaml is missing expected name "${expectedName}"`, errors);
  });

  expectedItems.forEach((expectedItem) => {
    const actualItem = actualItems.find((item) => item?.key === expectedItem.key);
    assert(
      actualItem?.name === expectedItem.name,
      `${label}.yaml key "${expectedItem.key}" must be paired with name "${expectedItem.name}"`,
      errors
    );
  });
}

function validateSession({ file, session, heroNames, objectiveNames }) {
  const errors = [];
  const requiredFields = ['date', 'result', 'players', 'heroes', 'objectives', 'note'];

  requiredFields.forEach((field) => {
    assert(field in session, `Session "${file}" is missing required field "${field}"`, errors);
  });

  assert(SESSION_FILENAME_REGEX.test(file), `Session filename does not match expected format: ${file}`, errors);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(session.date || ''), `Session "${file}" has invalid date "${session.date}"`, errors);
  assert(ALLOWED_RESULTS.includes(session.result), `Session "${file}" has invalid result "${session.result}"`, errors);
  assert(ALLOWED_PLAYERS.includes(Number(session.players)), `Session "${file}" has invalid players "${session.players}"`, errors);
  assert(Array.isArray(session.heroes) && session.heroes.length > 0, `Session "${file}" must include at least one hero`, errors);
  assert(Array.isArray(session.objectives) && session.objectives.length > 0, `Session "${file}" must include at least one objective`, errors);
  assert(typeof session.note === 'string' && session.note.trim() !== '', `Session "${file}" must have a non-empty note`, errors);

  if (SESSION_FILENAME_REGEX.test(file)) {
    const filenameBase = file.replace(/\.ya?ml$/, '');
    const filenameParts = filenameBase.split('-');
    const filenameDate = filenameParts.slice(0, 3).join('-');
    const filenameResult = filenameParts[filenameParts.length - 1];

    assert(session.date === filenameDate, `Session "${file}" date "${session.date}" does not match filename date "${filenameDate}"`, errors);
    assert(session.result === filenameResult, `Session "${file}" result "${session.result}" does not match filename result "${filenameResult}"`, errors);
  }

  if (Array.isArray(session.heroes)) {
    session.heroes.forEach((hero) => {
      assert(heroNames.has(hero), `Session "${file}" references unknown hero "${hero}"`, errors);
    });
  }

  if (Array.isArray(session.objectives)) {
    session.objectives.forEach((objective) => {
      assert(objectiveNames.has(objective), `Session "${file}" references unknown objective "${objective}"`, errors);
    });
    assert(
      session.objectives.includes('Destroy the One Ring'),
      `Session "${file}" must include required objective "Destroy the One Ring"`,
      errors
    );
  }

  if (
    'final_state_image' in session &&
    (
      typeof session.final_state_image !== 'string' ||
      session.final_state_image.trim() === '' ||
      !session.final_state_image.startsWith('/')
    )
  ) {
    errors.push(`Session "${file}" has an invalid final_state_image path`);
  }

  return errors;
}

async function validateSessionImage({ file, session }) {
  const errors = [];

  if (typeof session.final_state_image !== 'string' || !session.final_state_image.startsWith('/')) {
    return errors;
  }

  const imagePath = path.join(root, 'static', session.final_state_image.replace(/^\//, ''));
  if (!fs.existsSync(imagePath)) {
    errors.push(`Session "${file}" references missing final_state_image "${session.final_state_image}"`);
    return errors;
  }

  const imageStats = fs.statSync(imagePath);
  if (imageStats.size > MAX_SESSION_IMAGE_BYTES) {
    errors.push(`Session "${file}" final_state_image exceeds ${MAX_SESSION_IMAGE_BYTES} bytes: "${session.final_state_image}"`);
  }

  try {
    const metadata = await sharp(imagePath).metadata();
    if (metadata.format !== 'jpeg') {
      errors.push(`Session "${file}" final_state_image must be a JPEG: "${session.final_state_image}" is ${metadata.format}`);
    }

    if (metadata.isProgressive !== true) {
      errors.push(`Session "${file}" final_state_image must be progressive JPEG: "${session.final_state_image}"`);
    }

    if (
      metadata.width > MAX_SESSION_IMAGE_DIMENSION ||
      metadata.height > MAX_SESSION_IMAGE_DIMENSION
    ) {
      errors.push(`Session "${file}" final_state_image exceeds ${MAX_SESSION_IMAGE_DIMENSION}px max dimension: "${session.final_state_image}"`);
    }

    if (
      metadata.width !== SESSION_IMAGE_WIDTH ||
      metadata.height !== SESSION_IMAGE_HEIGHT
    ) {
      errors.push(`Session "${file}" final_state_image must be ${SESSION_IMAGE_WIDTH}x${SESSION_IMAGE_HEIGHT}: "${session.final_state_image}" is ${metadata.width}x${metadata.height}`);
    }
  } catch (error) {
    errors.push(`Session "${file}" final_state_image could not be inspected: "${session.final_state_image}" (${error.message})`);
  }

  return errors;
}

async function main() {
  console.log('🧭 Testing Fate of the Fellowship tracker...\n');

  const errors = [];
  let heroNames = new Set();
  let objectiveNames = new Set();

  console.log('📁 Checking scaffold files...');
  [
    contentPath,
    heroesPath,
    objectivesPath,
    sessionsDir,
    sessionPhotosDir,
    sectionBorderPath,
    cardBorderPath,
    titleDividerPath,
    kenneyNoticePath,
    ...kenneyRequiredAssetPaths,
    docsPath,
    planPath,
    customCssPath,
  ].forEach((targetPath) => {
    assert(fs.existsSync(targetPath), `Missing scaffold path: ${targetPath}`, errors);
  });

  if (errors.length === 0) {
    console.log('   ✓ Required scaffold paths exist');
  }

  console.log('\n📄 Validating content front matter...');
  if (fs.existsSync(contentPath)) {
    const content = fs.readFileSync(contentPath, 'utf8');
    const frontMatter = extractFrontMatter(content);

    assert(frontMatter, 'Fate content file must include YAML front matter', errors);
    if (frontMatter) {
      assert(frontMatter.title === 'Fate of the Fellowship', 'Fate content title should stay stable', errors);
      assert(
        typeof frontMatter.description === 'string' && frontMatter.description.includes('inn ledger'),
        'Fate content description should frame the page as an inn ledger',
        errors
      );
      assert(frontMatter.draft !== true, 'Fate content should publish once the custom tracker layout exists', errors);
    }

    assert(
      content.includes('fellowship ledger') && content.includes('whether the Ring made it to the fire'),
      'Fate content body should introduce the tracker premise',
      errors
    );

    if (!errors.some((error) => error.includes('Fate content'))) {
      console.log('   ✓ Content front matter is valid');
    }
  }

  console.log('\n🗂️  Validating hero and objective metadata...');
  if (fs.existsSync(heroesPath)) {
    const heroMetadata = loadYamlFile(heroesPath);
    assert(heroMetadata && typeof heroMetadata === 'object' && !Array.isArray(heroMetadata), 'heroes.yaml must be an object', errors);
    validateMetadataItems('heroes', heroMetadata?.items, EXPECTED_HEROES, errors);
    heroNames = new Set((heroMetadata?.items || []).map((item) => item.name));
  }

  if (fs.existsSync(objectivesPath)) {
    const objectiveMetadata = loadYamlFile(objectivesPath);
    assert(objectiveMetadata && typeof objectiveMetadata === 'object' && !Array.isArray(objectiveMetadata), 'objectives.yaml must be an object', errors);
    validateMetadataItems('objectives', objectiveMetadata?.items, EXPECTED_OBJECTIVES, errors);
    objectiveNames = new Set((objectiveMetadata?.items || []).map((item) => item.name));

    const requiredObjectives = (objectiveMetadata?.items || []).filter((item) => item.required === true);
    assert(requiredObjectives.length === 1, 'objectives.yaml must mark exactly one required objective', errors);
    assert(requiredObjectives[0]?.name === 'Destroy the One Ring', 'Destroy the One Ring must be the required objective', errors);
  }

  if (!errors.some((error) => error.includes('heroes.yaml') || error.includes('objectives.yaml'))) {
    console.log('   ✓ Metadata files match transcribed card text');
  }

  console.log('\n🧾 Validating sessions directory...');
  if (fs.existsSync(sessionsDir)) {
    const sessionFiles = getSessionFiles();

    assert(fs.existsSync(path.join(sessionsDir, '.gitkeep')), 'Fate sessions directory should include .gitkeep', errors);
    assert(sessionFiles.length > 0, 'Fate sessions directory should include at least one real or placeholder session file', errors);

    sessionFiles.forEach((file) => {
      const session = loadYamlFile(path.join(sessionsDir, file));
      errors.push(...validateSession({ file, session, heroNames, objectiveNames }));
    });
    for (const file of sessionFiles) {
      const session = loadYamlFile(path.join(sessionsDir, file));
      errors.push(...await validateSessionImage({ file, session }));
    }

    if (!errors.some((error) => error.includes('sessions directory') || error.includes('Session "'))) {
      console.log('   ✓ Real session files validate against the tracker contract');
    }
  }

  console.log('\n🧪 Validating session rules...');
  const validSession = {
    date: '2026-06-12',
    result: 'win',
    players: 3,
    heroes: ['Legolas', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Challenge Sauron'],
    note: 'Short recap.',
  };
  const invalidSessionErrors = validateSession({
    file: '2026-06-12-victory.yaml',
    session: {
      ...validSession,
      result: 'victory',
      players: 6,
      heroes: ['Bilbo'],
      objectives: ['Make Second Breakfast'],
      final_state_image: 'relative/path.jpg',
    },
    heroNames,
    objectiveNames,
  });
  const missingRequiredObjectiveErrors = validateSession({
    file: '2026-06-12-loss.yaml',
    session: {
      ...validSession,
      result: 'loss',
      objectives: ['Challenge Sauron'],
    },
    heroNames,
    objectiveNames,
  });

  assert(
    validateSession({ file: '2026-06-12-win.yaml', session: validSession, heroNames, objectiveNames }).length === 0,
    'Valid in-memory Fate session should pass validation',
    errors
  );
  [
    'Session filename does not match expected format',
    'invalid result "victory"',
    'invalid players "6"',
    'unknown hero "Bilbo"',
    'unknown objective "Make Second Breakfast"',
    'invalid final_state_image path',
  ].forEach((snippet) => {
    assert(
      invalidSessionErrors.some((error) => error.includes(snippet)),
      `Invalid in-memory Fate session should fail with: ${snippet}`,
      errors
    );
  });
  assert(
    missingRequiredObjectiveErrors.some((error) => error.includes('must include required objective "Destroy the One Ring"')),
    'Fate session validation should require Destroy the One Ring in every session',
    errors
  );

  await writeInvalidTempFixtureImages();
  const nonProgressiveImageErrors = await validateSessionImage({
    file: '2026-06-12-win.yaml',
    session: {
      ...validSession,
      final_state_image: TEMP_NON_PROGRESSIVE_IMAGE_PATH,
    },
  });
  const pngImageErrors = await validateSessionImage({
    file: '2026-06-12-win.yaml',
    session: {
      ...validSession,
      final_state_image: TEMP_PNG_IMAGE_PATH,
    },
  });
  removeTempFixtureImage();

  assert(
    nonProgressiveImageErrors.some((error) => error.includes('must be progressive JPEG')),
    'Fate image validation should reject non-progressive JPEGs',
    errors
  );
  assert(
    pngImageErrors.some((error) => error.includes('must be a JPEG')),
    'Fate image validation should reject non-JPEG images',
    errors
  );

  if (!errors.some((error) => error.includes('in-memory Fate session'))) {
    console.log('   ✓ Session validation rules reject bad data');
  }

  console.log('\n📚 Validating logging guide...');
  if (fs.existsSync(docsPath)) {
    const docs = fs.readFileSync(docsPath, 'utf8');
    [
      'data/fate-of-the-fellowship/sessions/',
      'date: "2026-06-12"',
      'result: "win"',
      'players: 3',
      'heroes:',
      'objectives:',
      'final_state_image:',
      'YYYY-MM-DD-result.yaml',
      'Destroy the One Ring',
      'Legolas',
      'Boromir',
      'Infiltrate Minas Morgul',
      'fate-of-the-fellowship-tracker-plan.md',
    ].forEach((snippet) => {
      assert(docs.includes(snippet), `Logging guide is missing expected text: ${snippet}`, errors);
    });

    const sampleMatch = docs.match(/```yaml\n([\s\S]*?)\n```/);
    assert(sampleMatch, 'Logging guide must include a YAML session sample', errors);
    if (sampleMatch) {
      const sampleSession = yaml.load(sampleMatch[1]);
      errors.push(...validateSession({
        file: '2026-06-12-win.yaml',
        session: sampleSession,
        heroNames,
        objectiveNames,
      }).map((error) => `Logging guide sample is invalid: ${error}`));
    }

    if (!errors.some((error) => error.includes('Logging guide'))) {
      console.log('   ✓ Logging guide covers the locked data model');
    }
  }

  console.log('\n🏗️  Validating rendered tracker shell...');
  runHugoBuild();
  assert(fs.existsSync(layoutPath), `Missing custom Fate layout: ${layoutPath}`, errors);
  assert(fs.existsSync(renderedPagePath), `Missing rendered Fate page: ${renderedPagePath}`, errors);
  if (fs.existsSync(renderedPagePath)) {
    const rendered = fs.readFileSync(renderedPagePath, 'utf8');
    const renderedText = stripHtml(rendered);

    [
      'fate-page',
      'fate-ledger',
      'fate-briefing-grid',
      'fate-overview-section',
      'fate-fellowship-section',
      'fate-quest-section',
      'fate-log-section',
      'fate-actions-section',
    ].forEach((snippet) => {
      assert(rendered.includes(snippet), `Rendered Fate page is missing tracker shell class: ${snippet}`, errors);
    });

    [
      '<h1>Fate of the Fellowship</h1>',
      'fate-kenney-hero',
      'fate-hero-panel',
      'The innkeeper\'s record of',
      'divider-gold.png',
      'divider-green.png',
      'Heroes called',
      'Quests assigned',
      'Tales worth keeping',
      'Enter the ledger',
      'Overview',
      'Fellowship record',
      'Quest record',
      'Session log',
      'Add a tale to the ledger',
      'Empty boasts can wait outside with the ponies.',
      'fewer second breakfasts',
      'Destroy the One Ring',
      'Legolas',
    ].forEach((snippet) => {
      assert(rendered.includes(snippet) || renderedText.includes(snippet), `Rendered Fate page is missing expected text: ${snippet}`, errors);
    });

    assert(!renderedText.includes('Coming Soon'), 'Rendered Fate page should not show the default Hugo Coming Soon block', errors);

    assert(
      rendered.includes('href="https://github.com/LindsayB610/Lindsay-Brunner-Website/new/main/data/fate-of-the-fellowship/sessions?filename=REPLACE-ME-YYYY-MM-DD-result.yaml'),
      'Rendered Fate page should include a GitHub prefilled-session link',
      errors
    );
    assert(
      rendered.includes('value=date%3A%20%22REPLACE-ME-YYYY-MM-DD%22'),
      'Rendered Fate prefilled-session link should include a YAML template value',
      errors
    );
    assert(
      rendered.includes('https://github.com/LindsayB610/Lindsay-Brunner-Website/blob/main/docs/fate-of-the-fellowship-tracker.md'),
      'Rendered Fate page should include a logging-guide link',
      errors
    );
  }

  if (!errors.some((error) => error.includes('Rendered Fate page') || error.includes('Missing custom Fate layout') || error.includes('Missing rendered Fate page'))) {
    console.log('   ✓ Rendered page uses the custom tracker shell');
  }

  console.log('\n📭 Validating empty-state rendering...');
  await withRealSessionFilesHidden(async () => {
    runHugoBuild();
    assert(fs.existsSync(renderedPagePath), `Missing rendered Fate page after empty-state build: ${renderedPagePath}`, errors);
    if (fs.existsSync(renderedPagePath)) {
      const emptyRendered = fs.readFileSync(renderedPagePath, 'utf8');
      const emptyText = stripHtml(emptyRendered);

      [
        'Journeys logged 0',
        'Victories 0',
        'Defeats 0',
        'Win rate 0%',
        'fate-empty-log',
        'No tales entered yet',
        'The ledger is waiting for its first journey from Bag End to the fire.',
      ].forEach((snippet) => {
        assert(emptyRendered.includes(snippet) || emptyText.includes(snippet), `Rendered empty Fate page is missing expected text: ${snippet}`, errors);
      });

      [
        'Legolas 0 journeys',
        'Arwen 0 journeys',
        'Destroy the One Ring 0 attempts',
        'Challenge Sauron 0 attempts',
      ].forEach((snippet) => {
        assert(!emptyText.includes(snippet), `Rendered empty Fate page should hide untracked hero/objective text: ${snippet}`, errors);
      });
    }
  });
  runHugoBuild();

  if (!errors.some((error) => error.includes('Rendered empty Fate page') || error.includes('empty-state build'))) {
    console.log('   ✓ Empty-state rendering remains covered without real sessions');
  }

  console.log('\n📊 Validating populated aggregate rendering...');
  try {
    await withRealSessionFilesHidden(async () => {
      await writeTempFixtureImage();
      writeTempFixtureSessions();
      for (const [file, session] of Object.entries(TEMP_FIXTURE_SESSIONS)) {
        errors.push(...await validateSessionImage({ file, session }));
      }
      runHugoBuild();

      const populated = fs.readFileSync(renderedPagePath, 'utf8');
      const populatedText = stripHtml(populated);

      [
        'Journeys logged 3',
        'Victories 2',
        'Defeats 1',
        'Win rate 67%',
        '2 players 1 journey',
        '3 players 2 journeys',
        'Legolas 2 journeys',
        'Frodo & Sam 1 journey',
        'Gimli 1 journey',
        'Aragorn 1 journey',
        'Boromir 1 journey',
        'Destroy the One Ring 3 attempts 2 successes',
        'Challenge Sauron 2 attempts 2 successes',
        'Infiltrate Minas Morgul 1 attempt 0 successes',
        'June 12, 2026',
        'June 1, 2026',
        'May 30, 2026',
        'Win',
        'Loss',
        '3 players',
        '2 players',
        'Legolas, Frodo & Sam',
        'Destroy the One Ring, Challenge Sauron',
        'Aragorn, Boromir',
        'Destroy the One Ring, Infiltrate Minas Morgul',
        'The fellowship kept its nerve at the edge of the fire.',
        'A hard road, but the Shadow broke before the company did.',
        'The road bent toward Minas Morgul and did not bend back.',
      ].forEach((snippet) => {
        assert(populatedText.includes(snippet), `Rendered populated Fate page is missing expected text: ${snippet}`, errors);
      });

      [
        'Arwen 0 journeys',
        'Gollum 0 journeys',
        'Bring Light to Mirkwood 0 attempts',
        'Shelob\'s Lair 0 attempts',
      ].forEach((snippet) => {
        assert(!populatedText.includes(snippet), `Rendered populated Fate page should hide untracked hero/objective text: ${snippet}`, errors);
      });

      [
        TEMP_FIXTURE_IMAGE_PATH,
        'fate-log-photo',
        'fate-log-photo-trigger',
        'data-fate-lightbox-src',
        'fate-photo-dialog',
        'fate-photo-dialog-image',
      ].forEach((snippet) => {
        assert(populated.includes(snippet), `Rendered populated Fate page is missing expected image markup: ${snippet}`, errors);
      });

      const newestIndex = populatedText.indexOf('June 12, 2026');
      const middleIndex = populatedText.indexOf('June 1, 2026');
      const oldestIndex = populatedText.indexOf('May 30, 2026');
      assert(
        newestIndex !== -1 && middleIndex !== -1 && oldestIndex !== -1 && newestIndex < middleIndex && middleIndex < oldestIndex,
        'Rendered populated Fate sessions should be reverse chronological',
        errors
      );
    });
  } finally {
    removeTempFixtureSessions();
    removeTempFixtureImage();
    runHugoBuild();
  }

  if (!errors.some((error) => error.includes('Rendered populated Fate page') || error.includes('reverse chronological'))) {
    console.log('   ✓ Populated aggregate rendering matches fixture sessions');
  }

  console.log('\n🧭 Validating navigation and docs integration...');
  if (fs.existsSync(headerPath)) {
    const header = fs.readFileSync(headerPath, 'utf8');
    assert(!header.includes('<a href="/fate-of-the-fellowship/">LOTR: FotF</a>'), 'Header More dropdown should not expose LOTR: FotF before launch', errors);
  }

  if (fs.existsSync(footerPath)) {
    const footer = fs.readFileSync(footerPath, 'utf8');
    assert(!footer.includes('<a href="/fate-of-the-fellowship/">LOTR: FotF</a>'), 'Footer navigation should not expose LOTR: FotF before launch', errors);
  }

  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf8');
    [
      'npm run test:fate',
      'data/fate-of-the-fellowship/sessions/',
      'docs/fate-of-the-fellowship-tracker.md',
      '/fate-of-the-fellowship/',
    ].forEach((snippet) => {
      assert(readme.includes(snippet), `README is missing Fate tracker integration text: ${snippet}`, errors);
    });
  }

  if (!errors.some((error) => error.includes('Header More dropdown') || error.includes('Footer navigation') || error.includes('README is missing'))) {
    console.log('   ✓ Header/footer keep the Fate tracker hidden while README documents the handoff');
  }

  console.log('\n🎨 Validating visual design contract...');
  if (fs.existsSync(customCssPath)) {
    const customCss = fs.readFileSync(customCssPath, 'utf8');
    [
      'body.page-fate-of-the-fellowship .fate-page',
      'body.page-fate-of-the-fellowship .fate-ledger',
      'body.page-fate-of-the-fellowship .fate-section',
      'body.page-fate-of-the-fellowship .fate-kenney-hero',
      'body.page-fate-of-the-fellowship .fate-hero-panel',
      'body.page-fate-of-the-fellowship .fate-kenney-divider',
      'body.page-fate-of-the-fellowship .fate-enter-link',
      'body.page-fate-of-the-fellowship .fate-title-divider',
      'body.page-fate-of-the-fellowship .fate-briefing-grid',
      'body.page-fate-of-the-fellowship .fate-briefing-card',
      'body.page-fate-of-the-fellowship .fate-overview-grid',
      'body.page-fate-of-the-fellowship .fate-card-list',
      'body.page-fate-of-the-fellowship .fate-quest-list',
      'body.page-fate-of-the-fellowship .fate-log-list',
      'body.page-fate-of-the-fellowship .fate-quest-card',
      'body.page-fate-of-the-fellowship .fate-result-seal',
      'body.page-fate-of-the-fellowship .fate-log-photo',
      'body.page-fate-of-the-fellowship .fate-return-link',
      'body.page-fate-of-the-fellowship .fate-bottom-exit',
      'body.page-fate-of-the-fellowship .fate-ledger-header > .fate-return-link',
      'body.page-fate-of-the-fellowship .site-header',
      'body.page-fate-of-the-fellowship .site-footer',
      'display: none',
      '@media (max-width: 768px)',
      '@media (max-width: 520px)',
      'parchment',
      'quest',
      'wax',
      'brass',
      '--fate-olive: #77745f',
      '--fate-ochre: #bd9854',
      '--fate-blush: #dfc1ad',
      '--fate-rust: #a85f2c',
      'Fate parchment and scrollwork pass: no decorative background images.',
      'Fate SVG scrollwork borders',
      'Fate Kenney fantasy UI asset pass',
      '/images/fate-of-the-fellowship/scrollwork-section-border.svg',
      '/images/fate-of-the-fellowship/scrollwork-card-border.svg',
      '/images/fate-of-the-fellowship/kenney/frame-hero-gold.png',
      '/images/fate-of-the-fellowship/kenney/frame-section-gold.png',
      '/images/fate-of-the-fellowship/kenney/frame-card-gold.png',
      '/images/fate-of-the-fellowship/kenney/divider-green.png',
      'image-rendering: pixelated',
      'border-image-source',
      '--fate-leaf: #5f7645',
      '--fate-gold: #c69a3e',
      'background-image: none',
      'body.page-fate-of-the-fellowship .fate-ledger::before',
      'Uncial Antiqua',
      'Cinzel Decorative',
      'IM Fell English',
      'background-image: none',
      '-webkit-text-fill-color: #2b1b0d',
      'body.page-fate-of-the-fellowship .site-header::after',
    ].forEach((snippet) => {
      assert(customCss.includes(snippet), `Fate visual CSS is missing expected scoped hook: ${snippet}`, errors);
    });

    const fateSelectorMatches = customCss.match(/(^|\n)([^\n{}]*\.fate-[^\n{}]*)\{/g) || [];
    fateSelectorMatches.forEach((selectorMatch) => {
      const selector = selectorMatch.replace('{', '').trim();
      assert(
        selector.includes('body.page-fate-of-the-fellowship') ||
          selector.startsWith('@') ||
          selector.includes('body.page-fate-of-the-fellowship'),
        `Fate visual CSS selector should stay page-scoped: ${selector}`,
        errors
      );
    });
  }

  try {
    await writeTempFixtureImage();
    writeTempFixtureSessions();
    runHugoBuild();

    const { chromium } = await import('playwright');
    const renderedPage = fs.readFileSync(renderedPagePath, 'utf8');
    const sectionBorder = fs.readFileSync(sectionBorderPath, 'utf8');
    const cardBorder = fs.readFileSync(cardBorderPath, 'utf8');
    const titleDivider = fs.readFileSync(titleDividerPath, 'utf8');
    const kenneyNotice = fs.readFileSync(kenneyNoticePath, 'utf8');
    ['.leaf', '.flower', '.gold', '.vine', '#3e5a31'].forEach((snippet) => {
      assert(sectionBorder.includes(snippet), `Fate section scrollwork border should include ornament layer: ${snippet}`, errors);
    });
    ['.leaf', '.dot', '.vine', '#3e5a31'].forEach((snippet) => {
      assert(cardBorder.includes(snippet), `Fate card scrollwork border should include ornament layer: ${snippet}`, errors);
    });
    ['.vine', '.leaf', '#26351f', '#5f7645'].forEach((snippet) => {
      assert(titleDivider.includes(snippet), `Fate title divider should include green vine ornament: ${snippet}`, errors);
    });
    ['Kenney Fantasy UI Borders', 'https://kenney.nl/assets/fantasy-ui-borders', 'Creative Commons CC0'].forEach((snippet) => {
      assert(kenneyNotice.includes(snippet), `Fate Kenney asset notice should include provenance: ${snippet}`, errors);
    });
    kenneyRequiredAssetPaths.forEach((assetPath) => {
      assert(fs.existsSync(assetPath), `Fate Kenney asset is missing: ${assetPath}`, errors);
    });
    assert(
      renderedPage.includes('fonts.googleapis.com/css2?family=Cinzel+Decorative') &&
        renderedPage.includes('family=Uncial+Antiqua'),
      'Fate rendered page should load the page-specific Tolkien-inspired font families',
      errors
    );
    const customCss = fs.readFileSync(customCssPath, 'utf8');
    const fixtureImageFileUrl = pathToFileURL(path.join(root, 'static', TEMP_FIXTURE_IMAGE_PATH.replace(/^\//, ''))).href;
    const browserHtml = renderedPage
      .replace('</head>', `<style>${customCss}</style></head>`)
      .replaceAll(`src="${TEMP_FIXTURE_IMAGE_PATH}"`, `src="${fixtureImageFileUrl}"`);
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const viewports = [
        { width: 1280, height: 900, label: 'desktop' },
        { width: 390, height: 844, label: 'mobile' },
      ];

      for (const viewport of viewports) {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.label === 'mobile' ? 2 : 1,
          isMobile: viewport.label === 'mobile',
        });
        await page.setContent(browserHtml, { waitUntil: 'networkidle' });

        const visualMetrics = await page.evaluate(() => {
          const doc = document.documentElement;
          const fatePage = document.querySelector('.fate-page');
          const header = document.querySelector('.fate-ledger-header');
          const heroPanel = document.querySelector('.fate-hero-panel');
          const topExit = document.querySelector('.fate-ledger-header > .fate-return-link');
          const briefingCopy = document.querySelector('.fate-briefing-card p');
          const styles = fatePage ? getComputedStyle(fatePage) : null;
          const briefingCopyStyles = getComputedStyle(briefingCopy);
          const headerRect = header.getBoundingClientRect();
          const topExitRect = topExit.getBoundingClientRect();

          return {
            overflowX: doc.scrollWidth - doc.clientWidth,
            hasFatePage: Boolean(fatePage),
            pageBackground: styles?.backgroundImage || '',
            h1Background: getComputedStyle(document.querySelector('.fate-ledger h1')).backgroundImage,
            h1FontFamily: getComputedStyle(document.querySelector('.fate-ledger h1')).fontFamily,
            h1TextFillColor: getComputedStyle(document.querySelector('.fate-ledger h1')).webkitTextFillColor,
            headerBackgroundImage: getComputedStyle(document.querySelector('.fate-ledger-header')).backgroundImage,
            kenneyHeroCount: document.querySelectorAll('.fate-kenney-hero').length,
            heroPanelBorderImageSource: heroPanel ? getComputedStyle(heroPanel).borderImageSource : '',
            heroPanelImageRendering: heroPanel ? getComputedStyle(heroPanel).imageRendering : '',
            kenneyDividerCount: document.querySelectorAll('.fate-kenney-divider').length,
            posterArtCount: document.querySelectorAll('.fate-poster-art').length,
            sectionBorderImageSource: getComputedStyle(document.querySelector('.fate-section')).borderImageSource,
            cardBorderImageSource: getComputedStyle(document.querySelector('.fate-briefing-card')).borderImageSource,
            ledgerBeforeDisplay: getComputedStyle(document.querySelector('.fate-ledger'), '::before').display,
            sectionBeforeDisplay: getComputedStyle(document.querySelector('.fate-section'), '::before').display,
            ledgerHeaderBeforeDisplay: getComputedStyle(document.querySelector('.fate-ledger-header'), '::before').display,
            ledgerHeaderAfterDisplay: getComputedStyle(document.querySelector('.fate-ledger-header'), '::after').display,
            headerDisplay: getComputedStyle(document.querySelector('.site-header')).display,
            footerDisplay: getComputedStyle(document.querySelector('.site-footer')).display,
            topExitText: topExit.textContent.trim(),
            topExitJustifySelf: getComputedStyle(topExit).justifySelf,
            topExitPosition: getComputedStyle(topExit).position,
            topExitRight: getComputedStyle(topExit).right,
            topExitRightOffset: headerRect.right - topExitRect.right,
            briefingCopyColor: briefingCopyStyles.color,
            briefingCopyTextFillColor: briefingCopyStyles.webkitTextFillColor,
            bottomExitCount: document.querySelectorAll('.fate-bottom-exit .fate-return-link').length,
            sectionCount: document.querySelectorAll('.fate-section').length,
            heroCardCount: document.querySelectorAll('.fate-record-card').length,
            questCardCount: document.querySelectorAll('.fate-quest-card').length,
            photoCount: document.querySelectorAll('.fate-log-photo img').length,
          };
        });
        const screenshot = await page.screenshot({ fullPage: false });
        await page.close();

        assert(visualMetrics.hasFatePage, `Fate ${viewport.label} render should include the page shell`, errors);
        assert(visualMetrics.headerDisplay === 'none', `Fate ${viewport.label} render should hide the shared site header like Nemesis`, errors);
        assert(visualMetrics.footerDisplay === 'none', `Fate ${viewport.label} render should hide the shared site footer like Nemesis`, errors);
        assert(!visualMetrics.headerBackgroundImage.includes('url('), `Fate ${viewport.label} header should not use decorative background images`, errors);
        assert(visualMetrics.kenneyHeroCount === 1, `Fate ${viewport.label} hero should use the Kenney fantasy UI hero wrapper`, errors);
        assert(visualMetrics.posterArtCount === 0, `Fate ${viewport.label} hero should not render the rejected poster art image`, errors);
        assert(visualMetrics.kenneyDividerCount >= 2, `Fate ${viewport.label} hero should render Kenney divider assets`, errors);
        assert(visualMetrics.heroPanelBorderImageSource.includes('frame-hero-gold.png'), `Fate ${viewport.label} hero panel should use the Kenney hero frame`, errors);
        assert(visualMetrics.heroPanelImageRendering === 'pixelated', `Fate ${viewport.label} hero panel should preserve the Kenney pixel-art border style`, errors);
        assert(visualMetrics.sectionBorderImageSource.includes('frame-section-gold.png'), `Fate ${viewport.label} sections should use the Kenney section frame asset`, errors);
        assert(visualMetrics.cardBorderImageSource.includes('frame-card-gold.png'), `Fate ${viewport.label} cards should use the Kenney card frame asset`, errors);
        assert(visualMetrics.ledgerBeforeDisplay === 'none', `Fate ${viewport.label} should not render abstract ledger circle overlays`, errors);
        assert(visualMetrics.sectionBeforeDisplay === 'none', `Fate ${viewport.label} should not fake scrollwork with section pseudo-corners`, errors);
        assert(visualMetrics.ledgerHeaderBeforeDisplay === 'none', `Fate ${viewport.label} should not render abstract header ring overlays`, errors);
        assert(visualMetrics.ledgerHeaderAfterDisplay === 'none', `Fate ${viewport.label} should not render abstract header line overlays`, errors);
        assert(visualMetrics.topExitText === 'Exit to site', `Fate ${viewport.label} top exit should match the Nemesis exit label`, errors);
        assert(
          visualMetrics.topExitJustifySelf === 'end' || visualMetrics.topExitPosition === 'absolute',
          `Fate ${viewport.label} top exit should use a right-side header placement model`,
          errors
        );
        assert(visualMetrics.topExitPosition === 'absolute', `Fate ${viewport.label} top exit should be pinned over the hero like Nemesis`, errors);
        assert(visualMetrics.topExitRight !== 'auto', `Fate ${viewport.label} top exit should have a right offset`, errors);
        assert(
          visualMetrics.topExitRightOffset >= 0 && visualMetrics.topExitRightOffset < 120,
          `Fate ${viewport.label} top exit should sit near the right side of the ledger header`,
          errors
        );
        assert(visualMetrics.briefingCopyColor === 'rgb(74, 50, 31)', `Fate ${viewport.label} briefing copy should use dark readable ink`, errors);
        assert(
          visualMetrics.briefingCopyTextFillColor === 'rgb(74, 50, 31)' || visualMetrics.briefingCopyTextFillColor === '',
          `Fate ${viewport.label} briefing copy text fill should stay readable on parchment`,
          errors
        );
        assert(visualMetrics.bottomExitCount === 1, `Fate ${viewport.label} render should include an internal bottom exit link`, errors);
        assert(visualMetrics.sectionCount >= 5, `Fate ${viewport.label} render should include tracker sections`, errors);
        assert(visualMetrics.heroCardCount === 5, `Fate ${viewport.label} render should include only tracked hero cards`, errors);
        assert(visualMetrics.questCardCount === 4, `Fate ${viewport.label} render should include only tracked quest cards`, errors);
        assert(visualMetrics.photoCount >= 1, `Fate ${viewport.label} render should include the fixture photo thumbnail`, errors);
        assert(
          visualMetrics.pageBackground.includes('linear-gradient') || visualMetrics.pageBackground.includes('radial-gradient'),
          `Fate ${viewport.label} render should include themed page background`,
          errors
        );
        assert(visualMetrics.h1Background === 'none', `Fate ${viewport.label} h1 should not inherit the site gradient`, errors);
        assert(
          visualMetrics.h1FontFamily.includes('Uncial Antiqua') ||
            visualMetrics.h1FontFamily.includes('Cinzel Decorative'),
          `Fate ${viewport.label} h1 should use the Tolkien-inspired display font stack`,
          errors
        );
        assert(
          visualMetrics.h1TextFillColor !== 'rgb(255, 27, 141)' &&
            visualMetrics.h1TextFillColor !== 'rgb(255, 0, 55)',
          `Fate ${viewport.label} h1 should not use the site pink/red gradient colors`,
          errors
        );
        assert(await screenshotHasVisualContent(screenshot), `Fate ${viewport.label} screenshot should be nonblank`, errors);

        if (viewport.label === 'mobile') {
          assert(visualMetrics.overflowX === 0, `Fate mobile render should not create horizontal overflow`, errors);
        }
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } finally {
    removeTempFixtureSessions();
    removeTempFixtureImage();
    runHugoBuild();
  }

  if (!errors.some((error) => error.includes('Fate visual') || error.includes('Fate desktop') || error.includes('Fate mobile'))) {
    console.log('   ✓ Visual CSS and browser render checks match the Phase 6 contract');
  }

  console.log('\n🧪 Validating TDD plan contract...');
  if (fs.existsSync(planPath)) {
    const plan = fs.readFileSync(planPath, 'utf8');
    [
      '## TDD rule',
      'Each implementation phase should start with the narrowest failing test',
      'The content page moved out of draft in Phase 3 only after the custom layout existed',
      '`LOTR: FotF`',
      '`Fate of the Fellowship`',
    ].forEach((snippet) => {
      assert(plan.includes(snippet), `Implementation plan is missing expected TDD text: ${snippet}`, errors);
    });

    if (!errors.some((error) => error.includes('Implementation plan'))) {
      console.log('   ✓ Plan keeps future phases test-first');
    }
  }

  console.log('\n' + '='.repeat(60));
  if (errors.length > 0) {
    console.log(`Tests failed: ${errors.length}`);
    console.log('\n❌ Errors:');
    errors.forEach((error) => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('Tests passed: 10');
  console.log('\n✅ Fate of the Fellowship tracker tests passed!');
}

main().catch((error) => {
  console.error('\n❌ Unexpected Fate tracker test failure:', error);
  process.exit(1);
});

module.exports = {
  ALLOWED_PLAYERS,
  ALLOWED_RESULTS,
  EXPECTED_HEROES,
  EXPECTED_OBJECTIVES,
  SESSION_FILENAME_REGEX,
  validateSession,
  validateSessionImage,
};
