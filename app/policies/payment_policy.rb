# frozen_string_literal: true

class PaymentPolicy < ApplicationPolicy
  def index?
    user_book_keeper_role? || user_owner_role? || user_admin_role?
  end

  def show?
    index?
  end

  def bulk_download?
    index?
  end

  def create?
    user_owner_role? || user_admin_role? || user_book_keeper_role?
  end

  def new?
    user_owner_role? || user_admin_role? || user_book_keeper_role?
  end

  def withdraw?
    user_owner_role? || user_admin_role?
  end
end
