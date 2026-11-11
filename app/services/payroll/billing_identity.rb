# frozen_string_literal: true

class Payroll::BillingIdentity
  VERSION = "miru-consultant-billing-v1"
  PAGE_SIZE = 20

  def initialize(employment, actor: nil)
    @employment, @actor = employment, actor
    @company = employment.company
  end

  def summary(before_id: nil, review_before_id: nil, submission_id: nil)
    authorize!(:show?)
    @employment.with_lock do
      authorize!(:show?)
      summary_data(before_id, review_before_id, submission_id)
    end
  end

  def submit!(facts:, expected_submission_id:, idempotency_key:, pan_evidence: nil, gst_evidence: nil, reuse_pan_evidence: false, reuse_gst_evidence: false)
    authorize!(:record_submission?)
    facts = Payroll::BillingFacts.normalize(facts)
    previous = find_submission(expected_submission_id, blank: true)
    files = Payroll::BillingEvidence.new(facts:, previous:, uploads: { "pan" => pan_evidence, "gst" => gst_evidence },
      reuse: { "pan" => reuse_pan_evidence, "gst" => reuse_gst_evidence })
    command = digest(["submission", expected_submission_id, facts, files.command_files])
    saved = @employment.with_lock { submission_replay_or_validate!(idempotency_key, command, previous) }
    unless saved
      manifest = files.upload!
      saved = @employment.with_lock do
        submission_replay_or_validate!(idempotency_key, command, previous) || submissions.create!(company: @company, employment: @employment, actor: @actor,
          previous_submission: previous, facts:, evidence_manifest: manifest, pan_blob_id: manifest.dig("files", "pan", "blob_id"),
          gst_blob_id: manifest.dig("files", "gst", "blob_id"), source_digest: profile_digest(facts, manifest), command_digest: command, idempotency_key:)
      end
    end
    result = summary
    result.merge(recorded_submission: submission_receipt(saved).merge(current: result.dig(:current_submission, :id) == saved.id.to_s))
  ensure
    files&.cleanup
  end

  def review!(submission_id:, expected_review_id:, decision:, reason:, manual_tax_reviewed:, missing_pan_acknowledged:, idempotency_key:)
    authorize!(:review?)
    submission = find_submission(submission_id)
    previous_id = record_id(expected_review_id, blank: true)
    validate_review_input!(decision, reason, manual_tax_reviewed, missing_pan_acknowledged)
    reason = reason.strip
    command = digest(["review", submission_id, expected_review_id, decision, reason, manual_tax_reviewed, missing_pan_acknowledged])
    saved = @employment.with_lock do
      authorize!(:review?)
      existing = replay(reviews, idempotency_key, command)
      next existing if existing

      raise Payroll::Workflow::Conflict, "Billing identity changed; refresh before reviewing" unless head&.id == submission.id && review_head(submission)&.id == previous_id
      validate_decision!(submission, decision, manual_tax_reviewed, missing_pan_acknowledged)
      reviews.create!(company: @company, employment: @employment, submission:, actor: @actor, previous_review_id: previous_id,
        decision:, reason:, manual_tax_reviewed:, missing_pan_acknowledged:, command_digest: command, idempotency_key:)
    end
    result = summary
    result.merge(recorded_review: review_receipt(saved).merge(current: result.dig(:current_review, :id) == saved.id.to_s))
  end

  def binding
    return unless Payroll::Entitlement.enabled?(@company.id) && kept_subject?
    return unless ActiveRecord::Encryption.config.has_deterministic_key? && ActiveRecord::Encryption.config.deterministic_key.is_a?(String) && ActiveRecord::Encryption.config.deterministic_key.present?
    submission = head
    review = review_head(submission)
    return unless approval_intact?(submission, review)

    { "version" => VERSION, "submission_id" => submission.id.to_s, "review_id" => review.id.to_s,
      "digest" => digest([VERSION, @company.id, @employment.id, submission.id, submission.source_digest, review.id, review.command_digest]) }
  end

  def valid_binding?(value)
    expected = binding
    expected.present? && value.is_a?(Hash) && value == expected
  end

  # Resolve the approved historical receipt, without substituting today's head or
  # requiring its historic reviewer to retain their role/workspace today.
  def frozen_binding!(value, verify_evidence: false)
    raise Payroll::Workflow::Conflict, "Frozen billing receipt is unavailable" unless value.is_a?(Hash) && value["version"] == VERSION

    submission = submissions.find(value.fetch("submission_id"))
    review = reviews.where(submission_id: submission.id).find(value.fetch("review_id"))
    expected = { "version" => VERSION, "submission_id" => submission.id.to_s, "review_id" => review.id.to_s,
      "digest" => digest([VERSION, @company.id, @employment.id, submission.id, submission.source_digest, review.id, review.command_digest]) }
    unless value == expected && approval_intact?(submission, review)
      raise Payroll::Workflow::Conflict, "Frozen billing receipt failed integrity verification"
    end
    Payroll::BillingEvidence.verify!(submission) if verify_evidence
    submission.facts.deep_dup
  rescue KeyError, ActiveRecord::RecordNotFound
    raise Payroll::Workflow::Conflict, "Frozen billing receipt is unavailable", cause: nil
  end

  # A pending review belongs to accounts; request only missing facts or an explicit self-correction.
  def completion_request_source
    return unless Payroll::Entitlement.enabled?(@company.id) && kept_subject?
    submission = head
    return ["missing"] unless submission

    review = review_head(submission)
    return unless review && %w[needs_information rejected].include?(review.decision) && profile_intact?(submission) && review_command_intact?(review)

    [submission.id, submission.source_digest, review.id, review.command_digest]
  end

  def download(submission_id:, kind:)
    authorize!(:show?)
    submission = find_submission(submission_id)
    result = Payroll::BillingEvidence.read!(submission, kind)
    @employment.with_lock do
      authorize!(:show?)
      current = find_submission(submission_id)
      raise Payroll::Workflow::Conflict, "Billing evidence changed or is unavailable" unless current.source_digest == submission.source_digest && Payroll::BillingEvidence.valid?(current)
      result
    end
  end

  private

    def submissions
      ConsultantBillingSubmission.where(company: @company, employment: @employment)
    end

    def reviews
      ConsultantBillingReview.where(company: @company, employment: @employment)
    end

    def head
      submissions.heads.first
    end

    def review_head(submission)
      reviews.heads.find_by(submission_id: submission.id) if submission
    end

    def approval_intact?(submission, review)
      return false unless submission && review&.decision == "approved" && review.manual_tax_reviewed &&
        submission.actor_id == @employment.user_id && review.actor_id != submission.actor_id &&
        submission.facts["gst_status"] != "needs_review" && (submission.facts["pan_status"] != "not_available" || review.missing_pan_acknowledged)

      profile_intact?(submission) && review_command_intact?(review)
    end

    def profile_digest(facts, manifest)
      digest([@company.id, @employment.id, @employment.user_id, facts, manifest])
    end

    def profile_intact?(submission)
      submission.company_id == @company.id && submission.employment_id == @employment.id && submission.actor_id == @employment.user_id &&
        submission.source_digest == profile_digest(submission.facts, submission.evidence_manifest) && Payroll::BillingEvidence.valid?(submission)
    rescue Payroll::Workflow::Conflict
      false
    end

    def require_intact_profile!(submission)
      raise Payroll::Workflow::Conflict, "Billing identity source could not be verified" unless profile_intact?(submission)
      submission
    end

    def review_command_intact?(review)
      command = ["review", review.submission_id.to_s, review.previous_review_id.to_s, review.decision, review.reason, review.manual_tax_reviewed, review.missing_pan_acknowledged]
      review.company_id == @company.id && review.employment_id == @employment.id && review.command_digest == digest(command)
    rescue Payroll::Workflow::Conflict
      false
    end

    def status_for(submission, review)
      return "missing" unless submission
      return "submitted" unless review

      review.decision == "approved" && !approval_intact?(submission, review) ? "submitted" : review.decision
    end

    def kept_subject?
      Employment.kept.exists?(id: @employment.id, company: @company, user_id: @employment.user_id) && User.kept.exists?(id: @employment.user_id)
    end

    def authorize!(operation)
      unless ConsultantBillingIdentityPolicy.new(@actor, @employment).public_send(operation)
        raise Payroll::Workflow::NotAuthorized, "Billing identity requires its consultant or an authorized nonself reviewer in the current workspace"
      end
    end

    def digest(value)
      config = ActiveRecord::Encryption.config
      unless config.has_deterministic_key? && config.deterministic_key.is_a?(String) && config.deterministic_key.present?
        raise Payroll::Workflow::Conflict, "Billing identity source binding is unavailable"
      end
      OpenSSL::HMAC.hexdigest("SHA256", config.deterministic_key, JSON.generate(canonical(value)))
    end

    def canonical(value)
      case value
      when Hash then value.sort.to_h.transform_values { |entry| canonical(entry) }
      when Array then value.map { |entry| canonical(entry) }
      else value
      end
    end

    def record_id(value, blank: false)
      return if blank && value == ""
      unless value.is_a?(String) && value.match?(/\A[1-9]\d{0,18}\z/) && value.to_i <= 9_223_372_036_854_775_807
        raise Payroll::ConsultantReview::InvalidInput, "Use an exact billing identity receipt"
      end
      value.to_i
    end

    def find_submission(id, blank: false)
      parsed = record_id(id, blank:)
      require_intact_profile!(submissions.find(parsed)) if parsed
    end

    def replay(scope, key, command)
      unless key.is_a?(String) && key.length.between?(1, 128)
        raise Payroll::ConsultantReview::InvalidInput, "Use a bounded billing identity command key"
      end
      existing = scope.find_by(idempotency_key: key)
      if existing && (existing.actor_id != @actor.id || existing.command_digest != command)
        raise Payroll::Workflow::Conflict, "Billing identity command was already used differently"
      end
      existing
    end

    def submission_replay_or_validate!(key, command, previous)
      authorize!(:record_submission?)
      existing = replay(submissions, key, command)
      return existing if existing
      authorize!(:submit?)
      raise Payroll::Workflow::Conflict, "Billing identity changed; refresh before submitting" unless head&.id == previous&.id
      nil
    end

    def validate_review_input!(decision, reason, manual, missing)
      unless %w[approved needs_information rejected].include?(decision) && reason.is_a?(String) && reason.strip.length.between?(1, 1000) &&
        !reason.match?(/[\x00-\x1f\x7f]/) && [true, false].include?(manual) && [true, false].include?(missing)
        raise Payroll::ConsultantReview::InvalidInput, "Choose an explicit review decision, acknowledgements and bounded reason"
      end
    end

    def validate_decision!(submission, decision, manual, missing)
      enabled = Payroll::Entitlement.enabled?(@company.id)
      unless enabled || decision != "approved" && review_head(submission)&.decision == "approved"
        raise Payroll::Workflow::NotAuthorized, "Only revocation of existing approval is available while payroll is disabled"
      end
      return unless decision == "approved"
      if !manual || submission.facts["gst_status"] == "needs_review" || submission.facts["pan_status"] == "not_available" && !missing
        raise Payroll::ConsultantReview::InvalidInput, "Approval requires resolved GST facts and explicit manual tax and missing-PAN review where applicable"
      end
      Payroll::BillingEvidence.verify!(submission)
    end

    def summary_data(before_id, review_before_id, selected_id)
      current = head
      selected = selected_id.nil? ? current : find_submission(selected_id)
      page, next_id = page(submissions, before_id)
      history, next_review_id = selected ? page(reviews.where(submission: selected), review_before_id) : [[], nil]
      review = review_head(current)
      reviewer = ConsultantBillingIdentityPolicy.new(@actor, @employment).review?
      enabled = Payroll::Entitlement.enabled?(@company.id)
      { company_id: @company.id, employment_id: @employment.id, user_id: @employment.user_id, consultant_name: @employment.user.full_name,
        status: status_for(current, review), can_submit: ConsultantBillingIdentityPolicy.new(@actor, @employment).submit?,
        can_review: !!(reviewer && current && (enabled || review&.decision == "approved")),
        can_approve: !!(reviewer && enabled && current && current.facts["gst_status"] != "needs_review"),
        current_submission: current && submission_details(current), selected_submission: selected && submission_details(selected), current_review: review && review_receipt(review),
        history: page.map { |entry| submission_receipt(entry).merge(current: entry.id == current&.id) }, next_before_id: next_id,
        review_history: history.map { |entry| review_receipt(entry).merge(current: entry.id == review_head(selected)&.id) }, next_review_before_id: next_review_id }
    end

    def page(scope, cursor)
      if cursor
        id = record_id(cursor)
        raise ActiveRecord::RecordNotFound unless scope.exists?(id:)
        scope = scope.where("id < ?", id)
      end
      rows = scope.order(id: :desc).limit(PAGE_SIZE + 1).to_a
      [rows.first(PAGE_SIZE), rows.size > PAGE_SIZE ? rows[PAGE_SIZE - 1].id.to_s : nil]
    end

    def submission_receipt(entry)
      require_intact_profile!(entry)
      { id: entry.id.to_s, actor_id: entry.actor_id.to_s, previous_submission_id: entry.previous_submission_id&.to_s, created_at: entry.created_at.iso8601(6),
        digest: entry.source_digest, latest_review: review_head(entry)&.then { |review| review_receipt(review) } }
    end

    def submission_details(entry)
      receipt = submission_receipt(entry)
      facts = entry.facts
      masked = facts.merge(%w[pan_number gst_number].index_with { |key| facts[key].present? ? "#{'*' * [facts[key].size - 4, 0].max}#{facts[key].last(4)}" : "" })
      evidence = entry.evidence_manifest.fetch("files").map do |kind, file|
        { kind:, content_type: file["content_type"], byte_size: file["byte_size"],
          download_path: "/api/v1/consultant_billing_identity/submissions/#{entry.id}/evidence/#{kind}" }
      end
      receipt.merge(facts: entry.facts, masked_facts: masked, evidence:)
    end

    def review_receipt(entry)
      { id: entry.id.to_s, submission_id: entry.submission_id.to_s, actor_id: entry.actor_id.to_s, previous_review_id: entry.previous_review_id&.to_s,
        decision: entry.decision, reason: review_command_intact?(entry) ? entry.reason : "Review integrity could not be verified", manual_tax_reviewed: entry.manual_tax_reviewed,
        missing_pan_acknowledged: entry.missing_pan_acknowledged, created_at: entry.created_at.iso8601(6) }
    end
end
