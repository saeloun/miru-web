# frozen_string_literal: true

Warden::Manager.after_set_user do |user, warden, options|
  scope = options[:scope]
  next unless scope == :user && user.is_a?(User) && options[:store] != false

  session = warden.session(scope)
  token = session["browser_session_token"] if options[:event] == :fetch

  if token
    browser_session = user.browser_sessions.find_by(token_digest: Digest::SHA256.hexdigest(token))
  else
    # Keep legacy cookies identifiable after logout so replay cannot register them again.
    token = if options[:event] == :fetch
      Digest::SHA256.hexdigest("#{user.id}:#{session["unique_session_id"] || warden.raw_session.id}")
    else
      SecureRandom.hex(32)
    end
    browser_session = user.browser_sessions.create_or_find_by!(token_digest: Digest::SHA256.hexdigest(token))
  end

  if browser_session && !browser_session.revoked_at?
    session["browser_session_token"] = token
  else
    warden.logout(scope)
    throw :warden, scope: scope, message: :unauthenticated
  end
end

Warden::Manager.before_logout do |user, warden, options|
  scope = options[:scope]
  next unless scope == :user && user.is_a?(User)

  token = warden.raw_session.dig("warden.user.#{scope}.session", "browser_session_token")
  next if token.blank?

  user.browser_sessions.where(token_digest: Digest::SHA256.hexdigest(token), revoked_at: nil)
    .update_all(revoked_at: Time.current)
end
