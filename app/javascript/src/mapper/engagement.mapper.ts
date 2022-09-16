const unmapEngagementDetails = (i) => ({
  id: i.id,
  name: i.name,
  email: i.email,
  discarded_at: i.discarded_at,
  department_id: i.department_id,
  department_name: i.department_name,
  engagement: i.engagement ? {
    code: i.engagement.code,
    name: i.engagement.name,
    updated_by_name: i.engagement.updated_by_name,
    updated_at: i.engagement.updated_at,
  } : null
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
