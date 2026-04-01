# frozen_string_literal: true

require "rails_helper"

RSpec.describe "SPA routes", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  [
    "/time-tracking",
    "/expenses",
    "/settings/profile",
    "/settings/employment",
    "/settings/organization",
    "/settings/holidays",
    "/settings/leaves",
    "/my-leaves"
  ].each do |path|
    it "renders the SPA shell for #{path}" do
      get path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("react-root")
    end
  end

  it "renders the SPA shell for invoice details" do
    client = create(:client, company:)
    invoice = create(:invoice, company:, client:)

    get "/invoices/#{invoice.id}"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("react-root")
  end
end
