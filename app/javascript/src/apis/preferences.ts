import axios from "./api";

interface NotificationPreferences {
  notification_enabled?: boolean;
  invoice_email_notifications?: boolean;
  payment_email_notifications?: boolean;
  timesheet_reminder_enabled?: boolean;
  unsubscribed_from_all?: boolean;
}

const get = async (userId: number | string) =>
  axios.get(`team/${userId}/notification_preferences`);

const updatePreference = async (
  userId: number | string,
  payload: NotificationPreferences
) => axios.patch(`team/${userId}/notification_preferences`, payload);

const updateAll = async (
  userId: number | string,
  payload: NotificationPreferences
) => axios.patch(`team/${userId}/notification_preferences`, payload);

const preferencesApi = { get, updatePreference, updateAll };

export default preferencesApi;
