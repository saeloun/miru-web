# frozen_string_literal: true

class PaymentSettingsPolicy < ApplicationPolicy
  def index?
    user_owner_or_admin?
  end

  def connect_stripe?
    user_owner_or_admin?
  end

  def refresh_stripe_connect?
    user_owner_or_admin?
  end
end
