# frozen_string_literal: true

module AgreementFixtures
  WORD_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

  def with_agreement_docx(body: "<w:p><w:r><w:t>Consulting terms</w:t></w:r></w:p>", parts: {})
    require "zip"
    entries = {
      "[Content_Types].xml" => '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      "_rels/.rels" => '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      "word/document.xml" => "<w:document xmlns:w=\"#{WORD_NAMESPACE}\"><w:body>#{body}</w:body></w:document>"
    }.merge(parts)
    Tempfile.create(["synthetic-agreement", ".docx"]) do |file|
      Zip::OutputStream.open(file.path) do |zip|
        entries.each do |name, contents|
          zip.put_next_entry(name)
          zip.write(contents)
        end
      end
      upload = ActionDispatch::Http::UploadedFile.new(tempfile: file, filename: "synthetic-agreement.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      yield upload
    end
  end

  def agreement_fields
    [{ "key" => "legal_name", "label" => "Legal name", "type" => "text", "role" => "admin",
       "required" => true, "read_only" => true }]
  end

  def agreement_document(text = "Consulting terms")
    { "type" => "doc", "content" => [
      { "type" => "heading", "attrs" => { "level" => 1 }, "content" => [{ "type" => "text", "text" => text }] },
      { "type" => "paragraph", "content" => [
        { "type" => "text", "text" => "Consultant: " },
        { "type" => "mergeField", "attrs" => { "key" => "legal_name" } }
      ] }
    ] }
  end
end

RSpec.configure { |config| config.include AgreementFixtures }
