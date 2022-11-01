# frozen_string_literal: true

class GenerateInvoicePolicy < ApplicationPolicy
  def index?
    authorize_current_user
  end

  def authorize_current_user
    unless user.current_workspace_id == record.company_id
      @error_message_key = :different_workspace
      return false
    end

    user_owner_role? || user_admin_role?
  end
end
