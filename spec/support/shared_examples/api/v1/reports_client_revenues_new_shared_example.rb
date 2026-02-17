# frozen_string_literal: true

shared_examples "Api::V1::Reports::ClientRevenuesController::#new success response" do
  it "response should be successful" do
    expect(response).to be_successful
  end

  it "returns the correct JSON structure" do
    expect(json_response).to have_key("clients")
    expect(json_response["clients"]).to be_an(Array)
  end
end
