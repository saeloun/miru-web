# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self, :https
    policy.font_src :self, :https, :data, "https://fonts.googleapis.com", "https://fonts.gstatic.com"
    policy.img_src :self, :https, :data, :blob
    policy.object_src :none
    policy.script_src :self, :https, "https://cdn.tailwindcss.com"

    # Allow Vite to hot reload in development
    if Rails.env.development?
      policy.script_src(*policy.script_src, :unsafe_eval, "http://#{ ViteRuby.config.host_with_port }")
      policy.connect_src :self, :https, "http://localhost:3036", "ws://localhost:3036"
    end

    # Allow blob URLs in test environment
    policy.script_src(*policy.script_src, :blob) if Rails.env.test?

    policy.style_src :self, :https, :unsafe_inline

    # Allow Vite to hot reload style changes in development
    policy.style_src(*policy.style_src, :unsafe_inline) if Rails.env.development?

    # Specify URI for violation reports
    # policy.report_uri "/csp-violation-report-endpoint"
  end

  # Generate session nonces for permitted importmap, inline scripts, and inline styles.
  config.content_security_policy_nonce_generator = ->(request) { SecureRandom.base64(16) }
  config.content_security_policy_nonce_directives = %w(script-src style-src)

  # Report violations without enforcing the policy.
  # config.content_security_policy_report_only = true
end
