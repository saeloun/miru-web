# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::PosthogPrivacy do
  after { Current.reset }

  it "scrubs an exception built by the installed PostHog SDK" do
    client = PostHog::Client.new(api_key: "phc_synthetic", test_mode: true, before_send: described_class.method(:event))
    client.capture_exception(RuntimeError.new("private@example.test"), "miru:user:42", { "$request_params" => { token: "secret" } })
    message = client.dequeue_last_message

    expect(message.to_json).to include("RuntimeError", "[redacted]", "miru:user:42")
    expect(message.to_json).not_to include("private@example.test", "secret", "$request_params")
  ensure
    client&.shutdown
  end

  it "retains error location and identity without exception messages, source or request data" do
    result = described_class.event(distinct_id: "miru:user:42", event: "$exception", properties: {
      "$current_url" => "https://app.miru.so/private?token=secret",
      "$request_params" => { email: "private@example.test" },
      "$exception_list" => [{ "type" => "RuntimeError", "value" => "private@example.test", "stacktrace" => {
        "frames" => [{ "filename" => "app/models/user.rb", "lineno" => 42,
          "context_line" => "private@example.test", "abs_path" => "/private/source.rb" }]
      } }]
    })

    expect(result[:distinct_id]).to eq("miru:user:42")
    expect(result[:properties]["$process_person_profile"]).to be(true)
    expect(result[:properties].dig("$exception_list", 0, "stacktrace", "frames", 0)).to eq(
      "filename" => "app/models/user.rb", "lineno" => 42
    )
    expect(result.to_json).not_to include("private@example.test", "token=secret", "context_line", "/private/source.rb")
  end

  it "does not create people from untrusted or unidentified backend identities" do
    result = described_class.event(distinct_id: "private@example.test", properties: {})
    expect(result).to include(distinct_id: "miru:backend", properties: { "$process_person_profile" => false })
  end

  it "keeps structured request metadata and drops SQL, parameters, job arguments and raw messages" do
    result = described_class.log(severity: :info, body: "private@example.test", attributes: {
      "event.name" => "process_action.action_controller", "http.response.status_code" => 500,
      "rails.params" => "private@example.test", "rails.job.arguments" => "secret", "db.statement" => "SELECT private"
    })
    expect(result[:body]).to eq("Miru process_action.action_controller")
    expect(result[:attributes]).to eq("event.name" => "process_action.action_controller", "http.response.status_code" => 500)
    expect(result.to_json).not_to include("private@example.test", "secret", "SELECT private")
    expect(described_class.log(body: "unstructured private text", attributes: {})).to be_nil
  end

  it "links logs to the authenticated user and workspace without trusting incoming identity attributes" do
    Current.user = build_stubbed(:user)
    Current.company = build_stubbed(:company)
    result = described_class.log(attributes: {
      "event.name" => "perform.active_job", "posthogDistinctId" => "private@example.test"
    })
    expect(result[:attributes]).to include(
      "posthogDistinctId" => "miru:user:#{Current.user.id}", "miru.company_id" => Current.company.id
    )
    expect(result.to_json).not_to include("private@example.test")
  end
end
