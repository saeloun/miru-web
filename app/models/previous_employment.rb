# frozen_string_literal: true

# == Schema Information
#
# Table name: previous_employments
#
#  id           :integer          not null, primary key
#  company_name :string
#  role         :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  user_id      :integer          not null
#
# Indexes
#
#  index_previous_employments_on_user_id  (user_id)
#

class PreviousEmployment < ApplicationRecord
  belongs_to :user

  validates :company_name, :role, length: { maximum: 50 }
  validates :company_name, :role, presence: true
end
