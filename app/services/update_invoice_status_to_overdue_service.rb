# frozen_string_literal: true

class UpdateInvoiceStatusToOverdueService
  def process
    Invoice.where(status: ["viewed", "sent"], due_date: ...Date.current).find_each do | invoice |
      invoice.update!({ status: :overdue })
    end
  end
end
