# frozen_string_literal: true

class TaxConfiguration < ApplicationRecord
  include Discardable

  enum :calculation_method, [:percentage, :flat]

  belongs_to :company
  has_many :invoice_taxes, dependent: :nullify

  before_validation :normalize_name

  validates :name, presence: true, length: { maximum: 80 }
  validates :calculation_method, presence: true
  validates :value, numericality: { greater_than_or_equal_to: 0 }

  scope :ordered, -> { kept.order(:name, :id) }

  def calculate_amount(subtotal)
    base = BigDecimal(subtotal.to_s)
    tax_value = BigDecimal(value.to_s)

    if percentage?
      (base * tax_value / 100).round(2)
    else
      tax_value.round(2)
    end
  end

  private

    def normalize_name
      self.name = name.to_s.strip
    end
end
