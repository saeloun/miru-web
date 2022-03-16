export const minutesFromHHMM = (d: string) => {
  if (!d) return "";
  const [h, m] = d.split(":");
  if (!h || !m) return 0;
  return Number(h) * 60 + Number(m);
};

export const minutesToHHMM = (t: number) => {
  if (isNaN(t)) return "00:00";
  let h = (t / 60).toString().split(".")[0];
  let m = (t % 60).toString();
  if (h.length === 1) h = `0${h}`;
  if (m.length === 1) m = `0${m}`;
  return `${h}:${m}`;
};
