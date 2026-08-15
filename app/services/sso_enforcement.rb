# frozen_string_literal: true

class SsoEnforcement
  SSO_REQUIRED_MESSAGE = "Your workspace requires SSO sign-in. Use Google or GitHub."
  DOMAIN_NOT_ALLOWED_MESSAGE = "Your email domain is not allowed by your workspace."

  def initialize(user)
    @user = user
  end

  def password_error
    domain_error || sso_required_error
  end

  def oauth_error
    domain_error
  end

  private

    attr_reader :user

    def domain_error
      restricted = companies.select do |company|
        company.allowed_sso_domains.present? && !company.allowed_sso_domains.include?(email_domain)
      end

      DOMAIN_NOT_ALLOWED_MESSAGE if restricted.any? && !owner_of_every?(restricted)
    end

    def sso_required_error
      enforced = companies.select(&:sso_enforced?)
      SSO_REQUIRED_MESSAGE if enforced.any? && !owner_of_every?(enforced)
    end

    def companies
      @companies ||= user.companies.merge(Employment.kept).distinct.to_a
    end

    def email_domain
      user.email.to_s.downcase.split("@", 2).last
    end

    def owner_of_every?(workspaces)
      workspaces.all? { |workspace| user.has_role?(:owner, workspace) }
    end
end
