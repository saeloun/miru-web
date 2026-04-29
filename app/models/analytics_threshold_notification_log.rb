# frozen_string_literal: true

class AnalyticsThresholdNotificationLog < ApplicationRecord
  belongs_to :company

  validates :alert_type, presence: true
  validates :company_id, uniqueness: { scope: :alert_type }
end
