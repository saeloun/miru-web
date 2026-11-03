# frozen_string_literal: true

require "rails_helper"

RSpec.describe Signatures::SealedPdf do
  # Local Documenso output, with a disposable certificate valid only on October 24-26, 2026.
  let(:source) { Rails.root.join("spec/fixtures/files/signature-sealed-synthetic.pdf") }
  let(:fingerprint) { "eae7b329c848bdcbf3cc96829203a3dfddf922dc36b3afc4f03a14ff65b32ad7" }

  around do |example|
    travel_to(Time.utc(2026, 10, 25)) { example.run }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DOCUMENSO_SEAL_SHA256").and_return(fingerprint)
  end

  def verify(bytes)
    Tempfile.create(["synthetic-seal", ".pdf"]) do |file|
      file.binmode
      file.write(bytes)
      file.flush
      described_class.new(file.path).process
    end
  end

  it "verifies the actual provider seal against the configured certificate and every byte" do
    result = described_class.new(source).process
    expect(result).to include("seal_sha256" => fingerprint, "sha256" => Digest::SHA256.file(source).hexdigest)
    expect(result.fetch("pages").size).to eq(2)
    expect { Signatures::PdfInfo.new(source).process }.to raise_error(Signatures::PdfInfo::InvalidDocument)
  end

  it "rejects unsigned originals, truncated files, tampered content and unsigned appended bytes" do
    bytes = File.binread(source)
    tampered = bytes.sub("/Creator", "/Creater")
    expect(tampered).not_to eq(bytes)
    [File.binread(Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")),
      bytes.byteslice(0, bytes.size - 20), tampered, bytes + "\n% unsigned amendment\n"].each do |invalid|
      expect { verify(invalid) }.to raise_error(described_class::InvalidSeal)
    end
  end

  it "fails closed without an exact valid certificate pin" do
    [nil, "", "a" * 64, "eae7", fingerprint.upcase, "#{fingerprint},#{'b' * 64}"].each do |pin|
      allow(ENV).to receive(:[]).with("DOCUMENSO_SEAL_SHA256").and_return(pin)
      expect { described_class.new(source).process }.to raise_error(described_class::InvalidSeal)
    end
  end

  it "rejects a seal outside the pinned certificate validity period" do
    travel_to(Time.utc(2026, 10, 27))
    expect { described_class.new(source).process }.to raise_error(described_class::InvalidSeal)
  end
end
