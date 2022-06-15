# frozen_string_literal: true

# == Schema Information
#
# Table name: employment_details
#
#  id              :bigint           not null, primary key
#  designation     :string
#  employment_type :string
#  joined_at       :date
#  resigned_at     :date
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  company_user_id :bigint           not null
#  employee_id     :string
#
# Indexes
#
#  index_employment_details_on_company_user_id  (company_user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_user_id => company_users.id)
#

class EmploymentDetail < ApplicationRecord
  belongs_to :company_user
  has_many :previous_employment_details

  validates :designation, :employment_type, :joined_at, :employee_id, presence: true
  validates :resigned_at, comparison: { greater_than: :joined_at }, unless: -> { resigned_at.nil? }
end
