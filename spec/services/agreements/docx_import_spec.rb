# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Agreement DOCX import preview" do
  def preview(body: "<w:p><w:r><w:t>Consulting terms</w:t></w:r></w:p>", parts: {}, fields: [])
    with_agreement_docx(body:, parts:) { |upload| Agreements::DocxImport.new(upload, fields:).process }
  end

  it "preserves Unicode, run formatting, split placeholders, tables and page breaks as editable content" do
    body = <<~XML
      <w:p><w:pPr><w:pStyle w:val="Heading1"/><w:jc w:val="center"/></w:pPr><w:r><w:t>आनंद &amp; Partners</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Party: {{legal_</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>name}}</w:t></w:r><w:r><w:br/><w:t>Continued</w:t></w:r></w:p>
      <w:tbl><w:tblGrid><w:gridCol w:w="3000"/></w:tblGrid><w:tr><w:tc><w:p><w:r><w:rPr><w:i/><w:u w:val="single"/><w:strike/></w:rPr><w:t>Fee &lt;terms&gt;</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
      <w:p><w:r><w:br w:type="page"/><w:t>Second page</w:t></w:r></w:p>
    XML
    result = preview(body:)
    content = result.fetch(:document).fetch("content")
    expect(content.first).to include("type" => "heading", "attrs" => { "level" => 1, "textAlign" => "center" })
    expect(content.first.fetch("content").first.fetch("text")).to eq("आनंद & Partners")
    expect(content[1].fetch("content")).to include(
      { "type" => "mergeField", "attrs" => { "key" => "legal_name" }, "marks" => [{ "type" => "bold" }] },
      { "type" => "hardBreak" })
    expect(content[2].fetch("type")).to eq("table")
    expect(content.pluck("type")).to include("pageBreak")
    expect(content[2].dig("content", 0, "content", 0, "content", 0, "content", 0, "text")).to eq("Fee <terms>")
    expect(content.last.dig("content", 0, "text")).to eq("Second page")
    expect(result.fetch(:fields)).to eq([{ "key" => "legal_name", "label" => "Legal name", "type" => "text",
      "role" => "admin", "required" => true, "read_only" => false }])
    expect(Agreements::Document.new(result[:document], fields: result[:fields]).errors).to be_empty
    expect(result.fetch(:warnings)).not_to be_empty
  end

  it "retains existing field configuration without mutating the caller's master definitions" do
    fields = agreement_fields
    result = preview(body: "<w:p><w:r><w:t>{{legal_name}} and {{scope}}</w:t></w:r></w:p>", fields:)
    result[:fields].first["label"] = "Changed preview"
    expect(fields.first["label"]).to eq("Legal name")
    expect(result[:fields].last).to include("key" => "scope", "type" => "text")
  end

  it "imports an independently generated Word package with 60 fields and 25 explicit pages" do
    File.open(Rails.root.join("spec/fixtures/agreements/synthetic-long.docx"), "rb") do |file|
      upload = ActionDispatch::Http::UploadedFile.new(tempfile: file, filename: "synthetic-long.docx", type: Agreements::DocxImport::MIME_TYPE)
      result = Agreements::DocxImport.new(upload).process
      expect(result[:fields].pluck("key")).to eq(60.times.map { |index| "field_#{index}" })
      expect(result[:document]["content"].count { |node| node["type"] == "pageBreak" }).to eq(24)
      expect(result[:document]["content"].count { |node| node["type"] == "heading" }).to eq(25)
    end
  end

  it "imports the independently generated short Word document's nested list and split field runs" do
    File.open(Rails.root.join("spec/fixtures/agreements/synthetic-short.docx"), "rb") do |file|
      upload = ActionDispatch::Http::UploadedFile.new(tempfile: file, filename: "synthetic-short.docx", type: Agreements::DocxImport::MIME_TYPE)
      result = Agreements::DocxImport.new(upload).process
      expect(result[:fields].pluck("key")).to eq(%w[field_0 field_1 field_2 field_3])
      expect(result[:document]["content"].pluck("type")).to include("orderedList")
    end
  end

  it "preserves nested ordered and bullet lists with explicit starting numbers" do
    numbering = <<~XML
      <w:numbering xmlns:w="#{AgreementFixtures::WORD_NAMESPACE}">
        <w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="3"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>
    XML
    body = [0, 1, 0].map do |level|
      "<w:p><w:pPr><w:numPr><w:ilvl w:val=\"#{level}\"/><w:numId w:val=\"1\"/></w:numPr></w:pPr><w:r><w:t>Clause #{level}</w:t></w:r></w:p>"
    end.join
    result = preview(body:, parts: { "word/numbering.xml" => numbering })
    list = result[:document]["content"].first
    expect(list).to include("type" => "orderedList", "attrs" => { "start" => 3 })
    expect(list["content"].length).to eq(2)
    expect(list["content"].first["content"][1]["type"]).to eq("bulletList")
  end

  it "does not reject unused numbering definitions included by Word's default template" do
    numbering = <<~XML
      <w:numbering xmlns:w="#{AgreementFixtures::WORD_NAMESPACE}">
        <w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="upperRoman"/><w:lvlText w:val="%1)"/></w:lvl></w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
      </w:numbering>
    XML
    expect(preview(parts: { "word/numbering.xml" => numbering })[:document].dig("content", 0, "content", 0, "text")).to eq("Consulting terms")
  end

  it "rejects duplicate central-directory entries before choosing one document body" do
    with_agreement_docx do |upload|
      bytes = File.binread(upload.tempfile.path)
      ending = bytes.rindex("PK\x05\x06".b)
      directory_offset = bytes.byteslice(ending + 16, 4).unpack1("V")
      name_size, extra_size, comment_size = bytes.byteslice(directory_offset + 28, 6).unpack("v3")
      duplicate = bytes.byteslice(directory_offset, 46 + name_size + extra_size + comment_size)
      record = bytes.byteslice(ending..)
      count = record.byteslice(10, 2).unpack1("v") + 1
      record[8, 4] = [count, count].pack("v2")
      record[12, 4] = [record.byteslice(12, 4).unpack1("V") + duplicate.bytesize].pack("V")
      File.binwrite(upload.tempfile.path, bytes.byteslice(0...ending) + duplicate + record)
      expect { Agreements::DocxImport.new(upload).process }.to raise_error(Agreements::DocxImport::Error)
    end
  end

  {
    "tracked changes" => "<w:ins><w:r><w:t>Changed liability</w:t></w:r></w:ins>",
    "an embedded image" => "<w:r><w:drawing/></w:r>",
    "dynamic Word fields" => "<w:r><w:instrText>INCLUDETEXT https://example.com/private</w:instrText></w:r>",
    "an unknown content control" => "<w:sdt><w:sdtContent><w:r><w:t>Hidden clause</w:t></w:r></w:sdtContent></w:sdt>",
    "a hyperlink" => "<w:hyperlink><w:r><w:t>External terms</w:t></w:r></w:hyperlink>"
  }.each do |label, inside|
    it "rejects #{label} rather than silently dropping legal content" do
      expect { preview(body: "<w:p>#{inside}</w:p>") }.to raise_error(Agreements::DocxImport::Error, /unsupported/i)
    end
  end

  it "rejects headers, footnotes, macros and external relationships without fetching resources" do
    ["word/header1.xml", "word/footnotes.xml", "word/vbaProject.bin"].each do |name|
      expect { preview(parts: { name => "Important legal content" }) }.to raise_error(Agreements::DocxImport::Error)
    end
    relationships = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="x" TargetMode="External" Target="https://example.com/private" Type="x"/></Relationships>'
    expect { preview(parts: { "word/_rels/document.xml.rels" => relationships }) }.to raise_error(Agreements::DocxImport::Error, /external/i)
  end

  it "rejects substantive footnotes instead of treating them as empty default package furniture" do
    notes = "<w:footnotes xmlns:w=\"#{AgreementFixtures::WORD_NAMESPACE}\"><w:footnote w:id=\"1\"><w:p><w:r><w:t>Liability exception</w:t></w:r></w:p></w:footnote></w:footnotes>"
    expect { preview(parts: { "word/footnotes.xml" => notes }) }.to raise_error(Agreements::DocxImport::Error, /unsupported/i)
  end

  it "preserves default Word emphasis and respects a direct formatting override" do
    styles = "<w:styles xmlns:w=\"#{AgreementFixtures::WORD_NAMESPACE}\"><w:docDefaults><w:rPrDefault><w:rPr><w:b/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>"
    body = '<w:p><w:r><w:t>Default emphasis</w:t></w:r><w:r><w:rPr><w:b w:val="0"/></w:rPr><w:t>Plain text</w:t></w:r></w:p>'
    result = preview(body:, parts: { "word/styles.xml" => styles })
    expect(result[:document]["content"].first["content"].first["marks"]).to eq([{ "type" => "bold" }])
    expect(result[:document]["content"].first["content"].last["marks"]).to eq([])
  end

  it "rejects more than 100 discovered fields" do
    text = 101.times.map { |index| "{{field_#{index}}}" }.join(" ")
    expect { preview(body: "<w:p><w:r><w:t>#{text}</w:t></w:r></w:p>") }.to raise_error(Agreements::DocxImport::Error, /100/)
  end

  it "rejects XML entities/DTDs and malformed documents" do
    xml = <<~XML
      <!DOCTYPE w:document [<!ENTITY secret SYSTEM "file:///etc/passwd">]>
      <w:document xmlns:w="#{AgreementFixtures::WORD_NAMESPACE}"><w:body><w:p><w:r><w:t>&secret;</w:t></w:r></w:p></w:body></w:document>
    XML
    expect { preview(parts: { "word/document.xml" => xml }) }.to raise_error(Agreements::DocxImport::Error)
    expect { preview(parts: { "word/document.xml" => "<broken>" }) }.to raise_error(Agreements::DocxImport::Error)
    expect { preview(parts: { "word/document.xml" => "<document><body>Foreign format</body></document>" }) }.to raise_error(Agreements::DocxImport::Error)
  end

  it "rejects a package pointing to a different main document instead of importing the wrong contract" do
    relationships = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="main" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/other.xml"/></Relationships>'
    expect { preview(parts: { "_rels/.rels" => relationships }) }.to raise_error(Agreements::DocxImport::Error)
  end

  it "bounds expanded ZIP entries and rejects unsafe paths or excessive archive entries" do
    expect { preview(parts: { "word/document.xml" => "x" * 3_000_000 }) }.to raise_error(Agreements::DocxImport::Error, /limit|large/i)
    expect { preview(parts: { "../outside.xml" => "payload" }) }.to raise_error(Agreements::DocxImport::Error)
    extra = 201.times.to_h { |index| ["docProps/extra#{index}.xml", "<x/>"] }
    expect { preview(parts: extra) }.to raise_error(Agreements::DocxImport::Error)
  end

  it "rejects a disguised PDF, oversized upload and undeclared/malformed incoming field definitions" do
    with_agreement_docx do |upload|
      upload.tempfile.truncate(0)
      upload.tempfile.write("%PDF-1.4 not a Word document")
      upload.tempfile.flush
      expect { Agreements::DocxImport.new(upload).process }.to raise_error(Agreements::DocxImport::Error)
      upload.tempfile.truncate(5_242_881)
      expect { Agreements::DocxImport.new(upload).process }.to raise_error(Agreements::DocxImport::Error, /large|MiB/i)
    end
    expect { preview(fields: [{ "key" => "__proto__" }]) }.to raise_error(Agreements::DocxImport::Error)
  end
end
