# frozen_string_literal: true

class Profiles::BillingPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    true
  end

  def update?
    true
  end
end
