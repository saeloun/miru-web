# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring receipt recovery" do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:mailbox) { HiringMailbox.create!(company:, name: "Hiring", source_email: "hiring@example.test") }
  let(:receipt) do
    source = Mail.new do
      from "Jaya Rao <jaya@example.test>"
      to "hiring@example.test"
      message_id "recover@example.test"
      subject "Application for Rails developer"
      body "Please consider my application."
      attachments["resume.txt"] = "Private resume"
    end.encoded
    Hiring::ReceiveEmail.new(mailbox:, source:).process.reload
  end
  let(:review) { Hiring::ReviewReceipt.new(company:, actor: admin, receipt:) }

  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
    admin.add_role(:admin, company)
    create(:employment, company:, user: admin, resigned_at: nil)
  end

  it "queues retained pending mail without its native transport and processes duplicate jobs once" do
    record = receipt
    original_source = record.source
    record.inbound_email.destroy!
    expect(record.reload.inbound_email_id).to be_nil
    expect do
      review.retry_processing!(lock_version: record.lock_version)
    end.to have_enqueued_job(HiringIntakeJob).with(record.id)
    expect(record.reload.state).to eq("pending")
    audit = record.audits.find_by!(action: "intake_retry_requested")
    expect(audit.user_id).to eq(admin.id)
    expect(audit.audited_changes).to eq({})

    2.times { HiringIntakeJob.perform_now(record.id) }
    expect(record.reload.state).to eq("accepted")
    expect(company.hiring_applications.count).to eq(1)
    expect(record.source).to eq(original_source)
    expect { HiringIntakeJob.perform_now(-1) }.not_to raise_error
  end

  it "rejects stale, resolved, foreign and unauthorized recovery requests" do
    record = receipt
    expect { review.retry_processing!(lock_version: "0") }.to raise_error(Hiring::Intake::InvalidInput)
    expect { review.retry_processing!(lock_version: record.lock_version + 1) }.to raise_error(Hiring::Intake::Conflict)
    record.update!(state: "review", review_reason: "unverified_sender")
    expect { review.retry_processing!(lock_version: record.lock_version) }.to raise_error(Hiring::Intake::Conflict)
    record.update!(state: "pending", review_reason: nil)
    admin.remove_role(:admin, company)
    expect { review.retry_processing!(lock_version: record.lock_version) }.to raise_error(Pundit::NotAuthorizedError)
    admin.add_role(:admin, company)
    other = create(:company)
    User.where(id: admin.id).update_all(current_workspace_id: other.id)
    expect { review.retry_processing!(lock_version: record.lock_version) }.to raise_error(Pundit::NotAuthorizedError)
    foreign = Hiring::ReviewReceipt.new(company: other, actor: admin, receipt: record)
    expect { foreign.retry_processing!(lock_version: record.lock_version) }.to raise_error(Pundit::NotAuthorizedError)
    expect(record.reload.state).to eq("pending")
  end

  it "reports failed queue acceptance without claiming processing or exposing adapter errors" do
    record = receipt
    allow(HiringIntakeJob).to receive(:perform_later).and_return(false)
    expect { review.retry_processing!(lock_version: record.lock_version) }
      .to raise_error(Hiring::ReceiveEmail::Unavailable, "Email processing could not be queued. Try again.")
    allow(HiringIntakeJob).to receive(:perform_later).and_raise(ActiveJob::EnqueueError, "private adapter data")
    expect { review.retry_processing!(lock_version: record.lock_version) }
      .to raise_error(Hiring::ReceiveEmail::Unavailable) { |error| expect(error.cause).to be_nil }
    expect(record.reload.state).to eq("pending")
    expect(company.hiring_applications.count).to eq(0)
  end
end
