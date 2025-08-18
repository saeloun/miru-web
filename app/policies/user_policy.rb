# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  def index?
    has_owner_or_admin_role? || user_employee_role? || user_book_keeper_role?
  end

  def show?
    (has_owner_or_admin_role? && user_belongs_to_company?) || record == user
  end

  def create?
    has_owner_or_admin_role? && user_belongs_to_company?
  end

  def update?
    (has_owner_or_admin_role? && user_belongs_to_company?) || record == user
  end

  def destroy?
    has_owner_or_admin_role? && user_belongs_to_company? && record != user
  end

  private

    def user_belongs_to_company?
      return true if record == user
      record.current_workspace_id == user.current_workspace_id
    end
end
