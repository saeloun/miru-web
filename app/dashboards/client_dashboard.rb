# frozen_string_literal: true

require "administrate/base_dashboard"

class ClientDashboard < Administrate::BaseDashboard
  # ATTRIBUTE_TYPES
  # a hash that describes the type of each of the model's fields.
  #
  # Each different type represents an Administrate::Field object,
  # which determines how the attribute is displayed
  # on pages throughout the dashboard.
  ATTRIBUTE_TYPES = {
    id: Field::Number,
    addresses: Field::HasMany,
    company: Field::BelongsTo,
    discarded_at: Field::DateTime,
    email: Field::String,
    invoices: Field::HasMany,
    name: Field::String,
    phone: Field::String,
    projects: Field::HasMany,
    stripe_id: Field::String,
    timesheet_entries: Field::HasMany,
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
    addresses
    company
  ].freeze

  # SHOW_PAGE_ATTRIBUTES
  # an array of attributes that will be displayed on the model's show page.
  SHOW_PAGE_ATTRIBUTES = %i[
    id
    addresses
    company
    discarded_at
    email
    invoices
    name
    phone
    projects
    stripe_id
    timesheet_entries
    created_at
    updated_at
  ].freeze

  # FORM_ATTRIBUTES
  # an array of attributes that will be displayed
  # on the model's form (`new` and `edit`) pages.
  FORM_ATTRIBUTES = %i[
    addresses
    company
    discarded_at
    email
    invoices
    name
    phone
    projects
    timesheet_entries
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

  # Overwrite this method to customize how clients are displayed
  # across all pages of the admin dashboard.
  #
  # def display_resource(client)
  #   "Client ##{client.id}"
  # end
end
