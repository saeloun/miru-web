# frozen_string_literal: true

class PaymentPolicy < ApplicationPolicy
  def index?
    user_book_keeper_role? || user_owner_role? || user_admin_role?
  end

  def create?
    user_owner_role? || user_admin_role?
  end
end
