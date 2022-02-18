# frozen_string_literal: true

class ClientPolicy < ApplicationPolicy
  def create?
    user_owner_or_admin?
  end

  def permitted_attributes
    [:name, :email, :phone, :address]
  end
end
