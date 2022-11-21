export const validateTimesheetEntry = (tse: object) => {
  if (tse["duration"] <= 0 || tse["duration"] >= 6000000) {
    return "Please enter a valid duration";
  }
  return "";
};
