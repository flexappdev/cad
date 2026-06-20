// Shared catalogue facets — single source of truth for nav + filters.
// Keeps src/lib/schema.ts focused on Zod and lets components import facets
// without pulling Zod into client bundles.

import type { LucideIcon } from "lucide-react";
import {
  Sparkles, Brain, Cog, BarChart3, Eye, FileText, Wrench, Rocket, Globe2,
  GraduationCap, Users, Shield, BookMarked,
} from "lucide-react";

export const CATEGORIES = [
  "Foundations",
  "AI Engineering",
  "Machine Learning",
  "Computer Vision",
  "NLP",
  "MLOps",
  "AI Product",
  "Generative AI",
  "Social Science",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CAT_ICON: Record<Category, LucideIcon> = {
  "Foundations":      Brain,
  "AI Engineering":   Cog,
  "Machine Learning": BarChart3,
  "Computer Vision":  Eye,
  "NLP":              FileText,
  "MLOps":            Wrench,
  "AI Product":       Rocket,
  "Generative AI":    Sparkles,
  "Social Science":   Globe2,
};

export const FLOWS = [
  { id: "student", label: "Student",  icon: GraduationCap, blurb: "Enrol, learn, take quizzes, earn certs." },
  { id: "teacher", label: "Teacher",  icon: BookMarked,    blurb: "Author courses, review progress." },
  { id: "admin",   label: "Admin",    icon: Users,         blurb: "Manage catalogue and workspaces." },
  { id: "super",   label: "Super",    icon: Shield,        blurb: "Blueprint: product · UX · tech specs." },
] as const;

export type FlowId = (typeof FLOWS)[number]["id"];
export const FLOW_IDS = FLOWS.map((f) => f.id) as readonly FlowId[];

export function isFlow(s: string | null | undefined): s is FlowId {
  return !!s && (FLOW_IDS as readonly string[]).includes(s);
}
