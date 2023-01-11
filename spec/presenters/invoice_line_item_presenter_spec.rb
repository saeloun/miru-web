# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoiceLineItemPresenter do
  let(:invoice_line_item) { create :invoice_line_item }
  let(:invoice_line_item_presenter) { InvoiceLineItemPresenter.new(invoice_line_item) }

  describe ".pdf_row" do
    it "returns required keys" do
      base_currency = invoice_line_item.invoice.company.base_currency
      pdf_row = invoice_line_item_presenter.pdf_row(base_currency)

      expect(pdf_row).to have_key(:name)
      expect(pdf_row).to have_key(:date)
      expect(pdf_row).to have_key(:description)
      expect(pdf_row).to have_key(:quantity)
      expect(pdf_row).to have_key(:rate)
      expect(pdf_row).to have_key(:line_total)
    end
  end
end
