# Soteria — Stitch UI Generation Prompts

Two user surfaces, one shared design system.

- **Surface 1 — Companion Display.** What the elderly resident sees. A wall-mounted / tablet ambient screen. Three states: **Calm** (default), **Check-In** (fall-verification countdown), **Notified** (after escalation).
- **Surface 2 — Guardian Console.** What the trusted contact (B2C, mobile-first) and the property security operator (B2B, desktop multi-resident grid) sees. Same data model, two viewports.

**How to use this file.** Each numbered prompt below is a single Stitch generation. Generate them one at a time — Stitch reliably omits components on prompts over ~5k chars, and the official guide recommends iterating screen-by-screen. Always paste the **Shared Design System** block at the top of each prompt.

---

## Shared Design System (paste at the top of every prompt)

```
DESIGN SYSTEM (REQUIRED — apply identically across all Soteria screens):

Brand identity: Soteria — a privacy-preserving, on-device home-safety layer for
elderly people living alone. Voice: calm, dignified, plain-language, never
clinical or alarming. Visual language: trust through restraint — empty space,
slow micro-motion, no decorative chrome. The product NEVER calls emergency
services automatically; it escalates to a pre-approved trusted contact only.

Typography:
- Family: Inter (or Manrope) for all UI; tabular numbers for the countdown.
- Resident-facing copy: 20px body / 28px headings minimum. Plain English.
- Guardian-facing copy: 14-16px body / 20-24px headings.
- Line-height generous: 1.5 body, 1.25 headings. Letter-spacing 0 to +1%.

Color tokens (use exactly these hex values):
- Soteria Ink         (#0F1216) — guardian background; resident night-mode background.
- Soteria Panel       (#171C22) — guardian surface / cards.
- Soteria Line        (#262D36) — hairline dividers (1px, never heavy borders).
- Soteria Cream       (#F5EFE6) — resident day-mode background (warm, low-glare).
- Soteria Sand        (#E8DFD2) — resident day-mode surface.
- Text Primary        (#E6EDF3) on dark / (#1A1A1A) on cream.
- Text Muted          (#8B97A5) on dark / (#5C5A55) on cream.
- Accent OK           (#4ADE80) — "all clear", connection up, ack confirmed.
- Accent Caution      (#F5C26B) — soft amber, used for "checking…" / countdown.
- Accent Alert        (#F87171) — confirmed fall, escalation only. Used sparingly.
- Privacy Badge       (#16321F bg / #4ADE80 text) — the always-visible "🔒 local"
                       lockup. Present on every screen.

Shape & spacing:
- Corner radius: 16px cards, 9999px (pill) buttons, 12px inputs.
- 8-point spacing scale (8 / 16 / 24 / 32 / 48 / 64).
- Resident touch targets ≥ 80×80px; guardian targets ≥ 44×44px.
- Shadows: avoid. Use 1px Soteria Line and elevation-by-color instead.

Motion:
- Default 200ms ease-out. Countdown ticks: 1s linear pulse on the numeral only.
- Reduced-motion safe: never auto-flash, strobe, or play looping animation.

Iconography: Lucide / Phosphor outline icons, 24px guardian, 32-40px resident.
Always pair icons with a text label for resident; never icon-only on resident UI.

Privacy lockup (mandatory on every screen, never hidden):
A small pill in the corner reading "🔒 Processed on this device" (resident) or
"🔒 Self-hosted — never sent to a third-party AI" (guardian). Tapping it opens a
plain-language explainer.

Accessibility:
- Contrast ≥ 7:1 (AAA) for resident text; ≥ 4.5:1 (AA) for guardian text.
- Color is never the only signal — every state has a text label and an icon.
- All buttons have visible focus rings (2px Accent OK).
- Resident screens fully usable at arm's length AND from across a room.
```

---

# SURFACE 1 — RESIDENT COMPANION DISPLAY

A calm, ambient tablet/wall display in the elderly resident's home (10-13"
landscape). Default state should feel like a serene digital photo frame, NOT a
medical device — dignity is the design goal (per Nobi/SafelyYou precedent: the
camera is invisible, the device is a lamp, monitoring is silent until needed).

The display has three states. Generate them in order. Each becomes a separate
screen in the same Stitch project so they share the design system.

### Prompt 1A — Calm state (default 99% of the time)

```
[paste SHARED DESIGN SYSTEM block above]

Generate Soteria — Companion Display, "Calm" state. 13-inch landscape tablet,
held in one frame.

Vibe: warm, serene, almost ambient. Looks more like a digital photo frame or
the Nobi smart lamp's idle face than a security device. Soteria Cream
background (#F5EFE6) by day; auto-switches to Soteria Ink (#0F1216) at night.

Page Structure (single screen, no scroll, designed to be glanced at from across
a room):

1. Top-left: Soteria wordmark, very small (16px), Text Muted. No logo lockup
   beyond the word. Below it, today's date in plain language:
   "Friday, 6 June" (24px, Text Primary).

2. Top-right: Privacy lockup pill — "🔒 Processed on this device" — Privacy
   Badge colors. ALWAYS visible.

3. Center hero (the focal point — 70% of vertical space):
   - A single oversized greeting that changes by time of day:
     "Good morning, Margaret." (48px, Text Primary, regular weight, NOT bold).
   - Underneath, smaller and Text Muted: "I'm here if you need me."
     (24px, regular). This is the only "I'm watching" cue — gentle, not
     surveillance language.
   - A thin 1px hairline (Soteria Line) under the greeting block.
   - Beneath the line, three soft "today" cards in a row, each pill-shaped
     with 16px radius and a 1px Line border (NOT filled cards):
     • Weather: "18° and overcast" with a small outline icon.
     • Today's reminder: "Pharmacy at 2pm" with a small outline icon.
     • Connection status: "Family circle: 3 connected" in Accent OK.
   Each card text 20px Text Primary, label 14px Text Muted above.

4. Bottom: a single, large, calm action button — a pill 320px wide, 96px tall,
   centered. Soteria Sand background, Text Primary, 28px label "I need help"
   with a small heart-pulse outline icon to the LEFT of the label. This is the
   manual SOS — large, dignified, never red. One firm press = trigger the
   Check-In flow (state 1B). Subtle 1px Line border.

5. Below the button, 16px Text Muted: "Hold for emergency call". (Hold-to-
   confirm pattern prevents accidental triggers — important, the Apple Watch
   precedent.)

Overall feel: 80% breathing room, no clutter, no notifications stack, no
metrics grid. Imagine a Kindle screensaver, not a dashboard. Avoid all stock
imagery. NO sensor read-outs visible — the MVP has no sensors and the resident
shouldn't see fake data.

Do NOT include: navigation bars, bottom tab bars, status icons (wifi/battery),
notification badges, app drawers, or any trace of "smart home dashboard" UI.
This is one screen, one purpose: be present without being noisy.
```

### Prompt 1B — Check-In state (fall-verification countdown)

```
[paste SHARED DESIGN SYSTEM block above]

Generate Soteria — Companion Display, "Check-In" state. Same 13-inch landscape
tablet. This screen takes over the entire display the moment the local vision
model flags a possible fall.

Vibe: caring, not alarming. The Apple Watch fall-detection countdown is the
canonical reference — three simultaneous channels (visual, audible cue,
haptic) but the visual stays warm. Background dims to Soteria Ink (#0F1216)
to draw all attention to the center; text is Soteria Cream so it remains
high-contrast (AAA) and readable from across the room.

Page Structure (single full-bleed screen, no nav, no header):

1. Top-center, small (18px Text Muted): "Soteria check-in"
   Beneath it, a tiny 8px Accent Caution dot pulsing once per second (the
   ONLY moving thing on screen besides the numeral).

2. Center hero, vertically and horizontally centered, the WHOLE message in
   plain English in three lines:
   - Line 1 (40px regular, Soteria Cream): "I think you may have fallen."
   - Line 2 (40px regular, Soteria Cream): "Are you alright?"
   - Line 3, a single huge tabular numeral countdown (180px, weight 600,
     Accent Caution amber): "20" — counting down from VERIFICATION_TIMER_
     SECONDS. Beneath the numeral, 24px Text Muted: "I'll alert your family
     if you don't respond."

3. Two large action buttons side by side, each 360px wide × 120px tall, pill
   shape, 32px gap between them, horizontally centered below the countdown:

   LEFT button — primary "all-clear" action:
   - Background Accent OK (#4ADE80), text #0F1216, 32px label "I'm OK".
   - Small outline check icon to the left.
   - Tapping cancels the countdown and returns to Calm state with a brief
     "Glad you're alright." confirmation.

   RIGHT button — manual escalation:
   - Outlined (2px Accent Alert, #F87171), text Accent Alert, transparent
     fill so it's secondary in visual weight, 32px label "Send help now".
   - Small outline phone icon to the left.
   - Tapping immediately escalates without waiting for the timer.

4. Bottom-center, 16px Text Muted: "If you need help and can't move, just
   stay where you are — your family will be told in 20 seconds." (This is
   the dignity message — the system protects you even if you can do nothing.)

5. Privacy lockup pill in the very top-right corner stays visible —
   "🔒 Processed on this device" — reassures even mid-emergency.

Tabular numerals only on the countdown. The numeral pulses once per second
on the tick (1s ease-out scale 1.0 → 1.04 → 1.0). Reduced-motion users see a
static numeral that updates without animation. NO red flashing background, NO
strobing — that violates calm-tech principles and risks panic in elderly
users with cognitive impairment.

Do NOT include: a video preview of the resident, a confidence percentage from
the model, agent reasoning text, or any technical diagnostics. The resident
must NEVER see the camera feed of themselves on the floor. That's a dignity
violation the field has converged against (SafelyYou, Nobi).
```

### Prompt 1C — Notified state (after escalation has been sent)

```
[paste SHARED DESIGN SYSTEM block above]

Generate Soteria — Companion Display, "Notified" state. Same tablet, shown
after the verification timer expires (or "Send help now" was tapped) and the
trusted contact has been alerted.

Vibe: reassuring, not victorious. The person on screen has just had something
go wrong; the message is "you are not alone."

Page Structure:

1. Top-center, small (18px Text Muted): "Soteria check-in"

2. Center hero, vertically centered:
   - A single soft heart-with-pulse outline icon, 96px, Accent OK.
   - Below, 40px regular Soteria Cream: "Your family has been told."
   - Below, 28px Text Muted: "Sarah was notified at 9:42 AM."
     (use the trusted-contact's first name and the actual time).
   - Below, 24px Text Muted: "Stay where you are if you can't move. Help is
     on the way."

3. A single large pill button, 360px × 96px, centered, Soteria Sand bg, Text
   Primary, 28px label "I'm OK now" — tapping returns to Calm state and
   sends a follow-up "Margaret says she's OK" message to the trusted contact.
   Small outline check icon to the left.

4. Below the button, a small status line, 16px Text Muted, with three dots
   in sequence:
   "● Detected   ● Family told   ○ Awaiting Sarah's reply"
   Filled dots Accent OK, hollow dot Text Muted. Updates live to filled when
   the contact acknowledges via the Guardian app (Surface 2).

5. Privacy lockup pill top-right as always.

Do NOT include: a list of who else was contacted, the verbatim alert text,
or any "share more details" controls. The resident does not manage the
escalation — that's the guardian's job.
```

---

# SURFACE 2 — GUARDIAN CONSOLE

What the *trusted contact* (B2C — adult child, neighbour) and the *property
security operator* (B2B — building front desk, residence security) see. Same
data, same brand, two viewports.

The guardian's primary job is to **acknowledge or escalate** an alert from a
resident. Secondary job: peace-of-mind glance at the resident's status when
nothing is wrong (the "is mum OK?" check). Reference: Aloe Care Health's
caregiver app (Care Circle), SafelyYou Discover (event-based, never live
video unless an event fires). The privacy claim is *visual*, not just
architectural: the operator NEVER sees raw video unless the agent has
confirmed an event — by default they see a privacy-preserving silhouette.

Generate the four screens below in order.

### Prompt 2A — B2C mobile, Calm state (one resident, no active alert)

```
[paste SHARED DESIGN SYSTEM block above]

Generate Soteria — Guardian app (B2C mobile), "Calm" state. iPhone-class
portrait, single resident view ("Margaret, 78, Mum").

Vibe: peace-of-mind glance. Less data than a typical caregiver app — explicitly
positioned against alert fatigue. Inspired by Aloe Care's Care Circle but
restrained (no sensor charts, no air-quality dials — we don't have those).
Soteria Ink background.

Page Structure:

1. Top app bar:
   - Left: small back chevron + text "All residents" (only present in B2B mode;
     hidden in B2C single-resident mode).
   - Center: "Margaret" 18px Text Primary, beneath it 12px Text Muted: "Mum".
   - Right: privacy lockup pill — "🔒 Self-hosted — never sent to a third-party AI".

2. Hero status card (full-width, 24px corner radius, Soteria Panel):
   - A LARGE Accent OK dot (16px) and 24px label "All quiet" Text Primary.
   - Below, 16px Text Muted: "Last activity 3 minutes ago" with a small
     outline walk icon.
   - Below, a soft horizontal divider (Soteria Line).
   - Bottom of card, 14px Text Muted, two lines:
     "Last fall check: 2 days ago — false alarm, all OK."
     "Margaret is probably watching TV in the lounge."
     (The agent writes a single calm plain-language sentence — never raw
     model output.)

3. "Care circle" row (under the hero card):
   - Section label, 12px Text Muted uppercase: "CARE CIRCLE".
   - Horizontal scroll of round 56px avatars with first names below
     ("You", "Tom"). A green dot on avatars who are reachable.
   - 40px-tall pill at the end "Invite someone" with a + icon, dashed 1px
     Line border.

4. Quiet "talk to Margaret" card, full-width:
   - 20px Text Primary "Say hi to Margaret", 14px Text Muted beneath
     "Sends a friendly message to her companion display."
   - Right side: a small pill button "Send" (Accent OK).
   - Below the input, the last 2 messages from her display in a tiny chat-row
     style — "I'm OK now — 2d ago". This proves the system is two-way.

5. Bottom tab bar (B2C mobile only): three tabs — Home (filled), Timeline,
   Settings. Use icons + labels.

Do NOT include: a live camera tile (privacy violation by default), heart-rate
or vitals (we don't measure them), or a "call 911" button (the system NEVER
auto-calls emergency services — only escalation to trusted contacts).
```

### Prompt 2B — B2C mobile, Active alert state (verification countdown in progress)

```
[paste SHARED DESIGN SYSTEM block above]

Generate Soteria — Guardian app (B2C mobile), "Active alert" state. The
guardian's screen takes over the moment the agent starts the verification
timer — analogous to a phone-call interface in priority/visual weight.

Vibe: urgent but not panicked. Loud enough to wake someone; calm enough that
they can think.

Page Structure:

1. Top: Accent Alert (#F87171) thin status strip, 4px, full width. Above it,
   a normal-weight title "Possible fall — Margaret" (20px Text Primary).
   Below, 14px Text Muted, the LIVE elapsed timer "Detected 4 seconds ago".

2. Hero block, full-width Soteria Panel card with 1px Accent Alert border:
   - At the top, a privacy-preserving pose silhouette frame: a 16:9 box
     containing ONLY a YOLO-pose stick-figure skeleton (white lines on
     #0F1216 background) overlaid on a heavily blurred / abstracted scene.
     NO photographic detail. A tiny label beneath: "Privacy view —
     skeleton only, raw video stays on the device."
     A subtle "Show full video" link (12px Text Muted, underlined) gated
     behind a hold-to-confirm — the guardian must consciously opt in.

   - Below the silhouette, the agent's one-sentence reasoning in plain
     English (20px Text Primary):
     "I saw Margaret go to the floor in the lounge and she hasn't moved."
     (This is the agent's `summary`, not raw chain-of-thought. NEVER show
     model tokens or temperatures or tool-call JSON to a guardian.)

3. The countdown, dominant element:
   - Centered tabular numeral, 96px Accent Caution (#F5C26B), counting down.
     "00:14"
   - Below it, 16px Text Muted: "Margaret has 14 seconds to say she's OK
     before we escalate to you."
   - A thin progress bar beneath, depleting left-to-right, Accent Caution.

4. Two large primary actions, full-width pill buttons stacked, 64px tall each:

   PRIMARY (top): "I'm responding — call Margaret now"
   - Accent Alert background, white text, phone icon, 20px label.
   - Tapping ends the countdown on the resident's display ("Sarah is
     calling…") and opens the device's dialer to her number.

   SECONDARY (bottom): "Acknowledge — I'm aware"
   - Outlined Accent OK, transparent fill.
   - Tapping silences the alert on this device but keeps the timer running.
     (For when the guardian is reading the alert but can't yet act.)

5. Below, a thin row of three smaller pill buttons (8px gap):
   - "Mark false alarm" (Text Muted outlined)
   - "Forward to Tom" (Text Muted outlined, opens Care Circle picker)
   - "View timeline" (Text Muted outlined, opens 2D below)

6. Bottom-most: 14px Text Muted line — "If you can't act, Tom will be paged
   in 60 seconds." This is the tiered escalation contract, made visible.

Do NOT include: model confidence percentages, raw agent transcript, generic
"Open camera" buttons, or one-tap 911. The "Show full video" link must require
hold-to-confirm — privacy by default.
```

### Prompt 2C — B2C mobile, Timeline tab

```
[paste SHARED DESIGN SYSTEM block above]

Generate Soteria — Guardian app (B2C mobile), "Timeline" tab. A scroll of
events for one resident. Reference: SafelyYou Discover — event-based, every
row is reviewable, never a continuous log.

Page Structure:

1. Header: "Margaret — Last 7 days" (20px), small filter chip row beneath:
   "All", "Falls", "Check-ins", "Activity" (pills, current selected has
   Soteria Sand fill on dark — the inverse highlight).

2. Day-grouped feed of event cards, newest first. Each card is full-width,
   16px corner radius, Soteria Panel, 16px padding, with:
   - Left edge: a 4px-wide colored bar — Accent OK / Accent Caution / Accent
     Alert depending on event severity.
   - Top row: small outline icon (24px) + 14px Text Muted timestamp.
   - 16px Text Primary one-line plain-language summary, e.g.:
     "False alarm — I thought Margaret had fallen but she stood right back up."
     "Margaret pressed the help button. Resolved by Tom in 47s."
     "Quiet evening — last activity at 21:14."
   - Bottom row: thin 12px Text Muted metadata "Verified locally · No video
     was sent" and, on the right, a small "Review" link.

3. Group dividers between days: 12px Text Muted uppercase "TODAY", "YESTERDAY",
   "WED 4 JUNE".

4. At the bottom of every list, a single 14px Text Muted disclosure card:
   "Soteria keeps event clips on Margaret's device for 14 days, then deletes
   them. You can ask her to share a clip if you want to review one." (This
   makes the data-retention contract visible to the guardian.)

Do NOT include: heatmaps, analytics charts, "trends", "wellness scores", or
any synthetic health metric. We have one signal: events. Don't fake more.
```

### Prompt 2D — B2B desktop, Multi-resident operations dashboard

```
[paste SHARED DESIGN SYSTEM block above]

Generate Soteria — Guardian Console (B2B desktop), "Operations" view. 1440px
wide, three-column layout. For a residence / building security operator
watching many residents at once. Reference: SafelyYou Discover for the event-
list pattern, generic SOC dashboards for the alert-routes-to-focus behavior,
but RESTRAINED — no charts, no KPIs, no marketing-style hero numbers. The
operator's job is to triage events.

Vibe: serious operations console, but humane — the units are people, not
servers. Soteria Ink background, lots of negative space.

Page Structure:

1. Top header bar (full width, 64px):
   - Left: Soteria wordmark, then breadcrumb "Hartland House · Floor 2".
   - Center: a global status pill "12 quiet · 1 checking · 0 escalated"
     (each segment colored with its accent: OK / Caution / Alert) — this is
     the building's at-a-glance vital sign.
   - Right: privacy lockup pill, then operator avatar.

2. LEFT column (320px) — Resident roster, vertical list, each row 72px:
   - Small avatar / initial circle (40px) on the left.
   - Resident first name + apartment number (16px Text Primary).
   - Status microcopy beneath (12px Text Muted) — "Quiet · 3m ago" / "Asleep"
     / "Active alert — needs response".
   - A 4px-wide colored bar pinned to the left edge of each row matching
     status (OK / Caution / Alert).
   - Active-alert rows pulse subtly (1s ease, ONLY the bar's opacity 0.6→1)
     and float to the top of the list. Selected row has Soteria Panel fill.

3. CENTER column (flex, ~720px) — The focus pane. When no alert is active,
   shows the selected resident's calm card (mirrors prompt 2A's hero block
   but desktop-sized). When ANY resident has an active alert, this pane
   AUTO-PROMOTES that resident to focus regardless of the operator's prior
   selection (the SOC "active incident takes the room" pattern). Same content
   as prompt 2B's alert state, scaled to desktop:
   - Privacy-preserving silhouette frame on top (16:9, max ~640×360).
   - Agent's one-line reasoning beneath.
   - Big tabular countdown (120px) + progress bar.
   - Action buttons in a row: "Call resident" (Accent Alert, primary),
     "Mark false alarm" (outlined), "Escalate to nurse" (outlined).

4. RIGHT column (360px) — Live event feed across ALL residents. Same card
   pattern as prompt 2C's timeline, but truncated to one line per event and
   scoped to the current building. A small filter row at top: "Last hour /
   24h / 7 days" pills.

5. Bottom strip (full width, 48px, fixed): a single thin row showing
   - Left: "All processing on-prem · 0 frames sent off-device" with a
     green dot. (The privacy claim, made operational and provable.)
   - Right: a small pill button "Privacy audit log" that opens a side sheet
     listing every outbound network call (which will be ONLY the Telegram /
     Twilio alert posts).

Do NOT include: a live multi-camera grid (this is the single biggest privacy
mistake competitors make — Soteria's differentiator is that the operator
sees pose silhouettes by default and only sees raw video for a confirmed
event, with consent). NO heart-rate widgets, weather, social feeds, or
unrelated dashboards. NO vendor logos or stock photography.

Keyboard / power-user affordances:
- "/" focuses the resident search.
- "1-9" selects the corresponding resident in the roster.
- "A" acknowledges the active alert.
- "E" opens escalate dialog.
Show these in a small "?" keyboard-help affordance bottom-right.
```

---

## Sequencing tip

Generate in this order, copy-pasting the **Shared Design System** block at the
top of each:

1. **1A Calm** → establishes the resident vibe and the design system.
2. **2A Calm mobile** → establishes the guardian vibe.
3. **1B Check-in** → the dramatic resident state.
4. **2B Active alert mobile** → the dramatic guardian state. (Pair with 1B
   in mind so the two screens feel like the same moment from two angles.)
5. **1C Notified** → resident reassurance.
6. **2C Timeline** → guardian post-event review.
7. **2D Desktop ops** → B2B viewport, last because it's the most complex.

After generating each screen, edit-iterate one change at a time per Stitch
guidance — bigger edits cause more regressions.

---

💡 **Tip:** For multi-screen consistency Stitch recommends a `DESIGN.md`. The
**Shared Design System** block above can be used to seed one via the
`design-md` skill — that locks the tokens for all subsequent generations.
