import { create } from "zustand";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ---------------- Types ----------------
export interface KeyPerson {
  name: string;
  role: string;
  email: string;
}

export interface Resource {
  title: string;
  link: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  userId: string;
  key: string;
  keyPeople?: KeyPerson[];
  resources?: Resource[];
  startDate?: string;
  deadline?: string;
}

interface ProjectStore {
  projects: Project[];
  addProject: (project: Omit<Project, "id" | "createdAt">) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  verifyProjectKey: (projectId: string, enteredKey: string) => boolean;
  generateKey: () => string;
  loadProjects: () => Promise<void>;
  subscribeToProjects: () => () => void;
}

// ---------------- Local Storage Helpers ----------------
const STORAGE_KEY = "taskflow-projects";

const loadFromStorage = (): Project[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load projects from storage:", error);
    return [];
  }
};

const saveToStorage = (projects: Project[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects to storage:", error);
  }
};

// ---------------- Store ----------------
export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: loadFromStorage(),

  generateKey: () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  },

  verifyProjectKey: (projectId: string, enteredKey: string) => {
    const project = get().projects.find((p) => p.id === projectId);
    return project?.key === enteredKey;
  },

  loadProjects: async () => {
    try {
      const projectsQuery = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(projectsQuery);
      const projects: Project[] = [];
      querySnapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() } as Project);
      });
      set({ projects });
      saveToStorage(projects);
    } catch (error) {
      console.error("Failed to load projects:", error);
      set({ projects: loadFromStorage() });
    }
  },

  subscribeToProjects: () => {
    const projectsQuery = query(
      collection(db, "projects"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() } as Project);
      });
      set({ projects });
      saveToStorage(projects);
    });
    return unsubscribe;
  },

  addProject: async (project) => {
    try {
      const newProject = {
        ...project,
        createdAt: new Date().toISOString(),
      };

      // 🔥 Remove undefined fields (prevents Firestore errors)
      Object.keys(newProject).forEach(
        (key) =>
          newProject[key as keyof typeof newProject] === undefined &&
          delete newProject[key as keyof typeof newProject]
      );

      await addDoc(collection(db, "projects"), newProject);
    } catch (error) {
      console.error("Failed to add project:", error);
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const projectRef = doc(db, "projects", id);

      // 🔥 Clean undefined fields before updating
      const cleanedUpdates = { ...updates };
      Object.keys(cleanedUpdates).forEach(
        (key) =>
          cleanedUpdates[key as keyof typeof cleanedUpdates] === undefined &&
          delete cleanedUpdates[key as keyof typeof cleanedUpdates]
      );

      await updateDoc(projectRef, cleanedUpdates);
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      const projectRef = doc(db, "projects", id);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  },
}));
