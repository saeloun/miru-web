# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Concurrent consultant original submission replay" do
  include_context "committed consultant invoice"

  it "returns the exact receipt for identical commands interleaved after both uploads, retaining only the winning original blob" do
    revision
    initial_blobs = ActiveStorage::Blob.count
    ready = Queue.new
    release = Queue.new
    uploads = []
    services = 2.times.map do
      domain = Payroll::ConsultantInvoicePreparation.new(PayrollRun.find(run.id), actor: User.find(accounts.id))
      allow(domain).to receive(:upload).and_wrap_original do |method, *arguments|
        blob = method.call(*arguments)
        ready << blob.id
        release.pop
        blob
      end
      domain
    end
    facts = invoice_facts.merge("mode" => "existing", "timing" => "existing_invoice", "original_date" => "2026-11-30")
    uploads = services.map do
      input = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
      ActionDispatch::Http::UploadedFile.new(tempfile: input.tempfile, filename: "same-original.pdf", type: "application/pdf")
    end
    threads = services.each_with_index.map do |domain, index|
      Thread.new do
        ApplicationRecord.connection_pool.with_connection do
          domain.record!(employment_id: employment.id, facts:, expected_revision_digest: revision.digest,
            expected_preparation_id: "", idempotency_key: "same-original-command", original_pdf: uploads[index])
        end
      end
    end
    Timeout.timeout(10) { 2.times { ready.pop } }
    2.times { release << true }
    receipts = Timeout.timeout(10) { threads.map(&:value) }
    expect(receipts.map(&:id).uniq.size).to eq(1)
    expect(PayrollInvoicePreparation.count).to eq(1)
    expect(ActiveStorage::Blob.count).to eq(initial_blobs + 1)
    retained = receipts.first.original_blob
    expect(Digest::SHA256.hexdigest(retained.download)).to eq(receipts.first.facts.dig("original", "sha256"))
  ensure
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
    uploads&.each(&:close)
  end
end
