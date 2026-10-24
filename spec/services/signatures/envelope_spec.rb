# frozen_string_literal: true

require "rails_helper"

RSpec.describe Signatures::Envelope do
  let(:bytes) { %w[qa-main.pdf qa-addendum.pdf].map { |file| File.binread(Rails.root.join("docs/qa/generic-document-signing-2462", file)) } }
  let(:documents) do
    bytes.each_with_index.map do |data, index|
      { "key" => "source-#{index}", "blob_id" => index + 1, "filename" => "private-#{index}.pdf",
        "sha256" => Digest::SHA256.hexdigest(data), "byte_size" => data.bytesize,
        "pages" => Array.new(index.zero? ? 2 : 1) { { "width" => 595.28, "height" => 841.89, "rotation" => 0 } } }
    end
  end
  let(:people) do
    [
      { "id" => "first", "name" => "Synthetic First", "email" => "FIRST@example.test", "role" => "signer" },
      { "id" => "second", "name" => "Synthetic Second", "email" => "second@example.test", "role" => "signer" },
      { "id" => "reviewer", "name" => "Synthetic Reviewer", "email" => "review@example.test", "role" => "reviewer" },
      { "id" => "copy", "name" => "Synthetic Copy", "email" => "copy@example.test", "role" => "cc" }
    ]
  end
  let(:fields) do
    Signatures::Configuration::TYPES.map.with_index do |type, index|
      { "id" => "field-#{index}", "document_id" => "source-0", "recipient_id" => "first", "type" => type,
        "label" => "Field #{type}", "page" => 1, "x" => 10, "y" => index * 8, "width" => 30, "height" => 5,
        "required" => true, "read_only" => false }.tap do |field|
        field["options"] = ["First option", "Second option"] if type == "dropdown"
      end
    end + [{ "id" => "second-signature", "document_id" => "source-1", "recipient_id" => "second", "type" => "signature",
      "label" => "Second signature", "page" => 1, "x" => 10, "y" => 70, "width" => 30, "height" => 8,
      "required" => true, "read_only" => false }]
  end
  let(:options) { described_class.default_options(timezone: "Asia/Kolkata") }
  let(:revision) do
    instance_double(SignatureRequestRevision, title: "Synthetic approved version", documents:, recipients: people, fields:,
      signing_options: options, provider_envelope_id: "envelope_1")
  end
  let(:operation_id) { "miru-synthetic-operation" }
  let(:envelope) { described_class.new(revision) }
  let(:client) { instance_double(Signatures::DocumensoClient) }

  before do
    bytes.each_with_index { |data, index| allow(client).to receive(:original).with("item_#{index}").and_return(data) }
  end

  def provider_record
    payload = envelope.payload(operation_id:)
    recipients = payload.fetch("recipients").each_with_index.map do |person, index|
      person.except("fields", "accessAuth", "actionAuth").merge("id" => index + 1, "envelopeId" => "envelope_1",
        "authOptions" => nil, "signingStatus" => person["role"] == "CC" ? "SIGNED" : "NOT_SIGNED",
        "sendStatus" => person["role"] == "CC" ? "SENT" : "NOT_SENT", "readStatus" => "NOT_OPENED")
    end
    provider_fields = payload.fetch("recipients").flat_map.with_index do |person, index|
      person.fetch("fields").map do |field|
        field.except("identifier").merge("envelopeId" => "envelope_1", "envelopeItemId" => "item_#{field.fetch('identifier')}",
          "recipientId" => index + 1, "customText" => "", "inserted" => false)
      end
    end
    provider_fields.each_with_index { |field, index| field["id"] = index + 10 }
    { "id" => "envelope_1", "title" => revision.title, "type" => "DOCUMENT", "status" => "DRAFT", "externalId" => operation_id,
      "authOptions" => nil, "documentMeta" => payload.fetch("meta"), "recipients" => recipients, "fields" => provider_fields,
      "envelopeItems" => documents.each_index.map { |index| { "id" => "item_#{index}", "envelopeId" => "envelope_1", "order" => index } } }
  end

  it "builds one DOCUMENT with all sources, four recipient roles and all supported field types" do
    payload = envelope.payload(operation_id:)
    expect(payload).to include("type" => "DOCUMENT", "title" => revision.title, "externalId" => operation_id)
    expect(payload.fetch("recipients").pluck("role")).to eq(%w[SIGNER SIGNER APPROVER CC])
    expect(payload.dig("recipients", 0, "email")).to eq("first@example.test")
    expect(payload.dig("recipients", 0, "fields").pluck("type")).to eq(Signatures::Configuration::TYPES.map(&:upcase))
    expect(payload.dig("recipients", 1, "fields", 0, "identifier")).to eq(1)
    expect(payload.dig("recipients", 0, "fields", 0)).to include("page" => 1, "positionX" => 10, "positionY" => 0)
    expect(payload.dig("recipients", 2, "fields")).to eq([])
    expect(payload.fetch("meta")).to include("timezone" => "Asia/Kolkata", "dateFormat" => "dd/MM/yyyy", "distributionMethod" => "EMAIL")
    expect(payload.fetch("meta")).not_to have_key("version")
    expect(payload.to_json).not_to include("blob_id", "private-0.pdf", "source-0", "second-signature")
  end

  it "preserves ordinary prefilled values without ever prefilling signatures or initials" do
    fields.find { |field| field["type"] == "text" }.merge!("value" => "INR 12345", "read_only" => true)
    fields.find { |field| field["type"] == "number" }["value"] = "12345.67"
    fields.find { |field| field["type"] == "checkbox" }["value"] = true
    fields.find { |field| field["type"] == "dropdown" }["value"] = "Second option"
    { "name" => "Reviewed name", "email" => "reviewed@example.test", "date" => "2026-10-24" }.each do |type, value|
      fields.find { |field| field["type"] == type }["value"] = value
    end
    mapped = envelope.payload(operation_id:).dig("recipients", 0, "fields").index_by { |field| field.dig("fieldMeta", "label") }
    expect(mapped.fetch("Field text").fetch("fieldMeta")).to include("text" => "INR 12345", "readOnly" => true)
    expect(mapped.fetch("Field number").fetch("fieldMeta")).to include("value" => "12345.67")
    expect(mapped.fetch("Field checkbox").dig("fieldMeta", "values", 0, "checked")).to be(true)
    expect(mapped.fetch("Field dropdown").dig("fieldMeta", "defaultValue")).to eq("Second option")
    %w[name email date].each do |type|
      expect(mapped.fetch("Field #{type}")).to include("type" => "TEXT")
      expect(mapped.fetch("Field #{type}").dig("fieldMeta", "text")).to eq(fields.find { |field| field["type"] == type }["value"])
    end
    fields.first["value"] = "Someone else's signature"
    expect { envelope.payload(operation_id:) }.to raise_error(described_class::InvalidConfiguration)
  end

  it "requires versioned, explicit date/delivery settings and a complete valid configuration" do
    [nil, options.merge("version" => 99), options.merge("timezone" => "Not/A_Timezone"),
      options.merge("redirectUrl" => "https://attacker.example.test")].each do |value|
      allow(revision).to receive(:signing_options).and_return(value)
      expect { envelope.payload(operation_id:) }.to raise_error(described_class::InvalidConfiguration)
    end
    allow(revision).to receive(:signing_options).and_return(options)
    fields.clear
    expect { envelope.payload(operation_id:) }.to raise_error(described_class::InvalidConfiguration)
  end

  it "verifies original bytes and an unordered provider configuration against the approved snapshot" do
    data = provider_record
    data["fields"].reverse!
    data["recipients"].reverse!
    data["envelopeItems"].reverse!
    data["fields"].each { |field| %w[positionX positionY width height].each { |key| field[key] = field[key].to_s } }
    expect(envelope.verify!(data, client:, operation_id:, before_send: true)).to be(true)
    expect(client).to have_received(:original).with("item_0").once
    expect(client).to have_received(:original).with("item_1").once
  end

  it "accepts the real parallel-order and copy-recipient defaults without treating them as signer completion" do
    data = provider_record
    data["recipients"].each do |person|
      if person["role"] == "CC"
        person.merge!("signingStatus" => "SIGNED", "sendStatus" => "SENT")
      else
        person["signingOrder"] = 1
      end
    end
    expect(envelope.verify!(data, client:, operation_id:, before_send: true)).to be(true)
    data["recipients"].first["signingStatus"] = "SIGNED"
    expect { envelope.verify!(data, client:, operation_id:, before_send: true) }.to raise_error(described_class::Mismatch)
  end

  it "rejects changed identities, date settings, recipient bindings and authentication requirements" do
    changes = [
      ->(data) { data["id"] = "another_envelope" }, ->(data) { data["externalId"] = "another-operation" },
      ->(data) { data["type"] = "TEMPLATE" }, ->(data) { data["title"] = "Other terms" },
      ->(data) { data["documentMeta"]["timezone"] = "UTC" },
      ->(data) { data["documentMeta"]["redirectUrl"] = "https://attacker.example.test" },
      ->(data) { data["recipients"][0]["email"] = "attacker@example.test" },
      ->(data) { data["recipients"][0]["role"] = "CC" }, ->(data) { data["recipients"][0]["name"] = "Another person" },
      ->(data) { data["recipients"][0]["authOptions"] = { "actionAuth" => ["PASSWORD"] } },
      ->(data) { data["authOptions"] = { "globalAccessAuth" => ["ACCOUNT"] } }
    ]
    changes.each do |change|
      data = provider_record
      change.call(data)
      expect { envelope.verify!(data, client:, operation_id:, before_send: true) }.to raise_error(described_class::Mismatch)
    end
  end

  it "rejects moved, rebound, missing, duplicated or secretly prefilled fields" do
    changes = [
      ->(data) { data["fields"][0]["page"] = 99 }, ->(data) { data["fields"][0]["positionX"] = 50 },
      ->(data) { data["fields"][0]["recipientId"] = 2 }, ->(data) { data["fields"][0]["envelopeItemId"] = "item_1" },
      ->(data) { data["fields"][0]["fieldMeta"]["required"] = false },
      ->(data) { data["fields"][0]["fieldMeta"]["text"] = "Unapproved contract value" },
      ->(data) { data["fields"].pop }, ->(data) { data["fields"][1] = data["fields"][0].deep_dup },
      ->(data) { data["fields"][0]["customText"] = "Someone else's signature" },
      ->(data) { data["fields"][0]["inserted"] = true }, ->(data) { data["fields"][0]["width"] = "NaN" }
    ]
    changes.each do |change|
      data = provider_record
      change.call(data)
      expect { envelope.verify!(data, client:, operation_id:, before_send: true) }.to raise_error(described_class::Mismatch)
    end
  end

  it "rejects swapped, changed or duplicated source files" do
    allow(client).to receive(:original).with("item_0").and_return(bytes.last)
    expect { envelope.verify!(provider_record, client:, operation_id:, before_send: true) }.to raise_error(described_class::Mismatch)
    allow(client).to receive(:original).with("item_0").and_return(bytes.first)
    data = provider_record
    data["envelopeItems"][1]["id"] = "item_0"
    expect { envelope.verify!(data, client:, operation_id:, before_send: true) }.to raise_error(described_class::Mismatch)
  end

  it "rejects even subpixel field changes after the approved position was saved" do
    data = provider_record
    data["fields"][0]["positionX"] = "10.0001"
    expect { envelope.verify!(data, client:, operation_id:, before_send: true) }.to raise_error(described_class::Mismatch)
  end

  it "requires a saved version with canonical positions rather than moving an approved field during send" do
    fields.first["x"] = 10.1234
    expect { envelope.payload(operation_id:) }.to raise_error(described_class::InvalidConfiguration, /new version/)
  end

  it "does not distribute an already sent or opened signing request" do
    data = provider_record
    data["status"] = "PENDING"
    expect { envelope.verify!(data, client:, operation_id:, before_send: true) }.to raise_error(described_class::Mismatch)
    data["status"] = "DRAFT"
    data["recipients"][0]["sendStatus"] = "SENT"
    expect { envelope.verify!(data, client:, operation_id:, before_send: true) }.to raise_error(described_class::Mismatch)
  end
end
