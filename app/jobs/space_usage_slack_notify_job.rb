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

    {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Space Occupied :white_check_mark:",
            emoji: true
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Please take a note the *#{entry[:space_name]}* will be occupied for *#{entry[:purpose_name]}* meeting."
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "By: *#{entry[:user_name]}*\nFrom: *#{@space_usage.formatted_duration_12hr(:start)} - #{@space_usage.formatted_duration_12hr(:end)}*\nNote: #{entry[:note]}"
          },
          accessory: {
            type: "image",
            image_url: "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
            alt_text: "calendar thumbnail"
          }
        }
      ]
    }
  end

  def update_space_payload_msg
    entry = @space_usage.formatted_entry

    {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Space Occupation Changed :twisted_rightwards_arrows:",
            emoji: true
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Please take a note, the *#{entry[:space_name]}* will be occupied for *#{entry[:purpose_name]}* meeting."
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "By: *#{entry[:user_name]}*\nFrom: *#{@space_usage.formatted_duration_12hr(:start)} - #{@space_usage.formatted_duration_12hr(:end)}*\nNote: #{entry[:note]}"
          },
          accessory: {
            type: "image",
            image_url: "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
            alt_text: "calendar thumbnail"
          }
        }
      ]
    }
  end

  def delete_space_payload_msg
    entry = @space_usage.formatted_entry

    {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Space Unoccupied :no_entry:",
            emoji: true
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Please take a note, the *#{entry[:space_name]}* is unoccupied."
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "By: *#{entry[:user_name]}*\nFrom: *#{@space_usage.formatted_duration_12hr(:start)} - #{@space_usage.formatted_duration_12hr(:end)}*"
          },
          accessory: {
            type: "image",
            image_url: "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
            alt_text: "calendar thumbnail"
          }
        }
      ]
    }
  end
end
