# frozen_string_literal: true

class ClientPolicy < ApplicationPolicy
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
    unless user.current_workspace_id == record.company_id
      @error_message_key = :different_workspace
      return false
    end

    user_owner_or_admin?
  end

  def destroy?
    unless user.current_workspace_id == record.company_id
      @error_message_key = :different_workspace
      return false
    end

    user_owner_or_admin?
  end

  def permitted_attributes
    [:name, :email, :phone, :address]
  end
end
