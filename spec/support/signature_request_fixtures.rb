# frozen_string_literal: true

module SignatureRequestFixtures
  def signature_context(record)
    record.reload
    { company_id: record.company_id, lock_version: record.lock_version,
      revision_id: record.current_revision_id, content_digest: record.current_revision.content_digest }
  end

  def approved_signature_request(company:, actor:, client: nil, employment: nil)
    source = Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    file = Rack::Test::UploadedFile.new(source, "application/pdf")
    upload = Signatures::Upload.new([ActionDispatch::Http::UploadedFile.new(
      tempfile: file.tempfile, filename: "synthetic.pdf", type: "application/pdf")])
    record = SignatureRequest.create!(company:, created_by: actor, client:, employment:, title: "Synthetic approved contract",
      creation_key: SecureRandom.uuid, creation_digest: "a" * 64)
    upload.with_cleanup { record.with_lock { record.revise!(actor:, attributes: {}, upload:) } }
    record.with_lock do
      record.revise!(actor:, attributes: {
        recipients: [{ id: "signer", name: "Synthetic Signer", email: "signer@example.test", role: "signer" }],
        fields: [{ id: "signature", document_id: record.current_revision.documents.first.fetch("key"),
          recipient_id: "signer", type: "signature", label: "Signature", page: 1,
          x: 10, y: 70, width: 30, height: 8, required: true, read_only: false }]
      })
    end
    Signatures::Review.new(record, actor:, attributes: signature_context(record).merge(
      approval_source: "manual", approval_note: "Synthetic external approval evidence")).approve
    record.reload
  ensure
    file&.close
  end

  def provider_signature_record(revision, status: "COMPLETED")
    payload = Signatures::Envelope.new(revision).payload(operation_id: revision.operation_id)
    id = revision.provider_envelope_id
    items = revision.documents.each_index.map { |index| { "id" => "item_#{index}", "envelopeId" => id, "order" => index } }
    people = payload.fetch("recipients").each_with_index.map do |person, index|
      person.except("fields", "accessAuth", "actionAuth").merge("id" => index + 1, "envelopeId" => id,
        "authOptions" => { "accessAuth" => person.fetch("accessAuth"), "actionAuth" => person.fetch("actionAuth") },
        "signingStatus" => status == "COMPLETED" || person["role"] == "CC" ? "SIGNED" : "NOT_SIGNED",
        "sendStatus" => "SENT", "readStatus" => status == "COMPLETED" ? "OPENED" : "NOT_OPENED")
    end
    fields = payload.fetch("recipients").each_with_index.flat_map do |person, index|
      person.fetch("fields").map do |field|
        field.except("identifier").merge("envelopeId" => id, "envelopeItemId" => items[field.fetch("identifier")].fetch("id"),
          "recipientId" => people[index].fetch("id"), "customText" => "", "inserted" => status == "COMPLETED")
      end
    end
    fields.each_with_index { |field, index| field["id"] = index + 1 }
    { "id" => id, "title" => revision.title, "type" => "DOCUMENT", "status" => status,
      "externalId" => revision.operation_id, "authOptions" => nil, "documentMeta" => payload.fetch("meta"),
      "envelopeItems" => items, "recipients" => people, "fields" => fields }
  end

  def completed_signature_request(company:, actor:, connection:, provider:, client: nil, employment: nil)
    record = approved_signature_request(company:, actor:, client:, employment:)
    revision = record.current_revision
    revision.update!(signature_connection: connection, operation_id: SecureRandom.uuid,
      provider_envelope_id: "envelope_#{revision.id}", provider_status: "PENDING", status: "awaiting_signatures")
    allow(provider).to receive(:get).with(revision.provider_envelope_id).and_return(provider_signature_record(revision))
    allow(provider).to receive(:original).with("item_0").and_return(revision.original_bytes(revision.documents.first.fetch("key")).first)
    allow(provider).to receive(:signed).with("item_0").and_return(File.binread(Rails.root.join("spec/fixtures/files/signature-sealed-synthetic.pdf")))
    evidence = File.binread(Rails.root.join("docs/qa/generic-document-signing-2462/qa-addendum.pdf"))
    allow(provider).to receive(:certificate).with(revision.provider_envelope_id).and_return(evidence)
    allow(provider).to receive(:audit_log).with(revision.provider_envelope_id).and_return(evidence)
    raise "Synthetic archive setup failed" unless Signatures::Reconcile.new(revision).process

    revision.reload
  end
end
