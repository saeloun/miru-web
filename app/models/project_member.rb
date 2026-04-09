# frozen_string_literal: true

class ProjectMember < ApplicationRecord
  include Discardable

  belongs_to :project
  belongs_to :user
  delegate :full_name, :timesheet_entries, to: :user

  validates :hourly_rate, presence: true
end
