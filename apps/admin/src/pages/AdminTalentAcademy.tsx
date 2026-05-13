import { useState } from "react";
import {
  useAdminTalentCourses,
  useUpsertTalentCourse,
  useDeleteTalentCourse,
} from "@/hooks/useAdminData";
import { Button, Input, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Collapsible, CollapsibleContent, CollapsibleTrigger, toast, Card, CardContent, CardHeader, CardTitle } from "@digihire/shared";
import { Plus, Pencil, Trash2, ChevronDown, GraduationCap, Play } from "lucide-react";

const emptyCourse = { title: "", description: "", category: "General", thumbnail_url: "", has_certificate: false, is_published: false, modules: [] };
const emptyModule = { title: "", duration_minutes: 0, content: "", youtube_url: "" };

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function AdminTalentAcademy() {
  const { data: courses, isLoading } = useAdminTalentCourses();
  const upsertCourse = useUpsertTalentCourse();
  const removeCourse = useDeleteTalentCourse();

  const [courseOpen, setCourseOpen] = useState(false);
  const [courseForm, setCourseForm] = useState<Record<string, any>>(emptyCourse);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState<Record<string, any>>(emptyModule);
  const [editModuleIndex, setEditModuleIndex] = useState(-1);

  const setC = (k: string, v: any) => setCourseForm((f) => ({ ...f, [k]: v }));
  const setM = (k: string, v: any) => setModuleForm((f) => ({ ...f, [k]: v }));

  const saveCourse = () => {
    upsertCourse.mutate(courseForm, {
      onSuccess: () => { toast({ title: "Course saved" }); setCourseOpen(false); },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const openNewModule = (course: any) => {
    setCourseForm(course);
    setModuleForm(emptyModule);
    setEditModuleIndex(-1);
    setModuleOpen(true);
  };

  const openEditModule = (course: any, moduleData: any, idx: number) => {
    setCourseForm(course);
    setModuleForm(moduleData);
    setEditModuleIndex(idx);
    setModuleOpen(true);
  };

  const saveModule = () => {
    const updatedModules = [...(courseForm.modules || [])];
    if (editModuleIndex === -1) {
      updatedModules.push(moduleForm);
    } else {
      updatedModules[editModuleIndex] = moduleForm;
    }
    
    upsertCourse.mutate({ ...courseForm, modules: updatedModules }, {
      onSuccess: () => { toast({ title: "Module saved" }); setModuleOpen(false); },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const deleteModule = (course: any, idx: number) => {
    if (!confirm("Delete module?")) return;
    const updatedModules = [...(course.modules || [])];
    updatedModules.splice(idx, 1);
    upsertCourse.mutate({ ...course, modules: updatedModules });
  };

  const togglePublish = (course: any) => {
    upsertCourse.mutate({ ...course, is_published: !course.is_published });
  };

  const moduleVideoId = extractYouTubeId(moduleForm.youtube_url || "");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Talent Academy</h2>
        <Button size="sm" onClick={() => { setCourseForm(emptyCourse); setCourseOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Course
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {courses?.map((course: any) => {
            return (
              <Collapsible key={course.id}>
                <Card>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt="" className="h-10 w-14 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-14 rounded flex items-center justify-center bg-sky-600">
                            <GraduationCap className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{course.title}</CardTitle>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${course.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {course.is_published ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{course.category} · {(course.modules || []).length} modules</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => togglePublish(course)}>
                          {course.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
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
                        <p className="text-sm font-medium">Modules</p>
                        <Button variant="outline" size="sm" onClick={() => openNewModule(course)}>
                          <Plus className="h-3 w-3 mr-1" /> Add Module
                        </Button>
                      </div>
                      {(course.modules || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No modules yet.</p>
                      ) : (
                        <div className="space-y-1">
                          {(course.modules || []).map((m: any, idx: number) => {
                            const lThumb = extractYouTubeId(m.youtube_url) ? `https://img.youtube.com/vi/${extractYouTubeId(m.youtube_url)}/hqdefault.jpg` : null;
                            return (
                              <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {lThumb ? (
                                    <img src={lThumb} alt="" className="h-8 w-12 rounded object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="h-8 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                      <Play className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span className="truncate">Mod {idx + 1}: {m.title}</span>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModule(course, m, idx)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteModule(course, idx)}>
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
          <DialogHeader><DialogTitle>{courseForm.id ? "Edit Talent Course" : "New Talent Course"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Title" value={courseForm.title} onChange={(e: any) => setC("title", e.target.value)} />
            <Textarea placeholder="Description" value={courseForm.description} onChange={(e: any) => setC("description", e.target.value)} />
            <Input placeholder="Category" value={courseForm.category} onChange={(e: any) => setC("category", e.target.value)} />
            <Input placeholder="Thumbnail URL" value={courseForm.thumbnail_url} onChange={(e: any) => setC("thumbnail_url", e.target.value)} />
            <label className="flex items-center gap-2 text-sm mt-2">
              <input type="checkbox" checked={courseForm.has_certificate} onChange={(e) => setC("has_certificate", e.target.checked)} />
              Offers Certificate
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseOpen(false)}>Cancel</Button>
            <Button onClick={saveCourse} disabled={upsertCourse.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={moduleOpen} onOpenChange={setModuleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editModuleIndex !== -1 ? "Edit Module" : "New Module"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Module Title" value={moduleForm.title} onChange={(e: any) => setM("title", e.target.value)} />
            <Textarea placeholder="Text Content (Optional)" value={moduleForm.content} onChange={(e: any) => setM("content", e.target.value)} rows={4} />
            <Input type="number" placeholder="Duration (minutes)" value={moduleForm.duration_minutes} onChange={(e: any) => setM("duration_minutes", +e.target.value)} />
            
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">YouTube Embed / Video Link</label>
              <Input placeholder="e.g. https://youtube.com/watch?v=..." value={moduleForm.youtube_url} onChange={(e: any) => setM("youtube_url", e.target.value)} />
            </div>

            {/* YouTube Preview */}
            {moduleVideoId && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Video Preview</p>
                <div className="aspect-video rounded-lg overflow-hidden border">
                  <iframe
                    src={`https://www.youtube.com/embed/${moduleVideoId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleOpen(false)}>Cancel</Button>
            <Button onClick={saveModule} disabled={upsertCourse.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
