# frozen_string_literal: true

# == Schema Information
#
# Table name: company_users
#
#  id              :bigint           not null, primary key
#  designation     :string
#  discarded_at    :datetime
#  employment_type :string
#  joined_at       :date
#  resigned_at     :date
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  company_id      :bigint           not null
#  employee_id     :string
#  user_id         :bigint           not null
#
# Indexes
#
#  index_company_users_on_company_id    (company_id)
#  index_company_users_on_discarded_at  (discarded_at)
#  index_company_users_on_user_id       (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#

class CompanyUser < ApplicationRecord
  include Discard::Model

  # Associations
  belongs_to :company
  belongs_to :user

  # Validations
  validates :designation, :employment_type, :joined_at, :employee_id, presence: true
  validates :resigned_at, comparison: { greater_than: :joined_at }, unless: -> { resigned_at.nil? }
end
