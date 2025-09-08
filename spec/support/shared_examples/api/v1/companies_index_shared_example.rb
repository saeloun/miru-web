# frozen_string_literal: true

shared_examples "Api::V1::Companies::index success response" do
  it "response should be successful" do
    expect(response).to be_successful
    expect(
      json_response["company_details"]["address"]["address_line_1"]
    ).to eq(company.addresses.first.address_line_1)
  end

  it "returns success json response" do
    address = company.current_address
    expect(json_response["company_details"]["name"]).to eq(company.name)
    expect(json_response["company_details"]["address"]["address_line_1"]).to eq(address.address_line_1)
    expect(json_response["company_details"]["address"]["address_line_2"]).to eq(address.address_line_2)
    expect(json_response["company_details"]["address"]["city"]).to eq(address.city)
    expect(json_response["company_details"]["address"]["state"]).to eq(address.state)
    expect(json_response["company_details"]["address"]["country"]).to eq(address.country)
    expect(json_response["company_details"]["address"]["pin"]).to eq(address.pin)
  end
end
