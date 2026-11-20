# frozen_string_literal: true

require "rails_helper"
require "open3"

RSpec.describe Analytics::PosthogCaptureJob do
  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:[]).with("POSTHOG_PROJECT_TOKEN").and_return("phc_synthetic")
    allow(ENV).to receive(:[]).with("POSTHOG_HOST").and_return("https://posthog.example.test")
    allow(ENV).to receive(:fetch).with("POSTHOG_PROJECT_TOKEN").and_return("phc_synthetic")
    allow(ENV).to receive(:fetch).with("POSTHOG_HOST").and_return("https://posthog.example.test")
  end

  after { Current.reset }

  it "drops sensitive attribution values before they reach the queue" do
    expect do
      described_class.capture("user_signup", {
        utm_source: "website", utm_campaign: "Black Friday 2026", utm_term: "private@example.test",
        utm_content: "http://localhost/reset?token=secret", status: { email: "private@example.test" }
      }, user_id: 42)
    end.to have_enqueued_job(described_class).with(
      "user_signup", "miru:user:42", { utm_source: "website", utm_campaign: "Black Friday 2026" }, an_instance_of(String)
    )
  end

  it "boots the configured SDK and preserves the actor rather than a subject ID in job errors" do
    code = <<~RUBY
      job = Analytics::PosthogCaptureJob.new("user_signup", "miru:user:42", { user_id: 7 }, Time.current.iso8601)
      job.send(:with_posthog_job_context) do
        PostHog.capture_exception(RuntimeError.new("private@example.test"))
      end
      message = PostHog.client.dequeue_last_message
      raise "Wrong job identity" unless message.stringify_keys["distinct_id"] == "miru:user:42"
      raise "Private error text escaped" if message.to_json.include?("private@example.test")
      puts "POSTHOG_JOB_IDENTITY_VERIFIED"
    RUBY
    output, status = Open3.capture2e(
      { "RAILS_ENV" => "test", "POSTHOG_HOST" => "https://posthog.example.test", "POSTHOG_PROJECT_TOKEN" => "phc_synthetic" },
      RbConfig.ruby, "bin/rails", "runner", code
    )

    expect(status.success?).to be(true), output
    expect(output).to include("POSTHOG_JOB_IDENTITY_VERIFIED")
  end

  it "queues only approved properties and snapshots workspace context" do
    Current.company = build_stubbed(:company)
    expect do
      described_class.capture("user_signup", { email: "private@example.test", utm_source: "website", password: "secret" }, user_id: 42)
    end.to have_enqueued_job(described_class).with(
      "user_signup", "miru:user:42", { utm_source: "website", company_id: Current.company.id }, an_instance_of(String)
    )
  end

  it "preserves explicit company attribution for provider events" do
    Current.company = build_stubbed(:company)
    expect do
      described_class.capture("subscription_purchased", { company_id: 99, seat_quantity: 3 })
    end.to have_enqueued_job(described_class).with(
      "subscription_purchased", "miru:company:99", { company_id: 99, seat_quantity: 3 }, an_instance_of(String)
    )
  end

  it "does not queue when disabled or unattributed" do
    described_class.capture("exchange_rate_fetched", {})
    allow(ENV).to receive(:[]).with("POSTHOG_PROJECT_TOKEN").and_return(nil)
    described_class.capture("user_signup", {}, user_id: 42)

    expect(described_class).not_to have_been_enqueued
  end

  it "drops rolled back events" do
    expect do
      ApplicationRecord.transaction do
        described_class.capture("workspace_created", { company_id: 99 })
        raise ActiveRecord::Rollback
      end
    end.not_to have_enqueued_job(described_class)
  end

  it "does not fail the business operation if enqueueing fails" do
    allow(described_class).to receive(:perform_later).and_raise(ActiveJob::EnqueueError)
    allow(Rails.error).to receive(:report)

    expect do
      ApplicationRecord.transaction { described_class.capture("user_signup", {}, user_id: 42) }
    end.not_to raise_error
    expect(Rails.error).to have_received(:report).with(an_instance_of(ActiveJob::EnqueueError), handled: true)
  end

  it "sends a stable event UUID and matching user and workspace identities" do
    job = described_class.new
    request = stub_request(:post, "https://posthog.example.test/i/v0/e/").with do |http|
      body = JSON.parse(http.body)
      expect(body).to include("uuid" => job.job_id, "distinct_id" => "miru:user:42", "timestamp" => "2026-11-18T00:00:00Z")
      expect(body["properties"]).to eq("company_id" => 99, "utm_source" => "website",
        "$groups" => { "company" => "miru:company:99" }, "$process_person_profile" => true)
      !http.body.include?("private@example.test") && !http.body.include?("token=secret")
    end.to_return(status: 200)

    job.perform("user_signup", "miru:user:42", { "company_id" => 99, "email" => "private@example.test",
      "utm_source" => "website", "utm_term" => "private@example.test", "utm_content" => "http://localhost/reset?token=secret" }, "2026-11-18T00:00:00Z")
    expect(request).to have_been_requested.once
  end

  it "enables person processing so company-only conversions can link to their company group" do
    request = stub_request(:post, "https://posthog.example.test/i/v0/e/").with do |http|
      body = JSON.parse(http.body)
      expect(body["distinct_id"]).to eq("miru:company:99")
      expect(body["properties"]).to include("$groups" => { "company" => "miru:company:99" }, "$process_person_profile" => true)
    end.to_return(status: 200)

    described_class.new.perform("subscription_purchased", "miru:company:99", { company_id: 99 }, Time.current.iso8601)
    expect(request).to have_been_requested.once
  end

  it "retries failed delivery without copying the response into logs" do
    stub_request(:post, "https://posthog.example.test/i/v0/e/").to_return(status: 503, body: "sensitive diagnostics")

    expect do
      described_class.new.perform("user_signup", "miru:user:42", {}, Time.current.iso8601)
    end.to raise_error("PostHog capture failed (HTTP 503); check collector health, POSTHOG_HOST and POSTHOG_PROJECT_TOKEN. " \
      "Delivery retries up to 5 attempts with the same event UUID.")
  end

  it "rejects plaintext collection endpoints" do
    allow(ENV).to receive(:fetch).with("POSTHOG_HOST").and_return("http://posthog.example.test")

    expect do
      described_class.new.perform("user_signup", "miru:user:42", {}, Time.current.iso8601)
    end.to raise_error(ArgumentError, "POSTHOG_HOST must be an HTTPS instance URL; correct it and restart web and worker, or unset it to disable PostHog")
  end
end
