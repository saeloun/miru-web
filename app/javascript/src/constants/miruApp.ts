export const miruApp = {
  url: `https://miru-desktop://authorization?token=${document
    .querySelector('[name="csrf-token"]')
    .getAttribute("content")}`,
};
