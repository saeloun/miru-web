# frozen_string_literal: true

require "rails_helper"

RSpec.describe "home/index", type: :view do
  it "serializes oauth and flash state for the React app" do
    assign(
      :app_props,
      {
        googleOauthSuccess: true,
        flashMessages: {
          "alert" => "Could not authenticate you from Google.",
          "notice" => "Successfully authenticated from Google account."
        }
      }
    )

    render

    root = Nokogiri::HTML(rendered).at_css("#react-root")
    props = JSON.parse(root["data-props"])

    expect(props).to include(
      "googleOauthSuccess" => true,
      "flashMessages" => {
        "alert" => "Could not authenticate you from Google.",
        "notice" => "Successfully authenticated from Google account."
      }
    )
  end
end
