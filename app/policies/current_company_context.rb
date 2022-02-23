# frozen_string_literal: true

class CurrentCompanyContext
  attr_reader :user, :company

  def initialize(user, company)
    @user = user
    @company = company
  end
end
