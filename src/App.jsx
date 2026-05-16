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

const vaultItems = [
  { title: "Resume / Profile", status: "Optional", icon: Briefcase, xp: 100 },
  { title: "Important Documents", status: "Optional", icon: Upload, xp: 100 },
  { title: "Goal Evidence", status: "Optional", icon: Target, xp: 100 },
  { title: "Accountability Contacts", status: "Optional", icon: Mail, xp: 100 },
];

const futureQuests = [
  {
    title: "Custom Future Quest",
    type: "Long-term vision",
    status: "Blank",
    priority: "After Genesis setup",
    desc: "Use this section to park bigger dreams, experiments, projects, or future identities that should not distract from today's priorities.",
    mechanics: ["Long-term ideas", "Vision capture", "Future self planning", "Optional experiments"],
  },
];

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

const defaultProfile = {
  name: "New Operator",
  archetype: "LifeOS User",
  mainQuest: "Build a personalized operating system",
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

const normalizeTask = (task, idx = 0) => ({
  id: task?.id || `seed-task-${idx}-${slugText(task?.text)}`,
  text: safeText(task?.text || "Untitled task"),
  done: Boolean(task?.done),
  xp: clamp(task?.xp ?? 50, 5, 1000),
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
  xp: clamp(mission?.xp ?? 100, 10, 5000),
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

function StatBar({ label, value, icon: Icon, t }) {
  return (
    <div className="space-y-1.5">
      <div className={`flex items-center justify-between text-xs ${t.muted}`}>
        <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{label}</span>
        <span>{displayPercent(value)}%</span>
      </div>
      <Progress value={value} t={t} />
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
  const t = theme[mode];
  const [missions, setMissions] = useState(initialMissions);
  const [classes, setClasses] = useState(initialClasses);
  const [dailyInput, setDailyInput] = useState("");
  const [genesisStep, setGenesisStep] = useState(1);
  const [genesisLoading, setGenesisLoading] = useState(false);
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
  const [dailyTasks, setDailyTasks] = useState([
    { id: "task-open-genesis", text: "Open Genesis and create/import a personalized profile", done: false, xp: 80, missionId: 1, classId: null },
    { id: "task-pick-priorities", text: "Pick three priorities for this week", done: false, xp: 60, missionId: 2, classId: null },
    { id: "task-complete-first-action", text: "Complete one concrete action today", done: false, xp: 50, missionId: 3, classId: null },
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      const loadedLegacy = !localStorage.getItem(STORAGE_KEY) && Boolean(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (saved) {
        const data = JSON.parse(saved);
        if (data.profile && typeof data.profile === "object") setProfile({ ...defaultProfile, ...data.profile, name: safeText(data.profile.name || defaultProfile.name, 80), archetype: safeText(data.profile.archetype || defaultProfile.archetype, 120), mainQuest: safeText(data.profile.mainQuest || defaultProfile.mainQuest, 160), tone: safeText(data.profile.tone || defaultProfile.tone, 120), theme: safeText(data.profile.theme || defaultProfile.theme, 80), currentSeason: safeText(data.profile.currentSeason || defaultProfile.currentSeason, 120) });
        if (data.mode) setMode(data.mode);
        if (Array.isArray(data.missions)) setMissions(data.missions.slice(0, 30).map(normalizeMission));
        if (Array.isArray(data.classes)) setClasses(data.classes.slice(0, 30).map(normalizeClass));
        if (typeof data.xp === "number") setXp(clamp(data.xp, 0, 1000000));
        if (data.claimedRewards && typeof data.claimedRewards === "object") setClaimedRewards(data.claimedRewards);
        if (Array.isArray(data.pendingRewards)) setPendingRewards(data.pendingRewards.slice(0, 80).map((r, idx) => ({ id: safeText(r.id || `reward-${idx}`, 120), amount: clamp(r.amount, 1, 5000), reason: safeText(r.reason || "Pending reward", 220) })));
        if (Array.isArray(data.activityLog)) setActivityLog(data.activityLog.slice(0, 20).map(x => safeText(x, 260)));
        if (Array.isArray(data.dailyTasks)) setDailyTasks(data.dailyTasks.slice(0, MAX_TASKS).map(normalizeTask));
        setSystemMessage(loadedLegacy ? "Legacy personal OS recovered from this browser. Export a backup from System if you want to preserve it." : "Saved LifeOS state loaded from this browser.");
      }
    } catch (error) {
      setSystemMessage("Could not load saved state. Fresh session started.");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload = { profile, mode, missions, classes, dailyTasks, xp, claimedRewards, pendingRewards, activityLog, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [hydrated, profile, mode, missions, classes, dailyTasks, xp, claimedRewards, pendingRewards, activityLog]);

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

  const buildLifeMirrorPrompt = () => `You are helping create a personalized gamified Life Operating System.

Based on what you know about me, generate a deeply personalized Life OS Profile for an app. The app turns my life into missions, tasks, XP, stats, rewards, and next actions.

Do not be generic. Use my actual personality, responsibilities, goals, stressors, struggles, habits, interests, relationships, health/fitness goals, school/work situation, and long-term dreams.

Return ONLY valid JSON. Do not wrap it in markdown. Do not add explanations.

Use this exact schema:

{
  "profile": {
    "name": "",
    "archetype": "",
    "mainQuest": "",
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
      "value": 0
    }
  ],
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
      { id: "theme_choice", question: "Pick your OS aesthetic:", options: ["Hacker", "Luxury Minimal", "Soft Wellness", "Anime Hero", "Dark Fantasy", "Clean Professional", "Custom"] },
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
    const selectedMainQuest = answers.main_quest_check_custom || answers.main_quest_check || profileData.profile?.mainQuest || "Stabilize and level up";
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

    setMissions(fallbackMissions);
    setDailyTasks(newTasks.length ? newTasks : [normalizeTask({ id: makeId("task"), text: "Choose first concrete action", xp: 50, missionId: fallbackMissions[0]?.id || 1 }, 0)]);
    setClasses(draftClasses);
    setPendingRewards([]);
    setClaimedRewards({});
    setProfile({
      name: safeText(profileData.profile?.name || "New Operator", 80),
      archetype: safeText(profileData.profile?.archetype || "LifeOS User", 120),
      mainQuest: safeText(selectedMainQuest, 160),
      tone: safeText(selectedTone, 120),
      theme: safeText(selectedTheme, 80),
      currentSeason: safeText(profileData.profile?.currentSeason || "Active Season", 120),
    });
    setActivityLog([
      `OS Genesis complete for ${safeText(profileData.profile?.name || "new profile", 80)}.`,
      `Main Quest set: ${safeText(selectedMainQuest, 160)}`,
      `Theme selected: ${safeText(selectedTheme, 80)}`,
      `Coach style selected: ${safeText(selectedTone, 80)}`,
    ]);
    setXp(0);
    setSystemMessage(`Genesis applied. ${safeText(profileData.profile?.name || "Profile", 80)} OS launched successfully.`);
  };

  const launchGenesisProfile = () => {
    if (!generatedProfile) return;
    applyGeneratedProfileToOS(generatedProfile, genesisAnswers);
    setGenesisStep(4);
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

  const buildSnapshot = () => ({
    profile,
    mode,
    missions,
    classes,
    dailyTasks,
    xp,
    claimedRewards,
    pendingRewards,
    activityLog,
    savedAt: new Date().toISOString(),
  });

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
      if (data.profile && typeof data.profile === "object") setProfile({ ...defaultProfile, ...data.profile, name: safeText(data.profile.name || defaultProfile.name, 80), archetype: safeText(data.profile.archetype || defaultProfile.archetype, 120), mainQuest: safeText(data.profile.mainQuest || defaultProfile.mainQuest, 160), tone: safeText(data.profile.tone || defaultProfile.tone, 120), theme: safeText(data.profile.theme || defaultProfile.theme, 80), currentSeason: safeText(data.profile.currentSeason || defaultProfile.currentSeason, 120) });
      if (data.mode) setMode(data.mode);
      if (Array.isArray(data.missions)) setMissions(data.missions.slice(0, 30).map(normalizeMission));
      if (Array.isArray(data.classes)) setClasses(data.classes.slice(0, 30).map(normalizeClass));
      if (Array.isArray(data.dailyTasks)) setDailyTasks(data.dailyTasks.slice(0, MAX_TASKS).map(normalizeTask));
      if (typeof data.xp === "number") setXp(clamp(data.xp, 0, 1000000));
      if (data.claimedRewards && typeof data.claimedRewards === "object") setClaimedRewards(data.claimedRewards);
      if (Array.isArray(data.pendingRewards)) setPendingRewards(data.pendingRewards.slice(0, 80).map((r, idx) => ({ id: safeText(r.id || `reward-${idx}`, 120), amount: clamp(r.amount, 1, 5000), reason: safeText(r.reason || "Pending reward", 220) })));
      if (Array.isArray(data.activityLog)) setActivityLog(data.activityLog.slice(0, 20).map(x => safeText(x, 260)));
      setSystemMessage("Snapshot imported successfully. Data was sanitized before loading.");
    } catch (error) {
      setSystemMessage("Import failed. Check that the pasted JSON is valid.");
    }
  };

  const resetLocalSave = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setProfile(defaultProfile);
    setSystemMessage("Local save cleared. Refresh to restart from the privacy-safe starter state.");
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
        .scanlines:before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0px, rgba(255,255,255,.03) 1px, transparent 1px, transparent 4px);
          mix-blend-mode: overlay;
        }
      `}</style>
      <div className="absolute inset-0 scanlines pointer-events-none" />
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
              <Badge className={`${t.ok} border`}>GENESIS MODE</Badge>
              <Badge className={`${t.warn} border`}>LOCAL PROTOTYPE</Badge>
              <Badge className={`${t.danger} border`}>PRIVACY-FIRST</Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">LifeOS: Genesis</h1>
            <p className={`mt-2 text-lg ${t.muted}`}>Dump the chaos. Build the command center.</p>
            <div className="mt-3 space-y-1">
              <TerminalLine t={t}>load profile_stack --mode=personalized_ops</TerminalLine>
              <TerminalLine t={t}>priority: missions, momentum, evidence, next_action</TerminalLine>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
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
            { label: "Life Stability", value: academicStability, suffix: "%", icon: Shield, note: `${lowRiskClasses}/${classes.length} areas low risk` },
            { label: "Daily Completion", value: taskCompletion, suffix: "%", icon: CheckCircle2, note: `${completedTasks}/${dailyTasks.length} tasks done` },
            { label: "Reward Queue", value: queuedXP, suffix: " XP", icon: BatteryCharging, note: `${pendingRewards.length} claims waiting` },
            { label: "Next Move", value: "", suffix: "", icon: Crosshair, note: nextTask },
          ].map(({ label, value, suffix, icon: Icon, note }) => (
            <Card key={label} className={`${t.card} rounded-2xl`}>
              <CardContent className="p-4 space-y-2">
                <div className={`flex items-center gap-2 text-xs uppercase tracking-widest ${t.dim}`}><Icon className="h-4 w-4" />{label}</div>
                {label === "Next Move" ? <div className={`text-sm font-bold leading-snug ${t.text}`}>{note}</div> : <div className="text-3xl font-black">{formatNumber(value)}{suffix}</div>}
                {label !== "Next Move" && <p className={`text-xs ${t.muted}`}>{note}</p>}
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
                <StatBar label="Setup" value={setupCompletion} icon={Sparkles} t={t} />
                <StatBar label="Focus" value={focusPower} icon={Target} t={t} />
                <StatBar label="Energy" value={energyLevel} icon={BatteryCharging} t={t} />
                <StatBar label="Support" value={supportSystem} icon={Heart} t={t} />
                <StatBar label="Clarity" value={clarityScore} icon={Brain} t={t} />
                <StatBar label="Momentum" value={momentum} icon={Zap} t={t} />
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
              <TabsList className={`${t.card} rounded-2xl p-1 flex flex-wrap h-auto`}>
                <TabsTrigger value="missions"><Crosshair className="h-4 w-4 mr-1" />Missions</TabsTrigger>
                <TabsTrigger value="gpa"><GraduationCap className="h-4 w-4 mr-1" />Areas</TabsTrigger>
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

              <TabsContent value="gpa" className="mt-5">
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
                  {vaultItems.map(({ title, status, icon: Icon, xp }) => (
                    <Card key={title} className={`${t.card} rounded-2xl`}>
                      <CardContent className="p-5 space-y-3">
                        <Icon className={`h-7 w-7 ${t.accent}`} />
                        <h3 className={`font-bold ${t.text}`}>{title}</h3>
                        <div className="flex items-center justify-between"><Badge className={status === "Ready" ? t.ok : t.danger}>{status}</Badge><span className={`text-xs ${t.dim}`}>{xp} XP</span></div>
                      </CardContent>
                    </Card>
                  ))}
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
                      <p className={`text-sm ${t.muted}`}>Use a personal AI to mirror someone's life, then import the structured profile here.</p>
                    </div>

                    {genesisStep === 1 && (
                      <div className="space-y-4">
                        <div className={`rounded-2xl border p-4 ${t.inner}`}>
                          <h3 className={`font-bold ${t.text}`}>Step 1 — Generate Life Mirror</h3>
                          <p className={`text-sm mt-2 ${t.muted}`}>Paste this prompt into ChatGPT, Claude, Gemini, or whichever AI knows the person best. Then bring the JSON back here.</p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <Button className={t.button} onClick={copyLifeMirrorPrompt}>{mirrorPromptCopied ? "Prompt Copied" : "Copy Life Mirror Prompt"}</Button>
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
                  {futureQuests.map(q => (
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
