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
    expires_at: i.engagement.expires_at,
  } : null,
  previous_engagement: i.previous_engagement ? {
    code: i.previous_engagement.code,
    name: i.previous_engagement.name,
    updated_by_name: i.previous_engagement.updated_by_name,
    updated_at: i.previous_engagement.updated_at,
    expires_at: i.previous_engagement.expires_at,
  } : null,
});

const getList = (input) => input.users.map((i) => unmapEngagementDetails(i));

const unmapEngagementList = (input) => {
  const { data } = input;
  return {
    list: getList(data),
    engagementOptions: data.engagement_options,
    currentWeekCode: data.current_week_code,
    currentWeekDueAt: data.current_week_due_at,
  };
};

export {
  unmapEngagementList,
  unmapEngagementDetails
};
