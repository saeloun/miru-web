# frozen_string_literal: true

class HiringOfferExpiryJob < ApplicationJob
  def perform
    HiringOffer.where(state: "sent").where("expires_at <= ?", Time.current).find_each(&:expire!)
  end
end
