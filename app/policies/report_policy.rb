# frozen_string_literal: true

class ReportPolicy < ApplicationPolicy
  def index?
    user_owner_or_admin?
  end

  def create?
    user_owner_or_admin?
  end
end
