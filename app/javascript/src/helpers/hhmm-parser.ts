export const minutesFromHHMM = (d: string) => {
  const numD = Number(d);
  if (d.includes(":")) {
    const [h, m] = d.split(":");
    return Number(h) * 60 + Number(m);
  } else if (numD > 0) {
    return numD * 60;
  } else {
    return 0;
  }
};

export const minutesToHHMM = (t: number) => {
  if (Number.isNaN(t) || t <= 0) {
    return "00:00";
  } else {
    let h = (t / 60).toString().split(".")[0];
    let m = (t % 60).toString();
    if (h.length === 1) h = `0${h}`;
    if (m.length === 1) m = `0${m}`;
    return `${h}:${m}`;
  }
};
