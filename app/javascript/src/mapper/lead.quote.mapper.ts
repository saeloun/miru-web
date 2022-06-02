const getList = (input) => input.quote_details.map((item) => ({
  id: item.id,
  name: item.name,
  description: item.description
}));

const unmapLeadQuoteList = (input) => {
  const { data } = input;
  return {
    itemList: getList(data)
  };
};

const unmapLeadQuoteListForDropdown = (input) => {
  const leadQuoteList = input.data.quote_details;
  return leadQuoteList.map(item => ({
    label: item.name,
    value: item.id
  }));
};

const unmapLeadQuoteDetails = (input) => {
  const { data } = input;
  return {
    leadDetails: {
      id: data.quote_details.id,
      name: data.quote_details.name,
      description: data.quote_details.description
    }
  };
};

export {
  unmapLeadQuoteList,
  unmapLeadQuoteDetails,
  unmapLeadQuoteListForDropdown
};
