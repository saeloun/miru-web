# frozen_string_literal: true

class InvoicePolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_book_keeper_role?
  end

  def create?
    user_owner_role? || user_admin_role?
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

  def edit?
    authorize_current_user
  end

  def send_invoice?
    authorize_current_user
  end

  def download?
    authorize_current_user
  end

  def bulk_download?
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

  def authorize_current_user
    unless user.current_workspace_id == record.company.id
      @error_message_key = :different_workspace
      return false
    end

    user_owner_role? || user_admin_role?
  end
end
