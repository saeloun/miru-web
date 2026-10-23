# frozen_string_literal: true

module AgreementFixtures
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
