# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.invoices invoices do |invoice|
  json.partial! "api/v1/invoices/index_invoice",
    invoice:,
    current_company:,
    virtual_verified_invitations_allowed: @virtual_verified_invitations_allowed,
    include_created_at: true,
    include_tax_and_discount: true
end

json.pagination_details do
  json.page pagination_details[:page]
  json.pages pagination_details[:pages]
  json.total pagination_details[:total]
end

json.summary do
  json.draftAmount summary[:draftAmount]
  json.openAmount summary[:openAmount]
  json.outstandingAmount summary[:outstandingAmount]
  json.overdueAmount summary[:overdueAmount]
  json.draftCount summary[:draftCount]
  json.openCount summary[:openCount]
  json.outstandingCount summary[:outstandingCount]
  json.overdueCount summary[:overdueCount]
  json.paidCount summary[:paidCount]
  json.totalCount summary[:totalCount]
  json.totalAmount summary[:totalAmount]
  json.currency summary[:currency]
end

json.meta meta

json.recentlyUpdatedInvoices recently_updated_invoices do |invoice|
  json.partial! "api/v1/invoices/index_invoice",
    invoice:,
    current_company:,
    virtual_verified_invitations_allowed: @virtual_verified_invitations_allowed
end

json.recentlyUpdatedTotalCount recently_updated_total_count
