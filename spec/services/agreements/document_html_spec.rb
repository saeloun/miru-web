# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Agreement HTML rendering" do
  it "escapes body/field values and preserves formatted clauses, tables and explicit page breaks" do
    document = agreement_document("Terms <script>alert(1)</script> & conditions")
    document["content"] += [{ "type" => "pageBreak" }, { "type" => "table", "content" => [
      { "type" => "tableRow", "content" => [{ "type" => "tableCell", "content" => [
        { "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Fee & GST", "marks" => [{ "type" => "bold" }] }] }
      ] }] }
    ] }]
    html = Agreements::DocumentHtml.new(document, fields: agreement_fields, values: { "legal_name" => "Anand <LLP> & Co" }).process
    expect(html).to include("&lt;script&gt;alert(1)&lt;/script&gt; &amp; conditions", "Anand &lt;LLP&gt; &amp; Co",
      '<div class="page-break"></div>', "<table>", "<strong>Fee &amp; GST</strong>")
    expect(html).not_to include("<script>", "<iframe", "<img", "href=", "src=")
  end

  it "marks unfilled and signature fields explicitly without representing them as signed" do
    field = agreement_fields.first.merge("type" => "signature", "role" => "company_signer", "label" => "Company signature")
    html = Agreements::DocumentHtml.new(agreement_document, fields: [field], values: {}).process
    expect(html).to include("[Company signature — incomplete]")
  end

  it "validates untrusted content before any HTML can be generated" do
    expect do
      Agreements::DocumentHtml.new({ "type" => "doc", "content" => [{ "type" => "script" }] }, fields: [], values: {}).process
    end.to raise_error(ArgumentError, /Document contains/)
  end
end
