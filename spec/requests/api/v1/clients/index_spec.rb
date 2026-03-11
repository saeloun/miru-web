# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Clients#index", type: :request do
  let(:company) { create(:company) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let!(:visible_client) { create(:client, company: company, name: "Visible Client") }
  let!(:other_company_client) { create(:client, name: "Other Company Client") }

  before do
    book_keeper.add_role(:book_keeper, company)
    sign_in book_keeper
  end

  it "allows a book keeper to fetch clients for the current company" do
    get "/api/v1/clients"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("client_details").pluck("name")).to include("Visible Client")
    expect(response.parsed_body.fetch("client_details").pluck("name")).not_to include("Other Company Client")
  end
end
