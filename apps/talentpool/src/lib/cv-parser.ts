import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { supabase, getEdgeError, FriendlyError } from '@digihire/shared';

// Use Vite's ?url import so the worker is served as a static asset
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export interface ParsedCvData {
  full_name?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  experience_years?: number;
  skills?: string[];
  languages?: string[];
  work_history?: { summary: string }[];
  education?: { summary: string }[];
  linkedin_url?: string;
  role_interests?: string[];
  industry_experience?: string[];
}

async function extractTextFromPdf(base64: string): Promise<string> {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .filter((item): item is TextItem => 'str' in item)
      .map(item => item.str)
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n');
}

export async function parseCvWithOpenAI(cvBase64: string): Promise<ParsedCvData> {
  // PDF text extraction is safe to do client-side (no secret needed); the AI call
  // happens server-side in the `parse-cv` edge function so the API key is never
  // shipped in the browser bundle.
  const cvText = await extractTextFromPdf(cvBase64);
  if (!cvText.trim()) throw new FriendlyError("We couldn't read any text from this PDF. Please upload a text-based PDF (not a scanned image).");

  const { data, error } = await supabase.functions.invoke('parse-cv', {
    body: { cvText },
  });

  const errorBody = data && typeof data === 'object' && 'error' in data ? (data as { error?: string }).error : undefined;
  if (error || errorBody) {
    throw new FriendlyError(await getEdgeError(error, data, "We couldn't analyze your CV. Please try again."));
  }

  const parsed = (data ?? {}) as Record<string, unknown>;

  return {
    full_name: (parsed.full_name as string) || undefined,
    phone: (parsed.phone as string) || undefined,
    city: (parsed.city as string) || undefined,
    state: (parsed.state as string) || undefined,
    country: (parsed.country as string) || undefined,
    bio: (parsed.bio as string) || undefined,
    experience_years: typeof parsed.experience_years === 'number' ? parsed.experience_years : undefined,
    skills: Array.isArray(parsed.skills) ? (parsed.skills as string[]) : [],
    languages: Array.isArray(parsed.languages) ? (parsed.languages as string[]) : [],
    work_history: (parsed.work_history_summary as string) ? [{ summary: parsed.work_history_summary as string }] : undefined,
    education: (parsed.education_summary as string) ? [{ summary: parsed.education_summary as string }] : undefined,
    linkedin_url: (parsed.linkedin_url as string) || undefined,
    role_interests: Array.isArray(parsed.role_interests) ? (parsed.role_interests as string[]) : [],
    industry_experience: Array.isArray(parsed.industry_experience) ? (parsed.industry_experience as string[]) : [],
  };
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const CV_SESSION_KEY = 'signup_cv_base64';
export const CV_NAME_SESSION_KEY = 'signup_cv_name';
export const LINKEDIN_SESSION_KEY = 'signup_linkedin_url';
