import { create } from "zustand";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

// ---------- Types ----------
export type TaskStatus = "pending" | "completed";
export type Priority = "Low" | "Medium" | "High";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  projectId: string;
  createdBy: string;
}

// ---------- Zustand Store ----------
interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, "id">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string, projectId: string) => Promise<void>;
  toggleTaskStatus: (id: string, projectId: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],

  // ✅ Add new task — Firestore only (snapshot handles UI update)
  addTask: async (task) => {
    try {
      const tasksRef = collection(db, "projects", task.projectId, "tasks");
      await addDoc(tasksRef, task);
      console.log("✅ Task added to Firestore:", task.title);
    } catch (err) {
      console.error("❌ Error adding task:", err);
    }
  },

  // ✅ Update Firestore + Zustand
  updateTask: async (id, updates) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const taskRef = doc(db, "projects", task.projectId, "tasks", id);
      await updateDoc(taskRef, updates);
      // local update optional (but snapshot will refresh anyway)
      set({
        tasks: tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      });
      console.log("✅ Task updated:", id);
    } catch (err) {
      console.error("❌ Error updating task:", err);
    }
  },

  // ✅ Delete Firestore + Zustand
  deleteTask: async (id, projectId) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    const finalProjectId = projectId || task?.projectId;
    if (!finalProjectId) return console.error("❌ Missing projectId for deletion");

    try {
      const taskRef = doc(db, "projects", finalProjectId, "tasks", id);
      await deleteDoc(taskRef);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
      console.log("✅ Task deleted:", id);
    } catch (err) {
      console.error("❌ Error deleting task:", err);
    }
  },

  // ✅ Toggle completion
  toggleTaskStatus: async (id, projectId) => {
    const { tasks, updateTask } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateTask(id, { status: newStatus });
  },

  // ✅ Set local state (used by snapshot)
  setTasks: (tasks) => set({ tasks }),
}));

// ---------- Firestore Live Sync ----------
export const initializeTaskSync = (projectId: string) => {
  if (!projectId) return () => {};

  console.log("📡 Subscribing to Firestore for project:", projectId);
  const q = query(
    collection(db, "projects", projectId, "tasks"),
    orderBy("dueDate", "asc")
  );

  // listen for live updates
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Task)
    );
    useTaskStore.getState().setTasks(tasks);
  });

  // clean up listener when component unmounts
  return unsubscribe;
};
