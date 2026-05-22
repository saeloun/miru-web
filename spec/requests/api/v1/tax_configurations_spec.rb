# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TaxConfigurations", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  it "lists active tax configurations for the current company" do
    create(:tax_configuration, company:, name: "CGST", value: 9)
    create(:tax_configuration, name: "Other workspace tax")

    send_request :get, api_v1_tax_configurations_path, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response.fetch("tax_configurations").pluck("name")).to eq(["CGST"])
  end

  it "creates and deletes a tax configuration" do
    send_request :post, api_v1_tax_configurations_path(
      tax_configuration: {
        name: "SGST",
        calculation_method: "percentage",
        value: 9
      }
    ), headers: auth_headers(user)

    expect(response).to have_http_status(:created)
    tax_configuration = company.tax_configurations.find_by!(name: "SGST")
    expect(tax_configuration.value).to eq(9)

    send_request :delete, api_v1_tax_configuration_path(tax_configuration), headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(tax_configuration.reload).to be_discarded
  end
end
