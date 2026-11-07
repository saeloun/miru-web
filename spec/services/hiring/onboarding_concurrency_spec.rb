# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Concurrent hiring onboarding" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end
  include_context "issued offer records"

  it "recovers two Admin retries as one invitation through independent PostgreSQL connections" do
    record = accepted_offer_record
    input = { "company_id" => company.id, "application_version" => application.reload.lock_version, "offer_version" => record.lock_version,
      "first_name" => "Taylor", "last_name" => "Candidate", "employment_id" => nil, "employment_updated_at" => nil,
      "invitation_id" => nil, "invitation_updated_at" => nil, "send_invitation" => true }
    offer_id, application_id, actor_id = record.id, application.id, admin.id
    ready, start = Queue.new, Queue.new
    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          ready << connection.select_value("SELECT pg_backend_pid()")
          start.pop
          Hiring::Onboarding.new(application: HiringApplication.find(application_id), offer: HiringOffer.find(offer_id), actor: User.find(actor_id)).start!(attributes: input)
        end
      end
    end
    expect(2.times.map { ready.pop }.uniq.size).to eq(2)
    2.times { start << true }
    results = threads.map(&:value)
    expect(results.map(&:last)).to contain_exactly(true, false)
    expect(results.map { |result, _created| result.dig(:invitation, :id) }.uniq.size).to eq(1)
    expect(company.invitations.count).to eq(1)
    expect(User.where(email: "candidate@example.test")).not_to exist
  ensure
    2.times { start << true } if start
    threads&.each { |thread| thread.join(5) }
  end

  it "accepts a hiring invitation once and creates one profile without compensation" do
    record = started_onboarding_record
    token = record.onboarding_invitation.token
    ready, start = Queue.new, Queue.new
    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          service = CreateInvitedUserService.new(token)
          service.send(:invitation)
          ready << connection.select_value("SELECT pg_backend_pid()")
          start.pop
          service.process
          service
        end
      end
    end
    expect(2.times.map { ready.pop }.uniq.size).to eq(2)
    2.times { start << true }
    expect(threads.map(&:value).map(&:success)).to contain_exactly(true, false)
    expect(User.where(email: "candidate@example.test").count).to eq(1)
    expect(EmployeeRecord.where(employment_id: record.reload.employment_id).count).to eq(1)
    expect(record.employment.compensation_versions).to be_empty
    expect(application.reload.stage).to eq("hired")
  ensure
    2.times { start << true } if start
    threads&.each { |thread| thread.join(5) }
  end

  it "lets raw source purge finish while a preloaded acceptance waits, without an invitation-parent deadlock" do
    record = started_onboarding_record
    token = record.onboarding_invitation.token
    application_id = application.id
    held, purge = Queue.new, Queue.new
    deleter = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        ActiveRecord::Base.transaction do
          HiringApplication.find(application_id).lock!
          held << connection.select_value("SELECT pg_backend_pid()")
          purge.pop
          HiringApplication.where(id: application_id).delete_all
        end
      end
    end
    held.pop
    ready = Queue.new
    acceptor = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        service = CreateInvitedUserService.new(token)
        service.send(:invitation)
        ready << connection.select_value("SELECT pg_backend_pid()")
        service.process
        service
      end
    end
    pid = ready.pop
    deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 5
    until ActiveRecord::Base.connection.select_value("SELECT wait_event_type = 'Lock' FROM pg_stat_activity WHERE pid = #{Integer(pid)}")
      raise "Acceptance did not reach the held source row" if Process.clock_gettime(Process::CLOCK_MONOTONIC) > deadline

      sleep 0.01
    end
    purge << true
    expect(deleter.value).to eq(1)
    result = acceptor.value
    expect(result.success).to be(false)
    expect(result.error_message).to eq("Invitation expired")
    expect(User.where(email: "candidate@example.test")).not_to exist
    expect(Invitation.where(hiring_offer_id: record.id)).not_to exist
  ensure
    purge << true if purge
    [deleter, acceptor].compact.each { |thread| thread.join(5) }
  end
end
