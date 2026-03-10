# frozen_string_literal: true

class ExpensePolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    elevated_access? || employee_access?
  end

  def create?
    elevated_access? || employee_access?
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

  def mark_paid?
    same_workspace? && elevated_access?
  end

  def approve?
    same_workspace? && elevated_access?
  end

  def reject?
    same_workspace? && elevated_access?
  end

  def authorize_current_user
    unless same_workspace?
      @error_message_key = :different_workspace
      return false
    end

    elevated_access? || own_submitted_expense?
  end

  private

    def same_workspace?
      user.current_workspace_id == record.company_id
    end

    def elevated_access?
      user_owner_role? || user_admin_role? || user_book_keeper_role?
    end

    def employee_access?
      user_employee_role?
    end

    def own_submitted_expense?
      record.user_id.present? && record.user_id == user.id
    end
end
