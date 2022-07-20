const calculateTotalHours = (reports) => {
  let totalBilledHours = 0;
  let totalUnbilledHours = 0;
  let totalNonbillableHours = 0;

  reports.map(report => {
    const { totalBilledHoursInProject, totalUnbilledHoursInProject, totalNonbillableHoursInProject } = calculateTotalHoursInProject(report.entries);

    totalBilledHours += totalBilledHoursInProject;
    totalUnbilledHours += totalUnbilledHoursInProject;
    totalNonbillableHours += totalNonbillableHoursInProject;
  });

  return {
    totalBilledHours: timeFormatter(totalBilledHours), totalUnbilledHours: timeFormatter(totalUnbilledHours), totalNonbillableHours: timeFormatter(totalNonbillableHours)
  };
};

const timeFormatter = (timeInMins) => Math.floor(timeInMins / 60) + ":" + timeInMins % 60;

const calculateTotalHoursInProject = (entries) => {
  let totalBilledHoursInProject = 0;
  let totalUnbilledHoursInProject = 0;
  let totalNonbillableHoursInProject = 0;

  entries.map(entry => {
    switch (entry.billStatus) {
      case "unbilled":
        totalUnbilledHoursInProject += entry.duration;
        break;
      case "billed":
        totalBilledHoursInProject += entry.duration;
        break;
      case "non_billable":
        totalNonbillableHoursInProject += entry.duration;
        break;
    }
  });

  return {
    totalBilledHoursInProject: totalBilledHoursInProject,
    totalUnbilledHoursInProject: totalUnbilledHoursInProject,
    totalNonbillableHoursInProject: totalNonbillableHoursInProject
  };
};

export { calculateTotalHours, calculateTotalHoursInProject,timeFormatter };
