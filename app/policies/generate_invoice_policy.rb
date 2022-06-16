# frozen_string_literal: true

class GenerateInvoicePolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role?
  end

  def show?
    user_owner_role? || user_admin_role?
  end
end
