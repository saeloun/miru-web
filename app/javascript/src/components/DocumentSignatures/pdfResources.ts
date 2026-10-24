const resources = new Map(
  Object.entries(
    import.meta.glob<string>(
      "../../../../../node_modules/pdfjs-dist/{cmaps/*,standard_fonts/*,wasm/*,LICENSE}",
      { eager: true, query: "?url", import: "default", exhaustive: true }
    )
  ).map(([path, url]) => [path.split("/").pop(), url])
);

export class PdfResources {
  async fetch({ filename }: { filename: string }) {
    const url = resources.get(filename);
    if (!url) throw new Error("PDF rendering resource unavailable");
    const response = await window.fetch(url);
    if (!response.ok) throw new Error("PDF rendering resource unavailable");

    return new Uint8Array(await response.arrayBuffer());
  }
}
