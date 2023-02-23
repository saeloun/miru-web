# frozen_string_literal: true

module Types
  class ExpenseType < Types::BaseObject
    field :id, ID, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :amount, Float, null: false
    field :expense_type, Integer
    field :description, String
    field :company_id, Integer, null: false
    field :expense_category, Types::ExpenseCategoryType, null: false
    field :vendor, Types::VendorType
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
