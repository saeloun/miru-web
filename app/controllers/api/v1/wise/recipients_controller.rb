# frozen_string_literal: true

module Api::V1::Wise
  class RecipientsController < Api::V1::ApplicationController
    before_action :authenticate_user!
    before_action :set_recipient, only: [:show, :update]
    after_action :verify_authorized

    def create
      authorize :wise, :create?

      # Mock implementation for Wise recipient creation
      recipient = {
        id: SecureRandom.uuid,
        name: params[:name],
        email: params[:email],
        currency: params[:currency],
        account_number: params[:account_number],
        created_at: Time.current
      }

      render json: { recipient: recipient }, status: 201
    end

    def show
      authorize :wise, :show?
      render json: { recipient: @recipient }
    end

    def update
      authorize :wise, :update?

      @recipient.merge!(recipient_params)
      render json: { recipient: @recipient }
    end

    private

      def set_recipient
        # Mock implementation
        @recipient = {
          id: params[:recipient_id],
          name: "John Doe",
          email: "john@example.com",
          currency: "USD",
          account_number: "****1234"
        }
      end

      def recipient_params
        params.permit(:name, :email, :currency, :account_number, :routing_number)
      end
  end
end
