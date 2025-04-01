# frozen_string_literal: true

require "administrate/base_dashboard"

class InvoiceDashboard < Administrate::BaseDashboard
  # ATTRIBUTE_TYPES
  # a hash that describes the type of each of the model's fields.
  #
  # Each different type represents an Administrate::Field object,
  # which determines how the attribute is displayed
  # on pages throughout the dashboard.
  ATTRIBUTE_TYPES = {
    id: Field::Number,
    amount: Field::String.with_options(searchable: false),
    amount_due: Field::String.with_options(searchable: false),
    amount_paid: Field::String.with_options(searchable: false),
    base_currency_amount: Field::String.with_options(searchable: false),
    client: Field::BelongsTo,
    company: Field::BelongsTo,
    discarded_at: Field::DateTime,
    discount: Field::String.with_options(searchable: false),
    due_date: Field::Date,
    external_view_key: Field::String,
    invoice_line_items: Field::HasMany,
    invoice_number: Field::String,
    issue_date: Field::Date,
    outstanding_amount: Field::String.with_options(searchable: false),
    payment_infos: Field::String.with_options(searchable: false),
    payments: Field::HasMany,
    reference: Field::Text,
    status: Field::Select.with_options(
      searchable: false, collection: ->(field) {
  field.resource.class.send(field.attribute.to_s.pluralize).keys
}),
    tax: Field::String.with_options(searchable: false),
    created_at: Field::DateTime,
    updated_at: Field::DateTime
  }.freeze

  # COLLECTION_ATTRIBUTES
  # an array of attributes that will be displayed on the model's index page.
  #
  # By default, it's limited to four items to reduce clutter on index pages.
  # Feel free to add, remove, or rearrange items.
  COLLECTION_ATTRIBUTES = %i[
    id
    invoice_number
    amount
    amount_due
    amount_paid
  ].freeze

  # SHOW_PAGE_ATTRIBUTES
  # an array of attributes that will be displayed on the model's show page.
  SHOW_PAGE_ATTRIBUTES = %i[
    id
    amount
    amount_due
    amount_paid
    base_currency_amount
    client
    company
    discarded_at
    discount
    due_date
    external_view_key
    invoice_line_items
    invoice_number
    issue_date
    outstanding_amount
    payment_infos
    payments
    reference
    status
    tax
    created_at
    updated_at
  ].freeze

  # FORM_ATTRIBUTES
  # an array of attributes that will be displayed
  # on the model's form (`new` and `edit`) pages.
  FORM_ATTRIBUTES = %i[
    amount
    amount_due
    amount_paid
    base_currency_amount
    client
    company
    discarded_at
    discount
    due_date
    external_view_key
    invoice_line_items
    invoice_number
    issue_date
    outstanding_amount
    payment_infos
    payments
    reference
    status
    tax
  ].freeze

  # COLLECTION_FILTERS
  # a hash that defines filters that can be used while searching via the search
  # field of the dashboard.
  #
  # For example to add an option to search for open resources by typing "open:"
  # in the search field:
  #
  #   COLLECTION_FILTERS = {
  #     open: ->(resources) { resources.where(open: true) }
  #   }.freeze
  COLLECTION_FILTERS = {}.freeze

  # Overwrite this method to customize how invoices are displayed
  # across all pages of the admin dashboard.
  #
  # def display_resource(invoice)
  #   "Invoice ##{invoice.id}"
  # end
end
