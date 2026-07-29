# frozen_string_literal: true

module SuperAdmin
  extend ActiveSupport::Concern

  SUPER_ADMIN_EMAILS = [
    "hello@saeloun.com"
  ].freeze

  included do
    scope :super_admins, -> { where(email: SUPER_ADMIN_EMAILS).where.not(confirmed_at: nil) }
  end

  def super_admin?
    confirmed? && SUPER_ADMIN_EMAILS.include?(email)
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
