# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Concurrent invitation acceptance" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end

  it "creates one membership and password setup using independent PostgreSQL connections without signup marketing" do
    invitation = create(:invitation)
    ready, start = Queue.new, Queue.new
    ActiveJob::Base.queue_adapter.enqueued_jobs.clear
    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          service = CreateInvitedUserService.new(invitation.token)
          service.send(:invitation)
          ready << connection.select_value("SELECT pg_backend_pid()")
          start.pop
          service.process
          service
        end
      end
    end
    expect(2.times.map { ready.pop }.uniq.size).to eq(2)
    2.times { start << true }
    services = threads.map(&:value)
    expect(services.map(&:success)).to contain_exactly(true, false)
    accepted = services.find(&:success)
    expect(accepted.new_user).to be(true)
    expect(accepted.reset_password_token).to be_present
    expect(invitation.reload.accepted_at).to be_present
    expect(User.where(email: invitation.recipient_email).count).to eq(1)
    expect(invitation.company.employments.where(user: accepted.user).count).to eq(1)
    expect(accepted.user.roles.where(resource: invitation.company).pluck(:name)).to eq([invitation.role])
    expect(ActiveJob::Base.queue_adapter.enqueued_jobs.pluck(:job)).not_to include(HubspotIntegrationJob)
  ensure
    threads&.each { |thread| thread.join(5) }
  end

  it "rolls back with a retryable message when an existing recipient is locked by another account operation" do
    user = create(:user)
    invitation = create(:invitation, recipient_email: user.email)
    ready, release = Queue.new, Queue.new
    holder = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        User.find(user.id).with_lock do
          ready << true
          release.pop
        end
      end
    end
    ready.pop
    service = CreateInvitedUserService.new(invitation.token)
    ActiveRecord::Base.transaction do
      ActiveRecord::Base.connection.execute("SET LOCAL lock_timeout = '500ms'")
      service.process
    end
    expect(service.success).to be(false)
    expect(service.error_message).to eq("Your account is being updated. Reopen your invitation link and try again.")
    expect(service.error.cause.message).to include("could not obtain lock")
    expect(invitation.reload.accepted_at).to be_nil
    expect(invitation.company.employments.where(user:)).not_to exist
    release << true
    holder.value
    retry_service = CreateInvitedUserService.new(invitation.token)
    retry_service.process
    expect(retry_service.success).to be(true)
    expect(user.reload.valid_password?("Password123!")).to be(true)
  ensure
    release << true if release
    holder&.join(5)
  end

  it "does not market a verified OAuth-style signup that accepts its invitation in the same transaction" do
    invitation = create(:invitation)
    ActiveJob::Base.queue_adapter.enqueued_jobs.clear
    User.transaction do
      user = create(:user, email: invitation.recipient_email)
      service = CreateInvitedUserService.new(invitation.token, user)
      service.process
      expect(service.success).to be(true)
    end
    expect(ActiveJob::Base.queue_adapter.enqueued_jobs.pluck(:job)).not_to include(HubspotIntegrationJob)
  end
end
