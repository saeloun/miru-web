# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    user_owner_or_admin?
  end

  def show?
    user_owner_or_admin?
  end

  def create?
    user_owner_or_admin?
  end

  def update?
    user_owner_or_admin?
  end

  def destroy?
    user_owner_or_admin?
  end

  def permitted_attributes
    [
      :name, :description, :billable, :client_id
    ]
  end
end
