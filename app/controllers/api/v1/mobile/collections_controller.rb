# frozen_string_literal: true

class Api::V1::Mobile::CollectionsController < Api::V1::ApplicationController
  MANUAL_PAYMENT_METHODS = %w[cash upi].freeze

  skip_after_action :verify_authorized
  before_action :authorize_mobile_collection!

  def index
    invoices = mobile_collection_scope.includes(:client, :payments).order(created_at: :desc).limit(50).to_a

    render json: {
      collections: invoices.map { |invoice| collection_payload(invoice) },
      summary: ledger_summary(invoices)
    }, status: 200
  end

  def create
    if manual_paid? && collection_amount <= 0
      return render json: { error: "Enter an amount to record a payment" }, status: 422
    end

    if manual_paid? && !MANUAL_PAYMENT_METHODS.include?(manual_payment_method)
      return render json: { error: "Payment method must be cash or upi" }, status: 422
    end

    if (invoice = idempotent_invoice)
      payment_link_url = invoice.razorpay_payment_link_url
      sms_sent = false
      payment_link_url, sms_sent = create_razorpay_payment_link!(invoice) if invoice && create_payment_link? && !invoice.paid?

      return render_collection_response(
        client: invoice.client,
        customer_user: customer_user_for(invoice.client),
        invoice:,
        payment: invoice.payments.order(created_at: :desc).first,
        payment_link_url:,
        sms_sent:,
        status: sms_sent ? :accepted : :ok
      )
    end

    client = nil
    customer_user = nil
    invoice = nil
    payment = nil

    ActiveRecord::Base.transaction do
      client = find_or_create_client!
      customer_user = ensure_customer_login!(client)
      invoice = create_invoice!(client) if collection_amount.positive?
      payment = record_manual_payment!(invoice) if invoice && manual_paid?
    end

    payment_link_url = nil
    sms_sent = false

    if invoice && create_payment_link?
      payment_link_url, sms_sent = create_razorpay_payment_link!(invoice)
    end

    render_collection_response(
      client:,
      customer_user:,
      invoice:,
      payment:,
      payment_link_url:,
      sms_sent:,
      status: sms_sent ? :accepted : :created
    )
  rescue PaymentProviders::RazorpayClient::Error => error
    Rails.logger.warn("Mobile collection payment link failed: #{error.message}")
    render json: { error: error.message.presence || "Unable to create Razorpay payment link" }, status: 422
  end

  def manual_payment
    invoice = current_mobile_collection
    return render json: { error: "Collection is already paid" }, status: 422 if invoice.paid?

    payment_method = mobile_collection_action_payment_method
    unless MANUAL_PAYMENT_METHODS.include?(payment_method)
      return render json: { error: "Payment method must be cash or upi" }, status: 422
    end

    amount = mobile_collection_action_amount(invoice)
    return render json: { error: "Enter an amount to record a payment" }, status: 422 if amount <= 0

    payment = record_manual_payment!(
      invoice,
      amount:,
      payment_method:,
      note: mobile_collection_action_payment_note(payment_method)
    )
    invoice.reload

    render_collection_response(
      client: invoice.client,
      customer_user: customer_user_for(invoice.client),
      invoice:,
      payment:,
      payment_link_url: invoice.razorpay_payment_link_url,
      sms_sent: false,
      status: :ok,
      message: "#{payment_method.upcase} payment recorded"
    )
  end

  def payment_link
    invoice = current_mobile_collection
    return render json: { error: "Collection is already paid" }, status: 422 if invoice.paid?

    payment_link_url, sms_sent = create_razorpay_payment_link!(invoice, notify_sms: mobile_collection_action_notify_sms?)

    render_collection_response(
      client: invoice.client,
      customer_user: customer_user_for(invoice.client),
      invoice: invoice.reload,
      payment: invoice.payments.order(created_at: :desc).first,
      payment_link_url:,
      sms_sent:,
      status: sms_sent ? :accepted : :ok,
      message: sms_sent ? "Payment link sent by SMS" : "Payment link ready"
    )
  rescue PaymentProviders::RazorpayClient::Error => error
    Rails.logger.warn("Mobile collection payment link failed: #{error.message}")
    render json: { error: error.message.presence || "Unable to create Razorpay payment link" }, status: 422
  end

  private

    def collection_params
      params.require(:collection).permit(
        :name,
        :phone,
        :email,
        :amount,
        :note,
        :currency,
        :notify_sms,
        :create_payment_link,
        :mark_paid,
        :payment_method,
        :manual_reference,
        :idempotency_key
      )
    end

    def collection_action_params
      params.fetch(:collection, ActionController::Parameters.new)
        .permit(:amount, :note, :notify_sms, :payment_method, :manual_reference)
    end

    def authorize_mobile_collection!
      raise Pundit::NotAuthorizedError unless current_company&.pro_access? && mobile_collection_actor?
    end

    def mobile_collection_actor?
      %i[owner admin book_keeper employee].any? { |role| current_user.has_role?(role, current_company) }
    end

    def mobile_collection_manager?
      %i[owner admin book_keeper].any? { |role| current_user.has_role?(role, current_company) }
    end

    def mobile_collection_scope
      scope = current_company.invoices.kept.where("payment_infos ->> 'mobile_collection_source' = ?", "mobile")
      return scope if mobile_collection_manager?

      scope.where("payment_infos ->> 'mobile_collector_user_id' = ?", current_user.id.to_s)
    end

    def current_mobile_collection
      @_current_mobile_collection ||= mobile_collection_scope.includes(:client, :payments).find(params[:id])
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
        ],
        payment_infos: mobile_collection_payment_infos
      )
    end

    def record_manual_payment!(
      invoice,
      amount: collection_amount,
      payment_method: manual_payment_method,
      note: manual_payment_note
    )
      InvoicePayment::Settle.process(
        {
          invoice_id: invoice.id,
          transaction_date: Date.current,
          transaction_type: payment_method,
          amount:,
          note:,
          name: current_user.full_name
        },
        invoice
      )
    end

    def create_razorpay_payment_link!(invoice, notify_sms: notify_sms?)
      validate_razorpay_payment_link!(invoice, notify_sms:)

      service = PaymentProviders::RazorpayPaymentLinkService.new(
        invoice:,
        provider: razorpay_provider,
        callback_url: razorpay_success_invoice_payments_url(invoice),
        notify_sms:
      )

      [service.process, service.sms_sent?]
    end

    def validate_razorpay_payment_link!(invoice, notify_sms:)
      raise PaymentProviders::RazorpayClient::Error, "Razorpay payments are available only for INR invoices" unless invoice.currency == "INR"
      raise PaymentProviders::RazorpayClient::Error, "Razorpay is not enabled for invoices" unless razorpay_provider
      raise PaymentProviders::RazorpayClient::Error, "SMS payment links are not enabled for this workspace" if notify_sms && !razorpay_sms_available?
      raise PaymentProviders::RazorpayClient::Error, "Client phone is required to send SMS payment links" if notify_sms && invoice.client.phone.blank?
    end

    def collection_amount
      BigDecimal(collection_params[:amount].to_s.presence || "0")
    rescue ArgumentError
      0.to_d
    end

    def collection_currency
      collection_params[:currency].to_s.strip.upcase.presence || "INR"
    end

    def collection_note
      collection_params[:note].to_s.strip.presence || "Consultation"
    end

    def create_payment_link?
      return false if manual_paid?

      ActiveModel::Type::Boolean.new.cast(collection_params[:create_payment_link]) == true || notify_sms?
    end

    def notify_sms?
      ActiveModel::Type::Boolean.new.cast(collection_params[:notify_sms]) == true
    end

    def manual_paid?
      ActiveModel::Type::Boolean.new.cast(collection_params[:mark_paid]) == true ||
        MANUAL_PAYMENT_METHODS.include?(manual_payment_method)
    end

    def manual_payment_method
      collection_params[:payment_method].to_s.strip.downcase
    end

    def manual_payment_note
      [collection_note, manual_reference_note].compact.join(" - ")
    end

    def manual_reference_note
      reference = collection_params[:manual_reference].to_s.strip
      return if reference.blank?

      "#{manual_payment_method.upcase} ref: #{reference}"
    end

    def mobile_collection_action_payment_method
      collection_action_params[:payment_method].to_s.strip.downcase
    end

    def mobile_collection_action_amount(invoice)
      value = collection_action_params[:amount].to_s.strip
      return invoice.amount_due.to_d if value.blank?

      BigDecimal(value)
    rescue ArgumentError
      0.to_d
    end

    def mobile_collection_action_payment_note(payment_method)
      note = collection_action_params[:note].to_s.strip.presence || "Mobile collection"
      reference = collection_action_params[:manual_reference].to_s.strip.presence
      reference_note = reference && "#{payment_method.upcase} ref: #{reference}"

      [note, reference_note].compact.join(" - ")
    end

    def mobile_collection_action_notify_sms?
      ActiveModel::Type::Boolean.new.cast(collection_action_params[:notify_sms]) == true
    end

    def idempotency_key
      collection_params[:idempotency_key].to_s.strip.first(100)
    end

    def idempotent_invoice
      return if idempotency_key.blank?

      mobile_collection_scope.find_by("payment_infos ->> 'mobile_collection_idempotency_key' = ?", idempotency_key)
    end

    def mobile_collection_payment_infos
      {
        mobile_collection_source: "mobile",
        mobile_collection_idempotency_key: idempotency_key.presence,
        mobile_collector_user_id: current_user.id.to_s,
        mobile_collector_name: current_user.full_name,
        mobile_collection_payment_method: manual_paid? ? manual_payment_method : nil
      }.compact
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
      return "#{manual_payment_method.upcase} payment recorded" if manual_paid?
      return "Payment link sent by SMS" if sms_sent
      return "Payment link ready" if create_payment_link?

      "Invoice created"
    end

    def render_collection_response(client:, customer_user:, invoice:, payment:, payment_link_url:, sms_sent:, status:, message: nil)
      render json: {
        message: message || collection_message(invoice:, sms_sent:),
        client: client_payload(client),
        customer_user: customer_user && customer_user_payload(customer_user),
        invoice: invoice && invoice_payload(invoice),
        payment: payment && payment_payload(payment),
        payment_link_url:,
        sms_sent:
      }, status:
    end

    def collection_payload(invoice)
      payment = invoice.payments.max_by(&:created_at)

      {
        id: invoice.id,
        client: client_payload(invoice.client),
        collector: collector_payload(invoice),
        invoice: invoice_payload(invoice),
        payment: payment && payment_payload(payment),
        payment_method: payment&.transaction_type || invoice.payment_infos["mobile_collection_payment_method"],
        status: invoice.status,
        amount: invoice.amount,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
        paid_at: payment&.transaction_date,
        created_at: invoice.created_at.iso8601
      }
    end

    def collector_payload(invoice)
      collector_id = invoice.payment_infos["mobile_collector_user_id"]
      collector = User.kept.find_by(id: collector_id) if collector_id.present?

      {
        id: collector&.id || collector_id,
        name: collector&.full_name.presence || invoice.payment_infos["mobile_collector_name"]
      }.compact
    end

    def ledger_summary(invoices)
      payments = invoices.flat_map(&:payments)

      {
        count: invoices.size,
        paid_count: invoices.count(&:paid?),
        open_count: invoices.count { |invoice| !invoice.paid? },
        total_amount: invoices.sum { |invoice| invoice.amount.to_d },
        paid_amount: invoices.sum { |invoice| invoice.amount_paid.to_d },
        open_amount: invoices.sum { |invoice| invoice.amount_due.to_d },
        by_method: payments.group_by(&:transaction_type).transform_values { |items| items.sum { |payment| payment.amount.to_d } },
        by_collector: invoices.group_by { |invoice| invoice.payment_infos["mobile_collector_name"].presence || "Unknown" }
          .transform_values { |items| items.sum { |invoice| invoice.amount.to_d } }
      }
    end

    def client_payload(client)
      client.slice(:id, :name, :email, :phone, :currency)
    end

    def customer_user_for(client)
      return if client.blank?

      current_company.client_members.includes(:user).find_by(client:)&.user ||
        User.kept.find_by(phone: client.phone)
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
        razorpay_payment_link_url: invoice.razorpay_payment_link_url,
        razorpay_payment_link_status: invoice.razorpay_payment_link_status
      }
    end

    def payment_payload(payment)
      {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        transaction_date: payment.transaction_date,
        transaction_type: payment.transaction_type,
        note: payment.note,
        name: payment.name,
        payment_currency: payment.payment_currency
      }
    end
end
