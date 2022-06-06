# frozen_string_literal: true

class Payments::ProviderPolicy < ApplicationPolicy
  def index?
    user_owner_or_admin?
  end

  def create?
    user_owner_or_admin?
  end

  def update?
    user_owner_or_admin?
  end
end
