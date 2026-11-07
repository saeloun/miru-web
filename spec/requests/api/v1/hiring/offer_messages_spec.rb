# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Approved candidate offer messages", type: :request do
  include_context "issued offer records"
  before { sign_in admin }

  def path(offer) = "/api/v1/hiring/applications/#{application.id}/offers/#{offer.id}/messages"

  def approve_offer_wording
    setting = approve
    put "/api/v1/hiring/settings", params: { hiring_setting: { company_id: company.id, lock_version: setting.lock_version,
      details: setting.details.merge("offer_subject" => "Your offer", "offer_body" => "Please review your private offer and respond.") } }, as: :json
    expect(response).to have_http_status(:ok), response.body
    post "/api/v1/hiring/settings/approve", params: { hiring_setting: { company_id: company.id,
      lock_version: response.parsed_body.dig("settings", "lock_version") } }, as: :json
    expect(response).to have_http_status(:ok)
  end

  def preview(offer)
    post "#{path(offer)}/preview", params: { hiring_message: { company_id: company.id, kind: "offer", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:ok), response.body
    response.parsed_body.fetch("preview")
  end

  it "requires approved offer wording and an issued live offer before preparing mail" do
    record = issued_offer_record
    post "#{path(record)}/preview", params: { hiring_message: { company_id: company.id, kind: "offer", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    approve_offer_wording
    result = preview(record)
    expect(result.fetch("to")).to eq("candidate@example.test")
    expect(result.fetch("body")).to include(candidate_name, "/hiring-offer##{record.access_token}")
    expect(result.fetch("body")).not_to include("PRIVATE", "125000.50", "recommendation")
    expect(HiringMessage.count).to eq(0)
  end

  it "queues one immutable email intent and recovers it after the candidate has already accepted" do
    record = issued_offer_record
    approve_offer_wording
    intent = preview(record).fetch("intent")
    post path(record), params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:created), response.body
    id = response.parsed_body.dig("message", "id")
    record.with_lock { record.reply!("offer_version" => record.lock_version, "outcome" => "accepted") }
    post path(record), params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("message", "id")).to eq(id)
    expect(HiringMessage.count).to eq(1)
    expect(HiringMessage.sole.read_attribute_before_type_cast("content")).not_to include(record.access_token)
    HiringMessage.sole.update!(state: "failed", error_code: "offer_unavailable")
    get path(record), params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("messages").sole.fetch("retryable")).to be(false)
  end

  it "rejects unissued or already answered offers without creating a message" do
    record = prepare_offer_record
    approve_offer_wording
    post "#{path(record)}/preview", params: { hiring_message: { company_id: company.id, kind: "offer", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    Hiring::Offers.new(application:, actor: admin).issue!(offer: record, attributes: { "company_id" => company.id,
      "application_version" => application.reload.lock_version, "offer_version" => record.lock_version })
    intent = preview(record).fetch("intent")
    record.with_lock { record.reply!("offer_version" => record.lock_version, "outcome" => "accepted") }
    post path(record), params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(HiringMessage.count).to eq(0)
  end

  it "binds the confirmed link to trusted URL configuration rather than the request host" do
    record = issued_offer_record
    approve_offer_wording
    options = { host: "approved.example.test", protocol: "http" }
    allow(Rails.application.config.action_mailer).to receive(:default_url_options).and_return(options)
    allow(Rails.application.config).to receive(:force_ssl).and_return(true)
    post "#{path(record)}/preview", params: { hiring_message: { company_id: company.id, kind: "offer", mailbox_id: mailbox.id } },
      headers: { "HTTP_HOST" => "untrusted.example.test" }, as: :json
    expect(response).to have_http_status(:ok), response.body
    result = response.parsed_body.fetch("preview")
    link = result.fetch("body").lines.last.split.last
    expect(URI.parse(link).host).to eq("approved.example.test")
    expect(URI.parse(link).scheme).to eq("https")
    expect(URI.parse(link).fragment).to eq(record.access_token)
    expect(URI.parse(link).query).to be_nil
    expect(result.dig("intent", "link_digest")).to eq(Digest::SHA256.hexdigest(link))
    options[:host] = "updated.example.test"
    post path(record), params: { hiring_message: result.fetch("intent") }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(HiringMessage.count).to eq(0)
  end

  it "retains approved preview identity across template reapproval and inbox changes" do
    record = issued_offer_record
    approve_offer_wording
    intent = preview(record).fetch("intent")
    configure = Hiring::Configure.new(company:, actor: admin)
    setting = company.hiring_setting.reload
    setting = configure.save_draft!(details: setting.details.merge("offer_body" => "Revised approved offer wording"), lock_version: setting.lock_version)
    configure.approve!(lock_version: setting.lock_version)
    post path(record), params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:conflict)
    intent = preview(record).fetch("intent")
    mailbox.update!(active: false)
    post path(record), params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(HiringMessage.count).to eq(0)
  end

  it "uses the route offer identity and denies foreign offers, staff and revoked Admins" do
    record = issued_offer_record
    approve_offer_wording
    post "#{path(record)}/preview?offer_id=#{record.id + 1000}", params: { hiring_message: { company_id: company.id, kind: "offer", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("preview", "intent", "offer_id")).to eq(record.id)
    post path(record), params: { hiring_message: preview(record).fetch("intent").merge("automatic" => true) }, as: :json
    expect(response).to have_http_status(:bad_request)
    sign_in interviewer
    get path(record), params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    sign_in admin
    post "#{offers_foreign_path(record)}/preview", params: { hiring_message: { company_id: company.id, kind: "offer", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:not_found)
    admin.remove_role(:admin, company)
    get path(record), params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(HiringMessage.count).to eq(0)
  end

  def offers_foreign_path(record)
    foreign = create(:company)
    actor = create(:user, current_workspace: foreign)
    create(:employment, company: foreign, user: actor, resigned_at: nil)
    actor.add_role(:admin, foreign)
    other = Hiring::Intake.new(company: foreign, actor:, attributes: { "company_id" => foreign.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Foreign Candidate", "email" => "foreign@example.test" }).process
    "/api/v1/hiring/applications/#{other.id}/offers/#{record.id}/messages"
  end

  it "requires provider evidence and stopped-worker confirmation before a separate retry of unknown delivery" do
    record = issued_offer_record
    approve_offer_wording
    intent = preview(record).fetch("intent")
    post path(record), params: { hiring_message: intent }, as: :json
    message = HiringMessage.sole
    message.update!(state: "uncertain", error_code: "transport_unknown", started_at: Time.current)
    post "#{path(record)}/#{message.id}/retry", params: { hiring_message: intent.merge("message_version" => message.lock_version) }, as: :json
    expect(response).to have_http_status(:conflict)
    review = { company_id: company.id, message_version: message.lock_version, outcome: "not_accepted", evidence: "Synthetic non-acceptance evidence", worker_stopped: false }
    post "#{path(record)}/#{message.id}/reconcile", params: { hiring_message: review }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    post "#{path(record)}/#{message.id}/reconcile", params: { hiring_message: review.merge(worker_stopped: true) }, as: :json
    expect(response).to have_http_status(:ok)
    expect(HiringMessage.count).to eq(1)
    post "#{path(record)}/#{message.id}/retry", params: { hiring_message: intent.merge("message_version" => message.reload.lock_version) }, as: :json
    expect(response).to have_http_status(:created)
    expect(HiringMessage.last.original_message_id).to eq(message.id)
    expect(HiringMessage.count).to eq(2)
  end

  it "rejects unsafe configured URLs and malformed offer template text" do
    record = issued_offer_record
    approve_offer_wording
    allow(Rails.application.config.action_mailer).to receive(:default_url_options).and_return({ host: "unexpected@host.example.test" })
    post "#{path(record)}/preview", params: { hiring_message: { company_id: company.id, kind: "offer", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.body).not_to include(record.access_token, "unexpected@host")
    setting = company.hiring_setting.reload
    [{ "offer_subject" => "Header\nInjected" }, { "offer_body" => { "invalid" => "type" } }, { "offer_body" => "a" * 5001 }].each do |invalid|
      put "/api/v1/hiring/settings", params: { hiring_setting: { company_id: company.id, lock_version: setting.lock_version,
        details: setting.details.merge(invalid) } }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
