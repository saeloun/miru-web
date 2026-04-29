# frozen_string_literal: true

module MCP
  module Miru
    module ToolCatalog
      TOOLS = [
        { name: "miru.capabilities", description: "List Miru MCP tool capabilities", read_only: true },
        { name: "miru.workspace.whoami", description: "Get authenticated user and workspace details", read_only: true },
        { name: "miru.project.list", description: "List projects visible to the authenticated user", read_only: true },
        { name: "miru.client.list", description: "List clients visible to the authenticated user", read_only: true },
        { name: "miru.time.list", description: "List timesheet entries in a date range", read_only: true },
        { name: "miru.time.create", description: "Create a timesheet entry", read_only: false },
        { name: "miru.time.update", description: "Update a timesheet entry", read_only: false },
        { name: "miru.time.delete", description: "Delete a timesheet entry", read_only: false },
        { name: "miru.invoice.list", description: "List invoices visible to the authenticated user", read_only: true },
        { name: "miru.invoice.show", description: "Show one invoice", read_only: true },
        { name: "miru.invoice.send", description: "Send one invoice email", read_only: false },
        { name: "miru.payment.list", description: "List payments visible to the authenticated user", read_only: true },
        { name: "miru.payment.show", description: "Show one payment", read_only: true },
        { name: "miru.expense.list", description: "List expenses visible to the authenticated user", read_only: true },
        { name: "miru.expense.create", description: "Create one expense", read_only: false }
      ].freeze

      def self.names
        TOOLS.pluck(:name)
      end
    end
  end
end
