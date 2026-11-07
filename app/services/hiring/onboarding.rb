# frozen_string_literal: true

module Hiring
  class Onboarding
    START_KEYS = %w[company_id application_version offer_version first_name last_name employment_id employment_updated_at invitation_id invitation_updated_at send_invitation].freeze
    VERSION_KEYS = %w[company_id application_version offer_version].freeze

    def initialize(application:, offer:, actor:)
      @application, @offer, @actor = application, offer, actor
      @company = application.company
    end

    def review!
      with_offer { presentation }
    end

    def start!(attributes:)
      with_offer do
        input!(attributes, START_KEYS)
        if @offer.onboarding_started_at
          raise Intake::Conflict, "Onboarding was confirmed with different intent. Review its current status." unless @offer.onboarding_details["intent"] == attributes

          next [presentation, false]
        end
        source!
        versions!(attributes)
        user, employment = target(lock: true)
        invitation = pending_invitation(lock: true)
        references!(attributes, employment, invitation)
        eligible!(user, employment, invitation)
        unless attributes["send_invitation"] == (!employment && !invitation&.is_valid?)
          raise Intake::Conflict, "Invitation availability changed. Review whether an email will be sent before confirming."
        end
        Audited.audit_class.as_user(@actor) do
          @offer.update!(onboarding_started_at: Time.current, onboarding_details: { "intent" => attributes, "confirmed_by_id" => @actor.id })
          if employment
            confirm_names!(user, attributes)
            finish!(employment, { "intent" => attributes, "confirmed_by_id" => @actor.id })
          else
            invite!(invitation, attributes)
            @application.touch
          end
        end
        [presentation, true]
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Use valid reviewed first and last names and compatible staff profile details."
    rescue ActiveRecord::LockWaitTimeout
      raise Intake::Conflict, "The recipient account is being updated. Reload onboarding before confirming."
    end

    def complete!(attributes:)
      with_offer do
        input!(attributes, START_KEYS)
        if @offer.onboarded_at
          raise Intake::Conflict, "A different profile handoff is already recorded." unless @offer.onboarding_completion_details["intent"] == attributes

          next presentation
        end
        source!
        versions!(attributes)
        raise Intake::InvalidInput, "Start onboarding before linking a profile." unless @offer.onboarding_started_at

        user, employment = target(lock: true)
        invitation = pending_invitation(lock: true)
        references!(attributes, employment, invitation)
        eligible!(user, employment, invitation)
        raise Intake::InvalidInput, "Review an existing staff profile first." unless employment
        raise Intake::Conflict, "Review the existing profile handoff without an invitation email." unless attributes["send_invitation"] == false

        confirm_names!(user, attributes)
        cancelled_invitation = invitation if invitation&.hiring_offer_id == @offer.id && !invitation.accepted_at
        Audited.audit_class.as_user(@actor) do
          finish!(employment, { "intent" => attributes, "confirmed_by_id" => @actor.id, "cancelled_invitation_id" => cancelled_invitation&.id })
          cancelled_invitation&.destroy!
        end
        presentation
      end
    rescue ActiveRecord::LockWaitTimeout
      raise Intake::Conflict, "The recipient account is being updated. Reload onboarding before confirming."
    end

    def renew!(attributes:)
      with_offer do
        input!(attributes, VERSION_KEYS)
        source!
        raise Intake::InvalidInput, "Only pending onboarding has an invitation to renew." unless @offer.onboarding_started_at && !@offer.onboarded_at

        invitation = pending_invitation(lock: true)
        next presentation if invitation&.is_valid?

        versions!(attributes)
        user, employment = target(lock: true)
        eligible!(user, employment, invitation)
        raise Intake::Conflict, "A profile now exists. Review and link it explicitly." if employment

        Audited.audit_class.as_user(@actor) do
          invite!(invitation, @offer.onboarding_details.fetch("intent"))
          @offer.touch
          @application.touch
        end
        presentation
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Review this invitation in Team before renewing it."
    rescue ActiveRecord::LockWaitTimeout
      raise Intake::Conflict, "The recipient account is being updated. Reload onboarding before confirming."
    end

    def self.with_invitation(invitation)
      offer = invitation.hiring_offer
      return yield(nil) unless offer

      application = offer.hiring_application
      application.with_lock do
        offer.with_lock do
          service = new(application:, offer:, actor: invitation.sender)
          yield service
        end
      end
    end

    def validate_invitation!(invitation)
      source!
      intent = @offer.onboarding_details["intent"]
      unless invitation.hiring_offer_id == @offer.id && invitation.company_id == @company.id && @offer.onboarding_started_at && !@offer.onboarded_at &&
          invitation.employee? && !invitation.client_id && invitation.recipient_email == @offer.issue_details["recipient"] && intent &&
          invitation.first_name == intent["first_name"] && invitation.last_name == intent["last_name"]
        raise Intake::Conflict, "This hiring invitation changed. Ask the hiring admin to review onboarding."
      end
    end

    def validate_recipient!(user)
      if !user.kept? || user.email != @offer.issue_details["recipient"] || @company.employments.where(user:).exists? || user.roles.where(resource: @company).exists?
        raise Intake::Conflict, "A workspace profile already exists or the account changed. Ask the hiring admin to review and link it."
      end
    end

    def create_employment!(user)
      @company.employments.create!(user:, employment_type: employment_type, designation: @offer.details.fetch("title"), joined_at: Date.iso8601(@offer.details.fetch("joining_on")))
    end

    def record_acceptance!(user, invitation)
      finish!(@company.employments.find_by!(user:), { "invitation_id" => invitation.id, "accepted_by_id" => user.id })
    end

    private

      def with_offer(&block)
        Offers.new(application: @application, actor: @actor).with_application do
          @offer.lock!
          raise Pundit::NotAuthorizedError unless @offer.company_id == @company.id && @offer.hiring_application_id == @application.id

          block.call
        end
      end

      def input!(attributes, keys)
        unless attributes.is_a?(Hash) && attributes.keys.sort == keys.sort && JSON.generate(attributes).bytesize <= 16.kilobytes
          raise Intake::InvalidInput, "Use complete reviewed onboarding parameters."
        end
        raise Intake::Conflict, "The hiring workspace changed. Reload onboarding." unless attributes["company_id"] == @company.id
      end

      def versions!(attributes)
        unless attributes["application_version"].is_a?(Integer) && attributes["application_version"] == @application.lock_version &&
            attributes["offer_version"].is_a?(Integer) && attributes["offer_version"] == @offer.lock_version
          raise Intake::Conflict, "The application or offer changed. Reload onboarding before confirming."
        end
      end

      def source_reason
        return "Only an accepted offer can start onboarding." unless @offer.state == "accepted"

        decision = @application.hiring_decisions.order(id: :desc).first
        unless %w[offer hired].include?(@application.stage) && decision&.id == @offer.issue_details["decision_id"] &&
            decision.state == "finalized" && decision.details["outcome"] == "pass" && @application.hiring_candidate.reload.email == @offer.issue_details["recipient"]
          "The accepted offer's selection or recipient changed. Review the hiring source first."
        end
      end

      def source!
        reason = source_reason
        raise Intake::InvalidInput, reason if reason
      end

      def employment_type = @offer.details["engagement"] == "consultant" ? "contractor" : "salaried"

      def target(lock: false)
        scope = User.where(email: @offer.issue_details["recipient"])
        user = (lock ? scope.lock("FOR NO KEY UPDATE NOWAIT") : scope).first
        employment = @company.employments.find_by(user:) if user
        employment.lock! if lock && employment
        [user, employment]
      end

      def pending_invitation(lock: false)
        invitation = @offer.reload_onboarding_invitation || @company.invitations.where(recipient_email: @offer.issue_details["recipient"], accepted_at: nil)
          .order(Arel.sql("CASE WHEN expired_at >= CURRENT_TIMESTAMP THEN 0 ELSE 1 END, id DESC")).first
        invitation.lock! if lock && invitation
        invitation
      end

      def eligibility_reason(user, employment, invitation)
        return "This recipient cannot be onboarded here. Contact your workspace owner for help." if user && !user.kept?
        if employment
          return "Review the existing employment and engagement in Team before linking." unless employment.kept? &&
            (!employment.resigned_at || employment.resigned_at >= Date.current) && employment.employment_type.to_s.downcase == employment_type &&
            user.roles.where(resource: @company, name: Employment::STAFF_ROLES).exists?
        elsif user&.roles&.where(resource: @company)&.exists?
          return "Review the existing workspace role in Team before onboarding."
        end
        if invitation && (!invitation.employee? || invitation.client_id || invitation.hiring_offer_id && invitation.hiring_offer_id != @offer.id)
          "Review the existing invitation in Team before onboarding."
        end
      end

      def eligible!(user, employment, invitation)
        reason = eligibility_reason(user, employment, invitation)
        raise Intake::InvalidInput, reason if reason
      end

      def references!(attributes, employment, invitation)
        unless attributes["employment_id"] == employment&.id && attributes["employment_updated_at"] == employment&.updated_at&.iso8601(6) &&
            attributes["invitation_id"] == invitation&.id && attributes["invitation_updated_at"] == invitation&.updated_at&.iso8601(6)
          raise Intake::Conflict, "The recipient profile or invitation changed. Review the current handoff."
        end
      end

      def confirm_names!(user, attributes)
        unless user.first_name == attributes["first_name"] && user.last_name == attributes["last_name"]
          raise Intake::Conflict, "Use the existing member's reviewed name; edit account details separately."
        end
      end

      def invite!(invitation, attributes)
        if invitation
          invitation.lock!
          expired = !invitation.is_valid?
          raise Intake::Conflict, "This invitation was already accepted. Review the current profile." if invitation.accepted_at
          raise CreateInvitedUserService::SeatLimitReached if expired && !@company.can_add_team_member_role?("employee")

          changes = { first_name: attributes["first_name"], last_name: attributes["last_name"], hiring_offer: @offer }
          changes.merge!(token: Devise.friendly_token, expired_at: Invitation::MAX_EXPIRATION_DAY.from_now, sender: @actor) if expired
          invitation.update!(changes)
          invitation.resend_invitation if expired
        else
          raise CreateInvitedUserService::SeatLimitReached unless @company.can_add_team_member_role?("employee")

          ::Invitations::CreateInvitationService.new({ first_name: attributes["first_name"], last_name: attributes["last_name"],
            recipient_email: @offer.issue_details.fetch("recipient"), role: "employee", hiring_offer: @offer }, @company, @actor).process
        end
      rescue CreateInvitedUserService::SeatLimitReached => error
        raise Intake::InvalidInput, error.message
      end

      def finish!(employment, evidence)
        employment.create_employee_record!(private_details: { "family_members" => [] }) unless employment.employee_record
        @offer.update!(employment:, onboarded_at: Time.current, onboarding_completion_details: evidence)
        @application.update!(stage: "hired")
      end

      def profile_details(employment)
        return unless employment

        employment.slice(:id, :employment_type, :designation, :joined_at, :employee_id).merge(
          user_id: employment.user_id, first_name: employment.user.first_name, last_name: employment.user.last_name,
          email: employment.user.email, updated_at: employment.updated_at.iso8601(6))
      end

      def presentation
        @offer.reload
        user, employment = target
        invitation = pending_invitation
        reason = source_reason || eligibility_reason(user, employment, invitation)
        { started_at: @offer.onboarding_started_at, onboarded_at: @offer.onboarded_at, can_start: !reason && !@offer.onboarding_started_at,
          recipient: @offer.issue_details["recipient"], reviewed_name: @offer.onboarding_details["intent"]&.slice("first_name", "last_name"),
          invitation_will_send: !employment && !invitation&.is_valid?,
          can_link: !reason && @offer.onboarding_started_at.present? && !@offer.onboarded_at && employment.present?,
          can_renew: !reason && @offer.onboarding_started_at.present? && !@offer.onboarded_at && !employment && !invitation&.is_valid?,
          reason:, employment: profile_details(@offer.employment || employment),
          invitation: invitation&.slice(:id, :first_name, :last_name, :recipient_email, :expired_at, :accepted_at)&.merge(updated_at: invitation.updated_at.iso8601(6)) }
      end
  end
end
