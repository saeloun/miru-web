export const validateTimesheetEntry = (
  tse: object,
  client?: string,
  projectId?: number
) => {
  if (tse["duration"] <= 0 || tse["duration"] >= 6000000) {
    return "Please enter a valid duration";
  }

  if (!client) {
    return "Please select the client";
  }

  if (!projectId) {
    return "Please select the project";
  }

  if (!tse["note"]) {
    return "Please add notes";
  }

  return "";
};
