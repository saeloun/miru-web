# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring email relay", type: :request do
  let(:company) { create(:company) }
  let(:mailbox) { HiringMailbox.create!(company:, name: "Applications", source_email: "hello@example.test") }
  let(:path) { "/hiring/inbound/#{mailbox.routing_key}" }
  let(:source) do
    Mail.new do
      from "Jaya Rao <jaya@example.test>"
      to "unrelated-inbox@another-company.example.test"
      message_id "relay-42@applicant.example.test"
      subject "Application for Rails developer"
      text_part { body "My application and resume." }
      attachments["resume.txt"] = "My private resume"
    end.encoded
  end
  let(:headers) do
    { "CONTENT_TYPE" => "message/rfc822", "HTTP_AUTHORIZATION" =>
      ActionController::HttpAuthentication::Basic.encode_credentials("actionmailbox", "test-hiring-relay") }
  end

  around do |example|
    original = ENV["RAILS_INBOUND_EMAIL_PASSWORD"]
    ENV["RAILS_INBOUND_EMAIL_PASSWORD"] = "test-hiring-relay"
    example.run
  ensure
    ENV["RAILS_INBOUND_EMAIL_PASSWORD"] = original
  end

  it "requires the relay credential before accepting a message or disclosing a mailbox" do
    [path, "/hiring/inbound/#{SecureRandom.uuid}"].each do |destination|
      post destination, params: source, headers: headers.except("HTTP_AUTHORIZATION")
      expect(response).to have_http_status(:unauthorized)
    end
    expect(HiringReceipt.count).to eq(0)
    expect(ActionMailbox::InboundEmail.count).to eq(0)
  end

  it "routes through the real mailbox job and attributes the receipt to the authenticated URL" do
    perform_enqueued_jobs(only: ActionMailbox::RoutingJob) { post(path, params: source, headers:) }

    expect(response).to have_http_status(:no_content)
    receipt = company.hiring_receipts.sole
    expect(receipt).to have_attributes(state: "accepted", hiring_mailbox_id: mailbox.id)
    expect(receipt.details.fetch("source_email")).to eq("hello@example.test")
    expect(receipt.hiring_application.company_id).to eq(company.id)
    expect(HiringMessage.count).to eq(0)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "leaves the default unbounded Action Mailbox relay endpoint disabled" do
    post("/rails/action_mailbox/relay/inbound_emails", params: source, headers:)

    expect(response).to have_http_status(:not_found)
    expect(HiringReceipt.count).to eq(0)
    expect(ActionMailbox::InboundEmail.count).to eq(0)
  end

  it "rejects inactive destinations without persisting the source" do
    mailbox.update!(active: false)
    post(path, params: source, headers:)

    expect(response).to have_http_status(:not_found)
    expect(HiringReceipt.count).to eq(0)
    expect(ActionMailbox::InboundEmail.count).to eq(0)
  end

  it "rejects unsupported content types and malformed messages without storage records" do
    post path, params: source, headers: headers.merge("CONTENT_TYPE" => "text/plain")
    expect(response).to have_http_status(:unsupported_media_type)

    post(path, params: "not an RFC email", headers:)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(HiringReceipt.count).to eq(0)
    expect(ActionMailbox::InboundEmail.count).to eq(0)
  end

  it "rejects oversized messages before parsing or persisting them" do
    post(path, params: "x" * (20.megabytes + 1), headers:)

    expect(response).to have_http_status(413)
    expect(HiringReceipt.count).to eq(0)
    expect(ActionMailbox::InboundEmail.count).to eq(0)
  end

  it "returns unavailable when the relay secret is unconfigured" do
    ENV.delete("RAILS_INBOUND_EMAIL_PASSWORD")
    post(path, params: source, headers:)

    expect(response).to have_http_status(:service_unavailable)
    expect(HiringReceipt.count).to eq(0)
  end

  it "fails closed when the configured email storage is public" do
    allow(ActiveStorage::Blob.service).to receive(:public?).and_return(true)
    post(path, params: source, headers:)

    expect(response).to have_http_status(:service_unavailable)
    expect(HiringReceipt.count).to eq(0)
    expect(ActionMailbox::InboundEmail.count).to eq(0)
  end

  it "bounds a body read even when no content length is available" do
    input_class = Class.new(StringIO) do
      def read(length = nil, *arguments)
        raise "Unbounded inbound email read" unless length && length <= 20.megabytes + 1

        super
      end
    end
    environment = Rack::MockRequest.env_for(path, method: "POST", input: "", **headers)
    environment.delete("CONTENT_LENGTH")
    environment["rack.input"] = input_class.new("x" * (20.megabytes + 1))
    status, _, body = Rails.application.call(environment)
    body.close if body.respond_to?(:close)

    expect(status).to eq(413)
    expect(HiringReceipt.count).to eq(0)
    expect(ActionMailbox::InboundEmail.count).to eq(0)
  end
end
