# frozen_string_literal: true

module Types
  class BaseEdge < Types::BaseObject
    include GraphQL::Types::Relay::EdgeBehaviors
  end
end
