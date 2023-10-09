# frozen_string_literal: true

module Calendars
  class MonthlyCalendarEventsService < ApplicationService
    attr_reader :calendar_id, :month, :year, :client

    def initialize(calendar_id, month, year, client)
      @calendar_id = calendar_id
      @month = month
      @year = year
      @client = client
    end

    def get_events_for_month
      service = Google::Apis::CalendarV3::CalendarService.new
      service.authorization = client
      start_time = DateTime.new(year.to_i, month.to_i, 1, 0, 0, 0, "+00:00")
      end_time = DateTime.new(year.to_i, month.to_i, -1, 23, 59, 59, "+00:00")
      meetings = []
      page_token = nil

      begin
        @event_list = service.list_events(
          calendar_id,
          page_token:,
          time_min: start_time.rfc3339,
          time_max: end_time.rfc3339,
          single_events: true
        )
        all_events = filter_events(events: @event_list.items, start_time:, end_time:)

        meetings.concat(all_events)

        if @event_list.next_page_token != page_token
          page_token = @event_list.next_page_token
        else
          page_token = nil
        end
      end while !page_token.nil?

      meetings
    end

    private

      def filter_events(events:, start_time:, end_time:)
        events.select do |item|
          next unless item.start.date_time.present? || item.end.date_time.present?

          item_start_time = item.start.date_time
          item_end_time = item.end.date_time

          (item_start_time >= start_time && item_end_time <= end_time)
        end
      end
  end
end
