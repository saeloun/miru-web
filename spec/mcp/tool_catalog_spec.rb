# frozen_string_literal: true

require "rails_helper"

RSpec.describe MCP::Miru::ToolCatalog do
  it "contains namespaced tools matching CLI surface" do
    expect(described_class.names).to match_array([
      "miru.capabilities",
      "miru.workspace.whoami",
      "miru.project.list",
      "miru.client.list",
      "miru.time.list",
      "miru.time.create",
      "miru.time.update",
      "miru.time.delete",
      "miru.invoice.list",
      "miru.invoice.show",
      "miru.invoice.send",
      "miru.payment.list",
      "miru.payment.show",
      "miru.expense.list",
      "miru.expense.create"
    ])
  end
end
