# frozen_string_literal: true

RSpec.describe "HomeController", type: :request do
  it "shows the index view" do
    get root_path

    expect(response).to have_http_status(200)
  end
end
