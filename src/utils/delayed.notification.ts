export const INTERACTION_NOTIFICATION_DELAY_MS = 5 * 1000;

export function runDelayedNotification(
  task: () => Promise<void>,
  delayMs = INTERACTION_NOTIFICATION_DELAY_MS,
) {
  setTimeout(() => {
    task().catch((error) => {
      console.error("Gecikmeli bildirim islemi basarisiz:", error);
    });
  }, delayMs);
}
