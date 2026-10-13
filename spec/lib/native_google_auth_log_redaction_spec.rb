# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Native Google log redaction" do
  it "preserves other request paths and their normal query parameter filtering" do
    request = ActionDispatch::Request.new(Rack::MockRequest.env_for("/other/path?view=month&state=private-state"))
    request.set_header("action_dispatch.parameter_filter", [:state])
    expect(request.filtered_path).to eq("/other/path?view=month&state=[FILTERED]")
    expect(request.path).to eq("/other/path")
  end

  it "preserves other redirect URLs and response headers" do
    request = ActionDispatch::Request.new(Rack::MockRequest.env_for("/other/path"))
    request.set_header("action_dispatch.parameter_filter", [:state])
    response = ActionDispatch::Response.new
    response.request = request
    response.location = "https://app.miru.so/other/path?view=month&state=private-state"
    expect(response.filtered_location).to eq("https://app.miru.so/other/path?view=month&state=[FILTERED]")
    expect(response.location).to eq("https://app.miru.so/other/path?view=month&state=private-state")
  end

  it "preserves nonnative Console log locations and notification response objects" do
    response = ActionDispatch::Response.new
    response.location = "https://app.miru.so/other/path?view=month"
    event = ActiveSupport::Notifications::Event.new("process_action.action_controller", 0, 1, "synthetic",
      response:, path: "/other/path", status: 302)
    expect(Console.logger).to receive(:info).with("process_action.action_controller",
      hash_including(location: response.location, path: "/other/path", status: 302))
    Console::Adapter::Rails::ActionController::LogSubscriber.new.process_action(event)
    expect(event.payload[:response]).to equal(response)
    expect(response.location).to eq("https://app.miru.so/other/path?view=month")
  end
end
