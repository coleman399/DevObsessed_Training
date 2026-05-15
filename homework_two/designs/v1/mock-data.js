/* Shared mock data for all three prototypes.
 * Exposed as `window.AGP_MOCK` so each Babel-transpiled JSX file can use it.
 */
window.AGP_MOCK = (function () {
  const user = {
    name: 'Dillon Coleman',
    firstName: 'Dillon',
    email: 'dillon.coleman@agp.com',
    initials: 'DC',
    role: 'SoftwareEngineer',
    org: 'agp-co',
    project: 'ELO Platform',
    githubOrg: 'agp-co',
  };

  const workItems = [
    { id: 24812, type: 'Bug',        title: 'Vehicle weight cascade clears dirty state on save', state: 'Active',   priority: 1, points: 5, area: 'WebPortal\\LoadOrders', tags: ['regression', 'dirty-state'], updated: '32m ago' },
    { id: 24798, type: 'User Story', title: 'Pin file context to chat thread for codebase Q&A',   state: 'Active',   priority: 2, points: 8, area: 'WebPortal\\Assistant',  tags: ['ai', 'spike'],          updated: '2h ago'  },
    { id: 24777, type: 'Task',       title: 'Migrate AppDbContext for ApplicationUser fields',    state: 'New',      priority: 2, points: 3, area: 'WebPortal\\Api',        tags: ['backend'],              updated: '4h ago'  },
    { id: 24764, type: 'Bug',        title: 'Datepicker dropdown collides with mat-select on dark theme', state: 'Resolved', priority: 3, points: 2, area: 'WebPortal\\Shared', tags: ['ui', 'dark-mode'], updated: 'yesterday' },
    { id: 24752, type: 'User Story', title: 'PO can draft user stories with AI assistance',       state: 'Active',   priority: 2, points: 13, area: 'WebPortal\\Assistant', tags: ['ai', 'po'],            updated: '2d ago'  },
    { id: 24748, type: 'Task',       title: 'Encrypt Anthropic API keys with AES-256-GCM',        state: 'New',      priority: 1, points: 5, area: 'WebPortal\\Api',        tags: ['security'],             updated: '2d ago'  },
  ];

  const pullRequests = [
    { id: 1147, source: 'ado',    repo: 'AGP.ELO.WebPortal',     title: 'fix(load-orders): preserve dirty state on partial cascade', author: 'd.coleman', authorInitials: 'DC', status: 'Active',   reviewers: ['M. Park (approved)', 'A. Khan', 'B. Reyes'], comments: 4, changes: '+182 / −94', updated: '1h ago',  ai: true },
    { id: 1143, source: 'ado',    repo: 'AGP.ELO.WebPortal',     title: 'feat(api): add ApplicationUser.AnthropicApiKeyEncrypted',   status: 'Active',   author: 'm.park',    authorInitials: 'MP', reviewers: ['D. Coleman', 'A. Khan'], comments: 7, changes: '+342 / −12', updated: '4h ago' },
    { id: 1141, source: 'github', repo: 'agp-co/command-station', title: 'chore: add MSAL boot + Graph token cache',                  status: 'Draft',   author: 'a.khan',   authorInitials: 'AK', reviewers: ['D. Coleman'], comments: 2, changes: '+220 / −0',  updated: '6h ago' },
    { id: 1129, source: 'github', repo: 'agp-co/command-station', title: 'feat(chat): SSE tool_use loop for code Q&A',                status: 'Active',  author: 'd.coleman',authorInitials: 'DC', reviewers: ['M. Park', 'B. Reyes (approved)'], comments: 11, changes: '+1.2k / −340', updated: 'yesterday' },
  ];

  const repos = [
    { id: 'wp',  source: 'ado',    name: 'AGP.ELO.WebPortal',      lang: 'TypeScript', defaultBranch: 'main',    updated: 'today',    stars: null, prs: 12 },
    { id: 'api', source: 'ado',    name: 'AGP.ELO.WebPortal.Api',  lang: 'C#',         defaultBranch: 'main',    updated: '2d ago',   stars: null, prs: 3  },
    { id: 'cs',  source: 'github', name: 'agp-co/command-station', lang: 'TypeScript', defaultBranch: 'develop', updated: '6h ago',   stars: 14,   prs: 5  },
    { id: 'plg', source: 'github', name: 'agp-co/platform-docs',   lang: 'MDX',        defaultBranch: 'main',    updated: '3d ago',   stars: 3,    prs: 0  },
  ];

  const repoTree = [
    { name: 'src',                 type: 'folder', children: [
      { name: 'app',               type: 'folder', children: [
        { name: 'main',            type: 'folder', children: [
          { name: 'load-orders',   type: 'folder' },
          { name: 'dashboard-page',type: 'folder' },
          { name: 'customers',     type: 'folder' },
        ]},
        { name: 'shared',          type: 'folder' },
        { name: 'core',            type: 'folder' },
        { name: 'auth',            type: 'folder' },
      ]},
      { name: 'assets',            type: 'folder' },
      { name: 'index.html',        type: 'file', lang: 'html' },
      { name: 'main.ts',           type: 'file', lang: 'ts' },
    ]},
    { name: 'tests',               type: 'folder' },
    { name: 'angular.json',        type: 'file', lang: 'json' },
    { name: 'package.json',        type: 'file', lang: 'json' },
    { name: 'README.md',           type: 'file', lang: 'md' },
  ];

  const emails = [
    { id: 'e1', from: 'Maya Park',     fromEmail: 'maya.park@agp.com',     subject: 'Re: PR #1147 — vehicle cascade fix',     preview: "Looks good overall — one concern on the partial-cascade branch. Mind taking a second look before I approve?", time: '11:24 AM', unread: true,  hasAttachment: false },
    { id: 'e2', from: 'GitHub',        fromEmail: 'noreply@github.com',    subject: '[command-station] review requested on #1141', preview: 'a.khan requested your review on “chore: add MSAL boot + Graph token cache”.', time: '10:02 AM', unread: true, hasAttachment: false },
    { id: 'e3', from: 'Azure DevOps',  fromEmail: 'azuredevops@microsoft.com', subject: 'Build succeeded · AGP.ELO.WebPortal · main', preview: 'Build #4882 succeeded. 0 errors, 3 warnings. Coverage 82.4% (+0.3%).', time: '09:41 AM', unread: false, hasAttachment: false },
    { id: 'e4', from: 'Brianna Reyes', fromEmail: 'brianna.reyes@agp.com', subject: 'Quick Q on the WIQL query',                preview: "Hey — for the assigned-to-me query, are we filtering closed only, or also Removed?", time: 'Yesterday', unread: true, hasAttachment: false },
    { id: 'e5', from: 'Aamir Khan',    fromEmail: 'aamir.khan@agp.com',    subject: 'Onboarding doc draft',                     preview: "First pass for the new-hire onboarding doc. Open to edits in-line.", time: 'Tuesday', unread: false, hasAttachment: true },
  ];

  const events = [
    { day: 'Mon', date: 12, title: 'Sprint planning',          time: '9:30 – 10:30',  attendees: 6, teams: true,  color: 'navy'  },
    { day: 'Mon', date: 12, title: 'PR review w/ Maya',         time: '2:00 – 2:30',   attendees: 2, teams: true,  color: 'amber' },
    { day: 'Tue', date: 13, title: 'ELO arch sync',             time: '10:00 – 11:00', attendees: 4, teams: true,  color: 'navy'  },
    { day: 'Wed', date: 14, title: 'Focus block',               time: '1:00 – 3:00',   attendees: 1, teams: false, color: 'neutral' },
    { day: 'Thu', date: 15, title: 'Backlog refinement',        time: '11:00 – 12:00', attendees: 8, teams: true,  color: 'navy'  },
    { day: 'Thu', date: 15, title: '1:1 w/ Brandon',            time: '3:00 – 3:30',   attendees: 2, teams: true,  color: 'amber' },
    { day: 'Fri', date: 16, title: 'Demo · Command Station',    time: '10:00 – 10:45', attendees: 12, teams: true, color: 'amber' },
  ];

  const teamsChannels = [
    { id: 'ch1', team: 'ELO Platform',     name: 'general',       unread: 2, lastMessage: 'Maya: heads up — partial-cascade edge case in PR 1147', time: '11m' },
    { id: 'ch2', team: 'ELO Platform',     name: 'dev-frontend',  unread: 0, lastMessage: 'Aamir: dark-mode toggle PR is in', time: '2h'  },
    { id: 'ch3', team: 'AGP Engineering',  name: 'announce',      unread: 1, lastMessage: 'Brandon: tomorrow’s demo agenda', time: '4h'  },
  ];

  const teamsMentions = [
    { id: 'm1', from: 'Maya Park',     channel: 'ELO Platform · general', text: '@Dillon does the partial-cascade branch in #1147 cover the multi-vehicle case?', time: '11m' },
    { id: 'm2', from: 'Brandon Walls', channel: 'AGP Engineering · announce', text: '@Dillon can you walk through the agentic tool loop in Friday’s demo?', time: '4h' },
  ];

  const conversations = [
    { id: 'c1', title: 'Why does the partial cascade re-mark pristine?', updated: 32 * 60 * 1000,  turns: 6 },
    { id: 'c2', title: 'Draft a User Story for pinned files',           updated: 4 * 3600 * 1000, turns: 4 },
    { id: 'c3', title: 'Where is JwtTokenService called from?',         updated: 26 * 3600 * 1000,turns: 9 },
    { id: 'c4', title: 'Bug repro plan for #24764 datepicker collision', updated: 2 * 86400 * 1000, turns: 5 },
  ];

  /* Pre-canned conversation that demonstrates streaming + tool calls. */
  const seedThread = [
    { role: 'assistant', text: "Hey Dillon — what are we working on first today?" },
    { role: 'user',      text: "Where is JwtTokenService.cs and what does it do?" },
    { role: 'tool',      label: 'search_code', detail: '"JwtTokenService"', status: 'done', files: 3 },
    { role: 'tool',      label: 'get_file',    detail: 'AGP.ELO.WebPortal.Api/Services/JwtTokenService.cs', status: 'done', lines: 142 },
    { role: 'assistant', text: "It lives at `AGP.ELO.WebPortal.Api/Services/JwtTokenService.cs:14`. It validates the Microsoft Entra ID token, mints an HS256 app JWT (60-min expiry) keyed by `Jwt:Key` from user-secrets, and is called from `AuthController.Microsoft` (line 38). Want me to also look at where the JWT is consumed on the client?" },
  ];

  /* Canned streaming replies, used by all three options for fake answers. */
  const cannedReplies = {
    default: "I can dig into that — give me a moment.",
    pr:      "I read PR #1147. The partial-cascade branch updates the vehicle map but skips the dirty-state propagation on a single-vehicle edit. I'd suggest moving the `markAsPristineSafe` call after the cascade, or guarding with `if (changedVehicles.length > 0)`. Want a draft review comment?",
    story:   "Here is a draft. Title: 'PO can attach pinned files to chat threads'. AC: (1) PO can pin any file from the repo tree, (2) pinned files persist across sessions, (3) pinned files appear as pills above the chat input, (4) Claude receives pinned files as system context before user message. Tags: ai, po, spike.",
    code:    "Searching the WebPortal repo for that pattern. The closest match is `address-contact-card.component.scss:104` — the BRAND/NEUTRAL hover pattern. We could lift that into a shared mixin if we plan to reuse on the dashboard.",
    test:    "Test plan draft: (1) seed two vehicles, (2) mark vehicle A dirty, (3) trigger partial cascade on vehicle B, (4) assert form is still dirty, (5) save, (6) assert vehicle A persists. Edge case: empty changed-vehicles array — verify cascade is a no-op.",
  };

  return {
    user, workItems, pullRequests, repos, repoTree, emails, events,
    teamsChannels, teamsMentions, conversations, seedThread, cannedReplies,
  };
})();
