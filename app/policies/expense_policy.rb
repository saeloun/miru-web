# frozen_string_literal: true

class ExpensePolicy < ApplicationPolicy
  attr_reader :error_message_key

  def create?
    user_owner_role? || user_admin_role?
  end

  def show?
    authorize_current_user
  end

  def authorize_current_user
    unless user.current_workspace_id == record.company_id
      @error_message_key = :different_workspace
      return false
    end

    user_owner_role? || user_admin_role?
  end
end
