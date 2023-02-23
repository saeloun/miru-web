# frozen_string_literal: true

module Types
  class ExpenseCategoryType < Types::BaseObject
    field :id, ID, null: false
    field :name, String
    field :default, Boolean
    field :company_id, Integer
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
