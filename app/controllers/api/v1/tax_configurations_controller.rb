# frozen_string_literal: true

class Api::V1::TaxConfigurationsController < Api::V1::ApplicationController
  def index
    authorize TaxConfiguration

    render json: { tax_configurations: current_company.tax_configurations.ordered.map { |tax| serialize(tax) } }
  end

  def create
    authorize TaxConfiguration

    tax_configuration = current_company.tax_configurations.create!(tax_configuration_params)
    render json: { tax_configuration: serialize(tax_configuration), notice: I18n.t("tax_configurations.create.success") }, status: 201
  end

  def update
    authorize tax_configuration

    tax_configuration.update!(tax_configuration_params)
    render json: { tax_configuration: serialize(tax_configuration), notice: I18n.t("tax_configurations.update.success") }
  end

  def destroy
    authorize tax_configuration

    tax_configuration.discard!
    render json: { notice: I18n.t("tax_configurations.destroy.success") }
  end

  private

    def tax_configuration
      @_tax_configuration ||= current_company.tax_configurations.find(params[:id])
    end

    def tax_configuration_params
      params.require(:tax_configuration).permit(:name, :calculation_method, :value)
    end

    def serialize(tax_configuration)
      {
        id: tax_configuration.id,
        name: tax_configuration.name,
        calculation_method: tax_configuration.calculation_method,
        calculationMethod: tax_configuration.calculation_method,
        value: tax_configuration.value.to_f
      }
    end
end
