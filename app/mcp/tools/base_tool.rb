# frozen_string_literal: true

module MCP
  module Miru
    module Tools
      class BaseTool < MCP::Tool
        class << self
          private

            def proxy_request(method:, path:, server_context:, params: nil, body: nil)
              MCP::Miru::ApiProxy.request(
                method: method,
                path: path,
                params: params,
                body: body,
                authorization: authorization_from(server_context)
              )
            end

            def write_request(method:, path:, server_context:, body: nil, dry_run: false, idempotency_key: nil)
              return dry_run_response(method:, path:, body:) if dry_run

              result = MCP::Miru::IdempotencyStore.fetch(
                tool_name: tool_name,
                idempotency_key: idempotency_key,
                authorization: authorization_from(server_context)
              ) do
                proxy_request(method:, path:, server_context:, body:)
              end

              response_from_result(result)
            rescue StandardError => e
              Rails.logger.error("[MCP][#{tool_name}] write_request failed: #{e.class}: #{e.message}")
              error_response("Request failed", details: { code: "REQUEST_FAILED" })
            end

            def response_from_result(result)
              payload = result.json.is_a?(Hash) || result.json.is_a?(Array) ? result.json : { raw_body: result.body }

              MCP::Tool::Response.new(
                [{
                  type: "text",
                  text: JSON.pretty_generate({
                    status: result.status,
                    data: payload
                  })
                }],
                error: !result.success?
              )
            end

            def dry_run_response(method:, path:, body:)
              MCP::Tool::Response.new(
                [{
                  type: "text",
                  text: JSON.pretty_generate({
                    dry_run: true,
                    request: {
                      method: method.to_s.upcase,
                      path: path,
                      body: body
                    }
                  })
                }]
              )
            end

            def error_response(message, details: {})
              normalized_details = details.to_h.deep_stringify_keys.except("error")

              MCP::Tool::Response.new(
                [{
                  type: "text",
                  text: JSON.pretty_generate({
                    error: message,
                    details: normalized_details.presence
                  })
                }],
                error: true
              )
            end

            def context(server_context)
              server_context.to_h.deep_symbolize_keys
            rescue StandardError
              {}
            end

            def authorization_from(server_context)
              token = context(server_context)[:authorization].to_s.strip
              return token if token.start_with?("Bearer ")

              token.present? ? "Bearer #{token}" : ""
            end

            def merged_source_metadata(source_metadata)
              metadata = source_metadata.is_a?(Hash) ? source_metadata.deep_stringify_keys : {}
              metadata["mcp_server"] = "miru"
              metadata.slice("tool", "skill", "mcp_server")
            end
        end
      end
    end
  end
end
