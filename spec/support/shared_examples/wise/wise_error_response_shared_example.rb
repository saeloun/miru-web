# frozen_string_literal: true

shared_examples "Internal::V1::WiseController error response from wise" do
  before do
    [:get, :post, :put, :delete].each do |method|
      allow_any_instance_of(Faraday::Connection).to receive(method).and_return(
        Struct.new(:status, :body).new(500, { error: "Error while calling Wise Api" }.to_json)
      )
    end
  end

  it "returns error in response body" do
    expect(subject.status).to eq status
    expect(JSON.parse(response.body)["error"]).to eq "Error while calling Wise Api"
  end
end
