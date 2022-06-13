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
#  employee_id     :string
#  user_id         :bigint           not null
#
# Indexes
#
#  index_employment_details_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
# frozen_string_literal: true

class EmploymentDetail < ApplicationRecord
  belongs_to :user

  validates :designation, :employment_type, :joined_at, :employee_id, presence: true
  validates :resigned_at, comparison: { greater_than: :joined_at }, unless: -> { resigned_at.nil? }
end
