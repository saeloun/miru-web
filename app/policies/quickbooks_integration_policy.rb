# frozen_string_literal: true

class QuickbooksIntegrationPolicy < ApplicationPolicy
  def status?
    user_owner_role? || user_admin_role?
  end

  def connect?
    status?
  end

  def callback?
    status?
  end

  def disconnect?
    status?
  end

  def settings?
    status?
  end
end
