# frozen_string_literal: true

require "rails_helper"

RSpec.describe MissionControlController, type: :controller do
  controller do
    def index
      render plain: "ok"
    end
  end

  def basic_auth(username, password)
    ActionController::HttpAuthentication::Basic.encode_credentials(username, password)
  end

  around do |example|
    original_username = ENV["SOLID_QUEUE_USERNAME"]
    original_password = ENV["SOLID_QUEUE_PASSWORD"]
    ENV["SOLID_QUEUE_USERNAME"] = "admin"
    ENV["SOLID_QUEUE_PASSWORD"] = "password"
    example.run
    ENV["SOLID_QUEUE_USERNAME"] = original_username
    ENV["SOLID_QUEUE_PASSWORD"] = original_password
  end

  before do
    routes.draw { get "index" => "mission_control#index" }
    allow_any_instance_of(ApplicationController).to receive(:authenticate_user!).and_return(true)
  end

  it "requires credentials" do
    get :index

    expect(response).to have_http_status(:unauthorized)
  end

  it "rejects incorrect credentials" do
    request.headers["HTTP_AUTHORIZATION"] = basic_auth("admin", "wrong")
    get :index

    expect(response).to have_http_status(:unauthorized)
  end

  it "accepts correct credentials" do
    request.headers["HTTP_AUTHORIZATION"] = basic_auth("admin", "password")
    get :index

    expect(response).to have_http_status(:ok)
  end

  it "fails closed when the username is unset" do
    ENV["SOLID_QUEUE_USERNAME"] = nil
    request.headers["HTTP_AUTHORIZATION"] = basic_auth("admin", "password")
    get :index

    expect(response).to have_http_status(:unauthorized)
  end

  it "fails closed when the password is blank" do
    ENV["SOLID_QUEUE_PASSWORD"] = ""
    request.headers["HTTP_AUTHORIZATION"] = basic_auth("admin", "password")
    get :index

    expect(response).to have_http_status(:unauthorized)
  end
end
