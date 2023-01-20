# frozen_string_literal: true

class ExpensePolicy < ApplicationPolicy
  def create?
    user_owner_role? || user_admin_role?
  end
end
