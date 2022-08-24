const unmapEngagementDetails = (i) => ({
  id: i.id,
  name: i.name,
  email: i.email,
  discarded_at: i.discarded_at,
  department_id: i.department_id,
  department_name: i.department_name,
  engage_code: i.engage_code,
  engage_name: i.engage_name,
  engage_updated_by_name: i.engage_updated_by_name,
  engage_updated_at: i.engage_updated_at,
});

const getList = (input) => input.users.map((i) => unmapEngagementDetails(i));

const unmapEngagementList = (input) => {
  const { data } = input;
  return {
    list: getList(data)
  };
};

export {
  unmapEngagementList,
  unmapEngagementDetails
};
