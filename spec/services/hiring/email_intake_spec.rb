# frozen_string_literal: true

require "rails_helper"
require "tmpdir"

RSpec.describe "Hiring email intake" do
  let(:company) { create(:company) }
  let(:mailbox) { HiringMailbox.create!(company:, name: "Hello", source_email: "hello@example.test") }
  let(:source) { application_email.encoded }

  def application_email
    Mail.new do
      from "Jaya Rao <jaya@example.test>"
      to "hello@example.test"
      message_id "application-42@applicant.example.test"
      date Time.utc(2026, 10, 22, 9)
      subject "Application for Rails developer"
      text_part do
        body "My Rails experience and work samples are in the attached resume."
      end
      attachments["resume.txt"] = "Jaya's resume and private contact details"
    end
  end

  def receive_email(raw = source, destination: mailbox)
    receipt = Hiring::ReceiveEmail.new(mailbox: destination, source: raw).process
    Hiring::EmailIntake.new(receipt).process
    receipt.reload
  end

  it "preserves the original message, attachments and mailbox while withholding unapproved acknowledgements" do
    receipt = receive_email
    application = receipt.hiring_application

    expect(receipt).to have_attributes(state: "accepted", company_id: company.id, hiring_mailbox_id: mailbox.id)
    expect(application).to have_attributes(source: "email", submitted_name: "Jaya Rao", company_id: company.id)
    expect(application.hiring_candidate.email).to eq("jaya@example.test")
    expect(receipt.raw_email.download).to eq(source)
    expect(receipt.details).to include("subject" => "Application for Rails developer", "source_email" => "hello@example.test")
    expect(receipt.details.fetch("text")).to include("My Rails experience")
    expect(receipt.details.fetch("attachments").first).to include("filename" => "resume.txt", "bytes" => 41)
    expect(receipt.received_at).to be > Time.utc(2026, 10, 22, 9)
    expect(receipt.read_attribute_before_type_cast(:details)).not_to include("jaya@example.test", "Rails experience")
    expect(HiringMessage.count).to eq(0)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "does not parse a retained source whose storage has become public" do
    record = Hiring::ReceiveEmail.new(mailbox:, source:).process
    allow(record.raw_email.blob.service).to receive(:public?).and_return(true)

    expect { Hiring::EmailIntake.new(record).process }.to raise_error(Hiring::ReceiveEmail::Unavailable)
    expect(record.reload.state).to eq("pending")
    expect(HiringApplication.count).to eq(0)
  end

  it "does not reuse a public transport blob when the selected ingress storage is private" do
    record = Hiring::ReceiveEmail.new(mailbox:, source:).process
    public_service = instance_double(ActiveStorage::Service::DiskService, public?: true)
    allow_any_instance_of(ActiveStorage::Blob).to receive(:service).and_return(public_service)
    other = HiringMailbox.create!(company:, name: "Other", source_email: "other@example.test")

    expect { Hiring::ReceiveEmail.new(mailbox: other, source:).process }.to raise_error(Hiring::ReceiveEmail::Unavailable)
    expect(HiringReceipt.count).to eq(1)
    expect(record.raw_email).to be_attached
  end

  it "bounds source downloads by metadata and actual streamed bytes" do
    record = Hiring::ReceiveEmail.new(mailbox:, source:).process
    blob = record.raw_email.blob
    blob.update!(byte_size: Hiring::ReceiveEmail::MAX_BYTES + 1)
    expect { record.source }.to raise_error(Hiring::ReceiveEmail::Unavailable)
    blob.update!(byte_size: source.bytesize)
    chunk = "x" * 1.megabyte
    allow(blob).to receive(:download) { |&block| 21.times { block.call(chunk) } }
    expect { record.source }.to raise_error(Hiring::ReceiveEmail::Unavailable)
    expect(HiringApplication.count).to eq(0)
  end

  it "deduplicates retries and cross-mailbox copies without losing either source receipt" do
    first = receive_email
    retry_receipt = receive_email
    other_mailbox = HiringMailbox.create!(company:, name: "Admin", source_email: "admin@example.test")
    copy = Mail.from_source(source)
    copy.to = "admin@example.test"
    second = receive_email(copy.encoded, destination: other_mailbox)

    expect(retry_receipt.id).to eq(first.id)
    expect(second.id).not_to eq(first.id)
    expect(second.hiring_application_id).to eq(first.hiring_application_id)
    expect(company.hiring_candidates.count).to eq(1)
    expect(company.hiring_applications.count).to eq(1)
    expect(company.hiring_receipts.count).to eq(2)
    expect(second.details.fetch("source_email")).to eq("admin@example.test")
  end

  it "accepts a resume-only multipart email without trying to decode the multipart container as text" do
    email = Mail.new do
      from "Jaya Rao <jaya@example.test>"
      to "hello@example.test"
      message_id "attachment-only-44@applicant.example.test"
      subject "Application for Rails developer"
      attachments["resume.txt"] = "Resume without a cover letter"
    end
    receipt = receive_email(email.encoded)

    expect(receipt.state).to eq("accepted")
    expect(receipt.details.fetch("text")).to eq("")
    expect(receipt.details.fetch("attachments").first.fetch("filename")).to eq("resume.txt")
  end

  it "keeps identical applications independent between companies even when the raw message is shared" do
    first = receive_email
    other = create(:company)
    other_mailbox = HiringMailbox.create!(company: other, name: "Hiring", source_email: "hello@example.test")
    second = receive_email(destination: other_mailbox)

    expect(second.hiring_application_id).not_to eq(first.hiring_application_id)
    expect(second.hiring_application.hiring_candidate_id).not_to eq(first.hiring_application.hiring_candidate_id)
    expect(second.company_id).to eq(other.id)
    expect(second.inbound_email_id).to eq(first.inbound_email_id)
    expect(second.raw_email.download).to eq(source)
  end

  it "flags a plain-text forward for review instead of treating its forwarder as the candidate" do
    forward = Mail.new do
      from "admin@example.test"
      to "hello@example.test"
      message_id "forward-9@company.example.test"
      subject "Fwd: Application for Rails developer"
      body "---------- Forwarded message ---------\nFrom: Jaya <jaya@example.test>\nPlease see my application."
    end
    receipt = receive_email(forward.encoded)

    expect(receipt).to have_attributes(state: "review", review_reason: "forwarded_sender_unverified", hiring_application_id: nil)
    expect(company.hiring_candidates.count).to eq(0)
    expect(HiringMessage.count).to eq(0)
  end

  it "reads the original sender from an attached forwarded message" do
    forward = Mail.new do
      from "admin@example.test"
      to "hello@example.test"
      message_id "forward-10@company.example.test"
      subject "Fwd: Application for Rails developer"
    end
    forward.add_part(Mail::Part.new(content_type: "message/rfc822", body: source))
    receipt = receive_email(forward.encoded)

    expect(receipt.state).to eq("accepted")
    expect(receipt.hiring_application.hiring_candidate.email).to eq("jaya@example.test")
    expect(receipt.details.fetch("attachments").first.fetch("filename")).to eq("resume.txt")
  end

  it "adds a reply to the existing application without creating another application or acknowledgement" do
    first = receive_email
    reply = Mail.new do
      from "jaya@example.test"
      to "hello@example.test"
      message_id "followup-43@applicant.example.test"
      in_reply_to "application-42@applicant.example.test"
      subject "Re: Application for Rails developer"
      body "Here is the additional information for my application."
    end
    receipt = receive_email(reply.encoded)

    expect(receipt).to have_attributes(state: "accepted", hiring_application_id: first.hiring_application_id)
    expect(company.hiring_applications.count).to eq(1)
    expect(company.hiring_receipts.count).to eq(2)
    expect(HiringMessage.count).to eq(0)
  end

  it "flags changed content under an existing message identity without overwriting or acknowledging it" do
    first = receive_email
    changed = Mail.from_source(source)
    changed.subject = "Application for another role"
    receipt = receive_email(changed.encoded)

    expect(receipt).to have_attributes(state: "review", review_reason: "message_content_changed",
      hiring_application_id: first.hiring_application_id)
    expect(company.hiring_applications.count).to eq(1)
    expect(first.reload.details.fetch("subject")).to eq("Application for Rails developer")
    expect(HiringMessage.count).to eq(0)
  end

  it "retains the protected source after Action Mailbox incinerates its transport record" do
    receipt = receive_email
    inbound = receipt.inbound_email
    inbound.update!(status: :delivered)

    travel 31.days do
      perform_enqueued_jobs(only: ActiveStorage::PurgeJob) { inbound.incinerate }
    end

    expect(receipt.reload.inbound_email_id).to be_nil
    expect(receipt.raw_email.download).to eq(source)
  end

  it "keeps unclear, automated and sender-ambiguous messages for review without sending mail" do
    cases = [
      [->(mail) { mail.subject = "Invoice for services" }, "application_not_identified"],
      [->(mail) { mail["Auto-Submitted"] = "auto-replied" }, "automated_message"],
      [->(mail) { mail.from = ["jaya@example.test", "other@example.test"] }, "invalid_sender"]
    ]
    cases.each do |change, expected_reason|
      mail = application_email
      mail.message_id = SecureRandom.uuid + "@applicant.example.test"
      change.call(mail)
      receipt = receive_email(mail.encoded)
      expect(receipt).to have_attributes(state: "review", review_reason: expected_reason, hiring_application_id: nil)
    end
    expect(company.hiring_candidates.count).to eq(0)
    expect(HiringMessage.count).to eq(0)
  end

  it "retains an email with a missing original message ID for review without inventing an application identity" do
    without_id = source.sub(/^Message-ID:[^\r\n]*\r?\n/i, "")
    receipt = receive_email(without_id)

    expect(receipt).to have_attributes(state: "review", review_reason: "missing_message_id", hiring_application_id: nil)
    expect(receipt.raw_email.download).to eq(without_id)
    expect(HiringMessage.count).to eq(0)
  end

  it "retains a malformed reported date for review instead of crashing or inventing a timestamp" do
    raw = source.sub(/^Date:[^\r\n]*/, "Date: definitely-not-a-date")
    receipt = receive_email(raw)

    expect(receipt).to have_attributes(state: "review", review_reason: "invalid_date", hiring_application_id: nil)
    expect(receipt.details["original_date"]).to be_nil
    expect(receipt.raw_email.download).to eq(raw)
    expect(company.hiring_candidates.count).to eq(0)
  end

  it "holds already received work for review if its mailbox is disabled before processing" do
    receipt = Hiring::ReceiveEmail.new(mailbox:, source:).process
    mailbox.update!(active: false)
    Hiring::EmailIntake.new(receipt).process

    expect(receipt.reload).to have_attributes(state: "review", review_reason: "mailbox_disabled", hiring_application_id: nil)
    expect(company.hiring_candidates.count).to eq(0)
  end

  it "flags changed HTML alternatives even when the visible plain text is identical" do
    original = application_email
    original.html_part = Mail::Part.new(content_type: "text/html", body: '<a href="https://first.example.test">Work sample</a>')
    first = receive_email(original.encoded)
    changed = Mail.from_source(original.encoded)
    changed.html_part.body = '<a href="https://second.example.test">Work sample</a>'
    receipt = receive_email(changed.encoded)

    expect(receipt).to have_attributes(state: "review", review_reason: "message_content_changed",
      hiring_application_id: first.hiring_application_id)
    expect(company.hiring_applications.count).to eq(1)
  end

  it "preserves multiple forwarded originals for review instead of choosing one candidate" do
    forward = Mail.new do
      from "admin@example.test"
      to "hello@example.test"
      subject "Fwd: Applications"
      message_id "multiple-originals@company.example.test"
    end
    forward.add_part(Mail::Part.new(content_type: "message/rfc822", body: source))
    other = application_email
    other.from = "other@example.test"
    forward.add_part(Mail::Part.new(content_type: "message/rfc822", body: other.encoded))
    receipt = receive_email(forward.encoded)

    expect(receipt).to have_attributes(state: "review", review_reason: "ambiguous_forward", hiring_application_id: nil)
    expect(receipt.raw_email.download).to eq(forward.encoded)
    expect(company.hiring_candidates.count).to eq(0)
  end

  it "fails closed for a public Action Mailbox storage override even if normal application storage is private" do
    Dir.mktmpdir("miru-public-inbound-test") do |directory|
      public_service = ActiveStorage::Service::DiskService.new(root: directory, public: true)
      allow(ActionMailbox).to receive(:storage_service).and_return(:public_inbound)
      allow(ActiveStorage::Blob.services).to receive(:fetch).and_wrap_original do |original, name|
        name.to_s == "public_inbound" ? public_service : original.call(name)
      end

      expect { receive_email }.to raise_error(Hiring::ReceiveEmail::Unavailable)
      expect(HiringReceipt.count).to eq(0)
      expect(ActionMailbox::InboundEmail.count).to eq(0)
    end
  end

  it "quarantines oversized email headers while retaining the source for manual review" do
    large_header = source.sub("\r\n\r\n", "\r\nX-Large: #{'x' * 70_000}\r\n\r\n")
    receipt = receive_email(large_header)

    expect(receipt.state).to eq("review")
    expect(receipt.review_reason).to eq("header_limit")
    expect(receipt.hiring_application_id).to be_nil
    expect(receipt.raw_email.download).to eq(large_header)
    expect(company.hiring_candidates.count).to eq(0)
  end

  it "bounds multipart processing without dropping a complex application message" do
    mail = application_email
    101.times { |index| mail.add_part(Mail::Part.new(content_type: "text/plain", body: "Additional part #{index}")) }
    raw = mail.encoded
    receipt = receive_email(raw)

    expect(receipt.state).to eq("review")
    expect(receipt.review_reason).to eq("mime_part_limit")
    expect(receipt.hiring_application_id).to be_nil
    expect(receipt.raw_email.download).to eq(raw)
    expect(company.hiring_candidates.count).to eq(0)
  end

  it "bounds multipart processing when valid parts omit optional content-type headers" do
    raw = ["From: Jaya Rao <jaya@example.test>", "To: hello@example.test", "Message-ID: <headerless-parts@example.test>",
      "Subject: Application for Rails developer", 'Content-Type: multipart/mixed; boundary="bounded-parts"', "", ""].join("\r\n")
    101.times { |index| raw << "--bounded-parts\r\n\r\nPart #{index}\r\n" }
    raw << "--bounded-parts\r\nContent-Disposition: attachment; filename=resume.txt\r\n\r\nResume\r\n--bounded-parts--\r\n"

    receipt = receive_email(raw)
    expect(receipt.state).to eq("review")
    expect(receipt.review_reason).to eq("mime_part_limit")
    expect(receipt.raw_email.download).to eq(raw)
    expect(company.hiring_candidates.count).to eq(0)
  end

  it "does not mistake a forwarder for the applicant when forwarding exceeds the supported depth" do
    raw = source
    4.times do |index|
      forward = Mail.new do
        from "admin@example.test"
        to "hello@example.test"
        message_id "wrapped-#{index}@company.example.test"
        subject "Application for Rails developer"
      end
      forward.add_part(Mail::Part.new(content_type: "message/rfc822", filename: "forwarded.eml", body: raw))
      raw = forward.encoded
    end
    receipt = receive_email(raw)

    expect(receipt.state).to eq("review")
    expect(receipt.review_reason).to eq("forwarding_depth")
    expect(receipt.hiring_application_id).to be_nil
    expect(company.hiring_candidates.count).to eq(0)
  end
end
