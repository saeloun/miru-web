const getList = (input) => input.line_item_details.map((item) => ({
  id: item.id,
  name: item.name,
  kind: item.kind,
  description: item.description,
  number_of_resource: item.number_of_resource,
  resource_expertise_level: item.resource_expertise_level,
  price: item.price,
}));

const unmapLeadLineItemList = (input) => {
  const { data } = input;
  return {
    itemList: getList(data)
  };
};

const unmapLeadListForDropdown = (input) => {
  const leadList = input.data.line_item_details;
  return leadList.map(item => ({
    label: item.name,
    value: item.id
  }));
};

const unmapLeadDetails = (input) => {
  const { data } = input;
  return {
    leadDetails: {
      id: data.lead_details.id,
      name: data.lead_details.name,
      budget_amount: data.lead_details.budget_amount,
      budget_status_code: data.lead_details.budget_status_code,
      industry_code: data.lead_details.industry_code,
      quality_code: data.lead_details.quality_code,
      state_code: data.lead_details.state_code,
      status_code: data.lead_details.status_code
    }
  };
};

export {
  unmapLeadLineItemList,
  unmapLeadDetails,
  unmapLeadListForDropdown
};
