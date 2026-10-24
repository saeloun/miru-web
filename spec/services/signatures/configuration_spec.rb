# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Signing field configuration" do
  let(:documents) { [{ "key" => "main", "pages" => [{ "width" => 595.28, "height" => 841.89, "rotation" => 0 }] }] }
  let(:recipients) { [{ "id" => "signer-1", "name" => "Synthetic Signer", "email" => "signer@example.test", "role" => "signer" }] }
  let(:field) do
    { "id" => "signature-1", "document_id" => "main", "recipient_id" => "signer-1", "page" => 1,
      "type" => "signature", "label" => "Signature", "required" => true, "read_only" => false,
      "x" => 10, "y" => 70, "width" => 30, "height" => 5 }
  end

  def configuration(fields: [field], people: recipients, files: documents)
    Signatures::Configuration.new(documents: files, recipients: people, fields:)
  end

  it "accepts a complete signature field without a template or counterparty profile" do
    expect(configuration.errors).to be_empty
    expect(configuration.ready_errors).to be_empty
  end

  it "allows incomplete drafts but requires an actual signatory and required signature before approval" do
    draft = configuration(fields: [], people: [])
    expect(draft.errors).to be_empty
    expect(draft.ready_errors).to include("Add at least one signer before approval")
    expect(configuration(fields: [field.merge("type" => "text")]).ready_errors)
      .to include("Each signer needs a required signature field")
  end

  it "rejects fields on nonexistent pages and fields that extend beyond the page edge" do
    [{ "page" => 99 }, { "x" => 95 }, { "y" => 99 }, { "width" => 0 }, { "x" => -1 }, { "x" => "10" }].each do |change|
      expect(configuration(fields: [field.merge(change)]).errors).not_to be_empty, change.inspect
    end
  end

  it "rejects unknown documents, duplicate field identities and unassigned or non-signing recipients" do
    expect(configuration(fields: [field.merge("document_id" => "other")]).errors).not_to be_empty
    expect(configuration(fields: [field, field]).errors).not_to be_empty
    expect(configuration(fields: [field.merge("recipient_id" => "other")]).errors).not_to be_empty
    %w[reviewer cc].each do |role|
      expect(configuration(people: [recipients.first.merge("role" => role)]).errors).not_to be_empty
    end
  end

  it "rejects duplicate or invalid recipient identities and unsafe addresses" do
    [recipients * 2, [recipients.first.merge("email" => "not-an-email")],
      [recipients.first.merge("email" => "signer@example.test\r\nBcc:private@example.test")],
      [recipients.first.merge("role" => "administrator")]].each do |people|
      expect(configuration(people:).errors).not_to be_empty
    end
  end

  it "does not accept an admin-supplied signature or initials value" do
    %w[signature initials].each do |type|
      expect(configuration(fields: [field.merge("type" => type, "value" => "Forged signature")]).errors).not_to be_empty
    end
  end

  it "validates dropdown options and exact numeric, checkbox and date values" do
    examples = [
      { "type" => "dropdown", "options" => ["Monthly", "Yearly"], "value" => "Monthly" },
      { "type" => "number", "value" => "123456.75" },
      { "type" => "checkbox", "value" => true },
      { "type" => "date", "value" => "2026-10-24" }
    ]
    examples.each { |change| expect(configuration(fields: [field.merge(change)]).errors).to be_empty }
    [{ "type" => "dropdown", "options" => ["A", "A"] }, { "type" => "dropdown", "options" => ["A"], "value" => "B" },
      { "type" => "number", "value" => "1,234" }, { "type" => "checkbox", "value" => "false" },
      { "type" => "date", "value" => "2026-02-30" }].each do |change|
      expect(configuration(fields: [field.merge(change)]).errors).not_to be_empty
    end
  end

  it "requires read-only required values before approval without preventing a draft save" do
    item = configuration(fields: [field, field.merge("id" => "title", "type" => "text", "read_only" => true)])
    expect(item.errors).to be_empty
    expect(item.ready_errors).to include("Required read-only fields need a value before approval")
  end

  it "bounds recipients, fields, payload size and nested or unknown properties" do
    expect(configuration(people: Array.new(21) { |i| recipients.first.merge("id" => "signer-#{i}", "email" => "s#{i}@example.test") }).errors).not_to be_empty
    expect(configuration(fields: Array.new(101) { |i| field.merge("id" => "field-#{i}") }).errors).not_to be_empty
    expect(configuration(fields: [field.merge("value" => "x" * 131_073)]).errors).not_to be_empty
    expect(configuration(fields: [field.merge("html" => "<script>private</script>")]).errors).not_to be_empty
    expect(configuration(fields: "not-an-array").errors).not_to be_empty
  end
end
