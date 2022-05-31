# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Companies::PurgeLogo#destroy", type: :request do
  let(:company) { create(:company, :with_logo) }
  let(:user) { create(:user, current_workspace: company) }

  before do
    sign_in user
    send_request(:delete, "/internal_api/v1/companies/#{company.id}/purge_logo")
  end

  it "successful status" do
    expect(response).to be_successful
  end

  it "successful notice" do
    expect(json_response["notice"]).to eq(I18n.t("companies.purge_logo.destroy.success"))
  end
end
