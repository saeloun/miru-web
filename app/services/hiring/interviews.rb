# frozen_string_literal: true

module Hiring
  class Interviews
    CREATE_KEYS = %w[company_id application_version request_key details panel previous_interview_id].freeze
    UPDATE_KEYS = %w[company_id application_version interview_version action details panel reason].freeze
    ENDINGS = { "complete" => "completed", "skip" => "skipped", "cancel" => "cancelled" }.freeze

    def initialize(application:, actor:)
      @application, @actor = application, actor
      @company = application.company
    end

    def create!(attributes:)
      with_actor do
        input!(attributes, CREATE_KEYS)
        key = attributes["request_key"]
        unless key.is_a?(String) && key.match?(/\A[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\z/i)
          raise Intake::InvalidInput, "Use a valid round request identifier."
        end
        existing = @application.hiring_interviews.find_by(request_key: key)
        if existing
          raise Intake::Conflict, "This request already created a different round." unless existing.request_details == attributes

          return existing
        end
        version!(@application, attributes["application_version"])
        open_application!
        create_round!(attributes, key)
      end
    end

    def update!(record:, attributes:)
      with_actor do
        record.with_lock do
          input!(attributes, UPDATE_KEYS)
          version!(@application, attributes["application_version"])
          version!(record, attributes["interview_version"])
          open_application!
          unless record.hiring_application_id == @application.id && record.status == "planned"
            raise Intake::InvalidInput, "This round has ended. Add or repeat a round instead."
          end
          apply_action!(record, attributes)
        end
      end
    end

    private

      def create_round!(attributes, key)
        members = selected_panel(attributes["panel"])
        previous = previous_round(attributes["previous_interview_id"])
        record = @application.hiring_interviews.create!(company: @company, created_by: @actor, previous_interview: previous,
          number: (@application.hiring_interviews.maximum(:number) || 0) + 1, request_key: key, request_details: attributes,
          details: detail_values(attributes), panel_snapshot: members.map { |member, sensitive| panel_snapshot(member, sensitive) })
        grant_access!(record, members)
        save_application!
        @application.hiring_assignments.where(ended_at: nil).find_each { |assignment| assignment.cancel_for_stage!(actor: @actor) }
        event!(record, "created")
        record
      end

      def apply_action!(record, attributes)
        action, reason = attributes.values_at("action", "reason")
        unless reason.nil? || reason.is_a?(String) && reason.length <= 2000 && !reason.include?("\0")
          raise Intake::InvalidInput, "Use a valid reason of at most 2,000 characters."
        end
        event = if action == "update"
          update_round!(record, attributes)
        elsif ENDINGS.key?(action) && reason&.strip.present?
          record.update!(status: ENDINGS.fetch(action), ended_at: Time.current)
          record.close_bookings!(status: action == "complete" ? "completed" : "cancelled", reason:)
          record.hiring_access_grants.active.update_all(revoked_at: Time.current)
          ENDINGS.fetch(action)
        else
          raise Intake::InvalidInput, "Choose a round action and record the reason before ending a round."
        end
        save_application!
        event!(record, event, reason: reason&.strip.presence)
        record
      end

      def with_actor
        raise Pundit::NotAuthorizedError unless @actor

        @actor.with_lock do
          @company.with_lock("FOR NO KEY UPDATE") do
            @application.with_lock do
              unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, @application).update?
                raise Pundit::NotAuthorizedError
              end
              yield
            end
          end
        end
      rescue ActiveRecord::RecordInvalid, ActiveRecord::SerializationTypeMismatch
        raise Intake::InvalidInput, "Use valid interview details and an active panel in this workspace."
      end

      def input!(attributes, keys)
        unless attributes.is_a?(Hash) && (attributes.keys - keys).empty? && JSON.generate(attributes).bytesize <= 128.kilobytes
          raise Intake::InvalidInput, "Use valid round parameters."
        end
        raise Intake::Conflict, "The hiring workspace changed. Reload before saving." unless identity(attributes["company_id"]) == @company.id
      end

      def identity(value)
        return value.to_i if (value.is_a?(String) || value.is_a?(Integer)) && value.to_s.match?(/\A[1-9]\d{0,18}\z/)

        raise Intake::InvalidInput, "Choose valid interview and panel identities."
      end

      def version!(record, value)
        unless value.is_a?(Integer) && value >= 0 && value == record.lock_version
          raise Intake::Conflict, "This application or round changed. Reload before saving."
        end
      end

      def open_application!
        raise Intake::InvalidInput, "This application is closed." if HiringPortalAccess::CLOSED_STAGES.include?(@application.stage)
      end

      def detail_values(attributes)
        value = attributes["details"]
        raise Intake::InvalidInput, "Use valid round details." unless value.is_a?(Hash)

        value
      end

      def selected_panel(value)
        unless value.is_a?(Array) && value.size.between?(1, 20) && value.all? do |entry|
          entry.is_a?(Hash) && entry.keys.sort == %w[compensation_access panel_member_id] && [true, false].include?(entry["compensation_access"])
        end
          raise Intake::InvalidInput, "Select an active panel and explicit compensation permissions."
        end
        identities = value.map { |entry| identity(entry["panel_member_id"]) }
        raise Intake::InvalidInput, "Select each panel member once." unless identities.uniq.size == identities.size

        profiles = @company.hiring_panel_members.where(id: identities).includes(employment: :user).index_by(&:id)
        active = HiringPolicy.staff_members(@company).where(id: profiles.values.map(&:employment_id)).pluck(:id)
        value.zip(identities).map do |entry, id|
          profile = profiles[id]
          raise Intake::InvalidInput, "Select an active panel in this workspace." unless profile && active.include?(profile.employment_id)

          [profile, entry["compensation_access"]]
        end
      end

      def previous_round(value)
        return nil if value.nil?

        previous = @application.hiring_interviews.find(identity(value))
        raise Intake::InvalidInput, "Finish or skip the original round before repeating it." if previous.status == "planned"

        previous
      end

      def panel_snapshot(member, sensitive)
        { "panel_member_id" => member.id, "employment_id" => member.employment_id, "full_name" => member.employment.user.full_name,
          "profile_version" => member.lock_version, "details" => member.details, "compensation_access" => sensitive }
      end

      def grant_access!(record, members)
        record.hiring_access_grants.active.update_all(revoked_at: Time.current)
        members.each do |member, sensitive|
          record.hiring_access_grants.create!(company: @company, hiring_panel_member: member, granted_by: @actor, compensation_access: sensitive)
        end
      end

      def update_round!(record, attributes)
        members = selected_panel(attributes["panel"])
        snapshots = members.map { |member, sensitive| panel_snapshot(member, sensitive) }
        rebooking = record.details.except("hiring_notes") != detail_values(attributes).except("hiring_notes") ||
          record.panel_snapshot.pluck("panel_member_id").sort != snapshots.pluck("panel_member_id").sort
        event = record.panel_snapshot.map { |member| member.slice("panel_member_id", "compensation_access") } ==
          snapshots.map { |member| member.slice("panel_member_id", "compensation_access") } ? "updated" : "reassigned"
        record.assign_attributes(details: detail_values(attributes), panel_snapshot: snapshots)
        raise Intake::InvalidInput, "Change the round or panel before saving." unless record.changed?

        record.save!
        record.close_bookings!(reason: "Round or panel changed. Record a new booking.") if rebooking
        grant_access!(record, members)
        event
      end

      def save_application!
        Audited.audit_class.as_user(@actor) do
          @application.update!(stage: "interview")
          @application.touch if @application.saved_changes.empty?
        end
      end

      def event!(record, action, reason: nil)
        record.events.create!(company: @company, created_by: @actor, action:, interview_version: record.lock_version,
          application_version: @application.lock_version,
          details: { "actor_name" => @actor.full_name, "round" => record.admin_details.deep_stringify_keys, "reason" => reason })
      end
  end
end
