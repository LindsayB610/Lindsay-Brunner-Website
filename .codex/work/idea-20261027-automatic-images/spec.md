# Automatic image delivery specification

Experimental execution artifact. Approved plan: docs/automatic-image-optimization-plan.md including discovery update. User authorized execution/push after review and testing on 2026-10-27.
Problem: manual compression and disconnected image paths ship oversized assets. Goal: automatic optimized responsive local raster delivery across Hugo, raw/standalone HTML, React, runtime galleries, with enforceable build contracts. Christmas source is tracked static HTML on remote main, now present in isolated checkout.
Non-goals: redesign, content rewrites, changing privacy/public sharing, paid infrastructure, other-project migration, general JavaScript analysis. Preserve art, text, social cards, noindex, original downloads, protected styles and functionality.
Acceptance: clean production build processes a new local raster automatically; responsive Christmas header uses smaller real bytes; React/Hugo initial sources agree; zoom originals fetch only on interaction; supported consumers have explicit policies, unregistered paths fail; no missing/corrupt derivatives, no source mutation; meaningful static/headless tests; browser-free builds; production-equivalent dev preview; verified exact push/deploy commit.
Architecture: npm Vite/OG/Hugo; static HTML copied; React createRoot. Use reviewed plan with practical retention/enforcement decisions documented in work artifacts. Small correct contracts over broad rewrites.
Edge cases: alpha, animations/SVG, text screenshots, small assets, relative/encoded/base/query URLs, existing pictures, remote/data URLs, runtime swaps, noindex and old tabs after release.
Testing: focused tests then build/content and full suite after inspecting harness; dedicated headless only, cleanup required. Independent hostile reviews do not implement; fresh chats remediate and reviews repeat.
Rollout: parent alone may publish; verify origin URL, intended refs/heads/main, remote state and exact commit; no force or bypass; verify deployed commit and pages afterward.
Open decisions assigned to task01: practical retention, manifest/API seams, coverage inventory and supported contract. Source ownership is resolved.
