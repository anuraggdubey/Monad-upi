# PayAgent — full frontend build prompt

Paste this entire document into your AI coding tool (Claude Code, Cursor, etc.) as the build instruction. It specifies a complete, dynamic Next.js + TypeScript frontend for PayAgent — a UPI-to-agent payment bridge on Monad. No page in this spec is static; every screen must run on real component state, real client-side logic, and a simulated live data layer so the whole product works end to end in a demo with no backend yet wired up.

## 0. Mission and hard constraints

Build the complete frontend for PayAgent: a product that lets Indian users hire AI agents by scanning a UPI QR code, while the backend escrows USDC on Monad and releases it to the agent on delivery. Six-sided product: a hirer-facing app, an agent-facing app, and an admin/ops console, plus the public marketing site.

Non-negotiable constraints:

- Next.js 14+, App Router, TypeScript strict mode. Tailwind CSS for styling.
- Every page is dynamic. That means: real component state, real form validation, real client-side filtering/sorting/search, and a simulated async data layer (timers and promises standing in for the real backend/blockchain calls) that actually changes what's on screen. Nothing should be hardcoded JSX that just displays one fixed scenario forever.
- A single shared mock data layer (`/lib/mock`) backs every page. State changes in one place (an agent submits a deliverable, an admin resolves a dispute) must be visible everywhere that data is shown (task list, task detail, notifications, admin ledger) — use React Context, not page-isolated `useState` with fake data baked in.
- Structure the data layer so every mock function has the same signature a real API call would have (`async function getTasks(): Promise<Task[]>`), so swapping in real `fetch` calls to Razorpay/Monad/the backend later is a one-line change, not a rewrite.
- lucide-react for icons, recharts for charts, Zustand or React Context for global state (pick one and use it consistently — don't mix).
- Fully responsive down to a 375px mobile viewport. Visible keyboard focus states. Respect `prefers-reduced-motion`.

## 1. Design system — carry over exactly from the approved preview

Reuse these tokens on every page without exception. This is the approved visual identity; don't reinterpret it per-page.

**Colors**
- `--ink: #15161B` — primary text, dark surfaces
- `--ink-soft: #5A5A63` — secondary text
- `--paper: #F6F3EC` — page background
- `--paper-card: #FFFFFF` — card surfaces
- `--line: #DAD5C6` — hairline borders/dividers
- `--saffron: #E8862C` / `--saffron-deep: #8C480D` / `--saffron-soft: #FBE7D2` — payment, UPI, primary CTA color
- `--indigo: #3F3AA6` / `--indigo-deep: #1F1C57` / `--indigo-soft: #EAE8F8` / `--indigo-light: #B7AEEA` — blockchain/agent/identity color
- `--mint: #1F9D72` / `--mint-soft: #E3F3EC` — success, confirmed, escrow-released states

**Type**
- Display: Space Grotesk, 700/500 — page headlines, big numbers, section titles only. Used with restraint.
- Body: IBM Plex Sans, 400/500 — everything else.
- Mono: IBM Plex Mono, 400/500 — every number that represents money, a tx hash, a UPI ref, a percentage, a timestamp, or a status code. This is a deliberate rule: if it's a "ledger fact," it's mono.

**Signature motifs to reuse**
- The receipt-to-ledger card (a white "UPI receipt" top half with a dashed perforation and a dark "on-chain ledger" bottom half) is the canonical way to show a payment/escrow event. Reuse it on the payment step, the task detail page, and anywhere a transaction needs showing — don't invent a second pattern for the same concept.
- Numbered sequences (ticket-stub style, mono step numbers) are reserved for things that are genuinely sequential — the six-step hire flow, a dispute resolution timeline, an onboarding wizard. Don't add numbering as decoration elsewhere.
- Stat cards use the indigo-soft background with mono values, consistent across hirer, agent, and admin dashboards.

## 2. Full sitemap

### Public
- `/` — Landing page
- `/become-an-agent` — Agent recruitment/pitch page
- `/login` — Unified login (tab: "Hire an agent" vs "I'm an agent")
- `/onboarding` — Post-login role confirmation + first-run profile setup

### Hirer app (`/app/*`)
- `/app` — Hirer home (active tasks summary, quick actions, recent activity)
- `/app/marketplace` — Browse agents (auth-aware hire actions)
- `/app/marketplace/[agentId]` — Agent profile (bio, capabilities, pricing, reputation, reviews, Hire CTA)
- `/app/hire/[agentId]` — Hire wizard: task details → review & budget → pay via UPI (single route, internal step state)
- `/app/tasks` — My tasks (status-filterable list)
- `/app/tasks/[taskId]` — Task detail / order tracking (status timeline, deliverable, confirm & pay, rate, raise dispute)
- `/app/disputes` — My disputes list
- `/app/disputes/[disputeId]` — Dispute detail/track
- `/app/notifications` — Full notification history
- `/app/settings` — Profile, UPI ID, notification preferences

### Agent app (`/agent/*`)
- `/agent/register` — ERC-8004 registration wizard: connect wallet → agent card form → review & mint → confirmation
- `/agent` — Agent dashboard home (reputation, earnings, x-402 status, task queue preview)
- `/agent/tasks` — Incoming/active task queue
- `/agent/tasks/[taskId]` — Task working view (accept, start, submit deliverable to IPFS)
- `/agent/earnings` — Earnings & payouts (transaction history, USDC + INR view, withdraw)
- `/agent/reputation` — Reputation breakdown and feedback history
- `/agent/profile` — Edit agent card (capabilities, pricing, endpoint), wallet management

### Admin app (`/admin/*`)
- `/admin/login` — Separate admin login
- `/admin` — Admin overview (GMV, active tasks, open disputes, agent count, trend charts)
- `/admin/disputes` — Disputes queue
- `/admin/disputes/[disputeId]` — Resolution detail (evidence, refund/release/partial actions)
- `/admin/agents` — Agents management table (verify, suspend, view)
- `/admin/agents/[agentId]` — Single agent admin view
- `/admin/transactions` — Escrow/transaction ledger (on-chain events, tx hash links)
- `/admin/analytics` — Volume trend, category breakdown, INR/USDC flow, price oracle health
- `/admin/settings` — Platform fee, price oracle source, notification templates

### Utility
- `/not-found` — 404
- Global `WalletConnectModal` — not a route; triggered from agent register, agent dashboard, admin treasury actions, and the navbar when an agent/admin session has no wallet attached.

That's 28 routes plus one global modal — every feature named in the project brief and both workflow diagrams maps to exactly one of these.

## 3. Shared components (build once, reuse everywhere)

- `Navbar` — role-aware: renders different nav items and primary CTA depending on whether no one, a hirer, an agent, or an admin is logged in. Includes the live `PriceTicker` and `NotificationBell`.
- `Footer`
- `WalletConnectModal` — detects `window.ethereum`; shows wallet options, network check (must be Monad), and a "use a demo wallet" fallback if no extension is present so the flow is never blocked. Updates global wallet state on connect/disconnect.
- `NotificationBell` + `NotificationDrawer` — badge count from global state, list of recent events, "mark all read."
- `Toast` — fires on every state-changing action (task paid, deliverable submitted, dispute resolved).
- `AgentCard` — used in marketplace grid and admin agent table row.
- `ReceiptLedgerCard` — the signature payment/escrow motif, parameterized by amount, status, and tx hash.
- `StatusTimeline` — the six-state tracker (Pending → Paid → Escrowed → In Progress → Delivered → Completed), used on task detail and admin transaction views.
- `DataTable` — sortable, searchable, paginated; used by every admin list page.
- `StatCard` — indigo-soft metric card used on all three dashboards.
- `ChartCard` — wraps recharts line/bar charts with a consistent card frame.
- `Modal` / `Dialog` primitive.
- `EmptyState` — every list page needs a real empty state, not a blank screen.
- `Skeleton` loaders for every async-feeling load.
- `RatingStars` — interactive input, used on the rate-task flow.
- `TagInput` — used for rating tags and agent capability tags.
- `PriceTicker` — shows live INR/USDC rate; updates every few seconds with a small simulated random walk, used in navbar, hire wizard, and agent earnings.

## 4. Dynamic behavior spec — read this twice

This is the part most likely to get skipped, so it's called out on its own.

1. **One shared task state machine.** A task object moves through `pending → paid → escrowed → in_progress → delivered → completed` (plus a `disputed` branch). Build this as a reducer/store action, not a per-page mock. When a hirer pays in the hire wizard, that task's state changes in the global store, and the change must be reflected immediately in: the hirer's task list, the task detail timeline, the agent's task queue, the admin transaction ledger, and a new notification — all without a page refresh.
2. **Simulated timing, not instant teleporting.** Use `setTimeout`/`async` delays that mimic the real flow (a couple of seconds for "Razorpay webhook," another for "escrow confirmed on Monad") so the UI shows believable loading and transition states, not an instant jump.
3. **Notifications are a side effect of state changes, not separate fake data.** Every task transition, dispute update, or payout pushes a real entry into the global notification list and fires a toast.
4. **Wallet state is global and real where possible.** If `window.ethereum` exists, actually request accounts and reflect the real address (truncated) and chain ID; show a "wrong network" state if it isn't Monad and offer a switch-network action. If no wallet extension exists, the demo-wallet fallback should behave identically from the UI's perspective.
5. **Every form validates for real.** Required fields, min/max budget, file type/size limits on deliverable upload, phone/OTP format — inline errors, not silent failures or alert() boxes.
6. **Every list is actually searchable, filterable, and sortable** using real client-side logic against the mock dataset — not a UI that looks like it filters but doesn't.
7. **Charts respond to controls.** A date-range or category filter on `/admin/analytics` must regenerate the chart data, not swap between two pre-baked screenshots.
8. **Every page has a loading state, an empty state, and an error state**, in addition to the happy path. Simulate an occasional failure path (e.g., a "payment confirmation timed out, retry" state) so it's not all sunshine.

## 5. Page-by-page specs

### Landing — `/`
Hero with the receipt-to-ledger signature card (live: status dots advance through paid → escrowed → in progress on a loop or on scroll-into-view), problem ledger, six-step ticket strip, three-dashboard preview, tech chips, footer CTA. Live `PriceTicker` in the nav. This page already exists as an approved HTML preview — port it faithfully to a Next.js component, then make the hero card's status genuinely animate through states rather than sit static.

### Become an agent — `/become-an-agent`
Pitch for registering as an agent: earnings potential, how x-402 payment works, reputation system explainer, CTA into `/agent/register`. Include a simple earnings estimator widget (input: tasks/week and average price → live-calculated estimated monthly USDC/INR) — real calculation, not a static number.

### Login — `/login`
Two tabs. "Hire an agent": phone number + OTP (simulate OTP send/verify with a 6-digit code and a countdown resend timer). "I'm an agent": wallet connect via the shared modal. Real validation on both paths, real error state for wrong OTP.

### Onboarding — `/onboarding`
First-run only: confirm role, set display name, (hirer) confirm UPI ID, (agent) confirm payout wallet. Skips automatically on repeat visits via stored session state.

### Hirer home — `/app`
Greeting, `StatCard` row (active tasks, total spent, agents hired), a "continue where you left off" card for the most recent in-progress task, recent activity feed pulling from the shared notification store.

### Marketplace — `/app/marketplace`
Grid of `AgentCard`s. Real search box, category filter chips, price range slider, sort (rating/price/tasks completed) — all client-side logic against the mock agent dataset. Empty state for "no agents match your filters."

### Agent profile — `/app/marketplace/[agentId]`
Bio, capability tags, pricing, reputation score breakdown, paginated review list, past work samples, sticky "Hire this agent" CTA into the hire wizard.

### Hire wizard — `/app/hire/[agentId]`
Three internal steps, one route, state held in a local reducer:
1. Task details (title, description, requirements tags, budget in rupees, deadline) — validated.
2. Review (summary card, total amount, terms) — confirm button.
3. Pay via UPI — QR code (can be a generated placeholder pattern), live "payment confirmed" simulation after a few seconds, then auto-redirects into the new task's detail page with state already at `escrowed`.

### My tasks — `/app/tasks`
Status-filterable list (tabs or chips: All / Pending / In progress / Delivered / Completed / Disputed), search by agent name or task title, each row links to task detail.

### Task detail — `/app/tasks/[taskId]`
`StatusTimeline` at top, `ReceiptLedgerCard` showing the payment/escrow facts (amount, tx hash, UPI ref), deliverable section (file/IPFS link, "View result" — appears once status reaches `delivered`), primary action button that changes by status ("Confirm & pay" when delivered, "Rate this agent" when completed, "Raise a dispute" always available after `paid`). Rating opens an inline `RatingStars` + `TagInput` + feedback form; submitting moves status to `completed` and fires a notification.

### Disputes — `/app/disputes` and `/app/disputes/[disputeId]`
List of disputes with status pills (Open/Under review/Resolved). Detail page: reason, evidence (text + optional file), a real-time-feeling status log, and the eventual admin resolution outcome once it's resolved.

### Notifications — `/app/notifications`
Full chronological list pulled from the shared store, grouped by day, mark-as-read interactions, filter by type (payment, task, dispute).

### Settings — `/app/settings`
Profile fields, UPI ID, notification channel toggles (push/SMS/email) — toggles actually update local state and are reflected (e.g., a "demo: SMS disabled" badge appears elsewhere if the user turns it off).

### Agent register — `/agent/register`
Ticket-stub-numbered wizard: 1) connect wallet (shared modal), 2) agent card form (name, category, capabilities tags, pricing, description, API endpoint URL — validated, including URL format), 3) review the generated agent-card JSON, 4) "mint" — a simulated transaction with a pending → confirmed state and a fake tx hash — 5) success screen linking into `/agent`.

### Agent dashboard — `/agent`
`StatCard` row (reputation, earnings this month, active tasks, completion rate), a bar chart of tasks completed over the last 7 days, x-402/wallet connection status banner if disconnected, preview list of the next 3 incoming tasks linking to the full queue.

### Agent task queue — `/agent/tasks`
List of tasks assigned to this agent, filterable by status, with an "Accept" action for new ones and "Start working" for accepted ones — both real state transitions.

### Agent task detail — `/agent/tasks/[taskId]`
Task brief, deadline countdown (real, ticking), deliverable submission form (file picker + a simulated "uploading to IPFS" progress state, then a resulting mock CID), submit action moves the shared task state to `delivered` and notifies the hirer.

### Agent earnings — `/agent/earnings`
`StatCard`s (available balance in USDC, INR equivalent via the live ticker, lifetime earned), a transaction table (`DataTable`) of every payout with tx hash, and a "withdraw" button that opens a confirm dialog (simulated, since there's no real wallet payout yet).

### Agent reputation — `/agent/reputation`
Score breakdown by category (quality, timeliness, communication — matching the rating tags from the hirer flow), a paginated list of written reviews, and a trend chart of score over time.

### Agent profile — `/agent/profile`
Edit the same agent-card fields from registration, a live JSON preview that updates as fields change, wallet section showing connected address with a disconnect/reconnect action.

### Admin login — `/admin/login`
Separate, simpler login (e.g., email + password or wallet + allowlist check) — distinct visual treatment (ink-dark background) to signal this is the ops console, not the consumer app.

### Admin overview — `/admin`
`StatCard` row (GMV, active tasks, open disputes, registered agents), a volume trend `ChartCard`, a recent activity table.

### Admin disputes — `/admin/disputes` and `/admin/disputes/[disputeId]`
Queue with priority/age sorting. Detail view: full evidence from both sides, the original task and payment facts via `ReceiptLedgerCard`, and three real resolution actions (release to agent / refund to hirer / partial split) that actually update the shared task and dispute state and notify both parties.

### Admin agents — `/admin/agents` and `/admin/agents/[agentId]`
Searchable/sortable table (reputation, tasks completed, status). Detail view: full agent card, task history, a verify/suspend toggle that's a real state change reflected on that agent's public marketplace card.

### Admin transactions — `/admin/transactions`
Full escrow/payment ledger table — every task's payment and release events with mock tx hash links (style them as if linking to a Monad explorer), filterable by date range and status.

### Admin analytics — `/admin/analytics`
Multiple `ChartCard`s: volume over time, category breakdown (pie or bar), INR vs USDC flow, price oracle health (the simulated rate feed's recent history). A date-range control that actually regenerates all charts.

### Admin settings — `/admin/settings`
Platform fee percentage input, price oracle source selector, notification template text fields — all editable, with a save confirmation toast.

### 404 — `/not-found`
On-brand empty state, not the Next.js default.

## 6. Tech stack and project structure

```
payagent/
  app/
    page.tsx
    become-an-agent/page.tsx
    login/page.tsx
    onboarding/page.tsx
    app/
      page.tsx
      marketplace/page.tsx
      marketplace/[agentId]/page.tsx
      hire/[agentId]/page.tsx
      tasks/page.tsx
      tasks/[taskId]/page.tsx
      disputes/page.tsx
      disputes/[disputeId]/page.tsx
      notifications/page.tsx
      settings/page.tsx
    agent/
      register/page.tsx
      page.tsx
      tasks/page.tsx
      tasks/[taskId]/page.tsx
      earnings/page.tsx
      reputation/page.tsx
      profile/page.tsx
    admin/
      login/page.tsx
      page.tsx
      disputes/page.tsx
      disputes/[disputeId]/page.tsx
      agents/page.tsx
      agents/[agentId]/page.tsx
      transactions/page.tsx
      analytics/page.tsx
      settings/page.tsx
    not-found.tsx
    layout.tsx
    globals.css
  components/
    Navbar.tsx  Footer.tsx  WalletConnectModal.tsx  NotificationBell.tsx
    AgentCard.tsx  ReceiptLedgerCard.tsx  StatusTimeline.tsx  DataTable.tsx
    StatCard.tsx  ChartCard.tsx  Modal.tsx  EmptyState.tsx  Skeleton.tsx
    RatingStars.tsx  TagInput.tsx  PriceTicker.tsx  Toast.tsx
  lib/
    mock/
      agents.ts  tasks.ts  disputes.ts  transactions.ts  notifications.ts  users.ts
    types.ts
    store.ts        (global state: tasks, notifications, wallet, price feed)
    hooks/
      useTaskFlow.ts  useWallet.ts  usePriceTicker.ts  useNotifications.ts
  public/
  tailwind.config.ts
  tsconfig.json
```

## 7. Acceptance checklist

Don't consider the build done until every line here is true.

- [ ] All 28 routes listed in section 2 exist and render.
- [ ] The global task store drives task state everywhere it appears — verified by completing one task end to end and watching it update in the hirer task list, task detail, agent queue, and admin ledger without a refresh.
- [ ] Wallet connect works with a real extension and with the demo fallback, and a wrong-network state is handled.
- [ ] Every list page has working search/filter/sort against real data, not cosmetic controls.
- [ ] Every form validates and shows inline errors.
- [ ] Every page has a loading, empty, and error state in addition to the happy path.
- [ ] The price ticker updates live and the same number is reflected consistently wherever USDC/INR conversion is shown.
- [ ] The design tokens, fonts, and signature motifs from section 1 are used consistently — no page invents its own palette or card style.
- [ ] Mobile layout at 375px has no horizontal scroll and no clipped content.
