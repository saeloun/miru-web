# frozen_string_literal: true

module SignatureRequestFixtures
  def signature_context(record)
    record.reload
    { company_id: record.company_id, lock_version: record.lock_version,
      revision_id: record.current_revision_id, content_digest: record.current_revision.content_digest }
  end

  def approved_signature_request(company:, actor:)
    source = Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    file = Rack::Test::UploadedFile.new(source, "application/pdf")
    upload = Signatures::Upload.new([ActionDispatch::Http::UploadedFile.new(
      tempfile: file.tempfile, filename: "synthetic.pdf", type: "application/pdf")])
    record = SignatureRequest.create!(company:, created_by: actor, title: "Synthetic approved contract",
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
end
