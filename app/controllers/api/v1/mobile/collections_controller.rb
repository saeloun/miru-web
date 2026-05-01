# frozen_string_literal: true

class Api::V1::Mobile::CollectionsController < Api::V1::ApplicationController
  def create
    authorize Client, :create?

    client = nil
    customer_user = nil
    invoice = nil

    ActiveRecord::Base.transaction do
      client = find_or_create_client!
      customer_user = ensure_customer_login!(client)
      invoice = create_invoice!(client) if collection_amount.positive?
    end

    payment_link_url = nil
    sms_sent = false

    if invoice && create_payment_link?
      payment_link_url, sms_sent = create_razorpay_payment_link!(invoice)
    end

    render json: {
      message: collection_message(invoice:, sms_sent:),
      client: client_payload(client),
      customer_user: customer_user && customer_user_payload(customer_user),
      invoice: invoice && invoice_payload(invoice),
      payment_link_url:,
      sms_sent:
    }, status: sms_sent ? 202 : 201
  rescue PaymentProviders::RazorpayClient::Error => error
    Rails.logger.warn("Mobile collection payment link failed: #{error.message}")
    render json: { error: error.message.presence || "Unable to create Razorpay payment link" }, status: 422
  end

  private

    def collection_params
      params.require(:collection).permit(:name, :phone, :email, :amount, :note, :currency, :notify_sms, :create_payment_link)
    end

    def find_or_create_client!
      normalized_phone = normalize_phone(collection_params[:phone])
      name = collection_params[:name].to_s.strip
      email = collection_params[:email].to_s.strip.presence

      if name.blank?
        invalid_client = current_company.clients.new(name:, phone: normalized_phone, currency: collection_currency)
        invalid_client.validate
        raise ActiveRecord::RecordInvalid.new(invalid_client)
      end

      client = current_company.clients.kept.find_by(phone: normalized_phone) if normalized_phone.present?
      client ||= current_company.clients.kept.find_by("LOWER(name) = ?", name.downcase)

      if client
        client.update!(phone: normalized_phone) if normalized_phone.present? && client.phone.blank?
        client.update!(email:) if email.present? && client.email.blank?
        return client
      end

      current_company.clients.create!(
        name:,
        email:,
        phone: normalized_phone,
        currency: collection_currency
      )
    end

    def ensure_customer_login!(client)
      return if client.phone.blank?

      user = User.kept.find_by(phone: client.phone)
      user ||= User.kept.find_by(email: client.email) if client.email.present?
      user ||= build_customer_user(client)

      user.skip_reconfirmation! if user.persisted? && user.respond_to?(:skip_reconfirmation!)
      user.assign_attributes(phone: client.phone, current_workspace_id: current_company.id)
      user.save! if user.changed?

      current_company.employments.find_or_create_by!(user:)
      user.add_role(:client, current_company) unless user.has_role?(:client, current_company)
      current_company.client_members.find_or_create_by!(client:, user:)

      user
    end

    def build_customer_user(client)
      user = User.new(
        email: customer_email(client),
        first_name: customer_first_name(client),
        last_name: customer_last_name(client),
        password: Devise.friendly_token.first(20),
        phone: client.phone,
        current_workspace_id: current_company.id
      )
      user.skip_password_validation = true
      user.skip_confirmation!
      user.save!
      user
    end

    def create_invoice!(client)
      current_company.invoices.create!(
        client:,
        currency: collection_currency,
        due_date: Date.current,
        invoice_number: next_mobile_invoice_number,
        issue_date: Date.current,
        status: :sent,
        invoice_line_items_attributes: [
          {
            date: Date.current,
            description: collection_note,
            name: collection_note,
            quantity: 60,
            rate: collection_amount
          }
        ]
      )
    end

    def create_razorpay_payment_link!(invoice)
      return [nil, false] unless create_payment_link?

      validate_razorpay_payment_link!(invoice)

      service = PaymentProviders::RazorpayPaymentLinkService.new(
        invoice:,
        provider: razorpay_provider,
        callback_url: razorpay_success_invoice_payments_url(invoice),
        notify_sms: notify_sms?
      )

      [service.process, service.sms_sent?]
    end

    def validate_razorpay_payment_link!(invoice)
      raise PaymentProviders::RazorpayClient::Error, "Razorpay payments are available only for INR invoices" unless invoice.currency == "INR"
      raise PaymentProviders::RazorpayClient::Error, "Razorpay is not enabled for invoices" unless razorpay_provider
      raise PaymentProviders::RazorpayClient::Error, "SMS payment links are not enabled for this workspace" if notify_sms? && !razorpay_sms_available?
      raise PaymentProviders::RazorpayClient::Error, "Client phone is required to send SMS payment links" if notify_sms? && invoice.client.phone.blank?
    end

    def collection_amount
      BigDecimal(collection_params[:amount].to_s.presence || "0")
    rescue ArgumentError
      0.to_d
    end

    def collection_currency
      collection_params[:currency].presence || "INR"
    end

    def collection_note
      collection_params[:note].to_s.strip.presence || "Consultation"
    end

    def create_payment_link?
      ActiveModel::Type::Boolean.new.cast(collection_params[:create_payment_link]) == true || notify_sms?
    end

    def notify_sms?
      ActiveModel::Type::Boolean.new.cast(collection_params[:notify_sms]) == true
    end

    def normalize_phone(phone)
      value = phone.to_s.strip
      return if value.blank?

      digits = value.gsub(/\D/, "")
      return "+91#{digits}" if digits.length == 10
      return "+#{digits}" if digits.start_with?("91") && digits.length == 12
      return "+#{digits}" if value.start_with?("+")

      digits
    end

    def next_mobile_invoice_number
      loop do
        value = "MOB-#{Time.current.strftime("%y%m%d%H%M%S")}-#{SecureRandom.hex(2).upcase}"
        break value unless current_company.invoices.exists?(invoice_number: value)
      end
    end

    def razorpay_provider
      return @_razorpay_provider if instance_variable_defined?(:@_razorpay_provider)

      provider = current_company.payments_providers.find_by(
        name: PaymentsProvider::RAZORPAY_PROVIDER,
        enabled: true
      )

      @_razorpay_provider =
        if provider&.enabled_on_invoices? && provider.razorpay_configured?
          provider
        end
    end

    def razorpay_sms_available?
      current_company.country == "IN" && current_company.pro_access? && razorpay_provider&.sms_notifications_enabled?
    end

    def collection_message(invoice:, sms_sent:)
      return "Payer saved" unless invoice
      return "Payment link sent by SMS" if sms_sent
      return "Payment link ready" if create_payment_link?

      "Invoice created"
    end

    def client_payload(client)
      client.slice(:id, :name, :email, :phone, :currency)
    end

    def customer_user_payload(user)
      user.slice(:id, :email, :first_name, :last_name, :phone, :current_workspace_id)
    end

    def customer_email(client)
      return client.email if client.email.present? && User.kept.where(email: client.email).none?

      digits = client.phone.to_s.gsub(/\D/, "")
      "customer-#{current_company.id}-#{digits}@customers.miru.local"
    end

    def customer_first_name(client)
      customer_name_parts(client).first || "Customer"
    end

    def customer_last_name(client)
      customer_name_parts(client).drop(1).join(" ").presence || "Guest"
    end

    def customer_name_parts(client)
      @_customer_name_parts ||= client.name.to_s.scan(/[A-Za-z]+/).map { |part| part.first(20) }.presence || ["Customer", "Guest"]
    end

    def invoice_payload(invoice)
      {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client: client_payload(invoice.client),
        client_name: invoice.client.name,
        status: invoice.status,
        amount: invoice.amount,
        amount_due: invoice.amount_due,
        outstanding_amount: invoice.outstanding_amount,
        currency: invoice.currency,
        due_date: invoice.due_date,
        payment_url: new_invoice_payment_url(invoice),
        razorpay_payment_link_url: invoice.razorpay_payment_link_url,
        razorpay_payment_link_status: invoice.razorpay_payment_link_status
      }
    end
end
