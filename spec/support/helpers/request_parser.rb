# frozen_string_literal: true

def send_request(request_type, url, headers: {}, params: {}, xhr: false)
  case request_type
  when :get
    get url, headers:, params:, xhr:
  when :post
    post url, headers:, params:
  when :put
    put url, headers:, params:
  when :patch
    put url, headers:, params:
  when :delete
    delete url, headers:, params:
  end
end
