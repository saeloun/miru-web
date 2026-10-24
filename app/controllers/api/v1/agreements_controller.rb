# frozen_string_literal: true

class Api::V1::AgreementsController < Api::V1::ApplicationController
  include AgreementAuthoring

  def index
    authorize Agreement
    records, pagination = agreement_page(company_agreements.select(*SUMMARY_COLUMNS,
      :status, :client_id, :employment_id, :agreement_template_id, :source_template_version))
    render json: { agreements: records.map { |record| metadata(record) }, pagination: }
  end

  def show
    record = company_agreements.find(params[:id])
    authorize record
    render json: { agreement: details(record) }
  end

  def parties
    authorize Agreement, :index?
    kind = params[:kind]
    query = params[:query] || ""
    unless %w[client consultant].include?(kind) && query.is_a?(String) && query.length <= 100
      return render json: { errors: "Choose a client or consultant and use at most 100 search characters" }, status: 400
    end
    pattern = "%#{ActiveRecord::Base.sanitize_sql_like(query)}%"
    records = if kind == "client"
      current_company.clients.kept.where("name ILIKE :query OR legal_name ILIKE :query", query: pattern)
    else
      current_company.employments.kept.joins(:user).merge(User.kept).includes(:user)
        .where("concat_ws(' ', users.first_name, users.last_name) ILIKE :query OR users.email ILIKE :query OR employments.employee_id ILIKE :query", query: pattern)
    end
    page, pagination = agreement_page(records)
    parties = page.map do |record|
      if kind == "client"
        { id: record.id, name: record.legal_name.presence || record.name, email: record.email }
      else
        { id: record.id, name: record.user.full_name, email: record.user.email,
          employment_type: record.employment_type, employee_id: record.employee_id }
      end
    end
    render json: { parties:, pagination: }
  end

  def create
    authorize Agreement
    attributes = agreement_params
    return unless current_agreement_workspace?(attributes)

    template = AgreementTemplate.where(company: current_company).find(attributes[:agreement_template_id])
    client = current_company.clients.kept.find(attributes[:client_id]) if attributes[:client_id].present?
    employment = current_company.employments.kept.find(attributes[:employment_id]) if attributes[:employment_id].present?
    party = client || employment&.user
    values = identity_values(party, employment).slice(*template.fields.pluck("key"))
    unless attributes.fetch(:field_values, {}).is_a?(Hash)
      return render json: { errors: "Field values must be an object" }, status: 422
    end
    record = template.build_agreement(created_by: current_user, client:, employment:, title: attributes[:title],
      field_values: values.merge(attributes.fetch(:field_values, {})))
    record.save!
    render json: { agreement: details(record) }, status: 201
  end

  def update
    record = company_agreements.find(params[:id])
    authorize record
    attributes = agreement_params.slice(:company_id, :lock_version, :title, :document, :fields, :field_values)
    return unless current_agreement_workspace?(attributes)

    update_agreement_record(record, attributes)
    render json: { agreement: details(record) }
  end

  def download
    record = company_agreements.find(params[:id])
    authorize record
    html = Agreements::DocumentHtml.new(record.document, fields: record.fields, values: record.field_values).process
    pdf = PdfGeneration::HtmlTemplateService.new("agreements/draft", layout: false,
      locals: { title: record.title, body_html: html }).process
    record.audits.create!(action: "download", user: current_user, associated: current_company, audited_changes: {})
    response.headers["X-Content-Type-Options"] = "nosniff"
    send_data pdf, filename: "agreement-#{record.id}-draft.pdf", type: "application/pdf", disposition: "attachment"
  end

  private

    def company_agreements
      Agreement.where(company: current_company)
    end

    def agreement_params
      attributes = params.expect(agreement: {})
      attributes.permit(:company_id, :title, :agreement_template_id, :client_id, :employment_id, :lock_version)
        .to_h.symbolize_keys.tap do |permitted|
        %i[document fields field_values].each do |key|
          permitted[key] = attributes[key].is_a?(ActionController::Parameters) ? attributes[key].to_unsafe_h : attributes[key] if attributes.key?(key)
        end
      end
    end

    def identity_values(party, employment)
      values = { "company_name" => current_company.name, "company_address" => current_company.current_address&.formatted_address,
        "legal_name" => party.is_a?(Client) ? party.legal_name.presence || party.name : party&.full_name,
        "joined_on" => employment&.joined_at&.iso8601 }
      if party.is_a?(Client)
        values.merge!("primary_email" => party.email, "finance_email" => party.finance_email,
          "signatory_name" => party.signatory_name, "signatory_email" => party.signatory_email,
          "signatory_designation" => party.signatory_designation, "registered_address" => party.current_address&.formatted_address)
      elsif party
        values["consultant_address"] = party.addresses.find_by(address_type: "current")&.formatted_address
      end
      values.compact
    end

    def metadata(record)
      agreement_metadata(record).merge(record.slice(:status, :client_id, :employment_id, :agreement_template_id, :source_template_version))
    end

    def details(record)
      metadata(record).merge(company_id: record.company_id, document: record.document, fields: record.fields,
        field_values: record.field_values,
        missing_required_keys: Agreements::Document.new(record.document, fields: record.fields, values: record.field_values).missing_required_keys)
    end
end
