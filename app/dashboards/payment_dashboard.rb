# frozen_string_literal: true

require "administrate/base_dashboard"

class PaymentDashboard < Administrate::BaseDashboard
  # ATTRIBUTE_TYPES
  # a hash that describes the type of each of the model's fields.
  #
  # Each different type represents an Administrate::Field object,
  # which determines how the attribute is displayed
  # on pages throughout the dashboard.
  ATTRIBUTE_TYPES = {
    id: Field::Number,
    amount: Field::String.with_options(searchable: false),
    invoice: Field::BelongsTo,
    note: Field::Text,
    status: Field::Select.with_options(
      searchable: false, collection: ->(field) {
  field.resource.class.send(field.attribute.to_s.pluralize).keys
}),
    transaction_date: Field::Date,
    transaction_type: Field::Select.with_options(
      searchable: false, collection: ->(field) {
  field.resource.class.send(field.attribute.to_s.pluralize).keys
}),
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
    amount
    invoice
    note
  ].freeze

  # SHOW_PAGE_ATTRIBUTES
  # an array of attributes that will be displayed on the model's show page.
  SHOW_PAGE_ATTRIBUTES = %i[
    id
    amount
    invoice
    note
    status
    transaction_date
    transaction_type
    created_at
    updated_at
  ].freeze

  # FORM_ATTRIBUTES
  # an array of attributes that will be displayed
  # on the model's form (`new` and `edit`) pages.
  FORM_ATTRIBUTES = %i[
    amount
    invoice
    note
    status
    transaction_date
    transaction_type
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

  # Overwrite this method to customize how payments are displayed
  # across all pages of the admin dashboard.
  #
  # def display_resource(payment)
  #   "Payment ##{payment.id}"
  # end
end
