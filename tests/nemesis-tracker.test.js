/**
 * Tests for the Nemesis tracker.
 *
 * Validates:
 * - game/setup metadata shape
 * - per-session YAML files and allowed values
 * - filename-to-YAML consistency
 * - setup references point to valid game/setup pairs
 * - rendered /nemesis/ page includes the expected aggregate counts
 * - rendered setup cards reflect matching sessions
 * - the GitHub prefilled logging template includes required placeholders
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const gamesPath = path.join(__dirname, '..', 'data', 'nemesis', 'games.yaml');
const sessionsDir = path.join(__dirname, '..', 'data', 'nemesis', 'sessions');
const renderedPagePath = path.join(__dirname, '..', 'public', 'nemesis', 'index.html');
const layoutPath = path.join(__dirname, '..', 'layouts', 'nemesis', 'list.html');

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
  return normalizeText(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
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

    if (!Array.isArray(game.setup_groups) || game.setup_groups.length === 0) {
      failed++;
      errors.push(`Game "${game.key}" must include at least one setup group`);
      return;
    }

    const setupMap = new Map();
    game.setup_groups.forEach((group, groupIndex) => {
      if (!group.key || !group.name) {
        failed++;
        errors.push(`Game "${game.key}" setup group ${groupIndex} must include key and name`);
        return;
      }

      if (!Array.isArray(group.setups) || group.setups.length === 0) {
        failed++;
        errors.push(`Game "${game.key}" setup group "${group.key}" must include at least one setup`);
        return;
      }

      group.setups.forEach((setup, setupIndex) => {
        if (!setup.key || !setup.name) {
          failed++;
          errors.push(`Game "${game.key}" setup group "${group.key}" setup ${setupIndex} must include key and name`);
          return;
        }

        if (setupMap.has(setup.key)) {
          failed++;
          errors.push(`Game "${game.key}" contains duplicate setup key "${setup.key}"`);
        }

        setupMap.set(setup.key, {
          name: setup.name,
          groupName: group.name,
          groupKey: group.key,
        });
      });
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

    const filenameBase = file.replace(/\.ya?ml$/, '');
    const filenameParts = filenameBase.split('-');
    const filenameDate = filenameParts.slice(0, 3).join('-');
    const filenameBoard = filenameParts[filenameParts.length - 2];
    const filenameResult = filenameParts[filenameParts.length - 1];
    const filenameGame = filenameParts[3];
    const filenameSetup = filenameParts.slice(4, -2).join('-');

    if (session.date !== filenameDate) {
      failed++;
      errors.push(`Session "${file}" date "${session.date}" does not match filename date "${filenameDate}"`);
    }

    if (session.game !== filenameGame) {
      failed++;
      errors.push(`Session "${file}" game "${session.game}" does not match filename game "${filenameGame}"`);
    }

    if (session.setup !== filenameSetup) {
      failed++;
      errors.push(`Session "${file}" setup "${session.setup}" does not match filename setup "${filenameSetup}"`);
    }

    if (session.board !== filenameBoard) {
      failed++;
      errors.push(`Session "${file}" board "${session.board}" does not match filename board "${filenameBoard}"`);
    }

    if (session.result !== filenameResult) {
      failed++;
      errors.push(`Session "${file}" result "${session.result}" does not match filename result "${filenameResult}"`);
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

  console.log('\n🔗 Validating GitHub logging template...');
  if (!fs.existsSync(layoutPath)) {
    failed++;
    errors.push(`Nemesis layout not found at ${layoutPath}`);
  } else {
    const layoutSource = fs.readFileSync(layoutPath, 'utf8');
    const newFileUrlMatch = layoutSource.match(/href="([^"]*github\.com\/LindsayB610\/Lindsay-Brunner-Website\/new\/master\/data\/nemesis\/sessions[^"]*)"/);

    if (!newFileUrlMatch) {
      failed++;
      errors.push('Nemesis GitHub template link could not be found in the layout');
    } else {
      const templateUrl = new URL(newFileUrlMatch[1]);
      const decodedFilename = decodeURIComponent(templateUrl.searchParams.get('filename') || '');
      const decodedValue = decodeURIComponent(templateUrl.searchParams.get('value') || '');
    const requiredTemplateSnippets = [
      'REPLACE-ME-YYYY-MM-DD-game-setup-board-result.yaml',
      'Replace everything marked REPLACE-ME before committing.',
      'Update the filename too.',
      'date: "REPLACE-ME-YYYY-MM-DD"',
      'game: "REPLACE-ME-GAME"',
      'setup: "REPLACE-ME-SETUP"',
      'board: "REPLACE-ME-BOARD"',
      'result: "REPLACE-ME-RESULT"',
      'players: REPLACE-ME-PLAYERS',
      'note: "REPLACE-ME: Short recap of what happened."',
      'aftermath-intruders',
      'aftermath-night-stalkers',
      'aftermath-carnomorphs',
      'aftermath-void-seeders',
      'aftermath-chytrids',
    ];

      if (!decodedFilename.includes('REPLACE-ME-YYYY-MM-DD-game-setup-board-result.yaml')) {
        failed++;
        errors.push('Nemesis GitHub template filename is missing the REPLACE-ME placeholder');
      }

      requiredTemplateSnippets.slice(1).forEach((snippet) => {
        if (!decodedValue.includes(snippet)) {
          failed++;
          errors.push(`Nemesis GitHub template is missing expected text: "${snippet}"`);
        }
      });

      if (!errors.some((error) => error.includes('Nemesis GitHub template'))) {
        console.log('   ✓ GitHub logging template includes required placeholders and setup keys');
        passed++;
      }
    }
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

    sessions.forEach((session) => {
      const setupDetails = gameMap.get(session.game)?.get(session.setup);
      if (!setupDetails) {
        return;
      }

      const matchingSessions = sessions.filter(
        (candidate) => candidate.game === session.game && candidate.setup === session.setup
      );
      const easyWinsForSetup = matchingSessions.filter(
        (candidate) => candidate.board === 'easy' && candidate.result === 'win'
      ).length;
      const easyLossesForSetup = matchingSessions.filter(
        (candidate) => candidate.board === 'easy' && candidate.result === 'loss'
      ).length;
      const hardWinsForSetup = matchingSessions.filter(
        (candidate) => candidate.board === 'hard' && candidate.result === 'win'
      ).length;
      const hardLossesForSetup = matchingSessions.filter(
        (candidate) => candidate.board === 'hard' && candidate.result === 'loss'
      ).length;
      const setupDisplayName =
        setupDetails.groupKey === 'core'
          ? setupDetails.name
          : `${setupDetails.groupName} ${setupDetails.name}`;

      [
        setupDisplayName,
        `${matchingSessions.length} logged session${matchingSessions.length === 1 ? '' : 's'}`,
        `${easyWinsForSetup}W / ${easyLossesForSetup}L`,
        `${hardWinsForSetup}W / ${hardLossesForSetup}L`,
      ].forEach((expected) => {
        if (!renderedHtml.includes(normalizeText(expected))) {
          failed++;
          errors.push(
            `Rendered Nemesis page is missing expected setup-card text for ${session.game}/${session.setup}: "${expected}"`
          );
        }
      });
    });

    if (
      sessions.length === 0 &&
      !renderedHtml.includes(
        normalizeText('No incidents logged yet. The archive is waiting for its first disaster.')
      )
    ) {
      failed++;
      errors.push('Rendered Nemesis page is missing the empty-state session log message');
    }

    if (!errors.some((error) => error.includes('Rendered Nemesis page'))) {
      console.log('   ✓ Rendered counts and setup cards match session data');
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
  ALLOWED_PLAYERS,
  SESSION_FILENAME_REGEX,
};
