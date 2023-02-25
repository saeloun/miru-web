# frozen_string_literal: true

module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :first_name, String, null: false
    field :last_name, String, null: false
    field :email, String, null: false
    field :reset_password_sent_at, GraphQL::Types::ISO8601DateTime
    field :remember_created_at, GraphQL::Types::ISO8601DateTime
    field :sign_in_count, Integer, null: false
    field :current_sign_in_at, GraphQL::Types::ISO8601DateTime
    field :last_sign_in_at, GraphQL::Types::ISO8601DateTime
    field :current_sign_in_ip, String
    field :last_sign_in_ip, String
    field :confirmed_at, GraphQL::Types::ISO8601DateTime
    field :confirmation_sent_at, GraphQL::Types::ISO8601DateTime
    field :unconfirmed_email, String
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :current_workspace, Types::CompanyType
    field :discarded_at, GraphQL::Types::ISO8601DateTime
    field :personal_email_id, String
    field :date_of_birth, GraphQL::Types::ISO8601Date
    field :social_accounts, GraphQL::Types::JSON
    field :phone, String
    field :token, String
  end
end
