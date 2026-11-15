# frozen_string_literal: true

class Payroll::ConsultantInvoicePreparation
  ACCOUNTS_EMAIL = "accounts@saeloun.com"
  FIELDS = %w[mode billed_entity document_kind treatment treatment_reason timing financial_year series number existing_invoice_considered accounts_destination_confirmed tax_lines].freeze
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

  def self.generation_supported?(billing)
    billing.is_a?(Hash) && billing["gst_status"] == "not_registered"
  end

  def self.invoice_number(facts)
    facts.fetch("mode") == "existing" ? facts.fetch("number") : "#{facts.fetch('series')}/#{facts.fetch('number')}"
  end

  def self.number_digest(facts)
    digest(["consultant_invoice_number_v1", invoice_number(facts).upcase])
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
      existing = check_command!(employment_id, facts, reviewed, expected_preparation_id, idempotency_key, command)
      return existing if existing
      staged = upload(original_pdf) if original_pdf
      verify_blob!(staged, descriptor) if staged
      store_preparation!(employment_id:, facts:, reviewed:, expected_revision_digest:, expected_preparation_id:, idempotency_key:, command:, descriptor:, staged:)
    ensure
      staged&.purge unless staged.nil? || PayrollInvoicePreparation.exists?(original_blob_id: staged.id)
    end
  end

  private

    def check_command!(employment_id, facts, reviewed, expected_preparation_id, idempotency_key, command)
      @run.with_lock do
        employment = @run.company.employments.kept.find(employment_id)
        employment.with_lock do
          authorize!(employment, reviewed:, mode: facts["mode"])
          scope = preparations(employment)
          existing = replay(scope, idempotency_key, command)
          return existing if existing
          ensure_unissued!(employment)
          check_head!(scope, expected_preparation_id)
          nil
        end
      end
    end

    def store_preparation!(employment_id:, facts:, reviewed:, expected_revision_digest:, expected_preparation_id:, idempotency_key:, command:, descriptor:, staged:)
      @run.with_lock do
        employment = @run.company.employments.kept.find(employment_id)
        sources = lock_settlement_sources(employment)
        employment.with_lock do
          authorize!(employment, reviewed:, mode: facts["mode"])
          scope = preparations(employment)
          existing = replay(scope, idempotency_key, command)
          return existing if existing
          ensure_unissued!(employment)
          head = check_head!(scope, expected_preparation_id)
          revision, line = reviewed_source!(employment, facts, reviewed, expected_revision_digest, sources)
          binding, supplemental = billing_binding!(employment, facts, line, reviewed)
          blob = original_blob!(facts["mode"], staged, head)
          frozen = bound_facts(facts, revision, line, binding, supplemental, reviewed, original: descriptor || head&.facts&.fetch("original", nil))
          scope.create!(company: @run.company, payroll_revision: revision, actor: @actor, previous_preparation: head,
            facts: frozen, reviewed:, original_blob: blob, command_digest: command, idempotency_key:)
        end
      end
    end

    def check_head!(scope, expected_preparation_id)
      head = scope.heads.first
      raise Payroll::Workflow::Conflict, "Invoice preparation changed" unless head&.id.to_s == expected_preparation_id.to_s
      head
    end

    def bound_facts(facts, revision, line, binding, supplemental, reviewed, original:)
      frozen = facts.merge("revision_digest" => revision.digest, "line_digest" => Payroll::IndiaHandoff.line_digest(line),
        "billing_identity" => binding, "supplemental_billing" => supplemental, "original" => original)
      frozen["accounts_email"] = ACCOUNTS_EMAIL if reviewed
      frozen
    end

    def reviewed_source!(employment, facts, reviewed, expected_revision_digest, sources)
      revision = @run.current_revision
      raise Payroll::Workflow::Conflict, "Reviewed payroll revision changed" unless revision&.digest == expected_revision_digest
      validate_facts!(facts, reviewed:)
      line = revision&.payroll_payload&.fetch("lines", [])&.find { |entry| entry["employment_id"] == employment.id && entry["pay_type"] == "consultant" }
      currently_approved = Payroll::Workflow.new(@run).status == "approved"
      group, legs, handoff = sources
      historical_credit = !currently_approved && line && Payroll::ConsultantInvoiceIssue.new(@run, employment_id: employment.id).credited_source_for_review?(revision:, line:, group:, legs:, handoff:)
      unless line && Payroll::ConsultantInvoiceIssue.revision_intact?(@run, revision) && (currently_approved || historical_credit)
        raise Payroll::Workflow::Conflict, "An approved consultant revision or intact confirmed historical credit is required"
      end
      invalid! unless facts.dig("billed_entity", "name") == employment.consultant_compensations.find(line.fetch("preparation").fetch("terms_id")).legal_entity_name
      reserve_number!(employment, facts) if reviewed
      [revision, line]
    end

    def billing_binding!(employment, facts, line, reviewed)
      binding = line.dig("preparation", "billing_identity")
      supplemental = binding.nil? && reviewed
      if supplemental
        binding = facts["supplemental_billing_binding"]
        invalid! unless binding && Payroll::BillingIdentity.new(employment).valid_binding?(binding)
      elsif facts.key?("supplemental_billing_binding")
        invalid!
      end
      if reviewed
        billing = Payroll::BillingIdentity.new(employment).frozen_binding!(binding)
        if facts["mode"] == "generate" && !self.class.generation_supported?(billing)
          raise Payroll::ConsultantReview::InvalidInput, "Use an existing invoice: Miru does not generate documents for this GST billing status"
        end
      end
      [binding, supplemental]
    end

    def original_blob!(mode, staged, head)
      blob = staged || (mode == "existing" && head&.original_blob)
      invalid! if mode == "existing" && (!blob || blob.service.public?)
      blob
    end

    def preparations(employment)
      PayrollInvoicePreparation.where(company_id: @run.company_id, payroll_run: @run, employment:)
    end

    def lock_settlement_sources(employment)
      group = PayrollPaymentGroup.where(company_id: @run.company_id, payroll_run: @run, employment:).lock.first
      legs = group ? group.payroll_payment_instructions.order(:id).lock.to_a : []
      handoff = PayrollIndiaHandoff.active.where(company_id: @run.company_id, payroll_run: @run, employment:).lock.first
      [group, legs, handoff]
    end

    def replay(scope, key, command)
      saved = scope.find_by(idempotency_key: key)
      return unless saved
      unless saved.command_digest == command && saved.actor_id == @actor.id
        raise Payroll::Workflow::Conflict, "Preparation command was used differently"
      end
      saved
    end

    def ensure_unissued!(employment)
      if PayrollConsultantInvoice.exists?(company_id: @run.company_id, payroll_run: @run, employment:)
        raise Payroll::Workflow::Conflict, "An immutable invoice already exists for this settlement"
      end
    end

    def reserve_number!(employment, facts)
      lock_id = Digest::SHA256.hexdigest("consultant-invoice-number:#{@run.company_id}:#{employment.user_id}")[0, 15].to_i(16)
      PayrollInvoicePreparation.connection.execute(PayrollInvoicePreparation.sanitize_sql_array(["SELECT pg_advisory_xact_lock(?)", lock_id]))
      digest = self.class.number_digest(facts)
      used = PayrollConsultantInvoice.exists?(company_id: @run.company_id, issuer_id: employment.user_id,
        financial_year: facts.fetch("financial_year"), number_digest: digest)
      reserved = PayrollInvoicePreparation.heads.joins(:employment).where(company_id: @run.company_id, reviewed: true)
        .where(employments: { user_id: employment.user_id }).where.not(payroll_run_id: @run.id, employment_id: employment.id).any? do |receipt|
          receipt.facts["financial_year"] == facts["financial_year"] &&
            self.class.number_digest(receipt.facts) == digest
        end
      raise Payroll::Workflow::Conflict, "This issuer number is already issued or reserved for another run" if used || reserved
    end

    def authorize!(employment, reviewed:, mode:)
      own_original = mode == "existing" && @actor&.id == employment.user_id && User.kept.exists?(id: @actor.id, current_workspace_id: @run.company_id)
      allowed = reviewed ? reviewer?(employment) : configurer?(employment) || own_original
      raise Payroll::Workflow::NotAuthorized, "A current nonself invoice reviewer is required" unless allowed
    end

    def configurer?(employment)
      reviewer?(employment) || @actor && @actor.id != employment.user_id && User.kept.exists?(id: @actor.id, current_workspace_id: @run.company_id) &&
        @run.eligible_actor?(@actor, "accounts") && @actor.roles.where(resource: @run.company, name: %w[owner admin]).exists?
    end

    def validate_facts!(facts, reviewed:)
      extra = facts.is_a?(Hash) && facts["mode"] == "existing" ? ["original_date"] : []
      extra << "supplemental_billing_binding" if facts.is_a?(Hash) && facts.key?("supplemental_billing_binding")
      invalid! unless facts.is_a?(Hash) && facts.keys.sort == (FIELDS + extra).sort && [true, false].include?(reviewed)
      invalid! unless [true, false].include?(facts["accounts_destination_confirmed"]) && (!reviewed || facts["accounts_destination_confirmed"] == true)
      invalid! if extra.include?("supplemental_billing_binding") && (!reviewed || !facts["supplemental_billing_binding"].is_a?(Hash))
      invalid! unless %w[generate existing].include?(facts["mode"])
      validate_entity!(facts["billed_entity"])
      invalid! unless facts["document_kind"] == "consultant_invoice" && facts["treatment"] == "manual_reviewed" &&
        facts["treatment_reason"].is_a?(String) && facts["treatment_reason"].length.between?(1, 1000) &&
        facts["existing_invoice_considered"] == true && facts["tax_lines"] == []
      invalid! unless facts["number"].is_a?(String) && facts["number"].match?(/\A[A-Za-z0-9][A-Za-z0-9\/-]{0,63}\z/) &&
        facts["series"].is_a?(String) && (facts["mode"] == "existing" && facts["series"].empty? || facts["series"].match?(/\A[A-Za-z0-9][A-Za-z0-9\/-]{0,31}\z/))
      validate_timing!(facts)
    rescue Date::Error, TypeError
      invalid!
    end

    def validate_entity!(entity)
      invalid! unless entity.is_a?(Hash) && entity.keys.sort == ENTITY_FIELDS.sort && entity.values.all? { |value| value.is_a?(String) && value.length <= 1000 && !value.match?(/[\x00-\x1f\x7f]/) }
      invalid! unless %w[name address country].all? { |key| entity[key].present? } && EmployeeRecord.supported_country?(entity["country"]) && (entity["tax_identifier"].present? || entity["tax_reason"].present?)
    end

    def validate_timing!(facts)
      if facts["mode"] == "generate"
        invalid! unless facts["timing"] == "post_credit_supported" && facts["financial_year"] == self.class.financial_year
      else
        date = Date.iso8601(facts["original_date"])
        if date > Time.current.in_time_zone("Asia/Kolkata").to_date
          raise Payroll::ConsultantReview::InvalidInput, "Original invoice date is in the future"
        end
        invalid! unless facts["original_date"].match?(/\A\d{4}-\d{2}-\d{2}\z/) && facts["financial_year"] == self.class.financial_year(date) && facts["timing"] == "existing_invoice"
      end
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
