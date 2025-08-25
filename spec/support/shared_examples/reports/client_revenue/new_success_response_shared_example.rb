# frozen_string_literal: true

shared_examples "Api::V1::Reports::ClientRevenuesController::#new success response" do
  it "returns only clients having billable projects" do
    expect(json_response["client_details"].pluck("id")).to include(client_1.id, client_2.id)
  end

  it "does not return clients having no billable projects" do
    resp = {
      "id" => client_3.id,
      "name" => client_3.name
    }
    expect(json_response["client_details"]).not_to include(resp)
  end
end
