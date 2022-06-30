# frozen_string_literal: true

json.extract! timeline, :id, :action_description, :action_due_at, :action_priority_code,
                          :action_subject, :comment, :discarded_at, :index_system_display_message,
                          :index_system_display_title, :kind, :action_assignee_id, :action_created_by_id,
                          :action_reporter_id, :lead_id, :parent_lead_timeline_id, :created_at,
                          :created_at_formated, :action_assignee_name, :action_created_by_name,
                          :action_reporter_name
