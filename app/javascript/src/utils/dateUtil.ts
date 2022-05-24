const month = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const getDayWithSuffix = (day) => {
  switch (day) {
    case 1: case 21: case 31: {
      return `${day}st`;
    }
    case 2: case 22: {
      return `${day}nd`;
    }
    case 3: case 23: {
      return `${day}rd`;
    }
    default: {
      return `${day}th`;
    }
  }
};

export {
  month,
  getDayWithSuffix
};
