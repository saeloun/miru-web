# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies::PurgeLogo#destroy", type: :request do
  let(:company) { create(:company, :with_logo) }
  let(:user) { create(:user, current_workspace: company) }

  before do
    sign_in user
    send_request(:delete, company_purge_logo_path)
  end

  it "destroys the company_logo" do
    company.reload
    expect(company.logo.attached?).to be_falsy
  end

  it "redirects to company_path" do
    expect(response).to redirect_to(company_path)
  end
end
