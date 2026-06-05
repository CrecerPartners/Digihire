import { useState } from "react";
import {
  useAdminCourses,
  useUpsertCourse,
  useDeleteCourse,
  useUpsertLesson,
  useDeleteLesson,
} from "@/hooks/useAdminData";
import { Button } from "@digihire/shared";
import { Input } from "@digihire/shared";
import { Textarea, RichTextEditor } from "@digihire/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@digihire/shared";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@digihire/shared";
import { toast } from "@digihire/shared";
import { Plus, Pencil, Trash2, ChevronDown, GraduationCap, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@digihire/shared";

const emptyCourse = { title: "", description: "", category: "General", level: "Beginner", cover_color: "#3B82F6", sort_order: 0 };
const emptyLesson = { title: "", module_title: "", module_number: 1, youtube_url: "", sort_order: 0, course_id: "" };

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function getCourseThumbnail(course: any): string | null {
  const lessons = course.training_lessons || [];
  if (lessons.length === 0) return null;
  const sorted = [...lessons].sort((a: any, b: any) => a.sort_order - b.sort_order);
  return getYouTubeThumbnail(sorted[0]?.youtube_url || "");
}

export default function AdminTraining() {
  const { data: courses, isLoading } = useAdminCourses();
  const upsertCourse = useUpsertCourse();
  const removeCourse = useDeleteCourse();
  const upsertLesson = useUpsertLesson();
  const removeLesson = useDeleteLesson();

  const [courseOpen, setCourseOpen] = useState(false);
  const [courseForm, setCourseForm] = useState<Record<string, any>>(emptyCourse);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState<Record<string, any>>(emptyLesson);

  const setC = (k: string, v: any) => setCourseForm((f) => ({ ...f, [k]: v }));
  const setL = (k: string, v: any) => setLessonForm((f) => ({ ...f, [k]: v }));

  const saveCourse = () => {
    upsertCourse.mutate(courseForm, {
      onSuccess: () => { toast({ title: "Course saved" }); setCourseOpen(false); },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const saveLesson = () => {
    upsertLesson.mutate(lessonForm, {
      onSuccess: () => { toast({ title: "Lesson saved" }); setLessonOpen(false); },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const lessonThumbnail = getYouTubeThumbnail(lessonForm.youtube_url || "");
  const lessonVideoId = extractYouTubeId(lessonForm.youtube_url || "");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Training Content</h2>
        <Button size="sm" onClick={() => { setCourseForm(emptyCourse); setCourseOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Course
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {courses?.map((course: any) => {
            const thumb = getCourseThumbnail(course);
            return (
              <Collapsible key={course.id}>
                <Card>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-10 w-14 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-14 rounded flex items-center justify-center" style={{ background: course.cover_color }}>
                            <GraduationCap className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{course.title}</CardTitle>
                          <p className="text-xs text-muted-foreground">{course.category} · {course.level} · {course.training_lessons?.length ?? 0} lessons</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setCourseForm({ ...course }); setCourseOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete course?")) removeCourse.mutate(course.id); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon"><ChevronDown className="h-4 w-4" /></Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Lessons</p>
                        <Button variant="outline" size="sm" onClick={() => { setLessonForm({ ...emptyLesson, course_id: course.id }); setLessonOpen(true); }}>
                          <Plus className="h-3 w-3 mr-1" /> Add Lesson
                        </Button>
                      </div>
                      {course.training_lessons?.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No lessons yet.</p>
                      ) : (
                        <div className="space-y-1">
                          {course.training_lessons?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((l: any) => {
                            const lThumb = getYouTubeThumbnail(l.youtube_url);
                            return (
                              <div key={l.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {lThumb ? (
                                    <img src={lThumb} alt="" className="h-8 w-12 rounded object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="h-8 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                      <Play className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span className="truncate">M{l.module_number}: {l.title}</span>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setLessonForm({ ...l }); setLessonOpen(true); }}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm("Delete lesson?")) removeLesson.mutate(l.id); }}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Course Dialog */}
      <Dialog open={courseOpen} onOpenChange={setCourseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{courseForm.id ? "Edit Course" : "New Course"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Title" value={courseForm.title} onChange={(e) => setC("title", e.target.value)} />
            <RichTextEditor value={courseForm.description || ''} onChange={html => setC("description", html)} placeholder="Description" minHeight="100px" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Category" value={courseForm.category} onChange={(e) => setC("category", e.target.value)} />
              <Input placeholder="Level" value={courseForm.level} onChange={(e) => setC("level", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm">Color</label>
                <input type="color" value={courseForm.cover_color} onChange={(e) => setC("cover_color", e.target.value)} className="h-8 w-10 rounded border" />
              </div>
              <Input type="number" placeholder="Sort Order" value={courseForm.sort_order} onChange={(e) => setC("sort_order", +e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseOpen(false)}>Cancel</Button>
            <Button onClick={saveCourse} disabled={upsertCourse.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog with YouTube preview */}
      <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{lessonForm.id ? "Edit Lesson" : "New Lesson"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Lesson Title" value={lessonForm.title} onChange={(e) => setL("title", e.target.value)} />
            <Input placeholder="Module Title" value={lessonForm.module_title} onChange={(e) => setL("module_title", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Module #" value={lessonForm.module_number} onChange={(e) => setL("module_number", +e.target.value)} />
              <Input type="number" placeholder="Sort Order" value={lessonForm.sort_order} onChange={(e) => setL("sort_order", +e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">YouTube Embed / Video Link</label>
              <Input placeholder="e.g. https://youtube.com/watch?v=... or embed URL" value={lessonForm.youtube_url} onChange={(e) => setL("youtube_url", e.target.value)} />
            </div>

            {/* YouTube Preview */}
            {lessonVideoId && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Video Preview</p>
                <div className="aspect-video rounded-lg overflow-hidden border">
                  <iframe
                    src={`https://www.youtube.com/embed/${lessonVideoId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {lessonThumbnail && (
                  <p className="text-xs text-muted-foreground">Thumbnail will be auto-extracted from this video.</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonOpen(false)}>Cancel</Button>
            <Button onClick={saveLesson} disabled={upsertLesson.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


