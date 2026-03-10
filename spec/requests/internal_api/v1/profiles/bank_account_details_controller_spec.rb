# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Profiles::BankAccountDetailsController", type: :request, wise: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :employee, company
    sign_in user
  end

  describe "GET index" do
    subject { send_request :get, internal_api_v1_profiles_bank_account_details_path, headers: auth_headers(user) }

    context "when wise account is present" do
      let(:wise_account) { create(:wise_account, user:, company:) }
      let(:wise_account_attributes) do
        wise_account.attributes.except("created_at", "updated_at")
      end

      it "sends details of wise account" do
        expect(wise_account.present?).to be true
        subject
        expect(json_response.values).to match_array(wise_account_attributes.values)
        expect(response.status).to eq 200
      end
    end

    context "when wise account is not present" do
      it "sends blank response" do
        subject
        expect(json_response.values.any?).to be false
        expect(response.status).to eq 200
      end
    end

    context "when user is not authorized" do
      before do
        allow_any_instance_of(InternalApi::V1::Profiles::BankAccountDetailsController)
          .to receive(:authorize).and_return(nil)
      end

      it "returns error" do
        expect { subject }.to raise_error(Pundit::AuthorizationNotPerformedError)
      end
    end
  end

  describe "POST create" do
    subject {
  send_request :post, internal_api_v1_profiles_bank_account_details_path(params:), headers: auth_headers(user)
}

    let(:params) do
      {
        id: Faker::Number.number(digits: 7),
        profile: Faker::Number.number(digits: 7),
        currency: "INR",
        details: { accountNumber: "", address: { country: "IN" } }
      }
    end
    let(:wise_account) { WiseAccount.last }

    context "when wise account for user is not present" do
      it "creates the record for wise account" do
        # rubocop:disable RSpec/ExpectChange
        expect { subject }.to change { WiseAccount.count }.from(0).to(1)
        expect(json_response["profileId"]).to eq(params[:profile].to_s)
        expect(json_response["recipientId"]).to eq(params[:id].to_s)
        # rubocop:enable RSpec/ExpectChange
      end
    end

    context "when wise account for user is already present" do
      before do
        create(:wise_account, user:, company:)
      end

      it "Returns the validation error" do
        subject
        expect(response.status).to eq 500
        expect(json_response["error"]).to eq("Validation failed: User has already been taken")
      end
    end

    context "when user is not authorized for creating wise account" do
      before do
        allow_any_instance_of(InternalApi::V1::Profiles::BankAccountDetailsController)
          .to receive(:authorize).and_return(nil)
      end

      it "returns error" do
        expect { subject }.to raise_error(Pundit::AuthorizationNotPerformedError)
      end
    end
  end

  describe "PUT update" do
    subject {
  send_request :put, internal_api_v1_profiles_bank_account_detail_path(account_id:, params:),
    headers: auth_headers(user)
}

    let(:wise_account) { create(:wise_account, user:, company:) }
    let(:account_id) { wise_account.id }
    let(:params) do
      {
        id: Faker::Number.number(digits: 7),
        profile: Faker::Number.number(digits: 7),
        currency: "PHP"
      }
    end

    context "when wise account is not present" do
      let(:account_id) { wise_account.id + 2 }

      it "Returns 404 response" do
        subject
        expect(response.status).to eq 404
      end
    end

    context "when wise account is present" do
      it "Updates wise account" do
        subject
        expect(json_response["profileId"]).not_to eq(wise_account.profile_id)
        expect(json_response["recipientId"]).not_to eq(wise_account.recipient_id)
        expect(json_response["targetCurrency"]).not_to eq(wise_account.target_currency)
      end
    end

    context "when user is not authorized" do
      before do
        allow_any_instance_of(InternalApi::V1::Profiles::BankAccountDetailsController)
          .to receive(:authorize).and_return(nil)
      end

      it "returns error" do
        expect { subject }.to raise_error(Pundit::AuthorizationNotPerformedError)
      end
    end

    context "when update errors out" do
      before do
        allow_any_instance_of(WiseAccount).to receive("update!").and_raise(StandardError)
      end

      it "returns 500 error status" do
        subject
        expect(response.status).to eq(500)
        expect(json_response["error"]).to eq("StandardError")
      end
    end
  end
end
