import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// Use Vite's ?url import so the worker is served as a static asset
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const ROLE_OPTIONS = ['B2B Sales', 'Tech Sales', 'SaaS Sales', 'SDR', 'BDR', 'Account Executive', 'Business Development', 'Sales Ops', 'Merchandiser', 'Field Sales', 'Closer'];
const INDUSTRY_OPTIONS = ['Tech', 'Fintech', 'SaaS', 'Healthtech', 'Financial Services', 'Telecoms', 'Retail', 'FMCG'];

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
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('CV parsing is not configured (missing VITE_OPENAI_API_KEY)');

  const cvText = await extractTextFromPdf(cvBase64);
  if (!cvText.trim()) throw new Error('Could not extract text from this PDF — try a text-based PDF (not a scanned image)');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a CV/resume parser. Extract structured information and return only valid JSON.',
        },
        {
          role: 'user',
          content: `Extract profile information from the CV text below. Return ONLY a valid JSON object with these exact keys (use null for missing fields, empty arrays for missing lists):

{
  "full_name": string or null,
  "phone": string or null,
  "city": string or null,
  "state": string or null,
  "country": string or null,
  "bio": "2-3 sentence professional summary" or null,
  "experience_years": number or null,
  "skills": string[],
  "languages": string[],
  "work_history_summary": "chronological work history as plain text (Company, role, dates each on a new line)" or null,
  "education_summary": "education background as plain text" or null,
  "linkedin_url": string or null,
  "role_interests": subset of ${JSON.stringify(ROLE_OPTIONS)} that match their roles,
  "industry_experience": subset of ${JSON.stringify(INDUSTRY_OPTIONS)} that match their background
}

CV TEXT:
${cvText.slice(0, 12000)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || `CV parsing failed (${response.status})`);
  }

  const result = await response.json() as { choices?: { message?: { content?: string } }[] };
  const text = result.choices?.[0]?.message?.content ?? '';

  const parsed = JSON.parse(text) as Record<string, unknown>;

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
