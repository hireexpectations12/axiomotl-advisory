---
name: Axiomotl Flat / Parallax
description: A bold, flat decision workshop for Axiomotl Advisory.
colors:
  yellow: "#F2FF5A"
  blue: "#2145F5"
  red: "#F45138"
  ink: "#171717"
  paper: "#F6F5EF"
  white: "#FFFFFF"
  line: "#C8C8C0"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(54px, 5.9vw, 92px)"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(38px, 4.1vw, 60px)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-.04em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(27px, 2.6vw, 38px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-.025em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 600
rounded:
  square: "0px"
  circle: "50%"
spacing:
  page: "clamp(24px, 4.5vw, 72px)"
  small: "12px"
  group: "24px"
  block: "36px"
  section: "110px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
    padding: "15px 23px"
  button-primary-hover:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
  method-panel:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
  selected-tab:
    textColor: "{colors.yellow}"
    rounded: "{rounded.square}"
---

# Design System: Axiomotl Flat / Parallax

## Overview

The current world is a flat decision workshop: scattered evidence becomes a connected path. The latest user request authorises bold colours, flat design and interactive parallax. This record applies to `flat-mockup/` and the standalone `axiomotl-flat-mockup.html`.

The earlier spatial system is preserved in `spatial-mockup/DESIGN.md`. Its source, export and the copper and midnight/cyan alternatives remain separate. PRODUCT.md owns business truth; the new look does not change service or practitioner claims.

The opening proposition is "Untangle it. Move forward." The five pieces make the Analyse, Design, Decide, Transition and Sustain method tangible. This is a marketing surface with a working demonstration, not a client dashboard.

## Colors

Yellow carries the opening workspace; blue supplies emphasis, the moving statement band and the method panel. Red holds the forward arrow and final contact section. Paper provides quiet reading space, with ink for text and the contrasting method section. White appears on blue controls and panels.

Primitive values are defined above and implemented in `flat-mockup/styles.css` at `:root`. That CSS is the runtime owner. `flat-mockup/build.py` embeds the same stylesheet into the standalone export. Keep both source and export in sync by rebuilding after changes.

Checked foreground/background pairs exceed 5:1 for the primary body and control text combinations. The supplied logo receives a monochrome CSS treatment, retaining its original shape.

## Typography

Manrope 400, 600 and 800 is hosted locally. Heavy display text and restrained supporting copy establish hierarchy without decorative letter spacing or extra typefaces.

The hero uses the display token on wide screens, 50-66px at compact desktop, 52-70px on stacked layouts and 42-52px on phones. Contact display text caps at 96px and becomes 38-47px on phones. Section headings range from 37px to 60px by context and breakpoint.

Reading text is 14-19px in primary passages, with a 21-23px about introduction. Service headings are 19-28px. Controls and supporting labels use 10-14px; the smallest values are supporting demo labels, not a default reading-text size. Display tracking never falls below -.04em.

## Layout

A maximum 1600px content width uses fluid page gutters. Desktop pairs the hero copy with its interactive diagram, followed by a horizontal statement band, open service rows, a split method section, the practice introduction and a full-width red contact close.

Breakpoints are 1100px for compact desktop, 800px for stacked layout, 480px for phones and 1600px for wide spacing. The hero stacks below 800px. Method tabs become horizontal at that breakpoint; the panel stacks internally on phones. Services use native disclosures instead of a grid of equal cards.

Section spacing is 110px, reduced to 85px and then 65px. Native document scrolling owns the page. Nothing is pinned, scroll-jacked or automatically advanced. Stable method-panel text areas limit layout shifts when selecting stages.

## Elevation & Depth

There are no shadows, gradients or simulated surface relief. Layering comes from flat colour, overlap and independent transform motion. The large red disc and geometric method artwork are deliberately two-dimensional.

GSAP 3.15.0 handles alignment and interaction. ScrollTrigger moves hero layers, the statement band and method artwork at different rates. Fine-pointer input uses bounded quickTo transforms on separate wrappers. Wrapper hit testing passes through to the actual piece buttons.

The alignment transition is .85 seconds with expo.out easing. Stage copy responds in .35 seconds, geometric bars in .5 seconds, and pointer response in .6 seconds. The motion switch and operating-system reduced-motion setting remove ambient motion and animated transitions while keeping controls functional.

## Shapes

Buttons, method panels and process pieces have square corners. Circles are reserved for the hero disc, method geometry and range thumb. One-pixel rules separate content; the selected mobile tab uses a three-pixel bottom underline. There are no rounded content cards.

The SVG icon vocabulary uses simple consistent strokes. The hero's five numbered pieces refer to real method order, not fabricated performance values.

## Components

The primary action is an ink rectangle with white text, a directional arrow and a blue hover state. Text links use an offset underline. Focus-visible outlines are three pixels with six-pixel offsets; the hero pieces use ink outlines against yellow.

The hero range continuously interpolates the five pieces between scatter and alignment. Align the pieces reverses to Scatter again at the endpoint. Each piece selects its method stage and updates the nearby live explanation.

Method tabs share one panel, use roving keyboard focus and support arrows, Home and End. The Next stage control wraps. Tabs switch their declared orientation to match the responsive layout. Selected state uses colour, an arrow on desktop and an underline on mobile.

Services are native details/summary disclosures with service-specific email links. Contact opens an email draft to the supplied address. There is no submission backend. A no-JavaScript fallback preserves service content, the five method descriptions and contact.

## Do's and Don'ts

- Keep the flat yellow, blue, red, paper and ink world consistent.
- Preserve native scrolling, visible keyboard focus and meaningful motion-off behaviour.
- Use the five-stage process to explain real advisory outputs.
- Keep the original logo and supplied business facts intact.
- Rebuild the standalone HTML from the editable source after changes.
- Do not import the spatial alternative's shadows, Ice surfaces or circular control system.
- Do not add client metrics, testimonials, qualifications or delivery promises without evidence.
- Do not make pointer movement or animation necessary to understand the services.
