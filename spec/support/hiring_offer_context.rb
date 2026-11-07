# frozen_string_literal: true

RSpec.shared_context "issued offer records" do
  include_context "interview message records"

  def prepare_offer_record
    decisions = Hiring::Decisions.new(application:, actor: admin)
    decision, = decisions.create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => "pass", "reason" => "PRIVATE SELECTION REASON", "owner_employment_id" => nil, "follow_up_on" => nil })
    decisions.finalize!(decision:, attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version, "decision_version" => decision.lock_version })
    Hiring::Offers.new(application:, actor: admin).create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "engagement" => "consultant", "title" => "Software consultant", "amount" => "125000.50", "currency" => "INR",
      "period" => "monthly", "joining_on" => "2026-11-20", "expires_on" => "2026-11-10" }).first
  end

  def issued_offer_record
    record = prepare_offer_record
    Hiring::Offers.new(application:, actor: admin).issue!(offer: record, attributes: { "company_id" => company.id,
      "application_version" => application.reload.lock_version, "offer_version" => record.lock_version })
  end

  def accepted_offer_record(engagement: "consultant")
    record = prepare_offer_record
    service = Hiring::Offers.new(application:, actor: admin)
    if engagement != "consultant"
      service.update!(offer: record, attributes: record.details.except("time_zone").merge("engagement" => engagement,
        "company_id" => company.id, "application_version" => application.reload.lock_version, "offer_version" => record.lock_version))
    end
    service.issue!(offer: record, attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version, "offer_version" => record.reload.lock_version })
    record.with_lock { record.reply!("offer_version" => record.lock_version, "outcome" => "accepted") }
    record
  end

  def started_onboarding_record
    record = accepted_offer_record
    Hiring::Onboarding.new(application:, offer: record, actor: admin).start!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "offer_version" => record.lock_version,
      "first_name" => "Taylor", "last_name" => "Candidate", "employment_id" => nil, "employment_updated_at" => nil,
      "invitation_id" => nil, "invitation_updated_at" => nil, "send_invitation" => true })
    record.reload
  end

  def approve_offer_messages(actor: admin)
    setting = approve
    configuration = Hiring::Configure.new(company:, actor:)
    setting = configuration.save_draft!(details: setting.details.merge("offer_subject" => "Your offer",
      "offer_body" => "Please review your private offer and respond."), lock_version: setting.lock_version)
    configuration.approve!(lock_version: setting.lock_version)
  end
end
