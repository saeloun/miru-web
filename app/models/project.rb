# == Schema Information
#
# Table name: projects
#
#  id          :integer          not null, primary key
#  client_id   :integer          not null
#  name        :string           not null
<<<<<<< HEAD
#  description :text             not null
=======
#  description :text
>>>>>>> 9592abb (added the new project functionality)
#  billable    :boolean          not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# Indexes
#
#  index_projects_on_client_id  (client_id)
#

# frozen_string_literal: true

class Project < ApplicationRecord
  belongs_to :client
  has_many :timesheet_entries

  # Validations
  validates :name, presence: true
  validates :billable, inclusion: { in: [ true, false ] }
end
