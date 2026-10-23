# frozen_string_literal: true

module EmployeeReports
  module Columns
    DEFINITIONS = {
      "name" => ["Employee name", "Current user first and last name."],
      "email" => ["Work email", "Current user login email."],
      "date_of_birth" => ["Date of birth", "Current user profile date of birth."],
      "phone" => ["Phone", "Current user profile phone."],
      "personal_email_id" => ["Personal email", "Current user profile personal email."],
      "addresses" => ["Addresses (JSON)", "Current user profile addresses, encoded as JSON."],
      "social_accounts" => ["Social accounts (JSON)", "Current user profile social links, encoded as JSON."],
      "employee_id" => ["Employee ID", "Current company employment identifier, preserved verbatim."],
      "designation" => ["Designation", "Current company employment designation."],
      "employment_type" => ["Employment type", "Current company employment type."],
      "joined_at" => ["Joining date", "Current company employment joining date."],
      "family_members" => ["Family members (JSON)", "Current private family details, encoded as JSON."],
      "emergency_contact_name" => ["Emergency contact name", "Current private emergency contact name."],
      "emergency_contact_phone" => ["Emergency contact phone", "Current private emergency contact phone."],
      "bank_account_name" => ["Bank account holder", "Current private bank account holder name."],
      "bank_name" => ["Bank name", "Current private bank name."],
      "bank_branch" => ["Bank branch", "Current private bank branch."],
      "bank_account_number" => ["Bank account number", "Current private account number; import this column as text."],
      "bank_ifsc" => ["IFSC", "Current private IFSC."],
      "bank_swift" => ["SWIFT", "Current private SWIFT."],
      "salary_amount" => ["Current salary amount", "Current recorded salary, not selected-month historical salary or calculated pay."],
      "salary_currency" => ["Current salary currency", "Currency of current recorded salary; no conversion."],
      "salary_frequency" => ["Current salary frequency", "Monthly or annual frequency of current recorded salary."],
      "salary_effective_on" => ["Current salary effective date", "Effective date of current recorded salary; no salary history."],
      "recorded_time_off_minutes" => ["Month recorded time off (minutes)", "Kept TimeoffEntry duration in selected month, scoped through workspace leave/holiday sources. Records have no approval status; includes recorded holidays."],
      "recorded_work_minutes" => ["Month recorded work (minutes)", "Kept timesheet duration for company projects in selected month; not approved attendance or payable time."],
      "recorded_working_days" => ["Month recorded working days", "Distinct dates with kept timesheet entries for company projects in selected month; not approved attendance or payable days."],
      "calendar_weekdays" => ["Month calendar weekdays (Mon–Fri)", "Monday–Friday dates in selected month within employment dates, before holiday/time-off deductions. Blank when joining date is unknown. Not an approved work schedule or paid days."],
      "national_holiday_dates" => ["Month configured national holiday dates (JSON)", "Kept company national holiday dates in selected month, encoded as JSON. No assumption about attendance."],
      "paid_reimbursements" => ["Month recorded paid reimbursements by currency (JSON)", "Kept personal expenses with status paid and paid_at in selected company-timezone month, grouped by original currency. Manually recorded paid status, not provider-verified settlement."],
      "approved_reimbursements" => ["Month approved unpaid reimbursements by currency (JSON)", "Currently approved kept personal expenses with approved_at in selected company-timezone month, grouped by original currency. Not paid; status is current, not a historical snapshot."]
    }.freeze

    PRESETS = {
      insurance: %w[name date_of_birth family_members joined_at employee_id designation phone],
      salary: %w[name employee_id bank_account_name bank_name bank_branch bank_account_number bank_ifsc bank_swift
        recorded_time_off_minutes recorded_work_minutes recorded_working_days calendar_weekdays national_holiday_dates salary_amount
        salary_currency salary_frequency salary_effective_on paid_reimbursements approved_reimbursements]
    }.freeze

    def self.metadata
      DEFINITIONS.map { |key, (label, description)| { key:, label:, description: } }
    end
  end
end
