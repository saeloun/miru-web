# frozen_string_literal: true

class HolidayPolicy < ApplicationPolicy
  def create?
    authorize_current_user
  end

  def index?
    authorize_current_user
  end

  def authorize_current_user
    user_owner_role? || user_admin_role?
  end
end
