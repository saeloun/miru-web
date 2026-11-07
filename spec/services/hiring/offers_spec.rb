# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Concurrent offer preparation" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end
  include_context "interview message records"

  it "returns the same persisted offer to two concurrent retries through independent PostgreSQL connections" do
    service = Hiring::Decisions.new(application:, actor: admin)
    decision, = service.create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => "pass", "reason" => "Selected", "owner_employment_id" => nil, "follow_up_on" => nil })
    service.finalize!(decision:, attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version, "decision_version" => decision.lock_version })
    input = { "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid.upcase,
      "engagement" => "consultant", "title" => "Consultant", "amount" => "125000.50", "currency" => "INR", "period" => "monthly",
      "joining_on" => "2026-11-20", "expires_on" => "2026-11-10" }
    application_id, actor_id = application.id, admin.id
    ready, start = Queue.new, Queue.new
    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          ready << connection.select_value("SELECT pg_backend_pid()")
          start.pop
          Hiring::Offers.new(application: HiringApplication.find(application_id), actor: User.find(actor_id)).create!(attributes: input)
        end
      end
    end
    backends = 2.times.map { ready.pop }
    expect(backends.uniq.size).to eq(2)
    2.times { start << true }
    results = threads.map(&:value)
    expect(results.map { |record, _created| record.id }.uniq.size).to eq(1)
    expect(results.map(&:last)).to contain_exactly(true, false)
    expect(company.hiring_offers.count).to eq(1)
  ensure
    threads&.each { |thread| thread.join(5) }
  end
end
