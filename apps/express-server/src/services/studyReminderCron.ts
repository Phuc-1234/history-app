import { studyReminderService } from "./studyReminderService";

let reminderInterval: any = null;

export function startStudyReminderCron() {
    console.log("[StudyReminder Cron] Started reminder background checker (every 60s).");

    // Run check every 60 seconds
    reminderInterval = setInterval(async () => {
        try {
            await studyReminderService.checkAndSendDueReminders();
        } catch (error: any) {
            console.error("[StudyReminder Cron] Error during reminder scan:", error?.message || error);
        }
    }, 60 * 1000);
}

export function stopStudyReminderCron() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
        console.log("[StudyReminder Cron] Stopped reminder background checker.");
    }
}
