# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Reports::PaymentsController#download", type: :request do
  let(:company) { create(:company, plan_tier: "paid") }
  let(:admin) { create(:user, current_workspace_id: company.id) }

  before do
    allow(Ferrum::Browser).to receive(:new).and_call_original
    create(:employment, company:, user: admin)
    admin.add_role :admin, company
    sign_in admin
  end

  it "downloads a PDF report" do
    send_request :get, "/api/v1/reports/payments/download.pdf", headers: auth_headers(admin)

    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("application/pdf")
    expect(response.body[0, 4]).to eq("%PDF")
    expect(response.headers["Content-Disposition"]).to include("payment_report_#{Date.current}.pdf")
  end
end
