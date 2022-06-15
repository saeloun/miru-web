# frozen_string_literal: true

require_relative("./verifiers/invoice_default_external_view_key_verifier.rb")

class AddExternalViewKeyToInvoices < ActiveRecord::Migration[7.0]
  def up
    Invoice.find_each do |invoice|
      invoice.external_view_key = "#{SecureRandom.hex}"
      invoice.save!
    end
    InvoiceDefaultExternalViewKeyVerifier
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
