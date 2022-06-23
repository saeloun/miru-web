# frozen_string_literal: true

class InvoiceDefaultExternalViewKeyVerifier
  def self.verify!
    Invoice.find_each do |invoice|
      unless invoice.external_view_key?
        raise "external_view_key is not populated for Invoice with id #{invoice.id}"
      end
    end

    puts "InvoiceDefaultExternalViewKey data migration verified successfully!"
  end
end
