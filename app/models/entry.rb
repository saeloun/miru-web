# frozen_string_literal: true
# == Schema Information
#
# Table name: entries
#
#  id         :integer          not null, primary key
#  user_id    :integer          not null
#  project_id :integer          not null
#  duration   :float            not null
#  note       :text             not null
#  work_date  :date             not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  billed     :boolean          default("false")
#
# Indexes
#
#  index_entries_on_project_id  (project_id)
#  index_entries_on_user_id     (user_id)
#

# frozen_string_literal: true

class Entry < ApplicationRecord
  belongs_to :user
  belongs_to :project

  validates :duration, :note, :work_date, presence: true
  validates :duration, numericality: { less_than_or_equal_to: 24.0 }
end
