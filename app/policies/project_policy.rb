# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  def index?
    user_owner_or_admin?
  end

  def create?
    user_owner_or_admin?
  end

  def update?
    user_owner_or_admin?
  end

  def show?
    user_owner_or_admin?
  end

  def permitted_attributes
    [
      :name, :description, :billable, :client_id
    ]
  end
end
