const unmapper = input => {
  const { reports, filterOptions, pagy, groupByTotalDuration } = input;

  return {
    reports,
    filterOptions,
    pagy,
    groupByTotalDuration,
  };
};

const filteredReportUnmapper = input => {
  const { clients, summary, currency } = input;

  return { clients, summary, currency };
};

export { unmapper, filteredReportUnmapper };
