# frozen_string_literal: true

Mailkick.headers = true
Mailkick.process_opt_outs_method = lambda do |opt_outs|
  emails = opt_outs.map { |v| v[:email] }
  subscribers = User.includes(:mailkick_subscriptions).where(email: emails).index_by(&:email)

  opt_outs.each do |opt_out|
    subscriber = subscribers[opt_out[:email]]
    next unless subscriber

    subscriber.mailkick_subscriptions.each do |subscription|
      subscription.destroy if subscription.created_at < opt_out[:time]
    end
  end
end
