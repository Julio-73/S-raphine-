const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setError(
  form: HTMLFormElement,
  name: string,
  message: string
): void {
  const slot = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
  if (slot) slot.textContent = message;

  const input = form.elements.namedItem(name);
  if (input instanceof HTMLElement) {
    input.closest(".field")?.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
  }
}

function clearError(form: HTMLFormElement, name: string): void {
  const slot = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
  if (slot) slot.textContent = "";

  const input = form.elements.namedItem(name);
  if (input instanceof HTMLElement) {
    input.closest(".field")?.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
  }
}

export function initForms(): void {
  const form = document.querySelector<HTMLFormElement>("[data-form]");
  const success = document.querySelector<HTMLElement>("[data-form-success]");

  if (form) {
    const fields = ["nombre", "email", "privacidad"];

    fields.forEach((name) => {
      const input = form.elements.namedItem(name);
      if (!(input instanceof HTMLElement)) return;
      input.addEventListener("input", () => clearError(form, name));
      input.addEventListener("change", () => clearError(form, name));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      fields.forEach((name) => clearError(form, name));

      const nameInput = form.elements.namedItem("nombre");
      const emailInput = form.elements.namedItem("email");
      const privacyInput = form.elements.namedItem("privacidad");

      const name =
        nameInput instanceof HTMLInputElement ? nameInput.value.trim() : "";
      const email =
        emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";
      const privacy =
        privacyInput instanceof HTMLInputElement ? privacyInput.checked : false;

      let firstInvalid: HTMLElement | null = null;

      if (name.length < 2) {
        setError(form, "nombre", "Indíquenos su nombre, por favor.");
        firstInvalid = nameInput as HTMLElement;
      }

      if (!EMAIL.test(email)) {
        setError(form, "email", "Introduzca un correo electrónico válido.");
        firstInvalid ??= emailInput as HTMLElement;
      }

      if (!privacy) {
        setError(
          form,
          "privacidad",
          "Es necesario aceptar la política de privacidad."
        );
        firstInvalid ??= privacyInput as HTMLElement;
      }

      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: false });
        return;
      }

      if (success) {
        success.textContent = `Gracias, ${name.split(" ")[0]}. Su solicitud ha sido registrada. Nuestro atelier se pondrá en contacto con usted en las próximas 48 horas.`;
      }

      form.classList.add("is-sent");
      form.setAttribute("aria-busy", "false");
    });
  }

  const newsletter = document.querySelector<HTMLFormElement>("[data-newsletter]");
  const message = document.querySelector<HTMLElement>("[data-newsletter-msg]");

  newsletter?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = newsletter.elements.namedItem("email");
    const value = input instanceof HTMLInputElement ? input.value.trim() : "";

    if (!EMAIL.test(value)) {
      if (message) {
        message.textContent = "Introduzca un correo electrónico válido.";
        message.style.color = "#f0b6a6";
      }
      return;
    }

    if (message) {
      message.style.removeProperty("color");
      message.textContent = "Gracias. Recibirá nuestras notas al inicio de cada estación.";
    }
    newsletter.reset();
  });
}
