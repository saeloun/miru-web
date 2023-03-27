const unmapper = input => {
  const { reports, filterOptions, pagy } = input;

  return {
    reports,
    filterOptions,
    pagy,
  };
};

export { unmapper };
