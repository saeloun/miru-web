# frozen_string_literal: true

# == Schema Information
#
# Table name: project_members
#
#  id           :integer          not null, primary key
#  user_id      :integer          not null
#  project_id   :integer          not null
#  hourly_rate  :decimal(, )      default("0.0"), not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  discarded_at :datetime
#
# Indexes
#
#  index_project_members_on_discarded_at  (discarded_at)
#  index_project_members_on_project_id    (project_id)
#  index_project_members_on_user_id       (user_id)
#

class ProjectMember < ApplicationRecord
  include Discard::Model

  belongs_to :project
  belongs_to :user
  delegate :full_name, :timesheet_entries, to: :user

  validates :hourly_rate, presence: true
end
