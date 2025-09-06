# frozen_string_literal: true

json.currency current_company.base_currency
json.clients client_revenues do |client|
  json.name client[:name]
  json.logo client[:logo]
  paid = client[:paid_amount] || 0
  outstanding = client[:outstanding_amount] || 0
  overdue = client[:overdue_amount] || 0
  revenue = client[:revenue] || 0
  json.paid_amount paid
  json.outstanding_amount outstanding
  json.overdue_amount overdue
  json.total_revenue revenue
end
json.summary do
  json.totalPaidAmount summary[:total_paid_amount]
  json.totalOutstandingAmount summary[:total_outstanding_amount]
  json.totalRevenue summary[:total_revenue]
  json.totalOverdueAmount summary[:total_outstanding] # Add overdue amount for summary
end
