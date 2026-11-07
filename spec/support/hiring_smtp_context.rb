# frozen_string_literal: true

require "socket"

RSpec.shared_context "hiring SMTP transport" do
  def with_smtp_response(quit_status: 221, reject_mail: false)
    server = TCPServer.new("127.0.0.1", 0)
    commands, messages = [], []
    listener = Thread.new do
      socket = server.accept
      socket.write("220 localhost synthetic SMTP\r\n")
      while (line = socket.gets)
        command = line.split.first
        commands << command
        case command
        when "EHLO", "HELO", "RCPT" then socket.write("250 OK\r\n")
        when "MAIL" then socket.write(reject_mail ? "550 Rejected\r\n" : "250 OK\r\n")
        when "DATA"
          socket.write("354 End with dot\r\n")
          body = +"".b
          while (body_line = socket.gets)
            break if body_line == ".\r\n"

            body << body_line
          end
          messages << body
          socket.write("250 Accepted\r\n")
        when "QUIT"
          socket.write("#{quit_status} Session closed\r\n")
          break
        end
      end
    ensure
      socket&.close
    end
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *args|
      original.call(*args).tap do |delivery|
        delivery.message.delivery_method(:smtp, address: "127.0.0.1", port: server.addr[1], domain: "localhost",
          enable_starttls: false, enable_starttls_auto: false, open_timeout: 2, read_timeout: 2)
        delivery.message.perform_deliveries = true
      end
    end
    Timeout.timeout(5) { yield commands, messages }
    listener.value
  ensure
    server&.close
    listener&.kill if listener&.alive?
    listener&.join
  end
end
