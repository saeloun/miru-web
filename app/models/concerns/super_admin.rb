# frozen_string_literal: true

module SuperAdmin
  extend ActiveSupport::Concern

  SUPER_ADMIN_EMAILS = [
    "vipul@example.com",
    "hello@example.com",
    "hello@saeloun.com" # Adding the existing test user
  ].freeze

  included do
    scope :super_admins, -> { where(email: SUPER_ADMIN_EMAILS) }
  end

  def super_admin?
    SUPER_ADMIN_EMAILS.include?(email)
  end

  def has_analytics_access?
    super_admin? || has_role?(:owner) || has_role?(:admin)
  end

  class_methods do
    def super_admin_emails
      SUPER_ADMIN_EMAILS
    end
  end
end
