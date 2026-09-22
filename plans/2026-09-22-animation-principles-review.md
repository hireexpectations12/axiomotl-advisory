# Axiomotl: 12 Principles of Animation review

Skill: https://www.ui-skills.com/skills/raphaelsalaja/12-principles-of-animation/llms.txt
Reviewed: 22 September 2026. No implementation or publication changes made.

## Scope and evidence

Reviewed the current public motion sources: `owner-platform/src/runtime/hero.ts`, `page-motion.ts`, `forms.tsx`, and `owner-platform/public/runtime/site.js`, together with the form and public composition styles. Read `owner-platform/DESIGN.md` for the current motion decisions. Checked published homepage HTML and the delivered forms bundle against the source: the live page has an interactive hero, three signal dots, three arc paths, the analysis section and three method steps. Its script order is GSAP, site.js, then forms.js. The unpublished scrollcraft/advisory alternative and older wave/sculpture components are not evidence about the current public page.

This is a source-based motion review. It does not establish perceived prominence, smoothness, frame rate or the visual effect of competing animations. The previous four improvements remain in their separate reviewed branch.

## Findings

- `owner-platform/public/runtime/site.js:320` — **[physics-active-state]** Press feedback is attached to a one-time snapshot of existing header/main buttons. `owner-platform/src/runtime/forms.tsx:23` subsequently mounts React form controls; later screens and dialog controls are also dynamic. The public form CSS has no equivalent pressed scale, and the published generic active rule only resets vertical translation. These controls therefore have no reliable matching press feedback. Add a native scoped pressed state for public form controls, reusing the existing 0.97 scale and 90 ms response from `site.js:282`, gated by the site motion setting and OS preference. Keep the documented fixed geometry of workflow cards intact. Confidence: high source evidence; verify with pointer and keyboard on dynamically mounted questions.

- `owner-platform/src/runtime/hero.ts:198` — **[easing-no-linear-motion]** The decorative artwork light sweep uses `ease: "none"`; the same rule departure appears in the active signal and arc loops at lines 224 and 240. These are decorative motion, not progress indicators. For the bounded artwork sweep, try `sine.inOut` so it accelerates and settles at the offscreen ends. Keep the signal/arc loops as a separate design decision: constant speed can be appropriate for continuous circuitry, and mechanically easing every loop can create conspicuous stalls. Confidence: high for rule departure, not a demonstrated usability defect.

- `owner-platform/src/runtime/page-motion.ts:155` — **[physics-no-excessive-stagger]** Method lights are offset by 750 ms per item, exceeding the skill's 50 ms stagger rule. This is an ambient repeating phase offset, not a delay before a user action completes. If the intended effect is a grouped response, use at most 50 ms between items; if it is a slow progression through the method, retain an explicitly designed sequence instead of treating this as an entrance stagger. Confidence: high for numeric departure; low urgency and no automatic recommendation to compress the sequence.

## Summary

| Rule | Finding groups | Severity |
|---|---:|---|
| physics-active-state | 1 | Medium |
| easing-no-linear-motion | 1, covering three active tween definitions | Low — design review |
| physics-no-excessive-stagger | 1 | Low — ambient phase offset |

## Checks that passed or do not establish a finding

- **timing-under-300ms:** Existing button hover 200 ms, press 90 ms, directional cues 180 ms, disclosure entrance 220 ms and workflow brightness hover 300 ms are within the limit. The 500 ms page-load headline and multi-second ambient loops are not delayed user-initiated responses.
- **timing-consistent:** Shared button feedback uses the same settings. Different durations for a disclosure and a directional cue are different interaction types, not a proven inconsistency.
- **timing-no-entrance-context-menu:** No active custom context-menu entrance found.
- **easing-entrance-ease-out / easing-exit-ease-in:** Interactive entrances use power2.out. Reversing these tweens gives the corresponding accelerating return. Native dialog closing is immediate; it is not a wrongly eased exit.
- **easing-natural-decay:** No relevant audio gain or natural-decay envelope found.
- **physics-subtle-deformation:** Existing press scale 0.97 is within the 0.95–1.05 range. Decorative glow growth is not interactive squash/stretch. The older 0.92 method-glyph entrance is not mounted on the checked public homepage and is excluded.
- **physics-spring-for-overshoot:** No active interaction requires a bounce/overshoot. Do not add springs solely to demonstrate this principle.
- **staging-one-focal-point:** Multiple ambient sources exist, but perceived competition needs rendered observation. No unsupported visual verdict is made.
- **staging-dim-background:** The native journey dialog has a dimmed backdrop.
- **staging-z-index-hierarchy:** The dialog uses the browser top layer; the artwork light has explicit layering. No proven overlap failure from source alone.
- **Motion preferences:** Hero and page motion include OS reduced-motion handling, the site motion toggle and background/offscreen pausing. Preserve those controls in any refinement.

## Recommended first change

Give dynamically mounted form controls the same restrained press feedback as existing buttons. This is a concrete interaction-consistency improvement; the two ambient-motion departures should be visually evaluated before changing their pacing. Preserve the purple/teal identity and avoid adding bounce, stagger or new continuous animation merely to satisfy a checklist.
