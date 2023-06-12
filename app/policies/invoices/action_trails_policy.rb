# frozen_string_literal: true

class Invoices::ActionTrailsPolicy < ApplicationPolicy
  def show?
    user_owner_role? || user_admin_role?
  end
end
