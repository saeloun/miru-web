# frozen_string_literal: true

class HiringInboundMailbox < ApplicationMailbox
  def process
    HiringReceipt.where(inbound_email_id: inbound_email.id, state: "pending").find_each do |receipt|
      Hiring::EmailIntake.new(receipt).process
    end
  end
end
