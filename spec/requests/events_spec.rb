# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Event viewer", type: :request do
  let(:user) { create(:user) }

  it "requires authentication" do
    get "/events"

    expect(response).to redirect_to("/users/sign_in")
  end

  it "does not expose the viewer to an ordinary user" do
    sign_in user
    get "/events"

    expect(response).to have_http_status(:ok)
    expect(response).to render_template("home/index")
    expect(response.body).not_to include("Rails Event Viewer")
  end

  it "shows the viewer to an allowlisted user" do
    sign_in create(:user, email: "keshav@saeloun.com")

    get "/events"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Rails Event Viewer")
  end

  it "does not expose the viewer to an unconfirmed allowlisted user" do
    sign_in create(:user, email: "keshav@saeloun.com", confirmed_at: nil)

    get "/events"

    expect(response).to have_http_status(:ok)
    expect(response).to render_template("home/index")
    expect(response.body).not_to include("Rails Event Viewer")
  end

  it "shows import groups and their events to a super admin" do
    sign_in create(:user, email: "hello@saeloun.com")
    Rails.event.set_context(data_import_id: "123")
    create(:client)

    get "/events/groups/123", params: { key: "data_import_id" }

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Clients::Created")
  end
end
