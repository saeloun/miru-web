# frozen_string_literal: true

class Api::V1::Cli::CapabilitiesController < Api::V1::Cli::BaseController
  def show
    skip_authorization

    render json: {
      commands: [
        {
          name: "time create",
          description: "Create a timesheet entry for the authenticated user, including optional AI tool metadata for Claude, Codex, MCP, and other automations",
          supports_source_metadata: true
        },
        {
          name: "time list",
          description: "List the authenticated user's timesheet entries within a date range"
        },
        {
          name: "time update",
          description: "Update one of the authenticated user's timesheet entries and preserve or change AI tool metadata",
          supports_source_metadata: true
        },
        {
          name: "time delete",
          description: "Delete one of the authenticated user's timesheet entries"
        },
        {
          name: "project list",
          description: "List projects visible to the authenticated user"
        },
        {
          name: "client list",
          description: "List clients visible to the authenticated user"
        },
        {
          name: "invoice list",
          description: "List invoices visible to the authenticated user"
        },
        {
          name: "invoice create",
          description: "Create a draft invoice with one or more line items"
        },
        {
          name: "invoice show",
          description: "Show a single invoice"
        },
        {
          name: "invoice send",
          description: "Send a single invoice to one or more recipients"
        },
        {
          name: "payment list",
          description: "List payments visible to the authenticated user"
        },
        {
          name: "payment show",
          description: "Show a single payment"
        },
        {
          name: "expense list",
          description: "List expenses and expense metadata visible to the authenticated user"
        },
        {
          name: "expense create",
          description: "Create an expense in the current workspace"
        }
      ]
    }, status: 200
  end
end
