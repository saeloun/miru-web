# frozen_string_literal: true

require "rails_helper"

RSpec.describe "MCP tool role matrix" do
  let(:company) { create(:company, plan_tier: "paid") }
  let(:client_record) { create(:client, company: company) }
  let(:project) { create(:project, billable: true, client: client_record) }
  let!(:invoice) { create(:invoice, company: company, client: client_record) }
  let!(:payment) { create(:payment, invoice: invoice) }

  def create_user_with_role(role)
    user = create(:user, current_workspace_id: company.id)
    create(:employment, company: company, user: user)
    user.add_role(role, company)
    create(:project_member, project: project, user: user) if role == :employee
    token = CliSession.issue_for(user: user, company: company).last
    [user, token]
  end

  def server_context_for(token)
    { authorization: "Bearer #{token}", host: "www.example.com" }
  end

  def response_status(response)
    JSON.parse(response.content.first.fetch(:text)).fetch("status")
  end

  it "enforces payment list access by role" do
    expected = {
      owner: 200,
      admin: 200,
      book_keeper: 200,
      employee: 403,
      client: 403
    }

    expected.each do |role, status_code|
      _user, token = create_user_with_role(role)
      response = MCP::Miru::Tools::PaymentListTool.call(
        query: "",
        server_context: server_context_for(token)
      )

      expect(response_status(response)).to eq(status_code)
      expect(response.error?).to eq(status_code >= 400)
    end
  end

  it "enforces client list access by role" do
    expected = {
      owner: 200,
      admin: 200,
      book_keeper: 200,
      employee: 403,
      client: 403
    }

    expected.each do |role, status_code|
      _user, token = create_user_with_role(role)
      response = MCP::Miru::Tools::ClientListTool.call(
        query: "",
        server_context: server_context_for(token)
      )

      expect(response_status(response)).to eq(status_code)
      expect(response.error?).to eq(status_code >= 400)
    end
  end

  it "enforces expense list access by role" do
    expected = {
      owner: 200,
      admin: 200,
      book_keeper: 200,
      employee: 200,
      client: 403
    }

    expected.each do |role, status_code|
      _user, token = create_user_with_role(role)
      response = MCP::Miru::Tools::ExpenseListTool.call(
        query: "",
        server_context: server_context_for(token)
      )

      expect(response_status(response)).to eq(status_code)
      expect(response.error?).to eq(status_code >= 400)
    end
  end

  it "does not allow deleting another user's timesheet entry, even for owner" do
    other_user, _other_token = create_user_with_role(:employee)
    other_entry = create(:timesheet_entry, user: other_user, project: project)

    _owner, owner_token = create_user_with_role(:owner)
    response = MCP::Miru::Tools::TimeDeleteTool.call(
      id: other_entry.id,
      server_context: server_context_for(owner_token)
    )

    expect(response_status(response)).to eq(404)
    expect(response.error?).to eq(true)
  end
end
