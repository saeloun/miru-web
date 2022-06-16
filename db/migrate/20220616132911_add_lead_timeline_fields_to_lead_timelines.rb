# frozen_string_literal: true

class AddLeadTimelineFieldsToLeadTimelines < ActiveRecord::Migration[7.0]
  def change
    add_column :lead_timelines, :index_system_display_message, :text
    add_reference :lead_timelines, :parent_lead_timeline, foreign_key: { to_table: :lead_timelines }
    add_reference :lead_timelines, :action_assignee, foreign_key: { to_table: :users }
    add_reference :lead_timelines, :action_reporter, foreign_key: { to_table: :users }
    add_reference :lead_timelines, :action_created_by, foreign_key: { to_table: :users }
    add_column :lead_timelines, :action_due_at, :datetime
    add_column :lead_timelines, :action_subject, :string
    add_column :lead_timelines, :action_description, :text
    add_column :lead_timelines, :action_priority_code, :integer, limit: 2
  end
end
