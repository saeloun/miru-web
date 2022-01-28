export function minutesFromHHMM(d: string) {
  if (!d) return "";
  const [h, m] = d.split(":");
  if (!h || !m) return 0;
  return Number(h) * 60 + Number(m);
}

export function minutesToHHMM(t: number) {
  if (isNaN(t)) return "00:00";
  const h = t / 60;
  const m = t % 60;
  return `${h}:${m}`;
}
