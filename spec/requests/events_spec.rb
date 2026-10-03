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

    get "/events/group", params: { key: "data_import_id", value: "123" }

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Clients::Created")
  end

  %w[context tags].each do |column|
    describe "#{column} filters" do
      let(:key_param) { column == "context" ? :context_key : :tag_key }
      let(:value_param) { column == "context" ? :context_value : :tag_value }
      let(:visible_event_names) do
        Nokogiri::HTML(response.body).css("tbody tr td:first-child a").map { |node| node.text.strip }
      end

      before do
        sign_in create(:user, email: "hello@saeloun.com")
        [
          ["Imports::KeyPresent", { "filter_key" => "matching" }],
          ["Imports::KeyOtherValue", { "filter_key" => "other" }],
          ["Imports::KeyNull", { "filter_key" => nil }],
          ["Imports::KeyAbsent", {}]
        ].each do |name, data|
          RailsEventViewer::Entry.create!(name:, occurred_at: Time.current, column => data)
        end
      end

      [nil, "", " "].each do |value|
        it "finds present keys, including JSON null, with value #{value.inspect}" do
          params = { key_param => "filter_key" }
          params[value_param] = value unless value.nil?

          get "/events/events", params: params

          expect(response).to have_http_status(:ok)
          expect(visible_event_names).to match_array(
            ["Imports::KeyPresent", "Imports::KeyOtherValue", "Imports::KeyNull"]
          )
        end
      end

      it "still filters by an explicit value" do
        get "/events/events", params: { key_param => "filter_key", value_param => "matching" }

        expect(response).to have_http_status(:ok)
        expect(visible_event_names).to eq(["Imports::KeyPresent"])
      end

      it "treats SQL-like keys as literal JSON keys" do
        key = "filter_key' OR TRUE --"
        RailsEventViewer::Entry.create!(
          name: "Imports::LiteralKey", occurred_at: Time.current, column => { key => nil }
        )

        get "/events/events", params: { key_param => key }

        expect(response).to have_http_status(:ok)
        expect(visible_event_names).to eq(["Imports::LiteralKey"])
      end
    end
  end
end
