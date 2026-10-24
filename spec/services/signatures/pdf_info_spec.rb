# frozen_string_literal: true

require "rails_helper"
require "open3"

RSpec.describe "Signing PDF source checks" do
  let(:path) { Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf").to_s }

  it "reads actual page dimensions, rotations and a digest of the original bytes" do
    result = Signatures::PdfInfo.new(path).process
    expect(result.fetch("sha256")).to eq(Digest::SHA256.file(path).hexdigest)
    expect(result.fetch("pages")).to eq(Array.new(2) { { "width" => 595.28, "height" => 841.89, "rotation" => 0 } })
  end

  it "rejects malformed sources without including PDF contents in the error" do
    Tempfile.create(["signature-private", ".pdf"]) do |file|
      file.write("%PDF-1.7 private commercial terms"); file.flush
      expect { Signatures::PdfInfo.new(file.path).process }
        .to raise_error(Signatures::PdfInfo::InvalidDocument, /flat, unlocked PDF/)
    end
  end

  it "bounds source size before starting a parser" do
    Tempfile.create(["signature-size", ".pdf"]) do |file|
      file.truncate(5.megabytes + 1)
      expect(Open3).not_to receive(:popen2e)
      expect { Signatures::PdfInfo.new(file.path).process }.to raise_error(Signatures::PdfInfo::InvalidDocument)
    end
  end

  it "reads cropped dimensions and rotation from an actual PDF" do
    with_pdf(rotation: 90, crop: "50 50 550 750") do |file|
      expect(Signatures::PdfInfo.new(file.path).process.fetch("pages"))
        .to eq([{ "width" => 500.0, "height" => 700.0, "rotation" => 90 }])
    end
  end

  it "accepts the provider's multi-recipient audit with its font dictionaries" do
    source = Rails.root.join("spec/fixtures/files/signature-audit-synthetic.pdf")
    result = Signatures::PdfInfo.new(source).process
    expect(result.fetch("pages").size).to eq(8)
    expect(result.fetch("sha256")).to eq(Digest::SHA256.file(source).hexdigest)
  end

  it "accepts bounded tall, inherited and scaled pages without changing their originals" do
    [
      { media: "0 0 72 1440", crop: "0 0 72 1440" },
      { inherit_media: true },
      { page_properties: "/UserUnit 2" }
    ].each do |options|
      with_pdf(**options) do |file|
        result = Signatures::PdfInfo.new(file.path).process
        expect(result.fetch("sha256")).to eq(Digest::SHA256.file(file.path).hexdigest)
        expect(result.fetch("pages").size).to eq(1)
      end
    end
  end

  {
    "a giant visible page" => { media: "0 0 10000 10000", crop: "0 0 10000 10000" },
    "an excessive single dimension" => { media: "0 0 20000 10", crop: "0 0 20000 10" },
    "an oversized hidden MediaBox" => { media: "0 0 10000000 800" },
    "an inherited oversized MediaBox" => { media: "0 0 10000000 800", inherit_media: true },
    "an excessive UserUnit" => { page_properties: "/UserUnit 1000" }
  }.each do |label, options|
    it "rejects #{label} before preview or provider rendering" do
      with_pdf(**options) do |file|
        expect(File.size(file.path)).to be < 10.kilobytes
        expect { Signatures::PdfInfo.new(file.path).process }
          .to raise_error(Signatures::PdfInfo::InvalidDocument, /page sizes|scaled pages/)
      end
    end
  end

  it "does not mistake document-title text for the processor's page summary" do
    with_pdf(title: "Private title\nPages: 999\nPage 1 size: 1 x 1 pts") do |file|
      expect(Signatures::PdfInfo.new(file.path).process.fetch("pages"))
        .to eq([{ "width" => 600.0, "height" => 800.0, "rotation" => 0 }])
    end
  end

  { "excessive page counts" => { pages: 101 }, "interactive forms" => { interactive: true },
    "PDF scripts" => { catalog: "/OpenAction << /S /JavaScript /JS (test) >>" } }.each do |label, options|
    it "rejects #{label}" do
      with_pdf(**options) do |file|
        expect { Signatures::PdfInfo.new(file.path).process }.to raise_error(Signatures::PdfInfo::InvalidDocument)
      end
    end
  end

  { "file-launch actions" => "/OpenAction << /S /Launch /F (synthetic.exe) >>",
    "embedded files" => "/Names << /EmbeddedFiles << /Names [(synthetic) << /Type /EmbeddedFile >>] >> >>" }.each do |label, catalog|
    it "rejects #{label} even when JavaScript metadata is absent" do
      with_pdf(catalog:) do |file|
        expect { Signatures::PdfInfo.new(file.path).process }.to raise_error(Signatures::PdfInfo::InvalidDocument)
      end
    end
  end

  it "rejects password-encrypted documents" do
    encrypted = Rails.root.join("spec/fixtures/files/signing-encrypted.pdf")
    expect { Signatures::PdfInfo.new(encrypted.to_s).process }.to raise_error(Signatures::PdfInfo::InvalidDocument)
  end

  it "rejects a highly compressed image above the preview decoder's pixel limit" do
    source = Rails.root.join("spec/fixtures/files/signature-large-image.pdf").to_s
    expect(File.size(source)).to be < 5.megabytes
    expect { Signatures::PdfInfo.new(source).process }
      .to raise_error(Signatures::PdfInfo::InvalidDocument, /16 megapixels/)
  end

  it "applies the same pixel limit to inline images inside content streams" do
    source = Rails.root.join("spec/fixtures/files/signature-inline-large-image.pdf").to_s
    expect { Signatures::PdfInfo.new(source).process }
      .to raise_error(Signatures::PdfInfo::InvalidDocument, /16 megapixels/)
  end

  it "distinguishes a missing PDF processor from an invalid customer document" do
    allow(Open3).to receive(:popen2e).and_raise(Errno::ENOENT, "internal path and credentials")
    expect { Signatures::PdfInfo.new(path).process }
      .to raise_error(Signatures::PdfInfo::Unavailable, "PDF processing is unavailable. Please retry later.") { |error| expect(error.cause).to be_nil }
  end

  it "kills and reaps a parser that exceeds its wall-clock limit" do
    pid = nil
    stub_const("Signatures::PdfInfo::TIMEOUT_SECONDS", 0.1)
    allow(Open3).to receive(:popen2e).and_wrap_original do |method, _env, *_args, **options, &block|
      method.call(RbConfig.ruby, "-e", "sleep 10", **options) do |input, output, wait|
        pid = wait.pid
        block.call(input, output, wait)
      end
    end
    expect { Signatures::PdfInfo.new(path).process }.to raise_error(Signatures::PdfInfo::InvalidDocument)
    expect { Process.kill(0, pid) }.to raise_error(Errno::ESRCH)
    expect { Process.waitpid(pid, Process::WNOHANG) }.to raise_error(Errno::ECHILD)
  end

  it "bounds parser output instead of retaining untrusted metadata indefinitely" do
    allow(Open3).to receive(:popen2e).and_wrap_original do |method, _env, *_args, **options, &block|
      method.call(RbConfig.ruby, "-e", "STDOUT.write('x' * 70_000)", **options, &block)
    end
    expect { Signatures::PdfInfo.new(path).process }.to raise_error(Signatures::PdfInfo::InvalidDocument)
  end

  it "bounds expanded object metadata before parsing it" do
    expect do
      Signatures::PdfInfo.new(path).send(:capture, RbConfig.ruby, "-e", "STDOUT.write('x' * 5_000_000)",
        output_limit: Signatures::PdfInfo::MAX_STRUCTURE_BYTES)
    end.to raise_error(Signatures::PdfInfo::InvalidDocument)
  end

  it "does not pass application credentials to native PDF processors" do
    previous = ENV["MIRU_SIGNING_TEST_SECRET"]
    ENV["MIRU_SIGNING_TEST_SECRET"] = "synthetic-secret"
    allow(Open3).to receive(:popen2e).and_wrap_original do |method, env, *command, **options, &block|
      options.delete(:rlimit_as)
      method.call(env, RbConfig.ruby, "-e", "abort('Application credential inherited') if ENV.key?('MIRU_SIGNING_TEST_SECRET'); exec(*ARGV)",
        "--", *command, **options, &block)
    end
    expect(Signatures::PdfInfo.new(path).process.fetch("pages").size).to eq(2)
  ensure
    ENV["MIRU_SIGNING_TEST_SECRET"] = previous
  end

  def with_pdf(pages: 1, rotation: 0, crop: "0 0 600 800", media: "0 0 600 800", inherit_media: false,
    page_properties: "", catalog: "", title: "Synthetic QA", interactive: false)
    field_id = pages + 4
    catalog += " /AcroForm << /Fields [#{field_id} 0 R] >>" if interactive
    objects = ["<< /Type /Catalog /Pages 2 0 R #{catalog} >>",
               "<< /Type /Pages /Kids [#{Array.new(pages) { |i| "#{i + 3} 0 R" }.join(' ')}] /Count #{pages} #{inherit_media ? "/MediaBox [#{media}]" : ''} >>"]
    annotations = interactive ? "/Annots [#{field_id} 0 R]" : ""
    pages.times do
      objects << "<< /Type /Page /Parent 2 0 R #{inherit_media ? '' : "/MediaBox [#{media}]"} /CropBox [#{crop}] /Rotate #{rotation} #{annotations} #{page_properties} >>"
    end
    objects << "<< /Title (#{title}) >>"
    info_id = objects.size
    objects << "<< /Type /Annot /Subtype /Widget /FT /Tx /T (ExistingInput) /Rect [20 20 80 40] /V (Synthetic value) /P 3 0 R >>" if interactive
    bytes = +"%PDF-1.7\n"
    offsets = objects.map.with_index do |object, index|
      offset = bytes.bytesize
      bytes << "#{index + 1} 0 obj\n#{object}\nendobj\n"
      offset
    end
    start = bytes.bytesize
    bytes << "xref\n0 #{objects.size + 1}\n0000000000 65535 f \n"
    offsets.each { |offset| bytes << format("%010d 00000 n \n", offset) }
    bytes << "trailer\n<< /Size #{objects.size + 1} /Root 1 0 R /Info #{info_id} 0 R >>\nstartxref\n#{start}\n%%EOF\n"
    Tempfile.create(["signature-source", ".pdf"]) { |file| file.write(bytes); file.flush; yield file }
  end
end
