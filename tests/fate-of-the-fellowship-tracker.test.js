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
const docsPath = path.join(root, 'docs', 'fate-of-the-fellowship-tracker.md');
const planPath = path.join(root, 'docs', 'fate-of-the-fellowship-tracker-plan.md');
const readmePath = path.join(root, 'README.md');
const headerPath = path.join(root, 'layouts', 'partials', 'header.html');
const footerPath = path.join(root, 'layouts', 'partials', 'footer.html');
const headPath = path.join(root, 'layouts', 'partials', 'head.html');
const layoutPath = path.join(root, 'layouts', 'fate-of-the-fellowship', 'list.html');
const customCssPath = path.join(root, 'static', 'css', 'custom.css');
const fateCssPath = path.join(root, 'static', 'css', 'fate-of-the-fellowship.css');
const renderedPagePath = path.join(root, 'public', 'fate-of-the-fellowship', 'index.html');
const TEMP_FIXTURE_IMAGE_PATH = '/images/fate-of-the-fellowship/session-photos/2026-06-12-win-test-fixture.jpg';
const TEMP_NON_PROGRESSIVE_IMAGE_PATH = '/images/fate-of-the-fellowship/session-photos/2026-06-12-win-non-progressive-test-fixture.jpg';
const TEMP_PNG_IMAGE_PATH = '/images/fate-of-the-fellowship/session-photos/2026-06-12-win-png-test-fixture.png';
const MAX_SESSION_IMAGE_BYTES = 1024 * 1024;
const MAX_SESSION_IMAGE_DIMENSION = 2400;
const SESSION_IMAGE_WIDTH = 2400;
const SESSION_IMAGE_HEIGHT = 1350;
const TEMP_FIXTURE_SESSIONS = {
  '2026-06-09-win.yaml': {
    date: '2026-06-09',
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
    heroes: ['Legolas', 'Gimli', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Challenge Sauron'],
    note: 'A hard road, but the Shadow broke before the company did.',
  },
  '2026-05-30-loss.yaml': {
    date: '2026-05-30',
    result: 'loss',
    players: 2,
    heroes: ['Aragorn', 'Boromir', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Infiltrate Minas Morgul'],
    completed_objectives: ['Infiltrate Minas Morgul'],
    incomplete_objectives: ['Destroy the One Ring'],
    note: 'The road bent toward Minas Morgul and did not bend back.',
  },
};
const TEMP_RECALCULATION_SESSIONS = {
  '2026-07-04-loss.yaml': {
    date: '2026-07-04',
    result: 'loss',
    players: 4,
    heroes: ['Gandalf', 'Galadriel', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Attain the Blessing of the Elves'],
    completed_objectives: ['Attain the Blessing of the Elves'],
    incomplete_objectives: ['Destroy the One Ring'],
    note: 'The wise spoke softly, and the Shadow answered loudly.',
  },
  '2026-07-11-win.yaml': {
    date: '2026-07-11',
    result: 'win',
    players: 4,
    heroes: ['Gandalf', 'Galadriel', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Attain the Blessing of the Elves'],
    note: 'The light held long enough for the road to open.',
  },
  '2026-07-18-win.yaml': {
    date: '2026-07-18',
    result: 'win',
    players: 5,
    heroes: ['Galadriel', 'Eowyn', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Shieldmaiden No Longer'],
    note: 'A bright banner went up where the dark expected silence.',
  },
  '2026-07-25-win.yaml': {
    date: '2026-07-25',
    result: 'win',
    players: 5,
    heroes: ['Galadriel', 'Eowyn', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Shieldmaiden No Longer'],
    note: 'No one at the table trusted the road, which helped.',
  },
};
const TEMP_REQUIRED_ONLY_WIN_SESSIONS = {
  '2026-08-01-win.yaml': {
    date: '2026-08-01',
    result: 'win',
    players: 2,
    heroes: ['Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Challenge Sauron'],
    note: 'The Ring was carried without another hero entering the bragging ledger.',
  },
  '2026-08-08-win.yaml': {
    date: '2026-08-08',
    result: 'win',
    players: 2,
    heroes: ['Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Challenge Sauron'],
    note: 'Another required-company victory, still not a character crown.',
  },
};
const TEMP_TIED_LEADER_SESSIONS = {
  '2026-09-01-win.yaml': {
    date: '2026-09-01',
    result: 'win',
    players: 3,
    heroes: ['Legolas', 'Galadriel', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Challenge Sauron', 'Shieldmaiden No Longer'],
    note: 'Two leaders started their shared boast.',
  },
  '2026-09-08-win.yaml': {
    date: '2026-09-08',
    result: 'win',
    players: 3,
    heroes: ['Legolas', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Challenge Sauron'],
    note: 'Legolas kept pace without ending the tie.',
  },
  '2026-09-15-win.yaml': {
    date: '2026-09-15',
    result: 'win',
    players: 3,
    heroes: ['Galadriel', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Shieldmaiden No Longer'],
    note: 'Galadriel answered with her own second mark.',
  },
};
const TEMP_CROWDED_TIE_SESSIONS = {
  '2026-10-01-win.yaml': {
    date: '2026-10-01',
    result: 'win',
    players: 4,
    heroes: ['Legolas', 'Galadriel', 'Gimli', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Challenge Sauron', 'Shieldmaiden No Longer', 'Infiltrate Minas Morgul'],
    note: 'The fellowship produced too many champions for one tidy boast.',
  },
  '2026-10-08-win.yaml': {
    date: '2026-10-08',
    result: 'win',
    players: 4,
    heroes: ['Legolas', 'Galadriel', 'Gimli', 'Frodo & Sam'],
    objectives: ['Destroy the One Ring', 'Challenge Sauron', 'Shieldmaiden No Longer', 'Infiltrate Minas Morgul'],
    note: 'The record keeper declined to choose among three equally smug victors.',
  },
};
const EXPECTED_HEROES = [
  { key: 'legolas', name: 'Legolas' },
  { key: 'arwen', name: 'Arwen' },
  { key: 'faramir', name: 'Faramir' },
  { key: 'eowyn', name: 'Eowyn' },
  { key: 'frodo-and-sam', name: 'Frodo & Sam', required: true },
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

function arrayDifference(firstValues, secondValues) {
  const secondSet = new Set(secondValues);
  return firstValues.filter((value) => !secondSet.has(value));
}

function normalizeText(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function valuesDeepEqual(first, second) {
  return JSON.stringify(first) === JSON.stringify(second);
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

function writeTempSessions(sessions) {
  Object.entries(sessions).forEach(([file, session]) => {
    fs.writeFileSync(path.join(sessionsDir, file), yaml.dump(session, { lineWidth: -1 }), 'utf8');
  });
}

function writeTempFixtureSessions() {
  writeTempSessions(TEMP_FIXTURE_SESSIONS);
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

function removeTempSessions(sessions) {
  Object.entries(sessions).forEach(([file, session]) => {
    const filePath = path.join(sessionsDir, file);
    if (fs.existsSync(filePath)) {
      const currentSession = loadYamlFile(filePath);
      if (valuesDeepEqual(currentSession, session)) {
        fs.unlinkSync(filePath);
      }
    }
  });
}

function removeTempFixtureSessions() {
  removeTempSessions(TEMP_FIXTURE_SESSIONS);
  removeTempSessions(TEMP_RECALCULATION_SESSIONS);
  removeTempSessions(TEMP_REQUIRED_ONLY_WIN_SESSIONS);
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
    assert(
      session.heroes.includes('Frodo & Sam'),
      `Session "${file}" must include required hero "Frodo & Sam"`,
      errors
    );
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

  if (session.result === 'loss') {
    const completedObjectives = session.completed_objectives;
    const incompleteObjectives = session.incomplete_objectives;
    const assignedObjectives = Array.isArray(session.objectives) ? session.objectives : [];

    assert(
      Array.isArray(completedObjectives),
      `Loss session "${file}" must include completed_objectives`,
      errors
    );
    assert(
      Array.isArray(incompleteObjectives),
      `Loss session "${file}" must include incomplete_objectives`,
      errors
    );

    if (Array.isArray(completedObjectives) && Array.isArray(incompleteObjectives)) {
      completedObjectives.forEach((objective) => {
        assert(objectiveNames.has(objective), `Session "${file}" references unknown completed objective "${objective}"`, errors);
      });
      incompleteObjectives.forEach((objective) => {
        assert(objectiveNames.has(objective), `Session "${file}" references unknown incomplete objective "${objective}"`, errors);
      });

      const duplicateCompleted = findDuplicates(completedObjectives);
      const duplicateIncomplete = findDuplicates(incompleteObjectives);
      const objectiveStatusOverlap = completedObjectives.filter((objective) => incompleteObjectives.includes(objective));
      const statusObjectives = [...completedObjectives, ...incompleteObjectives];
      const unaccountedAssignedObjectives = arrayDifference(assignedObjectives, statusObjectives);
      const unassignedStatusObjectives = arrayDifference(statusObjectives, assignedObjectives);

      assert(
        duplicateCompleted.length === 0,
        `Loss session "${file}" repeats completed objective status for "${duplicateCompleted.join(', ')}"`,
        errors
      );
      assert(
        duplicateIncomplete.length === 0,
        `Loss session "${file}" repeats incomplete objective status for "${duplicateIncomplete.join(', ')}"`,
        errors
      );
      assert(
        objectiveStatusOverlap.length === 0,
        `Loss session "${file}" marks objective as both completed and incomplete: "${objectiveStatusOverlap.join(', ')}"`,
        errors
      );
      assert(
        unaccountedAssignedObjectives.length === 0,
        `Loss session "${file}" must mark every assigned objective completed or incomplete; missing "${unaccountedAssignedObjectives.join(', ')}"`,
        errors
      );
      assert(
        unassignedStatusObjectives.length === 0,
        `Loss session "${file}" marks objective status for unassigned objective "${unassignedStatusObjectives.join(', ')}"`,
        errors
      );
    }
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
    docsPath,
    planPath,
    headPath,
    customCssPath,
    fateCssPath,
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

    const requiredHeroes = (heroMetadata?.items || []).filter((item) => item.required === true);
    assert(requiredHeroes.length === 1, 'heroes.yaml must mark exactly one required hero', errors);
    assert(requiredHeroes[0]?.name === 'Frodo & Sam', 'Frodo & Sam must be the required hero', errors);
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
  const missingRequiredHeroErrors = validateSession({
    file: '2026-06-12-loss.yaml',
    session: {
      ...validSession,
      result: 'loss',
      heroes: ['Legolas'],
    },
    heroNames,
    objectiveNames,
  });
  const validLossSession = {
    ...validSession,
    date: '2026-06-12',
    result: 'loss',
    completed_objectives: ['Challenge Sauron'],
    incomplete_objectives: ['Destroy the One Ring'],
  };
  const missingLossObjectiveStatusErrors = validateSession({
    file: '2026-06-12-loss.yaml',
    session: {
      ...validSession,
      result: 'loss',
    },
    heroNames,
    objectiveNames,
  });
  const overlappingLossObjectiveStatusErrors = validateSession({
    file: '2026-06-12-loss.yaml',
    session: {
      ...validLossSession,
      incomplete_objectives: ['Destroy the One Ring', 'Challenge Sauron'],
    },
    heroNames,
    objectiveNames,
  });
  const unassignedLossObjectiveStatusErrors = validateSession({
    file: '2026-06-12-loss.yaml',
    session: {
      ...validLossSession,
      completed_objectives: ['Challenge Sauron', 'Arwen Unfurls the Banner'],
    },
    heroNames,
    objectiveNames,
  });

  assert(
    validateSession({ file: '2026-06-12-win.yaml', session: validSession, heroNames, objectiveNames }).length === 0,
    'Valid in-memory Fate session should pass validation',
    errors
  );
  assert(
    validateSession({ file: '2026-06-12-loss.yaml', session: validLossSession, heroNames, objectiveNames }).length === 0,
    'Valid in-memory Fate loss session should pass validation with explicit objective completion status',
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
  assert(
    missingRequiredHeroErrors.some((error) => error.includes('must include required hero "Frodo & Sam"')),
    'Fate session validation should require Frodo & Sam in every session',
    errors
  );
  [
    'must include completed_objectives',
    'must include incomplete_objectives',
  ].forEach((snippet) => {
    assert(
      missingLossObjectiveStatusErrors.some((error) => error.includes(snippet)),
      `Fate loss session validation should fail with: ${snippet}`,
      errors
    );
  });
  assert(
    overlappingLossObjectiveStatusErrors.some((error) => error.includes('marks objective as both completed and incomplete')),
    'Fate loss session validation should reject objectives marked both completed and incomplete',
    errors
  );
  assert(
    unassignedLossObjectiveStatusErrors.some((error) => error.includes('marks objective status for unassigned objective')),
    'Fate loss session validation should reject objective statuses for unassigned objectives',
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
      'completed_objectives:',
      'incomplete_objectives:',
      'final_state_image:',
      'YYYY-MM-DD-result.yaml',
      'Destroy the One Ring',
      'every assigned objective as either completed or incomplete',
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
      'fate-rulebook-hero',
      'fate-hero-plate',
      'A field record for',
      'fate-script-band',
      'Heroes called',
      'Quests assigned',
      'Tales worth keeping',
      'The road so far',
      'Fellowship record',
      'Quest record',
      'Session log',
      'Add your fate to the record',
      'Destroy the One Ring',
      'Arwen',
    ].forEach((snippet) => {
      assert(rendered.includes(snippet) || renderedText.includes(snippet), `Rendered Fate page is missing expected text: ${snippet}`, errors);
    });

    [
      'Table rule',
      'Margin note',
      'Empty boasts can wait outside with the ponies.',
      'fewer second breakfasts',
      'fate-briefing-grid',
      'fate-rulebook-callouts',
      'Read the record',
      'class="fate-enter-link"',
    ].forEach((snippet) => {
      assert(!rendered.includes(snippet) && !renderedText.includes(snippet), `Rendered Fate page should not include removed hero/table-note UI: ${snippet}`, errors);
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
        'Journey record 0 wins',
        'out of 0 journeys attempted',
        'Winningest character None yet',
        '0 wins over 0 journeys',
        'Winningest objective None yet',
        '0 wins over 0 attempts',
        'fate-empty-log',
        'No tales entered yet',
        'The ledger is waiting for its first journey from Bag End to the fire.',
      ].forEach((snippet) => {
        assert(emptyRendered.includes(snippet) || emptyText.includes(snippet), `Rendered empty Fate page is missing expected text: ${snippet}`, errors);
      });
      assert(!emptyRendered.includes('fate-session-separator'), 'Rendered empty Fate page should not include session separators', errors);

      [
        'Legolas 0 journeys 0 wins',
        'Arwen 0 journeys 0 wins',
        'Destroy the One Ring 0 attempts',
        'Challenge Sauron 0 attempts',
      ].forEach((snippet) => {
        assert(!emptyText.includes(snippet), `Rendered empty Fate page should hide untracked hero/objective text: ${snippet}`, errors);
      });

      [
        'Journeys logged',
        'Victories 0',
        'Defeats 0',
        'Win rate',
      ].forEach((snippet) => {
        assert(!emptyText.includes(snippet), `Rendered empty Fate page should not include removed overview stat: ${snippet}`, errors);
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
        'Journey record 2 wins',
        'out of 3 journeys attempted',
        'Winningest character Legolas',
        '2 wins over 2 journeys',
        'Winningest objective Challenge Sauron',
        '2 wins over 2 attempts',
        'Legolas 2 journeys 2 wins',
        'Frodo & Sam 3 journeys 2 wins',
        'Gimli 1 journey 1 win',
        'Aragorn 1 journey 0 wins',
        'Boromir 1 journey 0 wins',
        'Destroy the One Ring 3 attempts 2 successes',
        'Challenge Sauron 2 attempts 2 successes',
        'Infiltrate Minas Morgul 1 attempt 0 successes',
        'June 9, 2026',
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
        'Journeys logged',
        'Victories 2',
        'Defeats 1',
        'Win rate',
        'Winningest character Frodo & Sam',
        '2 players 1 journey',
        '3 players 2 journeys',
      ].forEach((snippet) => {
        assert(!populatedText.includes(snippet), `Rendered populated Fate page should not include removed overview stat: ${snippet}`, errors);
      });
      [
        'fate-player-split',
        'fate-player-count',
      ].forEach((snippet) => {
        assert(!populated.includes(snippet), `Rendered populated Fate page should not include removed player strip markup: ${snippet}`, errors);
      });

      [
        'Arwen 0 journeys 0 wins',
        'Gollum 0 journeys 0 wins',
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
      const separatorCount = (populated.match(/fate-session-separator/g) || []).length;
      assert(separatorCount === 0, `Rendered populated Fate page should not include session separators in the two-column log, found ${separatorCount}`, errors);

      const newestIndex = populatedText.indexOf('June 9, 2026');
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

  console.log('\n🔁 Validating aggregate recalculation after session YAML changes...');
  try {
    await withRealSessionFilesHidden(async () => {
      writeTempFixtureSessions();
      runHugoBuild();
      const firstRenderedText = stripHtml(fs.readFileSync(renderedPagePath, 'utf8'));

      [
        'Journey record 2 wins',
        'out of 3 journeys attempted',
        'Winningest character Legolas',
        'Winningest objective Challenge Sauron',
      ].forEach((snippet) => {
        assert(firstRenderedText.includes(snippet), `Initial Fate aggregate render is missing expected text: ${snippet}`, errors);
      });

      removeTempSessions(TEMP_FIXTURE_SESSIONS);
      writeTempSessions(TEMP_RECALCULATION_SESSIONS);
      runHugoBuild();
      const recalculatedText = stripHtml(fs.readFileSync(renderedPagePath, 'utf8'));

      [
        'Journey record 3 wins',
        'out of 4 journeys attempted',
        'Winningest character Galadriel',
        '3 wins over 4 journeys',
        'Winningest objective Shieldmaiden No Longer',
        '2 wins over 2 attempts',
      ].forEach((snippet) => {
        assert(recalculatedText.includes(snippet), `Recalculated Fate aggregate render is missing expected text after YAML changes: ${snippet}`, errors);
      });

      [
        'out of 3 journeys attempted',
        'Winningest character Legolas',
        'Winningest objective Challenge Sauron',
      ].forEach((snippet) => {
        assert(!recalculatedText.includes(snippet), `Recalculated Fate aggregate render should not keep stale text after YAML changes: ${snippet}`, errors);
      });

      removeTempSessions(TEMP_RECALCULATION_SESSIONS);
      writeTempSessions(TEMP_REQUIRED_ONLY_WIN_SESSIONS);
      runHugoBuild();
      const requiredOnlyText = stripHtml(fs.readFileSync(renderedPagePath, 'utf8'));

      [
        'Journey record 2 wins',
        'out of 2 journeys attempted',
        'Winningest character None yet',
        '0 wins over 0 journeys',
        'Winningest objective Challenge Sauron',
        '2 wins over 2 attempts',
      ].forEach((snippet) => {
        assert(requiredOnlyText.includes(snippet), `Required-only Fate aggregate render is missing expected text: ${snippet}`, errors);
      });

      assert(
        !requiredOnlyText.includes('Winningest character Frodo & Sam'),
        'Required-only Fate aggregate render should not crown Frodo & Sam as winningest character',
        errors
      );

      removeTempSessions(TEMP_REQUIRED_ONLY_WIN_SESSIONS);
      writeTempSessions(TEMP_TIED_LEADER_SESSIONS);
      runHugoBuild();
      const tiedLeaderText = stripHtml(fs.readFileSync(renderedPagePath, 'utf8'));

      [
        'Journey record 3 wins',
        'out of 3 journeys attempted',
        'Winningest character Legolas, Galadriel',
        'Winningest objective Shieldmaiden No Longer, Challenge Sauron',
        '2 wins each',
      ].forEach((snippet) => {
        assert(tiedLeaderText.includes(snippet), `Tied-leader Fate aggregate render is missing expected text: ${snippet}`, errors);
      });

      removeTempSessions(TEMP_TIED_LEADER_SESSIONS);
      writeTempSessions(TEMP_CROWDED_TIE_SESSIONS);
      runHugoBuild();
      const crowdedTieText = stripHtml(fs.readFileSync(renderedPagePath, 'utf8'));

      [
        'Journey record 2 wins',
        'out of 2 journeys attempted',
        'Winningest character No clear winner',
        'Winningest objective No clear winner',
        '3 tied at 2 wins',
      ].forEach((snippet) => {
        assert(crowdedTieText.includes(snippet), `Crowded-tie Fate aggregate render is missing expected text: ${snippet}`, errors);
      });

      [
        'Winningest character Legolas, Galadriel, Gimli',
        'Winningest objective Challenge Sauron, Shieldmaiden No Longer, Infiltrate Minas Morgul',
        '2 wins each',
      ].forEach((snippet) => {
        assert(!crowdedTieText.includes(snippet), `Crowded-tie Fate aggregate render should not list 3-way ties: ${snippet}`, errors);
      });
    });
  } finally {
    removeTempFixtureSessions();
    removeTempSessions(TEMP_REQUIRED_ONLY_WIN_SESSIONS);
    removeTempSessions(TEMP_TIED_LEADER_SESSIONS);
    removeTempSessions(TEMP_CROWDED_TIE_SESSIONS);
    runHugoBuild();
  }

  if (!errors.some((error) => error.includes('aggregate render'))) {
    console.log('   ✓ Road so far recalculates from the current session YAML set');
  }

  console.log('\n🧭 Validating navigation and docs integration...');
  if (fs.existsSync(headerPath)) {
    const header = fs.readFileSync(headerPath, 'utf8');
    assert(header.includes('<a href="/fate-of-the-fellowship/">LOTR: FotF</a>'), 'Header More dropdown should expose LOTR: FotF after launch', errors);
  }

  if (fs.existsSync(footerPath)) {
    const footer = fs.readFileSync(footerPath, 'utf8');
    assert(!footer.includes('<a href="/fate-of-the-fellowship/">LOTR: FotF</a>'), 'Footer navigation should not expose LOTR: FotF before launch', errors);
  }

  if (fs.existsSync(headPath)) {
    const head = fs.readFileSync(headPath, 'utf8');
    assert(head.includes('eq .RelPermalink "/fate-of-the-fellowship/"'), 'Head partial should gate Fate CSS to the Fate page', errors);
    assert(head.includes('/css/fate-of-the-fellowship.css?v={{ $assetVersion }}'), 'Head partial should load the Fate page stylesheet', errors);
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

  if (!errors.some((error) => error.includes('Header More dropdown') || error.includes('Footer navigation') || error.includes('Head partial') || error.includes('README is missing'))) {
    console.log('   ✓ Header exposes the Fate tracker while footer scope and README docs stay intentional');
  }

  console.log('\n🎨 Validating visual design contract...');
  if (fs.existsSync(customCssPath) && fs.existsSync(fateCssPath)) {
    const customCss = fs.readFileSync(customCssPath, 'utf8');
    const fateCss = fs.readFileSync(fateCssPath, 'utf8');
    assert(!customCss.includes('body.page-fate-of-the-fellowship .fate-page'), 'Shared custom CSS should not contain Fate page selectors', errors);
    [
      'body.page-fate-of-the-fellowship .fate-page',
      'body.page-fate-of-the-fellowship .fate-ledger',
      'body.page-fate-of-the-fellowship .fate-section',
      'body.page-fate-of-the-fellowship .fate-rulebook-hero',
      'body.page-fate-of-the-fellowship .fate-hero-plate',
      'body.page-fate-of-the-fellowship .fate-script-band',
      'body.page-fate-of-the-fellowship .fate-overview-grid',
      'body.page-fate-of-the-fellowship .fate-card-list',
      'body.page-fate-of-the-fellowship .fate-quest-list',
      'body.page-fate-of-the-fellowship .fate-log-list',
      'body.page-fate-of-the-fellowship .fate-quest-card',
      'body.page-fate-of-the-fellowship .fate-result-seal',
      'body.page-fate-of-the-fellowship .fate-result-seal.is-win',
      'body.page-fate-of-the-fellowship .fate-result-seal.is-loss',
      'border-radius: 4px',
      'background: linear-gradient(180deg, #5b6f3f, #26351f);',
      'background: linear-gradient(180deg, #8e2f24, #4a1f18);',
      'body.page-fate-of-the-fellowship .fate-log-photo',
      'body.page-fate-of-the-fellowship .fate-log-photo-trigger',
      'cursor: zoom-in',
      'body.page-fate-of-the-fellowship .fate-photo-dialog-close',
      'body.page-fate-of-the-fellowship .fate-photo-dialog-close:focus',
      'outline: 2px solid rgba(232, 211, 153, 0.92)',
      'body.page-fate-of-the-fellowship .fate-return-link',
      'body.page-fate-of-the-fellowship .fate-bottom-exit',
      'body.page-fate-of-the-fellowship .fate-ledger-header > .fate-return-link',
      'body.page-fate-of-the-fellowship .site-header',
      'body.page-fate-of-the-fellowship .site-footer',
      'display: none',
      '@media (max-width: 768px)',
      '@media (max-width: 520px)',
      'rulebook redesign',
      'quest',
      'parchment',
      '--fate-green: #26351f',
      '--fate-paper: #efe0b7',
      '--fate-gold: #c79a45',
      '--fate-rust: #8e2f24',
      'linear-gradient(180deg, #07110e 0%, #09131a 48%, #020604 100%)',
      'scrollbar-color: rgba(199, 154, 69, 0.82) rgba(7, 19, 7, 0.94)',
      'html:has(body.page-fate-of-the-fellowship)::-webkit-scrollbar-thumb',
      'linear-gradient(180deg, rgba(232, 211, 153, 0.9), rgba(199, 154, 69, 0.86))',
      'body.page-fate-of-the-fellowship .fate-ledger::before',
      'Cinzel Decorative',
      'IM Fell English',
      'Noto Sans Runic',
      'background: linear-gradient(180deg, #5b6f3f, #26351f) !important;',
      'body.page-fate-of-the-fellowship .fate-return-link::after',
      'content: none',
      'background: none',
      '-webkit-text-fill-color: var(--fate-green)',
      'body.page-fate-of-the-fellowship .fate-section-heading h2',
      'text-transform: uppercase',
      'grid-template-columns: repeat(3, minmax(0, 1fr))',
      'body.page-fate-of-the-fellowship .fate-log-list',
      'grid-template-columns: repeat(2, minmax(0, 1fr))',
      'body.page-fate-of-the-fellowship .fate-overview-card p',
      'font-family: "IM Fell English", Georgia, serif;',
      'font-style: italic;',
      '-webkit-text-fill-color: var(--fate-ink)',
    ].forEach((snippet) => {
      assert(fateCss.includes(snippet), `Fate visual CSS is missing expected scoped hook: ${snippet}`, errors);
    });

    [
      'rulebook-border-rail.svg',
      'rulebook-section-divider.svg',
      'rulebook-side-ornament.svg',
      'rulebook-map-inset.svg',
      'rulebook-token-icons.svg',
      'fate-border-rail',
      'fate-section-divider',
      'fate-map-inset',
    ].forEach((snippet) => {
      assert(!fateCss.includes(snippet), `Fate visual CSS should not reference removed overlapping decoration: ${snippet}`, errors);
    });

    assert(!fateCss.includes('fate-enter-link'), 'Fate visual CSS should not keep removed Read the record CTA styles', errors);
    assert(!fateCss.includes('transform: scale('), 'Fate session photos should not zoom on hover', errors);
    assert(!fateCss.includes('.fate-log-photo-trigger:hover img'), 'Fate session photos should not apply image hover effects', errors);
    assert(
      !fateCss.match(/fate-photo-dialog-close[\s\S]{0,600}(--color-pink|--gradient-main|#ff1b8d)/),
      'Fate photo dialog close button should not use main-site pink or gradient styling',
      errors
    );

    const fateSelectorMatches = fateCss.match(/(^|\n)([^\n{}]*\.fate-[^\n{}]*)\{/g) || [];
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
    await withRealSessionFilesHidden(async () => {
      await writeTempFixtureImage();
      writeTempFixtureSessions();
      runHugoBuild();

      const { chromium } = await import('playwright');
      const renderedPage = fs.readFileSync(renderedPagePath, 'utf8');
      assert(
        renderedPage.includes('fonts.googleapis.com/css2?family=Cinzel') &&
          renderedPage.includes('family=Cinzel+Decorative') &&
          renderedPage.includes('family=IM+Fell+English') &&
          renderedPage.includes('family=Noto+Sans+Runic'),
        'Fate rendered page should load the page-specific rulebook font families',
        errors
      );
      assert(renderedPage.includes('/css/fate-of-the-fellowship.css'), 'Fate rendered page should load the page-specific stylesheet', errors);
      [
        'rulebook-border-rail.svg',
        'rulebook-section-divider.svg',
        'rulebook-side-ornament.svg',
        'rulebook-map-inset.svg',
        'rulebook-token-icons.svg',
        'fate-border-rail',
        'fate-section-divider',
        'fate-map-inset',
      ].forEach((snippet) => {
        assert(!renderedPage.includes(snippet), `Fate rendered page should not include removed overlapping decoration: ${snippet}`, errors);
      });
      const customCss = fs.readFileSync(customCssPath, 'utf8');
      const fateCss = fs.readFileSync(fateCssPath, 'utf8');
      const fixtureImageFileUrl = pathToFileURL(path.join(root, 'static', TEMP_FIXTURE_IMAGE_PATH.replace(/^\//, ''))).href;
      const browserHtml = renderedPage
        .replace('</head>', `<style>${customCss}\n${fateCss}</style></head>`)
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
          const topExit = document.querySelector('.fate-ledger-header > .fate-return-link');
          const styles = fatePage ? getComputedStyle(fatePage) : null;
          const headerRect = header.getBoundingClientRect();
          const topExitRect = topExit.getBoundingClientRect();
          const logList = document.querySelector('.fate-log-list');
          const logListColumns = getComputedStyle(logList).gridTemplateColumns
            .split(' ')
            .filter(Boolean).length;
          const logCardRects = Array.from(document.querySelectorAll('.fate-log-card')).map((card) => {
            const rect = card.getBoundingClientRect();
            return {
              top: Math.round(rect.top),
              left: Math.round(rect.left),
            };
          });

          return {
            overflowX: doc.scrollWidth - doc.clientWidth,
            hasFatePage: Boolean(fatePage),
            pageBackground: styles?.backgroundImage || '',
            ledgerBackground: getComputedStyle(document.querySelector('.fate-ledger')).backgroundImage,
            sectionBackground: getComputedStyle(document.querySelector('.fate-section')).backgroundImage,
            cardBackground: getComputedStyle(document.querySelector('.fate-log-card')).backgroundImage,
            h1Background: getComputedStyle(document.querySelector('.fate-ledger h1')).backgroundImage,
            h1FontFamily: getComputedStyle(document.querySelector('.fate-ledger h1')).fontFamily,
            h1TextFillColor: getComputedStyle(document.querySelector('.fate-ledger h1')).webkitTextFillColor,
            headerBackgroundImage: getComputedStyle(document.querySelector('.fate-ledger-header')).backgroundImage,
            rulebookHeroCount: document.querySelectorAll('.fate-rulebook-hero').length,
            heroPlateCount: document.querySelectorAll('.fate-hero-plate').length,
            scriptBandCount: document.querySelectorAll('.fate-script-band[aria-hidden="true"]').length,
            calloutCount: document.querySelectorAll('.fate-callout-box').length,
            separatorCount: document.querySelectorAll('.fate-session-separator').length,
            posterArtCount: document.querySelectorAll('.fate-poster-art').length,
            ledgerBeforeDisplay: getComputedStyle(document.querySelector('.fate-ledger'), '::before').display,
            requiredHeroCardCount: document.querySelectorAll('.fate-record-card.is-required').length,
            requiredQuestCardCount: document.querySelectorAll('.fate-quest-card.is-required').length,
            firstHeroCardText: document.querySelector('.fate-record-card')?.textContent.trim() || '',
            firstQuestCardText: document.querySelector('.fate-quest-card')?.textContent.trim() || '',
            headerDisplay: getComputedStyle(document.querySelector('.site-header')).display,
            footerDisplay: getComputedStyle(document.querySelector('.site-footer')).display,
            topExitText: topExit.textContent.trim(),
            topExitJustifySelf: getComputedStyle(topExit).justifySelf,
            topExitPosition: getComputedStyle(topExit).position,
            topExitRight: getComputedStyle(topExit).right,
            topExitRightOffset: headerRect.right - topExitRect.right,
            bottomExitCount: document.querySelectorAll('.fate-bottom-exit .fate-return-link').length,
            sectionCount: document.querySelectorAll('.fate-section').length,
            heroCardCount: document.querySelectorAll('.fate-record-card').length,
            questCardCount: document.querySelectorAll('.fate-quest-card').length,
            logListColumns,
            logCardRects,
            photoCount: document.querySelectorAll('.fate-log-photo img').length,
          };
        });
        await page.click('.fate-log-photo-trigger');
        const openLightboxMetrics = await page.evaluate(() => {
          const dialog = document.querySelector('.fate-photo-dialog');
          const image = document.querySelector('.fate-photo-dialog-image');

          return {
            open: Boolean(dialog?.open),
            imageSrc: image?.getAttribute('src') || '',
            imageAlt: image?.getAttribute('alt') || '',
          };
        });
        await page.click('.fate-photo-dialog-close');
        const closeLightboxMetrics = await page.evaluate(() => {
          const dialog = document.querySelector('.fate-photo-dialog');

          return {
            open: Boolean(dialog?.open),
          };
        });
        const screenshot = await page.screenshot({ fullPage: false });
        await page.close();

        assert(visualMetrics.hasFatePage, `Fate ${viewport.label} render should include the page shell`, errors);
        assert(visualMetrics.headerDisplay === 'none', `Fate ${viewport.label} render should hide the shared site header like Nemesis`, errors);
        assert(visualMetrics.footerDisplay === 'none', `Fate ${viewport.label} render should hide the shared site footer like Nemesis`, errors);
        assert(visualMetrics.headerBackgroundImage.includes('linear-gradient'), `Fate ${viewport.label} header should render parchment texture`, errors);
        assert(!visualMetrics.headerBackgroundImage.includes('repeating-linear-gradient'), `Fate ${viewport.label} hero should not render a grid texture`, errors);
        assert(!visualMetrics.ledgerBackground.includes('repeating-linear-gradient'), `Fate ${viewport.label} ledger should not render a grid texture`, errors);
        assert(!visualMetrics.sectionBackground.includes('repeating-linear-gradient'), `Fate ${viewport.label} sections should not render a grid texture`, errors);
        assert(!visualMetrics.cardBackground.includes('repeating-linear-gradient'), `Fate ${viewport.label} cards should not render a grid texture`, errors);
        assert(visualMetrics.rulebookHeroCount === 1, `Fate ${viewport.label} hero should use the rulebook hero wrapper`, errors);
        assert(visualMetrics.heroPlateCount === 1, `Fate ${viewport.label} hero should render the title plate`, errors);
        assert(visualMetrics.scriptBandCount === 1, `Fate ${viewport.label} hero should render decorative script marked aria-hidden`, errors);
        assert(visualMetrics.calloutCount === 0, `Fate ${viewport.label} render should not include removed table-note callouts`, errors);
        assert(visualMetrics.separatorCount === 0, `Fate ${viewport.label} render should not place separators between session cards`, errors);
        assert(visualMetrics.posterArtCount === 0, `Fate ${viewport.label} hero should not render the rejected poster art image`, errors);
        assert(visualMetrics.ledgerBeforeDisplay === 'none', `Fate ${viewport.label} render should not show vertical ornamental side rails`, errors);
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
        assert(visualMetrics.bottomExitCount === 1, `Fate ${viewport.label} render should include an internal bottom exit link`, errors);
        assert(visualMetrics.sectionCount >= 5, `Fate ${viewport.label} render should include tracker sections`, errors);
        assert(visualMetrics.heroCardCount === 5, `Fate ${viewport.label} render should include only tracked hero cards`, errors);
        assert(visualMetrics.questCardCount === 3, `Fate ${viewport.label} render should include only tracked quest cards`, errors);
        assert(visualMetrics.requiredHeroCardCount === 1, `Fate ${viewport.label} render should mark Frodo and Sam as the required hero card`, errors);
        assert(visualMetrics.requiredQuestCardCount === 1, `Fate ${viewport.label} render should mark Destroy the One Ring as the required quest card`, errors);
        assert(
          visualMetrics.firstHeroCardText.includes('Frodo') && visualMetrics.firstHeroCardText.includes('Sam'),
          `Fate ${viewport.label} render should put required Frodo and Sam first in the fellowship record`,
          errors
        );
        assert(
          visualMetrics.firstQuestCardText.includes('Destroy the One Ring'),
          `Fate ${viewport.label} render should put required Destroy the One Ring first in the quest record`,
          errors
        );
        if (viewport.label === 'desktop') {
          assert(visualMetrics.logListColumns === 2, `Fate desktop session log should render as two columns like Nemesis`, errors);
          assert(
            visualMetrics.logCardRects.length >= 2 &&
              visualMetrics.logCardRects[0].top === visualMetrics.logCardRects[1].top &&
              visualMetrics.logCardRects[0].left !== visualMetrics.logCardRects[1].left,
            'Fate desktop session log should place the first two session cards side by side',
            errors
          );
        }
        assert(visualMetrics.photoCount >= 1, `Fate ${viewport.label} render should include the fixture photo thumbnail`, errors);
        assert(openLightboxMetrics.open, `Fate ${viewport.label} photo lightbox should open when a session photo is clicked`, errors);
        assert(
          openLightboxMetrics.imageSrc.includes(TEMP_FIXTURE_IMAGE_PATH),
          `Fate ${viewport.label} photo lightbox should load the clicked session photo`,
          errors
        );
        assert(
          openLightboxMetrics.imageAlt.includes('Final board state for Fate of the Fellowship'),
          `Fate ${viewport.label} photo lightbox should preserve useful alt text`,
          errors
        );
        assert(!closeLightboxMetrics.open, `Fate ${viewport.label} photo lightbox should close when the close button is clicked`, errors);
        assert(
          visualMetrics.pageBackground.includes('linear-gradient') || visualMetrics.pageBackground.includes('radial-gradient'),
          `Fate ${viewport.label} render should include themed page background`,
          errors
        );
        assert(visualMetrics.h1Background === 'none', `Fate ${viewport.label} h1 should not inherit the site gradient`, errors);
        assert(
          visualMetrics.h1FontFamily.includes('Cinzel Decorative'),
          `Fate ${viewport.label} h1 should use the rulebook display font stack`,
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
          assert(visualMetrics.logListColumns === 1, `Fate mobile session log should collapse to one column`, errors);
        }
        }
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    });
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
