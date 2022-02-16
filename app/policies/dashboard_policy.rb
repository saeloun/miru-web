# frozen_string_literal: true

class DashboardPolicy < ApplicationPolicy
  def index?
    user.has_any_role?(:owner, :admin)
  end
end
