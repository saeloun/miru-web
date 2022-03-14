# == Schema Information
#
# Table name: projects
#
#  id           :integer          not null, primary key
#  client_id    :integer          not null
#  name         :string           not null
#  description  :text
#  billable     :boolean          not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  discarded_at :datetime
#
# Indexes
#
#  index_projects_on_client_id     (client_id)
#  index_projects_on_discarded_at  (discarded_at)
#

# frozen_string_literal: true

class Project < ApplicationRecord
  include Discard::Model

  # Associations
  belongs_to :client
  has_many :timesheet_entries
  has_many :project_members, dependent: :destroy

  # Validations
  validates :name, presence: true
  validates :billable, inclusion: { in: [ true, false ] }

  # Callbacks
  after_discard :discard_project_members

  def project_team
    project_members.map do |member|
      user = User.find(member.user_id)
      "#{user.first_name} #{user.last_name}"
    end
  end

  private
    def discard_project_members
      project_members.discard_all
    end
end
