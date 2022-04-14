# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  def index?
    user_owner_or_admin?
  end

  def create?
    user_owner_or_admin?
  end

  def update?
    user_owner_or_admin?
  end

  def show?
    user_owner_or_admin?
  end

  def permitted_attributes
    [
      :issue_date, :due_date,
      :invoice_number, :reference, :amount,
      :outstanding_amount, :tax, :amount_paid,
      :amount_due, :discount, :client_id
    ]
  end
end
