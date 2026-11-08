# frozen_string_literal: true

# rubocop:disable Rails/ApplicationMailer -- Private transport failures must reach the durable delivery worker.
class PayrollIndiaMailer < ActionMailer::Base
  # rubocop:enable Rails/ApplicationMailer
  include PrivateMailDelivery
  default from: ApplicationMailer.default.fetch(:from), reply_to: ApplicationMailer.default.fetch(:reply_to)

  def report(delivery_id)
    delivery = PayrollIndiaDelivery.find(delivery_id)
    handoff = delivery.payroll_india_handoff
    report = handoff.report
    line, bank = report.fetch("line"), report.fetch("bank_details")
    amounts = line.fetch("amounts")
    @summary = {
      "Consultant" => report.fetch("consultant_name"), "Period" => report.fetch("period"),
      "Legal contracting entity" => report.fetch("legal_entity"), "Handoff ID" => handoff.id,
      "Approved revision" => report.fetch("revision_digest"), "Recorded hours" => report.fetch("recorded_hours"),
      "Working days (recorded hours / 8)" => report.fetch("working_days"),
      "Approved paid leave" => "Not classified in source records",
      "Monthly consultancy fee" => inr(BigDecimal(report.fetch("monthly_fee")) * 100),
      "Reviewed unpaid hours" => report["confirmed_unpaid_hours"].presence || "Not recorded",
      "Final consultancy fee after adjustments and deductions" => inr(amounts.fetch("net_minor") - amounts.fetch("reimbursements_minor", 0)),
      "Total reimbursements" => inr(amounts.fetch("reimbursements_minor", 0)), "Total INR payable" => inr(amounts.fetch("net_minor"))
    }
    @sections = [
      { title: "Recorded leave", headings: ["Date", "Hours"], rows: Array(report["leave_entries"]).map do |entry|
        [entry.fetch("date"), (BigDecimal(entry.fetch("duration_minutes")) / 60).to_s("F")]
      end },
      { title: "Approved earnings adjustments", headings: ["Description", "Amount"], rows: adjustment_rows(line.fetch("extras")) },
      { title: "Withholding and deductions", headings: ["Description", "Amount"], rows: adjustment_rows(line.fetch("deductions")) },
      { title: "Reserved reimbursement claims", headings: ["Claim", "Date", "Description", "Amount"], rows: report.fetch("reimbursements").map do |entry|
        [entry["claim_id"] || "—", entry["date"] || "—", entry.fetch("label"), inr(entry.fetch("amount_minor"))]
      end }
    ]
    @bank = { "Account holder" => bank.fetch("bank_account_name"), "Bank" => bank.fetch("bank_name"),
              "Account number" => bank.fetch("bank_account_number"), "IFSC" => bank.fetch("bank_ifsc") }
    mail(to: report.fetch("accounts_email"), subject: "Confidential India payroll report — #{report.fetch('period')}",
      message_id: "payroll-india-#{delivery.id}@miru")
  end

  private

    def inr(minor)
      ActiveSupport::NumberHelper.number_to_currency(BigDecimal(minor) / 100, unit: "INR ", precision: 2)
    end

    def adjustment_rows(entries)
      entries.map { |entry| [entry["reason"].presence || entry.fetch("code").humanize, inr(entry.fetch("amount_minor"))] }
    end
end
