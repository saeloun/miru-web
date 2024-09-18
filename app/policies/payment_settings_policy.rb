# frozen_string_literal: true

class PaymentSettingsPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role?
  end

  def connect_stripe?
    user_owner_role? || user_admin_role?
  end

  def destroy?
    user_owner_role? || user_admin_role?
  end

  def refresh_stripe_connect?
    user_owner_role? || user_admin_role?
  end

  def update_bank_account?
    user_owner_role? || user_admin_role?
  end
end
