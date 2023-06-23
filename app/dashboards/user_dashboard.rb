# frozen_string_literal: true

require "administrate/base_dashboard"

class UserDashboard < Administrate::BaseDashboard
  # ATTRIBUTE_TYPES
  # a hash that describes the type of each of the model's fields.
  #
  # Each different type represents an Administrate::Field object,
  # which determines how the attribute is displayed
  # on pages throughout the dashboard.
  ATTRIBUTE_TYPES = {
    id: Field::Number,
    companies: Field::HasMany,
    confirmation_sent_at: Field::DateTime,
    confirmation_token: Field::String,
    confirmed_at: Field::DateTime,
    current_sign_in_at: Field::DateTime,
    current_sign_in_ip: Field::String,
    current_workspace_id: Field::Number,
    date_of_birth: Field::Date,
    devices: Field::HasMany,
    discarded_at: Field::DateTime,
    email: Field::String,
    encrypted_password: Field::String,
    first_name: Field::String,
    invitations: Field::HasMany,
    last_name: Field::String,
    last_sign_in_at: Field::DateTime,
    last_sign_in_ip: Field::String,
    personal_email_id: Field::String,
    phone: Field::String,
    project_members: Field::HasMany,
    projects: Field::HasMany,
    remember_created_at: Field::DateTime,
    reset_password_sent_at: Field::DateTime,
    reset_password_token: Field::String,
    roles: Field::HasMany,
    sign_in_count: Field::Number,
    social_accounts: Field::String.with_options(searchable: false),
    timesheet_entries: Field::HasMany,
    token: Field::String,
    unconfirmed_email: Field::String,
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
    email
    first_name
    last_name
    created_at
    last_sign_in_at
  ].freeze

  # SHOW_PAGE_ATTRIBUTES
  # an array of attributes that will be displayed on the model's show page.
  SHOW_PAGE_ATTRIBUTES = %i[
    id
    companies
    confirmation_sent_at
    confirmation_token
    confirmed_at
    current_sign_in_at
    current_sign_in_ip
    current_workspace_id
    date_of_birth
    discarded_at
    email
    encrypted_password
    first_name
    invitations
    last_name
    last_sign_in_at
    last_sign_in_ip
    personal_email_id
    phone
    project_members
    projects
    remember_created_at
    reset_password_sent_at
    reset_password_token
    roles
    sign_in_count
    social_accounts
    token
    unconfirmed_email
    created_at
    updated_at
  ].freeze

  # FORM_ATTRIBUTES
  # an array of attributes that will be displayed
  # on the model's form (`new` and `edit`) pages.
  FORM_ATTRIBUTES = %i[
    companies
    current_workspace_id
    date_of_birth
    discarded_at
    email
    first_name
    invitations
    last_name
    personal_email_id
    phone
    project_members
    projects
    roles
    unconfirmed_email
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

  # Overwrite this method to customize how users are displayed
  # across all pages of the admin dashboard.
  #
  # def display_resource(user)
  #   "User ##{user.id}"
  # end
end
