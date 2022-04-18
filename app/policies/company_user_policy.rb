# frozen_string_literal: true

class CompanyUserPolicy < ApplicationPolicy
  def index?
    user_owner_or_admin?
  end
end
