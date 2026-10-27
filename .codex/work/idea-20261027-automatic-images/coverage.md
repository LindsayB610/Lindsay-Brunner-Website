# Current-source image coverage (task 01)

Inspected base `b70a2b147c991f257ea8bcbf3f40ac4cb558999a`, origin `https://github.com/LindsayB610/Lindsay-Brunner-Website.git`. `git ls-tree HEAD static/christmas-2026-lucas/index.html` returns tracked blob `d3595502806e01b1cc3f74b690213672c2893f2e`. Canonical source is standalone HTML copied by Hugo. Netlify config production/preview/branch builds use `npm ci && npm run build`, publish `public`. No remote deploy metadata or branch protection was read in this task; current live deployment equivalence remains a coordinator verification step.

Inventory scope: every raster under static, source image consumers under layouts/src/static/content, runtime data/JS paths, CSS URL search, build/test harness. There are **256 raster files, 39,197,559 bytes** before build-generated updates; no raster files under content page bundles. Dimensions below were read by macOS sips without modifying sources. This is current-source inventory, not a claim every file is published/visible or a rendered-route crawl. A final-output inventory is required after task02. Full repository inventory avoids treating only discovered references as the source universe.

## Consumer and route map

| Source / route | Actual input and behavior | Delivery policy / next owner |
| --- | --- | --- |
| `static/christmas-2026-lucas/index.html`, `/christmas-2026-lucas/` | 33 img elements: cover + 32 product/character/bath images; all local relative URLs. Cover 1200×630, 533071 bytes, high priority, no srcset. assets folder has 33 files, including one currently unused puzzle. | Task02 automatic static transform; cover eager/high, other images lazy; preserve SVG favicons, OG/Twitter original PNG, meta robots and header noindex. Separate card slots, alpha art kept. |
| `layouts/_default/_markup/render-image.html` | Markdown image URL, currently all eager | Task03 semantic shared partial/default body profile; task02 final transform; preserve explicit overrides. |
| `layouts/index.html` + `src/react/homepage.tsx`, `/` | Workshop shelf screenshot, fallback and React both local PNG, lazy | Shared descriptor and initial sources; fallback slot differs today so align presentation sizes without redesign. |
| `layouts/about/single.html` + `src/react/about.tsx`, `/about/` | transparent avatar 3072², fallback vs React wrapper widths differ | Shared portrait descriptor, eager, transparent. Need slot alignment to avoid takeover candidate switch. |
| `src/block/contact-section-with-shader.tsx` | Six testimonials backed by five JPEGs, visible TestimonialAvatar 64×64; dynamic state/error fallback | Task03 shared component, micro profile, lazy, preserve round CSS crop and error icon. Appears on homepage/about. |
| `src/block/single-row-logo-cloud.tsx` | Seven rotating companies, six SVGs + Parasail PNG 2065×327 displayed max126px; timer 5200ms | Shared component/passthrough SVG, lossless micro PNG; test initial row and rotation. |
| `layouts/shortcodes/zoomable-diagram.html` | Same source in thumbnail and hidden dialog at initial render | Task03 defer original to click, clear responsive srcsets/source children on open/swap/close. Current bug: hidden img fetches. |
| `layouts/shortcodes/codex-display-progress.html` + `data/codex_usage_display_process.json` | All slides in DOM; first eager, others lazy; `/js/carousel.js` scrolls existing slides | Static transform uses body/photo profiles; preserve captions, fit CSS and scroll behavior. No dynamic image URL assignment in carousel. |
| `layouts/shortcodes/slate-gallery.html` | Three PNG screenshots: slate-library, slate-codex-skills, slate-freezer | Lossless, lazy; retain gallery layout. |
| `layouts/shortcodes/workshop-screenshot.html` | Parameterized screenshot src, eager | Lossless shared descriptor; caller context sets sizes; preserve approved art. |
| `layouts/workshop/single.html`, `/workshop/` | SVG workshop mark, shelf hero PNG, two pulse screenshots | SVG identity; responsive lossless hero/body; existing responsive grid preserved. |
| `layouts/nemesis/list.html`, `/nemesis/` | `data/nemesis/sessions/*.yaml` final_state_image; lazy thumbnails, 16:9 CSS crop; data original URL and 1px data-GIF placeholder | Shared thumbnail; existing click already assigns original, close resets. Explicit interaction adapter exception, no eager original. |
| `layouts/fate-of-the-fellowship/list.html`, `/fate-of-the-fellowship/` | `data/fate-of-the-fellowship/sessions/*.yaml` final_state_image; same placeholder/click pattern, sepia/CSS crop | Same; retain full original reference and visual filters. |
| `layouts/signal/single.html`, `/signal/` | Signal logo 120×120 | Small identity may retain original with reason; eager. |
| `layouts/post/summary-with-image.html` | Legacy featured_image parameter, may be local/remote | Must not silently omit because legacy; transform local or require exact external policy. No remote fetch in build. |
| `src/react/ai-chat-exporter.tsx` | Turnstile script.src assignment, not an image | Exact non-image script-loader exception. Export-generated PDF/media are not site display assets. |
| `static/css/*.css`, `src/**/*.css/tsx` | Searched background/url uses; found gradients and SVG fragment paint/filter URLs, no raster background URL consumer | Leave gradients/fragments; source gate must reject/classify future raster CSS URL consumers. |
| `layouts/partials` social/head + `static/favicons`, Christmas icon files | Identity metadata/icons | Preserve original URL/bytes. Visible dual-use OG art still receives variants. |
| SVG/animation/data/remote/user uploads | Logo/diagram SVG and known data GIF placeholders exist; static raster extension inventory has no GIF/AVIF; no first-party remote visible raster found | Vector passthrough; animation capability detected by decoder, not extension. Remote/upload cases unsupported unless exact registered policy, no build-time download. |

Content image source files identified by source search (including code examples, not all necessarily rendered images):

- `content/blog/build-e-ink-codex-usage-display-with-ai.md`
- `content/blog/content-resonance-framework-beyond-engagement-metrics.md`
- `content/blog/content-systems-chaos-to-works.md`
- `content/blog/leadership-communication-skills-every-leader-needs.md`
- `content/blog/meet_guideforge.md`
- `content/blog/meet_guppi.md`
- `content/blog/responsible-ai-content-creation.md`
- `content/blog/technical-storytelling-bridging-engineering-narrative.md`
- `content/pulse-sms-consent/index.md`
- `content/recipes/recipe-espresso-caramel-lebkuchen-swirl-blondies.md`
- `content/recipes/recipe-herb-roasted-chicken-garlic-pepper-potatoes.md`
- `content/recipes/recipe-potato-skin-chips-garlic-avocado-oil.md`
- `content/recipes/recipe-sous-vide-pulled-pork-arbys-bbq.md`

`build-e-ink-codex-usage-display-with-ai.md` already has hand-authored srcsets/sizes, raster renderings and SVG diagrams; do not overwrite its art direction or collapse source choices blindly. `responsible-ai-content-creation.md` has explicitly half-width diagrams. Recipe bodies contain raw full-width photos. `meet_guideforge.md` contains a documentation image example; only rendered references should fail missing-source validation. Draft content is inventoried but not assumed to publish.

## Bounded encoding experiment

Using installed Sharp 0.35.5 / libvips 8.18.7 under Node24, decoded the Christmas source as 1200×630, opaque, one page, 533071 bytes. In-memory WebP quality85 experiments returned: 480×252 = 51390 bytes; 800×420 = 116002 bytes; 1200×630 = 225460 bytes. No files/artwork were replaced. These reproduce the earlier candidate size evidence and support the initial cover budgets; they are NOT visual approval, browser transfer measurements or LCP results.

## Runtime/test surface

Existing Playwright launch sites: `tests/react-mobile-render.test.js`, `react-accessibility-render.test.js`, `workshop-page.test.js`, `nemesis-tracker.test.js`, `fate-of-the-fellowship-tracker.test.js`, `ai-chat-exporter-interaction.test.js`, `ai-chat-exporter-visual-contract.test.js`. They use dedicated Playwright chromium with headless:true, no installed-browser channel/executable override found. `ai-chat-exporter-runtime.test.js` guards those launch options and persistent contexts. All need cleanup verification on actual execution; none launched by task01.

`tests/test-command-contracts.test.js` passed in discovery; it pins browser-free blog publishing commands. Existing CI files are schedule-posts, security-check and check-hugo-version; no image runtime workflow/required status is proven. Source-only test did not require dependencies. Parent subsequently installed 537 pinned packages under Node24; use `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin` first in PATH for subsequent checks. The original default Node22 and missing dependencies were historical observations, not remaining blockers.

## Full raster inventory

URLs are source identity URLs. File category is not proof visible references use every file; decoder later determines alpha/animation/format truth. All rows include actual bytes/dimensions; source bytes were not edited.

| Source URL | Width × height | Bytes | Classification |
| --- | --- | ---: | --- |
| `/christmas-2026-lucas/apple-touch-icon-v2.png` | 180 × 180 | 4757 | icon identity |
| `/christmas-2026-lucas/apple-touch-icon.png` | 180 × 180 | 4483 | icon identity |
| `/christmas-2026-lucas/assets/avengers.jpg` | 679 × 504 | 82573 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/black-panther.png` | 860 × 1792 | 233286 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/blue-wizard.jpg` | 679 × 1219 | 91879 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/boba-fett.jpg` | 425 × 374 | 22541 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/captain-america.png` | 840 × 1292 | 298941 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/captain-shield.jpg` | 800 × 800 | 73421 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/doctor-strange.png` | 880 × 1278 | 360075 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/falcon.png` | 860 × 551 | 102626 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/gandalf-costume.jpg` | 328 × 741 | 26212 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/hulk-art.png` | 840 × 1330 | 324679 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/hulk.jpg` | 400 × 400 | 45643 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/iron-man.png` | 575 × 1133 | 104383 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/lush-bomb.png` | 256 × 256 | 61245 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/lush-calaverita.png` | 908 × 908 | 633989 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/lush-grinch.png` | 908 × 908 | 580997 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/lush-hangyodon.png` | 908 × 908 | 646045 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/movie.jpg` | 500 × 500 | 74399 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/potion.jpg` | 425 × 420 | 50978 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/puzzle-avengers.jpg` | 500 × 500 | 99028 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/puzzle-dragons.jpg` | 1200 × 1200 | 282843 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/puzzle-jungle-animals.webp` | 520 × 382 | 49454 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/puzzle-young-jedi.jpg` | 1280 × 856 | 279949 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/spider-man.png` | 663 × 1024 | 99432 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/spider-web-set.jpg` | 800 × 800 | 72041 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/target-fairy-potions.jpg` | 800 × 800 | 170817 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/target-lego-speeder.jpg` | 800 × 800 | 78314 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/target-magic-tricks.jpg` | 800 × 800 | 125918 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/target-razor-crest.jpg` | 800 × 800 | 111435 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/thor.png` | 1080 × 1392 | 151956 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/transformers.jpg` | 400 × 400 | 50951 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/vader-stormtrooper.jpg` | 425 × 322 | 17137 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/vision.png` | 880 × 1264 | 310369 | catalog raster; alpha check |
| `/christmas-2026-lucas/assets/wands.jpg` | 425 × 449 | 13281 | catalog raster; alpha check |
| `/christmas-2026-lucas/favicon-16.png` | 16 × 16 | 398 | icon identity |
| `/christmas-2026-lucas/favicon-192.png` | 192 × 192 | 4515 | icon identity |
| `/christmas-2026-lucas/favicon-32.png` | 32 × 32 | 693 | icon identity |
| `/christmas-2026-lucas/favicon-48.png` | 48 × 48 | 1066 | icon identity |
| `/christmas-2026-lucas/favicon-512.png` | 512 × 512 | 16976 | icon identity |
| `/christmas-2026-lucas/favicon-v2-16.png` | 16 × 16 | 458 | icon identity |
| `/christmas-2026-lucas/favicon-v2-192.png` | 192 × 192 | 5020 | icon identity |
| `/christmas-2026-lucas/favicon-v2-32.png` | 32 × 32 | 841 | icon identity |
| `/christmas-2026-lucas/favicon-v2-48.png` | 48 × 48 | 1269 | icon identity |
| `/christmas-2026-lucas/favicon-v2-512.png` | 512 × 512 | 18102 | icon identity |
| `/christmas-2026-lucas/lucas-christmas-2026-og-1200x630.png` | 1200 × 630 | 415682 | social identity + visible cover if referenced |
| `/christmas-2026-lucas/lucas-christmas-2026-v2-og-1200x630.png` | 1200 × 630 | 533071 | social identity + visible cover if referenced |
| `/favicons/android-chrome-192x192.png` | 192 × 192 | 31998 | icon identity |
| `/favicons/android-chrome-512x512.png` | 512 × 512 | 121560 | icon identity |
| `/favicons/apple-touch-icon.png` | 180 × 180 | 28827 | icon identity |
| `/favicons/favicon-16x16.png` | 16 × 16 | 713 | icon identity |
| `/favicons/favicon-32x32.png` | 32 × 32 | 1941 | icon identity |
| `/images/PXL_20251230_202603628.jpg` | 4080 × 2720 | 516738 | content raster; diagram/text policy where applicable |
| `/images/avatar-color-trans.png` | 3072 × 3072 | 169057 | content raster; diagram/text policy where applicable |
| `/images/blog/codex-usage-display/cad-exact-assembly-800.webp` | 800 × 500 | 15090 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/cad-exact-assembly.webp` | 1600 × 1000 | 24554 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/device-depth-800.webp` | 800 × 1065 | 63752 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/device-depth.jpg` | 1802 × 2400 | 291611 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/device-depth.webp` | 1600 × 2131 | 169002 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/enclosure-directions-800.webp` | 800 × 294 | 10074 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/enclosure-directions.webp` | 1600 × 587 | 23436 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/final-in-situ-close-800.webp` | 800 × 582 | 77700 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/final-in-situ-close.jpg` | 1650 × 1200 | 495496 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/final-in-situ-close.webp` | 1600 × 1164 | 236238 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/final-side-profile-800.webp` | 800 × 601 | 38334 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/final-side-profile.jpg` | 2400 × 1802 | 200164 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/final-side-profile.webp` | 1600 × 1201 | 124700 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/final-three-quarter-800.webp` | 800 × 601 | 54360 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/final-three-quarter.jpg` | 2400 × 1802 | 207542 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/final-three-quarter.webp` | 1600 × 1201 | 162154 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/first-print-parts-800.webp` | 800 × 601 | 66754 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/first-print-parts.jpg` | 2400 × 1802 | 571944 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/first-print-parts.webp` | 1600 × 1201 | 240346 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/magnet-installation-800.webp` | 800 × 601 | 54660 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/magnet-installation.jpg` | 2400 × 1802 | 362088 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/magnet-installation.webp` | 1600 × 1201 | 152346 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/magnets-and-backplate-800.webp` | 800 × 601 | 79730 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/magnets-and-backplate.jpg` | 2400 × 1802 | 295313 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/magnets-and-backplate.webp` | 1600 × 1201 | 276932 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/01-screen-portrait-directions.webp` | 1400 × 1400 | 56440 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/02-screen-landscape-first-pass.webp` | 1666 × 814 | 26052 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/03-screen-last-refresh-revision.webp` | 1666 × 814 | 26906 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/04-screen-final-layout.webp` | 1666 × 814 | 28388 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/05-enclosure-first-easel.webp` | 1200 × 800 | 16068 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/07-cad-picture-frame-first-pass.webp` | 1200 × 800 | 18076 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/08-cad-thin-rim-revision.webp` | 1200 × 800 | 18570 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/09-cad-final-asymmetric-system.webp` | 1400 × 1400 | 45562 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/10-cad-cable-routing.webp` | 1200 × 800 | 12494 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/11-cad-final-exact-assembly.webp` | 1600 × 1000 | 50232 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/12-cad-final-print-parts.webp` | 1600 × 1000 | 43728 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/14-print-start-bed-overview.webp` | 1800 × 1352 | 215226 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/20-first-print-parts-off-plate.webp` | 1800 × 1352 | 382796 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/24-first-print-user-view-close.jpg` | 1200 × 675 | 179781 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/25-v2-print-on-plate.webp` | 1800 × 1352 | 510258 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/27-v2-frame-spaghetti-wide.webp` | 1800 × 1352 | 231244 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/29-v2-front-face.webp` | 1800 × 1352 | 392298 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/39-v3-cad-deeper-magnetic-rear.webp` | 1200 × 800 | 20436 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/40-v3-cad-60-degree-posture.webp` | 1200 × 800 | 17810 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/41-v3-cad-seamless-front.webp` | 1200 × 800 | 3198 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/43-v3-print-run-3-first-layer-three-parts.webp` | 1800 × 1352 | 476980 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/46-v3-printed-parts-overview.webp` | 1800 × 1352 | 468248 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/49-v3-front-face-textured-plate-finish.webp` | 1800 × 1352 | 327884 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/50-v3-magnet-installation-and-glue.webp` | 1800 × 1352 | 177328 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/54-v3-excess-cavity-depth-retention-test-b-raised.jpg` | 900 × 675 | 169713 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/58-v3-three-magnet-stack-cover-lip-side-view.webp` | 1800 × 1352 | 304704 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/62-v3-rear-leg-cable-and-table-interaction.webp` | 1800 × 1352 | 193320 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/63-v4-smooth-plate-print-in-progress-bed-overview.webp` | 1800 × 1352 | 93270 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/66-v4-smooth-plate-test-fit-parts-and-magnet-pockets.webp` | 1800 × 1352 | 276006 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/69-v4-magnet-installation-blog-select.webp` | 1800 × 1352 | 221636 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/72-v4-magnet-installation-phase-2-blog-select-uncropped.webp` | 1800 × 1352 | 175140 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/73-v4-final-magnets-frame-and-backplate.webp` | 1800 × 1352 | 420348 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/75-v4-final-assembled-side-profile.webp` | 1800 × 1352 | 183684 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/77-v4-final-assembled-rear-leg-and-cable-tunnel.webp` | 1800 × 1352 | 244848 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/79-v4-final-powered-three-quarter-glamour.webp` | 1800 × 1352 | 238616 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/process/80-v4-final-in-situ-close-with-astronaut.webp` | 1800 × 1352 | 282144 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/screen-final-layout.webp` | 800 × 391 | 12834 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/screen-landscape-first-pass.webp` | 800 × 391 | 11714 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/screen-last-refresh-revision.webp` | 800 × 391 | 12176 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/screen-portrait-directions.webp` | 800 × 800 | 27026 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/v2-spaghetti-800.webp` | 800 × 601 | 54054 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/v2-spaghetti.jpg` | 2400 × 1802 | 395054 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/v2-spaghetti.webp` | 1600 × 1201 | 159316 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/v3-leg-contact-800.webp` | 800 × 601 | 35768 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/v3-leg-contact.jpg` | 2400 × 1802 | 286991 | article photo/screenshot; classify text screenshots lossless |
| `/images/blog/codex-usage-display/v3-leg-contact.webp` | 1600 × 1201 | 104788 | article photo/screenshot; classify text screenshots lossless |
| `/images/content-resonance-behavior-chain.png` | 1520 × 140 | 22793 | content raster; diagram/text policy where applicable |
| `/images/content-resonance-framework.png` | 1210 × 110 | 13360 | content raster; diagram/text policy where applicable |
| `/images/content-resonance-operating-model.png` | 1520 × 187 | 26739 | content raster; diagram/text policy where applicable |
| `/images/content-system-feedback-loop.png` | 2308 × 478 | 37262 | content raster; diagram/text policy where applicable |
| `/images/content-system-structure.png` | 2657 × 255 | 35140 | content raster; diagram/text policy where applicable |
| `/images/fate-of-the-fellowship/kenney/corner-gold.png` | 48 × 48 | 251 | gallery thumbnail + interaction original |
| `/images/fate-of-the-fellowship/kenney/divider-gold.png` | 192 × 36 | 294 | gallery thumbnail + interaction original |
| `/images/fate-of-the-fellowship/kenney/divider-green.png` | 192 × 28 | 265 | gallery thumbnail + interaction original |
| `/images/fate-of-the-fellowship/kenney/divider-small-green.png` | 96 × 18 | 209 | gallery thumbnail + interaction original |
| `/images/fate-of-the-fellowship/kenney/frame-card-gold.png` | 96 × 96 | 451 | gallery thumbnail + interaction original |
| `/images/fate-of-the-fellowship/kenney/frame-hero-gold.png` | 96 × 96 | 432 | gallery thumbnail + interaction original |
| `/images/fate-of-the-fellowship/kenney/frame-section-gold.png` | 96 × 96 | 439 | gallery thumbnail + interaction original |
| `/images/fate-of-the-fellowship/kenney/panel-card-parchment.png` | 48 × 48 | 274 | gallery thumbnail + interaction original |
| `/images/fate-of-the-fellowship/kenney/panel-hero-parchment.png` | 96 × 96 | 430 | gallery thumbnail + interaction original |
| `/images/fate-of-the-fellowship/session-photos/2026-06-10-win.jpg` | 2400 × 1350 | 425071 | gallery thumbnail + interaction original |
| `/images/fate-of-the-fellowship/session-photos/2026-06-12-win.jpg` | 2400 × 1350 | 370384 | gallery thumbnail + interaction original |
| `/images/guideforge_home.png` | 1701 × 996 | 416257 | content raster; diagram/text policy where applicable |
| `/images/guppi_chat.png` | 818 × 235 | 51196 | content raster; diagram/text policy where applicable |
| `/images/herb-roasted-chicken-garlic-pepper-potatoes.jpg` | 1200 × 800 | 169778 | content raster; diagram/text policy where applicable |
| `/images/leadership-communication-audience-translation.png` | 2420 × 500 | 62829 | content raster; diagram/text policy where applicable |
| `/images/leadership-communication-feedback-loop.png` | 725 × 1440 | 53041 | content raster; diagram/text policy where applicable |
| `/images/logos/parasail.png` | 2065 × 327 | 23805 | lossless logo |
| `/images/main-header.jpg` | 3840 × 2160 | 1879820 | content raster; diagram/text policy where applicable |
| `/images/nemesis/session-photos/2026-03-29-nemesis-intruders-easy-loss.jpg` | 2400 × 1350 | 647292 | gallery thumbnail + interaction original |
| `/images/nemesis/session-photos/2026-05-10-nemesis-intruders-hard-loss.jpg` | 2400 × 1350 | 589578 | gallery thumbnail + interaction original |
| `/images/nemesis/session-photos/2026-05-16-nemesis-intruders-easy-win.jpg` | 2400 × 1350 | 537655 | gallery thumbnail + interaction original |
| `/images/nemesis/session-photos/2026-05-25-nemesis-aftermath-intruders-easy-win.jpg` | 2400 × 1350 | 565735 | gallery thumbnail + interaction original |
| `/images/nemesis/session-photos/2026-08-29-nemesis-intruders-hard-win.jpg` | 2400 × 1350 | 624317 | gallery thumbnail + interaction original |
| `/images/pork-shoulder-broiled.jpg` | 2400 × 1601 | 398920 | content raster; diagram/text policy where applicable |
| `/images/pork-shoulder-two-pieces-new.jpg` | 2400 × 1600 | 771212 | content raster; diagram/text policy where applicable |
| `/images/pulse-sms-opt-in-flow.png` | 1600 × 1220 | 92184 | content raster; diagram/text policy where applicable |
| `/images/recipe-potato-skin-chips-garlic-avocado-oil.jpg` | 2400 × 1600 | 557396 | content raster; diagram/text policy where applicable |
| `/images/responsible-ai-content-creation-governance-workflow.png` | 590 × 1710 | 61252 | content raster; diagram/text policy where applicable |
| `/images/responsible-ai-content-creation-team-implementation-workflow.png` | 308 × 783 | 45299 | content raster; diagram/text policy where applicable |
| `/images/signal-oauth-logo.png` | 120 × 120 | 6380 | content raster; diagram/text policy where applicable |
| `/images/social/ai-chat-exporter-og.png` | 2400 × 1260 | 76774 | social identity; optimize if visible |
| `/images/social/alices-restaurant-family-ritual-og.png` | 2400 × 1260 | 140400 | social identity; optimize if visible |
| `/images/social/brand-signals-decoded-quiet-vs-loud-og.png` | 2400 × 1260 | 81456 | social identity; optimize if visible |
| `/images/social/build-e-ink-codex-usage-display-with-ai-og-1200x630.jpg` | 1200 × 630 | 240634 | social identity; optimize if visible |
| `/images/social/building-a-cli-with-ai-og.png` | 2400 × 1260 | 119379 | social identity; optimize if visible |
| `/images/social/category-creation-calling-shot-og.png` | 2400 × 1260 | 266363 | social identity; optimize if visible |
| `/images/social/content-resonance-framework-beyond-engagement-metrics-og.png` | 2400 × 1260 | 93047 | social identity; optimize if visible |
| `/images/social/content-systems-chaos-to-works-og.png` | 2400 × 1260 | 89272 | social identity; optimize if visible |
| `/images/social/convo-vs-broadcast-og.png` | 2400 × 1260 | 178344 | social identity; optimize if visible |
| `/images/social/default-og.png` | 2400 × 1260 | 81880 | social identity; optimize if visible |
| `/images/social/dev-mktg.png` | 2400 × 1260 | 107300 | social identity; optimize if visible |
| `/images/social/fate-of-the-fellowship-og.png` | 2400 × 1260 | 489538 | social identity; optimize if visible |
| `/images/social/leadership-communication-skills-every-leader-needs-og.png` | 2400 × 1260 | 108465 | social identity; optimize if visible |
| `/images/social/managing-up-og.png` | 1200 × 630 | 67279 | social identity; optimize if visible |
| `/images/social/meet-guideforge-og.png` | 2400 × 1260 | 201495 | social identity; optimize if visible |
| `/images/social/meet-guppi-og.png` | 2400 × 1260 | 120648 | social identity; optimize if visible |
| `/images/social/msv-equation-aeo-world-og.png` | 2400 × 1260 | 250333 | social identity; optimize if visible |
| `/images/social/nemesis-og.png` | 2400 × 1260 | 144830 | social identity; optimize if visible |
| `/images/social/recipe-90s-mom-sausage-rice-bake-og.png` | 2400 × 1260 | 104025 | social identity; optimize if visible |
| `/images/social/recipe-air-fryer-sweet-potatoes-og.png` | 2400 × 1260 | 63565 | social identity; optimize if visible |
| `/images/social/recipe-bachan-pulled-pork-og.png` | 2400 × 1260 | 109359 | social identity; optimize if visible |
| `/images/social/recipe-bacon-mac-and-cheese-broiled-cheese-cap-og.png` | 2400 × 1260 | 59107 | social identity; optimize if visible |
| `/images/social/recipe-baked-ziti-beef-ragu-og.png` | 2400 × 1260 | 84636 | social identity; optimize if visible |
| `/images/social/recipe-beer-bread-og.png` | 2400 × 1260 | 64848 | social identity; optimize if visible |
| `/images/social/recipe-chicken-legs-leftover-onion-bits-og.png` | 2400 × 1260 | 96457 | social identity; optimize if visible |
| `/images/social/recipe-cinnamon-brown-sugar-candied-carrots-og.png` | 2400 × 1260 | 105182 | social identity; optimize if visible |
| `/images/social/recipe-cinnamon-pecan-coffee-cake-loaf-og.png` | 2400 × 1260 | 98918 | social identity; optimize if visible |
| `/images/social/recipe-cream-cheese-mints-og.png` | 2400 × 1260 | 100874 | social identity; optimize if visible |
| `/images/social/recipe-cream-of-celery-chicken-and-rice-og.png` | 2400 × 1260 | 110204 | social identity; optimize if visible |
| `/images/social/recipe-creamy-polenta-og.png` | 2400 × 1260 | 84809 | social identity; optimize if visible |
| `/images/social/recipe-deep-cozy-pantry-chili-og.png` | 2400 × 1260 | 86429 | social identity; optimize if visible |
| `/images/social/recipe-duck-fat-roasted-turkey-parts-og.png` | 2400 × 1260 | 106684 | social identity; optimize if visible |
| `/images/social/recipe-easy-oven-bacon-og.png` | 2400 × 1260 | 78651 | social identity; optimize if visible |
| `/images/social/recipe-egg-salad-pickle-relish-og.png` | 2400 × 1260 | 97676 | social identity; optimize if visible |
| `/images/social/recipe-espresso-caramel-lebkuchen-swirl-blondies-og.png` | 2400 × 1260 | 60118 | social identity; optimize if visible |
| `/images/social/recipe-extra-protein-pasta-e-fagioli-og.png` | 2400 × 1260 | 89677 | social identity; optimize if visible |
| `/images/social/recipe-favorite-chocolate-chip-cookies-og.png` | 2400 × 1260 | 114165 | social identity; optimize if visible |
| `/images/social/recipe-garlic-in-oil-confit-roasted-og.png` | 2400 × 1260 | 100635 | social identity; optimize if visible |
| `/images/social/recipe-german-inspired-carrot-almond-torte-loaf-og.png` | 2400 × 1260 | 109943 | social identity; optimize if visible |
| `/images/social/recipe-golden-raisin-turkey-tacos-og.png` | 2400 × 1260 | 92852 | social identity; optimize if visible |
| `/images/social/recipe-grandma-yolas-pizzelles-og.png` | 2400 × 1260 | 89114 | social identity; optimize if visible |
| `/images/social/recipe-herb-roasted-chicken-garlic-pepper-potatoes-og.png` | 2400 × 1260 | 60699 | social identity; optimize if visible |
| `/images/social/recipe-holiday-crunch-casserole-og.png` | 2400 × 1260 | 88627 | social identity; optimize if visible |
| `/images/social/recipe-honey-mustard-pretzel-crunchies-og.png` | 2400 × 1260 | 93405 | social identity; optimize if visible |
| `/images/social/recipe-index-og.png` | 2400 × 1260 | 45706 | social identity; optimize if visible |
| `/images/social/recipe-leftover-steak-egg-bowls-og.png` | 2400 × 1260 | 113216 | social identity; optimize if visible |
| `/images/social/recipe-marinated-bavette-steak-chimichurri-og.png` | 2400 × 1260 | 89821 | social identity; optimize if visible |
| `/images/social/recipe-peaches-and-cream-crisp-og.png` | 2400 × 1260 | 107516 | social identity; optimize if visible |
| `/images/social/recipe-potato-skin-chips-garlic-avocado-oil-og.png` | 2400 × 1260 | 116926 | social identity; optimize if visible |
| `/images/social/recipe-roasted-cornish-hens-og.png` | 2400 × 1260 | 85190 | social identity; optimize if visible |
| `/images/social/recipe-roasted-squash-ditalini-crispy-guanciale-og.png` | 2400 × 1260 | 57092 | social identity; optimize if visible |
| `/images/social/recipe-roasted-tomato-soup-og.png` | 2400 × 1260 | 104531 | social identity; optimize if visible |
| `/images/social/recipe-same-day-oven-fried-buffalo-wings-og.png` | 2400 × 1260 | 137155 | social identity; optimize if visible |
| `/images/social/recipe-sausage-peppers-onions-over-rice-og.png` | 2400 × 1260 | 116687 | social identity; optimize if visible |
| `/images/social/recipe-schmaltzy-chicken-thighs-og.png` | 2400 × 1260 | 81892 | social identity; optimize if visible |
| `/images/social/recipe-schmaltzy-potato-fritters-og.png` | 2400 × 1260 | 84575 | social identity; optimize if visible |
| `/images/social/recipe-science-minded-church-picnic-potato-salad-og.png` | 2400 × 1260 | 135678 | social identity; optimize if visible |
| `/images/social/recipe-sheet-pan-doner-kebab-og.png` | 2400 × 1260 | 119290 | social identity; optimize if visible |
| `/images/social/recipe-sheet-pan-sausage-veg-og.png` | 2400 × 1260 | 121371 | social identity; optimize if visible |
| `/images/social/recipe-simple-classic-almond-biscotti-og.png` | 2400 × 1260 | 99098 | social identity; optimize if visible |
| `/images/social/recipe-simple-sauteed-cabbage-onions-og.png` | 2400 × 1260 | 109284 | social identity; optimize if visible |
| `/images/social/recipe-sous-vide-eye-of-round-og.png` | 2400 × 1260 | 106616 | social identity; optimize if visible |
| `/images/social/recipe-sous-vide-pulled-pork-arbys-bbq-og.png` | 2400 × 1260 | 134087 | social identity; optimize if visible |
| `/images/social/recipe-sous-vide-rack-of-lamb-og.png` | 2400 × 1260 | 130002 | social identity; optimize if visible |
| `/images/social/recipe-spaghetti-and-meatballs-og.png` | 2400 × 1260 | 53817 | social identity; optimize if visible |
| `/images/social/recipe-steak-bites-crispy-potatoes-peas-og.png` | 2400 × 1260 | 151300 | social identity; optimize if visible |
| `/images/social/recipe-sweet-moist-jiffy-corn-muffins-og.png` | 2400 × 1260 | 95689 | social identity; optimize if visible |
| `/images/social/recipe-sweet-potato-casserole-og.png` | 2400 × 1260 | 55301 | social identity; optimize if visible |
| `/images/social/recipe-turkey-and-dumplings-og.png` | 2400 × 1260 | 112117 | social identity; optimize if visible |
| `/images/social/recipe-turkey-wellington-sausage-roll-og.png` | 2400 × 1260 | 52038 | social identity; optimize if visible |
| `/images/social/recipe-ultra-concentrated-baked-potato-mashed-potatoes-og.png` | 2400 × 1260 | 124695 | social identity; optimize if visible |
| `/images/social/recipe-weeknight-rice-pilaf-og.png` | 2400 × 1260 | 126777 | social identity; optimize if visible |
| `/images/social/recipe-weeknight-sausage-risotto-og.png` | 2400 × 1260 | 97949 | social identity; optimize if visible |
| `/images/social/recipe-zacks-favorite-plum-buckle-og.png` | 2400 × 1260 | 84988 | social identity; optimize if visible |
| `/images/social/responsible-ai-content-creation-is-a-human-problem-og.png` | 2400 × 1260 | 237267 | social identity; optimize if visible |
| `/images/social/substack-banner.png` | 1920 × 384 | 39711 | social identity; optimize if visible |
| `/images/social/technical-storytelling-bridging-engineering-narrative-og.png` | 2400 × 1260 | 97815 | social identity; optimize if visible |
| `/images/social/the-problem-is-usually-not-the-prompt-og.png` | 2400 × 1260 | 99125 | social identity; optimize if visible |
| `/images/social/workshop-launch-og-1200x630.png` | 1200 × 630 | 81550 | social identity; optimize if visible |
| `/images/social/workshop-og-1200x630.png` | 1200 × 630 | 51609 | social identity; optimize if visible |
| `/images/technical-storytelling-engineering-narrative-breakdown.png` | 949 × 1068 | 36582 | content raster; diagram/text policy where applicable |
| `/images/technical-storytelling-structure-diagram.png` | 1800 × 2160 | 86311 | content raster; diagram/text policy where applicable |
| `/images/testimonials/alice-alexandra-moore.jpg` | 100 × 100 | 5187 | micro photo |
| `/images/testimonials/kaitlyn-barnard.jpg` | 800 × 800 | 153791 | micro photo |
| `/images/testimonials/randall-degges.jpg` | 450 × 450 | 34629 | micro photo |
| `/images/testimonials/scott-mcallister.jpg` | 800 × 800 | 82492 | micro photo |
| `/images/testimonials/steve-sewell.jpg` | 522 × 522 | 42344 | micro photo |
| `/images/workshop/pulse-edit-take-out-trash.png` | 1740 × 820 | 111032 | lossless screenshot |
| `/images/workshop/pulse-take-out-trash.png` | 1740 × 735 | 144429 | lossless screenshot |
| `/images/workshop/slate-codex-skills.png` | 2538 × 1600 | 375409 | lossless screenshot |
| `/images/workshop/slate-freezer.png` | 2538 × 1600 | 233137 | lossless screenshot |
| `/images/workshop/slate-library.png` | 2538 × 1600 | 220815 | lossless screenshot |
| `/images/workshop/workshop-home.png` | 2538 × 1600 | 333917 | lossless screenshot |
| `/images/workshop/workshop-installer.png` | 1280 × 800 | 123157 | lossless screenshot |
| `/images/workshop/workshop-installer.webp` | 1280 × 800 | 13704 | lossless screenshot |
| `/images/workshop/workshop-shelf.png` | 2200 × 1028 | 298831 | lossless screenshot |
