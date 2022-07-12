# frozen_string_literal: true

class PaymentsPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role?
  end

  def create?
    user_owner_role? || user_admin_role?
  end

  def permitted_attributes
    [
      :invoice_id, :transaction_date, :transaction_type, :amount, :note
    ]
  end
end
