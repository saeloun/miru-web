# frozen_string_literal: true

module Hiring
  class Offers
    TERM_KEYS = (HiringOffer::DETAIL_KEYS - ["time_zone"]).freeze
    CREATE_KEYS = (%w[company_id application_version request_key] + TERM_KEYS).freeze
    UPDATE_KEYS = (CREATE_KEYS - ["request_key"] + ["offer_version"]).freeze
    ISSUE_KEYS = %w[company_id application_version offer_version].freeze

    def initialize(application:, actor:)
      @application, @actor = application, actor
      @company = application.company
    end

    def with_application(&block)
      raise Pundit::NotAuthorizedError unless @actor

      @actor.with_lock do
        raise Pundit::NotAuthorizedError unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, @application).update?

        @company.with_lock("FOR NO KEY UPDATE") { @application.with_lock(&block) }
      end
    end

    def create!(attributes:)
      with_application do
        input!(attributes, CREATE_KEYS)
        existing = existing_offer(attributes)
        next [existing, false] if existing
        version!(@application, attributes["application_version"])
        selected!
        Audited.audit_class.as_user(@actor) do
          @application.hiring_offers.where(state: "sent").where("expires_at <= ?", Time.current).find_each(&:expire!)
        end
        if @application.hiring_offers.where(state: %w[preparing sent accepted]).exists?
          raise Intake::Conflict, "Review the existing active offer before preparing another."
        end
        record = Audited.audit_class.as_user(@actor) do
          @application.hiring_offers.create!(company: @company, created_by: @actor, request_key: attributes["request_key"],
            request_details: attributes, details: terms(attributes))
        end
        @application.touch
        [record.reload, true]
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Complete valid engagement, compensation, joining and expiry terms."
    end

    def update!(offer:, attributes:)
      with_application do
        input!(attributes, UPDATE_KEYS)
        offer.lock!
        matching!(offer)
        raise Intake::Conflict, "Issued offers cannot be edited. Prepare a new offer after decline or expiry." unless offer.state == "preparing"
        next offer if offer.edit_details == attributes

        version!(@application, attributes["application_version"])
        version!(offer, attributes["offer_version"])
        selected!
        Audited.audit_class.as_user(@actor) { offer.update!(details: terms(attributes), edit_details: attributes) }
        @application.touch
        offer
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Complete valid engagement, compensation, joining and expiry terms."
    end

    def issue!(offer:, attributes:)
      with_application do
        input!(attributes, ISSUE_KEYS)
        offer.lock!
        matching!(offer)
        if offer.issued_at
          raise Intake::Conflict, "This offer was issued with different confirmed intent." unless offer.issue_details["intent"] == attributes

          next offer
        end
        version!(@application, attributes["application_version"])
        version!(offer, attributes["offer_version"])
        decision = selected!
        expires_at = issue_expiry(offer)
        Audited.audit_class.as_user(@actor) do
          offer.update!(state: "sent", issued_by: @actor, issued_at: Time.current, expires_at:,
            issue_details: { "intent" => attributes, "decision_id" => decision.id, "recipient" => @application.hiring_candidate.reload.email,
              "candidate_name" => @application.submitted_name, "company_name" => @company.name })
          @application.update!(stage: "offer")
          @application.touch if @application.saved_changes.empty?
        end
        offer
      end
    end

    def revoke!(offer:, attributes:)
      with_application do
        input!(attributes, ISSUE_KEYS)
        offer.lock!
        matching!(offer)
        next offer if offer.revoked_at

        version!(@application, attributes["application_version"])
        version!(offer, attributes["offer_version"])
        raise Intake::InvalidInput, "Only an issued offer has a private link to revoke." unless offer.issued_at

        Audited.audit_class.as_user(@actor) { offer.update!(revoked_at: Time.current, state: offer.state == "sent" ? "expired" : offer.state) }
        @application.touch
        offer
      end
    end

    private

      def existing_offer(attributes)
        key = attributes["request_key"]
        raise Intake::InvalidInput, "Use a valid offer request identity." unless key.is_a?(String) && key.match?(/\A[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\z/i)

        existing = @company.hiring_offers.find_by(request_key: key)
        if existing && (existing.hiring_application_id != @application.id || existing.request_details != attributes)
          raise Intake::Conflict, "This offer reference has different saved intent."
        end
        existing
      end

      def issue_expiry(offer)
        zone = offer.details.fetch("time_zone")
        today = Time.current.in_time_zone(zone).to_date
        if %w[joining_on expires_on].any? { |key| Date.iso8601(offer.details.fetch(key)) < today }
          raise Intake::InvalidInput, "Choose joining and expiry dates today or later before issuing."
        end
        Date.iso8601(offer.details.fetch("expires_on")).in_time_zone(zone).end_of_day
      end

      def input!(attributes, keys)
        unless attributes.is_a?(Hash) && attributes.keys.sort == keys.sort && JSON.generate(attributes).bytesize <= 16.kilobytes
          raise Intake::InvalidInput, "Use complete offer parameters."
        end
        raise Intake::Conflict, "The hiring workspace changed. Reload before saving." unless attributes["company_id"] == @company.id
      end

      def version!(record, value)
        raise Intake::Conflict, "This application or offer changed. Reload before confirming." unless value.is_a?(Integer) && value >= 0 && value == record.lock_version
      end

      def matching!(offer)
        raise Pundit::NotAuthorizedError unless offer.company_id == @company.id && offer.hiring_application_id == @application.id
      end

      def selected!
        decision = @application.hiring_decisions.order(id: :desc).first
        unless %w[final_decision offer].include?(@application.stage) && decision&.state == "finalized" && decision.details["outcome"] == "pass"
          raise Intake::InvalidInput, "Finalize the current selection decision before preparing or issuing an offer."
        end
        decision
      end

      def terms(attributes) = attributes.slice(*TERM_KEYS).merge("time_zone" => @company.resolved_time_zone.tzinfo.name)
  end
end
