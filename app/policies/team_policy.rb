# frozen_string_literal: true

class TeamPolicy < ApplicationPolicy
  def index?
    user_owner_or_admin_or_employee?
  end

  def edit?
    user_owner_or_admin?
  end

  def update?
    user_owner_or_admin?
  end

  def destroy?
    user_owner_or_admin?
  end

  def permitted_attributes
    [:first_name, :last_name, :email]
  end
end
