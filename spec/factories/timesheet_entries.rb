# frozen_string_literal: true

# == Schema Information
#
# Table name: timesheet_entries
#
#  id           :bigint           not null, primary key
#  bill_status  :integer          not null
#  discarded_at :datetime
#  duration     :float            not null
#  locked       :boolean          default(FALSE)
#  note         :text             default("")
#  work_date    :date             not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  project_id   :bigint           not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_timesheet_entries_on_bill_status   (bill_status)
#  index_timesheet_entries_on_discarded_at  (discarded_at)
#  index_timesheet_entries_on_note_trgm     (note) USING gin
#  index_timesheet_entries_on_project_id    (project_id)
#  index_timesheet_entries_on_user_id       (user_id)
#  index_timesheet_entries_on_work_date     (work_date)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :timesheet_entry do
    user
    project
    duration { 480.0 } # in minutes
    note { "Did that" }
    work_date { Date.current }
    bill_status { "non_billable" }
  end
end
