# frozen_string_literal: true

class Api::V1::Hiring::MailboxesController < Api::V1::Hiring::BaseController
  rescue_from ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique do
    render json: { errors: "Enter a name and one valid email address. Each inbox address can only be added once." }, status: 422
  end

  def index
    records = current_company.hiring_mailboxes
    query = query_text
    records = records.where("name ILIKE :query OR source_email ILIKE :query", query: "%#{HiringMailbox.sanitize_sql_like(query)}%") if query.present?
    case search_filters[:active]
    when true, "true" then records = records.where(active: true)
    when false, "false" then records = records.where(active: false)
    when nil
    else raise ActionController::BadRequest
    end
    rows, pagination = page_records(records.order(:name, :id))
    render json: { company_id: current_company.id, mailboxes: rows.map { |mailbox| mailbox_details(mailbox) }, pagination: }
  end

  def search
    load_search(%w[active])
    index
  end

  def create
    attributes = mutation_attributes(:hiring_mailbox, %w[company_id name source_email])
    unless attributes["name"].is_a?(String) && attributes["source_email"].is_a?(String)
      raise ::Hiring::Intake::InvalidInput, "Enter an inbox name and one email address."
    end
    mailbox = current_user.with_lock do
      authorize_hiring
      current_company.hiring_mailboxes.create!(attributes.slice("name", "source_email"))
    end
    render json: { company_id: current_company.id, mailbox: mailbox_details(mailbox) }, status: 201
  end

  def update
    attributes = mutation_attributes(:hiring_mailbox, %w[company_id name active lock_version])
    if attributes.key?("name") && !attributes["name"].is_a?(String) ||
        attributes.key?("active") && ![true, false].include?(attributes["active"]) ||
        !attributes["lock_version"].is_a?(Integer) || attributes["lock_version"] < 0
      raise ::Hiring::Intake::InvalidInput, "Enter valid inbox details and reload before saving."
    end
    mailbox = current_company.hiring_mailboxes.find(optional_id(:id))
    current_user.with_lock do
      authorize_hiring
      mailbox.with_lock do
        raise ActiveRecord::StaleObjectError.new(mailbox, "update") unless mailbox.lock_version == attributes["lock_version"]

        mailbox.update!(attributes.slice("name", "active"))
      end
    end
    render json: { company_id: current_company.id, mailbox: mailbox_details(mailbox) }
  end

  private

    def mailbox_details(mailbox)
      mailbox.slice(:id, :name, :source_email, :active, :lock_version).merge(ingress_path: "/hiring/inbound/#{mailbox.routing_key}")
    end
end
