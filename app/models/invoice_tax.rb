# frozen_string_literal: true

class InvoiceTax < ApplicationRecord
  enum :calculation_method, [:percentage, :flat]

  belongs_to :invoice
  belongs_to :tax_configuration, optional: true

  before_validation :snapshot_tax_configuration
  before_validation :normalize_name

  validates :name, presence: true, length: { maximum: 80 }
  validates :calculation_method, presence: true
  validates :value, :amount, numericality: { greater_than_or_equal_to: 0 }
  validate :tax_configuration_belongs_to_invoice_company

  def sync_amount_from_subtotal(subtotal)
    self.amount = calculated_amount(subtotal)
  end

  def calculated_amount(subtotal)
    base = BigDecimal(subtotal.to_s)
    tax_value = BigDecimal(value.to_s)

    if percentage?
      (base * tax_value / 100).round(2)
    else
      tax_value.round(2)
    end
  end

  private

    def snapshot_tax_configuration
      return if tax_configuration.blank?

      snapshot_changed = will_save_change_to_tax_configuration_id?

      self.name = tax_configuration.name if snapshot_changed || name.blank?
      self.calculation_method = tax_configuration.calculation_method if snapshot_changed || calculation_method.blank?
      self.value = tax_configuration.value if snapshot_changed || value.blank? || value.zero?
    end

    def normalize_name
      self.name = name.to_s.strip
    end

    def tax_configuration_belongs_to_invoice_company
      return if tax_configuration.blank? || invoice.blank?
      return if tax_configuration.company_id == invoice.company_id

      errors.add(:tax_configuration, "must belong to the same company")
    end
end
