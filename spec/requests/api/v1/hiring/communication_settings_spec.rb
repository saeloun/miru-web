# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring communication configuration", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:details) { HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field}" }.merge("client_count" => 4) }

  before do
    admin.add_role(:admin, company)
    sign_in admin
  end

  it "loads an unsaved draft, saves it and requires an explicit versioned approval" do
    get "/api/v1/hiring/settings", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("settings")).to include("lock_version" => nil, "approved" => false)
    expect(response.parsed_body.dig("settings", "preview")).to be_nil
    expect(response.headers["Cache-Control"]).to include("private", "no-store")

    put "/api/v1/hiring/settings", params: { hiring_setting: { company_id: company.id, details:, lock_version: nil } }, as: :json
    expect(response).to have_http_status(:ok)
    draft = response.parsed_body.fetch("settings")
    expect(draft.fetch("details")).to eq(details)
    expect(draft.fetch("approved")).to be(false)
    expect(draft.fetch("preview")).to include("subject" => details.fetch("acknowledgement_subject"))
    expect(draft.dig("preview", "body")).to include("Clients: 4", details.fetch("company_intro"), details.fetch("pto"))
    post "/api/v1/hiring/settings/approve",
      params: { hiring_setting: { company_id: company.id, lock_version: draft.fetch("lock_version") } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("settings", "approved")).to be(true)
    expect(HiringMessage.count).to eq(0)
    post "/api/v1/hiring/settings/approve",
      params: { hiring_setting: { company_id: company.id, lock_version: draft.fetch("lock_version") } }, as: :json
    expect(response).to have_http_status(:conflict)
  end

  it "denies another workspace, malformed settings and employee access" do
    put "/api/v1/hiring/settings",
      params: { hiring_setting: { company_id: create(:company).id, details:, lock_version: nil } }, as: :json
    expect(response).to have_http_status(:conflict)
    [[], "text", { "company_intro" => { "body" => "nested" } }, { "unknown" => true }].each do |invalid|
      put "/api/v1/hiring/settings",
        params: { hiring_setting: { company_id: company.id, details: invalid, lock_version: nil } }, as: :json
      expect(response.status).to be_in([400, 422])
    end
    expect(HiringSetting.count).to eq(0)
    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    get "/api/v1/hiring/settings", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    post "/api/v1/hiring/mailboxes", params: { hiring_mailbox: { company_id: company.id, name: "Inbox", source_email: "hello@example.test" } }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "creates mailbox routes, lists them privately and versions deactivation without deleting history" do
    post "/api/v1/hiring/mailboxes",
      params: { hiring_mailbox: { company_id: company.id, name: " Hiring ", source_email: " HELLO@example.test " } }, as: :json
    expect(response).to have_http_status(:created)
    mailbox = response.parsed_body.fetch("mailbox")
    expect(mailbox).to include("name" => "Hiring", "source_email" => "hello@example.test", "active" => true)
    expect(mailbox.fetch("ingress_path")).to match(%r{\A/hiring/inbound/[a-f0-9-]+\z})
    expect(mailbox.keys).not_to include("company_id", "created_at")
    get "/api/v1/hiring/mailboxes", params: { company_id: company.id }
    expect(response.parsed_body.fetch("mailboxes").size).to eq(1)
    expect(response.headers["Cache-Control"]).to include("no-store")
    update = { company_id: company.id, lock_version: mailbox.fetch("lock_version"), active: false }
    patch "/api/v1/hiring/mailboxes/#{mailbox.fetch('id')}", params: { hiring_mailbox: update }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("mailbox", "active")).to be(false)
    patch "/api/v1/hiring/mailboxes/#{mailbox.fetch('id')}", params: { hiring_mailbox: update }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(company.hiring_mailboxes.count).to eq(1)
  end

  it "rejects invalid mailbox fields, duplicates and cross-tenant edits" do
    [nil, [], { "value" => "Inbox" }, "Bad\nName"].each do |name|
      post "/api/v1/hiring/mailboxes",
        params: { hiring_mailbox: { company_id: company.id, name:, source_email: "hello@example.test" } }, as: :json
      expect(response).to have_http_status(422)
    end
    2.times do
      post "/api/v1/hiring/mailboxes",
        params: { hiring_mailbox: { company_id: company.id, name: "Inbox", source_email: "hello@example.test" } }, as: :json
    end
    expect(response).to have_http_status(422)
    expect(company.hiring_mailboxes.count).to eq(1)
    other = HiringMailbox.create!(company: create(:company), name: "Private inbox", source_email: "private@example.test")
    patch "/api/v1/hiring/mailboxes/#{other.id}",
      params: { hiring_mailbox: { company_id: company.id, lock_version: other.lock_version, active: false } }, as: :json
    expect(response).to have_http_status(:not_found)
    expect(other.reload.active?).to be(true)
    expect(response.body).not_to include(other.source_email)
  end

  it "filters new hiring configuration roots from request logs" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    params = { "hiring_setting" => { "details" => details }, "hiring_mailbox" => { "name" => "Private inbox" },
      "hiring_receipt" => { "name" => "Private applicant" }, "hiring_message" => { "body" => "Private message" } }
    expect(filter.filter(params).values).to eq(["[FILTERED]"] * 4)
  end

  it "searches all inboxes privately with active-only selection and literal query matching" do
    active = HiringMailbox.create!(company:, name: "Applications%", source_email: "active@example.test")
    disabled = HiringMailbox.create!(company:, name: "Old applications", source_email: "disabled@example.test", active: false)
    HiringMailbox.create!(company: create(:company), name: "Applications%", source_email: "foreign@example.test")
    post "/api/v1/hiring/mailboxes/search", params: { hiring_search: { company_id: company.id, query: "%", active: true } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("mailboxes").pluck("id")).to eq([active.id])
    post "/api/v1/hiring/mailboxes/search", params: { hiring_search: { company_id: company.id, query: "", active: false } }, as: :json
    expect(response.parsed_body.fetch("mailboxes").pluck("id")).to eq([disabled.id])
    post "/api/v1/hiring/mailboxes/search", params: { hiring_search: { company_id: company.id, query: [], active: true } }, as: :json
    expect(response).to have_http_status(:bad_request)
  end

  it "requires a genuine browser CSRF token for inbox and template changes" do
    previous_base = ActionController::Base.allow_forgery_protection
    previous_hiring = Api::V1::Hiring::BaseController.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = true
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    put "/api/v1/hiring/settings", params: { hiring_setting: { company_id: company.id, details:, lock_version: nil } }, as: :json
    expect(response).to have_http_status(422)
    expect(HiringSetting.count).to eq(0)
    inbox = { hiring_mailbox: { company_id: company.id, name: "Inbox", source_email: "hello@example.test" } }
    post "/api/v1/hiring/mailboxes", params: inbox, as: :json
    expect(response).to have_http_status(422)
    expect(HiringMailbox.count).to eq(0)
    get "/"
    token = Nokogiri::HTML(response.body).at_css('meta[name="csrf-token"]')&.[]("content")
    expect(token).to be_present
    post "/api/v1/hiring/mailboxes", params: inbox, headers: { "X-CSRF-Token" => token }, as: :json
    expect(response).to have_http_status(:created)
  ensure
    ActionController::Base.allow_forgery_protection = previous_base
    Api::V1::Hiring::BaseController.allow_forgery_protection = previous_hiring if defined?(Api::V1::Hiring::BaseController)
  end

  it "filters actual controller trace parameters before a Sentry transaction is sent" do
    transaction = Sentry::Transaction.new(name: "Hiring trace privacy", sampled: true, hub: Sentry.get_current_hub)
    span = Sentry::Span.new(transaction:, op: "view.process_action.action_controller", description: "Api::V1::Hiring::SettingsController#update")
    allow(Sentry).to receive(:with_child_span).and_wrap_original do |original, **attributes, &block|
      if attributes[:description] == span.description
        block.call(span)
      else
        original.call(**attributes, &block)
      end
    end
    put "/api/v1/hiring/settings", params: { hiring_setting: { company_id: company.id, details:, lock_version: nil } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(span.to_hash.dig(:data, :params)).to be_present
    event = Sentry::TransactionEvent.new(transaction:, configuration: Sentry.configuration)
    event.spans = [span.to_hash, { description: "OtherController#index", data: { params: { page: 2 } } }]
    callback = Sentry.configuration.before_send_transaction
    event = callback.call(event, {}) if callback
    expect(event.spans.first.dig(:data, :params, "hiring_setting")).to eq("[FILTERED]")
    expect(event.spans.last.dig(:data, :params, :page)).to eq(2)
    expect(event.spans.to_json).not_to include("Approved", "company_intro")
  end
end
