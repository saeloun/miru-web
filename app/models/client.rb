# == Schema Information
#
# Table name: clients
#
#  id         :integer          not null, primary key
#  company_id :integer          not null
#  name       :string           not null
#  email      :string
#  phone      :string
#  address    :string
#  country    :string
#  timezone   :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_clients_on_company_id  (company_id)
#

# frozen_string_literal: true

class Client < ApplicationRecord
  has_many :projects
  belongs_to :company

  validates :name, :email, presence: true
  validates :email, uniqueness: true, format: { with: /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i }
end
