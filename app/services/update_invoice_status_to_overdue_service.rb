# frozen_string_literal: true

class UpdateInvoiceStatusToOverdueService
  TODAY = Date.current

  def process
    Invoice.where({ status: "sent" }).find_each do |invoice|
      if invoice.due_date < TODAY
        update_invoice_status(invoice)
      end
    end
  end

  private

    def update_invoice_status(invoice)
      invoice.update!({ status: :overdue })
    end
end
