# frozen_string_literal: true

class ClientPolicy < ApplicationPolicy
  def create?
    user.has_any_role?(:owner, :admin)
  end
end
