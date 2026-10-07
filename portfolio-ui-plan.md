# Portfolio UI Plan

**Theme: "Execution Trace"**
The portfolio is designed as a single agent run. The visitor's goal enters as the input, their state moves through a graph of agent nodes, and every section of the site is one node in that graph.

This document covers the **UI only**: structure, components, states, interactions, layout, and visual system. All content is placeholder. Anything in `[brackets]` gets replaced with real content later.

---

## 1. Section map

Each section of the portfolio is a node. Node roles stay fixed; the content inside them is placeholder.

| Node | Section | Placeholder content |
|---|---|---|
| Planner | Hero | `[Name]`, `[Headline]`, `[Sub-line]`, goal options |
| Retriever | About + skills | `[About paragraph]`, `[Skill 1…n]` grouped into `[Skill group 1…5]` |
| Tools | Projects | `[Project 1]`, `[Project 2]`, `[Project 3]`, `[Project 4]` |
| Subgraph | Experience | `[Internship experience]` — role, company, dates, 3 bullets |
| Verifier | Education + achievements | `[Degree]`, `[Achievement 1]`, `[Achievement 2]` |
| Interrupt | Contact | Contact form + `[Email]`, `[LinkedIn]`, `[GitHub]`, `[Resume]` |
| END | Run summary | Stats from the visitor's session |

---

## 2. The graph

```
                 ┌───────────┐
      goal ────▶ │  planner  │  hero
                 └─────┬─────┘
                       ▼
                 ┌───────────┐
                 │ retriever │  about + skills
                 └─────┬─────┘
                       │ fan-out
      ┌────────────┬───┴────────┬──────────────┐
      ▼            ▼            ▼              ▼
  [Project 1]  [Project 2]  [Project 3]   [Project 4]     tools
      └────────────┴───┬────────┴──────────────┘
                       │ fan-in
                       ▼
          ┌──────────────────────────┐
          │ subgraph:                │
          │ [Internship experience]  │  experience
          └────────────┬─────────────┘
                       ▼
                 ┌───────────┐
                 │ verifier  │  education + achievements
                 └─────┬─────┘
                       ▼
                 ┌───────────┐
                 │ interrupt │  contact
                 └─────┬─────┘
                       ▼
                      END        run summary
```

The fan-out at the tools node is the one place where multiple packets move in parallel. That's where the "many agents flowing" feeling lives — nowhere else.

### Node states

Four states, used everywhere. These are the only visual states in the graph.

| State | When | Look |
|---|---|---|
| `pending` | On the route, not reached yet | 1.5px `edge` outline, label in `ink-muted` |
| `running` | Currently in view | 3px agent-colour outline, pulsing dot top-right |
| `done` | Scrolled past | 1.5px agent-colour outline, ✓ beside label |
| `skipped` | Not on the visitor's route | 40% opacity, dashed outline, still clickable |

**Edges:** `pending` = dashed `edge` colour → `traversed` = solid, in the colour of the node it leads into.

### Packets

- One packet = the visitor's state. It sits on the edge between the last `done` node and the `running` node, positioned by scroll progress (not time).
- At fan-out it splits into one packet per project branch. They merge at fan-in once all project cards are seen or scrolled past.
- No ambient looping animation anywhere else.

---

## 3. Components, node by node

### Planner (hero) — the signature moment

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [Name]                                                      │
│  [Headline — one sentence]                                   │
│  [Sub-line — role, location, availability]                   │
│                                                              │
│  What brings you here?                                       │
│  [ Goal 1 ] [ Goal 2 ] [ Goal 3 ] [ Goal 4 ] [ Everything ]  │
│  [ ______________ Or describe what you're looking for ____ ] │
│                                                              │
│  planner ─ Route ready: [n] stops, about [n] minutes         │
│                                         [ Start the run ]    │
└──────────────────────────────────────────────────────────────┘
```

**Behaviour**
1. Page loads with the full graph faint, all nodes `pending`.
2. Visitor picks a goal chip (or types one). Planner line shows "Planning your route…" for ~400ms.
3. Route draws: on-route edges turn solid one by one (~1.2s total); off-route nodes switch to `skipped`.
4. Page scrolls only when the visitor clicks **Start the run**. Never auto-scroll.

**Goal chips:** 4 presets + "Show me everything". Each maps to a fixed list of nodes. The chosen route is reflected in the URL so it can be shared.

**States of the planner line**

| State | Text |
|---|---|
| Idle | (hidden) |
| Thinking | Planning your route… |
| Ready | Route ready: [n] stops, about [n] minutes. |
| Fallback | Couldn't plan a custom route, so here's the full run. |

### Retriever (about + skills)

```
┌─ retriever ─────────────────────────────────────────────── ● ┐
│  [About paragraph, 3–4 sentences]  │  ┌────────────────────┐ │
│                                    │  │ Search my skills   │ │
│                                    │  └────────────────────┘ │
│                                    │    ·  ·   [Skill]       │
│                                    │  [Skill] ·    ·         │
│                                    │     ·  [Skill]  ·       │
│                                    │   (2D skills map,       │
│                                    │    clustered by group)  │
└──────────────────────────────────────────────────────────────┘
```

- **Skills map:** dots positioned so related skills cluster. Each group uses a subtle tint of the retriever colour.
- **Search:** typing highlights the 5 closest skills with a similarity score (two decimals); others fade.
- **Hover a skill:** tooltip "Used in [Project 1], [Internship experience]". **Click:** those nodes highlight in the graph.
- **Empty search result:** "Nothing close. Try a broader term."
- **Mobile / reduced motion:** grouped list instead of the map; same "used in" links.

### Tools (projects)

Each project is a card styled as a tool signature. **Call tool** expands a result panel underneath.

```
┌─ [project-1] ───────────────────────────────────────── ● ┐
│ [project_1.action](input: type) -> Output                │
│ [One-line description]                                   │
│ [Tag] [Tag] [Tag] [Tag]                                  │
│                                             Call tool    │
├──────────────────────────────────────────────────────────┤
│ tool_result · [n] ms                                     │
│ Problem       [one sentence]                             │
│ Architecture  [small node diagram of the project]        │
│ Hard part     [one technical decision and why]           │
│ Result        [metric]                                   │
│ [Code]  [Demo]                                           │
└──────────────────────────────────────────────────────────┘
```

- Result panel streams in section by section (~600ms total) the first time; instant after that.
- Architecture diagram uses the same node/edge/state language as the main graph.
- Card states: collapsed · loading (streaming) · expanded.
- **Layout:** desktop shows the 4 cards in a 2×2 grid under the fan-out; one expanded card spans both columns. Mobile stacks them.

### Subgraph (internship experience)

```
Collapsed                          Expanded
╔═ [Internship experience] ══╗     ╔═ [Internship experience] ═══════════════╗
║ [Role] · [Company]         ║     ║  ○ [Agent] ─▶ ○ [Agent] ─▶ ○ [Agent]     ║
║ [Dates] · [Location]       ║ ──▶ ║        │                                ║
║            Open subgraph   ║     ║        ▼                                ║
╚════════════════════════════╝     ║  ○ [Tool layer] ◀── ○ [Data layer]       ║
                                   ║                                         ║
                                   ║  • [Outcome bullet 1]                   ║
                                   ║  • [Outcome bullet 2]                   ║
                                   ║  • [Outcome bullet 3]                   ║
                                   ║                         Close subgraph  ║
                                   ╚═════════════════════════════════════════╝
```

- Double outline = "contains a graph". Expands in place (300ms).
- The inner diagram is generic boxes showing the shape of the system, with placeholder labels.

### Verifier (education + achievements)

```
┌─ verifier ──────────────────────────────────────────── ● ┐
│ Checks passed                                            │
│ ✓ [Degree], [Institution] — [Score], [Years]             │
│ ✓ [Achievement 1] — [Detail], [Year]                     │
│ ✓ [Achievement 2] — [Detail], [Year]                     │
└──────────────────────────────────────────────────────────┘
```

- When the node becomes `running`, each line resolves from `…` to `✓`, 150ms apart.

### Interrupt (contact)

```
┌─ interrupt · awaiting input ─────────────────────────── ● ┐
│ This run is waiting for you.                               │
│ [One-line invitation]                                      │
│                                                            │
│ Name     [______________]     │  [Email]      Copy         │
│ Email    [______________]     │  [LinkedIn]                │
│ Message  [______________]     │  [GitHub]                  │
│          [______________]     │  [Resume]     Download     │
│                 Send message  │                            │
└────────────────────────────────────────────────────────────┘
```

- The packet visibly stops here. Sending the form "resumes" the run and moves the packet to END.

| State | UI |
|---|---|
| Default | Form + side links |
| Invalid field | Field outline in `error`, message under the field |
| Sending | Button text "Sending…", disabled |
| Success | "Message sent. Run complete." Packet moves to END |
| Error | "Message didn't send. Check your connection and try again, or email [Email]." |

### END (run summary)

```
┌─ END ────────────────────────────────────────────────┐
│ Run complete                                         │
│ Nodes visited [n] of [n] · Tools called [n] · [m:ss] │
│ Download resume    Copy link to this route           │
└──────────────────────────────────────────────────────┘
```

### Chat drawer ("Ask about my work")

```
                                   ┌─ Ask about my work ──── ✕ ┐
                                   │ [Suggested question 1]    │
                                   │ [Suggested question 2]    │
                                   │ [Suggested question 3]    │
                                   │ [Suggested question 4]    │
                                   │ ───────────────────────── │
                                   │ ▸ trace · retrieve → gen… │
                                   │ [Answer text] [source ↗]  │
                                   │ ───────────────────────── │
                                   │ [ Ask a question…    ] ▶  │
                                   └───────────────────────────┘
```

- Floating button bottom-right. Opens a right-side drawer (desktop) or full-height sheet (mobile).
- Each answer has a collapsible trace line and source links; clicking a source scrolls to that node and sets it `running`.
- Empty state is never blank: 4 suggested questions.
- States: empty · streaming · answered · out-of-scope reply · rate-limited · error.

### Global UI

| Component | Desktop | Tablet | Mobile |
|---|---|---|---|
| Header | Name · Work · Experience · Contact · Plain view · Resume · theme toggle | Same, condensed | Name + menu |
| Minimap | Sticky left column, whole graph, click to jump | Top bar of node dots | Left-edge rail |
| State inspector | Sticky right column, collapsed by default | Drawer | Bottom sheet |
| Trace bar | Footer strip, toggle to show | Hidden behind button | Hidden behind button |
| Command palette | `Ctrl/⌘ K`: go to section, download resume, copy email, switch theme | Same | — |
| Plain view | Same content as a simple scrolling page; also the no-JS fallback | Same | Same |

**State inspector** shows the visitor's live run state in mono:
```
{
  "goal": "[selected goal]",
  "nodes_visited": ["planner", "retriever", ...],
  "tools_called": ["[project-1]"],
  "skills_matched": ["[Skill]", "[Skill]"]
}
```

**Trace bar** shows one span per visited section; span length = real time the visitor spent there. Click a span to scroll back.

---

## 4. Layout

**Desktop (≥1100px)**
```
┌────────────────────────────────────────────────────────────────┐
│ [Name]        Work  Experience  Contact   Plain view  Resume ☾ │
├──────────┬──────────────────────────────────────┬──────────────┤
│ minimap  │                                      │ state        │
│ (sticky) │   current node, left-aligned, ≤68ch  │ inspector    │
│   ○      │                                      │ (sticky,     │
│   ●      │                                      │  collapsed)  │
│   ○      │                                      │              │
├──────────┴──────────────────────────────────────┴──────────────┤
│ trace  [span] [span]  [span]  …                       (toggle) │
└────────────────────────────────────────────────────────────────┘
```
Columns: 200px · flexible (max 760px) · 260px. Gutters 32px.

**Tablet (700–1099px)**
```
┌──────────────────────────────────┐
│ [Name]                    ☰   ☾  │
│ ○──●──○──○──○──○──○              │  node-dot progress bar
├──────────────────────────────────┤
│ current node content             │
│                                  │
└──────────────────────────────────┘
```

**Mobile (<700px)**
```
┌──────────────────────┐
│ [Name]          ☰  ☾ │
├──────────────────────┤
│ ● planner            │  vertical rail, packet
│ │  content           │  travels down it
│ │                    │
│ ○ retriever          │
│ ┃  [Project 1]       │  fan-out = bracket on the
│ ┃  [Project 2]       │  rail beside stacked cards
│ ┃  [Project 3]       │
│ ┃  [Project 4]       │
│ ○ subgraph           │
└──────────────────────┘
```

Content is always left-aligned. Spacing scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96px. Vertical gap between nodes: 96px desktop, 64px mobile.

---

## 5. Visual system

Light, cool drafting paper with ink outlines; each agent role has its own ink colour. Dark mode ("night run") mirrors it. Default follows the visitor's system setting.

### Colour

Agent colours have a **mark** variant (outlines, packets, fills) and a darker **text** variant that must pass WCAG AA (4.5:1). Never put a mark colour on text.

| Token | Day run | Night run | Use |
|---|---|---|---|
| `paper` | `#E9ECE6` | `#161B26` | Background |
| `paper-raised` | `#F4F6F1` | `#1E2432` | Node interiors, panels |
| `ink` | `#1C2230` | `#E4E7DF` | Text, outlines |
| `ink-muted` | `#59616B` | `#9AA3B0` | Secondary text, pending labels |
| `edge` | `#A3ABA7` | `#465063` | Pending edges, dot grid, dividers |
| `planner` mark / text | `#2F5BEA` / `#2447C2` | `#7C9BFF` / `#A3B8FF` | Planner, route, focus ring |
| `retriever` mark / text | `#0F8B7E` / `#0A6B61` | `#4FD1C0` / `#7FE0D3` | About, skills |
| `tool` mark / text | `#C9921A` / `#8A6200` | `#F2C14E` / `#F5D07E` | Projects |
| `verifier` mark / text | `#8A3FA0` / `#73308A` | `#C98BE0` / `#DBAEEB` | Education, achievements |
| `error` | `#C2412D` | `#F07A66` | Form errors only |

The subgraph and interrupt nodes use `ink` outlines; the END node uses `planner`.

**Background:** dot grid, 1px dots in `edge` at 30% opacity, 24px spacing. No gradients, no noise, no shadows.

### Typography

| Role | Font | Size / line-height |
|---|---|---|
| Display | Familjen Grotesk 600 | 49px / 1.1, −1% tracking |
| H2 (node titles) | Familjen Grotesk 600 | 31px / 1.2 |
| H3 | Familjen Grotesk 600 | 20px / 1.3 |
| Body | Familjen Grotesk 400 | 17px / 1.55, max 68ch |
| Small | Familjen Grotesk 400 | 14px / 1.45 |
| Code & data | Martian Mono 400 | 14px / 1.5 — tool signatures, node labels, inspector, trace only |

Mobile: display 39px, H2 25px. Sentence case everywhere, no all-caps labels.

### Node anatomy

```
 ┌─ node label ✓ ───────────────────────── ● ┐  ← mono label, state dot
 │                                           │
 │  content on paper-raised                  │  ← outer radius 10px
 │  ┌─────────────────────────────────┐      │
 │  │ inner panel                     │      │  ← inner radius 4px
 │  └─────────────────────────────────┘      │
 └───────────────────────────────────────────┘
   outline 1.5px (pending/done) · 3px (running)
   subgraph: double 1.5px outline, 3px gap
   padding 32px desktop · 20px mobile
```

### Buttons and inputs

| Element | Default | Hover | Focus | Disabled |
|---|---|---|---|---|
| Primary button | `planner` fill, `paper` text, 6px radius | Fill darkens 8% | 2px `planner` ring, 2px offset | 40% opacity |
| Secondary button | 1.5px `ink` outline, `ink` text | `paper-raised` fill | Same ring | 40% opacity |
| Goal chip | 1.5px `edge` outline, pill | `ink` outline | Same ring | — |
| Goal chip (selected) | `planner` outline 3px, `planner` text | — | Same ring | — |
| Text input | `paper-raised` fill, 1.5px `edge` outline, 4px radius | `ink-muted` outline | `planner` outline | — |

Icons: a single thin-line icon set, 20px, stroke 1.5px, in `ink`.

### Motion

| Motion | Duration | Trigger |
|---|---|---|
| Route drawing | ~1.2s total | Goal chosen |
| Packet movement | Follows scroll | Scroll |
| Tool result streaming | ~600ms | Call tool |
| Subgraph expand | 300ms | Open subgraph |
| Verifier checks | 150ms each | Node enters view |
| Running-state pulse | 2s loop, opacity only | Node in view |
| Drawer open | 250ms | Open chat / inspector |

Easing: `cubic-bezier(0.2, 0, 0, 1)`. With `prefers-reduced-motion`: everything resolves instantly; the pulse becomes a solid dot; packets jump between nodes.

---

## 6. Accessibility

- Keyboard: Tab moves node to node; Enter calls a tool or opens the subgraph; Esc closes drawers and the palette.
- Focus ring: 2px `planner`, 2px offset, visible on every interactive element.
- The visual graph is decorative to screen readers; the same structure is exposed as a navigation list. Node state changes are announced politely.
- All colour pairs used for text pass 4.5:1; state never relies on colour alone (✓, dashed outlines, labels).
- Touch targets at least 44×44px.
- Every node has a URL hash so sections can be linked directly.

---

## 7. Screens to design (checklist)

- [ ] Hero — idle, planning, route drawn, fallback
- [ ] Retriever — map, search with results, empty result, mobile list
- [ ] Tools — 4 collapsed cards, one streaming, one expanded
- [ ] Subgraph — collapsed, expanded
- [ ] Verifier — resolving, resolved
- [ ] Interrupt — default, validation error, sending, success, send error
- [ ] END summary
- [ ] Chat drawer — empty, streaming, answered with sources, rate-limited
- [ ] Command palette
- [ ] State inspector — collapsed, open
- [ ] Plain view
- [ ] Each of the above in day and night runs
- [ ] Each of the above at desktop, tablet, mobile widths

---

## 8. Design references

| Reference | Look at it for |
|---|---|
| bruno-simon.com | How far one strong interactive idea can carry a portfolio |
| lynnandtonic.com | A portfolio that feels personal |
| brittanychiang.com | Clear content structure, sticky side navigation |
| LangGraph Studio / LangSmith trace view | Node, state, and span visual vocabulary |
| reactflow.dev/examples | Node and edge styling, nested subflows |
| n8n workflow canvas | Keeping node flows legible at a glance |
| Awwwards portfolio category | Current motion and interaction patterns |
