# frozen_string_literal: true

# frozen_string_literal

class WisePolicy < ApplicationPolicy
  def fetch_bank_requirements?
    true
  end

  def validate_account_details?
    true
  end
end
