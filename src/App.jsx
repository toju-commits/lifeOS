import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Brain,
  Dumbbell,
  GraduationCap,
  Briefcase,
  Heart,
  Flame,
  Target,
  Lock,
  Upload,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Moon,
  Sun,
  Terminal,
  Trophy,
  Crosshair,
  Activity,
  Sword,
  BatteryCharging,
  Radar,
  Database,
  ScrollText,
  Plus,
  Users,
  X,
  Sparkles,
} from "lucide-react";

const initialMissions = [
  { id: 1, title: "Create Your LifeOS", area: "Genesis", urgency: "Critical", difficulty: "Easy", progress: 10, xp: 300, next: "Open Genesis and import a Life Mirror profile", reward: "+Personal OS online", streak: 0 },
  { id: 2, title: "Set First 3 Priorities", area: "Planning", urgency: "High", difficulty: "Easy", progress: 0, xp: 200, next: "Choose the three areas that matter most this week", reward: "+Focus restored", streak: 0 },
  { id: 3, title: "Build Daily Momentum", area: "Habits", urgency: "Medium", difficulty: "Medium", progress: 0, xp: 250, next: "Complete one task from the Daily board", reward: "+Momentum", streak: 0 },
];

const initialClasses = [
  { id: 1, name: "Life Admin", estimate: "Needs setup", best: "Organized", risk: "Medium", outreach: "Not started", action: "Use Genesis to personalize this section" },
  { id: 2, name: "Health / Energy", estimate: "Unknown", best: "Stable routine", risk: "Medium", outreach: "Not started", action: "Add current health or energy goals" },
  { id: 3, name: "School / Work", estimate: "Unknown", best: "Clear next steps", risk: "Medium", outreach: "Not started", action: "Add active deadlines or responsibilities" },
];

const iconMap = {
  Activity,
  BatteryCharging,
  Brain,
  Briefcase,
  CheckCircle2,
  Crosshair,
  Database,
  Dumbbell,
  GraduationCap,
  Heart,
  Mail,
  Radar,
  Shield,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  Upload,
  Users,
  Zap,
};

const defaultVaultItems = [
  { title: "Resume / Profile", status: "Optional", icon: "Briefcase", xp: 100 },
  { title: "Important Documents", status: "Optional", icon: "Upload", xp: 100 },
  { title: "Goal Evidence", status: "Optional", icon: "Target", xp: 100 },
  { title: "Accountability Contacts", status: "Optional", icon: "Mail", xp: 100 },
];

const defaultFutureQuests = [
  {
    title: "Custom Future Quest",
    type: "Long-term vision",
    status: "Blank",
    priority: "After Genesis setup",
    desc: "Use this section to park bigger dreams, experiments, projects, or future identities that should not distract from today's priorities.",
    mechanics: ["Long-term ideas", "Vision capture", "Future self planning", "Optional experiments"],
  },
];

const defaultCustomStats = [
  { label: "Setup", source: "setup", icon: "Sparkles", reason: "Based on whether Genesis profile is complete." },
  { label: "Focus", source: "focus", icon: "Target", reason: "Based on average mission progress." },
  { label: "Energy", source: "energy", icon: "BatteryCharging", reason: "Based on daily task completion and health/rest tasks." },
  { label: "Support", source: "support", icon: "Heart", reason: "Based on support/outreach-related areas." },
  { label: "Clarity", source: "clarity", icon: "Brain", reason: "Based on mission progress and daily completion." },
  { label: "Momentum", source: "momentum", icon: "Zap", reason: "Based on task completion, mission progress, and pending rewards." },
];

const defaultDashboardLabels = {
  stability: "Life Stability",
  completion: "Daily Completion",
  rewards: "Reward Queue",
  nextMove: "Next Move",
};

const systemRoadmap = [
  { title: "localStorage persistence", status: "Implemented", detail: "State survives refresh on the same browser/device. No cloud account yet." },
  { title: "Import / export JSON", status: "Implemented", detail: "Backup/restore full OS snapshots with sanitized JSON import." },
  { title: "Reward claim persistence", status: "Implemented", detail: "Claimed rewards, pending rewards, XP, logs, and tasks persist." },
  { title: "Stable reward IDs", status: "Implemented", detail: "Tasks now use stable IDs so deleting/reordering cannot create duplicate XP exploits." },
  { title: "Automatic badge logic", status: "Implemented", detail: "Badges can unlock from mission/class/system state instead of staying purely manual." },
  { title: "AI command parser", status: "Prototype", detail: "Use the AI Command tab for manual commands; true natural-language parsing is still v2." },
  { title: "Backend/database sync", status: "Later", detail: "Needs Supabase/Firebase or another backend when this stops being a local prototype." },
];

const STORAGE_KEY = "lifeos-profile-v1";
const LEGACY_STORAGE_KEY = "joshuaos-war-room-v1";
const PROFILE_INDEX_KEY = "lifeos-profiles-v1";

const defaultProfile = {
  name: "New Operator",
  archetype: "LifeOS User",
  mainQuest: "Build a personalized operating system",
  tagline: "Dump the chaos. Build the command center.",
  tone: "Direct and supportive",
  theme: "Hacker",
  currentSeason: "Genesis Setup",
};
const MAX_TASKS = 80;
const MAX_TEXT = 500;

const makeId = (prefix = "id") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const clamp = (num, min = 0, max = 100) => Math.max(min, Math.min(max, Number(num) || 0));
const safeText = (value, max = MAX_TEXT) => String(value ?? "").replace(/[<>]/g, "").slice(0, max).trim();
const slugText = (value) => safeText(value, 40).toLowerCase().split(" ").join("-");
const formatNumber = (value, decimals = 0) => {
  const num = Number(value) || 0;
  const fixed = num.toFixed(decimals);
  return fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed;
};
const displayPercent = (value) => formatNumber(clamp(value), 0);
const validTabs = new Set(["missions", "areas", "pathways", "vault", "daily", "genesis", "ai", "log", "future", "system", "achievements"]);
const normalizeTab = (value) => {
  const legacyAreasTab = ["g", "p", "a"].join("");
  const tab = value === legacyAreasTab ? "areas" : safeText(value, 40);
  return validTabs.has(tab) ? tab : "";
};

const hasPersonalizedProfile = (profile = {}) => {
  if (!profile || typeof profile !== "object") return false;
  return ["name", "archetype", "mainQuest", "currentSeason", "tagline"].some((key) => {
    const value = safeText(profile[key], 180);
    return value && value !== defaultProfile[key];
  });
};

const normalizeProfile = (profile = {}) => ({
  ...defaultProfile,
  ...profile,
  name: safeText(profile.name || defaultProfile.name, 80),
  archetype: safeText(profile.archetype || defaultProfile.archetype, 120),
  mainQuest: safeText(profile.mainQuest || defaultProfile.mainQuest, 160),
  tagline: safeText(profile.tagline || defaultProfile.tagline, 180),
  tone: safeText(profile.tone || defaultProfile.tone, 120),
  theme: safeText(profile.theme || defaultProfile.theme, 80),
  currentSeason: safeText(profile.currentSeason || defaultProfile.currentSeason, 120),
});

const normalizeTask = (task, idx = 0) => ({
  id: task?.id || `seed-task-${idx}-${slugText(task?.text)}`,
  text: safeText(task?.text || "Untitled task"),
  done: Boolean(task?.done),
  xp: Math.round(clamp(task?.xp ?? 50, 5, 1000)),
  missionId: task?.missionId ?? null,
  classId: task?.classId ?? null,
});

const normalizeMission = (mission, idx = 0) => ({
  id: mission?.id ?? idx + 1,
  title: safeText(mission?.title || "Untitled Mission", 120),
  area: safeText(mission?.area || "General", 80),
  urgency: safeText(mission?.urgency || "Medium", 40),
  difficulty: safeText(mission?.difficulty || "Medium", 40),
  progress: clamp(mission?.progress ?? 0),
  xp: Math.round(clamp(mission?.xp ?? 100, 10, 5000)),
  next: safeText(mission?.next || "Define next action", 180),
  reward: safeText(mission?.reward || "+Progress", 120),
  streak: clamp(mission?.streak ?? 0, 0, 999),
});

const normalizeClass = (item, idx = 0) => ({
  id: item?.id ?? idx + 1,
  name: safeText(item?.name || "Untitled Class", 120),
  estimate: safeText(item?.estimate || "Unknown", 220),
  best: safeText(item?.best || "Unknown", 220),
  risk: safeText(item?.risk || "Medium", 80),
  outreach: safeText(item?.outreach || "Not yet", 160),
  action: safeText(item?.action || "Define action", 260),
});

const normalizeVaultItem = (item, idx = 0) => ({
  title: safeText(item?.title || `Vault Item ${idx + 1}`, 120),
  status: safeText(item?.status || "Optional", 60),
  icon: safeText(item?.icon || "Database", 40),
  xp: Math.round(clamp(item?.xp ?? 100, 0, 5000)),
});

const normalizeFutureQuest = (quest, idx = 0) => ({
  title: safeText(quest?.title || `Future Quest ${idx + 1}`, 120),
  type: safeText(quest?.type || "Long-term vision", 120),
  status: safeText(quest?.status || "Blank", 80),
  priority: safeText(quest?.priority || "Later", 100),
  desc: safeText(quest?.desc || "Capture a future goal or experiment.", 500),
  mechanics: Array.isArray(quest?.mechanics) && quest.mechanics.length
    ? quest.mechanics.slice(0, 8).map((item) => safeText(item, 120))
    : ["Vision capture", "Next action", "Optional experiment"],
});

const normalizeCustomStat = (stat, idx = 0) => ({
  label: safeText(stat?.label || `Stat ${idx + 1}`, 80),
  source: safeText(stat?.source || stat?.key || slugText(stat?.label || `stat-${idx}`), 40),
  value: stat?.value === undefined ? undefined : Math.round(clamp(stat.value)),
  icon: iconMap[safeText(stat?.icon, 40)] ? safeText(stat?.icon, 40) : "Sparkles",
  reason: safeText(stat?.reason || "", 220),
});

const normalizeDashboardLabels = (labels = {}) => ({
  ...defaultDashboardLabels,
  ...Object.fromEntries(
    Object.entries(labels || {}).map(([key, value]) => [key, safeText(value, 80)])
  ),
});

const makeProfileId = () => `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const getProfileSlotName = (snapshot = {}) => safeText(snapshot.profile?.name || "New Profile", 80) || "New Profile";
const createStarterSnapshot = () => ({
  profile: defaultProfile,
  mode: "dark",
  missions: initialMissions,
  classes: initialClasses,
  vaultItems: defaultVaultItems,
  futureQuests: defaultFutureQuests,
  customStats: defaultCustomStats,
  statConfig: defaultCustomStats,
  dashboardLabels: defaultDashboardLabels,
  dailyTasks: [
    { id: "task-open-genesis", text: "Open Genesis and create/import a personalized profile", done: false, xp: 80, missionId: 1, classId: null },
    { id: "task-pick-priorities", text: "Pick three priorities for this week", done: false, xp: 60, missionId: 2, classId: null },
    { id: "task-complete-first-action", text: "Complete one concrete action today", done: false, xp: 50, missionId: 3, classId: null },
  ],
  xp: 0,
  claimedRewards: {},
  pendingRewards: [],
  activityLog: [],
  lastTab: "genesis",
  savedAt: new Date().toISOString(),
});

const isKeepMainQuestAnswer = (answer) => {
  const text = safeText(answer, 120).toLowerCase();
  if (!text) return false;
  return (
    text === "yes" ||
    text.startsWith("yes,") ||
    text.includes("keep it") ||
    text.includes("keep this") ||
    text.includes("keep exactly") ||
    text.includes("exactly like this") ||
    text.includes("looks good") ||
    text.includes("use this")
  );
};

const achievements = [
  { title: "Genesis Started", desc: "Opened the LifeOS setup flow", unlocked: true },
  { title: "OS Online", desc: "Launch a personalized profile", unlocked: false },
  { title: "First Task Claimed", desc: "Complete and claim one task", unlocked: false },
  { title: "Momentum Builder", desc: "Reach 1,000 XP", unlocked: false },
  { title: "Mission Finisher", desc: "Complete one mission", unlocked: false },
  { title: "Shadow Clone v1", desc: "Use AI to generate a working life system", unlocked: true },
];

const theme = {
  dark: {
    page: "bg-[#050807] text-emerald-50",
    card: "bg-black/85 border-emerald-300/45 text-emerald-50 shadow-[0_0_35px_rgba(16,185,129,0.16)] backdrop-blur-xl",
    inner: "bg-emerald-950/55 border-emerald-300/35 text-emerald-50",
    text: "text-emerald-50",
    muted: "text-emerald-100",
    dim: "text-emerald-200",
    input: "bg-black/90 border-emerald-300/50 text-emerald-50 placeholder:text-emerald-100/70",
    grid: "terminal-grid-dark",
    glow: "from-emerald-400 via-cyan-300 to-lime-300",
    accent: "text-emerald-300",
    button: "bg-emerald-400 text-black hover:bg-emerald-300",
    danger: "bg-red-500/15 text-red-200 border-red-400/30",
    warn: "bg-amber-500/15 text-amber-200 border-amber-400/30",
    ok: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
  },
  light: {
    page: "bg-[#eefaf4] text-slate-950",
    card: "bg-white/72 border-emerald-700/20 shadow-[0_18px_55px_rgba(15,118,110,0.14)] backdrop-blur-xl",
    inner: "bg-emerald-50/80 border-emerald-700/15",
    text: "text-slate-950",
    muted: "text-slate-700",
    dim: "text-slate-500",
    input: "bg-white/85 border-emerald-700/20 text-slate-950 placeholder:text-slate-400",
    grid: "terminal-grid-light",
    glow: "from-emerald-600 via-cyan-600 to-lime-600",
    accent: "text-emerald-700",
    button: "bg-slate-950 text-emerald-100 hover:bg-slate-800",
    danger: "bg-red-100 text-red-800 border-red-200",
    warn: "bg-amber-100 text-amber-800 border-amber-200",
    ok: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

const themePackOverrides = {
  "soft wellness": {
    dark: {
      page: "bg-[#17211b] text-[#fff7ed]",
      card: "bg-[#24352d]/88 border-[#f7c8d6]/35 text-[#fff7ed] shadow-[0_18px_45px_rgba(20,83,45,0.16)] backdrop-blur-xl",
      inner: "bg-[#f8f1df]/10 border-[#f7c8d6]/25 text-[#fff7ed]",
      text: "text-[#fff7ed]",
      muted: "text-[#f8e8cf]",
      dim: "text-[#d9c7ad]",
      input: "bg-[#fff7ed]/10 border-[#f7c8d6]/35 text-[#fff7ed] placeholder:text-[#f8e8cf]/70",
      grid: "soft-wellness-grid",
      glow: "from-mint-300 via-emerald-200 to-rose-200",
      accent: "text-rose-200",
      button: "bg-[#f7c8d6] text-[#253327] hover:bg-[#f3b6c9]",
      danger: "bg-rose-300/18 text-rose-100 border-rose-200/35",
      warn: "bg-amber-200/18 text-amber-100 border-amber-100/35",
      ok: "bg-emerald-200/18 text-emerald-100 border-emerald-100/35",
      terminal: false,
    },
    light: {
      page: "bg-[#fbf6ec] text-[#253327]",
      card: "bg-white/78 border-[#d9b8a8]/35 shadow-[0_18px_45px_rgba(127,95,74,0.13)] backdrop-blur-xl",
      inner: "bg-[#f4ead8]/80 border-[#d9b8a8]/35",
      text: "text-[#253327]",
      muted: "text-[#5f6d5f]",
      dim: "text-[#8a7a68]",
      input: "bg-white/85 border-[#d9b8a8]/40 text-[#253327] placeholder:text-[#8a7a68]",
      grid: "soft-wellness-grid",
      glow: "from-emerald-300 via-mint-200 to-rose-200",
      accent: "text-[#b86f7f]",
      button: "bg-[#486653] text-[#fff7ed] hover:bg-[#3c5947]",
      danger: "bg-rose-100 text-rose-800 border-rose-200",
      warn: "bg-amber-100 text-amber-800 border-amber-200",
      ok: "bg-emerald-100 text-emerald-800 border-emerald-200",
      terminal: false,
    },
  },
  "clean professional": {
    dark: {
      page: "bg-slate-950 text-slate-50",
      card: "bg-slate-900/88 border-slate-700/70 text-slate-50 shadow-[0_18px_45px_rgba(15,23,42,0.25)] backdrop-blur-xl",
      inner: "bg-slate-800/70 border-slate-700/70 text-slate-50",
      text: "text-slate-50",
      muted: "text-slate-300",
      dim: "text-slate-400",
      input: "bg-slate-950/80 border-slate-600/70 text-slate-50 placeholder:text-slate-500",
      grid: "professional-grid-dark",
      glow: "from-sky-400 via-cyan-300 to-emerald-300",
      accent: "text-sky-300",
      button: "bg-sky-300 text-slate-950 hover:bg-sky-200",
      danger: "bg-red-500/14 text-red-200 border-red-400/30",
      warn: "bg-amber-500/14 text-amber-200 border-amber-400/30",
      ok: "bg-sky-500/14 text-sky-200 border-sky-400/30",
      terminal: false,
    },
    light: {
      page: "bg-slate-50 text-slate-950",
      card: "bg-white/86 border-slate-200 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl",
      inner: "bg-slate-100/80 border-slate-200",
      text: "text-slate-950",
      muted: "text-slate-700",
      dim: "text-slate-500",
      input: "bg-white border-slate-300 text-slate-950 placeholder:text-slate-400",
      grid: "professional-grid-light",
      glow: "from-sky-600 via-cyan-600 to-emerald-600",
      accent: "text-sky-700",
      button: "bg-slate-950 text-white hover:bg-slate-800",
      danger: "bg-red-50 text-red-800 border-red-200",
      warn: "bg-amber-50 text-amber-800 border-amber-200",
      ok: "bg-sky-50 text-sky-800 border-sky-200",
      terminal: false,
    },
  },
  "luxury minimal": {
    dark: { page: "bg-[#11100d] text-[#f7f0df]", card: "bg-[#1d1a14]/90 border-[#c8aa6a]/35 text-[#f7f0df] shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-xl", inner: "bg-[#2a2418]/75 border-[#c8aa6a]/30", text: "text-[#f7f0df]", muted: "text-[#d8c8a5]", dim: "text-[#a79776]", input: "bg-[#11100d]/80 border-[#c8aa6a]/35 text-[#f7f0df]", grid: "minimal-grid-dark", glow: "from-[#c8aa6a] via-[#eee2bd] to-[#9ca3af]", accent: "text-[#d8b86c]", button: "bg-[#d8b86c] text-black hover:bg-[#eed28d]", danger: "bg-red-500/14 text-red-200 border-red-400/30", warn: "bg-[#c8aa6a]/15 text-[#f7e5b2] border-[#c8aa6a]/35", ok: "bg-[#d8b86c]/15 text-[#f7e5b2] border-[#d8b86c]/35", terminal: false },
    light: { page: "bg-[#f7f3ea] text-[#191713]", card: "bg-white/82 border-[#d8c29a]/45 shadow-[0_18px_45px_rgba(64,50,28,0.10)] backdrop-blur-xl", inner: "bg-[#f1eadb]/85 border-[#d8c29a]/45", text: "text-[#191713]", muted: "text-[#5d5444]", dim: "text-[#85765e]", input: "bg-white/85 border-[#d8c29a]/50 text-[#191713]", grid: "minimal-grid-light", glow: "from-[#9b7a32] via-[#d8b86c] to-[#64748b]", accent: "text-[#8b6a22]", button: "bg-[#191713] text-[#f7f3ea] hover:bg-[#2b261d]", danger: "bg-red-50 text-red-800 border-red-200", warn: "bg-amber-50 text-amber-800 border-amber-200", ok: "bg-stone-100 text-stone-800 border-stone-200", terminal: false },
  },
  "dark fantasy": {
    dark: { page: "bg-[#0d0712] text-[#f5e8ff]", card: "bg-[#180f20]/90 border-fuchsia-300/35 text-[#f5e8ff] shadow-[0_0_35px_rgba(168,85,247,0.18)] backdrop-blur-xl", inner: "bg-[#281337]/65 border-fuchsia-300/30", text: "text-[#f5e8ff]", muted: "text-purple-100", dim: "text-purple-200/75", input: "bg-black/60 border-fuchsia-300/35 text-[#f5e8ff]", grid: "fantasy-grid-dark", glow: "from-fuchsia-400 via-violet-300 to-rose-300", accent: "text-fuchsia-300", button: "bg-fuchsia-300 text-black hover:bg-fuchsia-200", danger: "bg-rose-500/16 text-rose-200 border-rose-300/30", warn: "bg-violet-500/16 text-violet-100 border-violet-300/30", ok: "bg-fuchsia-500/16 text-fuchsia-100 border-fuchsia-300/30" },
    light: { page: "bg-[#f7efff] text-[#24112f]", card: "bg-white/82 border-violet-200 shadow-[0_18px_45px_rgba(88,28,135,0.12)] backdrop-blur-xl", inner: "bg-violet-50/80 border-violet-200", text: "text-[#24112f]", muted: "text-violet-900/75", dim: "text-violet-800/55", input: "bg-white/85 border-violet-200 text-[#24112f]", grid: "fantasy-grid-light", glow: "from-fuchsia-600 via-violet-600 to-rose-500", accent: "text-violet-700", button: "bg-violet-950 text-violet-50 hover:bg-violet-800", danger: "bg-rose-50 text-rose-800 border-rose-200", warn: "bg-violet-50 text-violet-800 border-violet-200", ok: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200" },
  },
  "anime hero": {
    dark: { page: "bg-[#06111f] text-cyan-50", card: "bg-[#0a1b30]/88 border-cyan-300/35 text-cyan-50 shadow-[0_0_35px_rgba(34,211,238,0.18)] backdrop-blur-xl", inner: "bg-cyan-950/45 border-cyan-300/30", text: "text-cyan-50", muted: "text-cyan-100", dim: "text-cyan-200/75", input: "bg-[#06111f]/80 border-cyan-300/40 text-cyan-50", grid: "hero-grid-dark", glow: "from-cyan-300 via-sky-300 to-amber-200", accent: "text-cyan-300", button: "bg-cyan-300 text-slate-950 hover:bg-cyan-200", danger: "bg-rose-500/16 text-rose-200 border-rose-300/30", warn: "bg-amber-500/16 text-amber-200 border-amber-300/30", ok: "bg-cyan-500/16 text-cyan-100 border-cyan-300/30" },
    light: { page: "bg-[#eef8ff] text-[#102033]", card: "bg-white/82 border-sky-200 shadow-[0_18px_45px_rgba(14,116,144,0.10)] backdrop-blur-xl", inner: "bg-sky-50/85 border-sky-200", text: "text-[#102033]", muted: "text-sky-950/75", dim: "text-sky-900/55", input: "bg-white/85 border-sky-200 text-[#102033]", grid: "hero-grid-light", glow: "from-cyan-600 via-sky-500 to-amber-400", accent: "text-sky-700", button: "bg-sky-950 text-white hover:bg-sky-800", danger: "bg-rose-50 text-rose-800 border-rose-200", warn: "bg-amber-50 text-amber-800 border-amber-200", ok: "bg-sky-50 text-sky-800 border-sky-200" },
  },
  "calm dark mode": {
    dark: { page: "bg-[#0f1720] text-slate-100", card: "bg-[#17212e]/88 border-slate-600/45 text-slate-100 shadow-[0_18px_45px_rgba(2,6,23,0.20)] backdrop-blur-xl", inner: "bg-slate-800/60 border-slate-600/45", text: "text-slate-100", muted: "text-slate-300", dim: "text-slate-400", input: "bg-slate-950/50 border-slate-600/60 text-slate-100", grid: "professional-grid-dark", glow: "from-teal-300 via-slate-300 to-sky-300", accent: "text-teal-300", button: "bg-teal-300 text-slate-950 hover:bg-teal-200", danger: "bg-red-500/14 text-red-200 border-red-400/30", warn: "bg-amber-500/14 text-amber-200 border-amber-400/30", ok: "bg-teal-500/14 text-teal-200 border-teal-400/30", terminal: false },
    light: null,
  },
  "minimal light mode": {
    dark: null,
    light: { page: "bg-white text-slate-950", card: "bg-white border-slate-200 shadow-[0_10px_35px_rgba(15,23,42,0.06)]", inner: "bg-slate-50 border-slate-200", text: "text-slate-950", muted: "text-slate-700", dim: "text-slate-500", input: "bg-white border-slate-300 text-slate-950", grid: "minimal-grid-light", glow: "from-slate-700 via-slate-500 to-slate-400", accent: "text-slate-700", button: "bg-slate-950 text-white hover:bg-slate-800", danger: "bg-red-50 text-red-800 border-red-200", warn: "bg-amber-50 text-amber-800 border-amber-200", ok: "bg-slate-100 text-slate-800 border-slate-200", terminal: false },
  },
  "cozy home": {
    dark: { page: "bg-[#211813] text-[#fff4e6]", card: "bg-[#2d211a]/90 border-orange-200/25 text-[#fff4e6] shadow-[0_18px_45px_rgba(67,20,7,0.18)] backdrop-blur-xl", inner: "bg-[#3a2a21]/75 border-orange-200/25", text: "text-[#fff4e6]", muted: "text-[#f5d9ba]", dim: "text-[#caa989]", input: "bg-[#211813]/75 border-orange-200/30 text-[#fff4e6]", grid: "cozy-grid-dark", glow: "from-orange-200 via-amber-200 to-emerald-200", accent: "text-amber-200", button: "bg-amber-200 text-[#211813] hover:bg-amber-100", danger: "bg-rose-500/14 text-rose-200 border-rose-300/30", warn: "bg-amber-500/16 text-amber-100 border-amber-200/30", ok: "bg-emerald-500/14 text-emerald-100 border-emerald-300/30", terminal: false },
    light: { page: "bg-[#fff7ed] text-[#2b2119]", card: "bg-white/78 border-orange-200/70 shadow-[0_18px_45px_rgba(124,45,18,0.10)] backdrop-blur-xl", inner: "bg-orange-50/80 border-orange-200/70", text: "text-[#2b2119]", muted: "text-[#6f5743]", dim: "text-[#967b63]", input: "bg-white/85 border-orange-200 text-[#2b2119]", grid: "cozy-grid-light", glow: "from-orange-400 via-amber-300 to-emerald-300", accent: "text-orange-700", button: "bg-[#2b2119] text-[#fff7ed] hover:bg-[#463629]", danger: "bg-rose-50 text-rose-800 border-rose-200", warn: "bg-amber-50 text-amber-800 border-amber-200", ok: "bg-emerald-50 text-emerald-800 border-emerald-200", terminal: false },
  },
};

const getThemePack = (profileTheme = "Hacker", mode = "dark") => {
  const requested = safeText(profileTheme || "Hacker", 100).toLowerCase();
  const key = Object.keys(themePackOverrides).find((name) => requested.includes(name));
  const override = key ? themePackOverrides[key]?.[mode] : null;
  return { ...theme[mode], ...(override || {}) };
};

function Progress({ value, t, pulse = false }) {
  return (
    <div className="h-2.5 rounded-full bg-black/25 overflow-hidden border border-white/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamp(value)}%` }}
        transition={{ duration: 0.75 }}
        className={`h-full bg-gradient-to-r ${t.glow} ${pulse ? "animate-pulse" : ""}`}
      />
    </div>
  );
}

function StatBar({ label, value, icon: Icon, t, explanation }) {
  return (
    <div className="space-y-1.5" title={explanation}>
      <div className={`flex items-center justify-between text-xs ${t.muted}`}>
        <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{label}</span>
        <span>{displayPercent(value)}%</span>
      </div>
      <Progress value={value} t={t} />
      {explanation && <p className={`text-[11px] leading-snug ${t.dim}`}>{explanation}</p>}
    </div>
  );
}

function MissionCard({ mission, updateProgress, completeMission, t }) {
  const urgencyStyle = mission.urgency === "Critical" ? t.danger : mission.urgency === "High" ? t.warn : t.ok;
  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`${t.card} rounded-2xl overflow-hidden relative`}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-70" />
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={`font-bold ${t.text}`}>{mission.title}</h3>
              <p className={`text-xs ${t.dim}`}>{mission.area} • {mission.difficulty} • {mission.xp} XP</p>
            </div>
            <Badge className={`${urgencyStyle} border`}>{mission.urgency}</Badge>
          </div>
          <div>
            <div className={`flex justify-between text-xs ${t.muted} mb-1`}><span>Progress</span><span>{displayPercent(mission.progress)}%</span></div>
            <Progress value={mission.progress} t={t} pulse={mission.urgency === "Critical"} />
          </div>
          <div className={`text-sm ${t.text}`}><span className={t.dim}>NEXT ACTION:</span> {mission.next}</div>
          <div className={`text-xs ${t.accent}`}><span className={t.dim}>REWARD:</span> {mission.reward}</div>
          <div className="flex items-center justify-between pt-1">
            <div className={`flex items-center gap-1 text-xs ${t.muted}`}><Flame className="h-3.5 w-3.5" /> Streak: {mission.streak}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-current bg-transparent" onClick={() => updateProgress(mission.id, -10)}>-10</Button>
              <Button size="sm" className={t.button} onClick={() => updateProgress(mission.id, 10)}>+10</Button>
              <Button size="sm" className="bg-lime-400 text-black hover:bg-lime-300" onClick={() => completeMission(mission.id)}>Done</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TerminalLine({ children, t }) {
  return <div className={`font-mono text-xs ${t.muted}`}><span className={t.accent}>root@lifeos:~$</span> {children}</div>;
}

export default function LifeOSGenesis() {
  const [mode, setMode] = useState("dark");
  const [profile, setProfile] = useState(defaultProfile);
  const [tabValue, setTabValue] = useState("genesis");
  const t = getThemePack(profile.theme, mode);
  const [missions, setMissions] = useState(initialMissions);
  const [classes, setClasses] = useState(initialClasses);
  const [personalVaultItems, setPersonalVaultItems] = useState(defaultVaultItems);
  const [personalFutureQuests, setPersonalFutureQuests] = useState(defaultFutureQuests);
  const [customStats, setCustomStats] = useState(defaultCustomStats);
  const [dashboardLabels, setDashboardLabels] = useState(defaultDashboardLabels);
  const [dailyInput, setDailyInput] = useState("");
  const [genesisStep, setGenesisStep] = useState(1);
  const [genesisLoading, setGenesisLoading] = useState(false);
  const [genesisMode, setGenesisMode] = useState("known");
  const [mirrorJsonInput, setMirrorJsonInput] = useState("");
  const [generatedProfile, setGeneratedProfile] = useState(null);
  const [genesisQuestions, setGenesisQuestions] = useState([]);
  const [genesisAnswers, setGenesisAnswers] = useState({});
  const [mirrorPromptCopied, setMirrorPromptCopied] = useState(false);
  const [xp, setXp] = useState(0);
  const [xpPop, setXpPop] = useState(null);
  const [claimedRewards, setClaimedRewards] = useState({});
  const [pendingRewards, setPendingRewards] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [importText, setImportText] = useState("");
  const [systemMessage, setSystemMessage] = useState("Autosave armed. Local browser storage active.");
  const [hydrated, setHydrated] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [profileIndex, setProfileIndex] = useState({ activeProfileId: "", profiles: [] });
  const [dailyTasks, setDailyTasks] = useState([
    { id: "task-open-genesis", text: "Open Genesis and create/import a personalized profile", done: false, xp: 80, missionId: 1, classId: null },
    { id: "task-pick-priorities", text: "Pick three priorities for this week", done: false, xp: 60, missionId: 2, classId: null },
    { id: "task-complete-first-action", text: "Complete one concrete action today", done: false, xp: 50, missionId: 3, classId: null },
  ]);

  const buildSnapshot = () => ({
    profile,
    mode,
    missions,
    classes,
    vaultItems: personalVaultItems,
    futureQuests: personalFutureQuests,
    customStats,
    statConfig: customStats,
    dashboardLabels,
    dailyTasks,
    xp,
    claimedRewards,
    pendingRewards,
    activityLog,
    lastTab: tabValue,
    savedAt: new Date().toISOString(),
  });

  const applySnapshot = (data = {}, forceGenesis = false) => {
    const loadedProfile = normalizeProfile(data.profile || {});
    setProfile(loadedProfile);
    setMode(data.mode || "dark");
    setMissions(Array.isArray(data.missions) ? data.missions.slice(0, 30).map(normalizeMission) : initialMissions);
    setClasses(Array.isArray(data.classes) ? data.classes.slice(0, 30).map(normalizeClass) : initialClasses);
    setPersonalVaultItems(Array.isArray(data.vaultItems) ? data.vaultItems.slice(0, 30).map(normalizeVaultItem) : defaultVaultItems);
    setPersonalFutureQuests(Array.isArray(data.futureQuests) ? data.futureQuests.slice(0, 20).map(normalizeFutureQuest) : defaultFutureQuests);
    const savedStats = Array.isArray(data.customStats) ? data.customStats : Array.isArray(data.statConfig) ? data.statConfig : data.stats;
    setCustomStats(Array.isArray(savedStats) ? savedStats.slice(0, 12).map(normalizeCustomStat) : defaultCustomStats);
    setDashboardLabels(data.dashboardLabels && typeof data.dashboardLabels === "object" ? normalizeDashboardLabels(data.dashboardLabels) : defaultDashboardLabels);
    setDailyTasks(Array.isArray(data.dailyTasks) ? data.dailyTasks.slice(0, MAX_TASKS).map(normalizeTask) : createStarterSnapshot().dailyTasks);
    setXp(typeof data.xp === "number" ? Math.round(clamp(data.xp, 0, 1000000)) : 0);
    setClaimedRewards(data.claimedRewards && typeof data.claimedRewards === "object" ? data.claimedRewards : {});
    setPendingRewards(Array.isArray(data.pendingRewards) ? data.pendingRewards.slice(0, 80).map((r, idx) => ({ id: safeText(r.id || `reward-${idx}`, 120), amount: Math.round(clamp(r.amount, 1, 5000)), reason: safeText(r.reason || "Pending reward", 220) })) : []);
    setActivityLog(Array.isArray(data.activityLog) ? data.activityLog.slice(0, 20).map(x => safeText(x, 260)) : []);
    const savedTab = normalizeTab(data.lastTab || data.tabValue);
    setTabValue(forceGenesis ? "genesis" : savedTab || (hasPersonalizedProfile(loadedProfile) ? "missions" : "genesis"));
  };

  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem(PROFILE_INDEX_KEY);
      if (savedProfiles) {
        const parsedIndex = JSON.parse(savedProfiles);
        const profiles = Array.isArray(parsedIndex.profiles) ? parsedIndex.profiles.filter(slot => slot?.id && slot?.data) : [];
        if (profiles.length) {
          const nextActiveId = profiles.some(slot => slot.id === parsedIndex.activeProfileId) ? parsedIndex.activeProfileId : profiles[0].id;
          const activeSlot = profiles.find(slot => slot.id === nextActiveId) || profiles[0];
          setProfileIndex({ activeProfileId: nextActiveId, profiles });
          setActiveProfileId(nextActiveId);
          applySnapshot(activeSlot.data);
          setSystemMessage("Local profile loaded from this browser.");
          return;
        }
      }

      const primarySave = localStorage.getItem(STORAGE_KEY);
      const legacySave = localStorage.getItem(LEGACY_STORAGE_KEY);
      const saved = primarySave || legacySave;
      const loadedLegacy = !primarySave && Boolean(legacySave);
      const migratedId = makeProfileId();
      if (saved) {
        const data = JSON.parse(saved);
        const migratedSlot = { id: migratedId, name: getProfileSlotName(data), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), data };
        setProfileIndex({ activeProfileId: migratedId, profiles: [migratedSlot] });
        setActiveProfileId(migratedId);
        applySnapshot(data);
        setSystemMessage(loadedLegacy ? "Legacy personal OS recovered from this browser. Export a backup from System if you want to preserve it." : "Saved LifeOS state loaded from this browser.");
      } else {
        const starter = createStarterSnapshot();
        const starterSlot = { id: migratedId, name: "New Profile", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), data: starter };
        setProfileIndex({ activeProfileId: migratedId, profiles: [starterSlot] });
        setActiveProfileId(migratedId);
        applySnapshot(starter, true);
      }
    } catch (error) {
      setSystemMessage("Could not load saved state. Fresh session started.");
      const fallbackId = makeProfileId();
      const starter = createStarterSnapshot();
      setProfileIndex({ activeProfileId: fallbackId, profiles: [{ id: fallbackId, name: "New Profile", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), data: starter }] });
      setActiveProfileId(fallbackId);
      applySnapshot(starter, true);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !activeProfileId) return;
    const snapshot = buildSnapshot();
    const now = new Date().toISOString();
    const profiles = profileIndex.profiles.length ? profileIndex.profiles : [{ id: activeProfileId, name: getProfileSlotName(snapshot), createdAt: now, updatedAt: now, data: snapshot }];
    const nextProfiles = profiles.map(slot => slot.id === activeProfileId ? { ...slot, name: getProfileSlotName(snapshot), updatedAt: now, data: snapshot } : slot);
    const nextIndex = { activeProfileId, profiles: nextProfiles };
    setProfileIndex(nextIndex);
    localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(nextIndex));
  }, [hydrated, activeProfileId, profile, mode, missions, classes, personalVaultItems, personalFutureQuests, customStats, dashboardLabels, dailyTasks, xp, claimedRewards, pendingRewards, activityLog, tabValue]);

  const missionScore = useMemo(() => Math.round(missions.reduce((sum, m) => sum + m.progress, 0) / missions.length), [missions]);
  const level = Math.floor(xp / 500) + 1;
  const levelProgress = xp % 500 / 5;
  const completedTasks = dailyTasks.filter(t => t.done).length;
  const taskCompletion = Math.round((completedTasks / Math.max(dailyTasks.length, 1)) * 100);
  const lowRiskClasses = classes.filter(c => String(c.risk).toLowerCase().includes("low")).length;
  const mediumRiskClasses = classes.filter(c => String(c.risk).toLowerCase().includes("medium")).length;
  const academicStability = Math.round(((lowRiskClasses + mediumRiskClasses * 0.5) / Math.max(classes.length, 1)) * 100);
  const queuedXP = Math.round(pendingRewards.reduce((sum, r) => sum + r.amount, 0));
  const nextTask = dailyTasks.find(task => !task.done)?.text || "All daily tasks cleared. Choose a new priority or generate your OS in Genesis.";
  const rank = xp >= 2500 ? "System Architect" : xp >= 1800 ? "Operator" : xp >= 1000 ? "Builder" : xp >= 500 ? "Initiate" : "Recruit";
  const setupCompletion = Math.round(clamp(profile.name !== defaultProfile.name ? 85 : missions.find(m => m.id === 1)?.progress || 10));
  const focusPower = Math.round(clamp(missionScore));
  const energyLevel = Math.round(clamp(40 + taskCompletion * 0.35));
  const supportSystem = Math.round(clamp(25 + (classes.filter(c => String(c.outreach).toLowerCase() !== "not started").length / Math.max(classes.length, 1)) * 60));
  const clarityScore = Math.round(clamp(30 + missionScore * 0.4 + taskCompletion * 0.25));
  const momentum = Math.round(clamp((taskCompletion * 0.45) + (missionScore * 0.35) + Math.min(pendingRewards.length * 5, 20)));
  const statValues = {
    setup: setupCompletion,
    focus: focusPower,
    energy: energyLevel,
    support: supportSystem,
    clarity: clarityScore,
    momentum,
    missions: missionScore,
    tasks: taskCompletion,
    stability: academicStability,
    rewards: Math.min(queuedXP, 100),
  };
  const displayedStats = customStats.length ? customStats : defaultCustomStats;
  const usingImportedStats = customStats.length > 0 && customStats !== defaultCustomStats;
  const profileStatValue = customStats.find((stat) => typeof stat.value === "number")?.value;
  const isPersonalized = hasPersonalizedProfile(profile);
  const dashboardStability = isPersonalized ? Math.round(clamp(profileStatValue ?? missionScore)) : academicStability;
  const dashboardStabilityNote = isPersonalized
    ? (profileStatValue === undefined ? "Based on active missions" : "From custom profile stats")
    : `${lowRiskClasses}/${classes.length} areas low risk`;

  const dynamicAchievements = achievements.map(a => {
    if (a.title === "OS Online") return { ...a, unlocked: profile.name !== defaultProfile.name || missions.some(m => m.progress > 50) };
    if (a.title === "First Task Claimed") return { ...a, unlocked: activityLog.length > 0 };
    if (a.title === "Momentum Builder") return { ...a, unlocked: xp >= 1000 };
    if (a.title === "Mission Finisher") return { ...a, unlocked: missions.some(m => m.progress >= 100) };
    return a;
  });

  const queueReward = (rewardId, amount, reason) => {
    if (claimedRewards[rewardId]) return;
    setPendingRewards(prev => {
      if (prev.some(r => r.id === rewardId)) return prev;
      return [{ id: rewardId, amount, reason }, ...prev];
    });
  };

  const claimReward = (rewardId) => {
    const reward = pendingRewards.find(r => r.id === rewardId);
    if (!reward || claimedRewards[rewardId]) return;
    setClaimedRewards(prev => ({ ...prev, [rewardId]: true }));
    setPendingRewards(prev => prev.filter(r => r.id !== rewardId));
    setXp(prev => prev + reward.amount);
    setXpPop({ amount: reward.amount, reason: reward.reason, id: Date.now() });
    setActivityLog(prev => [`+${reward.amount} XP — ${reward.reason}`, ...prev].slice(0, 8));
    setTimeout(() => setXpPop(null), 1800);
  };

  const updateProgress = (id, delta) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, progress: Math.max(0, Math.min(100, m.progress + delta)) } : m));
  };

  const syncMissionFromTask = (task, direction = 1) => {
    if (!task.missionId) return;
    const boost = task.xp >= 180 ? 8 : task.xp >= 120 ? 6 : 4;
    updateProgress(task.missionId, boost * direction);
  };

  const completeMission = (id) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, progress: 100, streak: m.streak + 1 } : m));
    const mission = missions.find(m => m.id === id);
    if (mission && mission.progress < 100) queueReward(`mission-${mission.id}`, mission.xp, `Mission complete: ${mission.title}`);
  };

  const updateClass = (id, field, value) => setClasses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

  const lifeMirrorJsonSchema = `{
  "profile": {
    "name": "",
    "archetype": "",
    "mainQuest": "",
    "tagline": "",
    "tone": "",
    "theme": "",
    "currentSeason": ""
  },
  "lifeDomains": [""],
  "missions": [
    {
      "title": "",
      "area": "",
      "urgency": "Low | Medium | High | Critical",
      "difficulty": "Easy | Medium | Hard",
      "progress": 0,
      "xp": 300,
      "next": "",
      "reward": "",
      "streak": 0
    }
  ],
  "dailyTasks": [
    {
      "text": "",
      "xp": 50,
      "missionHint": ""
    }
  ],
  "stats": [
    {
      "label": "",
      "value": 0,
      "icon": "",
      "reason": ""
    }
  ],
  "vaultItems": [
    {
      "title": "",
      "status": "Optional | Needed | Ready",
      "icon": "Briefcase | Upload | Target | Mail | Database",
      "xp": 100
    }
  ],
  "futureQuests": [
    {
      "title": "",
      "type": "",
      "status": "",
      "priority": "",
      "desc": "",
      "mechanics": ["", "", ""]
    }
  ],
  "dashboardLabels": {
    "stability": "",
    "completion": "",
    "rewards": "",
    "nextMove": ""
  },
  "risks": [""],
  "rewardStyle": "",
  "followUpQuestions": [
    {
      "id": "main_quest_check",
      "question": "",
      "options": ["", "", "", "Custom"]
    },
    {
      "id": "theme_choice",
      "question": "",
      "options": ["Hacker", "Luxury Minimal", "Soft Wellness", "Anime Hero", "Dark Fantasy", "Clean Professional", "Custom"]
    },
    {
      "id": "coach_style",
      "question": "",
      "options": ["Gentle", "Direct", "Roast me lightly", "Coach mode", "Faith-based encouragement", "Custom"]
    }
  ]
}`;

  const buildLifeMirrorPrompt = () => {
    const sharedInstructions = `The app turns a life profile into missions, tasks, XP, stats, rewards, vault items, future quests, risks, dashboard labels, and next actions.

Return ONLY valid JSON when you generate the final profile. Do not wrap it in markdown. Do not add explanations to the final JSON.

Keep this exact JSON schema and include tagline, customStats/stats, vaultItems, futureQuests, dashboardLabels, risks, rewardStyle, and followUpQuestions:

${lifeMirrorJsonSchema}`;

    if (genesisMode === "cold") {
      return `You are helping create a personalized gamified Life Operating System.

Cold Start Mode: you do not know me yet.

First, ask me exactly 10 onboarding questions that will give you enough context to build a useful LifeOS. Ask about my current season, responsibilities, goals, stressors, routines, energy, relationships/support, work or school, health, style preferences, and what would make this system feel personal.

After I answer all 10 questions, generate the LifeOS JSON using my answers. Do not generate the JSON until after I answer.

${sharedInstructions}`;
    }

    return `You are helping create a personalized gamified Life Operating System.

Known Profile Mode: use what you already know about me.

Based on what you know about me, generate a deeply personalized Life OS Profile for an app.

Do not be generic. Use my actual personality, responsibilities, goals, stressors, struggles, habits, interests, relationships, health/fitness goals, school/work situation, and long-term dreams.

${sharedInstructions}`;
  };

  const copyLifeMirrorPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildLifeMirrorPrompt());
      setMirrorPromptCopied(true);
      setTimeout(() => setMirrorPromptCopied(false), 1500);
      setSystemMessage("Life Mirror prompt copied.");
    } catch {
      setSystemMessage("Could not copy prompt. Copy it manually from the Genesis tab.");
    }
  };

  const parseMirrorJson = () => {
    try {
      const parsed = JSON.parse(mirrorJsonInput);
      if (!parsed.profile || !Array.isArray(parsed.missions) || !Array.isArray(parsed.dailyTasks)) {
        throw new Error("Missing required fields.");
      }
      return parsed;
    } catch {
      setSystemMessage("Genesis import failed. Make sure the AI returned valid JSON only, with profile, missions, and dailyTasks.");
      return null;
    }
  };

  const buildFollowUpQuestions = (profileData) => {
    const aiQuestions = Array.isArray(profileData.followUpQuestions) ? profileData.followUpQuestions : [];
    if (aiQuestions.length > 0) {
      return aiQuestions.slice(0, 5).map((q, idx) => ({
        id: safeText(q.id || `question_${idx}`, 60),
        question: safeText(q.question || "Choose one option:", 220),
        options: Array.isArray(q.options) && q.options.length ? q.options.slice(0, 8).map(o => safeText(o, 120)) : ["Use this", "Adjust", "Custom"],
      }));
    }
    return [
      {
        id: "main_quest_check",
        question: `Your AI thinks your main quest is: "${safeText(profileData.profile?.mainQuest || "Stabilize and level up", 120)}". How should we frame it?`,
        options: [profileData.profile?.mainQuest || "Stabilize and level up", "Make it more career-focused", "Make it more school-focused", "Make it more health-focused", "Custom"],
      },
      { id: "theme_choice", question: "Pick your OS aesthetic:", options: ["Hacker", "Soft Wellness", "Clean Professional", "Luxury Minimal", "Dark Fantasy", "Anime Hero", "Calm Dark Mode", "Minimal Light Mode", "Cozy Home", "Custom"] },
      { id: "coach_style", question: "How should your OS talk when you're falling behind?", options: ["Gentle", "Direct", "Roast me lightly", "Coach mode", "Faith-based encouragement", "Custom"] },
    ];
  };

  const runGenesisImport = () => {
    const parsed = parseMirrorJson();
    if (!parsed) return;
    setGenesisLoading(true);
    setTimeout(() => {
      setGeneratedProfile(parsed);
      setGenesisQuestions(buildFollowUpQuestions(parsed));
      setGenesisStep(3);
      setGenesisLoading(false);
      setSystemMessage("Life Mirror complete. Confirm profile details.");
    }, 1200);
  };

  const applyGeneratedProfileToOS = (profileData, answers = {}) => {
    const originalMainQuest = profileData.profile?.mainQuest || "Stabilize and level up";
    const mainQuestAnswer = answers.main_quest_check_custom || answers.main_quest_check || "";
    const selectedMainQuest = answers.main_quest_check_custom
      ? answers.main_quest_check_custom
      : isKeepMainQuestAnswer(mainQuestAnswer)
        ? originalMainQuest
        : mainQuestAnswer || originalMainQuest;
    const selectedTheme = answers.theme_choice_custom || answers.theme_choice || profileData.profile?.theme || "Hacker";
    const selectedTone = answers.coach_style_custom || answers.coach_style || profileData.profile?.tone || "Direct";

    const newMissions = (profileData.missions || []).slice(0, 8).map((m, idx) => normalizeMission({
      id: idx + 1,
      title: m.title,
      area: m.area,
      urgency: m.urgency,
      difficulty: m.difficulty,
      progress: m.progress ?? 0,
      xp: m.xp ?? 300,
      next: m.next,
      reward: m.reward,
      streak: m.streak ?? 0,
    }, idx));

    const fallbackMissions = newMissions.length ? newMissions : [normalizeMission({ id: 1, title: selectedMainQuest, area: "Life", urgency: "High", difficulty: "Medium", progress: 10, xp: 300, next: "Choose first action", reward: "+Momentum", streak: 0 })];

    const newTasks = (profileData.dailyTasks || []).slice(0, 20).map((task, idx) => {
      const hint = String(task.missionHint || "").toLowerCase();
      const matched = fallbackMissions.find(m => m.title.toLowerCase().includes(hint) || m.area.toLowerCase().includes(hint) || hint.includes(m.title.toLowerCase()) || hint.includes(m.area.toLowerCase()));
      return normalizeTask({ id: makeId("task"), text: task.text, done: false, xp: task.xp ?? 50, missionId: matched?.id || fallbackMissions[0]?.id || 1, classId: null }, idx);
    });

    const draftClasses = fallbackMissions.slice(0, 6).map((m, idx) => normalizeClass({
      id: idx + 1,
      name: m.title,
      estimate: `${m.area} mission`,
      best: m.reward || "+Progress",
      risk: m.urgency || "Medium",
      outreach: "Not yet",
      action: m.next || "Define action",
    }, idx));
    const nextVaultItems = Array.isArray(profileData.vaultItems) && profileData.vaultItems.length
      ? profileData.vaultItems.slice(0, 30).map(normalizeVaultItem)
      : defaultVaultItems;
    const nextFutureQuests = Array.isArray(profileData.futureQuests) && profileData.futureQuests.length
      ? profileData.futureQuests.slice(0, 20).map(normalizeFutureQuest)
      : defaultFutureQuests;
    const nextStats = Array.isArray(profileData.customStats)
      ? profileData.customStats
      : Array.isArray(profileData.statConfig)
        ? profileData.statConfig
        : profileData.stats;

    setMissions(fallbackMissions);
    setDailyTasks(newTasks.length ? newTasks : [normalizeTask({ id: makeId("task"), text: "Choose first concrete action", xp: 50, missionId: fallbackMissions[0]?.id || 1 }, 0)]);
    setClasses(draftClasses);
    setPersonalVaultItems(nextVaultItems);
    setPersonalFutureQuests(nextFutureQuests);
    setCustomStats(Array.isArray(nextStats) && nextStats.length ? nextStats.slice(0, 12).map(normalizeCustomStat) : defaultCustomStats);
    setDashboardLabels(normalizeDashboardLabels(profileData.dashboardLabels));
    setPendingRewards([]);
    setClaimedRewards({});
    setProfile(normalizeProfile({
      name: safeText(profileData.profile?.name || "New Operator", 80),
      archetype: safeText(profileData.profile?.archetype || "LifeOS User", 120),
      mainQuest: safeText(selectedMainQuest, 160),
      tagline: safeText(profileData.profile?.tagline || defaultProfile.tagline, 180),
      tone: safeText(selectedTone, 120),
      theme: safeText(selectedTheme, 80),
      currentSeason: safeText(profileData.profile?.currentSeason || "Active Season", 120),
    }));
    setActivityLog([
      "+100 XP  Genesis Launch Bonus",
      `OS Genesis complete for ${safeText(profileData.profile?.name || "new profile", 80)}.`,
      `Main Quest set: ${safeText(selectedMainQuest, 160)}`,
      `Theme selected: ${safeText(selectedTheme, 80)}`,
      `Coach style selected: ${safeText(selectedTone, 80)}`,
    ]);
    setXp(prev => Math.max(prev, 100));
    setSystemMessage(`Genesis applied. ${safeText(profileData.profile?.name || "Profile", 80)} OS launched successfully.`);
  };

  const launchGenesisProfile = () => {
    if (!generatedProfile) return;
    applyGeneratedProfileToOS(generatedProfile, genesisAnswers);
    setGenesisStep(4);
    setTabValue("missions");
  };

  const addTask = () => {
    if (!dailyInput.trim()) return;
    setDailyTasks(prev => [...prev, { id: makeId("task"), text: safeText(dailyInput), done: false, xp: 50, missionId: 1, classId: null }].slice(0, MAX_TASKS));
    setDailyInput("");
  };

  const toggleTask = (idx) => {
    setDailyTasks(prev => prev.map((task, i) => {
      if (i !== idx) return task;
      const rewardId = `task-${task.id}`;
      if (!task.done) {
        queueReward(rewardId, task.xp, `Task complete: ${task.text}`);
        syncMissionFromTask(task, 1);
      }
      if (task.done) {
        setPendingRewards(rewards => rewards.filter(r => r.id !== rewardId));
        syncMissionFromTask(task, -1);
      }
      return { ...task, done: !task.done };
    }));
  };

  const removeTask = (idx) => {
    const task = dailyTasks[idx];
    if (task) setPendingRewards(rewards => rewards.filter(r => r.id !== `task-${task.id}`));
    setDailyTasks(prev => prev.filter((_, i) => i !== idx));
  };

  const switchProfile = (profileId) => {
    const slot = profileIndex.profiles.find(item => item.id === profileId);
    if (!slot) return;
    setActiveProfileId(profileId);
    applySnapshot(slot.data);
    setSystemMessage(`Switched to ${slot.name}.`);
  };

  const createNewProfile = () => {
    const snapshot = createStarterSnapshot();
    const id = makeProfileId();
    const now = new Date().toISOString();
    const slot = { id, name: "New Profile", createdAt: now, updatedAt: now, data: snapshot };
    const nextIndex = { activeProfileId: id, profiles: [...profileIndex.profiles, slot] };
    setProfileIndex(nextIndex);
    setActiveProfileId(id);
    localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(nextIndex));
    applySnapshot(snapshot, true);
    setGenesisStep(1);
    setSystemMessage("New local profile created. Start in Genesis.");
  };

  const duplicateCurrentProfile = () => {
    const snapshot = { ...buildSnapshot(), lastTab: tabValue };
    const id = makeProfileId();
    const now = new Date().toISOString();
    const slot = { id, name: `${getProfileSlotName(snapshot)} Copy`, createdAt: now, updatedAt: now, data: snapshot };
    const nextIndex = { activeProfileId: id, profiles: [...profileIndex.profiles, slot] };
    setProfileIndex(nextIndex);
    setActiveProfileId(id);
    localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(nextIndex));
    applySnapshot(snapshot);
    setSystemMessage("Current profile duplicated locally.");
  };

  const exportCurrentProfile = () => {
    exportState();
  };

  const deleteCurrentProfile = () => {
    const activeSlot = profileIndex.profiles.find(slot => slot.id === activeProfileId);
    const label = activeSlot?.name || "this profile";
    if (!window.confirm(`Delete "${label}" from this browser? This cannot be undone unless you exported a backup.`)) return;
    const remaining = profileIndex.profiles.filter(slot => slot.id !== activeProfileId);
    if (!remaining.length) {
      const snapshot = createStarterSnapshot();
      const id = makeProfileId();
      const now = new Date().toISOString();
      const slot = { id, name: "New Profile", createdAt: now, updatedAt: now, data: snapshot };
      const nextIndex = { activeProfileId: id, profiles: [slot] };
      setProfileIndex(nextIndex);
      setActiveProfileId(id);
      localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(nextIndex));
      applySnapshot(snapshot, true);
      setSystemMessage("Profile deleted. A fresh Genesis profile was created.");
      return;
    }
    const nextActive = remaining[0];
    const nextIndex = { activeProfileId: nextActive.id, profiles: remaining };
    setProfileIndex(nextIndex);
    setActiveProfileId(nextActive.id);
    localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(nextIndex));
    applySnapshot(nextActive.data);
    setSystemMessage(`Profile deleted. Switched to ${nextActive.name}.`);
  };

  const exportState = () => {
    const snapshot = JSON.stringify(buildSnapshot(), null, 2);
    setImportText(snapshot);
    const blob = new Blob([snapshot], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSystemMessage("Backup exported and copied into the import box.");
  };

  const importState = () => {
    try {
      const data = JSON.parse(importText);
      if (data.profile && typeof data.profile === "object") setProfile(normalizeProfile(data.profile));
      if (data.mode) setMode(data.mode);
      if (Array.isArray(data.missions)) setMissions(data.missions.slice(0, 30).map(normalizeMission));
      if (Array.isArray(data.classes)) setClasses(data.classes.slice(0, 30).map(normalizeClass));
      if (Array.isArray(data.vaultItems)) setPersonalVaultItems(data.vaultItems.slice(0, 30).map(normalizeVaultItem));
      if (Array.isArray(data.futureQuests)) setPersonalFutureQuests(data.futureQuests.slice(0, 20).map(normalizeFutureQuest));
      const importedStats = Array.isArray(data.customStats) ? data.customStats : Array.isArray(data.statConfig) ? data.statConfig : data.stats;
      if (Array.isArray(importedStats)) setCustomStats(importedStats.slice(0, 12).map(normalizeCustomStat));
      if (data.dashboardLabels && typeof data.dashboardLabels === "object") setDashboardLabels(normalizeDashboardLabels(data.dashboardLabels));
      if (Array.isArray(data.dailyTasks)) setDailyTasks(data.dailyTasks.slice(0, MAX_TASKS).map(normalizeTask));
      if (typeof data.xp === "number") setXp(clamp(data.xp, 0, 1000000));
      if (data.claimedRewards && typeof data.claimedRewards === "object") setClaimedRewards(data.claimedRewards);
      if (Array.isArray(data.pendingRewards)) setPendingRewards(data.pendingRewards.slice(0, 80).map((r, idx) => ({ id: safeText(r.id || `reward-${idx}`, 120), amount: Math.round(clamp(r.amount, 1, 5000)), reason: safeText(r.reason || "Pending reward", 220) })));
      if (Array.isArray(data.activityLog)) setActivityLog(data.activityLog.slice(0, 20).map(x => safeText(x, 260)));
      const importedTab = normalizeTab(data.lastTab || data.tabValue);
      setTabValue(importedTab || (hasPersonalizedProfile(data.profile) ? "missions" : "genesis"));
      setSystemMessage("Snapshot imported successfully. Data was sanitized before loading.");
    } catch (error) {
      setSystemMessage("Import failed. Check that the pasted JSON is valid.");
    }
  };

  const resetLocalSave = () => {
    localStorage.removeItem(STORAGE_KEY);
    const snapshot = createStarterSnapshot();
    applySnapshot(snapshot, true);
    setSystemMessage("Current profile reset to the privacy-safe starter state. Legacy recovery data was left untouched.");
  };

  return (
    <div className={`min-h-screen ${t.page} ${t.grid} p-4 md:p-8 transition-colors duration-500 relative overflow-hidden`}>
      <style>{`
        .terminal-grid-dark {
          background-image:
            radial-gradient(circle at 20% 10%, rgba(16,185,129,.18), transparent 28%),
            radial-gradient(circle at 82% 22%, rgba(34,211,238,.12), transparent 30%),
            linear-gradient(rgba(16,185,129,.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,.07) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 34px 34px, 34px 34px;
        }
        .terminal-grid-light {
          background-image:
            radial-gradient(circle at 20% 10%, rgba(5,150,105,.18), transparent 28%),
            radial-gradient(circle at 82% 22%, rgba(8,145,178,.14), transparent 30%),
            linear-gradient(rgba(4,120,87,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(4,120,87,.08) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 34px 34px, 34px 34px;
        }
        .soft-wellness-grid {
          background-image:
            radial-gradient(circle at 12% 8%, rgba(244,114,182,.16), transparent 30%),
            radial-gradient(circle at 88% 18%, rgba(110,231,183,.16), transparent 32%);
          background-size: 100% 100%, 100% 100%;
        }
        .professional-grid-dark {
          background-image:
            linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .professional-grid-light {
          background-image:
            linear-gradient(rgba(15,23,42,.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,23,42,.045) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .minimal-grid-dark, .minimal-grid-light {
          background-image: linear-gradient(rgba(120,113,108,.045) 1px, transparent 1px);
          background-size: 100% 40px;
        }
        .fantasy-grid-dark, .fantasy-grid-light, .hero-grid-dark, .hero-grid-light, .cozy-grid-dark, .cozy-grid-light {
          background-image:
            radial-gradient(circle at 18% 12%, rgba(255,255,255,.10), transparent 28%),
            radial-gradient(circle at 85% 16%, rgba(255,255,255,.08), transparent 30%);
          background-size: 100% 100%, 100% 100%;
        }
        .scanlines:before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0px, rgba(255,255,255,.03) 1px, transparent 1px, transparent 4px);
          mix-blend-mode: overlay;
        }
      `}</style>
      {t.terminal !== false && <div className="absolute inset-0 scanlines pointer-events-none" />}
      <AnimatePresence>
        {xpPop && (
          <motion.div
            key={xpPop.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 rounded-2xl border border-lime-300/70 bg-black/90 px-5 py-4 text-lime-200 shadow-[0_0_35px_rgba(132,204,22,0.35)]"
          >
            <div className="text-2xl font-black">+{xpPop.amount} XP</div>
            <div className="text-xs text-lime-100/80">{xpPop.reason}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b pb-5 ${mode === "dark" ? "border-emerald-400/25" : "border-emerald-900/20"}`}>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Shield className={`h-8 w-8 ${t.accent}`} />
              <Badge className={`${t.ok} border`}>{isPersonalized ? "OS ONLINE" : "GENESIS MODE"}</Badge>
              <Badge className={`${t.warn} border`}>{isPersonalized ? "LOCAL SAVE" : "LOCAL PROTOTYPE"}</Badge>
              <Badge className={`${t.danger} border`}>{isPersonalized ? "PRIVATE BROWSER" : "PRIVACY-FIRST"}</Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">LifeOS: Genesis</h1>
            <p className={`mt-2 text-lg ${t.muted}`}>{profile.tagline || defaultProfile.tagline}</p>
            {t.terminal !== false && <div className="mt-3 space-y-1">
              <TerminalLine t={t}>load profile_stack --mode=personalized_ops</TerminalLine>
              <TerminalLine t={t}>priority: missions, momentum, evidence, next_action</TerminalLine>
            </div>}
          </div>
          <div className="flex flex-col gap-3">
            <Card className={`${t.card} rounded-2xl min-w-[280px]`}>
              <CardContent className="p-3 space-y-3">
                <div className={`text-xs uppercase tracking-widest ${t.dim}`}>Local Profiles</div>
                <select
                  value={activeProfileId}
                  onChange={(event) => switchProfile(event.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${t.input}`}
                  aria-label="Switch local profile"
                >
                  {profileIndex.profiles.map(slot => (
                    <option key={slot.id} value={slot.id}>{slot.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className={t.button} onClick={createNewProfile}>New Profile</Button>
                  <Button size="sm" variant="outline" className="border-current bg-transparent" onClick={duplicateCurrentProfile}>Duplicate</Button>
                  <Button size="sm" variant="outline" className="border-current bg-transparent" onClick={exportCurrentProfile}>Export</Button>
                  <Button size="sm" variant="outline" className="border-current bg-transparent" onClick={deleteCurrentProfile}>Delete</Button>
                </div>
              </CardContent>
            </Card>
            <Button onClick={() => setMode(mode === "dark" ? "light" : "dark")} className={t.button}>
              {mode === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {mode === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
            <Card className={`${t.card} rounded-2xl min-w-[280px]`}>
              <CardContent className="p-4">
                <p className={`text-xs uppercase tracking-widest ${t.dim}`}>Operator Level</p>
                <div className="flex items-center gap-3 mt-2">
                  <Trophy className={`h-8 w-8 ${t.accent}`} />
                  <div className="text-4xl font-black">Lv.{formatNumber(level)}</div>
                  <div className={t.dim}>{formatNumber(xp)} XP</div>
                </div>
                <Progress value={levelProgress} t={t} pulse />
                <div className={`mt-2 text-xs font-mono ${t.accent}`}>Rank: {rank}</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: dashboardLabels.stability, value: dashboardStability, suffix: "%", icon: Shield, note: dashboardStabilityNote },
            { label: dashboardLabels.completion, value: taskCompletion, suffix: "%", icon: CheckCircle2, note: `${completedTasks}/${dailyTasks.length} tasks done` },
            { label: dashboardLabels.rewards, value: queuedXP, suffix: " XP", icon: BatteryCharging, note: `${pendingRewards.length} claims waiting` },
            { label: dashboardLabels.nextMove, value: "", suffix: "", icon: Crosshair, note: nextTask },
          ].map(({ label, value, suffix, icon: Icon, note }) => (
            <Card key={label} className={`${t.card} rounded-2xl`}>
              <CardContent className="p-4 space-y-2">
                <div className={`flex items-center gap-2 text-xs uppercase tracking-widest ${t.dim}`}><Icon className="h-4 w-4" />{label}</div>
                {suffix === "" ? <div className={`text-sm font-bold leading-snug ${t.text}`}>{note}</div> : <div className="text-3xl font-black">{formatNumber(value)}{suffix}</div>}
                {suffix !== "" && <p className={`text-xs ${t.muted}`}>{note}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <Card className={`lg:col-span-1 ${t.card} rounded-2xl shadow-xl`}>
            <CardContent className="p-5 space-y-5">
              <div>
                <p className={`text-xs uppercase tracking-widest ${t.dim}`}>Character Sheet</p>
                <h2 className={`text-2xl font-bold mt-1 ${t.text}`}>{profile.name}</h2>
                <p className={`text-sm ${t.muted}`}>Class: {profile.archetype}</p>
                <p className={`text-sm ${t.muted}`}>Main Quest: {profile.mainQuest}</p>
                <p className={`text-sm ${t.muted}`}>Tagline: {profile.tagline}</p>
                <p className={`text-sm ${t.muted}`}>Season: {profile.currentSeason}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${t.inner}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm ${t.muted}`}>Mission Control</span>
                  <span className="text-3xl font-black">{formatNumber(missionScore)}</span>
                </div>
                <Progress value={missionScore} t={t} pulse={missionScore < 50} />
              </div>
              <div className="space-y-3">
                {displayedStats.map((stat) => {
                  const Icon = iconMap[stat.icon] || Sparkles;
                  const value = stat.value ?? statValues[stat.source] ?? 0;
                  const explanation = stat.reason || (usingImportedStats ? "Imported from Life Mirror profile" : defaultCustomStats.find(item => item.source === stat.source || item.label === stat.label)?.reason);
                  return <StatBar key={`${stat.label}-${stat.source}`} label={stat.label} value={value} icon={Icon} t={t} explanation={explanation} />;
                })}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <Tabs value={tabValue} onValueChange={(nextTab) => setTabValue(normalizeTab(nextTab) || "missions")} className="w-full">
              <TabsList className={`${t.card} rounded-2xl p-2 flex flex-wrap gap-2 h-auto`}>
                <TabsTrigger value="missions"><Crosshair className="h-4 w-4 mr-1" />Missions</TabsTrigger>
                <TabsTrigger value="areas"><GraduationCap className="h-4 w-4 mr-1" />Areas</TabsTrigger>
                <TabsTrigger value="pathways"><Lock className="h-4 w-4 mr-1" />Pathways</TabsTrigger>
                <TabsTrigger value="vault"><Database className="h-4 w-4 mr-1" />Vault</TabsTrigger>
                <TabsTrigger value="daily"><Terminal className="h-4 w-4 mr-1" />Daily</TabsTrigger>
                <TabsTrigger value="genesis"><Sparkles className="h-4 w-4 mr-1" />Genesis</TabsTrigger>
                <TabsTrigger value="ai"><Brain className="h-4 w-4 mr-1" />AI Command</TabsTrigger>
                <TabsTrigger value="log"><Activity className="h-4 w-4 mr-1" />Log</TabsTrigger>
                <TabsTrigger value="future"><ScrollText className="h-4 w-4 mr-1" />Future Quests</TabsTrigger>
                <TabsTrigger value="system"><Database className="h-4 w-4 mr-1" />System</TabsTrigger>
                <TabsTrigger value="achievements"><Trophy className="h-4 w-4 mr-1" />Badges</TabsTrigger>
              </TabsList>

              <TabsContent value="missions" className="mt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence>{missions.map(m => <MissionCard key={m.id} mission={m} updateProgress={updateProgress} completeMission={completeMission} t={t} />)}</AnimatePresence>
                </div>
              </TabsContent>

              <TabsContent value="areas" className="mt-5">
                <Card className={`${t.card} rounded-2xl`}>
                  <CardContent className="p-4 overflow-x-auto">
                    <div className="flex items-center gap-2 mb-4"><AlertTriangle className="text-amber-400" /><h2 className={`text-xl font-bold ${t.text}`}>Life Areas / Risk Table</h2></div>
                    <table className="w-full text-sm min-w-[900px]">
                      <thead className={`${t.dim} border-b ${mode === "dark" ? "border-emerald-400/20" : "border-emerald-800/20"}`}>
                        <tr>
                          <th className="text-left p-2">Area</th>
                          <th className="text-left p-2">Current Estimate</th>
                          <th className="text-left p-2">Best Case</th>
                          <th className="text-left p-2">Risk</th>
                          <th className="text-left p-2">Outreach</th>
                          <th className="text-left p-2">Immediate Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map(c => (
                          <tr key={c.id} className={`${mode === "dark" ? "border-emerald-400/10" : "border-emerald-900/10"} border-b`}>
                            <td className="p-2 font-semibold">{c.name}</td>
                            {["estimate", "best", "risk", "outreach", "action"].map(field => (
                              <td className="p-2" key={field}>
                                <Input value={c[field]} onChange={e => updateClass(c.id, field, e.target.value)} className={t.input} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pathways" className="mt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className={`${t.card} rounded-2xl`}>
                    <CardContent className="p-5 space-y-4">
                      <h2 className={`text-xl font-bold flex items-center gap-2 ${t.text}`}><Lock className={t.accent} />Pathway Status</h2>
                      {[["Primary goal", "Define in Genesis"], ["Current blockers", "Unknown"], ["Evidence needed", "Optional"], ["Next checkpoint", "Set after setup"], ["Backup route", "Not defined"]].map(([a,b]) => (
                        <div key={a} className={`flex justify-between border-b pb-2 ${mode === "dark" ? "border-emerald-400/10" : "border-emerald-900/10"}`}><span className={t.muted}>{a}</span><Badge className={`${t.inner} border`}>{b}</Badge></div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className={`${t.card} rounded-2xl`}>
                    <CardContent className="p-5 space-y-3">
                      <h2 className={`text-xl font-bold ${t.text}`}>Possible Routes</h2>
                      {["School or training path", "Career/application path", "Health or routine reset", "Creative/project path", "Relationship or support path"].map(item => <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{item}</div>)}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="vault" className="mt-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {personalVaultItems.map(({ title, status, icon, xp }) => {
                    const Icon = iconMap[icon] || Database;
                    return (
                    <Card key={title} className={`${t.card} rounded-2xl`}>
                      <CardContent className="p-5 space-y-3">
                        <Icon className={`h-7 w-7 ${t.accent}`} />
                        <h3 className={`font-bold ${t.text}`}>{title}</h3>
                        <div className="flex items-center justify-between"><Badge className={status === "Ready" ? t.ok : status === "Optional" ? t.warn : t.danger}>{status}</Badge><span className={`text-xs ${t.dim}`}>{formatNumber(xp)} XP</span></div>
                      </CardContent>
                    </Card>
                  );})}
                </div>
              </TabsContent>

              <TabsContent value="daily" className="mt-5">
                <Card className={`${t.card} rounded-2xl`}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className={`text-xl font-bold ${t.text}`}>Daily Function Board</h2>
                      <Badge className={`${t.ok} border`}>{completedTasks}/{dailyTasks.length} complete</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Input value={dailyInput} onChange={e => setDailyInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Add one concrete task..." className={t.input} />
                      <Button onClick={addTask} className={t.button}><Plus className="h-4 w-4 mr-1" />Add</Button>
                    </div>
                    <div className="space-y-2">
                      {dailyTasks.map((task, idx) => (
                        <motion.div layout key={task.id || `${task.text}-${idx}`} className={`flex items-center justify-between border rounded-xl p-3 ${task.done ? "opacity-60 line-through" : ""} ${t.inner}`}>
                          <button onClick={() => toggleTask(idx)} className="flex items-center gap-3 text-left">
                            <span className={`h-5 w-5 rounded-md border flex items-center justify-center ${task.done ? "bg-emerald-400 text-black" : "border-emerald-400/40"}`}>{task.done ? "✓" : ""}</span>
                            <span>{task.text}</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${t.dim}`}>{task.xp} XP{task.missionId ? ` • M${task.missionId}` : ""}</span>
                            <Button size="sm" variant="ghost" onClick={() => removeTask(idx)}><X className="h-4 w-4" /></Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="genesis" className="mt-5">
                <Card className={`${t.card} rounded-2xl`}>
                  <CardContent className="p-5 space-y-5">
                    <div>
                      <h2 className={`text-2xl font-black flex items-center gap-2 ${t.text}`}><Sparkles className={t.accent} />OS Genesis</h2>
                      <p className={`text-sm ${t.muted}`}>Use a personal AI to mirror someone's life, then import the structured profile here. If the profile feels generic, use Cold Start Mode.</p>
                    </div>

                    {genesisStep === 1 && (
                      <div className="space-y-4">
                        <div className={`rounded-2xl border p-4 ${t.inner}`}>
                          <h3 className={`font-bold ${t.text}`}>Step 1 — Generate Life Mirror</h3>
                          <p className={`text-sm mt-2 ${t.muted}`}>Choose a setup mode, paste the prompt into ChatGPT, Claude, Gemini, or another AI, then bring the JSON back here.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setGenesisMode("known")}
                            className={`rounded-2xl border p-4 text-left transition ${genesisMode === "known" ? "border-emerald-300 ring-2 ring-emerald-300/40" : "border-current/20"} ${t.inner}`}
                          >
                            <div className={`font-bold ${t.text}`}>Mode 1: My AI knows me</div>
                            <p className={`mt-1 text-sm ${t.muted}`}>Uses the existing Life Mirror prompt and tells the AI to use what it already knows about the user.</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGenesisMode("cold")}
                            className={`rounded-2xl border p-4 text-left transition ${genesisMode === "cold" ? "border-emerald-300 ring-2 ring-emerald-300/40" : "border-current/20"} ${t.inner}`}
                          >
                            <div className={`font-bold ${t.text}`}>Mode 2: My AI does not know me yet</div>
                            <p className={`mt-1 text-sm ${t.muted}`}>Cold Start Mode asks 10 onboarding questions first, then generates the LifeOS JSON after the answers.</p>
                          </button>
                        </div>
                        <p className={`text-sm font-semibold ${t.accent}`}>If the profile feels generic, use Cold Start Mode.</p>
                        <div className="flex gap-3 flex-wrap">
                          <Button className={t.button} onClick={copyLifeMirrorPrompt}>{mirrorPromptCopied ? "Prompt Copied" : genesisMode === "cold" ? "Copy Cold Start Prompt" : "Copy Life Mirror Prompt"}</Button>
                          <Button variant="outline" className="border-current bg-transparent" onClick={() => setGenesisStep(2)}>Go to Import</Button>
                        </div>
                        <textarea readOnly value={buildLifeMirrorPrompt()} className={`min-h-[260px] w-full rounded-2xl border p-3 font-mono text-xs ${t.input}`} />
                      </div>
                    )}

                    {genesisStep === 2 && (
                      <div className="space-y-4">
                        <div className={`rounded-2xl border p-4 ${t.inner}`}>
                          <h3 className={`font-bold ${t.text}`}>Step 2 — Paste AI JSON</h3>
                          <p className={`text-sm mt-2 ${t.muted}`}>Paste the JSON response from the AI here, then mirror the profile.</p>
                        </div>
                        <textarea value={mirrorJsonInput} onChange={(e) => setMirrorJsonInput(e.target.value)} placeholder="Paste AI-generated JSON here..." className={`min-h-[260px] w-full rounded-2xl border p-3 font-mono text-xs ${t.input}`} />
                        <div className="flex gap-3 flex-wrap">
                          <Button className={t.button} onClick={runGenesisImport}>Mirror My Life</Button>
                          <Button variant="outline" className="border-current bg-transparent" onClick={() => setGenesisStep(1)}>Back</Button>
                        </div>
                      </div>
                    )}

                    {genesisLoading && (
                      <div className={`rounded-2xl border p-8 text-center ${t.inner}`}>
                        <div className="animate-pulse space-y-3">
                          <div className={`text-xl font-black ${t.text}`}>Life Mirroring...</div>
                          <div className={`text-sm ${t.muted}`}>Building profile, missions, tasks, stats, and next moves.</div>
                          <div className="flex justify-center"><div className="h-14 w-14 rounded-full border-4 border-current border-t-transparent animate-spin" /></div>
                        </div>
                      </div>
                    )}

                    {!genesisLoading && genesisStep === 3 && generatedProfile && (
                      <div className="space-y-5">
                        <div className={`rounded-2xl border p-4 ${t.inner}`}>
                          <h3 className={`font-bold ${t.text}`}>Step 3 — Confirm OS</h3>
                          <p className={`text-sm mt-2 ${t.muted}`}>Answer a few quick personalized choices, then launch.</p>
                        </div>
                        <div className={`rounded-2xl border p-4 ${t.inner}`}>
                          <div className={`text-lg font-black ${t.text}`}>{generatedProfile.profile?.name || "Unnamed User"}</div>
                          <div className={`text-sm ${t.muted}`}>{generatedProfile.profile?.archetype || "Undefined Archetype"}</div>
                          <div className={`mt-2 text-sm ${t.text}`}><strong>Main Quest:</strong> {generatedProfile.profile?.mainQuest || "No main quest provided"}</div>
                          <div className={`text-sm ${t.text}`}><strong>Season:</strong> {generatedProfile.profile?.currentSeason || "Unknown"}</div>
                        </div>
                        <div className="space-y-4">
                          {genesisQuestions.map((q) => (
                            <div key={q.id} className={`rounded-2xl border p-4 ${t.inner}`}>
                              <div className={`font-bold ${t.text}`}>{q.question}</div>
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt) => (
                                  <button key={opt} type="button" onClick={() => setGenesisAnswers((prev) => ({ ...prev, [q.id]: opt }))} className={`rounded-xl border p-3 text-left transition ${genesisAnswers[q.id] === opt ? "border-lime-400 ring-2 ring-lime-400/40" : "border-current/20"}`}>{opt}</button>
                                ))}
                              </div>
                              {genesisAnswers[q.id] === "Custom" && (
                                <input type="text" placeholder="Type custom answer..." value={genesisAnswers[`${q.id}_custom`] || ""} onChange={(e) => setGenesisAnswers((prev) => ({ ...prev, [`${q.id}_custom`]: e.target.value }))} className={`mt-3 w-full rounded-xl border px-3 py-2 ${t.input}`} />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <Button className={t.button} onClick={launchGenesisProfile}>Launch OS</Button>
                          <Button variant="outline" className="border-current bg-transparent" onClick={() => setGenesisStep(2)}>Back</Button>
                        </div>
                      </div>
                    )}

                    {genesisStep === 4 && (
                      <div className={`rounded-2xl border p-6 text-center ${t.inner}`}>
                        <div className={`text-2xl font-black ${t.text}`}>OS Online</div>
                        <p className={`mt-2 text-sm ${t.muted}`}>Personalized operating system generated and applied.</p>
                        <div className="mt-4"><Button className={t.button} onClick={() => setTabValue("missions")}>Go to Missions</Button></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="mt-5">
                <Card className={`${t.card} rounded-2xl`}>
                  <CardContent className="p-5 space-y-4">
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${t.text}`}><Brain className={t.accent} />AI Command Layer</h2>
                    <p className={`text-sm ${t.muted}`}>Manual AI command layer for now. Use Genesis for setup, then export/import snapshots in System. True natural-language command parsing is a v2 backend upgrade.</p>
                    <div className={`rounded-2xl border p-4 font-mono text-sm space-y-2 ${t.inner}`}>
                      <div><span className={t.accent}>/add-area</span> Health risk=Medium action=Plan sleep reset</div>
                      <div><span className={t.accent}>/add-task</span> Finish one important task before 3pm</div>
                      <div><span className={t.accent}>/add-mission</span> Build portfolio project urgency=High xp=500</div>
                      <div><span className={t.accent}>/update-vault</span> Resume status=Ready</div>
                    </div>
                    <div className={`rounded-2xl border p-4 ${t.inner}`}>
                      <h3 className={`font-bold mb-2 ${t.text}`}>Prompt to use with ChatGPT</h3>
                      <p className={`text-sm ${t.muted}`}>“Update my LifeOS profile with this new info: [paste info]. Return a clean JSON snapshot or specific edits for missions, tasks, areas, rewards, and next actions.”</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="log" className="mt-5">
                <Card className={`${t.card} rounded-2xl`}>
                  <CardContent className="p-5 space-y-4">
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${t.text}`}><Activity className={t.accent} />Action Feed</h2>
                    <div className={`rounded-2xl border p-4 space-y-3 ${t.inner}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`font-bold ${t.text}`}>Pending Reward Claims</h3>
                        <Badge className={`${t.ok} border`}>{pendingRewards.length} ready</Badge>
                      </div>
                      {pendingRewards.length === 0 ? (
                        <p className={`text-sm ${t.muted}`}>No rewards waiting. Complete tasks in the Daily tab or finish missions to generate claimable XP.</p>
                      ) : (
                        pendingRewards.map(reward => (
                          <motion.div
                            layout
                            key={reward.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between gap-3 rounded-xl border border-lime-300/30 bg-black/25 p-3"
                          >
                            <div>
                              <div className={`font-semibold ${t.text}`}>{reward.reason}</div>
                              <div className={`text-xs ${t.accent}`}>+{reward.amount} XP ready to claim</div>
                            </div>
                            <Button className={t.button} onClick={() => claimReward(reward.id)}>Claim</Button>
                          </motion.div>
                        ))
                      )}
                    </div>
                    <div className={`rounded-2xl border p-4 space-y-2 ${t.inner}`}>
                      <h3 className={`font-bold ${t.text}`}>Recent Claimed Rewards</h3>
                      {activityLog.length === 0 ? (
                        <p className={`text-sm ${t.muted}`}>Claimed rewards will appear here after you cash them in.</p>
                      ) : (
                        activityLog.map((item, idx) => (
                          <motion.div key={`${item}-${idx}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={`font-mono text-sm ${t.muted}`}>
                            <span className={t.accent}>[{String(idx + 1).padStart(2, "0")}]</span> {item}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="future" className="mt-5">
                <div className="grid grid-cols-1 gap-4">
                  {personalFutureQuests.map(q => (
                    <Card key={q.title} className={`${t.card} rounded-2xl`}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <h2 className={`text-2xl font-black ${t.text}`}>{q.title}</h2>
                            <p className={`text-sm ${t.muted}`}>{q.type}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={`${t.warn} border`}>{q.status}</Badge>
                            <Badge className={`${t.ok} border`}>{q.priority}</Badge>
                          </div>
                        </div>
                        <p className={`text-sm leading-relaxed ${t.muted}`}>{q.desc}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {q.mechanics.map(m => (
                            <div key={m} className={`rounded-xl border p-3 text-sm ${t.inner}`}>
                              <span className={t.accent}>▸</span> {m}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="system" className="mt-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className={`${t.card} rounded-2xl`}>
                    <CardContent className="p-5 space-y-4">
                      <h2 className={`text-xl font-bold flex items-center gap-2 ${t.text}`}><Database className={t.accent} />LifeOS Backend</h2>
                      <p className={`text-sm ${t.muted}`}>{systemMessage}</p>
                      <div className={`rounded-xl border p-3 text-xs ${t.inner}`}>
                        <strong>Security note:</strong> this prototype stores data only in this browser's localStorage. Do not store passwords, private keys, SSNs, or sensitive financial/medical details here. Exported JSON backups are plain text.
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Button className={t.button} onClick={exportState}>Export Backup</Button>
                        <Button className={t.button} onClick={importState}>Import Snapshot</Button>
                        <Button variant="outline" className="border-current bg-transparent" onClick={resetLocalSave}>Clear Save</Button>
                      </div>
                      <textarea
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        placeholder="Paste exported LifeOS JSON here to restore a snapshot..."
                        className={`min-h-[220px] w-full rounded-2xl border p-3 font-mono text-xs ${t.input}`}
                      />
                    </CardContent>
                  </Card>
                  <Card className={`${t.card} rounded-2xl`}>
                    <CardContent className="p-5 space-y-4">
                      <h2 className={`text-xl font-bold ${t.text}`}>OS Dev Queue</h2>
                      <div className="space-y-3">
                        {systemRoadmap.map(item => (
                          <div key={item.title} className={`rounded-2xl border p-3 ${t.inner}`}>
                            <div className="flex items-center justify-between gap-3">
                              <h3 className={`font-bold ${t.text}`}>{item.title}</h3>
                              <Badge className={item.status === "Implemented" ? t.ok : item.status === "Prototype" ? t.warn : t.danger}>{item.status}</Badge>
                            </div>
                            <p className={`text-sm mt-1 ${t.muted}`}>{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="achievements" className="mt-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dynamicAchievements.map(a => (
                    <Card key={a.title} className={`${t.card} rounded-2xl ${a.unlocked ? "" : "opacity-55"}`}>
                      <CardContent className="p-5 space-y-3">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${a.unlocked ? "bg-emerald-400 text-black" : "bg-black/20"}`}>
                          {a.unlocked ? <Trophy className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                        </div>
                        <h3 className={`font-bold ${t.text}`}>{a.title}</h3>
                        <p className={`text-sm ${t.muted}`}>{a.desc}</p>
                        <Badge className={a.unlocked ? t.ok : t.warn}>{a.unlocked ? "Unlocked" : "Locked"}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
