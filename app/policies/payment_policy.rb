# frozen_string_literal: true

class PaymentPolicy < ApplicationPolicy
  def index?
    user_owner_or_admin_or_book_keeper_role?
  end
end
