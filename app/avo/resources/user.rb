class Avo::Resources::User < Avo::BaseResource
  self.title = :display_name
  self.includes = [:companies, :roles]
  
  self.search = {
    query: -> { query.ransack(first_name_cont: q, last_name_cont: q, email_cont: q, m: "or").result(distinct: false) }
  }
  
  def fields
    # Basic Info
    field :id, as: :id
    field :first_name, as: :text
    field :last_name, as: :text
    field :email, as: :text
    field :phone, as: :text
    field :date_of_birth, as: :date
    
    # Authentication
    field :sign_in_count, as: :number, hide_on: :index
    field :current_sign_in_at, as: :date_time, hide_on: :index
    field :last_sign_in_at, as: :date_time
    field :confirmed_at, as: :date_time, hide_on: :index
    
    # Status
    field :discarded_at, as: :date_time, hide_on: :index
    field :calendar_enabled, as: :boolean
    field :avatar, as: :file, hide_on: :index
    
    # Relationships (show only on detail view)
    field :companies, as: :has_many, through: :employments, hide_on: :index
    field :roles, as: :has_and_belongs_to_many, hide_on: :index
    field :projects, as: :has_many, through: :project_members, hide_on: :index
    field :timesheet_entries, as: :has_many, hide_on: :index
  end
end
