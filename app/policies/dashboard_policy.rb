# frozen_string_literal: true

class DashboardPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role?
  end
end
