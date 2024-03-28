const unmapper = input => {
  const { reports, filterOptions, pagy } = input;

  return {
    reports,
    filterOptions,
    pagy,
  };
};

const filteredReportUnmapper = input => {
  const { clients, summary, currency } = input;

  return { clients, summary, currency };
};

export { unmapper, filteredReportUnmapper };
