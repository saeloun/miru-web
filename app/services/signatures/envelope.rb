# frozen_string_literal: true

require "bigdecimal"

class Signatures::Envelope
  class InvalidConfiguration < StandardError; end
  class Mismatch < StandardError; end

  OPTIONS = {
    "version" => 1, "dateFormat" => "dd/MM/yyyy", "distributionMethod" => "EMAIL", "signingOrder" => "PARALLEL",
    "allowDictateNextSigner" => false, "typedSignatureEnabled" => true, "uploadSignatureEnabled" => true,
    "drawSignatureEnabled" => true, "language" => "en", "envelopeExpirationPeriod" => { "unit" => "month", "amount" => 3 }.freeze
  }.freeze
  ROLES = { "signer" => "SIGNER", "reviewer" => "APPROVER", "cc" => "CC" }.freeze

  def self.default_options(timezone:)
    OPTIONS.merge("timezone" => timezone)
  end

  def self.valid_options?(options)
    return false unless options.is_a?(Hash) && options.except("timezone") == OPTIONS && options["timezone"].is_a?(String)

    TZInfo::Timezone.get(options["timezone"])
    true
  rescue TZInfo::InvalidTimezoneIdentifier
    false
  end

  def initialize(revision)
    @revision = revision
  end

  def payload(operation_id:)
    configuration = Signatures::Configuration.new(documents: @revision.documents, recipients: @revision.recipients, fields: @revision.fields)
    unless self.class.valid_options?(@revision.signing_options) && configuration.ready_errors.empty? &&
        operation_id.is_a?(String) && Signatures::Configuration::ID.match?(operation_id)
      raise InvalidConfiguration, "Save a complete new version with signing settings before sending."
    end
    result = { "title" => @revision.title, "type" => "DOCUMENT", "externalId" => operation_id,
      "globalAccessAuth" => [], "globalActionAuth" => [], "meta" => @revision.signing_options.except("version"),
      "recipients" => @revision.recipients.map { |person| recipient(person) } }
    if JSON.generate(result).bytesize > Signatures::Configuration::MAX_BYTES
      raise InvalidConfiguration, "The signing fields exceed the provider's supported size. Reduce their values and save a new version."
    end
    result
  end

  def verify!(data, client:, operation_id:, before_send:)
    expected = payload(operation_id:)
    mismatch! unless data.is_a?(Hash) && data["id"].is_a?(String) && Signatures::DocumensoClient::ID.match?(data["id"]) &&
      (@revision.provider_envelope_id.nil? || @revision.provider_envelope_id == data["id"]) &&
      data.values_at("title", "type", "externalId") == expected.values_at("title", "type", "externalId") &&
      (!before_send || data["status"] == "DRAFT") && empty_auth?(data["authOptions"], %w[globalAccessAuth globalActionAuth])
    meta = data["documentMeta"]
    mismatch! unless meta.is_a?(Hash) && expected["meta"].all? { |key, value| meta[key] == value } && [nil, ""].include?(meta["redirectUrl"])
    items = document_items(data)
    people = verify_recipients(data, expected.fetch("recipients"), before_send:)
    verify_fields(data, expected.fetch("recipients"), items:, people:, before_send:)
    items.each_with_index do |item, index|
      mismatch! unless Digest::SHA256.hexdigest(client.original(item.fetch("id"))) == @revision.documents[index].fetch("sha256")
    end
    true
  end

  private

    def recipient(person)
      { "name" => person.fetch("name"), "email" => person.fetch("email").downcase, "role" => ROLES.fetch(person.fetch("role")),
        "accessAuth" => person["authentication"] == "email_code" ? ["TWO_FACTOR_AUTH"] : [], "actionAuth" => [],
        "fields" => @revision.fields.filter_map { |field| provider_field(field) if field["recipient_id"] == person["id"] } }
        .tap { |result| result["signingOrder"] = 1 unless person["role"] == "cc" }
    end

    def provider_field(field)
      type = field.fetch("type")
      type = "text" if %w[name email date].include?(type) && field["value"].present?
      coordinates = field.values_at("x", "y", "width", "height")
      unless coordinates.all? { |value| value == value.round(2) }
        raise InvalidConfiguration, "Save a new version to align field positions to the supported 0.01% precision."
      end
      x, y, width, height = coordinates
      { "identifier" => @revision.documents.index { |document| document["key"] == field["document_id"] },
        "type" => type.upcase, "page" => field.fetch("page"), "positionX" => x, "positionY" => y, "width" => width, "height" => height,
        "fieldMeta" => field_meta(field, type) }
    end

    def field_meta(field, type)
      meta = { "type" => type, "label" => field.fetch("label"), "placeholder" => "", "required" => field.fetch("required"),
        "readOnly" => field.fetch("read_only"), "fontSize" => type == "signature" ? 18 : 12, "overflow" => "auto" }
      meta["textAlign"] = "left" unless %w[signature checkbox dropdown].include?(type)
      case type
      when "text"
        meta.merge!("text" => field["value"].to_s, "characterLimit" => 0, "lineHeight" => nil, "letterSpacing" => nil, "verticalAlign" => nil)
      when "number"
        meta.merge!("value" => field["value"].to_s, "numberFormat" => nil, "minValue" => nil, "maxValue" => nil,
          "lineHeight" => nil, "letterSpacing" => nil, "verticalAlign" => nil)
      when "checkbox"
        meta.merge!("values" => [{ "id" => 1, "checked" => field["value"] == true, "value" => "" }],
          "validationRule" => "", "validationLength" => 0, "direction" => "vertical")
      when "dropdown"
        meta["values"] = field.fetch("options").map { |value| { "value" => value } }
        meta["defaultValue"] = field["value"].to_s
      end
      meta
    end

    def document_items(data)
      items = data["envelopeItems"]
      mismatch! unless items.is_a?(Array) && items.size == @revision.documents.size && items.all? do |item|
        item.is_a?(Hash) && item["envelopeId"] == data["id"] && item["id"].is_a?(String) &&
          Signatures::DocumensoClient::ID.match?(item["id"]) && item["order"].is_a?(Integer) && item["order"].between?(0, 20)
      end
      mismatch! unless items.pluck("id").uniq.size == items.size && items.pluck("order").uniq.size == items.size
      items.sort_by { |item| item.fetch("order") }
    end

    def verify_recipients(data, expected, before_send:)
      people = data["recipients"]
      mismatch! unless people.is_a?(Array) && people.size == expected.size && people.all? do |person|
        person.is_a?(Hash) && person["envelopeId"] == data["id"] && person["id"].is_a?(Integer) && person["id"].positive? &&
          (!before_send || pristine_recipient?(person))
      end
      mismatch! unless people.pluck("id").uniq.size == people.size
      expected.map do |person|
        matches = people.select { |actual| actual.values_at("name", "email", "role") == person.values_at("name", "email", "role") }
        mismatch! unless matches.size == 1 && matches.first["signingOrder"] == person["signingOrder"] &&
          recipient_auth?(matches.first["authOptions"], person)
        matches.first
      end
    end

    def pristine_recipient?(person)
      expected = person["role"] == "CC" ? %w[SIGNED SENT] : %w[NOT_SIGNED NOT_SENT]
      person.values_at("signingStatus", "sendStatus") == expected && person["readStatus"] == "NOT_OPENED"
    end

    def verify_fields(data, expected, items:, people:, before_send:)
      fields = data["fields"]
      mismatch! unless fields.is_a?(Array) && fields.size == @revision.fields.size && fields.all? do |field|
        field.is_a?(Hash) && field["envelopeId"] == data["id"] && field["id"].is_a?(Integer) && field["id"].positive? &&
          (!before_send || field["inserted"] == false && field["customText"] == "")
      end
      mismatch! unless fields.pluck("id").uniq.size == fields.size
      actual = fields.map do |field|
        [items.index { |item| item["id"] == field["envelopeItemId"] }, field["recipientId"], *field_shape(field)]
      end
      desired = expected.each_with_index.flat_map do |person, index|
        person.fetch("fields").map { |field| [field.fetch("identifier"), people[index].fetch("id"), *field_shape(field)] }
      end
      mismatch! unless actual.tally == desired.tally
    end

    def field_shape(field)
      mismatch! unless field["page"].is_a?(Integer) && field["fieldMeta"].is_a?(Hash)
      coordinates = field.values_at("positionX", "positionY", "width", "height").map do |value|
        mismatch! unless value.is_a?(Numeric) || value.is_a?(String) && value.match?(/\A\d{1,3}(?:\.\d{1,8})?\z/)
        number = BigDecimal(value.to_s, exception: false)
        mismatch! unless number&.finite? && number >= 0 && number <= 100
        number
      end
      [field["type"], field["page"], coordinates, field["fieldMeta"]]
    end

    def empty_auth?(options, keys)
      options.nil? || options.is_a?(Hash) && (options.keys - keys).empty? && options.values.all? { |value| value.nil? || value == [] }
    end

    def recipient_auth?(options, person)
      return person["accessAuth"].empty? if options.nil?

      options.is_a?(Hash) && (options.keys - %w[accessAuth actionAuth]).empty? &&
        %w[accessAuth actionAuth].all? { |key| (options[key].nil? ? [] : options[key]) == person[key] }
    end

    def mismatch!
      raise Mismatch, "The provider document does not match the approved version. Reconcile it before continuing.", cause: nil
    end
end
