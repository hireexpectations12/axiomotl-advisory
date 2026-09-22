# Axiomotl conversational website

Open `index.html`, or use the project-root `axiomotl-typeform-mockup.html` for a single portable file. All fonts, the supplied logo, CSS and JavaScript are local; the portable version embeds them. Rebuild using `python typeform-mockup/build.py` from the project root.

The visual reference is [Typeform's marketing website](https://www.typeform.com/), inspected on 14 September 2026. This is Axiomotl's own implementation and content, with an editorial serif headline, plum, apricot, ivory and lavender surfaces, and a conversational service explorer. It is not a Typeform integration and needs no Typeform account.

The three-question journey branches by challenge, asks for context and then asks how the visitor would like to work. The recommendation follows the challenge, unless the visitor chooses embedded support; that preference explicitly suggests Embedded Principal BA Advisory. It is framed as a starting conversation, not a formal assessment.

Selection requires Continue; A-D choose an answer, arrows/Home/End navigate choices, and Enter continues. Back, Edit answers and Start again are available. Closing preserves answers in page memory and restores focus; refreshing clears them. Changing the challenge clears the dependent context answer. A native dialog contains focus and supports Escape.

The result offers optional context, an editable email draft and a plain-text summary download. Nothing is sent automatically. There is no backend, analytics, storage or network transfer of responses. Services and direct email links remain available without taking the journey, including when JavaScript is disabled.

GSAP 3.15.0 drives question transitions with reduced-motion support and explicit motion controls. The library remains under its included license notice. Manrope is reused from existing local Google Fonts assets; Newsreader is sourced from Google Fonts. Font OFL licenses are in `assets/`. The supplied logo is displayed in monochrome through CSS. No Typeform brand assets, client metrics or testimonials are used.

Source and exported scripts, links and assets are checked statically. Interactive verification is performed in the local HTTP preview; this environment's browser policy does not allow direct file-URL automation.
