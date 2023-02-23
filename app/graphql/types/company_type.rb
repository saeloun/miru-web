# frozen_string_literal: true

module Types
  class CompanyType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :address, String, null: false
    field :business_phone, String
    field :base_currency, String, null: false
    field :standard_price, Float, null: false
    field :fiscal_year_end, String
    field :date_format, String
    field :country, String, null: false
    field :timezone, String
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
