# frozen_string_literal: true

class PaymentsProvider < ApplicationRecord
  STRIPE_PROVIDER = "stripe"

  belongs_to :company

  validates :name, uniqueness: { scope: :company_id }
  validates :name, inclusion: { in: [STRIPE_PROVIDER] }
end
