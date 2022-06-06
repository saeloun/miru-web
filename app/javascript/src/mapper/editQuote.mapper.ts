const getList = (input) => input.quote_details.lead_line_items.map((item) => ({
  id: item.id,
  name: item.name,
  kind: item.kind,
  description: item.description,
  number_of_resource: item.number_of_resource,
  resource_expertise_level: item.resource_expertise_level,
  price: item.price,
  kind_name: item.kind_name
}));

const unmapQuoteLineItemList = (input) => {
  const { data } = input;
  return {
    itemList: getList(data)
  };
};

export {
  unmapQuoteLineItemList
};
