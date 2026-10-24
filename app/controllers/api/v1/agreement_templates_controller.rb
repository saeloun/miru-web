# frozen_string_literal: true

class Api::V1::AgreementTemplatesController < Api::V1::ApplicationController
  include AgreementAuthoring

  def index
    authorize AgreementTemplate
    records, pagination = agreement_page(company_templates.select(*SUMMARY_COLUMNS))
    render json: { agreement_templates: records.map { |record| agreement_metadata(record) }, pagination: }
  end

  def show
    record = company_templates.find(params[:id])
    authorize record
    render json: { agreement_template: details(record) }
  end

  def create
    authorize AgreementTemplate
    attributes = template_params
    return unless current_agreement_workspace?(attributes)

    record = AgreementTemplate.create!(attributes.except(:company_id, :lock_version).merge(company: current_company, created_by: current_user))
    render json: { agreement_template: details(record) }, status: 201
  end

  def update
    record = company_templates.find(params[:id])
    authorize record
    attributes = template_params
    return unless current_agreement_workspace?(attributes)

    update_agreement_record(record, attributes.except(:kind))
    render json: { agreement_template: details(record) }
  end

  def import
    authorize AgreementTemplate, :import?
    attributes = params.expect(agreement_template: {})
    return unless current_agreement_workspace?(attributes)

    fields = attributes[:fields].presence || []
    if fields.is_a?(String)
      return render json: { errors: "Field definitions exceed the import limit" }, status: 422 if fields.bytesize > 64.kilobytes

      fields = JSON.parse(fields)
    end
    preview = Agreements::DocxImport.new(attributes[:file], fields:).process
    render json: { preview: }
  rescue Agreements::DocxImport::Error, JSON::ParserError, JSON::NestingError => error
    message = error.is_a?(Agreements::DocxImport::Error) ? error.message : "Field definitions must contain valid JSON"
    render json: { errors: message }, status: 422
  end

  private

    def company_templates
      AgreementTemplate.where(company: current_company)
    end

    def template_params
      attributes = params.expect(agreement_template: {})
      attributes.permit(:company_id, :title, :kind, :lock_version).to_h.symbolize_keys.tap do |permitted|
        %i[document fields].each do |key|
          permitted[key] = attributes[key].is_a?(ActionController::Parameters) ? attributes[key].to_unsafe_h : attributes[key] if attributes.key?(key)
        end
      end
    end

    def details(record)
      agreement_metadata(record).merge(company_id: record.company_id, document: record.document, fields: record.fields)
    end
end
