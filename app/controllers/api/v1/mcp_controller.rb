# frozen_string_literal: true

class Api::V1::MCPController < Api::V1::ApplicationController
  skip_after_action :verify_authorized

  before_action :ensure_mcp_enabled!
  before_action :validate_origin_header!
  before_action :ensure_pro_access!

  def handle
    server = MCP::Miru::ServerFactory.build(server_context: mcp_server_context)
    transport = MCP::Server::Transports::StreamableHTTPTransport.new(server, stateless: true)
    status, response_headers, body = transport.handle_request(request)

    response_headers.each { |key, value| response.set_header(key, value) }
    self.status = status
    self.response_body = body
  end

  private

    def mcp_server_context
      {
        authorization: request.headers["Authorization"],
        user_id: current_user.id,
        company_id: current_company.id,
        pro_access: current_company.pro_access?
      }
    end

    def ensure_mcp_enabled!
      return if mcp_enabled?

      render_mcp_error(
        status: 404,
        code: -32004,
        message: "MCP endpoint is disabled",
        data: { error: "feature_disabled" }
      )
    end

    def mcp_enabled?
      ActiveModel::Type::Boolean.new.cast(ENV.fetch("MCP_SERVER_ENABLED", "true"))
    end

    def ensure_pro_access!
      return if current_company.pro_access?

      render_mcp_error(
        status: 403,
        code: -32003,
        message: "MCP is a Pro feature",
        data: {
          error: "forbidden_feature",
          upgrade_path: "/settings/billing"
        }
      )
    end

    def validate_origin_header!
      origin = request.headers["Origin"].to_s.strip
      return if origin.blank?
      return if allowed_origins.include?(origin)

      render_mcp_error(
        status: 403,
        code: -32001,
        message: "Invalid Origin header",
        data: {
          error: "invalid_origin"
        }
      )
    end

    def allowed_origins
      configured = ENV.fetch("MCP_ALLOWED_ORIGINS", "")
        .split(/[,\s]+/)
        .map(&:strip)
        .reject(&:blank?)

      configured.presence || [request.base_url]
    end

    def render_mcp_error(status:, code:, message:, data: nil)
      render json: {
        jsonrpc: "2.0",
        id: jsonrpc_id,
        error: {
          code: code,
          message: message,
          data: data
        }.compact
      }, status: status
    end

    def jsonrpc_id
      return unless request.post?

      raw_body = request.raw_post.to_s
      return if raw_body.blank?

      payload = JSON.parse(raw_body)
      payload.is_a?(Hash) ? payload["id"] : nil
    rescue JSON::ParserError
      nil
    end
end
