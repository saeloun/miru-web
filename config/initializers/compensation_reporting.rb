# frozen_string_literal: true

Rails.application.config.x.compensation_report_export_ttl = ENV.fetch("COMPENSATION_REPORT_EXPORT_TTL", "900").to_i.clamp(60, 86_400)
