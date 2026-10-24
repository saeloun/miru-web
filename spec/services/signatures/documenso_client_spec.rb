# frozen_string_literal: true

require "rails_helper"

RSpec.describe Signatures::DocumensoClient do
  let(:origin) { "https://signing.example.test" }
  let(:api_key) { "api_synthetic_private_key" }
  let(:client) { described_class.new(api_key:) }
  let(:headers) { { "Content-Type" => "application/json" } }
  let(:pdf) { File.binread(Rails.root.join("spec/fixtures/files/signature-rendering.pdf")) }

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return(origin)
  end

  it "uploads an individual DOCUMENT using a JSON payload and repeated files parts" do
    payload = { title: "Synthetic agreement", type: "DOCUMENT", externalId: "miru-unique-operation" }
    server = TCPServer.new("127.0.0.1", 0)
    endpoint = "127.0.0.1:#{server.addr[1]}"
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return("http://#{endpoint}")
    WebMock.disable_net_connect!(allow: endpoint)
    receiver = Thread.new do
      Timeout.timeout(5) do
        socket = server.accept
        request_line = socket.gets
        request_headers = {}
        while (line = socket.gets) != "\r\n"
          key, value = line.split(":", 2)
          request_headers[key.downcase] = value.strip
        end
        body = socket.read(Integer(request_headers.fetch("content-length")))
        response = '{"id":"envelope_1"}'
        socket.write("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: #{response.bytesize}\r\nConnection: close\r\n\r\n#{response}")
        [request_line, request_headers, body]
      ensure
        socket&.close
      end
    end

    VCR.turned_off { expect(client.create(payload:, files: [pdf, pdf])).to eq("id" => "envelope_1") }
    request_line, request_headers, body = receiver.value
    expect(request_line).to eq("POST /api/v2/envelope/create HTTP/1.1\r\n")
    expect(request_headers.fetch("content-type")).to match(/multipart\/form-data; boundary=/)
    expect(request_headers.fetch("authorization")).to eq(api_key)
    expect(body).to include('name="payload"', JSON.generate(payload))
    expect(body.scan('name="files"').size).to eq(2)
    expect(body).to include('filename="document-1.pdf"', 'filename="document-2.pdf"', pdf)
    expect(body).not_to include('name="files[]"')
  ensure
    receiver&.kill
    server&.close
    WebMock.disable_net_connect!
  end

  it "uses fixed API paths for fetch, distribution, cancellation and reminders" do
    get = stub_request(:get, "#{origin}/api/v2/envelope/envelope_1").to_return(body: '{"status":"DRAFT"}', headers:)
    distribute = stub_request(:post, "#{origin}/api/v2/envelope/distribute")
      .with(body: { envelopeId: "envelope_1" }).to_return(body: '{"success":true}', headers:)
    cancel = stub_request(:post, "#{origin}/api/v2/envelope/cancel")
      .with(body: { envelopeId: "envelope_1", reason: "Cancelled in Miru" }).to_return(body: '{"success":true}', headers:)
    remind = stub_request(:post, "#{origin}/api/v2/envelope/redistribute")
      .with(body: { envelopeId: "envelope_1", recipients: [12, 13] }).to_return(body: '{"success":true}', headers:)

    expect(client.get("envelope_1")).to eq("status" => "DRAFT")
    client.distribute("envelope_1")
    client.cancel("envelope_1")
    client.remind("envelope_1", recipient_ids: [12, 13])
    [get, distribute, cancel, remind].each { |request| expect(request).to have_been_requested.once }
  end

  it "downloads original bytes from the trusted item endpoint, without claiming completion" do
    stub_request(:get, "#{origin}/api/v2/envelope/item/item_1/download?version=original")
      .to_return(body: pdf, headers: { "Content-Type" => "application/pdf" })
    expect(client.original("item_1")).to eq(pdf)
  end

  it "rejects missing keys, header injection and credentials in object inspection" do
    [nil, "", "api_bad\r\nInjected: yes", "a" * 4097].each do |value|
      expect { described_class.new(api_key: value) }.to raise_error(described_class::ConfigurationError)
    end
    expect(client.inspect).not_to include(api_key)
    expect(WebMock).not_to have_requested(:any, /example.test/)
  end

  it "accepts only a server-configured origin and never tenant-supplied URLs" do
    [nil, "", "file:///etc/passwd", "https://user:secret@sign.example.test", "https://sign.example.test/path",
      "https://sign.example.test?next=bad", "https://sign.example.test#bad", "http://remote.example.test"].each do |value|
      allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return(value)
      expect { described_class.new(api_key:) }.to raise_error(described_class::ConfigurationError)
    end
    expect { described_class.new(api_key:, origin:) }.to raise_error(ArgumentError)
  end

  it "permits HTTP loopback only outside production" do
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return("http://127.0.0.1:3318")
    expect { client }.not_to raise_error
    allow(Rails.env).to receive(:production?).and_return(true)
    expect { described_class.new(api_key:) }.to raise_error(described_class::ConfigurationError)
  end

  it "rejects IDs that could alter the API path before making a request" do
    ["../other", "id?token=secret", "https://other.example.test", "a" * 201, ""].each do |id|
      expect { client.get(id) }.to raise_error(described_class::Rejected)
      expect { client.original(id) }.to raise_error(described_class::Rejected)
    end
    expect(WebMock).not_to have_requested(:any, /example.test/)
  end

  it "bounds JSON and upload inputs before any mutation" do
    [{ payload: { title: "a" * 128.kilobytes }, files: [pdf] },
      { payload: {}, files: [] }, { payload: {}, files: [pdf] * 11 },
      { payload: {}, files: ["a" * (5.megabytes + 1)] },
      { payload: {}, files: ["a" * 5.megabytes] * 6 }].each do |attributes|
      expect { client.create(**attributes) }.to raise_error(described_class::Rejected)
    end
    expect(WebMock).not_to have_requested(:post, /example.test/)
  end

  it "does not retry an ambiguous mutation or expose provider error bodies" do
    request = stub_request(:post, "#{origin}/api/v2/envelope/create").to_timeout
    expect { client.create(payload: {}, files: [pdf]) }.to raise_error(described_class::Uncertain) do |error|
      expect(error.message).not_to include(origin, api_key)
      expect(error.cause).to be_nil
    end
    expect(request).to have_been_requested.once

    request.to_return(status: 500, body: "private provider trace #{api_key}")
    expect { client.create(payload: {}, files: [pdf]) }.to raise_error(described_class::Uncertain, /outcome could not be confirmed/)
    expect(request).to have_been_requested.twice
  end

  it "separates a rejected request from an uncertain outcome, without logging private details" do
    stub_request(:post, "#{origin}/api/v2/envelope/distribute").to_return(status: 400, body: "private signer@example.test #{api_key}")
    expect { client.distribute("envelope_1") }.to raise_error(described_class::Rejected, "The signing provider rejected the request.")
    stub_request(:get, "#{origin}/api/v2/envelope/envelope_1").to_timeout
    expect { client.get("envelope_1") }.to raise_error(described_class::Unavailable)
  end

  it "never follows redirects, including for original downloads" do
    stub_request(:get, "#{origin}/api/v2/envelope/item/item_1/download?version=original")
      .to_return(status: 302, headers: { "Location" => "https://untrusted.example.test/private" })
    expect { client.original("item_1") }.to raise_error(described_class::Unavailable)
    expect(WebMock).not_to have_requested(:any, /untrusted.example.test/)
  end

  it "bounds response bytes, rejects compressed responses and requires JSON objects" do
    request = stub_request(:get, "#{origin}/api/v2/envelope/envelope_1")
    [
      { body: '{"data":"' + "a" * 1.megabyte + '"}', headers: },
      { body: "{}", headers: headers.merge("Content-Length" => "9999999999") },
      { body: "{}", headers: headers.merge("Content-Encoding" => "gzip") },
      { body: "[]", headers: }, { body: "not JSON", headers: },
      { body: "{}", headers: { "Content-Type" => "text/html" } },
      { body: "[" * 50 + "]" * 50, headers: }
    ].each do |response|
      request.to_return(**response)
      expect { client.get("envelope_1") }.to raise_error(described_class::Unavailable)
    end

    stub_request(:get, "#{origin}/api/v2/envelope/item/item_1/download?version=original")
      .to_return(body: "a" * (5.megabytes + 1), headers: { "Content-Type" => "application/pdf" })
    expect { client.original("item_1") }.to raise_error(described_class::Unavailable)
  end

  it "treats malformed success responses to a mutation as uncertain" do
    stub_request(:post, "#{origin}/api/v2/envelope/distribute").to_return(body: "not JSON", headers:)
    expect { client.distribute("envelope_1") }.to raise_error(described_class::Uncertain)
  end

  it "requires a usable creation ID and an explicit successful mutation result" do
    request = stub_request(:post, "#{origin}/api/v2/envelope/create")
    [{}, { id: "../other" }, { id: 12 }].each do |value|
      request.to_return(body: value.to_json, headers:)
      expect { client.create(payload: {}, files: [pdf]) }.to raise_error(described_class::Uncertain)
    end
    request = stub_request(:post, "#{origin}/api/v2/envelope/distribute")
    [{}, { success: false }, { success: "true" }].each do |value|
      request.to_return(body: value.to_json, headers:)
      expect { client.distribute("envelope_1") }.to raise_error(described_class::Uncertain)
    end
  end
end
