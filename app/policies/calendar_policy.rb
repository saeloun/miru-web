# frozen_string_literal: true

class CalendarPolicy < ApplicationPolicy
  def redirect?
    all_role?
  end

  def callback?
    all_role?
  end

  def calendars?
    all_role?
  end

  def events?
    all_role?
  end

  private

    def all_role?
      user_owner_role? || user_admin_role? || user_book_keeper_role? || user_client_role? || user_employee_role?
    end
end
