import { type NotificationStoreItem } from "../config/db.js";
import { emitRealtimeEvent } from "../events/socket.events.js";

export function stripEmojis(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2B50}\u{200D}]/gu, "")
    .trim();
}

export interface DispatchNotificationOptions {
  userId: number | string;
  title: string;
  message: string;
  type?: string;
  targetRoute?: string;
}

export async function dispatchNotification({
  userId,
  title,
  message,
  type = "INFO",
  targetRoute = "/designer-tasks"
}: DispatchNotificationOptions): Promise<NotificationStoreItem> {
  const cleanTitle = stripEmojis(title);
  const cleanMessage = stripEmojis(message);

  const notifItem: NotificationStoreItem = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    userId: parseInt(String(userId), 10) || userId,
    title: cleanTitle,
    message: cleanMessage,
    type,
    isRead: false,
    targetRoute,
    createdAt: new Date().toISOString()
  };

  // Broadcast notification event to realtime-service
  emitRealtimeEvent("notification:new", notifItem, `user:${notifItem.userId}`);
  return notifItem;
}
