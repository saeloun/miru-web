# frozen_string_literal: true

# Allow BigDecimal and other classes for Psych 5+ (Ruby 4.0+)
# Psych 5 restricts both safe_load and dump (via RestrictedYAMLTree).
# BigDecimal must be explicitly permitted for ActiveRecord YAML serialization,
# ActiveJob argument serialization, and any other YAML round-trip.
require "bigdecimal"
require "bigdecimal/util"

Rails.application.config.active_record.yaml_column_permitted_classes = [
  Symbol,
  Date,
  Time,
  DateTime,
  BigDecimal,
  ActiveSupport::TimeWithZone,
  ActiveSupport::TimeZone,
  ActiveSupport::HashWithIndifferentAccess
]
