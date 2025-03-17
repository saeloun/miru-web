# frozen_string_literal: true

class InvoicePolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_book_keeper_role? || user_client_role?
  end

  def create?
    user_owner_role? || user_admin_role?
  end

  def show?
    authorize_owner_admin_book_keeper_client
  end

  def update?
    authorize_owner_admin
  end

  def destroy?
    authorize_owner_admin
  end

  def edit?
    authorize_owner_admin
  end

  def send_invoice?
    authorize_owner_admin
  end

  def download?
    authorize_owner_admin_book_keeper_client
  end

  def send_reminder?
    authorize_owner_admin
  end

  def permitted_attributes
    [
      :issue_date, :due_date, :status,
      :invoice_number, :reference, :amount,
      :outstanding_amount, :tax, :amount_paid,
      :amount_due, :discount, :client_id,
      :external_view_key, :stripe_enabled, :base_currency_amount,
      invoice_line_items_attributes: [
        :id, :name, :description,
        :date, :timesheet_entry_id,
        :rate, :quantity, :_destroy
      ]
    ]
  end

  def authorize_current_user
    if user.current_workspace_id == record.company.id
      true
    else
      @error_message_key = :different_workspace
      false
    end
  end

  def authorize_owner_admin_book_keeper
    authorize_current_user && (user_owner_role? || user_admin_role? || user_book_keeper_role?)
  end

  def authorize_owner_admin
    authorize_current_user && (user_owner_role? || user_admin_role?)
  end

  def authorize_owner_admin_book_keeper_client
    authorize_current_user && (user_owner_role? || user_admin_role? || user_book_keeper_role? || user_client_role?)
  end
end
