# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::UsersController, type: :controller do
  routes do
    ActionDispatch::Routing::RouteSet.new.tap do |set|
      set.draw { get "me", to: "api/v1/users#me" }
    end
  end

  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user:, joined_at: nil, resigned_at: nil) }

  before do
    user.add_role(:admin, company)
    sign_in user
    # This legacy renderer is unrouted and has no Pundit action authorization.
    allow(controller).to receive(:verify_authorized)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(nil)
  end

  it "derives records availability for an incomplete profile without enabling native payroll" do
    get :me, format: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("company"))
      .to include("id" => company.id, "employee_records_available" => true, "payroll_review_enabled" => false)
    expect(response.parsed_body.fetch("user")).not_to include("token", "encrypted_password", "otp_secret")
    employment.update_column(:joined_at, Date.tomorrow)
    get :me, format: :json
    expect(response.parsed_body.dig("company", "employee_records_available")).to be(false)
  end

  it "binds availability to the captured company even when the user has roles in both" do
    other = create(:company, date_format: "YYYY-MM-DD")
    create(:employment, company: other, user:, joined_at: nil, resigned_at: nil)
    user.add_role(:admin, other)
    allow(controller).to receive(:current_company).and_return(other)
    get :me, format: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("company"))
      .to include("id" => other.id, "employee_records_available" => false, "date_format" => "YYYY-MM-DD")
    expect(response.parsed_body.dig("user", "date_format")).to eq("YYYY-MM-DD")
  end
end
