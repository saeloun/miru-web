class Avo::Resources::Company < Avo::BaseResource
  # self.includes = []
  # self.attachments = []
  # self.search = {
  #   query: -> { query.ransack(id_eq: q, m: "or").result(distinct: false) }
  # }
  
  def fields
    field :id, as: :id
    field :name, as: :text
    field :address, as: :textarea
    field :business_phone, as: :text
    field :base_currency, as: :text
    field :standard_price, as: :number
    field :fiscal_year_end, as: :text
    field :date_format, as: :text
    field :country, as: :country
    field :timezone, as: :text
    field :calendar_enabled, as: :boolean
    field :working_days, as: :text
    field :working_hours, as: :text
    field :bank_name, as: :text
    field :bank_account_number, as: :text
    field :bank_routing_number, as: :text
    field :bank_swift_code, as: :text
    field :tax_id, as: :text
    field :vat_number, as: :text
    field :gst_number, as: :text
    field :logo, as: :file
    field :metrics, as: :has_many
    field :employments, as: :has_many
    field :users, as: :has_many, through: :employments
    field :clients, as: :has_many
    field :projects, as: :has_many, through: :clients
    field :current_workspace_users, as: :has_many
    field :timesheet_entries, as: :has_many, through: :clients
    field :invoices, as: :has_many
    field :payments, as: :has_many, through: :invoices
    field :stripe_connected_account, as: :has_one
    field :payments_providers, as: :has_many
    field :addresses, as: :has_many
    field :devices, as: :has_many
    field :invitations, as: :has_many
    field :expenses, as: :has_many
    field :expense_categories, as: :has_many
    field :vendors, as: :has_many
    field :client_members, as: :has_many
    field :leaves, as: :has_many
    field :leave_types, as: :has_many, through: :leaves
    field :timeoff_entries, as: :has_many, through: :users
    field :holidays, as: :has_many
    field :holiday_infos, as: :has_many, through: :holidays
    field :carryovers, as: :has_many
    field :notification_preferences, as: :has_many
    field :roles, as: :has_many
  end
end
