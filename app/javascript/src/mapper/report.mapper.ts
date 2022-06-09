const unmapper = (input) => {
  const {
    reports,
    filterOptions
  } = input;
  return {
    reports,
    filterOptions
  };
};

export {
  unmapper
};
