# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Accepted-offer onboarding", type: :request do
  include_context "issued offer records"
  before { sign_in admin }

  def accepted_offer(engagement: "consultant")
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

  def path(record) = "/api/v1/hiring/applications/#{application.id}/offers/#{record.id}/onboarding"

  def review(record)
    get path(record), params: { company_id: company.id }
    expect(response).to have_http_status(:ok), response.body
    response.parsed_body.fetch("onboarding")
  end

  def input(record, **changes)
    value = review(record)
    { company_id: company.id, application_version: application.reload.lock_version, offer_version: record.reload.lock_version,
      first_name: "Taylor", last_name: "Candidate", employment_id: value.dig("employment", "id"),
      employment_updated_at: value.dig("employment", "updated_at"), invitation_id: value.dig("invitation", "id"),
      invitation_updated_at: value.dig("invitation", "updated_at"), send_invitation: value.fetch("invitation_will_send") }.merge(changes)
  end

  def start(record, attributes = input(record))
    post path(record), params: { hiring_onboarding: attributes }, as: :json
  end

  it "requires a current accepted source before preparing onboarding" do
    record = issued_offer_record
    get path(record), params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("onboarding", "can_start")).to be(false)
    start(record, input(record))
    expect(response).to have_http_status(422)
    expect(Invitation.count).to eq(0)
    expect(application.reload.stage).to eq("offer")
  end

  it "creates an invitation without a placeholder account, salary change or signature request and recovers the same intent" do
    record = accepted_offer
    attributes = input(record)
    before_counts = [User.count, Employment.count, EmployeeRecord.count, ConsultantCompensation.count, SignatureRequest.count]
    start(record, attributes)
    expect(response).to have_http_status(:created), response.body
    invitation = company.invitations.sole
    expect(invitation).to have_attributes(recipient_email: record.issue_details.fetch("recipient"), first_name: "Taylor", last_name: "Candidate", role: "employee", hiring_offer_id: record.id)
    expect([User.count, Employment.count, EmployeeRecord.count, ConsultantCompensation.count, SignatureRequest.count]).to eq(before_counts)
    expect(record.reload.onboarding_started_at).to be_present
    expect(record.onboarded_at).to be_nil
    expect(application.reload.stage).to eq("offer")
    expect(record.read_attribute_before_type_cast("onboarding_details")).not_to include("Taylor", "Candidate")
    start(record, attributes)
    expect(response).to have_http_status(:ok), response.body
    expect(company.invitations.count).to eq(1)
    start(record, attributes.merge(first_name: "Changed"))
    expect(response).to have_http_status(:conflict)
  end

  it "creates a future consultant profile only when the intended recipient accepts" do
    record = accepted_offer
    start(record)
    expect(response).to have_http_status(:created), response.body
    invitation = company.invitations.sole
    sign_out admin
    post invitations_accepts_path, params: { token: invitation.token }
    expect(response).to have_http_status(:redirect), Nokogiri::HTML(response.body).at_css('[role="alert"]')&.text
    expect(response).to redirect_to(/users\/password\/edit/)
    employment = company.employments.joins(:user).find_by!(users: { email: invitation.recipient_email })
    expect(employment).to have_attributes(employment_type: "contractor", designation: "Software consultant", joined_at: Date.iso8601("2026-11-20"))
    expect(employment.employee_id).to be_present
    expect(employment.employee_record.private_details).to eq("family_members" => [])
    expect(employment.compensation_versions).to be_empty
    expect(employment.consultant_compensations).to be_empty
    expect(record.reload.employment_id).to eq(employment.id)
    expect(record.onboarded_at).to be_present
    expect(application.reload.stage).to eq("hired")
    expect(SignatureRequest.count).to eq(0)
  end

  it "links a compatible existing profile without changing its private details or global account" do
    record = accepted_offer
    user = create(:user, email: record.issue_details.fetch("recipient"))
    employment = create(:employment, company:, user:, employment_type: "contractor", designation: "Existing designation", resigned_at: nil)
    user.add_role(:employee, company)
    employee_record = employment.create_employee_record!(private_details: { "bank_account_number" => "123456789012" })
    original = [user.reload.attributes, employment.reload.attributes, employee_record.reload.private_details]
    attributes = input(record, first_name: user.first_name, last_name: user.last_name)
    start(record, attributes)
    expect(response).to have_http_status(:created), response.body
    expect(record.reload.employment_id).to eq(employment.id)
    expect(record.onboarded_at).to be_present
    expect([user.reload.attributes, employment.reload.attributes, employee_record.reload.private_details]).to eq(original)
    expect(application.reload.stage).to eq("hired")
    expect(company.invitations).to be_empty
    expect(response.body).not_to include("123456789012", "private_details", "salary_amount")
  end

  it "creates a salaried employee from employee terms while keeping payroll and signing separate" do
    record = accepted_offer(engagement: "employee")
    start(record)
    invitation = company.invitations.sole
    service = CreateInvitedUserService.new(invitation.token)
    service.process
    expect(service.success).to be(true), service.error_message
    expect(record.reload.employment.employment_type).to eq("salaried")
    expect(record.employment.compensation_versions).to be_empty
    expect(record.employment.salary_slips).to be_empty
    expect(SignatureRequest.count).to eq(0)
  end

  it "does not mutate or reveal a global account in another workspace while sending its invitation" do
    record = accepted_offer
    user = create(:user, email: record.issue_details.fetch("recipient"), first_name: "UnrelatedPrivate")
    original = user.reload.attributes
    start(record)
    expect(response).to have_http_status(:created), response.body
    expect(response.body).not_to include("UnrelatedPrivate", "date_of_birth", "encrypted_password")
    expect(user.reload.attributes).to eq(original)
    expect(company.employments.where(user:)).not_to exist
  end

  it "reuses a valid reviewed invitation without sending another email or reserving another seat" do
    record = accepted_offer
    invitation = create(:invitation, company:, sender: admin, recipient_email: record.issue_details.fetch("recipient"))
    attributes = input(record)
    jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.size
    start(record, attributes)
    expect(response).to have_http_status(:created), response.body
    expect(company.invitations.sole.id).to eq(invitation.id)
    expect(invitation.reload.hiring_offer_id).to eq(record.id)
    expect(ActiveJob::Base.queue_adapter.enqueued_jobs.size).to eq(jobs)
  end

  it "requires renewed review before an expiring reusable invitation turns into a new email" do
    record = accepted_offer
    invitation = create(:invitation, company:, sender: admin, recipient_email: record.issue_details.fetch("recipient"), expired_at: 1.minute.from_now)
    attributes = input(record)
    previous_token = invitation.token
    travel_to(invitation.expired_at + 1.second)
    start(record, attributes)
    expect(response).to have_http_status(:conflict)
    expect(record.reload.onboarding_started_at).to be_nil
    expect(invitation.reload.token).to eq(previous_token)
    start(record)
    expect(response).to have_http_status(:created), response.body
    expect(invitation.reload.token).not_to eq(previous_token)
  end

  it "rotates an expired invitation only on explicit renewal and keeps repeat renewal read-only" do
    record = accepted_offer
    start(record)
    invitation = company.invitations.sole
    old_token = invitation.token
    invitation.update!(expired_at: 1.minute.ago)
    attributes = { company_id: company.id, application_version: application.reload.lock_version, offer_version: record.reload.lock_version }
    post "#{path(record)}/renew", params: { hiring_onboarding: attributes }, as: :json
    expect(response).to have_http_status(:ok), response.body
    expect(invitation.reload.token).not_to eq(old_token)
    expect(invitation).to be_is_valid
    jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.size
    post "#{path(record)}/renew", params: { hiring_onboarding: attributes }, as: :json
    expect(response).to have_http_status(:ok)
    expect(ActiveJob::Base.queue_adapter.enqueued_jobs.size).to eq(jobs)
    get invitations_accepts_path, params: { token: old_token }
    expect(response).to have_http_status(:gone)
  end

  it "can explicitly replace a deleted invitation without recreating the initial onboarding intent" do
    record = accepted_offer
    start(record)
    original = record.reload.onboarding_details
    previous_id = company.invitations.sole.id
    company.invitations.sole.destroy!
    expect(review(record).fetch("can_renew")).to be(true)
    post "#{path(record)}/renew", params: { hiring_onboarding: { company_id: company.id,
      application_version: application.reload.lock_version, offer_version: record.reload.lock_version } }, as: :json
    expect(response).to have_http_status(:ok), response.body
    expect(company.invitations.sole.id).not_to eq(previous_id)
    expect(record.reload.onboarding_details).to eq(original)
  end

  %w[withdrawn recipient selection].each do |change|
    it "rejects invitation acceptance after the accepted #{change} source changes" do
      record = accepted_offer
      start(record)
      invitation = company.invitations.sole
      case change
      when "withdrawn" then application.reload.update!(stage: "withdrawn")
      when "recipient" then application.hiring_candidate.update!(email: "changed@example.test")
      when "selection"
        Hiring::Decisions.new(application:, actor: admin).create!(attributes: { "company_id" => company.id,
          "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
          "outcome" => "hold", "reason" => "New source review", "owner_employment_id" => nil, "follow_up_on" => nil })
      end
      service = CreateInvitedUserService.new(invitation.token)
      expect { service.process }.not_to change(User, :count)
      expect(service.success).to be(false)
      expect(invitation.reload.accepted_at).to be_nil
      expect(record.reload.employment_id).to be_nil
    end
  end

  %w[engagement resigned discarded client].each do |problem|
    it "requires Team review for an existing #{problem} profile instead of overwriting or reactivating it" do
      record = accepted_offer
      user = create(:user, email: record.issue_details.fetch("recipient"))
      employment = create(:employment, company:, user:, employment_type: problem == "engagement" ? "salaried" : "contractor",
        resigned_at: problem == "resigned" ? Date.yesterday : nil)
      user.add_role(problem == "client" ? :client : :employee, company)
      employment.update_columns(discarded_at: Time.current) if problem == "discarded"
      original = employment.reload.attributes
      start(record)
      expect(response).to have_http_status(422), response.body
      expect(employment.reload.attributes).to eq(original)
      expect(record.reload.onboarding_started_at).to be_nil
      expect(company.invitations).to be_empty
    end
  end

  it "allows accepted business terms to onboard after public-link expiry or revocation" do
    record = accepted_offer
    Hiring::Offers.new(application:, actor: admin).revoke!(offer: record, attributes: { "company_id" => company.id,
      "application_version" => application.reload.lock_version, "offer_version" => record.lock_version })
    travel_to(record.expires_at + 1.second)
    start(record)
    expect(response).to have_http_status(:created), response.body
    expect(company.invitations.sole.hiring_offer_id).to eq(record.id)
  end

  it "rolls back invalid names without retaining start intent or sending invitations" do
    record = accepted_offer
    start(record, input(record, first_name: "123"))
    expect(response).to have_http_status(422)
    expect(record.reload.onboarding_started_at).to be_nil
    expect(record.onboarding_details).to eq({})
    expect(company.invitations).to be_empty
  end

  it "denies staff, another workspace and stale source versions" do
    record = accepted_offer
    attributes = input(record)
    start(record, attributes.merge(offer_version: record.lock_version + 1))
    expect(response).to have_http_status(:conflict)
    start(record, attributes.merge(company_id: create(:company).id))
    expect(response).to have_http_status(:conflict)
    expect(response.parsed_body.fetch("workspace_changed")).to be(true)
    sign_in interviewer
    get path(record), params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    start(record, attributes)
    expect(response).to have_http_status(:forbidden)
    expect(company.invitations).to be_empty
  end

  it "rejects a profile created after review and lets Admin explicitly link it from a fresh preview" do
    record = accepted_offer
    start(record)
    invitation = company.invitations.sole
    user = create(:user, email: record.issue_details.fetch("recipient"))
    employment = create(:employment, company:, user:, employment_type: "contractor", resigned_at: nil)
    user.add_role(:employee, company)
    service = CreateInvitedUserService.new(invitation.token)
    service.process
    expect(service.success).to be(false)
    expect(invitation.reload.accepted_at).to be_nil
    expect(review(record).fetch("can_link")).to be(true)
    attributes = input(record, first_name: user.first_name, last_name: user.last_name)
    post "#{path(record)}/complete", params: { hiring_onboarding: attributes }, as: :json
    expect(response).to have_http_status(:ok), response.body
    expect(record.reload.employment_id).to eq(employment.id)
    expect(application.reload.stage).to eq("hired")
    expect(Invitation.exists?(invitation.id)).to be(false)
    service = CreateInvitedUserService.new(invitation.token)
    service.process
    expect(service.success).to be(false)
  end

  it "rejects Team name edits that would strand a confirmed hiring invitation" do
    record = accepted_offer
    start(record)
    invitation = company.invitations.sole
    patch "/api/v1/invitations/#{invitation.id}", params: { first_name: "Changed" }, as: :json
    expect(response).to have_http_status(422)
    expect(invitation.reload.first_name).to eq("Taylor")
    service = CreateInvitedUserService.new(invitation.token)
    service.process
    expect(service.success).to be(true), service.error
    expect(record.reload.onboarded_at).to be_present
  end

  %w[admin employee].each do |role|
    it "preserves a replacement #{role} invitation when explicitly linking an existing profile" do
      record = accepted_offer
      start(record)
      company.invitations.sole.destroy!
      invitation = create(:invitation, company:, sender: admin, recipient_email: record.issue_details.fetch("recipient"), role:)
      user = create(:user, email: invitation.recipient_email)
      employment = create(:employment, company:, user:, employment_type: "contractor", resigned_at: nil)
      user.add_role(:employee, company)
      attributes = input(record, first_name: user.first_name, last_name: user.last_name)
      post "#{path(record)}/complete", params: { hiring_onboarding: attributes }, as: :json
      expect(response).to have_http_status(role == "employee" ? :ok : 422), response.body
      expect(Invitation.exists?(invitation.id)).to be(true)
      expect(record.reload.employment_id).to eq(role == "employee" ? employment.id : nil)
      expect(record.onboarding_completion_details["cancelled_invitation_id"]).to be_nil
    end
  end

  it "lets Admin prepare a future hire's employment details without changing its joining date" do
    record = accepted_offer
    start(record)
    service = CreateInvitedUserService.new(company.invitations.sole.token)
    service.process
    expect(service.success).to be(true), service.error
    employment = record.reload.employment
    joining_on = employment.joined_at
    patch api_v1_employment_path(employment.user_id), params: { employment: { designation: "Reviewed consultant title" } }, as: :json
    expect(response).to have_http_status(:ok), response.body
    expect(employment.reload.designation).to eq("Reviewed consultant title")
    expect(employment.joined_at).to eq(joining_on)
  end

  it "returns retained-history guidance when a super admin tries to delete an onboarded member" do
    record = accepted_offer
    start(record)
    CreateInvitedUserService.new(company.invitations.sole.token).process
    employment = record.reload.employment
    super_admin = create(:user, email: "hello@saeloun.com", current_workspace: company)
    create(:employment, company:, user: super_admin)
    super_admin.add_role(:admin, company)
    sign_in super_admin
    audit_count = Audited::Audit.where(action: "super_admin_delete").count
    delete api_v1_user_path(employment.user_id), as: :json
    expect(response).to have_http_status(422), response.body
    expect(response.parsed_body.fetch("errors")).to include("Deactivate")
    expect(User.exists?(employment.user_id)).to be(true)
    expect(record.reload.employment_id).to eq(employment.id)
    expect(Audited::Audit.where(action: "super_admin_delete").count).to eq(audit_count)
  end
end
