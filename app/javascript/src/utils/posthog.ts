import posthog from "posthog-js";

let initialized = false;
let lastPage: string | null = null;

const privatePath = (pathname: string) =>
  /\/(sign_in|login|signup|password|email_confirmation|profile|settings|payroll|employees|employee-records|consultant|consultant-payroll|salary-slips|tax-declarations|india-tax|documents|signed-documents|agreements|hiring|interview-feedback|interview-reviews|assignment-reviews)(\/|$)/.test(
    pathname
  ) || /^\/invoices\/[^/]+\/(view|payments)/.test(pathname);

export const analyticsUrl = (value: string) => {
  if (!value || value === "$direct") return value;

  try {
    const url = new URL(value, window.location.origin);
    const path = url.pathname
      .replace(/(\/invoices\/)[^/]+(\/view|\/payments)/, "$1:redacted$2")
      .replace(/\/[0-9a-f-]{8,}(?=\/|$)|\/\d+(?=\/|$)/gi, "/:id");

    return `${url.origin}${path}`;
  } catch {
    return "";
  }
};

export const initializeProductAnalytics = () => {
  const token = document
    .querySelector('meta[name="posthog-project-token"]')
    ?.getAttribute("content");

  const host = document
    .querySelector('meta[name="posthog-host"]')
    ?.getAttribute("content");

  if (initialized || !token || !host) return;

  posthog.init(token, {
    api_host: host,
    ui_host: host,
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: { url_ignorelist: [/\/password/, /\/invoices\/[^/]+\/view/] },
    mask_all_text: true,
    mask_all_element_attributes: true,
    capture_exceptions: true,
    capture_performance: { web_vitals: true, network_timing: false },
    logs: {
      serviceName: "miru-web-browser",
      captureConsoleLogs: false,
      beforeSend: record =>
        record.body === "miru.page_view"
          ? {
              ...record,
              attributes: { "url.full": analyticsUrl(window.location.href) },
            }
          : null,
    },
    disable_session_recording: true,
    enable_recording_console_log: false,
    respect_dnt: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
      maskAllElementAttributes: true,
      blockSelector:
        "img, canvas, video, audio, object, embed, iframe, input[type=file], .ph-no-capture, [data-ph-no-capture]",
      recordHeaders: false,
      recordBody: false,
      recordCrossOriginIframes: false,
      captureJsonLd: false,
      maskCapturedNetworkRequestFn: request => ({
        ...request,
        name: analyticsUrl(request.name),
      }),
    },
    before_send: event => {
      if (!event) return null;

      for (const properties of [
        event.properties,
        event.properties.$set,
        event.properties.$set_once,
        event.$set,
        event.$set_once,
      ]) {
        if (!properties) continue;

        for (const key of [
          "$current_url",
          "$initial_current_url",
          "$referrer",
          "$initial_referrer",
          "$session_entry_url",
          "$session_entry_referrer",
        ]) {
          if (typeof properties[key] === "string") {
            properties[key] = analyticsUrl(properties[key]);
          }
        }
        for (const key of ["$pathname", "$session_entry_pathname"]) {
          if (typeof properties[key] === "string") {
            properties[key] = new URL(analyticsUrl(properties[key])).pathname;
          }
        }
        delete properties.$title;

        // Web-vitals attribution embeds navigation URLs; retain its numeric metrics.
        for (const key of Object.keys(properties)) {
          if (/^\$web_vitals_.*_event$/.test(key)) delete properties[key];
        }

        if ("$exception_message" in properties) {
          properties.$exception_message = "[redacted]";
        }

        if (Array.isArray(properties.$exception_list)) {
          properties.$exception_list = properties.$exception_list.map(
            exception => ({
              type: exception.type,
              value: "[redacted]",
              mechanism: {
                type: exception.mechanism?.type,
                handled: exception.mechanism?.handled,
              },
              stacktrace: {
                type: "raw",
                frames: Array.isArray(exception.stacktrace?.frames)
                  ? exception.stacktrace.frames.map(frame => ({
                      filename: frame.filename?.split(/[?#]/)[0],
                      function: frame.function,
                      lineno: frame.lineno,
                      colno: frame.colno,
                      in_app: frame.in_app,
                      platform: frame.platform,
                    }))
                  : [],
              },
            })
          );
        }
      }

      return event;
    },
  });
  initialized = true;
};

export const syncProductAnalytics = ({
  userId,
  companyId,
  role,
  pathname,
}: {
  userId?: string | number;
  companyId?: string | number;
  role?: string;
  pathname: string;
}) => {
  if (!initialized) return;

  if (userId) {
    const previousUser = posthog.get_property("$user_id");
    if (previousUser && previousUser !== `miru:user:${userId}`) {
      posthog.reset();
    }
    posthog.identify(`miru:user:${userId}`, { role });
    if (companyId) posthog.group("company", `miru:company:${companyId}`);
    else posthog.resetGroups();
  } else if (posthog.get_property("$user_id")) {
    posthog.reset();
    lastPage = null;
  }

  if (userId && !privatePath(pathname)) posthog.startSessionRecording();
  else posthog.stopSessionRecording();

  const page = analyticsUrl(pathname);
  if (lastPage !== page) {
    posthog.capture("$pageview", { $current_url: page });
    posthog.logger.info("miru.page_view");
    lastPage = page;
  }
};
