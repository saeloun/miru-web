const AccountsAgingReportContext = {
  selectedFilter: {
    clients: [],
  },
  filterCounter: 0,
  clientList: [],
  currency: "",
  summary: {
    zero_to_thirty_days: 0,
    thirty_one_to_sixty_days: 0,
    sixty_one_to_ninety_days: 0,
    ninety_plus_days: 0,
    total: 0,
  },
};

export default AccountsAgingReportContext;
