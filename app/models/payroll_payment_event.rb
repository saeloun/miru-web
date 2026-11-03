# frozen_string_literal: true

class PayrollPaymentEvent < ApplicationRecord
  self.filter_attributes += [:data]

  belongs_to :payroll_payment_instruction
  belongs_to :actor, class_name: "User", optional: true

  validates :kind, presence: true, format: { with: /\A[a-z_]{1,60}\z/ }

  def readonly?
    persisted?
  end
end
