import { useEffect } from "react";
import { Task } from "@/store/taskStore";
import { toast } from "@/hooks/use-toast";
/**
 * Project: TaskFlow
 * Author: Dhruv Kushwaha
 * Copyright © 2025
 * This code is for educational showcase only.
 */

export const useNotifications = (tasks: Task[]) => {
  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Check for tasks due within 24 hours
    const checkDeadlines = () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      tasks.forEach((task) => {
        if (task.status === "pending") {
          const dueDate = new Date(task.dueDate);
          const timeUntilDue = dueDate.getTime() - now.getTime();
          const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

          // Notify if task is due within 24 hours and hasn't been notified recently
          if (dueDate <= tomorrow && dueDate > now) {
            const notificationKey = `notified_${task.id}_${dueDate.toDateString()}`;
            const wasNotified = localStorage.getItem(notificationKey);

            if (!wasNotified) {
              // Browser notification
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Task Deadline Approaching!", {
                  body: `"${task.title}" is due in ${Math.round(hoursUntilDue)} hours`,
                  icon: "/favicon.ico",
                  tag: task.id,
                });
              }

              // Toast notification
              toast({
                title: "⏰ Deadline Reminder",
                description: `"${task.title}" is due in ${Math.round(hoursUntilDue)} hours`,
                duration: 5000,
              });

              // Mark as notified
              localStorage.setItem(notificationKey, "true");
            }
          }

          // Notify if task is overdue
          if (dueDate < now) {
            const overdueKey = `overdue_${task.id}_${now.toDateString()}`;
            const wasNotifiedOverdue = localStorage.getItem(overdueKey);

            if (!wasNotifiedOverdue) {
              toast({
                title: "⚠️ Task Overdue",
                description: `"${task.title}" is overdue!`,
                variant: "destructive",
                duration: 5000,
              });

              localStorage.setItem(overdueKey, "true");
            }
          }
        }
      });
    };

    // Check immediately
    checkDeadlines();

    // Check every hour
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks]);
};
