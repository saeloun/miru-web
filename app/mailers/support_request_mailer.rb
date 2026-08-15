# frozen_string_literal: true

class SupportRequestMailer < ApplicationMailer
  def request
    @user = User.find(params[:user_id])
    @workspace_name = params[:workspace_name]
    @plan_label = params[:plan_label]
    @seat_count = params[:seat_count]
    @role = params[:role]
    prefix = params[:priority] ? "[Priority]" : "[Support]"
    subject = params[:subject].to_s.delete("\r\n")
    message = params[:message].to_s.delete("\r\n")
    body = <<~BODY
      Workspace: #{@workspace_name}
      Plan: #{@plan_label}
      Seats: #{@seat_count}
      Requester: #{@user.full_name} (#{@user.email})
      Role: #{@role}

      #{message}
    BODY
    mail(
      to: "hello@saeloun.com",
      reply_to: @user.email,
      subject: "#{prefix} #{subject}",
      body:
    )
  end
end
