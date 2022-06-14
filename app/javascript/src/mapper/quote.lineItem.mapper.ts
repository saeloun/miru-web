const getList = (input) => input.quote_details.quote_line_items.map((item) => ({
  id: item.id,
  name: item.name,
  comment: item.comment,
  description: item.description,
  number_of_resource: item.number_of_resource,
  resource_expertise_level: item.resource_expertise_level,
  estimated_hours: item.estimated_hours,
  lead_line_item_id: item.lead_line_item_id,
  lead_quote_id: item.lead_quote_id,
  _destroy: item._destroy || false
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
