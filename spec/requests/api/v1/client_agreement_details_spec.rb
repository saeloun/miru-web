# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client agreement details", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let(:client) { create(:client, company:) }
  let(:details) do
    {
      "legal_name" => "Example International Consulting Private Limited",
      "finance_email" => "finance@example.test",
      "signatory_name" => "Asha Núñez",
      "signatory_designation" => "Head of Legal",
      "signatory_email" => "signer@example.test"
    }
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  def update_details(attributes, target: client)
    send_request :patch, api_v1_client_path(target),
      params: { client: attributes }, headers: auth_headers(user)
  end

  it "creates and shows independent legal, finance and signatory facts" do
    attributes = attributes_for(:client).slice(:name, :email, :phone, :currency).merge(details)
    send_request :post, api_v1_clients_path, params: { client: attributes }, headers: auth_headers(user)

    expect(response).to have_http_status(:created)
    created = json_response.fetch("client")
    expect(created.slice(*details.keys)).to eq(details)

    send_request :get, api_v1_client_path(created.fetch("id")), headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_response.fetch("client_details").slice(*details.keys)).to eq(details)
  end

  it "normalizes optional values and preserves separately stored matching emails" do
    update_details(details.transform_values { |value| "  #{value}  " })
    expect(response).to have_http_status(:ok)
    expect(json_response.fetch("client").slice(*details.keys)).to eq(details)

    update_details({ signatory_email: details.fetch("finance_email") })
    update_details({ finance_email: "new-finance@example.test" })
    expect(json_response.dig("client", "signatory_email")).to eq("finance@example.test")

    update_details(details.transform_values { " " })
    expect(response).to have_http_status(:ok)
    expect(json_response.fetch("client").slice(*details.keys)).to eq(details.transform_values { nil })
  end

  %w[finance_email signatory_email].each do |attribute|
    it "rejects an invalid #{attribute} without changing client or address" do
      previous_name = client.name
      previous_address = client.current_address.address_line_1
      update_details({
        attribute => "not-an-email", "name" => "Changed name",
        "addresses_attributes" => [{ id: client.current_address.id, address_line_1: "Changed address" }]
      })

      expect(response).to have_http_status(:unprocessable_content)
      expect(client.reload.name).to eq(previous_name)
      expect(client.current_address.address_line_1).to eq(previous_address)
    end
  end

  it "rejects an oversized legal name" do
    update_details({ legal_name: "A" * 256 })
    expect(response).to have_http_status(:unprocessable_content)
  end

  %w[employee book_keeper client].each do |role|
    it "denies #{role} contact reads and writes" do
      user.remove_role :admin, company
      user.add_role role, company
      update_details(details)
      expect(response).to have_http_status(:forbidden)

      send_request :get, api_v1_client_path(client), headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  it "does not read or update another company client" do
    other_client = create(:client)
    update_details(details.merge(company_id: company.id), target: other_client)
    expect(response).to have_http_status(:not_found)
    send_request :get, api_v1_client_path(other_client), headers: auth_headers(user)
    expect(response).to have_http_status(:not_found)
  end
end
