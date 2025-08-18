# Allow BigDecimal and other classes for Rails 7.1+
require "bigdecimal"
require "bigdecimal/util"

Rails.application.config.after_initialize do
  if defined?(Psych)
    # Permit additional classes for YAML loading
    permitted_classes = [
      Symbol,
      Date,
      Time,
      DateTime,
      BigDecimal,
      ActiveSupport::TimeWithZone,
      ActiveSupport::TimeZone,
      ActiveSupport::HashWithIndifferentAccess
    ]

    # Configure Psych for Rails
    Rails.application.config.active_record.yaml_column_permitted_classes = permitted_classes
  end
end
