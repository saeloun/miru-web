# == Schema Information
#
# Table name: projects
#
#  id          :integer          not null, primary key
#  client_id   :integer          not null
#  name        :string           not null
#  description :text             not null
#  bill_status :integer          not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# Indexes
#
#  index_projects_on_client_id  (client_id)
#

# frozen_string_literal: true

class Project < ApplicationRecord
  enum bill_status: [:non_billable, :billable, :billed]

  belongs_to :client
  has_many :timesheet_entries

  validates :name, :description, :bill_status, presence: true
end
