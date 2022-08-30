# frozen_string_literal: true

class SpaceUsageSlackNotifyJob < ApplicationJob
  SLACK_WEBHOOK_URL = ENV.fetch("SLACK_WEBHOOK_URL", nil)

  queue_as :default

  def perform(action_name, space_usage_attributes)
    action_name = action_name.to_sym
    return unless SLACK_WEBHOOK_URL

    @space_usage = if [:create, :update].include?(action_name)
      SpaceUsage.find(space_usage_attributes["id"])
    else
      SpaceUsage.new(space_usage_attributes)
    end

    payload_msg = case action_name
                  when :create
                    create_space_payload_msg
                  when :update
                    update_space_payload_msg
                  when :delete
                    delete_space_payload_msg
                  else
                    nil
    end
    if payload_msg
      RestClient.post SLACK_WEBHOOK_URL, payload_msg.to_json, { content_type: :json, accept: :json }
    end
  end

  def create_space_payload_msg
    entry = @space_usage.formatted_entry
    bookingDate = DateTime.parse("#{entry[:work_date]}").strftime("%d/%m/%Y")
    member_names = @space_usage.company.users.where(id: @space_usage.team_members)
      .map(&:full_name).map { |i| "*#{i}*" }.to_sentence

    {
      text: "Space occupied :white_check_mark:",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Space occupied :white_check_mark: by #{entry[:user_name]}",
            emoji: true
          }
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": [
                "*#{entry[:space_name]}* will be occupied for *#{entry[:purpose_name]}* meeting on *#{bookingDate}* from *#{@space_usage.formatted_duration_12hr(:start)}* to *#{@space_usage.formatted_duration_12hr(:end)}*",
                member_names.present? ? "Team Members: #{member_names}" : nil,
                entry[:note].present? ? "Note: #{entry[:note]}" : nil,
              ].compact.join(" \n")
            }
          ]
        }
      ].compact
    }
  end

  def update_space_payload_msg
    entry = @space_usage.formatted_entry
    bookingDate = DateTime.parse("#{entry[:work_date]}").strftime("%d/%m/%Y")
    member_names = @space_usage.company.users.where(id: @space_usage.team_members)
      .map(&:full_name).map { |i| "*#{i}*" }.to_sentence

    {
      text: "Space occupation changed :twisted_rightwards_arrows:",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Space occupation changed :twisted_rightwards_arrows: by #{entry[:user_name]}",
            emoji: true
          }
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": [
                "*#{entry[:space_name]}* will be occupied for *#{entry[:purpose_name]}* meeting on *#{bookingDate}* from *#{@space_usage.formatted_duration_12hr(:start)}* to *#{@space_usage.formatted_duration_12hr(:end)}*",
                member_names.present? ? "Team Members: #{member_names}" : nil,
                entry[:note].present? ? "Note: #{entry[:note]}" : nil,
              ].compact.join(" \n")
            }
          ]
        }
      ].compact
    }
  end

  def delete_space_payload_msg
    entry = @space_usage.formatted_entry
    bookingDate = DateTime.parse("#{entry[:work_date]}").strftime("%d/%m/%Y")

    {
      text: "Space unoccupied :no_entry:",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Space unoccupied :no_entry: by #{entry[:user_name]}",
            emoji: true
          }
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": "*#{entry[:space_name]}* is unoccupied for *#{entry[:purpose_name]}* meeting on *#{bookingDate}* from *#{@space_usage.formatted_duration_12hr(:start)}* to *#{@space_usage.formatted_duration_12hr(:end)}*."
            }
          ]
        }
      ]
    }
  end
end
