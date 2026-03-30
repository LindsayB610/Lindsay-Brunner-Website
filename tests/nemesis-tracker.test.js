/**
 * Tests for the Nemesis tracker.
 *
 * Validates:
 * - game/setup metadata shape
 * - per-session YAML files and allowed values
 * - setup references point to valid game/setup pairs
 * - session filenames follow the agreed pattern
 * - rendered /nemesis/ page includes the expected aggregate counts
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const gamesPath = path.join(__dirname, '..', 'data', 'nemesis', 'games.yaml');
const sessionsDir = path.join(__dirname, '..', 'data', 'nemesis', 'sessions');
const renderedPagePath = path.join(__dirname, '..', 'public', 'nemesis', 'index.html');

const ALLOWED_GAMES = ['nemesis', 'lockdown'];
const ALLOWED_BOARDS = ['easy', 'hard'];
const ALLOWED_RESULTS = ['win', 'loss'];
const ALLOWED_PLAYERS = [2, 3, 4];
const SESSION_FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+-[a-z0-9-]+-(easy|hard)-(win|loss)\.ya?ml$/;

function loadYamlFile(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function stripHtml(value) {
  return normalizeText(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
}

if (require.main === module) {
  console.log('🧪 Testing Nemesis tracker...\n');

  let passed = 0;
  let failed = 0;
  const errors = [];

  console.log('📁 Checking tracker files...');
  if (!fs.existsSync(gamesPath)) {
    failed++;
    errors.push(`Missing games metadata file: ${gamesPath}`);
  } else {
    console.log('   ✓ games metadata file exists');
    passed++;
  }

  if (!fs.existsSync(sessionsDir)) {
    failed++;
    errors.push(`Missing sessions directory: ${sessionsDir}`);
  } else {
    console.log('   ✓ sessions directory exists');
    passed++;
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((error) => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('\n🎲 Validating game/setup metadata...');
  let games = [];
  try {
    games = loadYamlFile(gamesPath);
    if (!Array.isArray(games) || games.length === 0) {
      failed++;
      errors.push('games.yaml must contain a non-empty array');
    } else {
      console.log(`   ✓ Loaded ${games.length} game definition(s)`);
      passed++;
    }
  } catch (error) {
    failed++;
    errors.push(`Unable to parse games.yaml: ${error.message}`);
  }

  const gameMap = new Map();
  games.forEach((game, index) => {
    if (!game || typeof game !== 'object') {
      failed++;
      errors.push(`Game entry ${index} is not an object`);
      return;
    }

    if (!game.key || !ALLOWED_GAMES.includes(game.key)) {
      failed++;
      errors.push(`Game entry ${index} has invalid key "${game.key}"`);
    }

    if (!game.name || !game.label) {
      failed++;
      errors.push(`Game "${game.key}" must include both name and label`);
    }

    if (!Array.isArray(game.setups) || game.setups.length === 0) {
      failed++;
      errors.push(`Game "${game.key}" must include at least one setup`);
      return;
    }

    const setupMap = new Map();
    game.setups.forEach((setup, setupIndex) => {
      if (!setup.key || !setup.name) {
        failed++;
        errors.push(`Game "${game.key}" setup ${setupIndex} must include key and name`);
        return;
      }
      if (setupMap.has(setup.key)) {
        failed++;
        errors.push(`Game "${game.key}" contains duplicate setup key "${setup.key}"`);
      }
      setupMap.set(setup.key, setup.name);
    });

    if (!gameMap.has(game.key)) {
      gameMap.set(game.key, setupMap);
    } else {
      failed++;
      errors.push(`Duplicate game key "${game.key}" in games.yaml`);
    }
  });

  if (!errors.some((error) => error.includes('games.yaml') || error.includes('Game "'))) {
    console.log('   ✓ Game/setup metadata is valid');
    passed++;
  }

  console.log('\n🗂️  Validating session files...');
  const sessionFiles = fs
    .readdirSync(sessionsDir)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
    .sort();

  console.log(`   ✓ Found ${sessionFiles.length} session file(s)`);
  passed++;

  const sessions = [];
  sessionFiles.forEach((file) => {
    if (!SESSION_FILENAME_REGEX.test(file)) {
      failed++;
      errors.push(`Session filename does not match expected format: ${file}`);
    }

    const filePath = path.join(sessionsDir, file);
    let session;
    try {
      session = loadYamlFile(filePath);
    } catch (error) {
      failed++;
      errors.push(`Unable to parse session file "${file}": ${error.message}`);
      return;
    }

    const requiredFields = ['date', 'game', 'setup', 'board', 'result', 'players', 'note'];
    requiredFields.forEach((field) => {
      if (!(field in session)) {
        failed++;
        errors.push(`Session "${file}" is missing required field "${field}"`);
      }
    });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(session.date || '')) {
      failed++;
      errors.push(`Session "${file}" has invalid date "${session.date}"`);
    }

    if (!ALLOWED_GAMES.includes(session.game)) {
      failed++;
      errors.push(`Session "${file}" has invalid game "${session.game}"`);
    }

    if (!ALLOWED_BOARDS.includes(session.board)) {
      failed++;
      errors.push(`Session "${file}" has invalid board "${session.board}"`);
    }

    if (!ALLOWED_RESULTS.includes(session.result)) {
      failed++;
      errors.push(`Session "${file}" has invalid result "${session.result}"`);
    }

    if (!ALLOWED_PLAYERS.includes(Number(session.players))) {
      failed++;
      errors.push(`Session "${file}" has invalid players "${session.players}"`);
    }

    if (typeof session.note !== 'string' || session.note.trim() === '') {
      failed++;
      errors.push(`Session "${file}" must have a non-empty note`);
    }

    if (gameMap.has(session.game)) {
      const setupMap = gameMap.get(session.game);
      if (!setupMap.has(session.setup)) {
        failed++;
        errors.push(`Session "${file}" references unknown setup "${session.setup}" for game "${session.game}"`);
      }
    }

    sessions.push(session);
  });

  if (!errors.some((error) => error.startsWith('Session "'))) {
    console.log('   ✓ Session files are valid');
    passed++;
  }

  console.log('\n📊 Validating rendered aggregate counts...');
  if (!fs.existsSync(renderedPagePath)) {
    failed++;
    errors.push(`Rendered Nemesis page not found at ${renderedPagePath}. Run "npm run build" first.`);
  } else {
    const renderedHtml = stripHtml(fs.readFileSync(renderedPagePath, 'utf8'));
    const totalRuns = sessions.length;
    const totalWins = sessions.filter((session) => session.result === 'win').length;
    const totalLosses = sessions.filter((session) => session.result === 'loss').length;
    const easyWins = sessions.filter((session) => session.board === 'easy' && session.result === 'win').length;
    const easyLosses = sessions.filter((session) => session.board === 'easy' && session.result === 'loss').length;
    const hardWins = sessions.filter((session) => session.board === 'hard' && session.result === 'win').length;
    const hardLosses = sessions.filter((session) => session.board === 'hard' && session.result === 'loss').length;

    const expectedStrings = [
      `Total runs ${totalRuns}`,
      `${totalWins} wins / ${totalLosses} losses`,
      `${easyWins}W / ${easyLosses}L`,
      `${hardWins}W / ${hardLosses}L`,
    ];

    expectedStrings.forEach((expected) => {
      if (!renderedHtml.includes(normalizeText(expected))) {
        failed++;
        errors.push(`Rendered Nemesis page is missing expected text: "${expected}"`);
      }
    });

    if (sessions.length === 0 && !renderedHtml.includes(normalizeText('No incidents logged yet. The archive is waiting for its first disaster.'))) {
      failed++;
      errors.push('Rendered Nemesis page is missing the empty-state session log message');
    }

    if (!errors.some((error) => error.includes('Rendered Nemesis page'))) {
      console.log('   ✓ Rendered counts match session data');
      passed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((error) => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('\n✅ All Nemesis tracker tests passed!');
  process.exit(0);
}

module.exports = {
  ALLOWED_GAMES,
  ALLOWED_BOARDS,
  ALLOWED_RESULTS,
  SESSION_FILENAME_REGEX,
};
