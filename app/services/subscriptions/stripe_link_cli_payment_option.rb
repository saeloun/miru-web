# frozen_string_literal: true

require "shellwords"

module Subscriptions
  class StripeLinkCliPaymentOption
    MAX_SPEND_REQUEST_AMOUNT_CENTS = 50_000
    MONTHLY_UNIT_AMOUNT_CENTS = 100
    YEARLY_UNIT_AMOUNT_CENTS = 1_000
    CURRENCY = "usd"

    def self.signup_payload
      {
        "provider" => "stripe_link_cli",
        "label" => "Stripe Link CLI",
        "docs_url" => "https://github.com/stripe/link-cli",
        "checkout_endpoint" => "/api/v1/subscription/checkout",
        "checkout_request" => {
          "method" => "POST",
          "body" => {
            "agent_payment" => "stripe_link_cli",
            "interval" => "monthly"
          }
        },
        "requires_authenticated_workspace" => true,
        "credential_storage" => "Miru never stores Link CLI virtual card credentials."
      }
    end

    def initialize(context)
      @company = context.fetch(:company)
      @user = context.fetch(:user)
      @interval = context.fetch(:interval)
      @quantity = context.fetch(:quantity).to_i.clamp(1, 1_000)
      @checkout_url = context.fetch(:checkout_url)
      @base_url = context.fetch(:base_url)
    end

    def payload
      {
        "provider" => "stripe_link_cli",
        "label" => "Pay with Stripe Link CLI",
        "docs_url" => "https://github.com/stripe/link-cli",
        "supported" => supported?,
        "credential_type" => "virtual_card",
        "credential_storage" => "Miru never stores Link CLI virtual card credentials.",
        "merchant" => merchant_payload,
        "spend_request" => spend_request_payload,
        "commands" => command_payload
      }.tap do |payload|
        unless supported?
          payload["unsupported_reason"] =
            "Link CLI spend requests currently support amounts up to #{MAX_SPEND_REQUEST_AMOUNT_CENTS} cents."
        end
      end
    end

    private

      attr_reader :company, :user, :interval, :quantity, :checkout_url, :base_url

      def supported?
        amount_cents <= MAX_SPEND_REQUEST_AMOUNT_CENTS
      end

      def merchant_payload
        {
          "name" => "Miru",
          "url" => checkout_url.presence || base_url
        }
      end

      def spend_request_payload
        {
          "amount" => amount_cents,
          "currency" => CURRENCY,
          "context" => context,
          "line_items" => [
            {
              "name" => line_item_name,
              "unit_amount" => unit_amount_cents,
              "quantity" => quantity
            }
          ],
          "totals" => [
            {
              "type" => "total",
              "display_text" => "Total due today",
              "amount" => amount_cents
            }
          ]
        }
      end

      def command_payload
        {
          "install" => "npm i -g @stripe/link-cli",
          "auth" => "link-cli auth login --client-name \"Miru agent\" --format json",
          "list_payment_methods" => "link-cli payment-methods list --format json",
          "create_spend_request" => create_spend_request_command,
          "retrieve_approved_credential" =>
            "link-cli spend-request retrieve <spend_request_id> --include=card --format json",
          "test_mode" => "#{create_spend_request_command} --test"
        }
      end

      def create_spend_request_command
        [
          "link-cli spend-request create",
          "--payment-method-id <payment_method_id>",
          "--merchant-name #{Shellwords.escape(merchant_payload["name"])}",
          "--merchant-url #{Shellwords.escape(merchant_payload["url"])}",
          "--context #{Shellwords.escape(context)}",
          "--amount #{amount_cents}",
          "--currency #{CURRENCY}",
          "--line-item #{Shellwords.escape(line_item_argument)}",
          "--total #{Shellwords.escape(total_argument)}",
          "--request-approval",
          "--format json"
        ].join(" ")
      end

      def context
        [
          "Purchasing a Miru Pro #{interval} subscription for workspace #{company.name}.",
          "The authenticated Miru user is #{user.email}.",
          "This checkout is agent-compatible through Stripe Link CLI virtual card credentials.",
          "The user must approve the spend request in Link before the agent fills Stripe Checkout."
        ].join(" ")
      end

      def line_item_argument
        "name:#{line_item_name},unit_amount:#{unit_amount_cents},quantity:#{quantity}"
      end

      def total_argument
        "type:total,display_text:Total due today,amount:#{amount_cents}"
      end

      def line_item_name
        "Miru Pro #{interval} subscription"
      end

      def amount_cents
        unit_amount_cents * quantity
      end

      def unit_amount_cents
        interval == "yearly" ? YEARLY_UNIT_AMOUNT_CENTS : MONTHLY_UNIT_AMOUNT_CENTS
      end
  end
end
