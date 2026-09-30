# frozen_string_literal: true

RailsEventViewer.configure do |config|
  config.group_keys = [:request_id, :data_import_id]
  config.authentication = ->(controller) { controller.current_user&.super_admin? }
end
