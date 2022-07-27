# frozen_string_literal: true

class UpdateInvoiceStatusToOverdueService
  def process
    Invoice.sent.where("due_date < ?", Date.current).update_all(status: "overdue")
  end
end
