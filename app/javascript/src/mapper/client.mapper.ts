const getClientList = input =>
  input.client_details.map(client => ({
    email: client.email,
    id: client.id,
    address: client.address,
    phone: client.phone,
    minutes: client.minutes_spent,
    name: client.name,
    logo: client.logo,
    currency: client.currency,
  }));

const unmapClientList = input => {
  const { data } = input;

  return {
    clientList: getClientList(data),
    totalMinutes: data.total_minutes,
    overdueOutstandingAmount: data.overdue_outstanding_amount,
  };
};

const mapProjectDetails = input =>
  input.map(project => ({
    id: project.id,
    name: project.name,
    minutes: project.minutes_spent,
    team: project.team,
  }));

const unmapClientListForDropdown = input => {
  const clientList = input.data.client_details;

  return clientList.map(item => ({
    label: item.name,
    value: item.id,
  }));
};

const unmapClientInvoices = input => {
  const clientInvoices = input.data.invoices;

  return clientInvoices.map(item => ({
    id: item.id,
    amount: item.amount,
    dueDate: item.dueDate,
    status: item.status,
    invoiceNumber: item.invoiceNumber,
    issueDate: item.issueDate,
    company: item.company,
    externalViewKey: item.externalViewKey,
  }));
};

const unmapClientDetails = input => {
  const { data } = input;

  return {
    clientDetails: {
      id: data.client_details.id,
      name: data.client_details.name,
      email: data.client_details.email,
      phone: data.client_details.phone || "--",
      address: data.client_details.address || "--",
      logo: data.client_details.logo,
      currency: data.client_details.currency,
      client_currency: data.client_details.client_currency,
      clientMembersEmails: data.client_members_emails,
      invitations: data.invitations,
    },
    overdueOutstandingAmount: data.overdue_outstanding_amount,
    totalMinutes: data.total_minutes,
    projectDetails: mapProjectDetails(data.project_details),
  };
};

export {
  unmapClientList,
  unmapClientDetails,
  unmapClientListForDropdown,
  unmapClientInvoices,
};
