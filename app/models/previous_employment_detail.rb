# frozen_string_literal: true

# == Schema Information
#
# Table name: previous_employment_details
#
#  id                   :bigint           not null, primary key
#  company_name         :string
#  role                 :string
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  company_user_id      :bigint           not null
#  employment_detail_id :bigint           not null
#
# Indexes
#
#  index_previous_employment_details_on_company_user_id       (company_user_id)
#  index_previous_employment_details_on_employment_detail_id  (employment_detail_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_user_id => company_users.id)
#  fk_rails_...  (employment_detail_id => employment_details.id)
#
class PreviousEmploymentDetail < ApplicationRecord
  belongs_to :employment_detail
  belongs_to :company_user

  validates :company_name, :role, length: { maximum: 50 }
end
