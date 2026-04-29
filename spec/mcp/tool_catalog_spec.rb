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

  it "keeps all tools namespaced and unique" do
    names = described_class::TOOLS.pluck(:name)

    expect(names).to all(start_with("miru."))
    expect(names.uniq.size).to eq(names.size)
  end

  it "contains both read-only and write tools" do
    readonly_values = described_class::TOOLS.pluck(:read_only).uniq

    expect(readonly_values).to include(true, false)
  end
end
