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
#  employment_detail_id :bigint           not null
#  user_id              :bigint           not null
#
# Indexes
#
#  index_previous_employment_details_on_employment_detail_id  (employment_detail_id)
#  index_previous_employment_details_on_user_id               (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (employment_detail_id => employment_details.id)
#  fk_rails_...  (user_id => users.id)
#
class PreviousEmploymentDetail < ApplicationRecord
  belongs_to :employment_detail
  belongs_to :user

  validates :company_name, :role, length: { maximum: 50 }
end
