# frozen_string_literal: true

class InvoicePolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_book_keeper_role?
  end

  def create?
    user_owner_role? || user_admin_role?
  end

  def update?
    user_owner_role? || user_admin_role?
  end

  def show?
    user_owner_role? || user_admin_role?
  end

  def destroy?
    user_owner_role? || user_admin_role?
  end

  def edit?
    user_owner_role? || user_admin_role?
  end

  def send_invoice?
    user_owner_role? || user_admin_role?
  end

  def download?
    user_owner_role? || user_admin_role?
  end

  def permitted_attributes
    [
      :issue_date, :due_date,
      :invoice_number, :reference, :amount,
      :outstanding_amount, :tax, :amount_paid,
      :amount_due, :discount, :client_id, :external_view_key,
      invoice_line_items_attributes: [
        :id, :name, :description,
        :date, :timesheet_entry_id,
        :rate, :quantity, :_destroy
      ]
    ]
  end
end
