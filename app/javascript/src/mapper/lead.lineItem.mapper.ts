const getList = (input) => input.line_item_details.map((item) => ({
  id: item.id,
  name: item.name,
  kind: item.kind,
  description: item.description,
  number_of_resource: item.number_of_resource,
  resource_expertise_level: item.resource_expertise_level,
  price: item.price,
  kind_name: item.kind_name
}));

const unmapLeadLineItemList = (input) => {
  const { data } = input;
  return {
    itemList: getList(data)
  };
};

const unmapLeadLineItemListForDropdown = (input) => {
  const leadLineItemList = input.data.line_item_details;
  return leadLineItemList.map(item => ({
    label: item.name,
    value: item.id
  }));
};

const unmapLeadLineItemDetails = (input) => {
  const { data } = input;
  return {
    leadDetails: {
      id: data.line_item_details.id,
      name: data.line_item_details.name,
      kind: data.line_item_details.kind,
      description: data.line_item_details.description,
      number_of_resource: data.line_item_details.number_of_resource,
      resource_expertise_level: data.line_item_details.resource_expertise_level,
      price: data.line_item_details.price,
      kind_name: data.line_item_details.kind_name
    }
  };
};

export {
  unmapLeadLineItemList,
  unmapLeadLineItemDetails,
  unmapLeadLineItemListForDropdown
};
