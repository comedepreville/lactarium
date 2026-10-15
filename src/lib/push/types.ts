export type PushKind = "reminder_10min" | "timer_done";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

export type PushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
};
