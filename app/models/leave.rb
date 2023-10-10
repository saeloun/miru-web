# frozen_string_literal: true

# == Schema Information
#
# Table name: leaves
#
#  id         :bigint           not null, primary key
#  year       :integer
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  company_id :bigint           not null
#
# Indexes
#
#  index_leaves_on_company_id           (company_id)
#  index_leaves_on_year_and_company_id  (year,company_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#

# frozen_string_literal: true

class Leave < ApplicationRecord
  belongs_to :company
  has_many :leave_types, class_name: "LeaveType", dependent: :destroy

  validates :year, presence: true,
    numericality: { greater_than_or_equal_to: 1000, less_than_or_equal_to: 9999 }
end
