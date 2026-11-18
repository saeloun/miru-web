# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::PosthogSubscriber do
  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("POSTHOG_PROJECT_TOKEN").and_return("phc_synthetic")
    allow(ENV).to receive(:[]).with("POSTHOG_HOST").and_return("https://posthog.example.test")
  end

  after { Current.reset }

  it "receives events through the configured Rails event subscription" do
    Current.user = build_stubbed(:user)
    client = build_stubbed(:client)
    expect do
      Rails.event.notify(Clients::Created.new(client))
    end.to have_enqueued_job(Analytics::PosthogCaptureJob).with(
      "client_created", "miru:user:#{Current.user.id}",
      { client_id: client.id, company_id: client.company_id }, an_instance_of(String)
    )
  end

  it "receives signup attribution through the existing tracking service" do
    user = build_stubbed(:user)
    ahoy = instance_double(Ahoy::Tracker, track: true)
    expect do
      Analytics::TrackingService.new(user:, ahoy:).track_signup(utm_source: "website")
    end.to have_enqueued_job(Analytics::PosthogCaptureJob).with(
      "user_signup", "miru:user:#{user.id}", { user_id: user.id, utm_source: "website" }, an_instance_of(String)
    )
  end

  it "forwards existing product events without record attributes" do
    user = build_stubbed(:user)
    client = build_stubbed(:client, name: "Private client")
    allow(Analytics::PosthogCaptureJob).to receive(:capture)

    described_class.new.emit(name: "Clients::Created", payload: Clients::Created.new(client, actor: user))

    expect(Analytics::PosthogCaptureJob).to have_received(:capture).with(
      "client_created", { client_id: client.id, company_id: client.company_id }, user_id: user.id
    )
  end

  it "ignores events outside the product allowlist" do
    expect(Analytics::PosthogCaptureJob).not_to receive(:capture)
    described_class.new.emit(name: "Unrelated::Event", payload: {})
  end
end
