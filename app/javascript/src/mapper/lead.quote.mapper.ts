const getList = (input) => input.quote_details.map((item) => ({
  id: item.id,
  name: item.name,
  description: item.description,
}));

const unmapLeadQuoteList = (input) => {
  const { data } = input;
  return {
    itemList: getList(data)
  };
};

export {
  unmapLeadQuoteList,
};
