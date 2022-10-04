export const validateTimesheetEntry = (tse: object) => {
  if (tse["duration"] <= 0 || tse["duration"] >= (3600 * 24)) {
    return "Please enter a valid duration";
  }
  return "";
};
