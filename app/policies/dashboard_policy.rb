# frozen_string_literal: true

class DashboardPolicy < ApplicationPolicy
  def index?
    user.present?
  end
end
