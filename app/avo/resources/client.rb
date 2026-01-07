class Avo::Resources::Client < Avo::BaseResource
  # self.includes = []
  # self.attachments = []
  # self.search = {
  #   query: -> { query.ransack(id_eq: q, m: "or").result(distinct: false) }
  # }
  
  def fields
    field :id, as: :id
    field :company_id, as: :number
    field :name, as: :text
    field :email, as: :text
    field :phone, as: :text
    field :address, as: :text
    field :discarded_at, as: :date_time
    field :stripe_id, as: :text
    field :currency, as: :text
    field :logo, as: :file
    field :metrics, as: :has_many
    field :projects, as: :has_many
    field :timesheet_entries, as: :has_many, through: :projects
    field :invoices, as: :has_many
    field :addresses, as: :has_many
    field :client_members, as: :has_many
    field :invitations, as: :has_many
    field :company, as: :belongs_to
  end
end
