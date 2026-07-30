# frozen_string_literal: true

class Invoices::ActionTrailsPolicy < ApplicationPolicy
  def show?
    record.company_id == user.current_workspace_id && (user_owner_role? || user_admin_role?)
  end
end
