# frozen_string_literal: true

module MCP
  module Miru
    class ServerFactory
      TOOLS = [
        MCP::Miru::Tools::CapabilitiesTool,
        MCP::Miru::Tools::WorkspaceWhoamiTool,
        MCP::Miru::Tools::ProjectListTool,
        MCP::Miru::Tools::ClientListTool,
        MCP::Miru::Tools::TimeListTool,
        MCP::Miru::Tools::TimeCreateTool,
        MCP::Miru::Tools::TimeUpdateTool,
        MCP::Miru::Tools::TimeDeleteTool,
        MCP::Miru::Tools::InvoiceListTool,
        MCP::Miru::Tools::InvoiceShowTool,
        MCP::Miru::Tools::InvoiceSendTool,
        MCP::Miru::Tools::PaymentListTool,
        MCP::Miru::Tools::PaymentShowTool,
        MCP::Miru::Tools::ExpenseListTool,
        MCP::Miru::Tools::ExpenseCreateTool
      ].freeze

      class << self
        def build(server_context:)
          context = normalized_context(server_context)
          pro_access = context.fetch(:pro_access) do
            MCP::Miru::ProAccessChecker.pro_access?(authorization: context[:authorization])
          end

          MCP::Server.new(
            name: "miru_mcp_server",
            title: "Miru MCP",
            version: miru_version,
            instructions: "Use namespaced miru.* tools that map to Miru CLI capabilities.",
            tools: pro_access ? TOOLS : [],
            server_context: context.merge(pro_access: pro_access)
          )
        end

        private

          def normalized_context(server_context)
            server_context.to_h.deep_symbolize_keys
          rescue StandardError
            {}
          end

          def miru_version
            @miru_version ||= File.read(Rails.root.join("VERSION")).strip
          rescue StandardError
            "0.0.0"
          end
      end
    end
  end
end
