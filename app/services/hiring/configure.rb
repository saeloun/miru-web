# frozen_string_literal: true

module Hiring
  class Configure
    def initialize(company:, actor:)
      @company, @actor = company, actor
    end

    def save_draft!(details:, lock_version:)
      raise Intake::InvalidInput, "Enter valid hiring email settings." unless details.is_a?(Hash)

      with_setting(lock_version:) do |setting|
        fields = HiringSetting::TEXT_FIELDS + ["client_count"]
        values = fields.index_with(nil).merge(details.transform_keys(&:to_s))
        setting.details = values.transform_values { |value| value.is_a?(String) ? value.strip : value }
        if setting.changed?
          setting.audit_comment = "Saved hiring email configuration."
          Audited.audit_class.as_user(@actor) { setting.save! }
        end
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Use text fields, a non-negative client count and a subject without control characters."
    end

    def approve!(lock_version:)
      with_setting(lock_version:) do |setting|
        unless setting.persisted? && setting.complete?
          raise Intake::InvalidInput, "Complete the company introduction, client count and hiring terms before approving."
        end

        setting.assign_attributes(approved_at: Time.current, approved_by: @actor)
        setting.audit_comment = "Approved hiring email configuration."
        Audited.audit_class.as_user(@actor) { setting.save! }
      end
    end

    private

      def with_setting(lock_version:)
        unless lock_version.nil? || lock_version.is_a?(Integer) && lock_version >= 0
          raise Intake::InvalidInput, "Reload the hiring settings before saving."
        end
        @actor.with_lock do
          unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, HiringApplication).create?
            raise Pundit::NotAuthorizedError
          end
          @company.with_lock do
            setting = @company.hiring_setting || @company.build_hiring_setting
            expected = setting.persisted? ? setting.lock_version : nil
            raise Intake::Conflict, "The hiring settings changed. Reload before saving." unless lock_version == expected

            yield setting
            setting
          end
        end
      end
  end
end
