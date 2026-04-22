# frozen_string_literal: true

require Rails.root.join("app/mcp/api_proxy")
require Rails.root.join("app/mcp/idempotency_store")
require Rails.root.join("app/mcp/pro_access_checker")
require Rails.root.join("app/mcp/tool_catalog")
require Rails.root.join("app/mcp/tools/base_tool")

Dir[Rails.root.join("app/mcp/tools/*.rb")].sort.each do |file|
  next if file.end_with?("base_tool.rb")

  require file
end

require Rails.root.join("app/mcp/server_factory")
