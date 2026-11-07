# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Committed calendar import" do
  def on_connection(&block)
    Thread.new do
      Thread.current.report_on_exception = false
      ActiveRecord::Base.connection_pool.with_connection(&block)
    end.value
  end

  it "releases the actor, company, application and round locks before the actual SDK request" do
    on_connection do |connection|
      company = owner = panel_user = nil
      begin
        expect(connection.open_transactions).to eq(0)
        company = create(:company)
        owner = create(:user, current_workspace: company)
        panel_user = create(:user, current_workspace: company)
        create(:employment, company:, user: owner, resigned_at: nil)
        staff = create(:employment, company:, user: panel_user, resigned_at: nil)
        owner.add_role(:admin, company)
        panel_user.add_role(:employee, company)
        application = Hiring::Intake.new(company:, actor: owner, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
          "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }).process
        panel = HiringPanelMember.create!(company:, employment: staff, details: { "expertise" => "Rails" })
        round = Hiring::Interviews.new(application:, actor: owner).create!(attributes: {
          "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
          "details" => { "title" => "Technical", "kind" => "Technical", "duration_minutes" => 45,
            "criteria" => "Discuss tests", "preparation" => "Bring a project", "feedback_questions" => ["What did we learn?"] },
          "panel" => [{ "panel_member_id" => panel.id, "compensation_access" => false }]
        })
        probe = -> do
          on_connection do |other|
            other.transaction do
              [owner, company, application, round].each { |record| record.class.lock("FOR UPDATE NOWAIT").find(record.id) }
            end
          end
        end
        owner.with_lock { expect { probe.call }.to raise_error(ActiveRecord::LockWaitTimeout) }
        fixture = { id: "synthetic_event", etag: '"v1"', status: "confirmed",
          start: { dateTime: "2027-01-15T09:00:00Z" }, end: { dateTime: "2027-01-15T09:45:00Z" },
          attendees: [application.hiring_candidate.email, panel_user.email].map { |email| { email:, responseStatus: "accepted" } } }
        provider = stub_request(:get, "https://www.googleapis.com/calendar/v3/calendars/primary/events/synthetic_event").to_return do
          expect(connection.open_transactions).to eq(0)
          expect { probe.call }.not_to raise_error
          { status: 200, headers: { "Content-Type" => "application/json" }, body: fixture.to_json }
        end
        client = Signet::OAuth2::Client.new(access_token: "synthetic-token", expires_at: 1.hour.from_now)
        booking = Hiring::Scheduling.new(interview: round, actor: owner).import!(attributes: {
          "company_id" => company.id, "application_version" => application.reload.lock_version, "interview_version" => round.reload.lock_version,
          "request_key" => SecureRandom.uuid, "calendar_id" => "primary", "event_id" => "synthetic_event", "etag" => '"v1"',
          "candidate_time_zone" => "Asia/Kolkata", "feedback_hours" => 24, "booking_instructions" => "Contact the hiring team"
        }) do |context|
          Hiring::CalendarEvents.new(client:, context:).fetch(calendar_id: "primary", event_id: "synthetic_event")
        end
        expect(booking.reload.status).to eq("scheduled")
        expect(provider).to have_been_requested.once
      ensure
        company&.destroy!
        owner&.destroy!
        panel_user&.destroy!
      end
    end
  end
end
