# frozen_string_literal: true

class WisePolicy < ApplicationPolicy
  def fetch_bank_requirements?
    true
  end

  def validate_account_details?
    true
  end
end
