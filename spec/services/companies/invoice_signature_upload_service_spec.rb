# frozen_string_literal: true

require "rails_helper"

RSpec.describe Companies::InvoiceSignatureUploadService do
  let(:company) { create(:company) }

  def upload_fixture(filename, content_type)
    Rack::Test::UploadedFile.new(
      Rails.root.join("spec", "support", "fixtures", filename),
      content_type
    )
  end

  it "attaches a valid PNG signature" do
    file = upload_fixture("test-signature.png", "image/png")

    result = described_class.process(company:, file:)

    expect(result).to be_success
    expect(company.reload.invoice_signature).to be_attached
  end

  it "rejects non-PNG files" do
    file = upload_fixture("pdf-file.pdf", "application/pdf")

    result = described_class.process(company:, file:)

    expect(result.error).to eq("Only PNG files are accepted")
    expect(company.reload.invoice_signature).not_to be_attached
  end

  it "rejects oversized PNG dimensions without image processing dependencies" do
    file = upload_fixture("test-signature-oversized.png", "image/png")

    result = described_class.process(company:, file:)

    expect(result.error).to eq("Dimensions must not exceed 300x150 pixels")
    expect(company.reload.invoice_signature).not_to be_attached
  end
end
