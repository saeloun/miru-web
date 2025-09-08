export const miruApp = {
  url: `miru-desktop://authorization?token=${
    document.querySelector('[name="csrf-token"]')?.getAttribute("content") || ""
  }`,
};
