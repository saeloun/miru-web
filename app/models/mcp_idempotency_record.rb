# frozen_string_literal: true

class MCPIdempotencyRecord < ApplicationRecord
  scope :expired, -> { where(expires_at: ..Time.current) }
end
