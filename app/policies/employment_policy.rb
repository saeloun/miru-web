# frozen_string_literal: true

class EmploymentPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role?
  end

  def show?
    authorize_current_user && (
      user_owner_role? ||
      user_admin_role? ||
      self_service_role?
    )
  end

  def update?
    authorize_current_user && (
      user_owner_role? ||
      user_admin_role? ||
      self_service_role?
    )
  end

  def authorize_current_user
    if user.current_workspace_id == record.company_id
      true
    else
      @error_message_key = :different_workspace
      false
    end
  end

  private

    def self_service_role?
      record_belongs_to_user? && (user_employee_role? || user_book_keeper_role?)
    end
end
