# frozen_string_literal: true

class Payroll::ServicePeriod
  attr_reader :employment, :month, :sources

  def initialize(employment, month:, sources: nil)
    @employment, @month = employment, month.beginning_of_month
    @sources = sources || Payroll::ConsultantSources.new(company: employment.company, employments: [employment], month: @month)
  end

  def context
    @context ||= build_context
  end

  def digest
    Digest::SHA256.hexdigest(JSON.generate(context))
  end

  def blockers
    context.fetch("blockers")
  end

  def dates
    [month, employment.joined_at || month].max..[month.end_of_month, employment.resigned_at || month.end_of_month].min
  end

  def terms
    applicable.first
  end

  def applicable
    @applicable ||= dates.filter_map { |date| sources.terms_at(employment.id, date) }.uniq(&:id)
  end

  def required?
    dates.begin != month || dates.end != month.end_of_month || applicable.size > 1 || review.present?
  end

  def review
    sources.service_fee_review(employment.id)
  end

  def current_review
    review if blockers.empty? && review&.source_digest == digest && review.context == context
  end

  def fee
    return unless blockers.empty?

    current_review ? current_review.amount_minor.to_d / 100 : (terms&.monthly_fee unless required?)
  end

  def expected_minutes
    context.fetch("scheduled_minutes").to_d
  end

  def binding
    row = current_review
    return unless row

    { "id" => row.id.to_s, "amount_minor" => row.amount_minor.to_s, "reason" => row.reason,
      "source_digest" => row.source_digest, "context" => row.context.deep_dup }
  end

  def valid_binding?(value)
    value.nil? ? !required? && blockers.empty? : value.is_a?(Hash) && binding.present? && value == binding
  end

  private

    def build_context
      calendar = service_calendar
      minutes = scheduled_minutes(calendar[:holidays])
      routes = applicable.map { |term| [term.payment_source, term.legal_entity_name] }.uniq
      { "version" => "miru-service-period-v1", "company_id" => employment.company_id, "employment_id" => employment.id,
        "period" => month.iso8601, "service_from" => dates.begin.iso8601, "service_to" => dates.end.iso8601,
        "timezone" => sources.company.resolved_time_zone.name, "terms" => applicable.map { |term| term_context(term) },
        "holidays" => calendar[:holidays].map(&:iso8601), "scheduled_minutes" => minutes.to_s("F"),
        "payment_source" => routes.first&.first, "legal_entity_name" => routes.first&.last, "blockers" => context_blockers(calendar, minutes, routes) }
    end

    def service_calendar
      national = sources.national_holidays(dates)
      selected = sources.selected_holidays(employment.user_id, dates)
      { holidays: (national + selected.map(&:last)).uniq.sort, invalid: selected.any? { |recorded, configured| recorded != configured } }
    end

    def context_blockers(calendar, minutes, routes)
      failures = []
      failures << "missing_service_dates" unless employment.joined_at
      failures << "service_period_empty" if dates.begin > dates.end
      failures << "service_terms_missing" if dates.any? { |date| sources.terms_at(employment.id, date).nil? }
      failures << "holiday_date_requires_review" if calendar[:invalid]
      failures << "service_routing_changed" if routes.size > 1
      failures << "zero_expected_hours" unless minutes.positive?
      failures
    end

    def scheduled_minutes(holidays)
      dates.sum(0.to_d) do |date|
        term = sources.terms_at(employment.id, date)
        term && term.weekdays.include?(date.cwday) && !holidays.include?(date) ? term.hours_per_day * 60 : 0.to_d
      end
    end

    def term_context(term)
      term.attributes.slice("id", "effective_on", "monthly_fee", "hours_per_day", "weekdays", "payment_source", "legal_entity_name").transform_values do |value|
        value.is_a?(BigDecimal) ? value.to_s("F") : value.is_a?(Date) ? value.iso8601 : value
      end
    end
end
