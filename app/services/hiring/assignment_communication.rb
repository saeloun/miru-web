# frozen_string_literal: true

module Hiring
  class AssignmentCommunication < MessageCommunication
    KEYS = %w[company_id kind mailbox_id mailbox_version setting_version application_version assignment_id assignment_version
      template_revision_id template_version recipient link_digest].freeze

    def initialize(assignment:, actor:)
      @assignment, @actor = assignment, actor
      @application = assignment.hiring_application
      @company = assignment.company
    end

    def with_context(&block)
      raise Pundit::NotAuthorizedError unless @actor

      @actor.with_lock do
        unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, @application).update? &&
            HiringPolicy.administrators(@company).exists?(user_id: @actor.id)
          raise Pundit::NotAuthorizedError
        end
        @company.with_lock("FOR NO KEY UPDATE") do
          @application.with_lock do
            @assignment.with_lock do
              unless @application.company_id == @company.id && @assignment.company_id == @company.id &&
                  @assignment.hiring_application_id == @application.id
                raise Pundit::NotAuthorizedError
              end

              block.call
            end
          end
        end
      end
    end

    def messages = @company.hiring_messages.where(hiring_application: @application, kind: "assignment", event_key: operation_key)

    def current_operation?(message) = super && eligible?

    def self.eligible?(assignment)
      assignment.active? && assignment.status == "issued" && assignment.due_at > Time.current &&
        HiringAssignmentSubmission.where(hiring_assignment_id: assignment.id, submitted_at: nil).exists?
    end

    def self.link(assignment)
      options = Rails.application.config.action_mailer.default_url_options
      raise Intake::InvalidInput, "Configure the application URL before preparing an assignment email." unless options.is_a?(Hash)

      token = assignment.access_token
      secure = Rails.application.config.force_ssl
      protocol = secure ? "https" : options.fetch(:protocol, "http")
      url = Rails.application.routes.url_helpers.hiring_assignment_url(**options, protocol:, anchor: token)
      uri = URI.parse(url)
      unless token.is_a?(String) && token.match?(HiringPortalAccess::TOKEN) && url.length <= 2048 &&
          %w[http https].include?(uri.scheme) && (!secure || uri.scheme == "https") && uri.host.present? &&
          uri.userinfo.nil? && uri.query.nil? && uri.fragment == token
        raise Intake::InvalidInput, "Configure a valid application URL before preparing an assignment email."
      end
      url
    rescue URI::InvalidURIError, ArgumentError
      raise Intake::InvalidInput, "Configure a valid application URL before preparing an assignment email."
    end

    def self.blocked_reason(message)
      intent = message.content["intent"]
      assignment = message.company.hiring_assignments.find_by(id: intent["assignment_id"]) if intent.is_a?(Hash)
      unless assignment && assignment.hiring_application_id == message.hiring_application_id &&
          message.event_key == "assignment:#{assignment.id}" && eligible?(assignment)
        return "assignment_unavailable"
      end
      current = [assignment.lock_version, assignment.hiring_application.lock_version, assignment.template_revision_id, assignment.terms["lock_version"]]
      unless intent.values_at("assignment_version", "application_version", "template_revision_id", "template_version") == current
        return "assignment_changed"
      end
      return "recipient_changed" unless assignment.hiring_application.hiring_candidate.reload.email == message.content["to"]
      return "assignment_link_changed" unless intent["link_digest"] == Digest::SHA256.hexdigest(link(assignment))

      nil
    rescue Intake::InvalidInput
      "assignment_link_changed"
    end

    private

      def operation_key = "assignment:#{@assignment.id}"

      def eligible? = self.class.eligible?(@assignment)

      def input!(attributes)
        integers = KEYS - %w[kind recipient link_digest]
        unless attributes.is_a?(Hash) && attributes.keys.sort == KEYS.sort && attributes["kind"] == "assignment" &&
            integers.all? { |key| attributes[key].is_a?(Integer) && attributes[key] >= 0 } &&
            attributes["company_id"] == @company.id && attributes["assignment_id"] == @assignment.id &&
            attributes["recipient"].is_a?(String) && attributes["recipient"].length <= 254 &&
            attributes["link_digest"].is_a?(String) && attributes["link_digest"].match?(/\A[0-9a-f]{64}\z/)
          raise Intake::InvalidInput, "Confirm the complete current assignment email preview before sending."
        end
      end

      def current_preview(kind, mailbox_id)
        unless kind == "assignment" && mailbox_id.is_a?(Integer) && mailbox_id.positive? && eligible?
          raise Intake::InvalidInput, "Choose the current issued assignment that is still open for submission before preparing email."
        end
        setting = @company.hiring_setting&.reload
        mailbox = @company.hiring_mailboxes.find_by(id: mailbox_id, active: true)
        unless setting&.approved? && mailbox && HiringSetting::ASSIGNMENT_FIELDS.all? { |key| setting.details[key].present? }
          raise Intake::InvalidInput, "Save and approve the assignment subject/body and choose an enabled reply inbox."
        end
        recipient = @application.hiring_candidate.reload.email
        unless recipient.is_a?(String) && recipient.present?
          raise Intake::InvalidInput, "Add a candidate email address before preparing assignment email."
        end
        url = self.class.link(@assignment)
        intent = { "company_id" => @company.id, "kind" => kind, "mailbox_id" => mailbox.id, "mailbox_version" => mailbox.lock_version,
          "setting_version" => setting.lock_version, "application_version" => @application.lock_version,
          "assignment_id" => @assignment.id, "assignment_version" => @assignment.lock_version,
          "template_revision_id" => @assignment.template_revision_id, "template_version" => @assignment.terms.fetch("lock_version"),
          "recipient" => recipient, "link_digest" => Digest::SHA256.hexdigest(url) }
        { "intent" => intent, "mailbox_id" => mailbox.id, "to" => recipient, "reply_to" => mailbox.source_email,
          "subject" => setting.details.fetch("assignment_subject"),
          "body" => [setting.details.fetch("assignment_body"), "Candidate: #{@application.submitted_name}",
            "Assignment: #{@assignment.terms.fetch('title')}", "Submit before: #{@assignment.due_at.utc.iso8601}",
            "Open your private assignment: #{url}"].join("\n\n") }
      end
  end
end
