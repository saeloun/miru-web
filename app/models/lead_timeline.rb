# frozen_string_literal: true

# == Schema Information
#
# Table name: lead_timelines
#
#  id                           :bigint           not null, primary key
#  action_description           :text
#  action_due_at                :datetime
#  action_priority_code         :integer
#  action_subject               :string
#  comment                      :text
#  discarded_at                 :datetime
#  index_system_display_message :text
#  kind                         :integer
#  created_at                   :datetime         not null
#  updated_at                   :datetime         not null
#  action_assignee_id           :bigint
#  action_created_by_id         :bigint
#  action_reporter_id           :bigint
#  lead_id                      :bigint           not null
#  parent_lead_timeline_id      :bigint
#
# Indexes
#
#  index_lead_timelines_on_action_assignee_id       (action_assignee_id)
#  index_lead_timelines_on_action_created_by_id     (action_created_by_id)
#  index_lead_timelines_on_action_reporter_id       (action_reporter_id)
#  index_lead_timelines_on_discarded_at             (discarded_at)
#  index_lead_timelines_on_lead_id                  (lead_id)
#  index_lead_timelines_on_parent_lead_timeline_id  (parent_lead_timeline_id)
#
# Foreign Keys
#
#  fk_rails_...  (action_assignee_id => users.id)
#  fk_rails_...  (action_created_by_id => users.id)
#  fk_rails_...  (action_reporter_id => users.id)
#  fk_rails_...  (lead_id => leads.id)
#  fk_rails_...  (parent_lead_timeline_id => lead_timelines.id)
#
class LeadTimeline < ApplicationRecord
  include Discard::Model
  belongs_to :lead
  belongs_to :action_assignee, class_name: :User, optional: true
  belongs_to :action_created_by, class_name: :User, optional: true
  belongs_to :action_reporter, class_name: :User, optional: true

  CodeOptionKlass = Struct.new(:name, :id)

  KIND_OPTIONS = [
    CodeOptionKlass.new("System Message", 0),
    CodeOptionKlass.new("Comment", 1),
    CodeOptionKlass.new("Appointment", 2),
    CodeOptionKlass.new("Email", 3),
    CodeOptionKlass.new("Phone Call", 4),
    CodeOptionKlass.new("Skype DM", 5),
    CodeOptionKlass.new("LinkedIn DM", 6),
    CodeOptionKlass.new("Other DM", 7),
    CodeOptionKlass.new("Task", 8),
  ]

  SCHEDULE_ACTION_STATUS_OPTIONS = [
    CodeOptionKlass.new("Initial", 0),
    CodeOptionKlass.new("Follow Up", 1),
    CodeOptionKlass.new("Schedule", 2),
    CodeOptionKlass.new("Re-Schedule", 3),
    CodeOptionKlass.new("In Progress", 4),
    CodeOptionKlass.new("Done", 5),
  ]

  PRIORITY_CODE_OPTIONS = [
    CodeOptionKlass.new("Lowest", 0),
    CodeOptionKlass.new("Low", 1),
    CodeOptionKlass.new("Normal", 2),
    CodeOptionKlass.new("High", 3),
    CodeOptionKlass.new("Highest", 4),
  ]

  def render_properties
    {
      id: self.id,
      action_description: self.action_description,
      action_due_at: self.action_due_at,
      action_priority_code: self.action_priority_code,
      action_subject: self.action_subject,
      comment: self.comment,
      discarded_at: self.discarded_at,
      index_system_display_message: self.index_system_display_message,
      kind: self.kind,
      action_assignee_id: self.action_assignee_id,
      action_created_by_id: self.action_created_by_id,
      action_reporter_id: self.action_reporter_id,
      lead_id: self.lead_id,
      parent_lead_timeline_id: self.parent_lead_timeline_id,
      created_at: self.created_at,
      created_at_formated: self.created_at.strftime("#{self.created_at.day.ordinalize} %b %Y at %H:%M"),
      action_assignee_name: self.action_assignee ? self.action_assignee.full_name : "",
      action_created_by_name: self.action_created_by ? self.action_created_by.full_name : "",
      action_reporter_name: self.action_reporter ? self.action_reporter.full_name : ""
    }
  end
end
