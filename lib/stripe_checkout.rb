# frozen_string_literal: true

module StripeCheckout
  def handle_stripe_checkout_event(request)
    endpoint_secret = ENV["STRIPE_WEBHOOK_ENDPOINT_SECRET"]
    payload = request.body.read
    sig_header = request.env["HTTP_STRIPE_SIGNATURE"]
    event = nil

    begin
      event = Stripe::Webhook.construct_event(
        payload, sig_header, endpoint_secret
      )
    rescue JSON::ParserError => e
      # Invalid payload
      puts "Invalid payload!"
      render json: { message: "Invalid payload!" }, status: 400 and return
    rescue Stripe::SignatureVerificationError => e
      # Invalid signature
      puts "Invalid signature!"
      render json: { message: "Invalid signature!" }, status: 400 and return
    end

    # Handle the event
    case event.type
    when "checkout.session.completed"
      if InvoicePayment::StripeCheckoutFulfillment.process(event)
        puts "Payment succeeded!"
      else
        puts "Invalid payload!"
        render json: { message: "Invalid payload!" }, status: 400 and return
      end
    else
      puts "Unhandled event type: #{event.type}"
    end

    render json: { success: true }, status: :ok
  end
end
