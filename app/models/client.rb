# == Schema Information
#
# Table name: clients
#
#  id           :integer          not null, primary key
#  company_id   :integer          not null
#  name         :string           not null
#  email        :string
#  phone        :string
#  address      :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  discarded_at :datetime
#
# Indexes
#
#  index_clients_on_company_id    (company_id)
#  index_clients_on_discarded_at  (discarded_at)
#

# frozen_string_literal: true

class Client < ApplicationRecord
  include Discard::Model

  has_many :projects
  has_many :timesheet_entries, through: :projects
  belongs_to :company

  validates :name, :email, presence: true
  validates :email, uniqueness: true, format: { with: Devise.email_regexp }

  after_discard :discard_projects

  private
    def discard_projects
      projects.discard_all
    end
end
