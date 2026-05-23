import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@digihire/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  cover_color: string;
  sort_order: number;
  created_at: string;
}

export interface TrainingLesson {
  id: string;
  course_id: string;
  module_number: number;
  module_title: string;
  title: string;
  youtube_url: string;
  sort_order: number;
  created_at: string;
}

export interface TrainingProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

export function useCourses() {
  return useQuery({
    queryKey: ["training-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_courses" as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as unknown as TrainingCourse[];
    },
  });
}

export function useCourseLessons(courseId: string | undefined) {
  return useQuery({
    queryKey: ["training-lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_lessons" as any)
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return data as unknown as TrainingLesson[];
    },
    enabled: !!courseId,
  });
}

export function useUserProgress(courseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["training-progress", user?.id, courseId],
    queryFn: async () => {
      // Get lesson IDs for this course first
      const { data: lessons } = await supabase
        .from("training_lessons" as any)
        .select("id")
        .eq("course_id", courseId!);
      
      if (!lessons?.length) return [] as TrainingProgress[];
      
      const lessonIds = (lessons as any[]).map((l: any) => l.id);
      const { data, error } = await supabase
        .from("training_progress" as any)
        .select("*")
        .eq("user_id", user!.id)
        .in("lesson_id", lessonIds);
      if (error) throw error;
      return data as unknown as TrainingProgress[];
    },
    enabled: !!user && !!courseId,
  });
}

export function useAllProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["training-progress-all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_progress" as any)
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as unknown as TrainingProgress[];
    },
    enabled: !!user,
  });
}

export function useMarkLessonComplete() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) => {
      if (completed) {
        const { error } = await supabase
          .from("training_progress" as any)
          .upsert({
            user_id: user!.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
          } as any, { onConflict: "user_id,lesson_id" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("training_progress" as any)
          .delete()
          .eq("user_id", user!.id)
          .eq("lesson_id", lessonId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-progress"] });
      queryClient.invalidateQueries({ queryKey: ["training-progress-all"] });
    },
  });
}


