# frozen_string_literal: true

require "rails_helper"

RSpec.describe "MCP write tools" do
  around do |example|
    Rails.cache.clear
    example.run
    Rails.cache.clear
  end

  let(:server_context) { { authorization: "token-123" } }

  describe "dry_run safety behavior" do
    it "returns write preview for miru.time.create and sanitizes source metadata" do
      response = MCP::Miru::Tools::TimeCreateTool.call(
        project_id: 1,
        duration_minutes: 30,
        work_date: "2026-04-22",
        note: "Draft entry",
        source_metadata: {
          tool: "codex",
          skill: "miru-mcp",
          pii: "drop"
        },
        dry_run: true,
        server_context:
      )

      payload = JSON.parse(response.content.first.fetch(:text))
      expect(response.error?).to eq(false)
      expect(payload["dry_run"]).to eq(true)
      expect(payload.dig("request", "method")).to eq("POST")
      expect(payload.dig("request", "path")).to eq("/api/v1/cli/timesheet_entries")
      expect(payload.dig("request", "body", "timesheet_entry", "source_metadata")).to eq({
        "tool" => "codex",
        "skill" => "miru-mcp",
        "mcp_server" => "miru"
      })
    end

    it "returns write preview for miru.time.update" do
      response = MCP::Miru::Tools::TimeUpdateTool.call(
        id: 10,
        project_id: 2,
        duration_minutes: 45,
        work_date: "2026-04-22",
        dry_run: true,
        server_context:
      )

      payload = JSON.parse(response.content.first.fetch(:text))
      expect(response.error?).to eq(false)
      expect(payload.dig("request", "method")).to eq("PATCH")
      expect(payload.dig("request", "path")).to eq("/api/v1/cli/timesheet_entries/10")
      expect(payload.dig("request", "body", "timesheet_entry")).to eq({
        "project_id" => 2,
        "duration_minutes" => 45,
        "work_date" => "2026-04-22"
      })
    end

    it "returns write preview for miru.time.delete" do
      response = MCP::Miru::Tools::TimeDeleteTool.call(id: 77, dry_run: true, server_context:)

      payload = JSON.parse(response.content.first.fetch(:text))
      expect(response.error?).to eq(false)
      expect(payload.dig("request", "method")).to eq("DELETE")
      expect(payload.dig("request", "path")).to eq("/api/v1/cli/timesheet_entries/77")
    end

    it "returns write preview for miru.expense.create" do
      response = MCP::Miru::Tools::ExpenseCreateTool.call(
        amount: 19.99,
        date: "2026-04-22",
        category_name: "Travel",
        description: "Taxi",
        dry_run: true,
        server_context:
      )

      payload = JSON.parse(response.content.first.fetch(:text))
      expect(response.error?).to eq(false)
      expect(payload.dig("request", "method")).to eq("POST")
      expect(payload.dig("request", "path")).to eq("/api/v1/cli/expenses")
    end

    it "returns write preview for miru.invoice.create" do
      response = MCP::Miru::Tools::InvoiceCreateTool.call(
        client_id: 42,
        invoice_number: "INV-MCP-001",
        issue_date: "2026-05-19",
        due_date: "2026-06-18",
        currency: "USD",
        line_items: [
          {
            name: "Implementation",
            description: "API work",
            date: "2026-05-19",
            rate: 150,
            quantity: 120
          }
        ],
        invoice_taxes: [{ tax_configuration_id: 3 }],
        dry_run: true,
        server_context:
      )

      payload = JSON.parse(response.content.first.fetch(:text))
      expect(response.error?).to eq(false)
      expect(payload.dig("request", "method")).to eq("POST")
      expect(payload.dig("request", "path")).to eq("/api/v1/invoices")
      expect(payload.dig("request", "body", "invoice", "invoice_line_items_attributes").first).to include(
        "name" => "Implementation",
        "quantity" => 120
      )
      expect(payload.dig("request", "body", "invoice", "invoice_taxes_attributes").first).to eq(
        "tax_configuration_id" => 3
      )
    end

    it "compacts recipient list for miru.invoice.send" do
      response = MCP::Miru::Tools::InvoiceSendTool.call(
        id: 123,
        recipients: ["billing@example.com", nil, ""],
        subject: "Invoice",
        dry_run: true,
        server_context:
      )

      payload = JSON.parse(response.content.first.fetch(:text))
      expect(response.error?).to eq(false)
      expect(payload.dig("request", "method")).to eq("POST")
      expect(payload.dig("request", "path")).to eq("/api/v1/invoices/123/send_invoice")
      expect(payload.dig("request", "body", "invoice_email", "recipients")).to eq(["billing@example.com"])
    end
  end

  describe "idempotency and auth normalization" do
    let(:result) do
      MCP::Miru::ApiProxy::Result.new(
        status: 200,
        headers: { "content-type" => "application/json" },
        body: '{"ok":true}',
        json: { "ok" => true }
      )
    end

    it "uses idempotency store and normalized bearer token for write calls" do
      allow(MCP::Miru::ApiProxy).to receive(:request).and_return(result)
      allow(MCP::Miru::IdempotencyStore).to receive(:fetch).and_call_original

      response = MCP::Miru::Tools::TimeCreateTool.call(
        project_id: 1,
        duration_minutes: 60,
        work_date: "2026-04-22",
        idempotency_key: "entry-1",
        server_context: { authorization: "raw-token" }
      )

      expect(response.error?).to eq(false)
      expect(MCP::Miru::IdempotencyStore).to have_received(:fetch).with(
        tool_name: "miru.time.create",
        idempotency_key: "entry-1",
        authorization: "Bearer raw-token"
      )
      expect(MCP::Miru::ApiProxy).to have_received(:request).once
    end

    it "skips idempotency store for dry_run writes" do
      allow(MCP::Miru::IdempotencyStore).to receive(:fetch)

      MCP::Miru::Tools::TimeDeleteTool.call(
        id: 5,
        dry_run: true,
        idempotency_key: "delete-5",
        server_context:
      )

      expect(MCP::Miru::IdempotencyStore).not_to have_received(:fetch)
    end

    it "returns stable write error code without leaking exception text" do
      allow(MCP::Miru::IdempotencyStore).to receive(:fetch).and_raise(StandardError, "sensitive upstream detail")

      response = MCP::Miru::Tools::TimeCreateTool.call(
        project_id: 1,
        duration_minutes: 60,
        work_date: "2026-04-22",
        server_context:
      )

      payload = JSON.parse(response.content.first.fetch(:text))
      expect(response.error?).to eq(true)
      expect(payload["error"]).to eq("Request failed")
      expect(payload.dig("details", "code")).to eq("REQUEST_FAILED")
      expect(payload.dig("details", "error")).to be_nil
      expect(payload.to_json).not_to include("sensitive upstream detail")
    end
  end
end
