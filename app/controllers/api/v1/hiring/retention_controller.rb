# frozen_string_literal: true

class Api::V1::Hiring::RetentionController < Api::V1::Hiring::BaseController
  def show
    render json: retention.review!
  end

  def destroy
    attributes = mutation_attributes(:hiring_retention, %w[company_id application_version confirmation])
    unless attributes.keys.sort == %w[application_version company_id confirmation] && attributes["confirmation"] == true
      raise ::Hiring::Intake::InvalidInput, "Explicitly confirm permanent deletion of this application's private hiring data."
    end
    render json: { company_id: current_company.id }.merge(retention.delete!(attributes: attributes.except("confirmation")))
  end

  private

    def application = @application ||= current_company.hiring_applications.find(optional_id(:application_id))

    def retention = @retention ||= ::Hiring::Retention.new(application:, actor: current_user)
end
