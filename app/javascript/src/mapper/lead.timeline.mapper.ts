const getList = (input) => input.timeline_details.map((item) => ({
  id: item.id,
  action_description: item.action_description,
  action_due_at: item.action_due_at,
  action_priority_code: item.action_priority_code,
  action_subject: item.action_subject,
  comment: item.comment,
  discarded_at: item.discarded_at,
  index_system_display_message: item.index_system_display_message,
  index_system_display_title: item.index_system_display_title,
  kind: item.kind,
  action_assignee: item.action_assignee,
  action_created_by: item.action_created_by,
  action_reporter: item.action_reporter,
  lead_id: item.lead_id,
  parent_lead_timeline_id: item.parent_lead_timeline_id,
  created_at: item.created_at,
  created_at_formated: item.created_at_formated
}));

const unmapLeadTimelineList = (input) => {
  const { data } = input;
  return {
    itemList: getList(data)
  };
};

const unmapLeadTimelineListForDropdown = (input) => {
  const leadTimelineList = input.data.timeline_details;
  return leadTimelineList.map(item => ({
    label: item.name,
    value: item.id
  }));
};

const unmapLeadTimelineDetails = (input) => {
  const { data } = input;
  return {
    leadDetails: {
      id: data.timeline_details.id,
      action_description: data.timeline_details.action_description,
      action_due_at: data.timeline_details.action_due_at,
      action_priority_code: data.timeline_details.action_priority_code,
      action_subject: data.timeline_details.action_subject,
      comment: data.timeline_details.comment,
      discarded_at: data.timeline_details.discarded_at,
      index_system_display_message: data.timeline_details.index_system_display_message,
      index_system_display_title: data.timeline_details.index_system_display_title,
      kind: data.timeline_details.kind,
      action_assignee: data.timeline_details.action_assignee,
      action_created_by: data.timeline_details.action_created_by,
      action_reporter: data.timeline_details.action_reporter,
      lead_id: data.timeline_details.lead_id,
      parent_lead_timeline_id: data.timeline_details.parent_lead_timeline_id,
      created_at: data.timeline_details.created_at,
      created_at_formated: data.timeline_details.created_at_formated
    }
  };
};

export {
  unmapLeadTimelineList,
  unmapLeadTimelineDetails,
  unmapLeadTimelineListForDropdown
};
