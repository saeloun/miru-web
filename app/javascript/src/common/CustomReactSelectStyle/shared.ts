export const selectPalette = {
  background: "hsl(var(--background))",
  menuBackground: "hsl(var(--popover))",
  border: "hsl(var(--input))",
  focus: "hsl(var(--ring))",
  text: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
  subtle: "hsl(var(--muted-foreground) / 0.9)",
  optionText: "hsl(var(--foreground))",
  optionTextMuted: "hsl(var(--foreground) / 0.8)",
  optionHover: "hsl(var(--accent))",
  optionSelected: "hsl(var(--secondary))",
  destructive: "hsl(var(--destructive))",
};

export const getSelectControlStyles = (
  provided,
  {
    borderColor = selectPalette.border,
    isFocused = false,
    isError = false,
  }: { borderColor?: string; isFocused?: boolean; isError?: boolean } = {}
) => ({
  ...provided,
  backgroundColor: selectPalette.background,
  minHeight: 48,
  padding: "0",
  border: `1px solid ${borderColor}`,
  borderColor,
  boxShadow: isFocused
    ? `0 0 0 2px ${
        isError ? "hsl(var(--destructive) / 0.24)" : "hsl(var(--ring) / 0.3)"
      }`
    : "0 1px 2px hsl(var(--foreground) / 0.05)",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  fontWeight: 500,
});

export const getSelectMenuStyles = (
  provided,
  {
    fontSize,
    letterSpacing = "normal",
    zIndex = 50,
  }: { fontSize?: string; letterSpacing?: string; zIndex?: number } = {}
) => ({
  ...provided,
  ...(fontSize ? { fontSize } : {}),
  letterSpacing,
  zIndex,
  backgroundColor: selectPalette.menuBackground,
  border: `1px solid ${selectPalette.border}`,
  boxShadow: "0 12px 32px hsl(var(--foreground) / 0.18)",
  overflow: "hidden",
});
