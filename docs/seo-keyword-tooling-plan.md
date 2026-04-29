# SEO keyword tooling project plan

## Goal

Build a weekly SEO opportunity system that recommends keyword targets, content refreshes, internal links, and new `/thoughts` post ideas based on:

- A curated site authority context document
- Published `/thoughts` metadata
- Google Search Console query and page performance
- Automated monthly search volume data from an MSV provider

The system should not require manual Keyword Planner lookups and should not create recurring generated report files in the website repo.

## Core principles

- Use Search Console as the first-party traction source.
- Use an MSV provider for relative demand, not as the sole source of truth.
- Keep generated reports and run history out of the Hugo website repo.
- Prefer a separate private tooling repo for automation, credentials, state, and reporting.
- Make recommendations based on topical authority and editorial fit, not raw search volume alone.
- Treat bad-fit high-volume keywords as rejected opportunities, not wins.
- Build with tests from the start.

## At-a-glance phases

| Phase | What gets built | Completion check |
| --- | --- | --- |
| 0. Architecture decisions | Decide repo location, first delivery channel, and first MSV provider path. | Decisions are documented in `seo-tools/docs/phase-0-decisions.md`. No code required. |
| 1. Site authority context | Create the durable context file that defines authority lanes, audience, clusters, and rejection rules. | `npm test -- context` passes, including required-section and parseability checks. |
| 2. Thoughts metadata index | Build a lightweight indexer for published `/thoughts` metadata, headings, and Hugo URLs. | `npm test -- thoughts` passes against published, draft, and malformed-post fixtures. |
| 3. GSC connector | Pull and normalize Search Console query/page data for `/thoughts` URLs. | Mocked connector tests pass, and a gated live integration test succeeds when GSC credentials are present. |
| 4. MSV provider interface | Add a pluggable keyword-volume provider interface with a mock provider first. | Provider normalization tests pass, including duplicate, missing-MSV, and provider-failure cases. |
| 5. Seed generation | Generate keyword seeds from context, thoughts metadata, and GSC traction. | Seed tests prove junk removal, deduplication, rejection-rule filtering, and source tagging. |
| 6. Opportunity scoring | Rank refreshes, new post ideas, internal links, and rejected terms by usefulness. | Scoring fixture tests produce deterministic rankings, including quick-win and off-brand penalty cases. |
| 7. Report generation | Render the weekly recommendation report without writing generated files into the website repo. | Snapshot tests pass for empty, partial, and full data reports; no-repo-write tests pass. |
| 8. Delivery | Send the report by email through Resend. | Dry-run tests never send; live-send test is gated behind explicit env vars and verifies payload shape. |
| 9. Weekly automation | Run the workflow on a weekly schedule. | CI dry run succeeds, workflow lint passes, and a report artifact is uploaded for debugging. |
| 10. New-post context update workflow | Detect new published thoughts and propose context additions for human approval. | Tests show drafts are ignored, new posts are detected, cluster suggestions are generated, and curated context is never overwritten automatically. |

First useful end-to-end milestone:

```text
npm test
npm run seo:dry-run
```

The dry run should use real thoughts metadata, real site authority context, fixture GSC data, and mock MSV data to produce a realistic report without live credentials or committed output files.

## Recommended architecture

The tooling lives in a separate repo:

```text
GitHub: https://github.com/LindsayB610/seo-tools
Local: /Users/lindsaybrunner/Documents/seo-tools
```

That tool can read this website repo as an input while keeping credentials, reports, cached API responses, and operational state elsewhere.

Suggested structure:

```text
src/
  context/
  thoughts/
  gsc/
  keywords/
  scoring/
  reports/
  delivery/
  scheduler/

tests/
  fixtures/
```

High-level data flow:

```text
site authority context
+ thoughts metadata
+ GSC query/page data
+ MSV provider data
-> normalized opportunity model
-> scored recommendations
-> email report
```

## Data sources

### Site authority context

Use a durable, curated context document instead of rereading every `/thoughts` post as the main source of strategic truth every week.

Possible file:

```text
context/site-authority-map.md
```

It should define:

- Primary authority lanes
- Target audiences
- Existing pillar and supporting posts
- Topics to avoid
- Voice and style constraints
- Internal linking clusters
- Rules for rejecting off-brand or generic keywords

The weekly job can use this document for strategic judgment and only read full post text when deeper page-level context is needed.

### Thoughts metadata

Read lightweight metadata from published thoughts:

- URL
- Title
- Description
- Subtitle
- Date
- Slug
- Draft status
- Headings

Draft posts should be ignored.

### Google Search Console

Use the Search Console API to pull query and page performance for `/thoughts` URLs.

Metrics:

- Query
- Page
- Clicks
- Impressions
- CTR
- Average position
- Date range

This identifies what Google already associates with the site and where there is near-ranking opportunity.

### MSV provider

Do not rely on manual Keyword Planner exports.

Build a provider interface so the scoring system does not care where MSV comes from.

Candidate providers:

- Google Ads API via `KeywordPlanIdeaService`
- DataForSEO
- Semrush
- Ahrefs
- Mock provider for local development and tests

Normalized provider output:

```json
{
  "keyword": "developer content strategy",
  "monthlySearchVolume": 390,
  "competition": "medium",
  "competitionIndex": 42,
  "cpcLow": 2.1,
  "cpcHigh": 8.4,
  "source": "google_ads"
}
```

## Staged execution plan

### Stage 0: Architecture decisions

Decisions are recorded in:

```text
/Users/lindsaybrunner/Documents/seo-tools/docs/phase-0-decisions.md
```

Current decisions:

- Tooling repo: `LindsayB610/seo-tools`
- Local tooling repo: `/Users/lindsaybrunner/Documents/seo-tools`
- Website repo access: read-only input
- Delivery channel: email only
- Email provider: Resend
- Report recipient: `lb@lindsaybrunner.com`
- Report sender: `seo@lindsaybrunner.com`
- First MSV provider implementation: mock provider
- Real MSV provider target: Google Ads API
- Live runtime: GitHub Actions only
- Site traffic source: Plausible later, not part of the first build

### Stage 1: Site authority context

Create the durable strategic source of truth.

Suggested sections:

- Primary authority lanes
- Audience
- Known content clusters
- Existing pillar posts
- Supporting posts
- Topics to avoid
- Keyword rejection rules
- Editorial fit rules
- Internal linking priorities

Tests:

- Context file exists
- Required sections are present
- Authority lanes are parseable
- Rejection rules are parseable
- Strategic sections are not empty

TDD path:

1. Write parser tests against a small fixture context.
2. Implement parser.
3. Add validation for missing or invalid sections.
4. Add the real context file.

### Stage 2: Thoughts metadata index

Create a lightweight index of published thoughts.

Output shape:

```json
{
  "url": "/thoughts/2026-04-21/the-problem-is-usually-not-the-prompt/",
  "title": "The Problem Is Usually Not the Prompt",
  "description": "Why messy AI output is often a workflow problem, not a prompting one.",
  "date": "2026-04-21",
  "draft": false,
  "slug": "the-problem-is-usually-not-the-prompt",
  "headings": []
}
```

Tests:

- Ignores drafts
- Builds the correct Hugo permalink
- Extracts front matter safely
- Handles missing optional fields
- Captures headings
- Rejects malformed required front matter

TDD path:

1. Add fixtures for one published post, one draft, and one malformed post.
2. Write expected index output.
3. Implement until tests pass.

### Stage 3: GSC connector

Pull real Search Console data for `/thoughts` URLs.

Tests:

- Request body is correct
- Only `/thoughts/` pages are included
- Pagination and row limits are handled
- API errors are retried or reported cleanly
- Missing credentials produce a useful setup error
- Normalized rows match the expected schema

TDD path:

1. Mock the GSC API client.
2. Test request building and row normalization.
3. Add one integration test gated behind environment variables.

### Stage 4: Keyword/MSV provider interface

Build provider abstraction before wiring a real MSV source.

Providers:

- `MockKeywordProvider`
- `GoogleAdsKeywordProvider`
- Optional later: `DataForSEOKeywordProvider`

Tests:

- Provider output normalizes consistently
- Duplicate keywords merge cleanly
- Failed provider calls do not kill the whole report
- Rate limiting and backoff behavior are testable
- Missing MSV is marked as `msv_unknown`, not `0`

TDD path:

1. Implement `MockKeywordProvider`.
2. Build scoring against mock data.
3. Add Google Ads API or another provider once the core system works.

### Stage 5: Seed generation

Generate keyword seeds automatically from:

- Site authority lanes
- Published thought titles
- Descriptions
- Headings
- GSC queries with impressions
- Near-ranking queries
- Repeated phrases across posts

Tests:

- Strips junk terms
- Preserves meaningful multi-word phrases
- Excludes rejection-rule matches
- Deduplicates variants
- Limits seed volume per run
- Tags each seed with source and reason

### Stage 6: Opportunity scoring

Score opportunities by usefulness, not just volume.

Suggested model:

```text
score =
  topicalFit
+ existingGscTraction
+ nearRankingPotential
+ relativeMsv
+ internalLinkPotential
+ authorityLaneFit
+ reputationValue
- competitionPenalty
- genericSludgePenalty
- offBrandPenalty
```

Opportunity types:

- Refresh existing post
- Add section or FAQ
- Create new supporting post
- Create pillar post
- Add internal links
- Ignore or reject

Tests:

- High impressions plus position 8-30 ranks as a quick win
- High MSV but off-brand gets penalized
- No GSC data but strong authority fit can still appear as exploratory
- Duplicate opportunities merge
- Rejected topics stay rejected
- Ordering is deterministic

TDD path:

1. Write a scoring fixture with fake keywords.
2. Assert exact ranking order.
3. Tune weights intentionally.

### Stage 7: Report generation

Generate reports without committing files to the website repo.

Allowed outputs:

- Email body
- Optional JSON artifact attached to the workflow run

Report sections:

- Top opportunities
- Quick refreshes
- New post ideas
- Internal link recommendations
- Rising GSC queries
- Rejected high-volume terms
- Missing data or credential issues

Tests:

- Report renders with empty data
- Report renders with partial MSV data
- Report contains no broken internal links
- Markdown output snapshot tests
- Email subject and date formatting
- No writes to the website repo unless explicitly configured

### Stage 8: Delivery

Start with email delivery.

Possible providers:

- Resend
- Postmark
- SendGrid
- Gmail API

Recommendation: Resend or Postmark for simplicity unless Gmail delivery is preferred.

Tests:

- Email payload shape
- Dry-run mode never sends
- Live send requires explicit environment configuration
- Failures log actionable errors

### Stage 9: Weekly automation

Use GitHub Actions on a weekly schedule.

Example:

```yaml
on:
  schedule:
    - cron: "0 16 * * 1"
```

This runs Mondays at 9:00 AM Pacific during PDT. The exact hour can drift during DST changes unless we add timezone-aware scheduling elsewhere.

Tests:

- Workflow lint
- Dry-run command works in CI
- Required secrets are documented
- No generated files are committed
- Report artifact uploads for debugging

### Stage 10: New post context update workflow

When a new `/thoughts` post is published, the tool should propose an update to the authority context instead of blindly editing it.

Workflow:

```text
new post detected
-> generate proposed context addition
-> send in report
-> human approves
```

Tests:

- Detects new published posts
- Ignores drafts
- Proposes cluster assignment
- Proposes related posts
- Includes confidence score
- Never overwrites curated context without an explicit command

## First useful milestone

Build a dry run that does not require live Google credentials:

```text
npm test
npm run seo:dry-run
```

The dry run should use:

- Real thoughts metadata
- Real site authority context
- Fixture GSC data
- Mock MSV data

It should produce a realistic report in stdout or as a temporary artifact, not as a committed file in the website repo.

## Testing strategy

Use TDD for the core behavior.

Recommended first tests:

- Context parser
- Thoughts indexer
- GSC row normalizer
- Keyword provider normalizer
- Seed generator
- Scoring order
- Report rendering

Development rhythm:

1. Define fixture input.
2. Write expected normalized output.
3. Write the failing test.
4. Implement the minimal code.
5. Add edge cases.
6. Refactor once behavior is pinned down.

## Open decisions

- First MSV provider
- Email provider
- Whether to eventually add Google Sheets as a historical opportunity log

## Notes on Google access

Google Search Console API use is free, subject to usage limits.

Google Ads API does not charge per API call, but Keyword Planner automation requires Google Ads setup, a developer token, and the right access/permissible use for planning services.

Because Google Ads API setup may be the highest-friction part of the project, the system should support pluggable MSV providers from the beginning.
