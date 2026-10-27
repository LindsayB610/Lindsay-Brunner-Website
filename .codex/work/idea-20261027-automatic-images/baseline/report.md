# Frozen image baseline, October 27, 2026

Measured only the frozen pre-change build at `/tmp/website-image-baseline-20261027/public`. No build or production source edits. This is a local synthetic comparison baseline, not a production field performance measurement.

## Results

| CSS width | DPR | Runs | Median LCP (ms) | LCP range (ms) | Maximum observed layout-shift sum |
| --- | --- | --- | --- | --- | --- |
| 390 | 1 | 7 | 668 | 660–736 | 0.0000 |
| 390 | 2 | 7 | 672 | 660–672 | 0.0000 |
| 1440 | 1 | 7 | 668 | 664–672 | 0.0000 |
| 1440 | 2 | 7 | 672 | 664–688 | 0.0000 |

All 28 final LCP candidates were the `img.christmas-cover` header. Every run selected `/christmas-2026-lucas/lucas-christmas-2026-v2-og-1200x630.png`: 533,071 encoded/decoded body bytes, 533,371 Resource Timing transfer bytes (the latter includes the browser's 300-byte overhead estimate). Natural size: 1200×630. Rendered header size: 390×204.75 CSS px on mobile and 1180×619.5 on desktop. No layout-shift entries occurred. This observation ends two seconds after load; it does not establish CLS for a complete interactive visit.

## Reproducible protocol

- Node 24.21.0 from `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin`; existing worktree Playwright package, Chromium 148.0.7778.96, dedicated `chromium_headless_shell-1223`.
- Inspect package browser manifest and existing headless launch harness before launch. Launch exactly `chromium.launch({headless:true})`, with no installed-browser channel or executable override. One browser reused throughout; a new isolated context for every sample.
- Local HTTP static server on an ephemeral 127.0.0.1 port; `Cache-Control: no-store`, no compression, no CDN. Only snapshot bytes served. External requests aborted. CDP cache disabled and service workers blocked.
- CDP `Network.emulateNetworkConditions`: latency 100 ms; download 1,250,000 bytes/s (10 Mbps), upload 625,000 bytes/s (5 Mbps), offline false, connectionType wifi. CDP CPU slowdown rate 4.
- Viewports 390×844 (`isMobile:true`) and 1440×1000 (`isMobile:false`), each DPR 1 and DPR 2. Seven runs per combination, in that order. No warm-up discarded. No scrolling or interaction.
- Install buffered LCP and layout-shift observers before navigation. Navigate `/christmas-2026-lucas/`, wait for load, then 2000 ms. Record every LCP candidate and shift source, selected header `currentSrc`, geometry, and all resource timing entries. Take a viewport screenshot on the first run of each combination, after collecting metrics.
- Use identical viewport heights, isolation, timing, throttles, server headers, external blocking and sample count for the optimized comparison. Timing remains sensitive to host CPU contention and operating-system file caching; cold cache here means browser HTTP cache.

## Evidence

- `measurements.json`: exact protocol, all 28 runs, browser process identity, snapshot SHA-256 hashes and cleanup status.
- `measurement-script.cjs`: exact measurement harness retained for reproduction; original temporary script `/tmp/website-image-baseline-measure.cjs`. Its default output goes to `/tmp/website-image-baseline-results`; `BASELINE_OUT` can override it.
- `before-390-dpr1.png`, `before-390-dpr2.png`, `before-1440-dpr1.png`, `before-1440-dpr2.png`: before screenshots. Mobile and desktop DPR1 screenshots visually inspected; banner and introductory content render normally.

## Closed zoom dialog check

No dialog or zoomable-diagram markup found in frozen blog HTML; representative closed zoom request test unavailable.

Matching frozen blog HTML: []

## Cleanup

{"browserClosed": true, "serverClosed": true, "remainingOwned": []}
