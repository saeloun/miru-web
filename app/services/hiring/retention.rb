# frozen_string_literal: true

module Hiring
  class Retention
    class CleanupUnavailable < Intake::Conflict; end

    def self.sweep
      result = { deleted: 0, skipped: 0 }
      HiringSetting.where.not(approved_at: nil).find_each do |setting|
        next unless setting.details["retention_enabled"] == true && setting.approved?

        setting.company.hiring_applications.where(stage: HiringPortalAccess::CLOSED_STAGES)
          .where("updated_at <= ?", setting.details.fetch("retention_days").days.ago).find_each do |application|
          new(application:, actor: setting.approved_by).delete!(attributes: {
            "company_id" => setting.company_id, "application_version" => application.lock_version }, approved_setting_version: setting.lock_version)
          result[:deleted] += 1
        rescue CleanupUnavailable
          raise
        rescue Intake::Conflict, Pundit::NotAuthorizedError, ActiveRecord::RecordNotFound
          result[:skipped] += 1
        end
      end
      result
    end

    def initialize(application:, actor:)
      @application, @actor = application, actor
      @company = application.company
    end

    def review!
      with_application do
        messages, receipts = load_records!
        { company_id: @company.id, application_version: @application.lock_version, retention: {
          private_records: @records.size, source_emails: receipts.size, attachments: file_attachments(@records).size,
          employee_records_preserved: true, legal_documents_preserved: true, blocked_reason: delivery_block(messages) } }
      end
    end

    def delete!(attributes:, approved_setting_version: nil)
      unless attributes.is_a?(Hash) && attributes.keys.sort == %w[application_version company_id]
        raise Intake::InvalidInput, "Review the application before deleting its hiring data."
      end
      with_application(approved_setting_version:) do
        raise Intake::WorkspaceChanged, "The hiring workspace changed. Reload the current workspace." unless attributes["company_id"] == @company.id

        unless attributes["application_version"].is_a?(Integer) && attributes["application_version"] == @application.lock_version
          raise Intake::Conflict, "The application changed. Review it again before deleting."
        end
        messages, receipts = load_records!
        reason = delivery_block(messages)
        raise Intake::Conflict, reason if reason

        inbound = exclusive_sources!(receipts)
        candidate = @application.hiring_candidate
        candidate.lock!("FOR UPDATE NOWAIT")
        scheduled_policy!(approved_setting_version, candidate) unless approved_setting_version.nil?
        detach_files!(@records + inbound)
        receipts.each(&:destroy!)
        messages.reverse_each(&:destroy!)
        @application.destroy!
        inbound.each(&:destroy!)
        unless HiringApplication.unscoped.where(hiring_candidate_id: candidate.id).exists?
          candidate.destroy!
          @records << candidate
        end
        remove_audits!
        @company.audits.create!(user: @actor, associated: @company, action: "hiring_application_deleted", audited_changes: {})
      end
      { deleted: true }
    rescue ActiveJob::EnqueueError, SolidQueue::Job::EnqueueError
      raise CleanupUnavailable, "Private file cleanup could not be queued. Try deleting again."
    end

    private

      def with_application(approved_setting_version: nil)
        @actor.with_lock do
          authorized = if approved_setting_version.nil?
            @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, @application).update?
          else
            HiringPolicy.administrators(@company).where(user_id: @actor.id).exists?
          end
          raise Pundit::NotAuthorizedError unless authorized

          @company.with_lock("FOR NO KEY UPDATE") do
            @application.lock!("FOR UPDATE NOWAIT")
            raise Pundit::NotAuthorizedError unless @application.company_id == @company.id

            yield
          end
        end
      rescue ActiveRecord::LockWaitTimeout, ActiveRecord::Deadlocked
        raise Intake::Conflict, "Hiring data is being updated. Reload before deleting."
      end

      def load_records!
        @records = []
        collect!(@application)
        [lock!(HiringMessage.where(company: @company, hiring_application: @application)),
          lock!(HiringReceipt.where(company: @company, hiring_application: @application))]
      end

      def delivery_block(messages)
        if messages.any? { |message| %w[sending uncertain].include?(message.state) }
          "Reconcile unknown delivery and stop any sending worker before deleting hiring data."
        end
      end

      def scheduled_policy!(version, candidate)
        setting = HiringSetting.find_by(company_id: @company.id)
        unless setting && setting.lock_version == version && setting.approved? && setting.approved_by_id == @actor.id && setting.details["retention_enabled"] == true
          raise Intake::Conflict, "The approved retention policy changed."
        end
        timestamps = (@records + [candidate]).flat_map { |record| [record.created_at, record.updated_at] }
        timestamps.concat(file_attachments(@records).map(&:created_at))
        @records.group_by(&:class).each do |type, records|
          timestamps << Audited.audit_class.where(associated: @company, auditable_type: type.base_class.name, auditable_id: records.map(&:id)).maximum(:created_at)
        end
        unless HiringPortalAccess::CLOSED_STAGES.include?(@application.stage) && timestamps.compact.max <= setting.details.fetch("retention_days").days.ago
          raise Intake::Conflict, "This application has recent or ongoing hiring activity."
        end
      end

      def lock!(scope)
        scope.order(:id).lock("FOR UPDATE NOWAIT").to_a.tap { |records| @records.concat(records) }
      end

      def collect!(record)
        return if @records.any? { |item| item.class == record.class && item.id == record.id }

        @records << record
        record.class.reflect_on_all_associations.each do |association|
          next unless association.options[:dependent] == :destroy && !association.klass.name.start_with?("ActiveStorage::")

          children = record.association(association.name).scope.order(:id).lock("FOR UPDATE NOWAIT").to_a
          children.each { |child| collect!(child) }
        end
      end

      def exclusive_sources!(receipts)
        receipts.map(&:source_checksum).uniq.sort.each do |checksum|
          available = ApplicationRecord.connection.select_value("SELECT pg_try_advisory_xact_lock(#{checksum.first(15).to_i(16)})")
          raise Intake::Conflict, "Hiring sources are being updated. Reload before deleting." unless available
        end
        ids = receipts.map(&:id)
        receipts.filter_map(&:inbound_email_id).uniq.sort.filter_map do |id|
          next if HiringReceipt.where(inbound_email_id: id).where.not(id: ids).exists?

          ActionMailbox::InboundEmail.lock("FOR UPDATE NOWAIT").find_by(id:)
        end
      end

      def file_attachments(records, lock: false)
        records.group_by(&:class).flat_map do |type, rows|
          scope = ActiveStorage::Attachment.where(record_type: type.polymorphic_name, record_id: rows.map(&:id)).order(:id)
          (lock ? scope.lock("FOR UPDATE NOWAIT") : scope).to_a
        end
      end

      def detach_files!(records)
        attachments = file_attachments(records, lock: true)
        blobs = ActiveStorage::Blob.where(id: attachments.map(&:blob_id)).to_a
        ActiveStorage::Attachment.where(id: attachments.map(&:id)).delete_all
        # The queue shares the transaction; Blob#purge preserves files still attached elsewhere.
        blobs.each do |blob|
          job = blob.purge_later
          raise ActiveJob::EnqueueError unless job && job.successfully_enqueued?
        end
      end

      def remove_audits!
        @records.group_by(&:class).each do |type, records|
          Audited.audit_class.where(associated: @company, auditable_type: type.base_class.name, auditable_id: records.map(&:id)).delete_all
        end
      end
  end
end
