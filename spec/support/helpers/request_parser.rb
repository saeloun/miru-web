# frozen_string_literal: true

def send_request(request_type, url, headers: {}, params: {})
  case request_type
  when :get
    get url, headers: headers, params: params
  when :post
    post url, headers: headers, params: params
  when :put
    put url, headers: headers, params: params
  when :delete
    delete url, headers: headers, params: params
  end
end
