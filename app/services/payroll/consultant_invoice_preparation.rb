# frozen_string_literal: true

class Payroll::ConsultantInvoicePreparation
  ACCOUNTS_EMAIL = "accounts@saeloun.com"
  FIELDS = %w[mode billed_entity document_kind treatment treatment_reason timing financial_year series number existing_invoice_considered tax_lines].freeze
  ENTITY_FIELDS = %w[name address country tax_identifier tax_reason].freeze

  def initialize(run, actor:)
    @run, @actor = run, actor
  end

  def self.digest(value)
    key = ActiveRecord::Encryption.config.deterministic_key
    raise ActiveRecord::Encryption::Errors::Configuration, "Stable invoice key is required" unless key.is_a?(String) && key.present?

    OpenSSL::HMAC.hexdigest("SHA256", key, JSON.generate(Payroll::IndiaHandoff.send(:canonical, value)))
  end

  def self.financial_year(date = Time.current.in_time_zone("Asia/Kolkata").to_date)
    first = date.month >= 4 ? date.year : date.year - 1
    "#{first}-#{first + 1}"
  end

  def reviewer?(employment)
    return false unless @actor && @actor.id != employment.user_id &&
      User.kept.exists?(id: @actor.id, current_workspace_id: @run.company_id) && @run.eligible_actor?(@actor, "accounts")

    @actor.id == @run.accounts_reviewer_id || @actor.has_role?(:owner, @run.company)
  end

  def record!(employment_id:, facts:, expected_revision_digest:, expected_preparation_id:, idempotency_key:, original_pdf: nil, reviewed: true)
    Payroll::Entitlement.require!(@run.company_id)
    validate_facts!(facts, reviewed:)
    invalid! if original_pdf && facts["mode"] != "existing"
    invalid! unless idempotency_key.is_a?(String) && idempotency_key.length.between?(1, 128)
    descriptor = original_pdf && pdf_descriptor(original_pdf)
    command = self.class.digest([facts, expected_revision_digest, expected_preparation_id.to_s, descriptor, reviewed])
    staged = nil
    begin
      @run.with_lock do
        employment = @run.company.employments.kept.find(employment_id)
        employment.with_lock do
          authorize!(employment, reviewed:, mode: facts["mode"])
          existing = preparations(employment).find_by(idempotency_key:)
          if existing
            raise Payroll::Workflow::Conflict, "Preparation command was used differently" unless existing.command_digest == command && existing.actor_id == @actor.id
            return existing
          end
          head = preparations(employment).heads.first
          raise Payroll::Workflow::Conflict, "Invoice preparation changed" unless head&.id.to_s == expected_preparation_id.to_s
        end
      end
      staged = upload(original_pdf) if original_pdf
      verify_blob!(staged, descriptor) if staged
      @run.with_lock do
        employment = @run.company.employments.kept.find(employment_id)
        employment.with_lock do
          authorize!(employment, reviewed:, mode: facts["mode"])
          scope = preparations(employment)
          head = scope.heads.first
          raise Payroll::Workflow::Conflict, "Invoice preparation changed" unless head&.id.to_s == expected_preparation_id.to_s
          revision = @run.current_revision
          raise Payroll::Workflow::Conflict, "Reviewed payroll revision changed" unless revision&.digest == expected_revision_digest
          validate_facts!(facts, reviewed:)
          line = revision&.payroll_payload&.fetch("lines", [])&.find { |entry| entry["employment_id"] == employment.id && entry["pay_type"] == "consultant" }
          raise Payroll::Workflow::Conflict, "An approved consultant revision is required" unless line && Payroll::Workflow.new(@run).status == "approved"
          invalid! unless facts.dig("billed_entity", "name") == employment.consultant_compensations.find(line.fetch("preparation").fetch("terms_id")).legal_entity_name
          blob = staged || (facts["mode"] == "existing" && head&.original_blob)
          invalid! if facts["mode"] == "existing" && (!blob || blob.service.public?)
          frozen = facts.merge("revision_digest" => revision.digest, "line_digest" => Payroll::IndiaHandoff.line_digest(line),
            "billing_identity" => line.dig("preparation", "billing_identity"), "original" => descriptor || head&.facts&.fetch("original", nil))
          scope.create!(company: @run.company, payroll_revision: revision, actor: @actor, previous_preparation: head,
            facts: frozen, reviewed:, original_blob: blob, command_digest: command, idempotency_key:)
        end
      end
    ensure
      staged&.purge unless staged.nil? || PayrollInvoicePreparation.exists?(original_blob_id: staged.id)
    end
  end

  private

    def preparations(employment)
      PayrollInvoicePreparation.where(company_id: @run.company_id, payroll_run: @run, employment:)
    end

    def authorize!(employment, reviewed:, mode:)
      own_original = mode == "existing" && @actor&.id == employment.user_id && User.kept.exists?(id: @actor.id, current_workspace_id: @run.company_id)
      allowed = reviewed ? reviewer?(employment) : configurer?(employment) || own_original
      raise Payroll::Workflow::NotAuthorized, "A current nonself invoice reviewer is required" unless allowed
    end

    def configurer?(employment)
      @actor && @actor.id != employment.user_id && User.kept.exists?(id: @actor.id, current_workspace_id: @run.company_id) &&
        @run.eligible_actor?(@actor, "accounts") && @actor.roles.where(resource: @run.company, name: %w[owner admin]).exists?
    end

    def validate_facts!(facts, reviewed:)
      extra = facts.is_a?(Hash) && facts["mode"] == "existing" ? ["original_date"] : []
      invalid! unless facts.is_a?(Hash) && facts.keys.sort == (FIELDS + extra).sort && [true, false].include?(reviewed)
      invalid! unless %w[generate existing].include?(facts["mode"])
      entity = facts["billed_entity"]
      invalid! unless entity.is_a?(Hash) && entity.keys.sort == ENTITY_FIELDS.sort && entity.values.all? { |value| value.is_a?(String) && value.length <= 1000 && !value.match?(/[\x00-\x1f\x7f]/) }
      invalid! unless %w[name address country].all? { |key| entity[key].present? } && EmployeeRecord.supported_country?(entity["country"]) && (entity["tax_identifier"].present? || entity["tax_reason"].present?)
      invalid! unless facts["document_kind"] == "consultant_invoice" && facts["treatment"] == "manual_reviewed" &&
        facts["treatment_reason"].is_a?(String) && facts["treatment_reason"].length.between?(1, 1000) &&
        facts["existing_invoice_considered"] == true && facts["tax_lines"] == []
      invalid! unless facts["number"].is_a?(String) && facts["number"].match?(/\A[A-Za-z0-9][A-Za-z0-9\/-]{0,63}\z/) &&
        facts["series"].is_a?(String) && facts["series"].match?(/\A[A-Za-z0-9][A-Za-z0-9\/-]{0,31}\z/)
      if facts["mode"] == "generate"
        invalid! unless facts["timing"] == "post_credit_supported" && facts["financial_year"] == self.class.financial_year
      else
        date = Date.iso8601(facts["original_date"])
        invalid! unless facts["original_date"].match?(/\A\d{4}-\d{2}-\d{2}\z/) && facts["financial_year"] == self.class.financial_year(date) && facts["timing"] == "existing_invoice"
      end
    rescue Date::Error, TypeError
      invalid!
    end

    def pdf_descriptor(upload)
      invalid! unless upload.is_a?(ActionDispatch::Http::UploadedFile)
      info = Signatures::PdfInfo.new(upload.tempfile.path).process
      { "sha256" => info.fetch("sha256"), "byte_size" => File.size(upload.tempfile.path), "content_type" => "application/pdf" }
    rescue Signatures::PdfInfo::InvalidDocument
      invalid!
    end

    def upload(file)
      file.rewind
      blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: "consultant-original.pdf", content_type: "application/pdf")
      invalid! if blob.service.public?
      blob
    rescue StandardError
      blob&.purge
      raise
    end

    def verify_blob!(blob, descriptor)
      digest = Digest::SHA256.new
      size = 0
      blob.download do |chunk|
        size += chunk.bytesize
        raise Payroll::Workflow::Conflict, "Original invoice bytes changed" if size > descriptor.fetch("byte_size")
        digest.update(chunk)
      end
      unless size == descriptor.fetch("byte_size") && digest.hexdigest == descriptor.fetch("sha256")
        raise Payroll::Workflow::Conflict, "Original invoice bytes changed"
      end
    end

    def invalid!
      raise Payroll::ConsultantReview::InvalidInput, "Review explicit invoice mode, entity, document treatment, timing and issuer numbering; unsupported tax cases require an existing invoice"
    end
end
