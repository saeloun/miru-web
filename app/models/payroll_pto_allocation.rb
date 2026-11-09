# frozen_string_literal: true

class PayrollPtoAllocation < ApplicationRecord
  belongs_to :company
  belongs_to :employment
  belongs_to :accrual_entry, class_name: "PayrollPtoEntry"
  belongs_to :origin_entry, class_name: "PayrollPtoEntry"

  def readonly?
    persisted?
  end
end
