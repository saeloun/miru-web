# frozen_string_literal: true
# == Schema Information
#
# Table name: leaves
#
#  id           :integer          not null, primary key
#  year         :integer
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  company_id   :integer          not null
#  discarded_at :datetime
#
# Indexes
#
#  index_leaves_on_company_id           (company_id)
#  index_leaves_on_discarded_at         (discarded_at)
#  index_leaves_on_year_and_company_id  (year,company_id) UNIQUE
#

# frozen_string_literal: true

class Leave < ApplicationRecord
  include Discard::Model

  belongs_to :company

  has_many :leave_types, class_name: "LeaveType", dependent: :destroy
  has_many :custom_leaves, class_name: "CustomLeave", dependent: :destroy
  has_many :timeoff_entries, through: :leave_types

  validates :year, presence: true,
    numericality: { greater_than_or_equal_to: 1000, less_than_or_equal_to: 9999 }

  after_discard :discard_leave_types

  private

    def discard_leave_types
      leave_types.discard_all
    end
end
