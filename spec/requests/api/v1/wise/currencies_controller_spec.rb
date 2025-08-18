# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::Wise::CurrenciesController, type: :controller do
  let(:company) { create(:company) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: employee)
    employee.add_role :employee, company
    sign_in employee
  end

  describe "GET index" do
    subject { get :index }

    context "when wise returns successful response", vcr: { cassette_name: "wise_currency_success" } do
      it "returns list of currency" do
        expect(subject.status).to eq 200
        expect(JSON.parse(response.body).class).to be Array
      end
    end

    context "when wise returns error" do
      let(:status) { 500 }

      it_behaves_like "Internal::V1::WiseController error response from wise"
    end
  end
end
