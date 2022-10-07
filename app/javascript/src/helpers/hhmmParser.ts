export const minFromHHMM = (duration: string) => {
  const numberDuration = Number(duration);
  if (duration.includes(":")) {
    let [h, m] = duration.split(":");
    if (m.length > 2) {
      m = m.slice(0, 2);
    }
    return Number(h) * 60 + Number(m);
  } else if (numberDuration > 0) {
    return numberDuration * 60;
  } else {
    return 0;
  }
};

export const minToHHMM = (duration: number) => {
  if (Number.isNaN(duration) || duration <= 0) {
    return "00:00";
  } else {
    let hours = (duration / 60).toString().split(".")[0];
    let minutes = (duration % 60).toString();
    if (hours.length === 1) hours = `0${hours}`;
    if (minutes.length === 1) minutes = `0${minutes}`;
    return `${hours}:${minutes}`;
  }
};
