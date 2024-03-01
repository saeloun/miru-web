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
  "Dec",
];

const getDayWithSuffix = day => {
  switch (day) {
    case 1:
    case 21:
    case 31: {
      return `${day}st`;
    }
    case 2:
    case 22: {
      return `${day}nd`;
    }
    case 3:
    case 23: {
      return `${day}rd`;
    }
    default: {
      return `${day}th`;
    }
  }
};

const quarters = {
  1: {
    months: ["Jan", "Feb", "Mar"],
    startDay: "1st Jan",
    endDay: "31st Mar",
  },
  2: {
    months: ["Apr", "May", "Jun"],
    startDay: "1st Apr",
    endDay: "30th Jun",
  },
  3: {
    months: ["Jul", "Aug", "Sep"],
    startDay: "1st Jul",
    endDay: "30th Sep",
  },
  4: {
    months: ["Oct", "Nov", "Dec"],
    startDay: "1st Oct",
    endDay: "31st Dec",
  },
};

export { month, getDayWithSuffix, quarters };
