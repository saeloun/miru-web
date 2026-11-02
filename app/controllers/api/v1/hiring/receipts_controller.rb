# frozen_string_literal: true

class Api::V1::Hiring::ReceiptsController < Api::V1::Hiring::BaseController
  rescue_from ::Hiring::ReceiveEmail::InvalidInput, ::Hiring::EmailContent::Malformed do
    render json: { errors: "Provide a valid email file of at most 20 MB." }, status: 422
  end
  rescue_from ::Hiring::ReceiveEmail::Unavailable do |error|
    render json: { errors: error.message }, status: 503
  end
  rescue_from ActiveStorage::FileNotFoundError do
    render json: { errors: "The retained email is unavailable." }, status: 404
  end

  def index
    records = current_company.hiring_receipts.includes(:hiring_mailbox, :reviewed_by)
    if params[:state]
      raise ActionController::BadRequest unless %w[pending review accepted dismissed].include?(params[:state])

      records = records.where(state: params[:state])
    end
    records = records.where(hiring_mailbox_id: optional_id(:mailbox_id)) if params[:mailbox_id]
    records = records.where(hiring_application_id: optional_id(:application_id)) if params[:application_id]
    rows, pagination = page_records(records.order(received_at: :desc, id: :desc))
    render json: { company_id: current_company.id, receipts: rows.map { |record| receipt_summary(record) },
      pagination:, time_zone: company_time_zone.tzinfo.name }
  end

  def show
    render_receipt(find_receipt)
  end

  def create
    attributes = mutation_attributes(:hiring_receipt, %w[company_id mailbox_id file])
    file, mailbox_id = attributes.values_at("file", "mailbox_id")
    unless file.is_a?(ActionDispatch::Http::UploadedFile) &&
        (mailbox_id.is_a?(String) || mailbox_id.is_a?(Integer)) && mailbox_id.to_s.match?(/\A[1-9]\d{0,18}\z/)
      raise ::Hiring::Intake::InvalidInput, "Choose an inbox and an email file."
    end
    return head(413) if file.size > ::Hiring::ReceiveEmail::MAX_BYTES

    receipt = current_user.with_lock do
      authorize_hiring
      mailbox = current_company.hiring_mailboxes.where(active: true).find(mailbox_id)
      ::Hiring::ReceiveEmail.new(mailbox:, source: file.read(::Hiring::ReceiveEmail::MAX_BYTES + 1)).process
    end
    render_receipt(receipt, status: 202)
  end

  def accept
    attributes = mutation_attributes(:hiring_receipt, %w[company_id lock_version full_name email application_id acknowledge])
    receipt = find_receipt
    review(receipt).accept!(full_name: attributes["full_name"], email: attributes["email"], lock_version: attributes["lock_version"],
      application_id: attributes["application_id"], acknowledge: attributes.fetch("acknowledge", false))
    render_receipt(receipt)
  end

  def dismiss
    attributes = mutation_attributes(:hiring_receipt, %w[company_id lock_version])
    receipt = find_receipt
    review(receipt).dismiss!(lock_version: attributes["lock_version"])
    render_receipt(receipt)
  end

  def reprocess
    attributes = mutation_attributes(:hiring_receipt, %w[company_id lock_version])
    receipt = find_receipt
    review(receipt).retry_processing!(lock_version: attributes["lock_version"])
    render_receipt(receipt, status: 202)
  end

  def acknowledgement
    attributes = mutation_attributes(:hiring_message, %w[company_id lock_version approved_setting_version recipient])
    receipt = find_receipt
    acknowledgement_service(receipt).queue_existing!(
      lock_version: attributes["lock_version"], approved_setting_version: attributes["approved_setting_version"], recipient: attributes["recipient"])
    render_receipt(receipt, status: 202)
  end

  def retry_acknowledgement
    attributes = mutation_attributes(:hiring_message, %w[company_id lock_version message_lock_version approved_setting_version recipient])
    receipt = find_receipt
    acknowledgement_service(receipt).retry!(message: find_message(receipt), message_lock_version: attributes["message_lock_version"],
      lock_version: attributes["lock_version"], approved_setting_version: attributes["approved_setting_version"], recipient: attributes["recipient"])
    render_receipt(receipt, status: 202)
  end

  def reconcile_acknowledgement
    attributes = mutation_attributes(:hiring_message, %w[company_id lock_version outcome evidence worker_stopped])
    receipt = find_receipt
    acknowledgement_service(receipt).reconcile!(message: find_message(receipt), lock_version: attributes["lock_version"],
      outcome: attributes["outcome"], evidence: attributes["evidence"], worker_stopped: attributes["worker_stopped"])
    render_receipt(receipt)
  end

  def source
    receipt = find_receipt
    download(receipt, receipt.source, "hiring-email-#{receipt.id}.eml", "source_download")
  end

  def attachment
    receipt = find_receipt
    index = params[:attachment_index]
    raise ActionController::BadRequest unless index.is_a?(String) && index.match?(/\A(?:0|[1-9]\d{0,2})\z/)

    file = ::Hiring::EmailContent.new(receipt.source).attachments[index.to_i]
    raise ActiveRecord::RecordNotFound unless file
    raise ::Hiring::Intake::InvalidInput, "Download the original email to inspect an attachment larger than 10 MB." if file.fetch("bytes") > 10.megabytes

    download(receipt, file.fetch("data"), file.fetch("filename"), "attachment_download", attachment_index: index.to_i)
  end

  private

    def find_receipt = current_company.hiring_receipts.includes(:hiring_mailbox, :reviewed_by).find(optional_id(:id))

    def review(receipt) = ::Hiring::ReviewReceipt.new(company: current_company, actor: current_user, receipt:)

    def acknowledgement_service(receipt) = ::Hiring::Acknowledgement.new(receipt:, actor: current_user)

    def find_message(receipt)
      current_company.hiring_messages.where(hiring_application_id: receipt.hiring_application_id).find(optional_id(:message_id))
    end

    def receipt_summary(receipt)
      receipt.slice(:id, :state, :review_reason, :received_at, :reviewed_at, :lock_version).merge(
        application_id: receipt.hiring_application_id, subject: receipt.details["subject"],
        reviewed_by: receipt.reviewed_by && { id: receipt.reviewed_by_id, name: receipt.reviewed_by.full_name },
        mailbox: { id: receipt.hiring_mailbox_id, name: receipt.details["source_name"], source_email: receipt.details["source_email"] })
    end

    def render_receipt(receipt, status: 200)
      details = receipt.details.slice("email", "full_name", "original_date", "text", "text_truncated", "reviewed_identity", "reviewed_reason")
      files = Array(receipt.details["attachments"]).each_with_index.map { |file, index| file.slice("filename", "content_type", "bytes").merge(index:) }
      messages = current_company.hiring_messages.where(hiring_application_id: receipt.hiring_application_id)
        .includes(:queued_by, :resolved_by, audits: :user).order(:id) if receipt.hiring_application_id
      render json: { company_id: current_company.id, receipt: receipt_summary(receipt).merge(details).merge(attachments: files),
        application: receipt.hiring_application && application_details(receipt.hiring_application), time_zone: company_time_zone.tzinfo.name,
        messages: Array(messages).map { |message| message_details(message) } }, status:
    end

    def message_details(message)
      message.slice(:id, :kind, :state, :error_code, :enqueued_at, :started_at, :sent_at, :created_at, :lock_version,
        :attempt_number, :original_message_id, :approved_setting_version, :resolution, :resolved_at).merge(
          content: message.content.slice("to", "reply_to", "subject", "body"), automatic: message.content["actor_id"].nil?, retryable: message.retryable?,
          queued_by: message.queued_by && { id: message.queued_by_id, name: message.queued_by.full_name },
          resolved_by: message.resolved_by && { id: message.resolved_by_id, name: message.resolved_by.full_name },
          resolution_details: message.resolution_details&.slice("evidence", "worker_stopped"),
          events: message.audits.sort_by(&:id).map do |event|
            { id: event.id, action: event.action, created_at: event.created_at, actor_id: event.user_id,
              actor: event.user && { id: event.user.id, name: event.user.full_name },
              changes: event.audited_changes.slice("state", "error_code", "resolution", "resolved_by_id") }
          end)
    end

    def download(receipt, data, filename, action, **changes)
      receipt.audits.create!(associated: current_company, user: current_user, action:, audited_changes: changes)
      response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
      response.headers["Referrer-Policy"] = "no-referrer"
      send_data data, filename:, type: "application/octet-stream", disposition: "attachment"
    end
end
