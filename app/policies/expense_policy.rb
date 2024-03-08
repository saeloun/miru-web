# frozen_string_literal: true

class ExpensePolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    admin_access?
  end

  def create?
    admin_access?
  end

  def show?
    authorize_current_user
  end

  def update?
    authorize_current_user
  end

  def destroy?
    authorize_current_user
  end

  def authorize_current_user
    unless user.current_workspace_id == record.company_id
      @error_message_key = :different_workspace
      return false
    end

    admin_access?
  end

  private

    def admin_access?
      user_owner_role? || user_admin_role?
    end
end
