# frozen_string_literal: true

# Explicit invocation only; lifecycle preload must run before rails_helper.
# DOCUMENSO_LIVE_QA_CONFIG names a root-owned 0640 JSON file under root-owned operation_root (0711).
# Writable control/output/storage/profile children are owned by the QA UID (0700).
# schema_version:1; operation_root,admission_path,admission_sha256,database,storage_dir,output_dir;
# miru_origin,provider_origin,mailpit_origin (http://127.0.0.1:port),miru_smtp_port;
# identities:{miru:{name,email,password},provider:{name,email,password},signer:{name,email}};
# browsers:[{role:miru|provider|signer,cdp_url,pid,profile_dir,argv}];
# source_assets:[{url,sha256,bytes}] for /source/{source.tar.gz,SHA256SUMS,SOURCE-ADMISSION.md}.
# admission:{schema_version:1,operation_root,miru_head,database,storage_dir,worker_pid,deadline_epoch,
# image:{config_sha256,platform,rootfs_verified,diff_ids},guards:{blank_dotenv,credentials_absent,
# os_loopback_only,csrf,real_solid_queue,local_smtp,normal_brave}}. All guards must be true.
# Lifecycle serves /qa-embed containing only iframe#qa-provider-frame (100vw/100vh,border:0).
# Its stable worker PID waits for control/rspec-database-ready.json before registering any queue rows.
# Worker publishes owned 0600 boot-<pid>.json with pid,database,csrf,real_solid_queue,local_smtp.
# Only summary.json,safe-events.jsonl,share-{client,consultant}.png and the fixed screenshot
# names used below may be published. Config, logs, browser profiles and private-downloads may not.

require "json"
require "pathname"
require "digest"
require "uri"
require "net/http"
require "cgi"
require "set"
require "open3"

module DocumensoLive
  HEAD = "4aa6ff5744267b1942bbf614fac322c8c1184bf7"
  CONFIG_SHA = "6b1d4c45a24da11e2f1c66da8eb486832660e4565334689c91ef9353fe158f49"
  ROOTFS_SHA = "69fbb4154339321f3932a9489db5c499f5efbac4bb58e350e676a9ef08d68e31"
  SOURCE_RELEASE = "https://github.com/saeloun/miru-web/releases/tag/documenso-source-4aa6ff574"
  SOURCE_ASSETS = {
    "/source/source.tar.gz" => [58_498_058, "5b94ae4dc456b853964100cebc1263819bac762b7c9205cc8a8675f8ae916ee2"],
    "/source/SHA256SUMS" => [200, "462ca3b2e8dca0ca4f429f19297482bf1c1d111a33746cd80158bd04685ddfb9"],
    "/source/SOURCE-ADMISSION.md" => [3562, "ea7e75b37c2663c5dc3c3a841d29e7e8f67dd98240300a2c4a7d7db83cf76e9f"]
  }.freeze
  TYPES = %w[Signature Initials Date Name Email Text Number Checkbox Dropdown].freeze
  NUMBER_VALUE = "730419"
  UNSAFE_FLAGS = /no-sandbox|disable-setuid-sandbox|disable-web-security|disable-site-isolation|disable-features|ignore-certificate-errors|allow-insecure-localhost/
  class Failure < StandardError; end

  def self.check(condition, message)
    raise Failure, message unless condition
  end

  def self.owned_path(root, value)
    path = Pathname.new(value).realpath
    check(path.to_s.start_with?(root.to_s + "/"), "Unowned QA path")
    path
  end

  def self.local_origin(value)
    uri = URI(value)
    check(uri.scheme == "http" && uri.host == "127.0.0.1" && uri.port.between?(1024, 65_535) &&
      uri.path.empty? && uri.query.nil? && uri.fragment.nil? && uri.userinfo.nil?, "Nonlocal QA origin")
    value
  end

  def self.message_link(message, origin, path, title = nil)
    body = CGI.unescapeHTML("#{message['HTML']} #{message['Text']}")
    return unless title.nil? || body.include?(title)

    body.scan(%r{https?://[^\s<>"']+}).find do |candidate|
      uri = URI(candidate)
      "#{uri.scheme}://#{uri.host}:#{uri.port}" == origin && uri.userinfo.nil? && uri.path.match?(path)
    rescue URI::InvalidURIError
      false
    end
  end

  def self.debug_port(argv)
    flags = argv.grep(/\A--remote-debugging-port=/)
    check(flags.size == 1 && flags.first.match?(/\A--remote-debugging-port=\d+\z/), "Missing unique CDP port")
    port = flags.first.split("=").last.to_i
    check(port.between?(1024, 65_535), "Invalid CDP port")
    port
  end

  # Pure offline boundary controls; exits before config, Rails or any IO to services.
  if ARGV == ["--self-check"]
    origin = "http://127.0.0.1:4000"
    path = %r{\A/sign/[A-Za-z0-9_-]+\z}
    check(message_link({ "Text" => "current #{origin}/sign/fresh" }, origin, path, "current") == "#{origin}/sign/fresh", "Fresh invitation rejected")
    check(message_link({ "Text" => "current #{origin}/sign/old/complete" }, origin, path).nil?, "Completion accepted as invitation")
    check(message_link({ "Text" => "old #{origin}/sign/old" }, origin, path, "current").nil?, "Wrong packet accepted")
    check(message_link({ "Text" => "current http://example.invalid:4000/sign/fresh" }, origin, path).nil?, "Foreign invitation accepted")
    check(debug_port(["--remote-debugging-port=4567"]) == 4567, "Owned CDP port rejected")
    [[], ["--remote-debugging-port=0"], ["--remote-debugging-port=1"], ["--remote-debugging-port=4567", "--remote-debugging-port=4568"]].each do |flags|
      begin
        debug_port(flags)
      rescue Failure
        next
      end
      raise Failure, "Invalid CDP port accepted"
    end
    puts "Offline invitation and CDP boundary controls passed"
    exit
  end

  check(defined?(DOCUMENSO_LIVE_PREBOOT_VERIFIED) && DOCUMENSO_LIVE_PREBOOT_VERIFIED == true,
    "Owned lifecycle preload is required before Rails boot")
  check(ENV["CI"] == "true", "Explicit CI runtime is required")
  config_path = Pathname.new(ENV.fetch("DOCUMENSO_LIVE_QA_CONFIG")).realpath
  check(config_path.stat.uid.zero? && config_path.stat.mode & 0o777 == 0o640 &&
    config_path.size <= 65_536, "Unsafe QA configuration")
  CONFIG = JSON.parse(config_path.read).freeze
  check(CONFIG.fetch("schema_version") == 1, "Unsupported QA configuration")
  ROOT = Pathname.new(CONFIG.fetch("operation_root")).realpath
  check(ROOT.stat.uid.zero? && ROOT.stat.mode & 0o777 == 0o711, "Unsafe operation directory")
  check(config_path.parent == ROOT, "Configuration must have an immutable parent")
  CONTROL = owned_path(ROOT, ROOT.join("control").to_s)
  OUTPUT = owned_path(ROOT, CONFIG.fetch("output_dir"))
  STORAGE = owned_path(ROOT, CONFIG.fetch("storage_dir"))
  [CONTROL, OUTPUT, STORAGE].each do |path|
    check(path.stat.uid == Process.uid && path.stat.mode & 0o777 == 0o700, "Unsafe writable QA directory")
  end
  admission_path = owned_path(ROOT, CONFIG.fetch("admission_path"))
  check(admission_path.parent == ROOT && admission_path.stat.uid.zero? && admission_path.stat.mode & 0o777 == 0o640 && admission_path.size <= 65_536 &&
    Digest::SHA256.file(admission_path).hexdigest == CONFIG.fetch("admission_sha256"), "Admission receipt changed")
  ADMISSION = JSON.parse(admission_path.read).freeze
  image = ADMISSION.fetch("image")
  ids = image.fetch("diff_ids")
  check(ADMISSION.fetch("schema_version") == 1 && ADMISSION.fetch("operation_root") == ROOT.to_s &&
    ADMISSION.fetch("miru_head") == HEAD && image.fetch("platform") == "linux/amd64" &&
    image.fetch("config_sha256") == CONFIG_SHA && image.fetch("rootfs_verified") == true &&
    ids.size == 23 && ids.all? { |id| id.match?(/\Asha256:[0-9a-f]{64}\z/) } &&
    Digest::SHA256.hexdigest(ids.join("\n") + "\n") == ROOTFS_SHA, "Exact image admission is missing")
  check(%w[blank_dotenv credentials_absent os_loopback_only csrf real_solid_queue local_smtp normal_brave]
    .all? { |key| ADMISSION.fetch("guards").fetch(key) == true }, "Runtime guards are missing")
  %w[miru_origin provider_origin mailpit_origin].each { |key| local_origin(CONFIG.fetch(key)) }
  check(CONFIG.fetch("browsers").map { |row| row.fetch("role") }.sort == %w[miru provider signer], "Three profiles required")
  %w[cdp_url pid profile_dir].each do |key|
    check(CONFIG.fetch("browsers").map { |row| row.fetch(key) }.uniq.size == 3, "Browser profiles must be distinct")
  end
  CONFIG.fetch("identities").each_value do |identity|
    check(identity.fetch("email").match?(/\A[a-z0-9+_.-]+@miru-qa\.invalid\z/i) &&
      identity.fetch("name").is_a?(String) && identity.fetch("name").size.between?(1, 100), "Non-synthetic identity")
  end
  %w[miru provider].each do |role|
    password = CONFIG.fetch("identities").fetch(role).fetch("password")
    check(password.is_a?(String) && password.bytesize.between?(16, 256), "Invalid synthetic fixture password")
  end
end

require Rails.root.join("config/environment").to_s
database = ActiveRecord::Base.with_connection { |connection| connection.raw_connection.db }
DocumensoLive.check(Rails.env.test? && database == DocumensoLive::CONFIG.fetch("database") &&
  database == DocumensoLive::ADMISSION.fetch("database") && database.match?(/\Amiru_documenso_live_[a-z0-9_]+_test\z/),
  "Owned test database must be verified before RSpec cleanup hooks")
require Rails.root.join("spec/rails_helper").to_s

%i[cuprite cuprite_headless selenium_chrome_headless selenium_chrome chrome_headless chrome].each do |name|
  Capybara.register_driver(name) do |_app|
    raise DocumensoLive::Failure, "Default browser launch refused; owned live CDP driver required"
  end
end

RSpec.describe "Exact built Documenso live-provider acceptance", type: :system, js: true do
  delegate :check, to: DocumensoLive

  # Rails' automatic failure capture can contain keys or a signing URL. Only explicit
  # safe-state screenshots below are evidence; lifecycle removes private runtime data.
  def take_failed_screenshot; end

  def stopped(error)
    if @summary
      @summary[:error_class] ||= error.class.name
      location = error.backtrace_locations&.find { |row| row.path == __FILE__ && row.base_label != "check" }
      line = location&.lineno
      @summary[:failure_line] ||= line if line.is_a?(Integer) && line.between?(1, 9999)
    end
    raise DocumensoLive::Failure, "Live provider acceptance stopped in #{@phase || 'setup'}", cause: nil
  end

  def progress(phase, packet = nil)
    @phase = phase
    check(Time.now.to_f < @deadline - 300, "QA cleanup reserve reached")
    check(@console_errors.values.all?(&:empty?), "Browser console error; stop acceptance")
    row = { schema_version: 1, phase:, passed: true }
    row[:packet] = packet if packet
    File.open(DocumensoLive::OUTPUT.join("safe-events.jsonl"), "a", 0o600) { |file| file.puts(JSON.generate(row)) }
  end

  def wait_for(message, seconds = 40)
    limit = [Process.clock_gettime(Process::CLOCK_MONOTONIC) + seconds,
             Process.clock_gettime(Process::CLOCK_MONOTONIC) + @deadline - Time.now.to_f - 300].min
    loop do
      return if yield
      raise DocumensoLive::Failure, message if Process.clock_gettime(Process::CLOCK_MONOTONIC) >= limit
      sleep 0.2
    end
  end

  def capture(session, name)
    session.save_screenshot(DocumensoLive::OUTPUT.join("screenshots", name), full: false)
  end

  def viewport(session, width)
    session.current_window.resize_to(width, 1000)
    check(session.evaluate_script("innerWidth === #{width} && document.documentElement.scrollWidth <= innerWidth + 1"),
      "Viewport or horizontal overflow contract failed")
  end

  def local_get(url, maximum = 1_048_576)
    uri = URI(url)
    origins = %w[miru_origin provider_origin mailpit_origin].map { |key| @config.fetch(key) }
    check(origins.include?("#{uri.scheme}://#{uri.host}:#{uri.port}") && uri.userinfo.nil?, "Nonlocal HTTP refused")
    bytes = +"".b
    result = nil
    Net::HTTP.start(uri.host, uri.port, nil, open_timeout: 5, read_timeout: 10) do |http|
      http.request(Net::HTTP::Get.new(uri.request_uri)) do |response|
        response.read_body do |chunk|
          check(bytes.bytesize + chunk.bytesize <= maximum, "HTTP body exceeds bound")
          bytes << chunk
        end
        result = [response, bytes]
      end
    end
    result
  end

  def mailbox(email)
    query = URI.encode_www_form(query: "to:#{email}", limit: 100)
    response, body = local_get("#{@config.fetch('mailpit_origin')}/api/v1/search?#{query}")
    check(response.code == "200", "Local mailbox failed")
    JSON.parse(body).fetch("messages", []).select do |item|
      item.fetch("To", []).any? { |person| person.fetch("Address").casecmp?(email) }
    end
  end

  def mail_ids(email)
    mailbox(email).map { |item| item.fetch("ID") }.to_set
  end

  def mail_to(email, subject, earlier)
    found = nil
    wait_for("Expected local email was not delivered") do
      mailbox(email).each do |item|
        next if earlier.include?(item.fetch("ID")) || @used_mail.include?(item.fetch("ID")) || !item.fetch("Subject").match?(subject)

        detail, content = local_get("#{@config.fetch('mailpit_origin')}/api/v1/message/#{CGI.escapeURIComponent(item.fetch('ID'))}")
        check(detail.code == "200", "Local email body failed")
        found = yield JSON.parse(content)
        next unless found

        @used_mail << item.fetch("ID")
        break
      end
      found
    end
    found
  end

  def source_offer(session, label)
    previous_phase = @phase
    previous_size = session.current_window.size
    @phase = "source"
    [1440, 375].each do |width|
      viewport(session, width)
      session.execute_script("window.scrollTo(0, 0)")
      link = session.find("a", text: "Corresponding source", exact_text: true)
      check(link.evaluate_script("this.href") == "#{@config.fetch('provider_origin')}/source" && link[:lang] == "en" &&
        link[:target] == "_blank" && %w[noopener noreferrer].all? { |value| link[:rel].to_s.split.include?(value) },
        "Source link contract failed")
      geometry = link.evaluate_script(<<~JS)
        (() => { const r=this.getBoundingClientRect(); return {height:r.height,width:r.width,
          hit:this.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))}; })()
      JS
      check(geometry.fetch("height") >= 44 && geometry.fetch("width").positive? && geometry.fetch("hit"),
        "Source link is obstructed or too small")
      link.execute_script("this.focus()")
      session.driver.browser.keyboard.type(:tab)
      session.driver.browser.keyboard.type([:shift, :tab])
      check(link.evaluate_script("document.activeElement === this"), "Source keyboard focus failed")
      capture(session, "source-#{label}-#{width}.png")
    end
  ensure
    session.current_window.resize_to(*previous_size) if previous_size
    @phase = previous_phase
  end

  def verify_source_bytes
    response, body = local_get("#{@config.fetch('provider_origin')}/source", 131_072)
    check(response.code == "200" && response["Cache-Control"].to_s.include?("no-store") &&
      body.include?(DocumensoLive::SOURCE_RELEASE), "Anonymous fixed source notice failed")
    assets = @config.fetch("source_assets")
    check(assets.map { |asset| URI(asset.fetch("url")).path }.sort == DocumensoLive::SOURCE_ASSETS.keys.sort,
      "Exact source assets missing")
    assets.each do |asset|
      uri = URI(asset.fetch("url"))
      expected = DocumensoLive::SOURCE_ASSETS.fetch(uri.path)
      check(asset.fetch("url") == @config.fetch("provider_origin") + uri.path &&
        [asset.fetch("bytes"), asset.fetch("sha256")] == expected, "Source asset binding changed")
      digest = Digest::SHA256.new
      count = 0
      Net::HTTP.start(uri.host, uri.port, nil, open_timeout: 5, read_timeout: 15) do |http|
        http.request(Net::HTTP::Get.new(uri.request_uri)) do |download|
          check(download.code == "200", "Anonymous source asset unavailable")
          download.read_body do |chunk|
            count += chunk.bytesize
            check(count <= expected.first, "Source asset oversized")
            digest.update(chunk)
          end
        end
      end
      check(count == expected.first && digest.hexdigest == expected.last, "Anonymous source bytes changed")
    end
    @summary[:source_assets_verified] = 3
  end

  def typed_signature(session, name)
    session.find('button[aria-label="Edit signature"]').click
    session.find('[role="tab"]', text: "Type", exact_text: true).click
    session.fill_in("Type your signature", with: name)
    session.click_button("Next", exact: true)
    check(session.has_no_css?('[role="dialog"]', wait: 15), "Typed signature did not settle")
  end

  def provider_account
    @phase = "provider_account"
    identity = @config.fetch("identities").fetch("provider")
    @provider.visit("#{@config.fetch('provider_origin')}/signup")
    source_offer(@provider, "public")
    @provider.fill_in("name", with: identity.fetch("name"))
    @provider.fill_in("email", with: identity.fetch("email"))
    @provider.fill_in("password", with: identity.fetch("password"))
    typed_signature(@provider, identity.fetch("name"))
    earlier = mail_ids(identity.fetch("email"))
    @provider.click_button("Create account", exact: true)
    url = mail_to(identity.fetch("email"), /\APlease confirm your email\z/, earlier) do |message|
      DocumensoLive.message_link(message, @config.fetch("provider_origin"), %r{\A/verify-email/[^/]+\z})
    end
    @provider.visit(url)
    @provider.click_link("Continue", exact: true)
    if @provider.has_field?("password", wait: 2)
      @provider.fill_in("email", with: identity.fetch("email"))
      @provider.fill_in("password", with: identity.fetch("password"))
      @provider.click_button("Sign in", exact: true)
    end
    wait_for("Provider team route unavailable") { URI(@provider.current_url).path.match?(%r{\A/t/[^/]+/}) }
    source_offer(@provider, "auth")
    team = URI(@provider.current_url).path.match(%r{\A(/t/[^/]+)/})[1]
    @provider.visit("#{@config.fetch('provider_origin')}#{team}/settings/tokens")
    @provider.click_button("Create token", exact: true)
    @provider.fill_in("tokenName", with: "Miru isolated acceptance")
    @provider.click_button("3 months", exact: true)
    @provider.find('[role="option"]', text: /week|7 days/i).click
    @provider.find('[role="dialog"]').click_button("Create token", exact: true)
    @api_key = @provider.find_field("createdToken", disabled: :all).value
    check(@api_key.is_a?(String) && @api_key.bytesize.between?(16, 4096), "Normal provider key unavailable")
    @provider.click_button("Done", exact: true)
    progress("provider_key")
    @provider.visit("#{@config.fetch('provider_origin')}/qa-source-not-found-2462")
    check(@provider.has_text?("404 not found"), "Genuine provider error route missing")
    source_offer(@provider, "error")
    verify_source_bytes
  end

  def login(user)
    @miru.visit("#{@config.fetch('miru_origin')}/login")
    @miru.fill_in("email", with: user.email)
    @miru.fill_in("password", with: @config.fetch("identities").fetch("miru").fetch("password"))
    @miru.click_button("Sign in", exact: true)
    check(@miru.has_no_current_path?("/login", wait: 20), "Ordinary Miru login failed")
  end

  def fixture_user(company, email, role)
    user = create(:user, first_name: "Synthetic", last_name: role.to_s,
      email:, password: @config.fetch("identities").fetch("miru").fetch("password"),
      current_workspace: company)
    employment = create(:employment, company:, user:, resigned_at: nil, employment_type: "Consultant")
    user.add_role(role, company)
    [user, employment]
  end

  def upload_packet(kind)
    @phase = "upload"
    @miru.visit("#{@config.fetch('miru_origin')}/agreements")
    @miru.click_button("Upload documents", exact: true)
    @miru.fill_in("Document title", with: "Synthetic live #{kind} packet")
    @miru.select(kind == "client" ? "Client" : "Employee or consultant", from: "Link to a profile (optional)")
    party = kind == "client" ? @client : @consultant
    name = kind == "client" ? party.name : party.user.full_name
    @miru.fill_in("Find profile", with: name)
    @miru.select("#{name} — #{@config.fetch('identities').fetch('signer').fetch('email')}", from: "Linked profile")
    @miru.attach_file("PDF documents", %w[qa-main.pdf qa-addendum.pdf].map { |name| Rails.root.join("docs/qa/generic-document-signing-2462", name) })
    @miru.click_button("Create signing draft", exact: true)
    check(@miru.has_css?('[data-pdf-ready="true"]', wait: 20), "Actual uploaded PDF preview is not ready")
    @record = SignatureRequest.find_by!(company: @company, title: "Synthetic live #{kind} packet")
    check(@record.public_send(kind == "client" ? :client_id : :employment_id) == party.id, "Wrong linked packet subject")
    if kind == "client"
      check(!SignatureConnection.active.exists?(company: @company), "Fresh workspace already has a signing connection")
      check(@miru.has_button?("Connect signing", disabled: true, wait: 20), "Fresh signing connection UI missing")
      @miru.fill_in("Signing API key", with: @api_key)
      check(@miru.has_button?("Connect signing", disabled: false, wait: 20), "Signing key did not enable connection")
      @miru.click_button("Connect signing", exact: true)
      check(@miru.has_text?("Company signing connected"), "Real provider connection failed")
      @connection_id = SignatureConnection.active.find_by!(company: @company, created_by: @owner,
        provider_origin: @config.fetch("provider_origin")).id
    else
      check(@miru.has_text?("Company signing connected") && @miru.has_no_button?("Connect signing") &&
        SignatureConnection.active.find_by!(company: @company).id == @connection_id, "Saved signing connection changed")
    end
    %w[signer provider].each_with_index do |role, index|
      identity = @config.fetch("identities").fetch(role)
      @miru.click_button("Add recipient", exact: true)
      @miru.within("fieldset[aria-label='Recipient #{index + 1}']") do
        @miru.fill_in("Name", with: identity.fetch("name"))
        @miru.fill_in("Email", with: identity.fetch("email"))
        check(@miru.has_select?("Signing verification", selected: "Email code at completion"), "Email-code policy missing")
      end
    end
    DocumensoLive::TYPES.each_with_index do |type, index|
      add_field(type, "Synthetic #{type}", "signer", "qa-main.pdf", 5 + index * 8)
    end
    add_field("Signature", "Company required signature", "provider", "qa-addendum.pdf", 65)
    @miru.click_button("Save changes", exact: true)
    check(@miru.has_css?('[role="status"]', text: "All changes saved"), "Fields were not saved")
    revision = @record.reload.current_revision
    check(revision.documents.size == 2 && revision.fields.size == 10 && revision.recipients.size == 2 &&
      revision.fields.map { |field| field.fetch("type") }.uniq.sort == DocumensoLive::TYPES.map(&:downcase).sort,
      "Required field/document/signer matrix changed")
    progress("fields", kind)
  end

  def add_field(type, label, role, document, top)
    @miru.click_button("Add field", exact: true)
    @miru.fill_in("Field label", with: label)
    @miru.select(type, from: "Field type")
    identity = @config.fetch("identities").fetch(role)
    @miru.select("#{identity.fetch('name')} — #{identity.fetch('email')}", from: "Assigned recipient")
    @miru.select(document, from: "Field document")
    { "Field page" => 1, "Left (%)" => 10, "Top (%)" => top, "Width (%)" => 40, "Height (%)" => 5 }.each do |name, value|
      @miru.fill_in(name, with: value.to_s)
    end
    @miru.check("Required", exact: true)
    @miru.fill_in("Dropdown options", with: "Synthetic option A\nSynthetic option B") if type == "Dropdown"
  end

  def placement(kind)
    @miru.find('button[aria-label="Edit Synthetic Text"]').click
    %w[Move Resize].each do |action|
      handle = @miru.find("button[aria-label='#{action} Synthetic Text']")
      handle.execute_script("this.scrollIntoView({block:'center'})")
      handle.native.drag_by(25, 12, steps: 5, scroll: false)
    end
    geometry = { "x" => "Left (%)", "y" => "Top (%)", "width" => "Width (%)", "height" => "Height (%)" }
      .transform_values { |label| @miru.find_field(label).value.to_f }
    check(geometry.fetch("x") > 10 && geometry.fetch("width") > 40 && geometry.fetch("height") > 5, "Pointer geometry did not change")
    @miru.click_button("Save changes", exact: true)
    check(@miru.has_css?('[role="status"]', text: "All changes saved"), "Geometry save failed")
    @miru.visit(@miru.current_url)
    check(@miru.has_css?('[data-pdf-ready="true"]', wait: 20), "Reloaded PDF preview did not become ready")
    field = @record.reload.current_revision.fields.find { |item| item.fetch("type") == "text" }
    check(geometry.all? { |key, value| (field.fetch(key).to_f - value).abs < 0.02 }, "Pointer geometry changed on reload")
    [1440, 375].each do |width|
      viewport(@miru, width)
      capture(@miru, "placement-#{kind}-#{width}.png")
    end
    viewport(@miru, 1440)
  end

  def review_and_approve
    @phase = "review"
    identity = @config.fetch("identities").fetch("signer")
    @miru.select("#{identity.fetch('name')} — #{identity.fetch('email')}", from: "Recipient to review")
    earlier = mail_ids(identity.fetch("email"))
    @miru.click_button("Invite for review", exact: true)
    check(@miru.has_text?("Review invitation queued"), "Review invitation not queued")
    url = mail_to(identity.fetch("email"), /Review a document/, earlier) do |message|
      DocumensoLive.message_link(message, @config.fetch("miru_origin"), %r{\A/document-review\z})
    end
    # Reopening a fragment on the review page does not rerun its token bootstrap.
    @signer.visit("about:blank")
    @signer.visit(url)
    check(@signer.has_css?('[data-pdf-ready="true"]', wait: 20) && @signer.has_text?("Review this document"), "Client review unavailable")
    @signer.fill_in("Review comment", with: "Synthetic client reviewed this exact version; software QA only.")
    @signer.click_button("Approve this version", exact: true)
    check(@signer.has_text?("Review approved"), "Client review did not complete")
    @miru.visit("#{@config.fetch('miru_origin')}/agreements/documents/#{@record.id}")
    @miru.select("Invited reviews", from: "Approval source")
    @miru.check("I confirm this version is approved for signature", exact: true)
    @miru.click_button("Record approval for signing", exact: true)
    check(@miru.has_text?("Approval recorded for this version"), "Reviewed approval not recorded")
    revision = @record.reload.current_revision
    check(revision.status == "approved" && revision.approval_digest == revision.content_digest, "Approval does not bind exact saved version")
    url
  end

  def approve_version(kind)
    prior = @record.reload.current_revision
    old_link = review_and_approve
    @miru.fill_in("Document title", with: "Synthetic live #{kind} packet revised")
    @miru.click_button("Save changes", exact: true)
    check(@miru.has_css?('[role="status"]', text: "All changes saved"), "New revision was not saved")
    current = @record.reload.current_revision
    check(current.id != prior.id && current.approval_digest.nil?, "Edit retained old approval")
    @signer.visit("about:blank")
    @signer.visit(old_link)
    check(@signer.has_text?("This review link is unavailable"), "Old client review still grants access")
    review_and_approve
    progress("review", kind)
  end

  def wait_for_worker
    pid = DocumensoLive::ADMISSION.fetch("worker_pid")
    boot = DocumensoLive::CONTROL.join("boot-#{pid}.json")
    wait_for("Owned SolidQueue worker did not register", 30) do
      next false unless boot.file?

      check(boot.stat.uid == Process.uid && boot.stat.mode & 0o777 == 0o600 && boot.size <= 4096, "Unsafe worker boot receipt")
      check(JSON.parse(boot.read) == { "pid" => pid, "database" => @config.fetch("database"), "csrf" => true,
        "real_solid_queue" => true, "local_smtp" => true }, "Real worker guards differ from admission")
      supervisor = SolidQueue::Process.find_by(kind: "Supervisor(fork)", pid:)
      supervisor && SolidQueue::Process.where(kind: "Worker", supervisor_id: supervisor.id)
        .where("last_heartbeat_at > ?", 2.minutes.ago).any? do |worker|
          File.stat("/proc/#{worker.pid}").uid == Process.uid
        rescue Errno::ENOENT
          false
        end
    end
  end

  def send_packet(kind)
    @phase = "send"
    wait_for_worker
    @invitation_mail = %w[signer provider].index_with do |role|
      mail_ids(@config.fetch("identities").fetch(role).fetch("email"))
    end
    @miru.click_button("Send for signature", exact: true)
    @miru.find('[role="dialog"]').click_button("Send signature emails", exact: true)
    wait_for("Real worker did not distribute the packet", 60) do
      revision = @record.reload.current_revision
      check(!revision.signature_operations.where(state: %w[failed uncertain]).exists?, "Real delivery failed or is uncertain")
      revision.provider_envelope_id.present? && revision.provider_status == "PENDING"
    end
    check(@miru.has_field?("Document title", disabled: true) && @miru.has_no_button?("Save changes"), "Sent version is not locked")
    progress("send", kind)
  end

  def complete_recipient(session, role, kind)
    @phase = "sign"
    identity = @config.fetch("identities").fetch(role)
    url = mail_to(identity.fetch("email"), /sign/i, @invitation_mail.fetch(role)) do |message|
      DocumensoLive.message_link(message, @config.fetch("provider_origin"), %r{\A/sign/[A-Za-z0-9_-]+\z}, @record.current_revision.title)
    end
    if role == "provider"
      token_path = URI(url).path
      check(token_path.match?(%r{\A/sign/[A-Za-z0-9_-]+\z}), "Unexpected invitation route")
      session.visit("#{@config.fetch('provider_origin')}/qa-embed")
      session.execute_script("document.getElementById('qa-provider-frame').src=arguments[0]", @config.fetch("provider_origin") + "/embed" + token_path)
      session.within_frame("qa-provider-frame") { source_offer(session, "embed-#{kind}") }
    end
    session.visit(url)
    source_offer(session, "signing-#{kind}") if role == "signer"
    if role == "signer"
      typed_signature(session, identity.fetch("name"))
      %w[Signature Initials].each { |type| session.find("button[aria-label^='Synthetic #{type} ']").click }
      session.find('button[aria-label^="Synthetic Text "]').click
      session.fill_in("custom-text", with: "Synthetic editable note 2462")
      session.click_button("Enter", exact: true)
      session.find('button[aria-label^="Synthetic Number "]').click
      session.find('input[name="number"]').set(DocumensoLive::NUMBER_VALUE)
      session.click_button("Enter", exact: true)
      session.find('button[aria-label^="Synthetic Checkbox "]').click
      session.find('button[aria-label^="Synthetic Dropdown "]').click
      session.find('[role="option"]', text: "Synthetic option B", exact_text: true).click
      session.find('button[aria-label^="Synthetic Name "]').click
      session.find('button[aria-label^="Synthetic Email "]').click
      if session.has_css?('[role="dialog"] input[name="email"]', wait: 2)
        session.find('[role="dialog"] input[name="email"]').set(identity.fetch("email"))
        session.find('[role="dialog"]').click_button("Enter", exact: true)
      end
      # The pinned provider prefills Date as inserted/readOnly and omits its click control.
    else
      session.find('button[title="document-2.pdf"]').click
      session.find('button[aria-label^="Company required signature "]').click
    end
    check(session.has_text?("0 Fields Remaining", wait: 20), "Required signing fields remain")
    earlier = mail_ids(identity.fetch("email"))
    session.click_button("Complete", exact: true)
    session.find('[role="dialog"]').click_button("Sign", exact: true)
    session.find("button", text: "Email verification", exact_text: false).click
    code = mail_to(identity.fetch("email"), /verification|code/i, earlier) do |message|
      next unless CGI.unescapeHTML("#{message['HTML']} #{message['Text']}").include?(@record.current_revision.title)

      codes = message.fetch("Text").scan(/\b\d{6}\b/).uniq
      codes.first if codes.size == 1
    end
    session.find('input[name="token"][autocomplete="one-time-code"]').set(code)
    session.click_button("Verify & Complete", exact: true)
    code.clear
    check(session.has_no_css?('input[autocomplete="one-time-code"]', wait: 20), "Recipient verification did not complete")
  end

  def download_pdf(entry, width, kind)
    filename = entry.fetch("filename")
    check(filename.match?(/\A[A-Za-z0-9_.-]+\.pdf\z/), "Unsafe download filename")
    directory = DocumensoLive::ROOT.join("private-downloads", kind, width.to_s, Digest::SHA256.hexdigest(entry.fetch("key")))
    FileUtils.mkdir_p(directory, mode: 0o700)
    downloads = @miru.driver.browser.downloads
    downloads.set_behavior(save_path: directory.to_s)
    earlier = downloads.files.map { |file| file.fetch("guid") }
    @miru.within("article[data-signature-archive]", text: @record.current_revision.title) do
      @miru.click_button(filename, exact: true)
    end
    path = directory.join(filename)
    wait_for("Native download did not complete", 15) do
      transfer = downloads.files.find { |file| !earlier.include?(file.fetch("guid")) && file["suggestedFilename"] == filename }
      transfer && transfer["state"] == "completed" && path.file?
    end
    check(path.size == entry.fetch("byte_size") && Digest::SHA256.file(path).hexdigest == entry.fetch("sha256"), "Native archive bytes differ")
    signed = entry.fetch("kind") == "signed"
    info = (signed ? Signatures::SealedPdf : Signatures::PdfInfo).new(path.to_s).process
    text, _error, status = Open3.capture3("pdftotext", path.to_s, "-")
    check(status.success?, "Native downloaded text unavailable")
    compact = text.gsub(/\s+/, "")
    if signed
      check(text.gsub(/\s+/, " ").include?("Original body text must remain present in the final PDF."), "Signed PDF lost original body")
      if filename.include?("document-1")
        check(compact.include?("Syntheticeditablenote2462") && compact.include?("SyntheticoptionB") && compact.include?(DocumensoLive::NUMBER_VALUE), "Typed values missing from signed PDF")
      end
      report, _error, signature = Open3.capture3("pdfsig", path.to_s)
      check(signature.success? && report.include?("Signature is Valid") && report.include?("Total document signed"), "Independent PDF seal verification failed")
    else
      emails = %w[signer provider].map { |role| @config.fetch("identities").fetch(role).fetch("email") }
      check(emails.all? { |email| compact.include?(email) } && compact.include?(@record.current_revision.provider_envelope_id), "Signing evidence identity binding failed")
    end
    { kind: entry.fetch("kind"), sha256: entry.fetch("sha256"), bytes: path.size,
      pages: info.fetch("pages").size, viewport: width, pdf_signature_valid: signed, body_preserved: signed }
  end

  def archive_packet(kind)
    @phase = "archive"
    @miru.click_button("Check signing status", exact: true)
    wait_for("Real reconciliation did not archive completed files", 60) do
      revision = @record.reload.current_revision
      check(revision.archive_error.nil?, "Archive verification failed")
      revision.status == "signed" && revision.archived_at.present?
    end
    revision = @record.current_revision
    @manifest = revision.artifact_manifest
    check(@manifest.map { |entry| entry.fetch("kind") }.sort == %w[audit_log certificate signed signed] &&
      @manifest.map { |entry| entry.fetch("key") }.uniq.size == 4, "Completed archive is incomplete")
    immutable = revision.attributes.slice("content_digest", "documents", "fields", "recipients", "artifact_manifest", "archived_at", "status")
    @miru.click_link("Signed documents", exact: true)
    checks = [1440, 375].flat_map do |width|
      viewport(@miru, width)
      @manifest.map { |entry| download_pdf(entry, width, kind) }.tap { capture(@miru, "archive-#{kind}-#{width}.png") }
    end
    check(revision.reload.attributes.slice(*immutable.keys) == immutable, "Completed archive changed during retrieval")
    progress("archive", kind)
    checks
  end

  def share_image(kind)
    @phase = "share"
    check(@signer.has_text?("Document Signed", wait: 20), "Final recipient page not signed")
    [1440, 375].each do |width|
      viewport(@signer, width)
      capture(@signer, "signed-#{kind}-#{width}.png")
    end
    @signer.click_button("Share", exact: true)
    image = @signer.find('img[src*="opengraph"][src*="share"]', visible: :all)
    uri = URI(image[:src])
    check("#{uri.scheme}://#{uri.host}:#{uri.port}" == @config.fetch("provider_origin"), "Nonlocal Share image")
    response, bytes = local_get(image[:src], 5_242_880)
    check(response.code == "200" && response["Content-Type"].to_s.start_with?("image/png") &&
      bytes.start_with?("\x89PNG\r\n\x1a\n".b) && bytes.byteslice(16, 8).unpack("NN") == [1200, 630], "Built Share PNG contract failed")
    wait_for("Share image did not render") { image.evaluate_script("this.complete && this.naturalWidth === 1200 && this.naturalHeight === 630") }
    [1440, 375].each { |width| viewport(@signer, width) }
    File.binwrite(DocumensoLive::OUTPUT.join("share-#{kind}.png"), bytes)
    progress("share", kind)
    Digest::SHA256.hexdigest(bytes)
  end

  def browser_response(path)
    @miru.evaluate_async_script(<<~JS, path)
      const done=arguments[1]; fetch(arguments[0],{credentials:'same-origin'}).then(async r=>{
        const b=new Uint8Array(await r.arrayBuffer()); done({status:r.status,pdf:new TextDecoder().decode(b.slice(0,5))==='%PDF-',
          cache:r.headers.get('Cache-Control'),type:r.headers.get('Content-Type'),disposition:r.headers.get('Content-Disposition'),
          nosniff:r.headers.get('X-Content-Type-Options')}); }).catch(()=>done({status:0,pdf:false}));
    JS
  end

  def archive_denials(kind)
    @phase = "denials"
    paths = @manifest.map { |entry| "/api/v1/signature_archives/#{@record.current_revision_id}/files/#{CGI.escapeURIComponent(entry.fetch('key'))}" }
    paths.each do |path|
      positive = browser_response("#{path}?company_id=#{@company.id}")
      check(positive.fetch("status") == 200 && positive.fetch("pdf") && positive.fetch("cache").include?("private") &&
        positive.fetch("cache").include?("no-store") && positive.fetch("type").start_with?("application/pdf") &&
        positive.fetch("disposition").start_with?("attachment;") && positive.fetch("nosniff") == "nosniff", "Private download headers failed")
    end
    rows = []
    { "anonymous" => 401, "stale_workspace" => 409 }.each do |actor, status|
      statuses = paths.map do |path|
        result = if actor == "anonymous"
          response, body = local_get("#{@config.fetch('miru_origin')}#{path}?company_id=#{@company.id}")
          { "status" => response.code.to_i, "pdf" => body.start_with?("%PDF-") }
        else
          browser_response("#{path}?company_id=#{@other_company.id}")
        end
        check(result.fetch("status") == status && !result.fetch("pdf"), "Archive access denial failed")
        result.fetch("status")
      end
      rows << { actor:, statuses:, pdf_bytes_served: false }
    end
    [["unassigned_employee", @employee, @company], ["other_workspace", @other_owner, @other_company]].each do |actor, user, company|
      viewport(@miru, 1440)
      @miru.click_button("Sign out", exact: true)
      login(user)
      statuses = paths.map do |path|
        response = browser_response("#{path}?company_id=#{company.id}")
        check(response.fetch("status") == 404 && !response.fetch("pdf"), "Wrong subject can retrieve private artifact")
        response.fetch("status")
      end
      rows << { actor:, statuses:, pdf_bytes_served: false }
    end
    @miru.click_button("Sign out", exact: true)
    login(@owner)
    progress("denials", kind)
    rows
  end

  before do
    @config = DocumensoLive::CONFIG
    @phase = "admitted"
    @console_errors = {}
    @summary = { schema_version: 1, passed: false, phase: @phase, image_config_sha256: DocumensoLive::CONFIG_SHA,
      source_assets_verified: 0, console_errors: 0, packets: [] }
    @deadline = DocumensoLive::ADMISSION.fetch("deadline_epoch")
    check(@deadline.is_a?(Numeric) && @deadline <= Time.now.to_f + 1800, "Invalid fixed QA deadline")
    check(Rails.env.test? && !Process.uid.zero?, "Isolated nonroot test runtime required")
    database = ActiveRecord::Base.with_connection do |connection|
      check(!connection.transaction_open?, "Real worker cannot share transactional fixtures")
      connection.raw_connection.db
    end
    check(database == @config.fetch("database") && database == DocumensoLive::ADMISSION.fetch("database") &&
      database.match?(/\Amiru_documenso_live_[a-z0-9_]+_test\z/), "Wrong test database")
    check(ActiveStorage::Blob.service.root.to_s == DocumensoLive::STORAGE.to_s &&
      DocumensoLive::ADMISSION.fetch("storage_dir") == DocumensoLive::STORAGE.to_s, "Private storage guard failed")
    check(ActionController::Base.allow_forgery_protection, "CSRF protection is required")
    check(ENV["DOCUMENSO_ORIGIN"] == @config.fetch("provider_origin"), "Provider runtime origin differs from admission")
    worker_pid = DocumensoLive::ADMISSION.fetch("worker_pid")
    check(worker_pid.is_a?(Integer) && worker_pid.positive? && File.stat("/proc/#{worker_pid}").uid == Process.uid,
      "Owned worker identity is required")
    Process.kill(0, worker_pid)
    ActiveJob::Base.queue_adapter = :solid_queue
    check(SolidQueue::Record.with_connection { |connection| connection.raw_connection.db } == database,
      "Queue database differs from owned application database")
    ActionMailer::Base.delivery_method = :smtp
    ActionMailer::Base.smtp_settings = { address: "127.0.0.1", port: @config.fetch("miru_smtp_port"),
      enable_starttls_auto: false, open_timeout: 5, read_timeout: 5 }
    check([ActiveJob::Base, SignatureDeliveryJob, SignatureSyncJob, ActionMailer::MailDeliveryJob].all? do |job|
      job.queue_adapter.is_a?(ActiveJob::QueueAdapters::SolidQueueAdapter)
    end, "Real worker adapter required")
    Capybara.server_host = "127.0.0.1"
    Capybara.server_port = URI(@config.fetch("miru_origin")).port
    Capybara.app_host = @config.fetch("miru_origin")
    Capybara.save_path = DocumensoLive::ROOT.join("private-downloads").to_s
    Capybara.default_max_wait_time = 20
    @config.fetch("browsers").each do |row|
      DocumensoLive.local_origin(row.fetch("cdp_url"))
      profile = DocumensoLive.owned_path(DocumensoLive::ROOT, row.fetch("profile_dir"))
      argv = row.fetch("argv")
      check(profile.stat.uid == Process.uid && profile.stat.mode & 0o777 == 0o700 && File.stat("/proc/#{row.fetch('pid')}").uid == Process.uid &&
        File.binread("/proc/#{row.fetch('pid')}/cmdline").split("\0") == argv &&
        argv.none? { |flag| flag.match?(DocumensoLive::UNSAFE_FLAGS) } &&
        argv.include?("--user-data-dir=#{profile}") && argv.include?("--remote-debugging-address=127.0.0.1"), "Normal owned Brave identity failed")
      check(DocumensoLive.debug_port(argv) == URI(row.fetch("cdp_url")).port, "CDP endpoint is not the verified browser")
      Capybara.register_driver("live_#{row.fetch('role')}".to_sym) do |app|
        Capybara::Cuprite::Driver.new(app, url: row.fetch("cdp_url"), browser_path: argv.first,
          ignore_default_browser_options: true, window_size: [1440, 1000], timeout: 30, process_timeout: 30,
          js_errors: true, pending_connection_errors: false)
      end
    end
    driven_by :live_miru
    Capybara.default_driver = :live_miru
    Capybara.javascript_driver = :live_miru
    @miru = page
    @provider = Capybara::Session.new(:live_provider)
    @signer = Capybara::Session.new(:live_signer)
    [@miru, @provider, @signer].each_with_index do |session, index|
      errors = @console_errors[index] = []
      session.driver.browser.page.on("Runtime.consoleAPICalled") { |event| errors << "console.error" if event["type"] == "error" }
      session.driver.browser.page.on("Runtime.exceptionThrown") { |_event| errors << "uncaught exception" }
      session.driver.browser.network.intercept
      session.driver.browser.on(:request) do |request|
        uri = URI(request.url)
        %w[http https ws wss].include?(uri.scheme) && !%w[127.0.0.1 localhost ::1].include?(uri.hostname) ? request.abort : request.continue
      rescue URI::InvalidURIError
        request.abort
      end
    end
    FileUtils.mkdir_p(DocumensoLive::OUTPUT.join("screenshots"), mode: 0o700)
    @used_mail = Set.new
    progress("admitted")
    marker = DocumensoLive::CONTROL.join("rspec-database-ready.json")
    check(!marker.exist?, "Database readiness marker already exists")
    temporary = DocumensoLive::CONTROL.join("rspec-database-ready.json.tmp")
    File.open(temporary, File::WRONLY | File::CREAT | File::EXCL, 0o600) do |file|
      file.write(JSON.generate(schema_version: 1, database:, ready: true))
    end
    File.rename(temporary, marker)
    wait_for_worker
  rescue StandardError => error
    stopped(error)
  end

  it "qualifies client and consultant packets through the actual built provider" do
    provider_account
    @company = create(:company, name: "Synthetic live signing QA", timezone: "Mumbai", base_currency: "USD")
    @owner, = fixture_user(@company, @config.fetch("identities").fetch("miru").fetch("email"), :owner)
    _consultant_user, @consultant = fixture_user(@company, @config.fetch("identities").fetch("signer").fetch("email"), :employee)
    @client = create(:client, company: @company, name: "Synthetic live client",
      email: @config.fetch("identities").fetch("signer").fetch("email"))
    @employee, = fixture_user(@company, "unassigned-#{SecureRandom.hex(6)}@miru-qa.invalid", :employee)
    @other_company = create(:company, name: "Synthetic other workspace", base_currency: "USD")
    @other_owner, = fixture_user(@other_company, "other-#{SecureRandom.hex(6)}@miru-qa.invalid", :owner)
    login(@owner)
    %w[client consultant].each do |kind|
      upload_packet(kind)
      placement(kind)
      approve_version(kind)
      send_packet(kind)
      complete_recipient(@signer, "signer", kind)
      complete_recipient(@provider, "provider", kind)
      @signer.visit(@signer.current_url)
      artifact_checks = archive_packet(kind)
      share = share_image(kind)
      denials = archive_denials(kind)
      @summary[:packets] << { kind:, version: @record.current_revision.number, documents: 2, fields: 10,
        signers: 2, artifact_checks:, share_sha256: share, denials: }
      progress("packet_complete", kind)
    end
    @api_key = nil
    progress("complete")
    @summary[:passed] = true
  rescue StandardError => error
    stopped(error)
  end

  after do
    [@provider, @signer].compact.each(&:reset!)
    check(@console_errors.values.all?(&:empty?), "Browser console error; stop acceptance") if @summary&.fetch(:passed)
  rescue StandardError => error
    @summary[:passed] = false if @summary
    stopped(error)
  ensure
    if @summary
      @summary[:phase] = @phase
      @summary[:console_errors] = @console_errors.values.sum(&:size)
      File.write(DocumensoLive::OUTPUT.join("summary.json"), JSON.pretty_generate(@summary), perm: 0o600)
    end
    @api_key = nil
  end
end
