# frozen_string_literal: true

class Invoices::BulkDeletionPolicy < ApplicationPolicy
  def create?
    user_owner_or_admin?
  end
end
