# frozen_string_literal: true

class CurrentCompanyPolicy < ApplicationPolicy
  attr_reader :user, :context, :company, :error_message_key

  def initialize(user, context)
    @user = user
    @context = context
    @company = context.try(:company)
  end

  def company_present?
    if user.present? && company.nil?
      @error_message_key = :company_not_present
      return false
    end

    true
  end
end
