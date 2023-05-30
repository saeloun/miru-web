# frozen_string_literal: true

class Invoices::WaivedPolicy < ApplicationPolicy
  def update?
    user_owner_role? || user_admin_role?
  end
end
