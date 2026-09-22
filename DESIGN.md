---
name: Axiomotl — Better questions. Clearer decisions.
description: A calm editorial website with a focused conversational advisory journey.
colors:
  plum: "#2D2532"
  ink: "#332B37"
  paper: "#FAF8F5"
  apricot: "#F5BE9C"
  peach: "#F8E1D2"
  lavender: "#E5DFEE"
  muted: "#695E6D"
  line: "#D4CCD6"
  white: "#FFFFFF"
typography:
  display: { fontFamily: "Newsreader, Georgia, serif", fontSize: "clamp(54px, 6.1vw, 86px)", fontWeight: 400, lineHeight: 1.04, letterSpacing: "-.025em" }
  headline: { fontFamily: "Newsreader, Georgia, serif", fontSize: "clamp(38px, 4.2vw, 58px)", fontWeight: 400, lineHeight: 1.04, letterSpacing: "-.025em" }
  question: { fontFamily: "Manrope, sans-serif", fontSize: "clamp(29px, 3vw, 38px)", fontWeight: 400, lineHeight: 1.25, letterSpacing: "-.025em" }
  body: { fontFamily: "Manrope, sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: 1.65 }
  label: { fontFamily: "Manrope, sans-serif", fontSize: "13px", fontWeight: 600, lineHeight: 1.4 }
rounded:
  button: "10px"
  preview: "18px"
  preview-mobile: "14px"
  choice: "7px"
  keycap: "3px"
spacing:
  gutter: "clamp(24px, 5vw, 80px)"
  section: "110px"
  section-tablet: "90px"
  section-mobile: "67px"
  choice-gap: "8px"
components:
  button-primary: { backgroundColor: "{colors.apricot}", textColor: "{colors.plum}", rounded: "{rounded.button}", padding: "15px 23px", typography: "{typography.label}" }
  button-primary-hover: { backgroundColor: "{colors.peach}" }
  button-dark: { backgroundColor: "{colors.plum}", textColor: "{colors.paper}", rounded: "{rounded.button}", padding: "15px 23px", typography: "{typography.label}" }
  question-preview: { backgroundColor: "{colors.peach}", textColor: "{colors.ink}", rounded: "{rounded.preview}", padding: "43px 48px" }
  context-field: { textColor: "{colors.plum}", rounded: "{rounded.choice}", padding: "13px", width: "100%" }
---

# Design System: Axiomotl

## Overview

**Creative North Star: "The considered conversation"**

Warm editorial typography and broad, quiet surfaces give visitors room to understand the advisory offer. The first question connects the website to a focused conversation, with restrained controls and a clear pace.

This world applies to `typeform-mockup/` and `axiomotl-typeform-mockup.html`. Previous alternatives remain separate; their visual decisions do not redefine this system.

**Key Characteristics:**

- Editorial serif headlines with practical sans-serif controls.
- Deep plum, warm paper and soft apricot, peach and lavender surfaces.
- One question at a time, explicit actions and reversible choices.

## Colors

Deep plum anchors the opening and about sections; warm paper supports reading and the dialog. Apricot highlights headline fragments and primary actions, peach holds the first-question preview, and lavender groups method and answer-summary content.

Ink carries text on light backgrounds. Muted plum supports secondary copy, the line token separates service rows and results, and white remains a supporting neutral. Preserve these assignments when extending the current surfaces.

## Typography

Newsreader (400), with Georgia and serif fallbacks, gives display and section headings their editorial character. Locally hosted Manrope (400, 600 and 800), with sans-serif fallback, carries body copy and UI; regular and semibold weights do most of the work.

The frontmatter records desktop roles. At the 760px breakpoint the hero uses a 49–66px clamp; at 440px it uses a 43–54px clamp. Section headings become 43px and then 38px. Question headings use Manrope, becoming 32px and then 28px; result headings return to Newsreader.

**The Reading Role Rule.** Use the serif for editorial statements and the sans-serif for questions, choices and actions.

## Layout

The page container stops at 1440px and uses the fluid gutter token. Broad section spacing, a centered hero and a two-column first-question preview establish the rhythm. The preview overlaps the hero boundary by 65px.

At 1050px, spacing and column gaps tighten. At 760px, primary navigation hides, the preview and about content stack, and method items become rows. At 440px, service content stacks and method descriptions move below their titles.

The native dialog fills the viewport, with a sticky top bar, progress track and a centered body capped at 840px. Mobile padding keeps questions, choices and bottom actions usable without horizontal clipping.

## Elevation & Depth

There are no shadows. Tonal section changes, fine dividers and the first-question overlap establish depth. The dialog uses an opaque surface and backdrop; hierarchy comes from spacing, typography and state.

## Shapes

Buttons use gently rounded rectangles; the preview has a larger corner radius, reduced on narrow screens. Choices and text fields share modest rounding. Fine outlined keycaps and small circular status marks support the interface without becoming decorative motifs.

## Components

**Buttons:** Apricot or plum fills carry primary actions. Standard buttons have a 54px minimum height; hover moves them upward by 2px with a 0.2s transition. Visible keyboard focus uses a 3px current-color outline with a 5px offset. Disabled controls lower opacity and retain clear state.

**First question and choices:** The peach preview presents the actual opening question. Dialog choices use lavender-tinted fills, an outlined keycap and a selected check; selection strengthens the border without changing overall dimensions. A–D, arrows, Home, End and Enter support keyboard use.

**Service rows and navigation:** Native disclosure rows keep service information available independently of the journey. The header uses compact sans-serif links and an outlined action; mobile retains the brand and primary action.

**Dialog and result:** Three explicit question steps lead to a service suggestion. Back, edit and restart remain available; changing the challenge clears its dependent context answer. All four service suggestions were verified, and an embedded-support preference explains its override.

**Focus and motion:** Native dialog behavior supports Escape, opener-focus restoration and modal interaction. Keyboard focus may cross the browser-chrome boundary before returning inside; this is not a manual strict focus trap. GSAP question transitions use 0.45s, `expo.out` and 22px vertical travel. Motion off and OS reduced motion settle animation; there is no parallax.

**Context and sharing:** The optional context field has a quiet border and visible focus. Answers live only in page memory. Email draft and text download are the available handoffs; no backend, persistent storage or network transfer of answers is implemented.

## Do's and Don'ts

- **Do** preserve the serif editorial voice and sans-serif question hierarchy.
- **Do** retain explicit selection, Continue, reversible answers and visible keyboard focus.
- **Do** keep reduced motion fully functional and service information available outside the journey.
- **Do** rebuild the portable export with `typeform-mockup/build.py`, which embeds runtime CSS, assets and scripts; source and export must share the same primitives.
- **Don't** add shadows, decorative parallax or timed carousels to this visual world.
- **Don't** describe recommendations as assessments or promises, or describe an email draft as a sent message.
- **Don't** treat prior alternatives as the token authority for these two current surfaces.
