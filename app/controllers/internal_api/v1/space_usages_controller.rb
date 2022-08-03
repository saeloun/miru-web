# frozen_string_literal: true

require "rest-client"

class InternalApi::V1::SpaceUsagesController < InternalApi::V1::ApplicationController
  include Timesheet

  skip_after_action :verify_authorized, only: [:index]
  # after_action :verify_policy_scoped, only: [:index]

  def index
    space_usages = SpaceUsage.during(
      params[:from],
      params[:to]).order(id: :desc)
    entries = formatted_entries_by_date(space_usages)
    render json: { entries: }, status: :ok
  end

  def create
    authorize SpaceUsage
    space_usage = current_company.space_usages.new(space_usage_params)
    space_usage.user = current_company.users.find(params[:user_id])
    if space_usage.save
      slack_webhook_url = ENV.fetch("SLACK_WEBHOOK_URL")
      entry = space_usage.formatted_entry
      user_name = entry[:user_name]
      space_name = entry[:space_name]
      purpose_name = entry[:purpose_name]
      note = entry[:note]
      start_duration = space_usage.formatted_duration_12hr(:start)
      end_duration = space_usage.formatted_duration_12hr(:end)

      payload_msg = {
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "Space Occupied :white_check_mark:",
              "emoji": true
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Please take a note the *#{space_name}* will be occupied for *#{purpose_name}* meeting."
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "By: *#{user_name}*\nFrom: *#{start_duration} - #{end_duration}*\nNote: #{note}"
            },
            "accessory": {
              "type": "image",
              "image_url": "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
              "alt_text": "calendar thumbnail"
            }
          }
        ]
      }
      if slack_webhook_url
        response_data = RestClient.post slack_webhook_url, payload_msg.to_json, { content_type: :json, accept: :json }
        slack_info = response_data.body
      end
      render json: {
        notice: I18n.t("space_usage.create.message"),
        entry:
      }
    else
      render json: { error: space_usage.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def update
    authorize current_space_usage
    if current_space_usage.update(space_usage_params)
      slack_webhook_url = ENV.fetch("SLACK_WEBHOOK_URL")
      entry = current_space_usage.formatted_entry
      user_name = entry[:user_name]
      space_name = entry[:space_name]
      purpose_name = entry[:purpose_name]
      note = entry[:note]
      start_duration = current_space_usage.formatted_duration_12hr(:start)
      end_duration = current_space_usage.formatted_duration_12hr(:end)

      payload_msg = {
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "Space Slot Updated :twisted_rightwards_arrows:",
              "emoji": true
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Please take a note, the *#{space_name}* will be occupied for *#{purpose_name}* meeting."
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "By: *#{user_name}*\nFrom: *#{start_duration} - #{end_duration}*\nNote: #{note}"
            },
            "accessory": {
              "type": "image",
              "image_url": "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
              "alt_text": "calendar thumbnail"
            }
          }
        ]
      }
      if slack_webhook_url
        response_data = RestClient.post slack_webhook_url, payload_msg.to_json, { content_type: :json, accept: :json }
        slack_info = response_data.body
      end
      render json: {
        notice: I18n.t("space_usage.update.message"),
        entry: current_space_usage.formatted_entry
      }, status: :ok
    else
      render json: { error: space_usage.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize current_space_usage
    if current_space_usage.destroy
      slack_webhook_url = ENV.fetch("SLACK_WEBHOOK_URL")
      entry = current_space_usage.formatted_entry
      user_name = entry[:user_name]
      space_name = entry[:space_name]
      start_duration = current_space_usage.formatted_duration_12hr(:start)
      end_duration = current_space_usage.formatted_duration_12hr(:end)

      payload_msg = {
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "Space Slot Unoccupied :no_entry:",
              "emoji": true
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Please take a note, the *#{space_name}* will be unoccupied."
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "By: *#{user_name}*\nFrom: *#{start_duration} - #{end_duration}*"
            },
            "accessory": {
              "type": "image",
              "image_url": "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
              "alt_text": "calendar thumbnail"
            }
          }
        ]
      }
      if slack_webhook_url
        response_data = RestClient.post slack_webhook_url, payload_msg.to_json, { content_type: :json, accept: :json }
        slack_info = response_data.body
      end
      render json: { notice: I18n.t("space_usage.destroy.message") }
    else
      # TBD
    end
  end

  private

    def current_space_usage
      @_current_space_usage ||= current_company.space_usages.find(params[:id])
    end

    def space_usage_params
      params.require(:space_usage).permit(
        :space_code, :purpose_code,
        :start_duration, :end_duration, :work_date, :note, :restricted
      )
    end
end
