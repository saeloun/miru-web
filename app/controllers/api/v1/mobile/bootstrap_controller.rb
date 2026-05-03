# frozen_string_literal: true

class Api::V1::Mobile::BootstrapController < Api::V1::ApplicationController
  include AuthResponsePayload

  skip_after_action :verify_authorized

  def show
    render json: authenticated_user_payload(current_user, company: current_company).merge(
      capabilities:,
      collection_settings: collection_settings_payload,
      workspace: workspace_payload
    ), status: 200
  end

  private

    def capabilities
      {
        time_tracking: TimeTrackingPolicy.new(current_user, :index).index?,
        projects: ProjectPolicy.new(current_user, Project).index?,
        expenses: ExpensePolicy.new(current_user, Expense).index?,
        invoices: InvoicePolicy.new(current_user, Invoice).index?,
        collections: mobile_collections?,
        payments: PaymentPolicy.new(current_user, :index).index?,
        payment_settings: PaymentSettingsPolicy.new(current_user, :index).index?,
        team: TeamPolicy.new(current_user, :index).index?
      }
    end

    def mobile_collections?
      current_company&.pro_access? &&
        %i[owner admin book_keeper employee].any? { |role| current_user.has_role?(role, current_company) }
    end

    def collection_settings_payload
      {
        enabled: mobile_collections?,
        default_currency: current_company&.base_currency || "INR",
        manual_payment_methods: mobile_collections? ? Api::V1::Mobile::CollectionsController::MANUAL_PAYMENT_METHODS : [],
        razorpay_payment_links_enabled: razorpay_payment_links_enabled?,
        sms_payment_links_enabled: razorpay_sms_available?
      }
    end

    def razorpay_payment_links_enabled?
      mobile_collections? && current_company&.country == "IN" && razorpay_provider.present?
    end

    def razorpay_sms_available?
      razorpay_payment_links_enabled? && razorpay_provider&.sms_notifications_enabled?
    end

    def razorpay_provider
      return @_razorpay_provider if instance_variable_defined?(:@_razorpay_provider)

      provider = current_company&.payments_providers&.find_by(
        name: PaymentsProvider::RAZORPAY_PROVIDER,
        enabled: true
      )

      @_razorpay_provider =
        if provider&.enabled_on_invoices? && provider.razorpay_configured?
          provider
        end
    end

    def workspace_payload
      return unless current_company

      {
        id: current_company.id,
        name: current_company.name,
        base_currency: current_company.base_currency,
        date_format: current_company.date_format
      }
    end
end
