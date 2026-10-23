# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmployeeOccasionRemindersJob, type: :job do
  include ActiveSupport::Testing::TimeHelpers

  let(:company) { create(:company, timezone: "Pacific Time (US & Canada)") }
  let(:admin) { create(:user, current_workspace: company, date_of_birth: nil) }
  let(:employee) { create(:user, current_workspace: company, date_of_birth: Date.new(1990, 1, 3)) }
  let!(:admin_employment) { create(:employment, company:, user: admin, joined_at: "2020-06-01", resigned_at: nil) }
  let!(:employment) { create(:employment, company:, user: employee, joined_at: "2020-01-03", resigned_at: nil) }

  before do
    enable_synthetic_payroll(company.id)
    admin.add_role(:admin, company)
    employee.add_role(:employee, company)
    ActionMailer::Base.deliveries.clear
    travel_to Time.utc(2026, 12, 28, 7) # December 27 in company timezone.
  end

  after { travel_back }

  def opt_in
    EmployeeRecordSetting.create!(company:, occasion_reminders_enabled: true)
  end

  it "is off by default and respects opt-out and entitlement" do
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
    setting = opt_in
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("true")
    setting.update!(occasion_reminders_enabled: false)
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(EmployeeOccasionDelivery.count).to eq(0)
  end

  it "sends birthdays and completed-year anniversaries seven local calendar days ahead across a year boundary once" do
    opt_in
    2.times { described_class.perform_now }
    expect(ActionMailer::Base.deliveries.size).to eq(2)
    expect(EmployeeOccasionDelivery.pluck(:event_on)).to eq([Date.new(2027, 1, 3)] * 2)
    birthday, anniversary = ActionMailer::Base.deliveries
    expect(birthday.to).to eq([admin.email])
    [birthday.html_part, birthday.text_part].each do |part|
      expect(part.body.decoded).to include("January 3", "/team/#{employee.id}/employee-records?company_id=#{company.id}")
      expect(part.body.decoded).not_to include("1990")
    end
    expect(anniversary.text_part.body.decoded).to include("7 completed years")
  end

  it "uses February 28 for leap birthdays/anniversaries in nonleap years and February 29 in leap years" do
    opt_in
    employee.update_column(:date_of_birth, Date.new(1992, 2, 29))
    employment.update_column(:joined_at, Date.new(2020, 2, 29))
    travel_to Time.utc(2027, 2, 21, 20)
    described_class.perform_now
    expect(EmployeeOccasionDelivery.pluck(:event_on)).to eq([Date.new(2027, 2, 28)] * 2)
    travel_to Time.utc(2028, 2, 21, 20)
    described_class.perform_now
    expect(EmployeeOccasionDelivery.count).to eq(2)
    travel_to Time.utc(2028, 2, 22, 20)
    described_class.perform_now
    expect(EmployeeOccasionDelivery.where(event_on: "2028-02-29").count).to eq(2)
  end

  it "excludes discarded/former employees, inactive admins, clients and incomplete anniversaries" do
    opt_in
    employment.update_column(:resigned_at, Date.new(2026, 12, 26))
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
    employment.update_columns(resigned_at: nil, discarded_at: Time.current)
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
    employment.update_column(:discarded_at, nil)
    employee.update_column(:discarded_at, Time.current)
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
    employee.update_column(:discarded_at, nil)
    admin.update_column(:discarded_at, Time.current)
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
    admin.update_column(:discarded_at, nil)
    admin_employment.update_column(:resigned_at, Date.new(2026, 12, 26))
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
    admin_employment.update_column(:resigned_at, nil)
    employee.remove_role(:employee, company)
    employee.add_role(:client, company)
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
    employee.add_role(:employee, company)
    employee.update_column(:date_of_birth, nil)
    employment.update_column(:joined_at, Date.new(2027, 1, 3))
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "does not log failed sends and allows a later successful retry" do
    opt_in
    allow(EmployeeOccasionMailer).to receive(:reminder).and_raise(IOError, "Synthetic failure")
    expect(Rails.logger).to receive(:warn).with(hash_including(
      event: "employee_occasion_delivery_failed", company_id: company.id, employment_id: employment.id,
      admin_id: admin.id, error_class: "IOError")).twice
    described_class.perform_now
    expect(EmployeeOccasionDelivery.count).to eq(0)
    allow(EmployeeOccasionMailer).to receive(:reminder).and_call_original
    described_class.perform_now
    expect(EmployeeOccasionDelivery.count).to eq(2)
    expect(ActionMailer::Base.deliveries.size).to eq(2)
  end

  it "continues past an inactive recipient to other admins and opted-in companies without duplicating successful sends" do
    opt_in
    healthy_admin = create(:user, current_workspace: company, date_of_birth: nil)
    create(:employment, company:, user: healthy_admin, joined_at: "2020-06-01", resigned_at: nil)
    healthy_admin.add_role(:admin, company)
    other_company = create(:company, timezone: company.timezone)
    other_admin = create(:user, current_workspace: other_company, date_of_birth: nil)
    other_admin.add_role(:admin, other_company)
    create(:employment, company: other_company, user: other_admin, joined_at: "2020-01-03", resigned_at: nil)
    EmployeeRecordSetting.create!(company: other_company, occasion_reminders_enabled: true)
    allow(Payroll::Entitlement).to receive(:enabled?).and_call_original
    allow(Payroll::Entitlement).to receive(:enabled?).with(other_company.id).and_return(true)
    diagnostics = []
    allow(Rails.logger).to receive(:warn) { |metadata| diagnostics << metadata }
    allow_any_instance_of(Mail::Message).to receive(:deliver).and_wrap_original do |original|
      raise Postmark::InactiveRecipientError, "Private recipient #{admin.email}" if original.receiver.to.include?(admin.email)

      original.call
    end

    2.times { described_class.perform_now }

    expect(ActionMailer::Base.deliveries.map(&:to)).to match_array([[healthy_admin.email], [healthy_admin.email], [other_admin.email]])
    expect(EmployeeOccasionDelivery.where(admin:).count).to eq(0)
    expect(EmployeeOccasionDelivery.where(admin: healthy_admin).count).to eq(2)
    expect(EmployeeOccasionDelivery.where(admin: other_admin).count).to eq(1)
    expect(diagnostics.size).to eq(4)
    expect(diagnostics).to all(include(event: "employee_occasion_delivery_failed", company_id: company.id,
      employment_id: employment.id, admin_id: admin.id, event_on: "2027-01-03", error_class: "Postmark::InactiveRecipientError"))
    expect(diagnostics.to_json).not_to include(admin.email, "Private recipient")
  end

  it "propagates unexpected programming errors" do
    opt_in
    allow(EmployeeOccasionMailer).to receive(:reminder).and_raise(NoMethodError, "Synthetic programming error")
    expect { described_class.perform_now }.to raise_error(NoMethodError, "Synthetic programming error")
    expect(EmployeeOccasionDelivery.count).to eq(0)
  end

  it "does not log delivery when mail sending is disabled" do
    opt_in
    allow(EmployeeOccasionMailer).to receive(:perform_deliveries).and_return(false)
    described_class.perform_now
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(EmployeeOccasionDelivery.count).to eq(0)
  end
end
