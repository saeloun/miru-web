# frozen_string_literal: true

class CalendarPolicy < ApplicationPolicy
  def redirect?
    user_owner_role? || user_admin_role? || user_book_keeper_role? || user_client_role?
  end

  def callback?
    user_owner_role? || user_admin_role? || user_book_keeper_role? || user_client_role?
  end

  def calendars?
    user_owner_role? || user_admin_role? || user_book_keeper_role? || user_client_role?
  end
end
