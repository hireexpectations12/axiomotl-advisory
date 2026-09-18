"use client";
import type { SiteSettings, SiteLink } from "../lib/types";
import { Field, Textarea } from "./OwnerUI";

export default function SiteSettingsEditor({
  settings: s,
  onChange,
}: {
  settings: SiteSettings;
  onChange: (settings: SiteSettings) => void;
}) {
  const business = s.business || {
    phone: "",
    address: "",
    hours: "",
    socialLinks: [],
  };
  const seo = s.seo || { title: "", description: "", socialImage: "" };
  const announcement = s.announcement || {
    enabled: false,
    text: "",
    url: "",
    expiresAt: "",
  };
  const footer = s.footer || { text: "", links: [] };
  const contact = s.contact || {
    recipient: s.email,
    confirmation: "Thank you for your enquiry. We will be in touch.",
    showFields: true,
  };
  const set = (patch: Partial<SiteSettings>) => onChange({ ...s, ...patch });
  return (
    <div className="site-settings settings-sections">
      <p>
        Changes save to the shared draft. Use Preview, then Publish to update
        the website.
      </p>
      <section className="settings-panel">
        <h2>Business details</h2>
        <p>
          The email updates existing contact links. Additional details appear in
          the footer when supplied.
        </p>
        <div className="field-grid">
          <Field
            label="Site name"
            value={s.name}
            onChange={(e) => set({ name: e.target.value })}
          />
          <Field
            label="Contact email"
            type="email"
            value={s.email}
            onChange={(e) => set({ email: e.target.value })}
          />
          <Field
            label="Phone number"
            type="tel"
            value={business.phone}
            onChange={(e) =>
              set({ business: { ...business, phone: e.target.value } })
            }
          />
          <Textarea
            label="Business address"
            rows={3}
            value={business.address}
            onChange={(e) =>
              set({ business: { ...business, address: e.target.value } })
            }
          />
          <Textarea
            label="Opening hours"
            rows={3}
            value={business.hours}
            onChange={(e) =>
              set({ business: { ...business, hours: e.target.value } })
            }
          />
        </div>
        <h3>Social links</h3>
        {business.socialLinks.map((link, index) => (
          <div className="settings-link-row" key={index}>
            <Field
              label={`Social link ${index + 1} label`}
              value={link.label}
              onChange={(e) =>
                set({
                  business: {
                    ...business,
                    socialLinks: business.socialLinks.map((l, i) =>
                      i === index ? { ...l, label: e.target.value } : l,
                    ),
                  },
                })
              }
            />
            <Field
              label={`Social link ${index + 1} URL`}
              value={link.url}
              onChange={(e) =>
                set({
                  business: {
                    ...business,
                    socialLinks: business.socialLinks.map((l, i) =>
                      i === index ? { ...l, url: e.target.value } : l,
                    ),
                  },
                })
              }
            />
            <button
              onClick={() =>
                set({
                  business: {
                    ...business,
                    socialLinks: business.socialLinks.filter(
                      (_, i) => i !== index,
                    ),
                  },
                })
              }
            >
              Remove social link {index + 1}
            </button>
          </div>
        ))}
        <button
          disabled={business.socialLinks.length >= 12}
          onClick={() =>
            set({
              business: {
                ...business,
                socialLinks: [
                  ...business.socialLinks,
                  { label: "Social profile", url: "" },
                ],
              },
            })
          }
        >
          Add social link
        </button>
      </section>
      <section className="settings-panel">
        <h2>Branding</h2>
        <p>
          Upload an image in Media, copy its URL, then paste it here. Check the
          logo against both light and dark backgrounds in Preview.
        </p>
        <div className="field-grid">
          <Field
            label="Logo URL"
            value={s.logo}
            onChange={(e) => set({ logo: e.target.value })}
          />
          <Field
            label="Favicon URL"
            value={s.favicon}
            help="The small icon shown in a browser tab."
            onChange={(e) => set({ favicon: e.target.value })}
          />
          <Field
            label="Font family"
            value={s.font}
            onChange={(e) => set({ font: e.target.value })}
          />
          {(
            [
              ["background", "Background colour"],
              ["foreground", "Text colour"],
              ["accent", "Accent colour"],
              ["headingAccent", "Heading last word"],
              ["heroAccent", "Hero last word"],
            ] as const
          ).map(([key, label]) => (
            <Field
              key={key}
              type="color"
              label={label}
              value={s[key] || (key === "heroAccent" ? "#B794D6" : "#7A2C82")}
              onChange={(e) => set({ [key]: e.target.value })}
            />
          ))}
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={s.motion}
            onChange={(e) => set({ motion: e.target.checked })}
          />
          Enable supported page animations (respects reduced-motion preferences)
        </label>
      </section>
      <section className="settings-panel">
        <h2>Search and sharing defaults</h2>
        <p>
          Used when the matching field in Page settings is empty. Existing page
          values take priority. Search engines may display different wording.
        </p>
        <div className="field-grid">
          <Field
            label="Default search title"
            value={seo.title}
            onChange={(e) => set({ seo: { ...seo, title: e.target.value } })}
          />
          <Field
            label="Default social image URL"
            value={seo.socialImage}
            onChange={(e) =>
              set({ seo: { ...seo, socialImage: e.target.value } })
            }
          />
          <Textarea
            label="Default search description"
            rows={3}
            value={seo.description}
            onChange={(e) =>
              set({ seo: { ...seo, description: e.target.value } })
            }
          />
        </div>
        <h3>Default search preview</h3>
        <p>
          <strong>{seo.title || s.name}</strong>
          <br />
          {seo.description || "Add a short description of the business."}
        </p>
      </section>
      <section className="settings-panel">
        <h2>Announcement banner</h2>
        <p>
          A short message below the header. The expiry uses UTC; it disappears
          automatically after that time on the next page load.
        </p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={announcement.enabled}
            onChange={(e) =>
              set({
                announcement: { ...announcement, enabled: e.target.checked },
              })
            }
          />
          Show announcement
        </label>
        <div className="field-grid">
          <Field
            label="Announcement text"
            maxLength={500}
            value={announcement.text}
            onChange={(e) =>
              set({ announcement: { ...announcement, text: e.target.value } })
            }
          />
          <Field
            label="Announcement link (optional)"
            value={announcement.url}
            onChange={(e) =>
              set({ announcement: { ...announcement, url: e.target.value } })
            }
          />
          <Field
            label="Announcement expiry (UTC, optional)"
            type="datetime-local"
            value={announcement.expiresAt.slice(0, 16)}
            onChange={(e) =>
              set({
                announcement: {
                  ...announcement,
                  expiresAt: e.target.value
                    ? new Date(`${e.target.value}Z`).toISOString()
                    : "",
                },
              })
            }
          />
        </div>
      </section>
      <section className="settings-panel">
        <h2>Navigation and footer</h2>
        <p>
          Menu links replace the desktop and mobile menus together. Leave the
          original menu in use to keep editing it on the page canvas.
        </p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={Boolean(s.navigation)}
            onChange={(e) =>
              set({
                navigation: e.target.checked
                  ? [
                      { label: "Home", url: "/" },
                      { label: "Contact", url: "/#contact" },
                    ]
                  : undefined,
              })
            }
          />
          Manage navigation here
        </label>
        {s.navigation && (
          <LinkEditor
            label="Menu"
            links={s.navigation}
            onChange={(navigation) => set({ navigation })}
            minimum={1}
          />
        )}
        <Textarea
          label="Additional footer text"
          rows={3}
          value={footer.text}
          onChange={(e) => set({ footer: { ...footer, text: e.target.value } })}
        />
        <LinkEditor
          label="Footer"
          links={footer.links}
          onChange={(links) => set({ footer: { ...footer, links } })}
        />
      </section>
      <section className="settings-panel">
        <h2>Contact delivery</h2>
        <p>
          Email delivery configuration is on hold. These recipient and
          confirmation values prepare for future activation. Online submission
          remains disabled; no emails are sent.
        </p>
        <div className="field-grid">
          <Field
            label="Future enquiry recipient"
            type="email"
            value={contact.recipient}
            onChange={(e) =>
              set({ contact: { ...contact, recipient: e.target.value } })
            }
          />
          <Textarea
            label="Future confirmation message"
            rows={3}
            value={contact.confirmation}
            onChange={(e) =>
              set({ contact: { ...contact, confirmation: e.target.value } })
            }
          />
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={contact.showFields}
            onChange={(e) =>
              set({ contact: { ...contact, showFields: e.target.checked } })
            }
          />
          Show the inactive enquiry fields (the email link remains available)
        </label>
      </section>
      <details className="settings-panel">
        <summary>Advanced styles</summary>
        <p>
          Global styles affect every page. Preview changes at different screen
          sizes.
        </p>
        <Textarea
          label="Global CSS"
          className="code-input"
          rows={14}
          value={s.customCss}
          onChange={(e) => set({ customCss: e.target.value })}
        />
      </details>
    </div>
  );
}

function LinkEditor({
  label,
  links,
  onChange,
  minimum = 0,
}: {
  label: string;
  links: SiteLink[];
  onChange: (links: SiteLink[]) => void;
  minimum?: number;
}) {
  return (
    <div>
      {links.map((link, index) => (
        <div className="settings-link-row" key={index}>
          <Field
            label={`${label} ${index + 1} label`}
            value={link.label}
            onChange={(e) =>
              onChange(
                links.map((l, i) =>
                  i === index ? { ...l, label: e.target.value } : l,
                ),
              )
            }
          />
          <Field
            label={`${label} ${index + 1} URL`}
            value={link.url}
            onChange={(e) =>
              onChange(
                links.map((l, i) =>
                  i === index ? { ...l, url: e.target.value } : l,
                ),
              )
            }
          />
          <div className="actions">
            <button
              disabled={index === 0}
              onClick={() => {
                const next = [...links];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                onChange(next);
              }}
            >
              Move {label.toLowerCase()} {index + 1} up
            </button>
            <button
              disabled={links.length <= minimum}
              onClick={() => onChange(links.filter((_, i) => i !== index))}
            >
              Remove {label.toLowerCase()} {index + 1}
            </button>
          </div>
        </div>
      ))}
      <button
        disabled={links.length >= 12}
        onClick={() => onChange([...links, { label: "New link", url: "/" }])}
      >
        Add {label.toLowerCase()} link
      </button>
    </div>
  );
}
