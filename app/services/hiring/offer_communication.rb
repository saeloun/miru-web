# frozen_string_literal: true

module Hiring
  class OfferCommunication < MessageCommunication
    KEYS = %w[company_id kind mailbox_id mailbox_version setting_version application_version offer_id offer_version recipient link_digest].freeze

    def initialize(offer:, actor:)
      @offer, @actor = offer, actor
      @application = offer.hiring_application
      @company = offer.company
    end

    def with_context(&block)
      Offers.new(application: @application, actor: @actor).with_application do
        @offer.with_lock do
          raise Pundit::NotAuthorizedError unless @offer.company_id == @company.id && @offer.hiring_application_id == @application.id

          block.call
        end
      end
    end

    def messages = @company.hiring_messages.where(hiring_application: @application, kind: "offer", event_key: operation_key)

    def current_operation?(message) = super && @offer.can_email?

    def self.link(offer)
      options = Rails.application.config.action_mailer.default_url_options
      raise Intake::InvalidInput, "Configure the application URL before preparing an offer email." unless options.is_a?(Hash)

      protocol = Rails.application.config.force_ssl ? "https" : options.fetch(:protocol, "http")
      url = Rails.application.routes.url_helpers.hiring_offer_url(**options, protocol:, anchor: offer.access_token)
      uri = URI.parse(url)
      unless url.length <= 2048 && %w[http https].include?(uri.scheme) && uri.host.present? && uri.userinfo.nil? && uri.query.nil? && uri.fragment == offer.access_token
        raise Intake::InvalidInput, "Configure a valid application URL before preparing an offer email."
      end
      url
    rescue URI::InvalidURIError, ArgumentError
      raise Intake::InvalidInput, "Configure a valid application URL before preparing an offer email."
    end

    def self.blocked_reason(message)
      intent = message.content["intent"]
      offer = message.company.hiring_offers.find_by(id: intent["offer_id"]) if intent.is_a?(Hash)
      return "offer_unavailable" unless offer && offer.hiring_application_id == message.hiring_application_id && offer.can_email?
      unless message.event_key == "offer:#{offer.id}" && intent.values_at("offer_version", "application_version") == [offer.lock_version, offer.hiring_application.lock_version]
        return "offer_changed"
      end
      return "recipient_changed" unless offer.issue_details["recipient"] == message.content["to"]
      return "offer_link_changed" unless intent["link_digest"] == Digest::SHA256.hexdigest(link(offer))

      nil
    rescue Intake::InvalidInput
      "offer_link_changed"
    end

    private

      def operation_key = "offer:#{@offer.id}"

      def input!(attributes)
        integers = KEYS - %w[kind recipient link_digest]
        unless attributes.is_a?(Hash) && attributes.keys.sort == KEYS.sort && attributes["kind"] == "offer" &&
            integers.all? { |key| attributes[key].is_a?(Integer) && attributes[key] >= 0 } && attributes["company_id"] == @company.id && attributes["offer_id"] == @offer.id &&
            attributes["recipient"].is_a?(String) && attributes["recipient"].length <= 254 && attributes["link_digest"].is_a?(String) && attributes["link_digest"].match?(/\A[0-9a-f]{64}\z/)
          raise Intake::InvalidInput, "Confirm the complete current offer email preview before sending."
        end
      end

      def current_preview(kind, mailbox_id)
        unless kind == "offer" && mailbox_id.is_a?(Integer) && mailbox_id.positive? && @offer.can_email?
          raise Intake::InvalidInput, "Choose a current issued offer awaiting a response before preparing email."
        end
        setting = @company.hiring_setting&.reload
        mailbox = @company.hiring_mailboxes.find_by(id: mailbox_id, active: true)
        unless setting&.approved? && mailbox && HiringSetting::OFFER_FIELDS.all? { |key| setting.details[key].present? }
          raise Intake::InvalidInput, "Save and approve the offer subject/body and choose an enabled reply inbox."
        end
        url = self.class.link(@offer)
        intent = { "company_id" => @company.id, "kind" => kind, "mailbox_id" => mailbox.id, "mailbox_version" => mailbox.lock_version,
          "setting_version" => setting.lock_version, "application_version" => @application.lock_version, "offer_id" => @offer.id, "offer_version" => @offer.lock_version,
          "recipient" => @offer.issue_details.fetch("recipient"), "link_digest" => Digest::SHA256.hexdigest(url) }
        { "intent" => intent, "mailbox_id" => mailbox.id, "to" => intent.fetch("recipient"), "reply_to" => mailbox.source_email,
          "subject" => setting.details.fetch("offer_subject"), "body" => [setting.details.fetch("offer_body"),
            "Candidate: #{@offer.issue_details.fetch('candidate_name')}", "Review and respond to your private offer: #{url}"].join("\n\n") }
      end
  end
end
