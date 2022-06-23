# frozen_string_literal: true

class ReportPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role?
  end

  def download?
    user_owner_role? || user_admin_role?
  end
end
