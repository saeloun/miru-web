# frozen_string_literal: true

require "rails_helper"
require "socket"

RSpec.describe "Hiring acknowledgements" do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:mailbox) { HiringMailbox.create!(company:, name: "Hiring", source_email: "hiring@example.test") }
  let(:details) do
    HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field.tr('_', ' ')}" }
      .merge("client_count" => 5)
  end
  let(:configuration) { Hiring::Configure.new(company:, actor: admin) }
  let(:receipt) do
    source = Mail.new do
      from "Jaya Rao <jaya@example.test>"
      to "hiring@example.test"
      subject "Application for Rails developer"
      message_id "application-ack@example.test"
      body "Please consider my application."
      attachments["resume.txt"] = "Private resume"
    end.encoded
    record = Hiring::ReceiveEmail.new(mailbox:, source:).process
    Hiring::EmailIntake.new(record).process
    record.reload
  end

  before do
    # A sending claim must commit before SMTP, as it does in a real worker.
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
    admin.add_role(:admin, company)
    membership
    receipt
  end

  def approve
    setting = configuration.save_draft!(details:, lock_version: nil)
    configuration.approve!(lock_version: setting.lock_version)
  end

  def queue
    Hiring::Acknowledgement.new(receipt:, actor: admin).queue
  end

  def deliver(message)
    HiringDeliveryJob.perform_now(message.id)
    message.reload
  end

  def with_smtp_response(quit_status: 221, reject_mail: false)
    server = TCPServer.new("127.0.0.1", 0)
    commands = []
    listener = Thread.new do
      socket = server.accept
      socket.write("220 localhost synthetic SMTP\r\n")
      while (line = socket.gets)
        command = line.split.first
        commands << command
        case command
        when "EHLO", "HELO", "RCPT" then socket.write("250 OK\r\n")
        when "MAIL" then socket.write(reject_mail ? "550 Rejected\r\n" : "250 OK\r\n")
        when "DATA"
          socket.write("354 End with dot\r\n")
          while (body_line = socket.gets)
            break if body_line == ".\r\n"
          end
          socket.write("250 Accepted\r\n")
        when "QUIT"
          socket.write("#{quit_status} Session closed\r\n")
          break
        end
      end
    ensure
      socket&.close
    end
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *args|
      original.call(*args).tap do |delivery|
        delivery.message.delivery_method(:smtp, address: "127.0.0.1", port: server.addr[1], domain: "localhost",
          enable_starttls: false, enable_starttls_auto: false, open_timeout: 2, read_timeout: 2)
      end
    end
    Timeout.timeout(5) { yield commands }
    listener.value
  ensure
    server&.close
    listener&.kill if listener&.alive?
    listener&.join
  end

  it "requires an explicit confirmed recipient and approved version to acknowledge an existing receipt" do
    setting = approve
    service = Hiring::Acknowledgement.new(receipt:, actor: admin)
    confirmed = { lock_version: receipt.lock_version, approved_setting_version: setting.lock_version, recipient: "jaya@example.test" }
    expect(HiringMessage.count).to eq(0)
    expect { service.queue_existing!(**confirmed.merge(recipient: [])) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { service.queue_existing!(**confirmed.merge(approved_setting_version: setting.lock_version - 1)) }.to raise_error(Hiring::Intake::Conflict)
    expect { service.queue_existing!(**confirmed.merge(recipient: "forwarder@example.test")) }.to raise_error(Hiring::Intake::Conflict)
    expect { service.queue_existing!(**confirmed.merge(lock_version: receipt.lock_version + 1)) }.to raise_error(Hiring::Intake::Conflict)
    expect(HiringMessage.count).to eq(0)

    message = service.queue_existing!(**confirmed)
    expect(service.queue_existing!(**confirmed).id).to eq(message.id)
    expect(message).to have_attributes(state: "queued", queued_by_id: admin.id, approved_setting_version: setting.lock_version)
    expect(message.content.fetch("to")).to eq("jaya@example.test")
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(HiringMessage.count).to eq(1)
  end

  it "rechecks current approval, inbox, application, recipient and actor for explicit acknowledgements" do
    setting = approve
    service = Hiring::Acknowledgement.new(receipt:, actor: admin)
    confirmed = { lock_version: receipt.lock_version, approved_setting_version: setting.lock_version, recipient: "jaya@example.test" }
    mailbox.update!(active: false)
    expect { service.queue_existing!(**confirmed) }.to raise_error(Hiring::Intake::InvalidInput)
    mailbox.update!(active: true)
    receipt.hiring_application.update!(stage: "withdrawn")
    expect { service.queue_existing!(**confirmed) }.to raise_error(Hiring::Intake::InvalidInput)
    receipt.hiring_application.update!(stage: "received")
    receipt.hiring_application.hiring_candidate.update!(email: "changed@example.test")
    expect { service.queue_existing!(**confirmed) }.to raise_error(Hiring::Intake::Conflict)
    receipt.hiring_application.hiring_candidate.update!(email: "jaya@example.test")
    membership.discard
    expect { service.queue_existing!(**confirmed) }.to raise_error(Pundit::NotAuthorizedError)
    membership.undiscard
    User.where(id: admin.id).update_all(current_workspace_id: create(:company).id)
    expect { service.queue_existing!(**confirmed) }.to raise_error(Pundit::NotAuthorizedError)
    admin.update!(current_workspace: company)
    configuration.save_draft!(details: details.merge("client_count" => 6), lock_version: setting.lock_version)
    expect { service.queue_existing!(**confirmed) }.to raise_error(Hiring::Intake::Conflict)
    expect(HiringMessage.count).to eq(0)
  end

  it "requires approval, queues one operation and freezes an encrypted message snapshot" do
    expect(queue).to be_nil
    setting = approve
    message = queue
    expect(queue.id).to eq(message.id)
    expect(message).to have_attributes(state: "queued", approved_setting_version: setting.lock_version, queued_by_id: admin.id)
    expect(message.content).to include("to" => "jaya@example.test", "reply_to" => mailbox.source_email,
      "subject" => details.fetch("acknowledgement_subject"))
    expect(message.content.fetch("body")).to include(*details.except("acknowledgement_subject", "client_count").values, "5")
    expect(message.read_attribute_before_type_cast(:content)).not_to include("jaya@example.test", "Approved")
    expect(HiringMessage.count).to eq(1)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "retries a confirmed failure with a new approved snapshot while preserving the original operation and attempt" do
    setting = approve
    first = queue
    original = first.content
    first.update!(state: "failed", error_code: "transport_rejected")
    version = first.lock_version
    receipt.hiring_application.hiring_candidate.update!(email: "updated@example.test")
    draft = configuration.save_draft!(details: details.merge("client_count" => 6), lock_version: setting.lock_version)
    current = configuration.approve!(lock_version: draft.lock_version)
    confirmed = { lock_version: receipt.lock_version, message_lock_version: version,
      approved_setting_version: current.lock_version, recipient: "updated@example.test" }
    service = Hiring::Acknowledgement.new(receipt:, actor: admin)
    second = service.retry!(message: first, **confirmed)

    expect(second).to have_attributes(original_message_id: first.id, attempt_number: 2, state: "queued",
      approved_setting_version: current.lock_version, queued_by_id: admin.id)
    expect(second.content).to include("to" => "updated@example.test")
    expect(second.content.fetch("body")).to include("Clients: 6")
    expect(first.reload).to have_attributes(content: original, state: "failed", lock_version: version)
    expect(HiringMessage.operations.count).to eq(1)
    expect(HiringMessage.count).to eq(2)
    require Rails.root.join("db/migrate/20261025133300_preserve_hiring_send_attempts")
    expect { PreserveHiringSendAttempts.new.down }.to raise_error(ActiveRecord::IrreversibleMigration)
    expect { service.retry!(message: first, **confirmed) }.to raise_error(Hiring::Intake::Conflict)
    deliver(first)
    expect(deliver(second).state).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    expect(ActionMailer::Base.deliveries.sole.to).to eq(["updated@example.test"])
  end

  it "requires evidence and a stopped original worker to reconcile an unknown send before an explicit retry" do
    setting = approve
    first = queue
    first.update!(state: "uncertain", error_code: "transport_unknown", started_at: 20.minutes.ago)
    service = Hiring::Acknowledgement.new(receipt:, actor: admin)
    confirmed = { lock_version: receipt.lock_version, approved_setting_version: setting.lock_version, recipient: "jaya@example.test" }
    expect { service.retry!(message: first, message_lock_version: first.lock_version, **confirmed) }.to raise_error(Hiring::Intake::Conflict)
    reconciliation = { message: first, lock_version: first.lock_version, outcome: "not_accepted",
      evidence: "Provider log reference SYNTHETIC-42 confirms rejection; original worker has exited.", worker_stopped: false }
    expect { service.reconcile!(**reconciliation) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { service.reconcile!(**reconciliation.merge(worker_stopped: true, evidence: " ")) }.to raise_error(Hiring::Intake::InvalidInput)
    service.reconcile!(**reconciliation.merge(worker_stopped: true))
    expect(first.reload).to have_attributes(state: "uncertain", resolution: "not_accepted", resolved_by_id: admin.id, sent_at: nil)
    expect(first.resolution_details.fetch("evidence")).to include("SYNTHETIC-42")
    expect(first.read_attribute_before_type_cast(:resolution_details)).not_to include("SYNTHETIC-42")
    expect(first.audits.last.audited_changes.to_s).not_to include("SYNTHETIC-42")
    expect(ActionMailer::Base.deliveries).to be_empty

    second = service.retry!(message: first, message_lock_version: first.lock_version, **confirmed)
    first.update!(state: "sent", sent_at: Time.current)
    expect(deliver(second)).to have_attributes(state: "failed", error_code: "previous_attempt_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "records operator-reported acceptance separately from SMTP acceptance and never retries it" do
    setting = approve
    first = queue
    first.update!(state: "uncertain", error_code: "interrupted", started_at: 20.minutes.ago)
    service = Hiring::Acknowledgement.new(receipt:, actor: admin)
    service.reconcile!(message: first, lock_version: first.lock_version, outcome: "accepted",
      evidence: "Provider event SYNTHETIC-43 shows acceptance.", worker_stopped: false)
    expect(first.reload).to have_attributes(state: "uncertain", resolution: "accepted", sent_at: nil)
    expect(first.resolved_at).to be_present
    expect { first.update!(resolution_details: { "evidence" => "Changed" }) }.to raise_error(ActiveRecord::RecordInvalid)
    expect do
      service.retry!(message: first.reload, message_lock_version: first.lock_version, lock_version: receipt.lock_version,
        approved_setting_version: setting.lock_version, recipient: "jaya@example.test")
    end.to raise_error(Hiring::Intake::Conflict)
    expect(HiringMessage.count).to eq(1)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "retains a real acceptance reported after recovery marked the sending claim uncertain" do
    approve
    message = queue
    allow_any_instance_of(Mail::TestMailer).to receive(:deliver!).and_wrap_original do |delivery, *arguments|
      result = delivery.call(*arguments)
      HiringMessage.find(message.id).update!(state: "uncertain", error_code: "interrupted")
      result
    end
    expect(deliver(message)).to have_attributes(state: "sent", error_code: nil)
    expect(message.sent_at).to be_present
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    expect(deliver(message).state).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  end

  it "does not send a claimed attempt quarantined while the mailer was preparing it" do
    approve
    message = queue
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |mailer, *arguments|
      HiringMessage.find(message.id).update!(state: "uncertain", error_code: "interrupted")
      mailer.call(*arguments)
    end
    expect(deliver(message)).to have_attributes(state: "uncertain", error_code: "interrupted")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "rechecks permission after mail preparation before contacting the mail server" do
    approve
    message = queue
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |mailer, *arguments|
      membership.discard
      mailer.call(*arguments)
    end
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "approval_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "denies foreign or stale retry targets, revoked actors and invalid attempt identities" do
    setting = approve
    first = queue
    first.update!(state: "failed", error_code: "transport_rejected")
    service = Hiring::Acknowledgement.new(receipt:, actor: admin)
    confirmed = { lock_version: receipt.lock_version, approved_setting_version: setting.lock_version, recipient: "jaya@example.test" }
    expect { service.retry!(message: first, message_lock_version: first.lock_version + 1, **confirmed) }.to raise_error(Hiring::Intake::Conflict)
    expect { service.retry!(message: first, message_lock_version: [], **confirmed) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { service.retry!(message: first, message_lock_version: first.lock_version, **confirmed.merge(recipient: "changed@example.test")) }
      .to raise_error(Hiring::Intake::Conflict)
    membership.discard
    expect { service.retry!(message: first, message_lock_version: first.lock_version, **confirmed) }.to raise_error(Pundit::NotAuthorizedError)
    membership.undiscard

    foreign = create(:company)
    person = HiringCandidate.create!(company: foreign, full_name: "Other Candidate", email: "other@example.test")
    application = HiringApplication.create!(company: foreign, hiring_candidate: person, request_key: SecureRandom.uuid,
      source: "manual", received_at: Time.current, creation_details: { "full_name" => person.full_name, "email" => person.email })
    other_setting = HiringSetting.create!(company: foreign, details:)
    other_message = HiringMessage.create!(company: foreign, hiring_application: application, hiring_setting: other_setting,
      approved_setting_version: other_setting.lock_version, content: first.content, state: "failed")
    expect { service.retry!(message: other_message, message_lock_version: other_message.lock_version, **confirmed) }
      .to raise_error(Pundit::NotAuthorizedError)
    expect { first.dup.save! }.to raise_error(ActiveRecord::RecordNotUnique)
    expect { HiringMessage.where(id: first.id).update_all(original_message_id: other_message.id, attempt_number: 2) }
      .to raise_error(ActiveRecord::InvalidForeignKey)
    expect { HiringMessage.where(id: first.id).update_all(attempt_number: 0) }.to raise_error(ActiveRecord::StatementInvalid)
    expect { HiringMessage.where(id: first.id).update_all(resolved_at: Time.current) }.to raise_error(ActiveRecord::StatementInvalid)
    expect(first.reload.state).to eq("failed")
    expect(first.original_message_id).to be_nil
  end

  it "sends once through the real mailer and records provider acceptance separately from queuing" do
    approve
    message = queue
    expect(message.enqueued_at).to be_present
    deliver(message)
    deliver(message)
    expect(message).to have_attributes(state: "sent", error_code: nil)
    expect(message.started_at).to be_present
    expect(message.sent_at).to be_present
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    email = ActionMailer::Base.deliveries.last
    expect(email.to).to eq(["jaya@example.test"])
    expect(email.reply_to).to eq(["hiring@example.test"])
    expect(email.body.decoded).to eq(message.content.fetch("body"))
    expect(email.cc).to be_nil
    expect(email.bcc).to be_nil
  end

  it "blocks stale approvals even after a new approval of the same template" do
    setting = approve
    message = queue
    configuration.approve!(lock_version: setting.lock_version)
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "approval_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "blocks edited templates and never sends old applications just because settings were approved" do
    setting = approve
    expect(HiringMessage.count).to eq(0)
    message = queue
    configuration.save_draft!(details: details.merge("pto" => "Updated PTO"), lock_version: setting.lock_version)
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "approval_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "rechecks the approver's active membership at delivery" do
    approve
    message = queue
    membership.discard
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "approval_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "rechecks a distinct queueing actor without relying on their current workspace" do
    approve
    operator = create(:user, current_workspace: company)
    employment = create(:employment, company:, user: operator, resigned_at: nil)
    operator.add_role(:admin, company)
    message = Hiring::Acknowledgement.new(receipt:, actor: operator).queue
    employment.discard
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "permission_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "allows background delivery after an authorized user switches workspaces" do
    approve
    message = queue
    admin.update!(current_workspace: create(:company))
    expect(deliver(message).state).to eq("sent")
  end

  it "blocks disabled source mailboxes" do
    approve
    message = queue
    mailbox.update!(active: false)
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "source_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "does not resend an interrupted sending operation and exposes it as uncertain when stale" do
    approve
    message = queue
    message.update!(state: "sending", started_at: 20.minutes.ago)
    expect(deliver(message)).to have_attributes(state: "uncertain", error_code: "interrupted")
    deliver(message)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "preserves an active sending operation when a duplicate job arrives" do
    approve
    message = queue
    message.update!(state: "sending", started_at: Time.current)
    expect(deliver(message).state).to eq("sending")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "allows only one of two concurrent delivery workers to reach SMTP" do
    approve
    message = queue
    arrived, release = Queue.new, Queue.new
    allow_any_instance_of(Mail::TestMailer).to receive(:deliver!).and_wrap_original do |original, *args|
      arrived << true
      release.pop
      original.call(*args)
    end
    first = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        Hiring::Delivery.new(HiringMessage.find(message.id)).deliver
      end
    end
    Timeout.timeout(5) { arrived.pop }
    expect(Hiring::Delivery.new(HiringMessage.find(message.id)).deliver.state).to eq("sending")
    release << true
    first.value
    expect(message.reload.state).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  ensure
    release << true if release
    first&.join(5)
  end

  it "deduplicates concurrent copies received at two mailboxes" do
    approve
    other = HiringMailbox.create!(company:, name: "Other inbox", source_email: "other@example.test")
    source = Mail.from_source(receipt.raw_email.download)
    source.message_id = "racing-application@example.test"
    raw_source = source.encoded
    ready, start = Queue.new, Queue.new
    threads = [mailbox, other].map do |destination|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          start.pop
          copy = Mail.from_source(raw_source)
          copy.to = destination.source_email
          received = Hiring::ReceiveEmail.new(mailbox: destination, source: copy.encoded).process
          Hiring::EmailIntake.new(received).process
          received.reload.hiring_application_id
        end
      end
    end
    2.times { Timeout.timeout(5) { ready.pop } }
    2.times { start << true }
    expect(threads.map(&:value).uniq.size).to eq(1)
    expect(company.hiring_applications.count).to eq(2)
    expect(company.hiring_receipts.count).to eq(3)
    expect(company.hiring_messages.count).to eq(1)
  ensure
    2.times { start << true } if start
    threads&.each { |thread| thread.join(5) }
  end

  it "records ambiguous transport failures without a retry or private delivery logs" do
    approve
    message = queue
    log = StringIO.new
    logger = ActiveSupport::Logger.new(log)
    previous_logger = ActionMailer::Base.logger
    ActionMailer::Base.logger = logger
    allow_any_instance_of(Mail::TestMailer).to receive(:deliver!).and_raise(IOError, "Lost response for jaya@example.test: private data")
    expect(deliver(message)).to have_attributes(state: "uncertain", error_code: "transport_unknown")
    deliver(message)
    expect(log.string).to include(message.id.to_s)
    expect(log.string).not_to include("jaya@example.test", "private data", "Approved", "Private resume")
  ensure
    ActionMailer::Base.logger = previous_logger
  end

  it "keeps generic SMTP errors unknown without leaking the provider's error" do
    approve
    message = queue
    allow_any_instance_of(Mail::TestMailer).to receive(:deliver!).and_raise(Net::SMTPFatalError, "550 jaya@example.test rejected")
    expect(deliver(message)).to have_attributes(state: "uncertain", error_code: "transport_unknown", sent_at: nil)
    expect(message.retryable?).to be(false)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  [451, 500, 535, 550].each do |status|
    it "does not permit a retry after SMTP acceptance followed by QUIT #{status}" do
      approve
      message = queue
      with_smtp_response(quit_status: status) do |commands|
        expect(deliver(message)).to have_attributes(state: "uncertain", error_code: "transport_unknown", sent_at: nil)
        expect(message.retryable?).to be(false)
        deliver(message)
        expect(commands.count("DATA")).to eq(1)
      end
    end
  end

  it "requires provider review for an unqualified SMTP authentication error" do
    approve
    message = queue
    allow_any_instance_of(Mail::TestMailer).to receive(:deliver!).and_raise(Net::SMTPAuthenticationError, "535 Synthetic authentication failed")
    expect(deliver(message)).to have_attributes(state: "uncertain", error_code: "transport_unknown", sent_at: nil)
    expect(message.retryable?).to be(false)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "requires provider review when an SMTP status error has no retained protocol phase" do
    approve
    message = queue
    with_smtp_response(reject_mail: true) do |commands|
      expect(deliver(message)).to have_attributes(state: "uncertain", error_code: "transport_unknown", sent_at: nil)
      expect(message.retryable?).to be(false)
      expect(commands).not_to include("DATA")
    end
  end

  it "does not claim acceptance when mail delivery is disabled" do
    approve
    message = queue
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *args|
      original.call(*args).tap { |delivery| delivery.message.perform_deliveries = false }
    end
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "delivery_disabled", sent_at: nil)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "destroys one company's attempt history without purging another company's shared email" do
    approve
    source = receipt.source
    other = create(:company)
    other_mailbox = HiringMailbox.create!(company: other, name: "Other hiring", source_email: "other@example.test")
    other_receipt = Hiring::ReceiveEmail.new(mailbox: other_mailbox, source:).process
    Hiring::EmailIntake.new(other_receipt).process
    expect(other_receipt.raw_email.blob_id).to eq(receipt.raw_email.blob_id)
    first = queue
    first.update!(state: "uncertain", error_code: "interrupted", started_at: Time.current)
    service = Hiring::Acknowledgement.new(receipt:, actor: admin)
    service.reconcile!(message: first, lock_version: first.lock_version, outcome: "not_accepted",
      evidence: "Synthetic provider confirmed rejection; worker exited.", worker_stopped: true)
    service.retry!(message: first, message_lock_version: first.lock_version, lock_version: receipt.lock_version,
      approved_setting_version: company.hiring_setting.lock_version, recipient: "jaya@example.test")
    receipt.inbound_email.destroy!

    company_id = company.id
    company.destroy!
    perform_enqueued_jobs(only: ActiveStorage::PurgeJob)
    expect(HiringMessage.where(company_id:)).not_to exist
    expect(HiringReceipt.where(company_id:)).not_to exist
    expect(HiringCandidate.where(company_id:)).not_to exist
    expect(HiringApplication.where(company_id:)).not_to exist
    expect(other_receipt.reload.source).to eq(source)
    expect(other_receipt.hiring_application.reload.company_id).to eq(other.id)
  end

  it "does not treat a Postmark inactive recipient error as a successful send" do
    approve
    message = queue
    allow_any_instance_of(Mail::TestMailer).to receive(:deliver!).and_raise(Postmark::InactiveRecipientError, "Inactive jaya@example.test")
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "transport_rejected")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "retains a recoverable operation when the durable queue is unavailable" do
    approve
    allow(HiringDeliveryJob).to receive(:perform_later).and_raise(SolidQueue::Job::EnqueueError, "Database unavailable")
    message = queue
    expect(message.reload).to have_attributes(state: "queued", error_code: "queue_unavailable", enqueued_at: nil)
    allow(HiringDeliveryJob).to receive(:perform_later).and_call_original
    HiringMessage.recover_deliveries
    expect(message.reload.enqueued_at).to be_present
    expect(message.error_code).to be_nil
  end

  it "records a refused enqueue as unavailable and leaves it recoverable" do
    approve
    allow(HiringDeliveryJob).to receive(:perform_later).and_return(false)
    message = queue
    expect(message.reload).to have_attributes(state: "queued", error_code: "queue_unavailable", enqueued_at: nil)
    allow(HiringDeliveryJob).to receive(:perform_later).and_call_original
    HiringMessage.recover_deliveries
    expect(message.reload.enqueued_at).to be_present
    expect(message.error_code).to be_nil
  end

  it "rejects messages that mix a tenant's application with another tenant's settings" do
    approve
    message = queue
    other_setting = HiringSetting.create!(company: create(:company), details:)
    message.hiring_setting = other_setting
    expect(message).not_to be_valid
    expect { HiringMessage.where(id: message.id).update_all(hiring_setting_id: other_setting.id) }.to raise_error(ActiveRecord::InvalidForeignKey)
  end

  it "queues acknowledgements automatically only for new applications received after approval" do
    approve
    source = receipt.raw_email.download
    email = Mail.from_source(source)
    email.message_id = "second-application@example.test"
    fresh = Hiring::ReceiveEmail.new(mailbox:, source: email.encoded).process
    Hiring::EmailIntake.new(fresh).process
    Hiring::EmailIntake.new(fresh).process
    expect(HiringMessage.count).to eq(1)
    expect(HiringMessage.first.hiring_application_id).to eq(fresh.reload.hiring_application_id)
    expect(HiringMessage.first.queued_by_id).to be_nil
    expect(deliver(HiringMessage.first).state).to eq("sent")
  end

  it "does not resend if persisting SMTP success fails" do
    approve
    message = queue
    allow(message).to receive(:update!).and_call_original
    allow(message).to receive(:update!).with(hash_including(state: "sent")).and_raise(ActiveRecord::ConnectionFailed)
    expect { Hiring::Delivery.new(message).deliver }.to raise_error(ActiveRecord::ConnectionFailed)
    expect(message.reload.state).to eq("sending")
    expect(deliver(message).state).to eq("sending")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  end

  it "recovers lost enqueue operations and stale sending claims without resending unknown outcomes" do
    approve
    message = queue
    message.update!(enqueued_at: nil)
    HiringMessage.recover_deliveries
    expect(message.reload.enqueued_at).to be_present
    message.update!(state: "sending", started_at: 20.minutes.ago)
    HiringMessage.recover_deliveries
    expect(message.reload).to have_attributes(state: "uncertain", error_code: "interrupted")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "does not let enqueue bookkeeping race a fast worker's final state" do
    approve
    message = queue
    message.update!(enqueued_at: nil)
    allow(HiringDeliveryJob).to receive(:perform_later) do |id|
      HiringDeliveryJob.perform_now(id)
      instance_double(HiringDeliveryJob, successfully_enqueued?: true)
    end
    expect { message.enqueue }.not_to raise_error
    expect(message.reload.state).to eq("sent")
  end

  it "does not allow changing a queued operation's recipient or approved content" do
    approve
    message = queue
    message.content = message.content.merge("to" => "other@example.test")
    expect(message).not_to be_valid
  end

  it "blocks a changed reply address or recipient and a withdrawn application" do
    approve
    message = queue
    mailbox.update!(source_email: "another@example.test")
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "source_changed")
    mailbox.update!(source_email: "hiring@example.test")
    message.update!(state: "queued")
    receipt.hiring_application.hiring_candidate.update!(email: "updated@example.test")
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "recipient_changed")
    receipt.hiring_application.hiring_candidate.update!(email: "jaya@example.test")
    receipt.hiring_application.update!(stage: "withdrawn")
    message.update!(state: "queued")
    expect(deliver(message)).to have_attributes(state: "failed", error_code: "application_closed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "keeps successful notification payloads and debug logs free of private text" do
    approve
    message = queue
    payloads = []
    subscriber = ActiveSupport::Notifications.subscribe("deliver.action_mailer") { |event| payloads << event.payload }
    deliver(message)
    expect(payloads.size).to eq(1)
    expect(payloads.first).to include(message_id: "hiring-#{message.id}@miru", perform_deliveries: true)
    expect(payloads.to_json).not_to include("jaya@example.test", "Approved", "Private resume")
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
  end
end
