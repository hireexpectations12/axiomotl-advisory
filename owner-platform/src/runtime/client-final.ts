export function initialiseClientFinal(email: string) {
  const root = document.querySelector("[data-client-final]");
  if (!root) return;
  const sizeReference = () => {
    document.documentElement.style.setProperty(
      "--final-viewport",
      `${document.documentElement.clientWidth}px`,
    );
  };
  sizeReference();
  let viewportWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (viewportWidth === window.innerWidth) return;
    viewportWidth = window.innerWidth;
    sizeReference();
  });
  const form = root.querySelector<HTMLElement>(".final-contact-form");
  const submit = form?.querySelector<HTMLButtonElement>("button");
  const feedback = root.querySelector<HTMLElement>(".contact-feedback");
  if (submit) submit.disabled = false;
  const prepareEnquiry = () => {
    if (!form || !feedback) return;
    const fields = [
      ...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ];
    if (fields.some((field) => !field.reportValidity())) return;
    const values = Object.fromEntries(
      fields.map((field) => [field.name, field.value.trim()]),
    );
    const body = `Hello Axiomotl,\n\n${values.message}\n\n${values.name}\n${values.email}`;
    const draft = document.createElement("a");
    draft.href = `mailto:${email}?subject=${encodeURIComponent("Axiomotl project enquiry")}&body=${encodeURIComponent(body)}`;
    draft.textContent = "Open your email draft";
    feedback.replaceChildren(
      "Your enquiry is ready to review and send in your email application. ",
      draft,
    );
    feedback.hidden = false;
    draft.click();
  };
  submit?.addEventListener("click", prepareEnquiry);
  form?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      prepareEnquiry();
    }
  });
  const privacy = root.querySelector<HTMLDialogElement>(".privacy-dialog");
  root
    .querySelector(".privacy-trigger")
    ?.addEventListener("click", () => privacy?.showModal());
  root
    .querySelector(".privacy-close")
    ?.addEventListener("click", () => privacy?.close());
}
