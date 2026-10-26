/* global HTMLFormElement, HTMLTemplateElement */
const form = document.querySelector<HTMLFormElement>("#planning-form");

if (form) {
  const status = document.querySelector<HTMLElement>("#planning-status")!;
  const error = document.querySelector<HTMLElement>("#planning-error")!;
  const currency = form.dataset.currency!;
  let revision = 0;
  let timer: ReturnType<typeof setTimeout>;

  const format = (value: string | null, kind = "currency") => {
    if (value === null || value === undefined) return "N/A";
    const number = Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return kind === "currency"
      ? `${currency} ${number}`
      : `${number}${kind === "percent" ? "%" : ""}`;
  };

  const preview = async (currentRevision: number) => {
    status.textContent = "Recalculating…";
    const data = new FormData(form);
    data.delete("_method");
    try {
      const response = await fetch(form.dataset.previewUrl!, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      if (currentRevision !== revision) return;
      const result = await response.json();
      if (currentRevision !== revision) return;

      if (!response.ok) {
        throw new Error(result.error || "Unable to calculate this plan");
      }
      error.hidden = true;
      document.querySelectorAll<HTMLElement>("[data-summary]").forEach(node => {
        node.textContent = format(
          result.summary[node.dataset.summary!],
          node.dataset.format
        );
      });

      document.querySelectorAll<HTMLElement>("[data-total]").forEach(node => {
        node.textContent = format(result.totals[node.dataset.total!]);
      });

      form
        .querySelectorAll<HTMLElement>("[data-person-row]")
        .forEach((row, index) => {
          const person = result.people[index];
          row.querySelector("[data-person-revenue]")!.textContent = format(
            person.revenue
          );

          row.querySelector("[data-person-margin]")!.textContent = format(
            person.margin
          );

          row.querySelector("[data-person-flags]")!.textContent =
            person.flags.join("; ");
        });

      document.querySelector<HTMLElement>("#planning-incomplete")!.hidden =
        !result.incomplete;
      const months = document.querySelector("#planning-months")!;
      months.replaceChildren();
      result.months.forEach((month: Record<string, string | null>) => {
        const row = document.createElement("tr");
        [
          month.month,
          ...["revenue", "cost", "margin", "closing_cash"].map(key =>
            format(month[key])
          ),
        ].forEach(value => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.append(cell);
        });
        months.append(row);
      });
      status.textContent = "Preview updated — save to keep changes";
    } catch (failure) {
      if (currentRevision !== revision) return;
      error.textContent =
        failure instanceof Error ? failure.message : "Unable to update preview";
      error.hidden = false;
      document
        .querySelectorAll<HTMLElement>(
          "[data-summary], [data-total], [data-person-revenue], [data-person-margin]"
        )
        .forEach(node => {
          node.textContent = "N/A";
        });
      document.querySelector("#planning-months")!.replaceChildren();
      status.textContent =
        "Preview out of date — fix inputs or retry. Your edits are still here.";
    }
  };

  const schedulePreview = () => {
    revision += 1;
    clearTimeout(timer);
    const currentRevision = revision;
    status.textContent = "Unsaved changes — updating preview…";
    timer = setTimeout(() => void preview(currentRevision), 350);
  };

  form.addEventListener("input", schedulePreview);
  form.addEventListener("click", event => {
    const target = (event.target as Element).closest("button");
    if (!target) return;

    if (target.hasAttribute("data-remove-row")) {
      target.closest("[data-person-row], [data-overhead-row]")?.remove();
      schedulePreview();
    }

    const section = target.hasAttribute("data-add-person")
      ? "person"
      : target.hasAttribute("data-add-overhead")
      ? "overhead"
      : null;
    if (section) {
      const template = document.querySelector<HTMLTemplateElement>(
        `#planning-${section}-template`
      )!;

      const container = document.querySelector(
        section === "person" ? "#planning-people" : "#planning-overheads"
      )!;
      container.append(template.content.cloneNode(true));
      container.lastElementChild
        ?.querySelector<HTMLInputElement>("input")
        ?.focus();
      schedulePreview();
    }

    if (target.hasAttribute("data-recalculate")) {
      revision += 1;
      clearTimeout(timer);
      void preview(revision);
    }
  });
}
