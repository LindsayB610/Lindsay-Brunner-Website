# Christmas optimized measurement

Same protocol as baseline/report.md and stored script: Chromium148 headless shell1223, seven fresh-cache runs per viewport/DPR,100ms latency/1.25MB/s down/CPU4x, local no-store server, blocked external requests. Frozen final production output.

| Viewport/DPR | Before bytes | After bytes | Before median LCP (IQR), ms | After median LCP (IQR), ms |
|---|---:|---:|---|---|
|390/1|533071|51390|668 (666–674)|288 (286–290)|
|390/2|533071|116002|672 (668–672)|332 (330–336)|
|1440/1|533071|225460|668 (666–672)|428 (428–428)|
|1440/2|533071|225460|672 (666–678)|432 (430–442)|

Header remains the observed LCP element. No observed layout shifts in either set. Exact header bounds unchanged: mobile390×204.75; desktop1180×619.5. Local synthetic improvement, not a field measurement or causal proof of the original user delay. Artwork/text visually inspected at mobile and desktop; compressed header preserves approved composition and readable lettering. Original/social PNG unchanged. Cleanup remainingOwned=[]; server/browser closed.
