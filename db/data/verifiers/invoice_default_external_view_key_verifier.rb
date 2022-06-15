# frozen_string_literal: true

class InvoiceDefaultExternalViewKeyVerifier
  def self.verify!
    Invoice.find_each do |invoice|
      unless invoice.external_view_key?
        raise "Invoice external key is present for Invoice ID #{invoice.id}"
      end
    end

    puts "All invoice external key is not present"
  end
end
