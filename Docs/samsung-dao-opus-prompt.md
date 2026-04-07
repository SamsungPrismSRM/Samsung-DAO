# Samsung DAO Governance Platform — Full Build Prompt
> Use this prompt with Claude Opus. Feed it section by section or all at once depending on context window. Be specific when asking for each screen.

---

## PROJECT OVERVIEW

You are building **Samsung DAO Governance Portal** — an internal enterprise web application for Samsung Electronics employees, developed as part of the **Samsung PRISM** university research program.

This is a **decentralised governance platform** built on top of the **Hedera blockchain testnet**. It allows Samsung employees to participate in elections, vote on proposals, create governance events, and join giveaways — all governed by smart contracts on Hedera.

**This is an internal tool. It must look and feel like an official Samsung enterprise product — not a startup app, not a generic dashboard template. Every screen must be production-grade, polished, and professional.**

---

## ARCHITECTURE CONTEXT

The platform is split across two teams. You are building **Layers 1 and 2 only**.

```
Layer 1 — Samsung Member Web Portal      ← YOUR TEAM
  Next.js 14, Role-based UI, WalletConnect

Layer 2 — Identity & Access              ← YOUR TEAM
  Samsung SSO (OAuth 2.0 / JWT)
  KYC & Compliance (Identity Verification, Liveness Check)
  Verified Samsung Account (Enterprise Auth, Role Assignment)
  Wallet Service (Hedera Account Binding, Key Management)

Layer 3 — API Gateway & Rate Limiting    ← OTHER TEAM (mock for now)
  Governance Analytics Engine
  AI Anomaly Detection
  Snapshot Service
  Proposal Validator

Layer 4 — Smart Contracts (Hedera EVM/HTS/HCS)  ← OTHER TEAM
Layer 5 — Security & Governance Controls         ← OTHER TEAM
Layer 6 — Hedera Native Services                 ← OTHER TEAM
```

**For MVP: Mock all Layer 3–6 API calls with realistic dummy data. Build the UI and flows completely. Wire up real APIs later.**

---

## TECH STACK — CONFIRMED

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Auth | NextAuth.js (Samsung SSO simulation for MVP) |
| Database | Supabase (Postgres + Realtime + Storage) |
| Blockchain UI | Hedera SDK (wallet binding UI only, testnet) |
| Wallet Connect | WalletConnect v2 / HashPack |
| Deployment | Vercel |
| AI (future) | Anthropic Claude Opus API |
| Language | TypeScript throughout |

---

## DESIGN SYSTEM — STRICTLY FOLLOW THIS

### Brand Colors
```css
--samsung-primary: #1428A0;      /* Samsung Blue — primary actions, nav, CTAs */
--samsung-dark: #0D1A7A;         /* Headings, hover states */
--samsung-mid: #4A5BD4;          /* Secondary accents */
--samsung-light: #E8EAFB;        /* Light backgrounds, badges */

--white: #FFFFFF;
--gray-50: #F8F9FC;              /* Page background */
--gray-100: #F0F2F8;             /* Subtle backgrounds */
--gray-200: #E2E6F0;             /* Borders */
--gray-300: #D8DCF0;             /* Input borders */
--gray-400: #9AA3BC;             /* Placeholder, muted text */
--gray-500: #6B7491;             /* Secondary text */
--gray-700: #374166;             /* Body text */
--gray-900: #0D1A7A;             /* Headings */

--success: #1D9E75;
--success-light: #E1F5EE;
--warning: #EF9F27;
--warning-light: #FAEEDA;
--danger: #E24B4A;
--danger-light: #FFF0F0;
--info: #1428A0;
--info-light: #E8EAFB;
```

### Typography
- **Font**: IBM Plex Sans (import from Google Fonts)
- **Mono font**: IBM Plex Mono (for IDs, hashes, code, badges)
- Headings: 600 weight, letter-spacing: -0.01em, color: #0D1A7A
- Body: 400 weight, color: #374166
- Muted: color: #6B7491
- Labels/eyebrows: 500 weight, uppercase, letter-spacing: 0.08em, font-size: 11px, color: #9AA3BC, IBM Plex Mono

### Component Rules
- **Borders**: 0.5px solid #E2E6F0 everywhere. Never 1px unless focused.
- **Border radius**: 8px for inputs/buttons, 10–12px for cards, 14px for modals
- **No gradients** anywhere
- **No drop shadows** — use borders only
- **Nav height**: 52px, background #1428A0
- **Sidebar width**: 200px, background #FFFFFF, border-right 0.5px
- **Page background**: #F8F9FC
- **Card background**: #FFFFFF
- **Buttons**: Primary = #1428A0 bg, white text. Secondary = white bg, #374166 text, border. Hover states required.
- **Status pills**: Use color-coded background + matching text color. Never black text on colored background.
- **Spacing**: 24px page padding, 16px card padding, 12px between cards in a grid

### Navigation Bar (appears on all authenticated screens)
```
Left:  [Samsung logo mark (white square, 26x26, blue grid icon)] Samsung DAO  [Portal name in muted]
Right: [PRISM · Testnet badge] [User avatar circle + name]
```
Background: #1428A0, height: 52px

### Status Bar (below nav, on all screens)
```
[Green dot] Hedera testnet · Block #XX,XXX,XXX · All systems operational
```
Background: #F0F2F8, border-bottom: 0.5px solid #D8DCF0, font: IBM Plex Mono 12px

---

## USER ROLES — 3 PORTALS

### 1. Admin
- **Access**: Monitor-only. Cannot create or modify anything.
- **Login**: Samsung SSO + 2FA
- **Sees**: Live governance analytics, proposal pipeline, member registry, smart contract event logs, anomaly detection alerts, timelock and multisig status

### 2. Council Member
- **Access**: Configure all governance rules. Cannot participate as a standard member.
- **Login**: Samsung SSO + wallet
- **Sees**: Dashboard, rule builder, election setup, voting config, giveaway/lottery setup, proposal review queue, reputation settings, delegation limits

### 3. Standard Member (2 sub-types)
- **Login**: 2-step (Samsung SSO → Hedera wallet binding, wallet binding done once only)
- **Sub-type A — Proposer**: Can create new governance events/proposals + participate in giveaway, lottery, election, voting
- **Sub-type B — Delegate**: Can receive delegated votes + participate in giveaway, lottery, election, voting
- **Both sub-types share**: Voting booth, lottery entry, giveaway participation, profile & reputation score page

---

## SCREENS TO BUILD — COMPLETE LIST

---

### SCREEN 1: Homepage (Public, unauthenticated)

**Purpose**: Public landing page. Route visitors to the correct portal login.

**Layout**:
- Top nav (Samsung blue, unauthenticated version — no user avatar)
- Status bar (Hedera testnet status)
- Hero section
- 3 role selector cards
- Login flow preview / architecture info strip
- Footer

**Hero section content**:
- Eyebrow: `SAMSUNG PRISM · DAO GOVERNANCE` (IBM Plex Mono, uppercase, #1428A0)
- H1: `Decentralised governance for Samsung employees`
- Subtext: `Participate in elections, proposals, and giveaways powered by Hedera blockchain. Secure, transparent, and built for Samsung's internal ecosystem.`
- Stats row: `3 Portal roles` · `HTS Token standard` · `48h Timelock window` · `3-of-5 Multisig council`

**3 Role Cards** (side by side, equal width):

```
ADMIN CARD
- Icon: red grid icon
- Title: Admin
- Description: Monitor platform activity, review proposals, and oversee governance health.
- Features list: Live governance analytics, Member registry oversight, Contract event logs, Anomaly detection alerts
- Button: "Admin login" (outline style, red-ish border)

COUNCIL CARD (slightly accented border)
- Icon: purple people icon
- Title: Council member
- Description: Configure governance rules, set up elections, voting parameters, and giveaways.
- Features list: Governance rule builder, Election & voting setup, Lottery / giveaway config, Proposal review queue
- Button: "Council login" (outline, purple border)

MEMBER CARD (primary, blue border, 1.5px, "Most common" badge)
- Icon: blue person icon
- Title: Standard member
- Description: Proposers and delegates — participate in elections, create events, and join giveaways.
- Features list: Create proposals (Proposer), Delegate voting power, Vote in elections, Join lottery & giveaway
- Button: "Member login" (filled, #1428A0)
```

**Bottom strip**:
- Left: Login flow steps preview (2-step flow info card)
- Right: Architecture layer list (Layer 1, 2 highlighted; Layers 3–6 shown as grayed out "other team")

**Footer**: Dark navy (#0D1A7A), `Samsung DAO · PRISM Research · Hedera Testnet` left, `© 2025 Samsung Electronics · Internal use only` right

---

### SCREEN 2: Member Login — Step 1 (Samsung SSO)

**Purpose**: First authentication step for standard members.

**Layout**: Centered card on #F8F9FC background, max-width 420px

**Progress indicator**: 2 pills at top. Pill 1 = active (blue). Pill 2 = inactive (gray).

**Card content**:
- Eyebrow: `Step 1 of 2`
- Title: `Sign in to Samsung DAO`
- Subtitle: `Use your Samsung employee credentials to access the governance portal.`

**Primary option**:
- Large "Continue with Samsung SSO" button — white bg, blue Samsung grid icon, border on hover

**Divider**: `or sign in manually`

**Manual form fields**:
- Employee ID (placeholder: `e.g. SEC-2024-00421`)
- Password (type="password")
- Remember this device (checkbox)
- Forgot password link (right aligned, #1428A0)

**Submit button**: Full width, `Sign in`, #1428A0 background

**Footer note**: `Samsung Electronics internal system · Unauthorised access is prohibited`

**On success → navigate to Screen 2b (identity confirmed)**

---

### SCREEN 2b: Member Login — Identity Confirmed

**Progress indicator**: Pill 1 = done (green). Pill 2 = inactive (gray).

**Card content**:
- Eyebrow: `Step 1 of 2 — Verified`
- Title: `Identity confirmed`
- Subtitle: `Your Samsung employee credentials were verified successfully.`

**Green success box**:
```
✓  Kim Jae-won · SEC-2024-00421
   Samsung Electronics · R&D Division · Verified member
```

**Info card** showing:
- KYC status: Verified (green dot)
- Role assigned: Standard member (blue pill)
- Hedera wallet: Not yet connected (amber dot)

**Blue info box**: `Next: connect your Hedera testnet wallet to get your Account ID. This is a one-time setup.`

**Button**: `Continue to wallet setup` → navigates to Screen 3

---

### SCREEN 3: Member Login — Step 2 (Hedera Wallet)

**Progress indicator**: Pill 1 = done (green). Pill 2 = active (blue).

**Card content**:
- Eyebrow: `Step 2 of 2` + green `Once only` badge (IBM Plex Mono)
- Title: `Connect Hedera wallet`
- Subtitle: `Connect your Hedera testnet wallet to receive your Account ID. You only need to do this once.`

**Network info card**:
```
Network:    Hedera Testnet
Chain ID:   0x128 · 296
Account ID: Pending connection (amber dot)
```

**Wallet options list** (3 rows, each clickable):
```
[HashPack icon]      HashPack wallet          Recommended for Hedera    →
[WalletConnect icon] WalletConnect            Scan QR with mobile wallet →
[Blade icon]         Blade wallet             Hedera native wallet        →
```

**Skip link**: `Skip for now — set up later` (secondary button style)

**Footer note**: `Your wallet is only used to receive your Hedera Account ID · No funds required on testnet`

**On wallet selection → navigate to Screen 3b (success)**

---

### SCREEN 3b: Login Complete — Success

**Progress indicator**: Both pills = done (green).

**Card content**:
- Eyebrow: `Setup complete`
- Title: `You're all set`
- Subtitle: `Your Samsung DAO account is ready. Wallet binding is saved — you won't need to do this again.`

**Green success box**: `Wallet connected successfully — HashPack · Hedera Testnet`

**Account summary card**:
```
Account ID:   0.0.4827341       (IBM Plex Mono)
Member:       Kim Jae-won
Role:         Standard member   (blue pill)
SPU balance:  0 SPU testnet
```

**Blue info box**: `Next time you sign in, only your Samsung SSO credentials are needed. Wallet is already bound.`

**Button**: `Go to my dashboard` → navigates to Member Dashboard

---

### SCREEN 4: Member Dashboard

**Layout**: Nav + status bar + sidebar (200px) + main content area

**Sidebar sections**:
```
OVERVIEW
  - Dashboard (active)
  - My profile

PARTICIPATE
  - Vote           [badge: 1 active]
  - Proposals      [badge: 3]
  - Lottery
  - Giveaway

MY ACTIVITY
  - My proposals   (Proposer only)
  - My delegations (Delegate only)
  - History
```

**Main content — top stats row** (4 cards):
```
Reputation score: 847 pts     | Active votes: 1        | Proposals created: 3  | SPU earned: 240
+12 this month                | Ends in 18h            | 2 approved            | This period
```

**Active Election card** (full width, accent blue border):
```
LIVE NOW badge
Council Election — Q2 2025
Voting closes: 4 Apr 2025, 18:00 KST · 847 eligible members · 412 votes cast (48.6%)

[Candidate list with vote/select UI]
[Cast vote button]
```

**2-column grid below**:

Left — Recent Proposals:
```
P-12  Q2 SPU token reward increase    [Pending review]
P-11  Update delegation rules         [Approved]
P-10  Modify quorum threshold         [Draft]
+ Create new proposal button (Proposer only)
```

Right — My Reputation:
```
Score breakdown:
  Participation:  320 pts
  Proposals:      280 pts
  Delegation:     147 pts
  Tenure:         100 pts
  Total:          847 pts

Decay rate: -5 pts/month if inactive
```

**Bottom row — Upcoming Events**:
```
[Lottery]  Q2 Samsung SPU Lottery     Draws: 15 Apr · 500 SPU prize · Enter now
[Giveaway] PRISM Research Giveaway    Closes: 20 Apr · Registered
```

---

### SCREEN 5: Council Portal Dashboard

**Layout**: Nav (badge: `Council · Testnet`) + status bar + sidebar + main content

**Sidebar sections**:
```
OVERVIEW
  - Dashboard (active)
  - Proposals      [4 pending]

GOVERNANCE
  - Rule builder
  - Election setup
  - Voting config

EVENTS
  - Giveaway setup
  - Lottery config

SETTINGS
  - Reputation rules
  - Delegation limits
```

**Page header**: `Council dashboard` + `Governance period #7 · Active since 12 Mar 2025` + `+ New rule` button

**Stats row** (4 cards):
```
Active rules: 12    | Pending proposals: 4  | Eligible members: 847  | Timelock: 48h
+2 this period      | Needs review          | Snapshot taken         | Mandatory
```

**2-column grid**:

Left — Active Governance Rules:
```
Quorum threshold:     51%
Voting window:        72 hours
Min. reputation:      100 pts
Delegation limit:     5 members
Execution delay:      48 hours
```

Right — Proposal Review Queue:
```
P-12  Q2 SPU token reward increase   Lee Min-jun · 2d ago      [Review]
P-11  Update delegation rules         Park Soo-yeon · 4d ago    [Approved]
P-10  Modify quorum threshold         Choi Dong-hyun · 5d ago   [Draft]
```

**Election Config section** (full width card with tabs):

Tabs: `Election` | `Voting` | `Giveaway` | `Lottery`

Election tab form:
```
Election name:   [Council Election — Q2 2025]
Election type:   [Single choice ▼]
Start date:      [01 Apr 2025  09:00 KST]
End date:        [04 Apr 2025  18:00 KST]

Toggles:
☑ Require reputation threshold      Members below 100 pts cannot vote
☑ Allow vote delegation             Members can assign votes to delegates
☐ Snapshot voter eligibility        Lock eligible list at block height
```

**Save bar** (bottom, sticky): `Unsaved changes in Election config · Last saved 14 min ago` + `Discard` + `Save & publish`

---

### SCREEN 6: Admin Dashboard

**Layout**: Nav (badge: `Admin · Monitor`) + status bar + sidebar + main content

**Sidebar sections**:
```
OVERVIEW
  - Dashboard (active)
  - Member registry

MONITORING
  - Proposal pipeline
  - Contract logs
  - Anomaly alerts   [2 new]

GOVERNANCE
  - Timelock status
  - Multisig council
  - Snapshot history

REPORTS
  - Analytics export
  - Audit trail
```

**Page header**: `Monitor dashboard` + `Read-only · All data live from Hedera testnet` tag

**Stats row** (4 cards):
```
Total members: 1,247  | Active proposals: 7   | Alerts today: 2       | Timelock queue: 1
+23 this month        | 4 pending review       | 1 critical            | 38h remaining
```

**Alert banner** (amber, full width):
```
⚠ Anomaly detected — Unusual voting pattern on Proposal P-12 · Detected 2h ago · [View details]
```

**2-column grid**:

Left — Proposal Pipeline:
```
Status breakdown:
  Draft:          8
  Under review:   4
  Approved:       12
  Executing:      1
  Completed:      47
  Rejected:       3

[Bar chart or simple list visualization]
```

Right — Contract Event Log (live feed):
```
14:23:01  VotingEngine.sol     Vote cast · Member 0.0.4827341
14:22:47  Governance.sol       Proposal P-12 submitted
14:21:03  TimelockController   48h delay initiated · P-11
14:18:55  ReputationOracle     Decay applied · 23 members
14:15:22  DelegationReg.sol    Delegation updated · 0.0.3921
[Load more...]
```

**Bottom row**:

Left — Member Registry snapshot:
```
Total:     1,247 members
Proposers:   312
Delegates:   189
Inactive:    746

KYC verified: 1,231 (98.7%)
Wallets bound: 1,198 (96.1%)
```

Right — Multisig Council Status (3-of-5):
```
[5 council member cards, each showing: name, wallet, signed/pending status]
Required signatures: 3 of 5
Current action: Execute P-11 · Update delegation rules
Awaiting: 1 more signature
```

---

## ROUTING STRUCTURE

```
app/
  page.tsx                          → Homepage (public)

  auth/
    login/page.tsx                  → Member login Step 1
    verify/page.tsx                 → Identity confirmed
    wallet/page.tsx                 → Hedera wallet connect
    success/page.tsx                → Login complete

  member/
    dashboard/page.tsx              → Member dashboard
    vote/page.tsx                   → Voting booth
    proposals/page.tsx              → Proposals list
    proposals/new/page.tsx          → Create proposal (Proposer only)
    lottery/page.tsx                → Lottery entry
    giveaway/page.tsx               → Giveaway
    profile/page.tsx                → Profile + reputation
    delegations/page.tsx            → Delegations (Delegate only)

  council/
    dashboard/page.tsx              → Council dashboard
    rules/page.tsx                  → Governance rule builder
    election/page.tsx               → Election setup
    voting/page.tsx                 → Voting config
    giveaway/page.tsx               → Giveaway setup
    lottery/page.tsx                → Lottery config
    proposals/page.tsx              → Proposal review queue
    reputation/page.tsx             → Reputation rules
    delegation/page.tsx             → Delegation limits

  admin/
    dashboard/page.tsx              → Admin monitor dashboard
    members/page.tsx                → Member registry
    proposals/page.tsx              → Proposal pipeline
    logs/page.tsx                   → Contract event logs
    alerts/page.tsx                 → Anomaly alerts
    timelock/page.tsx               → Timelock queue
    multisig/page.tsx               → Multisig council
    analytics/page.tsx              → Analytics + export
```

---

## SHARED COMPONENTS TO BUILD

```
components/
  layout/
    Navbar.tsx              → Samsung blue nav with logo, user avatar, role badge
    StatusBar.tsx           → Hedera block height + system status
    Sidebar.tsx             → Role-specific sidebar navigation
    SaveBar.tsx             → Sticky bottom save/discard bar

  ui/
    RoleCard.tsx            → Homepage portal selector card
    StatCard.tsx            → Metric summary card (value + label + delta)
    ProposalRow.tsx         → Proposal list item with status badge
    StatusBadge.tsx         → Color-coded pill (active/pending/draft/approved/rejected)
    AlertBanner.tsx         → Full-width amber/red alert strip
    ToggleRow.tsx           → Label + description + toggle switch row
    StepPills.tsx           → 2-step login progress indicator
    WalletOptionRow.tsx     → Wallet selector row (icon + name + arrow)
    AccountCard.tsx         → Hedera account summary card
    EventCard.tsx           → Lottery/giveaway event card

  forms/
    ElectionForm.tsx        → Election configuration form
    VotingForm.tsx          → Voting parameters form
    ProposalForm.tsx        → New proposal creation form
    GiveawayForm.tsx        → Giveaway event setup form
    LotteryForm.tsx         → Lottery configuration form
```

---

## MOCK DATA TO USE (for MVP)

```typescript
// Current user (member)
const currentUser = {
  id: 'SEC-2024-00421',
  name: 'Kim Jae-won',
  role: 'member', // 'member' | 'council' | 'admin'
  memberType: 'proposer', // 'proposer' | 'delegate'
  hederaAccountId: '0.0.4827341',
  kycVerified: true,
  walletBound: true,
  reputationScore: 847,
  spuBalance: 240,
}

// Active election
const activeElection = {
  id: 'election-q2-2025',
  title: 'Council Election — Q2 2025',
  status: 'live',
  startDate: '2025-04-01T09:00:00+09:00',
  endDate: '2025-04-04T18:00:00+09:00',
  eligibleMembers: 847,
  votesCast: 412,
  candidates: [
    { id: 'c1', name: 'Park Soo-yeon', department: 'R&D', votes: 187 },
    { id: 'c2', name: 'Lee Min-jun', department: 'Engineering', votes: 143 },
    { id: 'c3', name: 'Choi Dong-hyun', department: 'Product', votes: 82 },
  ],
}

// Governance rules
const governanceRules = {
  quorumThreshold: 51,
  votingWindowHours: 72,
  minReputationScore: 100,
  delegationLimit: 5,
  executionDelayHours: 48,
  timelockWindowHours: 48,
  multisigRequired: 3,
  multisigTotal: 5,
}

// Proposals
const proposals = [
  { id: 'P-12', title: 'Q2 SPU token reward increase', author: 'Lee Min-jun', status: 'pending', daysAgo: 2 },
  { id: 'P-11', title: 'Update delegation rules', author: 'Park Soo-yeon', status: 'approved', daysAgo: 4 },
  { id: 'P-10', title: 'Modify quorum threshold', author: 'Choi Dong-hyun', status: 'draft', daysAgo: 5 },
]
```

---

## BUILD INSTRUCTIONS FOR OPUS

When building each screen, follow this order:

1. **Start with the layout shell** — Navbar, StatusBar, Sidebar (if authenticated screen), page wrapper
2. **Build the page-level components** — stat cards, main content cards, forms
3. **Add interactivity** — form state with React useState, tab switching, toggle state
4. **Add routing** — Next.js Link components between screens
5. **Use TypeScript interfaces** for all props and data shapes
6. **Mobile**: Build desktop-first. Sidebar collapses to hamburger on mobile. Cards stack vertically.

### Code quality rules:
- TypeScript strict mode
- No `any` types
- All components in separate files under `components/`
- Use Tailwind utility classes only — no inline styles except where Tailwind cannot reach
- shadcn/ui for: Button, Input, Select, Switch, Tabs, Badge, Card, Dialog, Table
- All colours must use the CSS variables or Tailwind config extensions — no hardcoded hex in JSX

### Tailwind config extensions needed:
```javascript
// tailwind.config.ts
extend: {
  colors: {
    samsung: {
      primary: '#1428A0',
      dark: '#0D1A7A',
      mid: '#4A5BD4',
      light: '#E8EAFB',
    }
  },
  fontFamily: {
    sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
    mono: ['IBM Plex Mono', 'monospace'],
  }
}
```

---

## WHAT TO BUILD FIRST (MVP ORDER)

```
Phase 1 — Shell + Homepage
  1. Next.js project setup with Tailwind + shadcn/ui
  2. Tailwind config with Samsung colours + IBM Plex fonts
  3. Navbar component
  4. StatusBar component
  5. Homepage (public) with 3 role cards

Phase 2 — Member Login Flow
  6. Login Step 1 — Samsung SSO form
  7. Login Step 1b — Identity confirmed screen
  8. Login Step 2 — Hedera wallet selection
  9. Login Step 2b — Success + account summary

Phase 3 — Member Dashboard
  10. Sidebar component (member variant)
  11. StatCard component
  12. Member dashboard page
  13. Active election card + vote UI
  14. Proposals list
  15. Reputation card

Phase 4 — Council Portal
  16. Sidebar component (council variant)
  17. Council dashboard
  18. Election setup form (with tabs)
  19. Governance rule builder
  20. Proposal review queue

Phase 5 — Admin Dashboard
  21. Sidebar component (admin variant)
  22. Admin dashboard
  23. Alert banner component
  24. Contract event log (live feed simulation)
  25. Member registry table
  26. Multisig council status
```

---

## SAMPLE PROMPT TO START

Use this exact prompt in Opus to begin:

```
Build Phase 1 of the Samsung DAO Governance Platform using Next.js 14 (App Router), 
TypeScript, Tailwind CSS, and shadcn/ui.

Start with:
1. Project structure setup
2. Tailwind config with Samsung brand colors (#1428A0 primary) and IBM Plex Sans/Mono fonts
3. Navbar component (Samsung blue, 52px height, logo mark + portal name + testnet badge + user avatar)
4. StatusBar component (Hedera block height + system status, IBM Plex Mono)
5. Full Homepage page with 3 role selector cards (Admin, Council, Standard Member)

Follow the design system strictly:
- Light theme, white cards, #F8F9FC page background
- 0.5px borders, no shadows, no gradients
- Samsung blue #1428A0 for all primary actions
- IBM Plex Sans for UI, IBM Plex Mono for IDs/badges/labels

Produce complete, working TypeScript code for each file. No placeholders.
```

---

*Generated for Samsung PRISM · DAO Governance Platform · Layers 1 & 2 only*
*Claude Opus — use claude-opus-4-5 or latest available model*
