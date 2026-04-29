# frozen_string_literal: true

module MCP
  module Miru
    class ProAccessChecker
      class << self
        def pro_access?(authorization:)
          response = MCP::Miru::ApiProxy.request(
            method: :get,
            path: "/api/v1/subscription",
            authorization: authorization
          )

          response.success? && response.json.is_a?(Hash) && response.json["pro_access"] == true
        rescue StandardError
          false
        end
      end
    end
  end
end
