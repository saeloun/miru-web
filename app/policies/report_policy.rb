# frozen_string_literal: true

class ReportPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_book_keeper_role?
  end

  def download?
    user_owner_role? || user_admin_role? || user_book_keeper_role?
  end

  def share?
    user_owner_role? || user_admin_role? || user_book_keeper_role?
  end

  def new?
    user_owner_role? || user_admin_role?
  end
end
