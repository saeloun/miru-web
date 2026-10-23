# frozen_string_literal: true

class EmployeeOccasionDelivery < ApplicationRecord
  belongs_to :employment
  belongs_to :admin, class_name: "User"
  validates :kind, inclusion: { in: %w[birthday work_anniversary] }
  validates :event_on, :delivered_at, presence: true
end
