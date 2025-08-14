# frozen_string_literal: true

# Set default test environment variables for Wise API if not already set
ENV["WISE_API_URL"] ||= "https://api.sandbox.transferwise.tech"
ENV["WISE_PROFILE_ID"] ||= "123456"
ENV["WISE_ACCESS_TOKEN"] ||= "access-token-12345"
