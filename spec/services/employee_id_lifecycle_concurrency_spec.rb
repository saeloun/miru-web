# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Employee ID lifecycle lock ordering", type: :service do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end

  def wait_until
    Timeout.timeout(10) do
      sleep(0.01) until yield
    end
  end

  def waiting_for_lock?(pid)
    ActiveRecord::Base.connection.select_value(
      "SELECT wait_event_type FROM pg_stat_activity WHERE pid = #{Integer(pid)}") == "Lock"
  end

  def race_removal(company, target, &operation)
    company_locked = Queue.new
    release_removal = Queue.new
    release_user_update = Queue.new
    user_updated = Queue.new
    lifecycle_pid = Queue.new
    removal_pid = Queue.new
    threads = []
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |event|
      next unless Thread.current[:employee_id_lifecycle_update] && event.payload[:sql].start_with?('UPDATE "users"')

      Thread.current[:employee_id_lifecycle_update] = false
      user_updated << true
      release_user_update.pop
    end

    threads << Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        removal_pid << connection.raw_connection.backend_pid
        Company.find(company.id).with_lock do
          company_locked << true
          release_removal.pop
          employment = Employment.kept.find_by!(company_id: company.id, user_id: target.id)
          employment.lock!
          removed_user = employment.user
          removed_user.remove_roles_for(company)
          employment.discard!
        end
      end
      :removed
    rescue StandardError => error
      error.class
    end
    Timeout.timeout(10) { company_locked.pop }
    threads << Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        lifecycle_pid << connection.raw_connection.backend_pid
        Thread.current[:employee_id_lifecycle_update] = true
        operation.call
      end
      :updated
    rescue StandardError => error
      error.class
    end
    updater_pid = Timeout.timeout(10) { lifecycle_pid.pop }
    remover_pid = Timeout.timeout(10) { removal_pid.pop }
    wait_until { !user_updated.empty? || waiting_for_lock?(updater_pid) }
    release_removal << true
    wait_until { !threads.first.alive? || waiting_for_lock?(remover_pid) }
    release_user_update << true
    Timeout.timeout(20) { threads.map(&:value) }
  ensure
    release_removal << true
    release_user_update << true
    threads.each { |thread| thread.kill if thread.alive? }
    threads.each(&:join)
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
  end

  [nil, "custom"].each do |employee_id|
    it "serializes promotion and removal with #{employee_id.nil? ? 'a blank' : 'a custom'} employee ID" do
      company = create(:company)
      actor = create(:user)
      actor.add_role(:owner, company)
      target = create(:user, current_workspace: company)
      employment = create(:employment, company:, user: target, employee_id:)
      other = create(:employment, user: target)

      results = race_removal(company, target) do
        Team::UpdateService.new(actor: User.find(actor.id), user_params: { first_name: "Changed" },
          current_company: Company.find(company.id), new_role: "employee", user: User.find(target.id)).process
      end

      expect(results).to eq([:removed, :updated])
      expect(employment.reload).to be_discarded
      expect(employment.employee_id).to eq(employee_id)
      expect(target.reload.current_workspace_id).to eq(other.company_id)
    end
  end

  it "locks the company before an existing invited user's first write" do
    company = create(:company)
    target = create(:user, current_workspace: company)
    create(:employment, company:, user: target, employee_id: nil, discarded_at: Time.current)
    create(:employment, user: target)
    invitation = create(:invitation, company:, recipient_email: target.email)
    user_updated = Queue.new
    lifecycle_pid = Queue.new
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |event|
      next unless Thread.current[:employee_id_invitation_update] && event.payload[:sql].start_with?('UPDATE "users"')

      user_updated << true
    end
    updated_before_company_lock = nil
    thread = nil
    company.with_lock do
      thread = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          lifecycle_pid << connection.raw_connection.backend_pid
          Thread.current[:employee_id_invitation_update] = true
          service = CreateInvitedUserService.new(invitation.token)
          service.process
          raise service.error_message unless service.success
        end
      end
      pid = Timeout.timeout(10) { lifecycle_pid.pop }
      wait_until { !user_updated.empty? || waiting_for_lock?(pid) }
      updated_before_company_lock = !user_updated.empty?
    end

    Timeout.timeout(20) { thread.value }
    expect(updated_before_company_lock).to be(false)
    expect(invitation.reload.accepted_at).to be_present
    expect(target.employments.kept.find_by!(company:).employee_id).to eq("SI001")
  ensure
    thread&.kill if thread&.alive?
    thread&.join
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
  end

  it "serializes permanent deletion and reinvitation acceptance without losing historical numbers" do
    company = create(:company)
    target = create(:user, current_workspace: company)
    employment = create(:employment, company:, user: target, employee_id: nil, discarded_at: Time.current)
    employment.update_columns(employee_id: "SI063")
    target.add_role(:employee, company)
    invitation = create(:invitation, company:, recipient_email: target.email)
    company_locked = Queue.new
    release_acceptance = Queue.new
    invitation_deleted = Queue.new
    deletion_pid = Queue.new
    threads = []
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |event|
      sql = event.payload[:sql]
      if Thread.current[:employee_id_acceptance] && sql.include?('FROM "companies"') &&
          sql.include?("FOR NO KEY UPDATE")
        Thread.current[:employee_id_acceptance] = false
        company_locked << true
        release_acceptance.pop
      elsif Thread.current[:employee_id_deletion] && sql.start_with?('DELETE FROM "invitations"')
        invitation_deleted << true
      end
    end

    threads << Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        Thread.current[:employee_id_acceptance] = true
        service = CreateInvitedUserService.new(invitation.token)
        service.process
        raise service.error_message unless service.success
      end
      :accepted
    rescue StandardError => error
      error.class
    end
    Timeout.timeout(10) { company_locked.pop }
    threads << Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        deletion_pid << connection.raw_connection.backend_pid
        Thread.current[:employee_id_deletion] = true
        User.find(target.id).destroy!
      end
      :deleted
    rescue StandardError => error
      error.class
    end
    pid = Timeout.timeout(10) { deletion_pid.pop }
    wait_until { !invitation_deleted.empty? || waiting_for_lock?(pid) }
    release_acceptance << true

    expect(Timeout.timeout(20) { threads.map(&:value) }).to eq([:accepted, :deleted])
    expect(User.exists?(target.id)).to be(false)
    expect(Employment.exists?(employment.id)).to be(false)
    expect(Invitation.exists?(invitation.id)).to be(false)
    expect(company.reload.last_employee_number).to eq(63)
  ensure
    release_acceptance << true if release_acceptance
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
  end
end
