# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Agreement document contract" do
  def errors(document = agreement_document, fields: agreement_fields, values: {})
    Agreements::Document.new(document, fields:, values:).errors
  end

  it "accepts an editable formatted contract with table, list, breaks and assigned fields" do
    document = agreement_document
    document["content"] += [
      { "type" => "paragraph", "attrs" => { "textAlign" => "center" }, "content" => [
        { "type" => "text", "text" => "भारतीय करार & <terms>",
          "marks" => %w[bold italic underline strike].map { |type| { "type" => type } } },
        { "type" => "hardBreak" }
      ] },
      { "type" => "orderedList", "attrs" => { "start" => 3 }, "content" => [
        { "type" => "listItem", "content" => [{ "type" => "paragraph" }] }
      ] },
      { "type" => "table", "content" => [{ "type" => "tableRow", "content" => [
        { "type" => "tableCell", "attrs" => { "colspan" => 2, "rowspan" => 1, "colwidth" => [120, 120] },
          "content" => [{ "type" => "paragraph" }] }
      ] }] }, { "type" => "pageBreak" }, { "type" => "horizontalRule" }
    ]
    expect(errors(document, values: { "legal_name" => "Anand & Partners <LLP>" })).to be_empty
  end

  {
    "an HTML/script node" => { "type" => "script", "text" => "alert(1)" },
    "an external image" => { "type" => "image", "attrs" => { "src" => "https://example.com/track" } },
    "an unknown field" => { "type" => "mergeField", "attrs" => { "key" => "bank_account" } },
    "a text node outside a paragraph" => { "type" => "text", "text" => "Lost clause" },
    "a paragraph containing a table row" => { "type" => "paragraph", "content" => [{ "type" => "tableRow" }] },
    "an empty table" => { "type" => "table" },
    "an invalid heading level" => { "type" => "heading", "attrs" => { "level" => 7 } },
    "a style/HTML attribute" => { "type" => "paragraph", "attrs" => { "style" => "color:red" } },
    "a link mark" => { "type" => "paragraph", "content" => [
      { "type" => "text", "text" => "Click", "marks" => [{ "type" => "link", "attrs" => { "href" => "javascript:alert(1)" } }] }
    ] },
    "hidden text on a field" => { "type" => "mergeField", "attrs" => { "key" => "legal_name" }, "text" => "Discarded" },
    "an oversized table span" => { "type" => "table", "content" => [{ "type" => "tableRow", "content" => [
      { "type" => "tableCell", "attrs" => { "colspan" => 100000 }, "content" => [{ "type" => "paragraph" }] }
    ] }] }
  }.each do |label, node|
    it "rejects #{label} rather than silently dropping contract content" do
      expect(errors({ "type" => "doc", "content" => [node] })).not_to be_empty
    end
  end

  [nil, [], "<p>contract</p>", { "type" => "paragraph" }, { "type" => "doc", "content" => "oops" }].each do |value|
    it "rejects a malformed root #{value.class} without crashing" do
      expect(errors(value)).not_to be_empty
    end
  end

  it "bounds document bytes, node count and nesting independently" do
    expect(errors(agreement_document("x" * 524_288))).not_to be_empty
    nodes = Array.new(20_001) { { "type" => "paragraph" } }
    expect(errors({ "type" => "doc", "content" => nodes })).not_to be_empty
    nested = { "type" => "paragraph" }
    21.times { nested = { "type" => "bulletList", "content" => [{ "type" => "listItem", "content" => [nested] }] } }
    expect(errors({ "type" => "doc", "content" => [nested] })).not_to be_empty
  end

  it "retains required blanks as editable drafts and identifies their missing keys" do
    contract = Agreements::Document.new(agreement_document, fields: agreement_fields, values: {})
    expect(contract.errors).to be_empty
    expect(contract.missing_required_keys).to eq(["legal_name"])
  end

  it "preserves intentional spaces in contract text but treats a blank required value as incomplete" do
    document = { "type" => "doc", "content" => [{ "type" => "paragraph", "content" => [{ "type" => "text", "text" => " " }] }] }
    expect(errors(document)).to be_empty
    contract = Agreements::Document.new(agreement_document, fields: agreement_fields, values: { "legal_name" => "   " })
    expect(contract.missing_required_keys).to eq(["legal_name"])
  end

  it "accepts typed date, decimal, checkbox and dropdown values without coercion" do
    fields = [
      ["date", "joined", "2026-10-24"], ["number", "fee", "123456.50"],
      ["checkbox", "consent", false], ["dropdown", "frequency", "monthly"]
    ].map do |type, key, _value|
      agreement_fields.first.merge("key" => key, "type" => type, "options" => type == "dropdown" ? %w[monthly annual] : [])
    end
    values = { "joined" => "2026-10-24", "fee" => "123456.50", "consent" => false, "frequency" => "monthly" }
    expect(errors({ "type" => "doc", "content" => [{ "type" => "paragraph" }] }, fields:, values:)).to be_empty
  end

  { "date" => "2026-02-30", "number" => 123.5, "checkbox" => "true", "dropdown" => "unknown",
    "text" => { "html" => "oops" }, "signature" => "Forged signature", "initials" => "AA" }.each do |type, value|
    it "rejects invalid #{type} values and fabricated signing data" do
      field = agreement_fields.first.merge("type" => type)
      field["options"] = ["monthly"] if type == "dropdown"
      expect(errors(fields: [field], values: { "legal_name" => value })).not_to be_empty
    end
  end

  it "rejects undeclared values, duplicate/unsafe keys, unknown types/roles/flags and oversized labels" do
    expect(errors(values: { "undeclared" => "Private" })).not_to be_empty
    expect(errors(fields: agreement_fields * 2)).not_to be_empty
    { "key" => "__proto__", "type" => "html", "role" => "anyone", "required" => "true",
      "read_only" => nil, "label" => "x" * 121, "unexpected" => "value" }.each do |key, value|
      expect(errors(fields: [agreement_fields.first.merge(key => value)])).not_to be_empty
    end
  end

  it "rejects malformed/oversized fields, options and values" do
    [nil, {}, [nil], Array.new(101) { agreement_fields.first }].each do |fields|
      expect(errors(fields:)).not_to be_empty
    end
    field = agreement_fields.first.merge("type" => "dropdown", "options" => ["monthly", "monthly"])
    expect(errors(fields: [field])).not_to be_empty
    expect(errors(values: [])).not_to be_empty
    expect(errors(values: { "legal_name" => "x" * 5001 })).not_to be_empty
    expect(errors(fields: [agreement_fields.first.merge("label" => " " * 121 + "Name")])).not_to be_empty
    expect(errors(fields: [field.merge("options" => [" " * 201 + "monthly"])])).not_to be_empty
  end
end
