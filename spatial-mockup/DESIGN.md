---
name: Axiomotl Spatial
description: Sculpted Ice surfaces and Oxford Blue controls for Axiomotl's advisory mockup.
colors:
  oxford: "#002147"
  ice: "#ecf2f7"
  white: "#ffffff"
  text-soft: "#4b637b"
  line: "rgba(0, 33, 71, .13)"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(54px, 5.65vw, 84px)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(30px, 3.2vw, 45px)"
    fontWeight: 500
    lineHeight: 1.22
    letterSpacing: "-.035em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 700
rounded:
  surface: "16px"
  pill: "30px"
  circle: "50%"
spacing:
  tight: "8px"
  compact: "12px"
  medium: "18px"
  content: "24px"
  generous: "30px"
components:
  button-primary:
    backgroundColor: "{colors.oxford}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "15px 22px"
  text-link:
    textColor: "{colors.oxford}"
  circle-button:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.oxford}"
    rounded: "{rounded.circle}"
    size: "34px"
  circle-button-hover:
    backgroundColor: "{colors.white}"
  raised-surface:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.oxford}"
    rounded: "{rounded.surface}"
  stage-selected:
    backgroundColor: "{colors.oxford}"
    textColor: "{colors.white}"
    rounded: "{rounded.circle}"
---

# Design System: Axiomotl Spatial

## Overview

**Creative North Star: "Clarity in every dimension"**

This record describes the built spatial mockup in `spatial-mockup/` and its standalone export, `axiomotl-spatial-mockup.html`. The user's explicit white, Oxford Blue and Ice neumorphic direction is the visual authority. The copper and midnight-cyan files are historical alternatives.

Broad Ice fields carry sculpted controls, recessed beds and elevated circular forms. Oxford Blue gives text, selected controls and the contrasting principle panel a clear visual weight. The supplied logo remains monochrome. Depth is tactile and structural; interaction makes the method explorable while retaining ordinary links and native disclosures.

**Key Characteristics:**

- Ice surfaces with paired light and Oxford Blue shadows.
- Sora headings with Manrope reading and control text.
- Circular controls and softly rounded content panels.
- Responsive depth with explicit motion control and keyboard access.

## Colors

The palette stays within the user's blue-and-Ice material world. Frontmatter values are normative.

### Primary

- **Oxford Blue** (`oxford`) anchors headings, body emphasis, actions, selected method controls and the principle panel.

### Neutral

- **Ice** (`ice`) is the page and raised-surface ground; depth separates surfaces of the same color.
- **White** (`white`) supplies highlights and text on Oxford Blue.
- **Soft Blue** (`text-soft`) carries explanatory copy and secondary labels.
- **Oxford divider** (`line`) separates practice areas, services and the footer without adding another hue.

**The Material Palette Rule.** Use white and blue tonal variation for lighting and depth; keep selected and primary actions recognisably Oxford Blue.

## Typography

Sora gives headings a rounded geometric structure. Manrope keeps explanatory text and controls compact. Both use local font files with `font-display: swap` and a sans-serif fallback; the implementation includes Sora weights 400–600 and Manrope weights 400–800.

The frontmatter records the main hierarchy. Section headings scale fluidly; the principle statement uses a lighter Sora weight (400). Service summaries use Sora (19px on desktop), while paragraph styles vary by context (typically 12–15px) around the body base. Control labels use sentence case and heavier Manrope weights. The small decorative counts and auxiliary hints are specific to this mockup and do not establish a reusable text scale.

## Layout

The desktop container caps at 1280px with 56px side gutters. The hero pairs copy with a larger explorer column; service and background sections use two columns. Broad section spacing gives the compact content room to breathe. The spacing entries capture recurring values, not a rigid mathematical scale.

At 1100px, side gutters become 36px and the composition tightens. At 850px, the hero and main content sections stack, the explorer caps at 570px, the practice strip becomes two columns, and the navigation pill hides while the contact action remains available. At 520px, gutters become 20px, hero actions stack, the explorer uses a front-facing pose, and the contact section stacks. A 1450px enhancement increases hero breathing room. Exact source behavior remains in `spatial-mockup/styles.css`.

## Elevation & Depth

The shadows are the requested neumorphic material: cool lower-right shade paired with white upper-left light. Raised panels use the reusable lift; circular controls use the smaller lift; navigation and the engraved emblem use the inset treatment. The explorer combines a recessed bed, raised ring and elevated core, with translucent blue shading and a white highlight. Exact reusable shadows and motion values live in `.impeccable/design.json`.

**The Depth Has State Rule.** Selected controls change to Oxford Blue, pressed controls can recess, and hover lifts a control; depth supports a visible state rather than carrying selection alone.

Motion uses local GSAP 3.15.0. The explorer enters once, stage changes animate briefly, and fine-pointer movement adjusts perspective. There are no perpetual loops. The Motion control removes explorer movement; the operating system's reduced-motion preference takes precedence and also suppresses CSS transitions and smooth scrolling. Content updates remain available when GSAP is absent.

## Shapes

Content panels use the surface radius; main actions use the pill radius. Circular buttons, orbital elements and contact controls provide the recurring silhouette. Borders are reserved for quiet dividers and accessibility feedback. Icons are inline stroked SVG, with rounded caps and joins. A visible Oxford Blue focus outline distinguishes keyboard focus; forced-colors rules retain control boundaries and selected-state feedback.

## Components

### Actions and navigation

The primary action is an Oxford Blue pill with white text and a directional SVG. Hover raises it; active press lowers it. Text links use a short directional icon movement. Circular previous/next controls lighten on hover and recess on press. The desktop navigation rests in a recessed pill; hovered or focused links lift from the bed.

### Raised panels

Ice panels use a soft surface radius and paired shadows. The method output panel places text beside previous/next controls. The Oxford Blue principle panel uses the same soft rectangular language at a larger scale, with pale text and a recessed circular symbol.

### Method explorer

Five native buttons form a tablist: Analyse, Design, Decide, Transition and Sustain. Selecting a stage updates its material, core icon and name, count, and output text; motion also rotates the orbit segment. Only the selected tab is in the tab order. Arrow keys move and select with wraparound; Home and End reach the first and last stage. Previous/next controls also wrap. The output is a labelled, focusable tabpanel with a polite live region. Decorative geometry is hidden from assistive technology.

### Service disclosures

Four native `details`/`summary` disclosures use divider lines and raised circular plus controls. Opening a service changes its control to Oxford Blue and rotates the plus. The first service starts open; disclosures remain independently operable. Each service ends with a real email action. There are no input fields, dialogs or application forms in this mockup.

## Do's and Don'ts

### Do:

- **Do** preserve the white, Oxford Blue and Ice material world and supplied monochrome logo.
- **Do** pair shadow depth with explicit color and focus states.
- **Do** keep stage exploration usable through keyboard controls and with motion disabled.
- **Do** use native links and service disclosures for the existing interactions.

### Don't:

- **Don't** import the historical copper or midnight-cyan palette into this spatial world.
- **Don't** turn the explorer into a timed carousel or make pointer movement necessary to read its content.
- **Don't** treat the mockup's smallest decorative labels as a default type scale for future content.
