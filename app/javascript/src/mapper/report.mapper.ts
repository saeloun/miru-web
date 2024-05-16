const unmapper = input => {
  const { reports, filterOptions, pagy, groupByTotalDuration } = input;

  return {
    reports,
    filterOptions,
    pagy,
    groupByTotalDuration,
  };
};

export { unmapper };
