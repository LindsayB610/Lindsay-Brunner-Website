/**
 * Tests for the Nemesis tracker.
 *
 * Validates:
 * - game/setup metadata shape
 * - per-session YAML files and allowed values
 * - filename-to-YAML consistency
 * - setup references point to valid game/setup pairs
 * - rendered /nemesis/ page includes the expected aggregate counts
 * - rendered setup cards include every setup/board combination and reflect matching sessions
 * - every rendered session has a stable deep-link anchor
 * - the GitHub prefilled logging template includes required placeholders
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const yaml = require('js-yaml');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const gamesPath = path.join(__dirname, '..', 'data', 'nemesis', 'games.yaml');
const sessionsDir = path.join(__dirname, '..', 'data', 'nemesis', 'sessions');
const renderedPagePath = path.join(__dirname, '..', 'public', 'nemesis', 'index.html');
const layoutPath = path.join(__dirname, '..', 'layouts', 'nemesis', 'list.html');
const headPath = path.join(__dirname, '..', 'layouts', 'partials', 'head.html');
const customCssPath = path.join(__dirname, '..', 'static', 'css', 'custom.css');
const nemesisCssPath = path.join(__dirname, '..', 'static', 'css', 'nemesis.css');

const ALLOWED_GAMES = ['nemesis', 'lockdown'];
const ALLOWED_BOARDS = ['easy', 'hard'];
const ALLOWED_RESULTS = ['win', 'loss'];
const ALLOWED_PLAYERS = [2, 3, 4];
const SESSION_FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+-[a-z0-9-]+-(easy|hard)-(win|loss)\.ya?ml$/;
const MAX_SESSION_IMAGE_BYTES = 1024 * 1024;
const MAX_SESSION_IMAGE_DIMENSION = 2400;
const SESSION_IMAGE_WIDTH = 2400;
const SESSION_IMAGE_HEIGHT = 1350;

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

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json',
    '.xml': 'application/xml; charset=utf-8',
  }[extension] || 'application/octet-stream';
}

function publicFileForRequest(requestUrl) {
  const decodedPath = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const relativePath = decodedPath.replace(/^\/+/, '');
  let filePath = path.resolve(publicDir, relativePath);

  if (decodedPath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  } else if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const publicPrefix = `${path.resolve(publicDir)}${path.sep}`;
  return filePath.startsWith(publicPrefix) ? filePath : null;
}

function startStaticServer() {
  const server = http.createServer((request, response) => {
    const filePath = publicFileForRequest(request.url);

    if (!filePath || !fs.existsSync(filePath)) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, { 'content-type': contentType(filePath) });
    fs.createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve, reject) => {
    const handleError = (error) => reject(error);
    server.once('error', handleError);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', handleError);
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

async function validateBrowserBehavior(games, sessions) {
  const browserErrors = [];
  const assertBrowser = (condition, message) => {
    if (!condition) browserErrors.push(message);
  };
  const setupDefinitions = games.flatMap((game) =>
    game.setup_groups.flatMap((group) =>
      group.setups.map((setup) => ({ game: game.key, setup: setup.key }))
    )
  );
  const expectedBoardRecordCount = setupDefinitions.length * ALLOWED_BOARDS.length;
  const expectedMutedSetupCount = setupDefinitions.filter(
    ({ game, setup }) => !sessions.some((session) => session.game === game && session.setup === setup)
  ).length;
  const expectedMutedBoardCount = setupDefinitions.flatMap(({ game, setup }) =>
    ALLOWED_BOARDS.map((board) => ({ game, setup, board }))
  ).filter(
    ({ game, setup, board }) =>
      !sessions.some(
        (session) => session.game === game && session.setup === setup && session.board === board
      )
  ).length;
  const deepLinkSession = sessions.find((session) => session.final_state_image) || sessions[0];

  if (!deepLinkSession) {
    return ['Browser behavior checks require at least one rendered Nemesis session'];
  }

  const deepLinkAnchor = `session-${deepLinkSession.date}-${deepLinkSession.game}-${deepLinkSession.setup}-${deepLinkSession.board}-${deepLinkSession.result}`;
  const { chromium } = await import('playwright');
  const { server, origin } = await startStaticServer();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });

    for (const viewport of [
      { width: 1280, height: 720, label: 'desktop' },
      { width: 390, height: 844, label: 'mobile' },
    ]) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.label === 'mobile' ? 2 : 1,
        isMobile: viewport.label === 'mobile',
      });

      try {
        await page.route(/^https:\/\//, (route) => route.abort());
        await page.goto(`${origin}/nemesis/#${deepLinkAnchor}`, { waitUntil: 'load' });
        await page.waitForFunction(
          (anchor) => {
            const target = document.getElementById(anchor);
            if (!target || window.location.hash !== `#${anchor}`) return false;
            const top = target.getBoundingClientRect().top;
            return top >= 0 && top <= 40;
          },
          deepLinkAnchor,
          { timeout: 5000 }
        );

        const pageMetrics = await page.evaluate(() => {
          const target = document.querySelector(':target');
          const targetRect = target?.getBoundingClientRect();
          const targetStyle = target ? getComputedStyle(target) : null;
          const pageRoot = document.querySelector('.nemesis-page');
          const pageRootRect = pageRoot?.getBoundingClientRect();
          const pageRootAfter = pageRoot ? getComputedStyle(pageRoot, '::after') : null;
          const setupCards = [...document.querySelectorAll('.nemesis-setup-card')];
          const boardRecords = [...document.querySelectorAll('[data-nemesis-record]')];
          const sessionAnchors = [...document.querySelectorAll('.nemesis-session-anchor')];
          const mutedChip = document.querySelector('.nemesis-record-chip.is-unplayed');
          const playedChip = document.querySelector('.nemesis-record-chip:not(.is-unplayed)');

          return {
            setupCardCount: setupCards.length,
            mutedSetupCardCount: setupCards.filter((card) => card.classList.contains('is-unplayed')).length,
            boardRecordCount: boardRecords.length,
            mutedBoardRecordCount: boardRecords.filter((record) => record.classList.contains('is-unplayed')).length,
            sessionAnchorCount: sessionAnchors.length,
            sessionAnchorIconCount: document.querySelectorAll(
              '.nemesis-session-anchor > .nemesis-session-anchor-icon'
            ).length,
            sessionAnchorsUseIconOnly: sessionAnchors.every(
              (anchor) => anchor.textContent.trim() === ''
            ),
            targetId: target?.id || '',
            targetTop: targetRect ? Math.round(targetRect.top) : null,
            targetVisible: Boolean(
              targetRect && targetRect.bottom > 0 && targetRect.top < window.innerHeight
            ),
            targetBorderColor: targetStyle?.borderColor || '',
            mutedChipColor: mutedChip ? getComputedStyle(mutedChip).color : '',
            playedChipColor: playedChip ? getComputedStyle(playedChip).color : '',
            overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            pageRootHasGenericSectionClass: pageRoot?.classList.contains('section') || false,
            pageRootAfter: pageRootAfter && pageRootRect ? {
              backgroundImage: pageRootAfter.backgroundImage,
              clipPath: pageRootAfter.clipPath,
              height: Math.round(Number.parseFloat(pageRootAfter.height)),
              opacity: pageRootAfter.opacity,
              width: Math.round(Number.parseFloat(pageRootAfter.width)),
              rootHeight: Math.round(pageRootRect.height),
              rootWidth: Math.round(pageRootRect.width),
            } : null,
          };
        });

        assertBrowser(
          pageMetrics.setupCardCount === setupDefinitions.length,
          `Nemesis ${viewport.label} render should show all ${setupDefinitions.length} setup cards`
        );
        assertBrowser(
          pageMetrics.mutedSetupCardCount === expectedMutedSetupCount,
          `Nemesis ${viewport.label} render should mute exactly ${expectedMutedSetupCount} unplayed setup cards`
        );
        assertBrowser(
          pageMetrics.boardRecordCount === expectedBoardRecordCount,
          `Nemesis ${viewport.label} render should show all ${expectedBoardRecordCount} board records`
        );
        assertBrowser(
          pageMetrics.mutedBoardRecordCount === expectedMutedBoardCount,
          `Nemesis ${viewport.label} render should mute exactly ${expectedMutedBoardCount} 0W / 0L board records`
        );
        assertBrowser(
          pageMetrics.mutedChipColor !== pageMetrics.playedChipColor,
          `Nemesis ${viewport.label} render should visually distinguish 0W / 0L chips from played records`
        );
        assertBrowser(
          pageMetrics.sessionAnchorCount === sessions.length,
          `Nemesis ${viewport.label} render should expose one permalink for every session`
        );
        assertBrowser(
          pageMetrics.sessionAnchorIconCount === sessions.length && pageMetrics.sessionAnchorsUseIconOnly,
          `Nemesis ${viewport.label} render should show the standard copy icon for every session permalink`
        );
        assertBrowser(
          pageMetrics.targetId === deepLinkAnchor && pageMetrics.targetVisible && pageMetrics.targetTop <= 40,
          `Nemesis ${viewport.label} deep link should scroll the requested session into view`
        );
        assertBrowser(
          pageMetrics.targetBorderColor === 'rgba(121, 243, 187, 0.48)',
          `Nemesis ${viewport.label} deep-link target should retain its green highlight`
        );
        assertBrowser(
          pageMetrics.overflowX === 0,
          `Nemesis ${viewport.label} render should not create horizontal overflow`
        );
        assertBrowser(
          !pageMetrics.pageRootHasGenericSectionClass &&
            pageMetrics.pageRootAfter &&
            !pageMetrics.pageRootAfter.backgroundImage.includes('rgb(255, 27, 141)') &&
            pageMetrics.pageRootAfter.clipPath === 'none' &&
            Math.abs(pageMetrics.pageRootAfter.width - pageMetrics.pageRootAfter.rootWidth) <= 1 &&
            Math.abs(pageMetrics.pageRootAfter.height - pageMetrics.pageRootAfter.rootHeight) <= 1,
          `Nemesis ${viewport.label} shell should keep its scanline layer isolated from global section decorations`
        );

        const sessionAnchor = page.locator('.nemesis-session-anchor').first();
        await sessionAnchor.hover();
        const sessionAnchorHover = await sessionAnchor.evaluate((anchor) => {
          const style = getComputedStyle(anchor);
          const afterStyle = getComputedStyle(anchor, '::after');

          return {
            backgroundImage: style.backgroundImage,
            afterDisplay: afterStyle.display,
            afterBackgroundImage: afterStyle.backgroundImage,
          };
        });

        assertBrowser(
          sessionAnchorHover.backgroundImage === 'none' &&
            sessionAnchorHover.afterDisplay === 'none' &&
            sessionAnchorHover.afterBackgroundImage === 'none',
          `Nemesis ${viewport.label} session permalink hover should suppress the site-wide link gradient`
        );

        const moreToggle = page
          .locator('.nemesis-log-card:has(.nemesis-log-photo) .nemesis-log-note-toggle:not([hidden])')
          .first();

        assertBrowser(
          (await moreToggle.count()) === 1,
          `Nemesis ${viewport.label} render should expose a More control for an overflowing photo session`
        );

        if ((await moreToggle.count()) === 1) {
          await moreToggle.click();
          assertBrowser(
            (await moreToggle.textContent()).trim() === 'Less' &&
              (await moreToggle.getAttribute('aria-expanded')) === 'true',
            `Nemesis ${viewport.label} More control should expand its session note`
          );

          await moreToggle.click();
          const moreMetrics = await moreToggle.evaluate((toggle) => {
            const card = toggle.closest('.nemesis-log-card');
            const photo = card.querySelector('.nemesis-log-photo');
            const toggleRect = toggle.getBoundingClientRect();
            const photoRect = photo.getBoundingClientRect();
            const style = getComputedStyle(toggle);

            return {
              label: toggle.textContent.trim(),
              expanded: toggle.getAttribute('aria-expanded'),
              gapToPhoto: photoRect.top - toggleRect.bottom,
              outlineColor: style.outlineColor,
              outlineWidth: style.outlineWidth,
            };
          });

          assertBrowser(
            moreMetrics.label === 'More' && moreMetrics.expanded === 'false',
            `Nemesis ${viewport.label} More control should collapse back to its original state`
          );
          assertBrowser(
            moreMetrics.gapToPhoto >= 10,
            `Nemesis ${viewport.label} More control should keep at least 10px clear of the session photo`
          );
          assertBrowser(
            moreMetrics.outlineColor === 'rgba(121, 243, 187, 0.72)' &&
              moreMetrics.outlineWidth === '2px',
            `Nemesis ${viewport.label} More control should use the green focus ring`
          );
        }

        const photoTrigger = page.locator('.nemesis-log-photo-trigger').first();
        await photoTrigger.focus();
        const photoTriggerFocus = await photoTrigger.evaluate((trigger) => {
          const style = getComputedStyle(trigger);
          return {
            outlineColor: style.outlineColor,
            outlineWidth: style.outlineWidth,
          };
        });
        assertBrowser(
          photoTriggerFocus.outlineColor === 'rgba(121, 243, 187, 0.7)' &&
            photoTriggerFocus.outlineWidth === '2px',
          `Nemesis ${viewport.label} photo trigger should suppress the site-wide pink focus ring`
        );

        await photoTrigger.click();
        await page.waitForFunction(() => {
          const dialog = document.querySelector('.nemesis-photo-dialog');
          const image = document.querySelector('.nemesis-photo-dialog-image');
          return Boolean(dialog?.open && image?.complete && image?.naturalWidth > 0);
        });

        const dialogMetrics = await page.evaluate(() => {
          const dialog = document.querySelector('.nemesis-photo-dialog');
          const close = document.querySelector('.nemesis-photo-dialog-close');
          const dialogRect = dialog.getBoundingClientRect();
          const closeStyle = getComputedStyle(close);

          return {
            centerDelta: Math.abs((dialogRect.top + dialogRect.bottom) / 2 - window.innerHeight / 2),
            closeFocused: document.activeElement === close,
            closeOutlineColor: closeStyle.outlineColor,
            closeOutlineWidth: closeStyle.outlineWidth,
          };
        });

        assertBrowser(
          dialogMetrics.centerDelta <= 1,
          `Nemesis ${viewport.label} photo dialog should be vertically centered within 1px`
        );
        assertBrowser(
          dialogMetrics.closeFocused,
          `Nemesis ${viewport.label} photo dialog should focus its close control when opened`
        );
        assertBrowser(
          dialogMetrics.closeOutlineColor === 'rgba(121, 243, 187, 0.72)' &&
            dialogMetrics.closeOutlineWidth === '2px',
          `Nemesis ${viewport.label} photo close control should use the green focus ring`
        );

        await page.locator('.nemesis-photo-dialog-close').click();
        assertBrowser(
          !(await page.locator('.nemesis-photo-dialog').evaluate((dialog) => dialog.open)),
          `Nemesis ${viewport.label} photo dialog should close from its X control`
        );

        await page.emulateMedia({ media: 'print' });
        const printMetrics = await page.evaluate(() => {
          const root = document.querySelector('.nemesis-page');
          const rootStyle = getComputedStyle(root);
          const rootAfter = getComputedStyle(root, '::after');
          const cardStyle = getComputedStyle(document.querySelector('.nemesis-log-card'));

          return {
            bodyBackground: getComputedStyle(document.body).backgroundImage,
            bodyColor: getComputedStyle(document.body).color,
            cardBackground: cardStyle.backgroundImage,
            rootAfterDisplay: rootAfter.display,
            rootAfterBackground: rootAfter.backgroundImage,
            rootColor: rootStyle.color,
          };
        });
        assertBrowser(
          printMetrics.bodyColor !== 'rgb(0, 0, 0)' &&
            printMetrics.rootColor !== 'rgb(0, 0, 0)' &&
            printMetrics.cardBackground !== 'none' &&
            printMetrics.rootAfterDisplay !== 'none' &&
            !printMetrics.rootAfterBackground.includes('rgb(255, 27, 141)'),
          `Nemesis ${viewport.label} print view should not inherit the site-wide white-and-black content reset`
        );
        await page.emulateMedia({ media: 'screen' });
      } finally {
        await page.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  return browserErrors;
}

async function main() {
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

  [
    headPath,
    customCssPath,
    nemesisCssPath,
  ].forEach((targetPath) => {
    if (!fs.existsSync(targetPath)) {
      failed++;
      errors.push(`Missing Nemesis support file: ${targetPath}`);
    }
  });

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
  for (const file of sessionFiles) {
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

    if (
      'final_state_image' in session &&
      (
        typeof session.final_state_image !== 'string' ||
        session.final_state_image.trim() === '' ||
        !session.final_state_image.startsWith('/')
      )
    ) {
      failed++;
      errors.push(`Session "${file}" has an invalid final_state_image path`);
    }

    if (typeof session.final_state_image === 'string' && session.final_state_image.startsWith('/')) {
      const imagePath = path.join(__dirname, '..', 'static', session.final_state_image.replace(/^\//, ''));
      if (!fs.existsSync(imagePath)) {
        failed++;
        errors.push(`Session "${file}" references missing final_state_image "${session.final_state_image}"`);
      } else {
        const imageStats = fs.statSync(imagePath);
        if (imageStats.size > MAX_SESSION_IMAGE_BYTES) {
          failed++;
          errors.push(
            `Session "${file}" final_state_image exceeds ${MAX_SESSION_IMAGE_BYTES} bytes: "${session.final_state_image}"`
          );
        }

        try {
          const metadata = await sharp(imagePath).metadata();
          if (
            metadata.width > MAX_SESSION_IMAGE_DIMENSION ||
            metadata.height > MAX_SESSION_IMAGE_DIMENSION
          ) {
            failed++;
            errors.push(
              `Session "${file}" final_state_image exceeds ${MAX_SESSION_IMAGE_DIMENSION}px max dimension: "${session.final_state_image}"`
            );
          }

          if (
            metadata.width !== SESSION_IMAGE_WIDTH ||
            metadata.height !== SESSION_IMAGE_HEIGHT
          ) {
            failed++;
            errors.push(
              `Session "${file}" final_state_image must be ${SESSION_IMAGE_WIDTH}x${SESSION_IMAGE_HEIGHT}: "${session.final_state_image}" is ${metadata.width}x${metadata.height}`
            );
          }
        } catch (error) {
          failed++;
          errors.push(
            `Session "${file}" final_state_image could not be inspected: "${session.final_state_image}" (${error.message})`
          );
        }
      }
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
  }

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
    const newFileUrlMatch = layoutSource.match(/href="([^"]*github\.com\/LindsayB610\/Lindsay-Brunner-Website\/new\/main\/data\/nemesis\/sessions[^"]*)"/);

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
      'final_state_image: "/images/nemesis/session-photos/REPLACE-ME.jpg"',
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

  console.log('\n🎨 Validating Nemesis page stylesheet split...');
  if (fs.existsSync(headPath) && fs.existsSync(customCssPath) && fs.existsSync(nemesisCssPath)) {
    const head = fs.readFileSync(headPath, 'utf8');
    const customCss = fs.readFileSync(customCssPath, 'utf8');
    const nemesisCss = fs.readFileSync(nemesisCssPath, 'utf8');

    [
      'eq .RelPermalink "/nemesis/"',
      '/css/nemesis.css?v={{ $assetVersion }}',
    ].forEach((snippet) => {
      if (!head.includes(snippet)) {
        failed++;
        errors.push(`Head partial is missing Nemesis CSS loading hook: ${snippet}`);
      }
    });

    [
      '/* Nemesis tracker */',
      '.nemesis-page',
      '.nemesis-terminal-frame',
      '.nemesis-status.is-win',
      '.nemesis-photo-dialog',
      'transform: translate(-50%, -50%)',
      '.nemesis-photo-dialog-close:focus',
    ].forEach((snippet) => {
      if (!nemesisCss.includes(snippet)) {
        failed++;
        errors.push(`Nemesis CSS is missing expected page styling hook: ${snippet}`);
      }
    });

    [
      '/* Nemesis tracker */',
      '.nemesis-page',
      '.nemesis-terminal-frame',
    ].forEach((snippet) => {
      if (customCss.includes(snippet)) {
        failed++;
        errors.push(`Shared custom CSS should not contain Nemesis page styling: ${snippet}`);
      }
    });

    if (!errors.some((error) => error.includes('Nemesis CSS') || error.includes('Head partial') || error.includes('Shared custom CSS'))) {
      console.log('   ✓ Nemesis CSS is isolated and loaded only by the Nemesis route');
      passed++;
    }
  }

  console.log('\n📊 Validating rendered aggregate counts...');
  if (!fs.existsSync(renderedPagePath)) {
    failed++;
    errors.push(`Rendered Nemesis page not found at ${renderedPagePath}. Run "npm run build" first.`);
  } else {
    const renderedHtmlRaw = fs.readFileSync(renderedPagePath, 'utf8');
    if (!renderedHtmlRaw.includes('/css/nemesis.css')) {
      failed++;
      errors.push('Rendered Nemesis page should load the page-specific stylesheet');
    }
    const renderedHtml = stripHtml(renderedHtmlRaw);
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

    let expectedSetupCardCount = 0;
    let expectedBoardRecordCount = 0;

    games.forEach((game) => {
      game.setup_groups.forEach((group) => {
        group.setups.forEach((setup) => {
          expectedSetupCardCount++;
          expectedBoardRecordCount += 2;

          const matchingSessions = sessions.filter(
            (candidate) => candidate.game === game.key && candidate.setup === setup.key
          );
          const setupCardTag = renderedHtmlRaw.match(
            new RegExp(
              `<article[^>]*data-nemesis-game=["']?${game.key}["']?[^>]*data-nemesis-setup=["']?${setup.key}["']?[^>]*>`
            )
          );

          if (!setupCardTag) {
            failed++;
            errors.push(`Rendered Nemesis page is missing setup card for ${game.key}/${setup.key}`);
            return;
          }

          const setupShouldBeMuted = matchingSessions.length === 0;
          if (setupCardTag[0].includes('is-unplayed') !== setupShouldBeMuted) {
            failed++;
            errors.push(
              `Rendered Nemesis setup card has incorrect muted state for ${game.key}/${setup.key}`
            );
          }

          ['easy', 'hard'].forEach((board) => {
            const matchingBoardSessions = matchingSessions.filter(
              (candidate) => candidate.board === board
            );
            const recordKey = `${game.key}:${setup.key}:${board}`;
            const boardRecordTag = renderedHtmlRaw.match(
              new RegExp(`<div[^>]*data-nemesis-record=["']?${recordKey}["']?[^>]*>`)
            );

            if (!boardRecordTag) {
              failed++;
              errors.push(`Rendered Nemesis page is missing board record for ${recordKey}`);
              return;
            }

            const recordShouldBeMuted = matchingBoardSessions.length === 0;
            if (boardRecordTag[0].includes('is-unplayed') !== recordShouldBeMuted) {
              failed++;
              errors.push(`Rendered Nemesis board record has incorrect muted state for ${recordKey}`);
            }
          });
        });
      });
    });

    const renderedSetupCardCount = (renderedHtmlRaw.match(/data-nemesis-game=/g) || []).length;
    const renderedBoardRecordCount = (renderedHtmlRaw.match(/data-nemesis-record=/g) || []).length;

    if (renderedSetupCardCount !== expectedSetupCardCount) {
      failed++;
      errors.push(
        `Rendered Nemesis page should include ${expectedSetupCardCount} setup cards, found ${renderedSetupCardCount}`
      );
    }

    if (renderedBoardRecordCount !== expectedBoardRecordCount) {
      failed++;
      errors.push(
        `Rendered Nemesis page should include ${expectedBoardRecordCount} board records, found ${renderedBoardRecordCount}`
      );
    }

    if (
      !renderedHtmlRaw.includes('scrollIntoView') ||
      !renderedHtmlRaw.includes('hashchange') ||
      !renderedHtmlRaw.includes('startsWith("session-")')
    ) {
      failed++;
      errors.push('Rendered Nemesis page is missing session-anchor scroll handling');
    }

    sessions.forEach((session) => {
      const sessionAnchor = `session-${session.date}-${session.game}-${session.setup}-${session.board}-${session.result}`;
      const sessionCardTag = renderedHtmlRaw.match(
        new RegExp(`<article[^>]*id=["']?${sessionAnchor}["']?[^>]*>`)
      );
      const sessionAnchorLink = renderedHtmlRaw.match(
        new RegExp(`<a[^>]*href=["']?#${sessionAnchor}["']?[^>]*>`)
      );
      const sessionAnchorIcon = renderedHtmlRaw.match(
        new RegExp(
          `<a[^>]*href=["']?#${sessionAnchor}["']?[^>]*>(?:(?!</a>)[\\s\\S])*?<svg[^>]*class=["']nemesis-session-anchor-icon["']`
        )
      );

      if (!sessionCardTag) {
        failed++;
        errors.push(`Rendered Nemesis page is missing session anchor id "${sessionAnchor}"`);
      }

      if (!sessionAnchorLink) {
        failed++;
        errors.push(`Rendered Nemesis page is missing session anchor link "#${sessionAnchor}"`);
      }

      if (!sessionAnchorIcon) {
        failed++;
        errors.push(`Rendered Nemesis session anchor "#${sessionAnchor}" is missing its copy icon`);
      }

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

      if (
        typeof session.final_state_image === 'string' &&
        !renderedHtmlRaw.includes(session.final_state_image)
      ) {
        failed++;
        errors.push(
          `Rendered Nemesis page is missing expected final_state_image for ${session.game}/${session.setup}: "${session.final_state_image}"`
        );
      }
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

  console.log('\n🖥️  Validating real browser behavior...');
  try {
    const browserErrors = await validateBrowserBehavior(games, sessions);

    if (browserErrors.length > 0) {
      failed += browserErrors.length;
      errors.push(...browserErrors);
    } else {
      console.log('   ✓ Desktop and mobile browser interactions are valid');
      passed++;
    }
  } catch (error) {
    failed++;
    errors.push(`Nemesis browser behavior checks failed unexpectedly: ${error.message}`);
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

if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Unexpected Nemesis tracker test failure:', error);
    process.exit(1);
  });
}

module.exports = {
  ALLOWED_GAMES,
  ALLOWED_BOARDS,
  ALLOWED_RESULTS,
  ALLOWED_PLAYERS,
  SESSION_FILENAME_REGEX,
};
