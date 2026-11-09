# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Billing identity serialization" do
  def committed(&block)
    Thread.new { ApplicationRecord.connection_pool.with_connection(&block) }.value
  end

  def facts
    { "legal_name" => "Synthetic", "address_line_1" => "Private", "address_line_2" => "", "city" => "Pune", "state" => "Maharashtra",
      "postal_code" => "411001", "country" => "IN", "pan_status" => "not_available", "pan_number" => "", "pan_reason" => "Awaiting PAN",
      "gst_status" => "not_registered", "gst_number" => "", "gst_scheme" => "", "gst_reason" => "Declared not registered" }
  end

  def fixture
    committed do
      company = create(:company)
      enable_synthetic_payroll(company.id)
      owner = create(:user, current_workspace: company)
      owner.add_role(:owner, company)
      create(:employment, company:, user: owner, joined_at: "2020-01-01", resigned_at: nil)
      person = create(:user, current_workspace: company)
      employment = create(:employment, company:, user: person, joined_at: "2020-01-01", resigned_at: nil)
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2020-01-01", monthly_fee: 50_000,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Entity", change_reason: "Configured")
      [employment.id, person.id, owner.id]
    end
  end

  def domain(ids, reviewer: false)
    Payroll::BillingIdentity.new(Employment.find(ids[0]), actor: User.find(ids[reviewer ? 2 : 1]))
  end

  def race
    ready, release = Queue.new, Queue.new
    threads = 2.times.map do |index|
      Thread.new do
        ApplicationRecord.connection_pool.with_connection do
          ready << true
          release.pop
          yield index
        end
      end
    end
    Timeout.timeout(10) { 2.times { ready.pop }; 2.times { release << true }; threads.map(&:value) }
  ensure
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
  end

  def approve(ids, submission_id)
    domain(ids, reviewer: true).review!(submission_id:, expected_review_id: "", decision: "approved", reason: "Manual review",
      manual_tax_reviewed: true, missing_pan_acknowledged: true, idempotency_key: "approval")
  end

  after do
    DatabaseCleaner.clean
    committed { DatabaseCleaner.clean_with(:truncation, except: %w[ar_internal_metadata schema_migrations]) }
  end

  it "creates one profile for concurrent identical retries and rejects a stale competing review" do
    ids = fixture
    receipts = race { domain(ids).submit!(facts:, expected_submission_id: "", idempotency_key: "same").dig(:recorded_submission, :id) }
    expect(receipts.uniq.size).to eq(1)
    outcomes = race do |index|
      domain(ids, reviewer: true).review!(submission_id: receipts.first, expected_review_id: "", decision: "approved", reason: "Manual review",
        manual_tax_reviewed: true, missing_pan_acknowledged: true, idempotency_key: "review-#{index}")[:status]
    rescue Payroll::Workflow::Conflict
      "conflict"
    end
    expect(outcomes).to contain_exactly("approved", "conflict")
    expect(committed { ConsultantBillingSubmission.count }).to eq(1)
    expect(committed { ConsultantBillingReview.count }).to eq(1)
  end

  it "serializes a revoked review with a consumer holding its employment lock" do
    ids = fixture
    saved = committed { domain(ids).submit!(facts:, expected_submission_id: "", idempotency_key: "profile") }
    approved = committed { approve(ids, saved.dig(:current_submission, :id)) }
    worker = nil
    committed do
      employment = Employment.find(ids.first)
      employment.with_lock do
        consumer = Payroll::BillingIdentity.new(employment)
        binding = consumer.binding
        expect(consumer.valid_binding?(binding)).to be(true)
        ready = Queue.new
        worker = Thread.new do
          ApplicationRecord.connection_pool.with_connection do |connection|
            ready << connection.select_value("SELECT pg_backend_pid()")
            domain(ids, reviewer: true).review!(submission_id: saved.dig(:current_submission, :id), expected_review_id: approved.dig(:current_review, :id),
              decision: "rejected", reason: "Revoked for correction", manual_tax_reviewed: false, missing_pan_acknowledged: false, idempotency_key: "revoke")
          end
        end
        Timeout.timeout(5) do
          pid = ready.pop
          sleep 0.01 until ApplicationRecord.connection.select_value("SELECT pg_backend_pid()=ANY(pg_blocking_pids(#{Integer(pid)}))")
        end
        expect(consumer.valid_binding?(binding)).to be(true)
      end
    end
    expect(Timeout.timeout(5) { worker.value }[:status]).to eq("rejected")
    expect(committed { domain(ids).binding }).to be_nil
  ensure
    worker&.kill if worker&.alive?
    worker&.join
  end

  it "prevents framework purge from removing retained bytes referenced by either immutable blob FK" do
    ids = fixture
    blob_ids = committed do
      provided = facts.merge("pan_status" => "provided", "pan_number" => "AAAPC1234D", "pan_reason" => "", "gst_status" => "registered",
        "gst_number" => "27AAAPC1234D1A5", "gst_scheme" => "regular", "gst_reason" => "")
      uploads = 2.times.map do
        file = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
        ActionDispatch::Http::UploadedFile.new(tempfile: file.tempfile, filename: "private.pdf", type: "application/pdf")
      end
      domain(ids).submit!(facts: provided, expected_submission_id: "", idempotency_key: "files", pan_evidence: uploads.first, gst_evidence: uploads.last)
      row = ConsultantBillingSubmission.sole
      [row.pan_blob_id, row.gst_blob_id]
    end
    committed do
      blob_ids.each do |id|
        blob = ActiveStorage::Blob.find(id)
        original = Digest::SHA256.hexdigest(blob.download)
        blob.purge
        expect(ActiveStorage::Blob.exists?(id)).to be(true)
        expect(Digest::SHA256.hexdigest(ActiveStorage::Blob.find(id).download)).to eq(original)
      end
    end
  end
end
