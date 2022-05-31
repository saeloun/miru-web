# frozen_string_literal: true

require "rails_helper"

shared_examples_for "Internal::V1::WiseController error from Wise API" do
  it "returns 500 status in response" do
    subject
    expect(response.status).to eq(500)
  end
end

RSpec.describe "InternalApi::V1::WiseController", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:company_user, company:, user:)
    user.add_role :employee, company
    sign_in user
    [:get, :post, :delete].each do |method|
      allow_any_instance_of(Faraday::Connection).to receive(method).and_return(
        Struct.new(:status, :body).new(500, { error: "Error while calling Wise Api" }.to_json)
      )
    end
  end

  let(:params) do
    {
      wise: {
        accountNumber: Faker::Number.number(digits: 7)
      },
      source_currency: "USD",
      target_currency: "INR",
      source_amount: 1000,
      pathname: "",
      search: "",
      recipient_id: Faker::Number.number(digits: 7)
    }
  end

  describe "POST create_recipient" do
    subject { send_request :post, internal_api_v1_wise_create_recipient_path(params:) }

    it_behaves_like "Internal::V1::WiseController error from Wise API"
  end

  describe "GET fetch_currencies" do
    subject { send_request :get, internal_api_v1_wise_fetch_currencies_path }

    it_behaves_like "Internal::V1::WiseController error from Wise API"
  end

  describe "GET fetch_bank_requirements" do
    subject { send_request :get, internal_api_v1_wise_fetch_bank_requirements_path(params) }

    it_behaves_like "Internal::V1::WiseController error from Wise API"
    # it "fails" do
    #   subject
    #   binding.break
    # end
  end

  describe "GET validate_account_details" do
    subject { send_request :get, internal_api_v1_wise_validate_account_details_path(params) }

    it_behaves_like "Internal::V1::WiseController error from Wise API"
  end

  describe "GET fetch_recipient" do
    subject { send_request :get, internal_api_v1_wise_fetch_recipient_path(params) }

    context "when Wise API fails" do
      before { allow_any_instance_of(Wise::Api).to receive(:fetch_recipient).and_raise(StandardError) }

      it_behaves_like "Internal::V1::WiseController error from Wise API"
    end

    context "when Wise API returns response" do
      it "returns 200 response" do
        subject
        expect(response.status).to eq 200
      end
    end
  end

  describe "PUT update_recipient" do
    subject { send_request :put, internal_api_v1_wise_update_recipient_path(params) }

    context "when Wise API fails" do
      before { allow_any_instance_of(Wise::Api).to receive(:update_recipient).and_raise(StandardError) }

      it_behaves_like "Internal::V1::WiseController error from Wise API"
    end

    context "when Wise API returns response" do
      it "returns 200 response" do
        subject
        expect(response.status).to eq 200
      end
    end
  end
end
