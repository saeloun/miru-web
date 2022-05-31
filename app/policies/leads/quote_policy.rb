# frozen_string_literal: true

class Leads::QuotePolicy < ApplicationPolicy
  def create?
    user_owner_or_admin?
  end
end
