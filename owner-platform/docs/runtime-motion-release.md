# Kevin Murphy site motion release

This branch reconciles owner-platform with the source recovered from Vercel deployment dpl_4hf8CZqrz1FNcwxMgTsGgvYm4yYj. That deployed revision was newer than the repository laptop-handoff branch. Assets, page sources and runtime files are preserved before adding Lenis and React Bits SplitText.

Target project: axiomotl-kevin-murphy, team hire-expectations-projects. Use SITE_VARIANT=revision. Do not deploy this release to the separate axiomotl-advisory project.

Changes: desktop Lenis scrolling with native scrolling below 761px and for touch/reduced-motion modes; short word entrances on public hero headings; original heading nodes and accessible labels preserved when motion is off; dialogs and mobile menus suspend smooth scrolling; Approach hero eager/high-priority loading with reserved image space.

Verification: node scripts/verify-motion.mjs, npm run typecheck, npm run build. Browser regressions cover desktop, mobile, reduced motion, textarea scrolling, anchor navigation, modal blocking and heading restoration. All four public pages were checked in the deployed preview. Production is rebuilt rather than promoting the preview, preserving production indexing rules.

React Bits component source: https://reactbits.dev/r/SplitText-TS-CSS.json
