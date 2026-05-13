import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@digihire/shared";
import { Badge } from "@digihire/shared";
import { Progress } from "@digihire/shared";
import { Button } from "@digihire/shared";
import { AspectRatio } from "@digihire/shared";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@digihire/shared";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Play,
  Loader2,
} from "lucide-react";
import {
  useCourses,
  useCourseLessons,
  useUserProgress,
  useMarkLessonComplete,
} from "@digihire/shared";

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function extractDriveId(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

type EmbedInfo =
  | { type: "youtube"; id: string }
  | { type: "drive"; id: string }
  | { type: "url"; url: string }
  | null;

function resolveEmbed(url: string | null | undefined): EmbedInfo {
  if (!url) return null;
  const ytId = extractYouTubeId(url);
  if (ytId) return { type: "youtube", id: ytId };
  const driveId = extractDriveId(url);
  if (driveId) return { type: "drive", id: driveId };
  if (url.startsWith("http")) return { type: "url", url };
  return null;
}

function LessonEmbed({ embed, title }: { embed: EmbedInfo; title?: string }) {
  if (!embed) return null;
  let src = "";
  if (embed.type === "youtube") src = `https://www.youtube.com/embed/${embed.id}?autoplay=1`;
  if (embed.type === "drive") src = `https://drive.google.com/file/d/${embed.id}/preview`;
  if (embed.type === "url") src = embed.url;
  return (
    <AspectRatio ratio={16 / 9}>
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </AspectRatio>
  );
}

const TrainingCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: courses } = useCourses();
  const { data: lessons, isLoading } = useCourseLessons(courseId);
  const { data: progress } = useUserProgress(courseId);
  const markComplete = useMarkLessonComplete();
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const course = courses?.find((c) => c.id === courseId);

  const modules = useMemo(() => {
    if (!lessons) return [];
    const map = new Map<number, { title: string; lessons: typeof lessons }>();
    lessons.forEach((l) => {
      if (!map.has(l.module_number)) {
        map.set(l.module_number, { title: l.module_title, lessons: [] });
      }
      map.get(l.module_number)!.lessons.push(l);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([num, data]) => ({ number: num, ...data }));
  }, [lessons]);

  const completedIds = useMemo(
    () => new Set(progress?.filter((p) => p.completed).map((p) => p.lesson_id) || []),
    [progress]
  );

  const totalLessons = lessons?.length || 0;
  const completedCount = completedIds.size;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const toggleComplete = (lessonId: string) => {
    markComplete.mutate({ lessonId, completed: !completedIds.has(lessonId) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => navigate("/training")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to courses
      </button>

      {course && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: course.cover_color }}
            >
              <Play className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-display">{course.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">{course.level}</Badge>
                <Badge variant="outline" className="text-[10px]">{course.category}</Badge>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{course.description}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedCount} of {totalLessons} lessons completed</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        </div>
      )}

      {/* Active video player */}
      {activeLesson && (() => {
        const lesson = lessons?.find((l) => l.id === activeLesson);
        const embed = resolveEmbed(lesson?.youtube_url);
        if (!embed) return null;
        return (
          <Card className="border-border/50 overflow-hidden">
            <LessonEmbed embed={embed} title={lesson?.title} />
            <CardContent className="p-3">
              <p className="text-sm font-medium">{lesson?.title}</p>
            </CardContent>
          </Card>
        );
      })()}

      {/* Course content */}
      <div>
        <h2 className="text-base font-display font-semibold mb-3">Course Content</h2>
        <Accordion type="multiple" defaultValue={modules.map((m) => String(m.number))}>
          {modules.map((mod) => (
            <AccordionItem key={mod.number} value={String(mod.number)}>
              <AccordionTrigger className="text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Module {mod.number}</span>
                  <span className="font-medium">{mod.title}</span>
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {mod.lessons.filter((l) => completedIds.has(l.id)).length}/{mod.lessons.length}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {mod.lessons.map((lesson) => {
                    const done = completedIds.has(lesson.id);
                    const isPlaying = activeLesson === lesson.id;
                    const embed = resolveEmbed(lesson.youtube_url);
                    return (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                          embed ? "cursor-pointer" : ""
                        } ${isPlaying ? "bg-primary/10" : embed ? "hover:bg-secondary" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleComplete(lesson.id); }}
                          className="shrink-0"
                        >
                          {done ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={!embed}
                          onClick={() => embed && setActiveLesson(isPlaying ? null : lesson.id)}
                          className="flex items-center gap-2 flex-1 text-left disabled:cursor-default"
                        >
                          <Play className={`h-3.5 w-3.5 shrink-0 ${embed ? "text-primary" : "text-muted-foreground/30"}`} />
                          <span className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
                            {lesson.title}
                          </span>
                          {!embed && (
                            <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium">Text</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default TrainingCourse;


