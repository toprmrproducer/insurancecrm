import { demoAnalytics, demoCalls, demoLeads, demoStats } from "@/lib/demo";
import { hasSupabaseAuthEnv, isDemoMode } from "@/lib/env";
import { formatPhoneDisplay } from "@/lib/phone";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ShellData = {
  agencyName: string;
  userName: string;
  userEmail: string;
  userInitials: string;
};

type DashboardData = {
  stats: {
    totalLeads: number;
    callsToday: number;
    appointments: number;
    transfers: number;
  };
  recentCalls: Array<{
    id: string;
    lead: string;
    summary: string;
    outcome: string;
    duration: string;
  }>;
  summary: {
    bookingRate: string;
    avgDuration: string;
    activeCampaigns: number;
    liveSipLines: number;
  };
};

export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  campaign: string;
  campaignType: "appointment_setter" | "renewal_reminder";
  location: string;
  city: string;
  state: string;
  premium: string;
  status: string;
  notes: string;
  nextFollowupAt: string;
};

export type CallRow = {
  id: string;
  lead: string;
  status: string;
  duration: string;
  outcome: string;
  summary: string;
};

export type ProfilePageData = {
  profileName: string;
  role: string;
  email: string;
  agencyName: string;
};

export type AppointmentRow = {
  id: string;
  lead: string;
  scheduledFor: string;
  scheduledForIso: string;
  status: string;
};

export type CampaignCard = {
  id: string;
  name: string;
  assistant: string;
  queued: number;
  connected: number;
  completed: number;
  callableNow: number;
  successRate: string;
};

export type AnalyticsData = {
  bookingRate: string;
  transferRate: string;
  avgDuration: string;
  dncRate: string;
  callsByDay: Array<{ label: string; value: number }>;
  outcomes: Array<{ label: string; value: number }>;
};

export type SipOption = {
  id: string;
  label: string;
  phoneNumber: string;
  isActive: boolean;
};

type UserContext = {
  shell: ShellData;
  agencyId: string | null;
  userId: string;
};

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "RP";
}

function formatLeadName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown lead";
}

function formatCampaignType(campaignType?: string | null) {
  if (campaignType === "appointment_setter") {
    return "Appointment Setter";
  }

  if (campaignType === "renewal_reminder") {
    return "Renewal Reminder";
  }

  return "Unassigned";
}

function formatLocation(city?: string | null, state?: string | null) {
  return [city, state].filter(Boolean).join(", ") || "Not provided";
}

function formatMoney(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const numberValue = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numberValue)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds < 1) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

async function getUserContext(): Promise<UserContext | null> {
  if (isDemoMode() || !hasSupabaseAuthEnv()) {
    return {
      agencyId: null,
      userId: "demo-user",
      shell: {
        agencyName: "Raj's Insurance",
        userName: "Raj Patel",
        userEmail: "raj@agency.com",
        userInitials: "RP",
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, agency_id")
    .eq("id", user.id)
    .maybeSingle();

  let agencyName = "Unassigned agency";
  if (profile?.agency_id) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("name")
      .eq("id", profile.agency_id)
      .maybeSingle();

    if (agency?.name) {
      agencyName = agency.name;
    }
  }

  const userName =
    profile?.full_name?.trim() || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  return {
    agencyId: profile?.agency_id ?? null,
    userId: user.id,
    shell: {
      agencyName,
      userName,
      userEmail: user.email ?? "No email",
      userInitials: initialsFromName(userName),
    },
  };
}

export async function getAppShellData(): Promise<ShellData> {
  const context = await getUserContext();
  return (
    context?.shell ?? {
      agencyName: "Raj's Insurance",
      userName: "Raj Patel",
      userEmail: "raj@agency.com",
      userInitials: "RP",
    }
  );
}

export async function getDashboardData(): Promise<DashboardData> {
  if (isDemoMode() || !hasSupabaseAuthEnv()) {
    return {
      stats: {
        totalLeads: demoStats.totalLeads,
        callsToday: demoStats.callsToday,
        appointments: demoStats.bookedToday,
        transfers: demoStats.transfersToday,
      },
      recentCalls: demoCalls.map((call) => ({
        id: call.id,
        lead: call.lead,
        summary: call.summary,
        outcome: call.outcome,
        duration: call.duration,
      })),
      summary: {
        bookingRate: demoAnalytics.bookingRate,
        avgDuration: demoAnalytics.avgDuration,
        activeCampaigns: 2,
        liveSipLines: 1,
      },
    };
  }

  const context = await getUserContext();
  if (!context?.agencyId) {
    return {
      stats: { totalLeads: 0, callsToday: 0, appointments: 0, transfers: 0 },
      recentCalls: [],
      summary: { bookingRate: "0%", avgDuration: "00:00", activeCampaigns: 0, liveSipLines: 0 },
    };
  }

  const supabase = await createServerSupabaseClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [
    leadsCount,
    callsTodayCount,
    appointmentsCount,
    transfersCount,
    sipLineCount,
    recentCallsResponse,
    callAnalysisResponse,
    leadsResponse,
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("agency_id", context.agencyId),
    supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", context.agencyId)
      .gte("created_at", todayIso),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", context.agencyId)
      .eq("status", "scheduled"),
    supabase
      .from("call_analysis")
      .select("id", { count: "exact", head: true })
      .eq("outcome", "transferred"),
    supabase
      .from("sip_configurations")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", context.agencyId)
      .eq("is_active", true),
    supabase
      .from("calls")
      .select("id, lead_id, duration_seconds, status, created_at")
      .eq("agency_id", context.agencyId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("call_analysis")
      .select("call_id, outcome, summary")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("leads")
      .select("id, first_name, last_name")
      .eq("agency_id", context.agencyId),
  ]);

  const analysisByCallId = new Map(
    (callAnalysisResponse.data ?? []).map((analysis) => [
      analysis.call_id,
      {
        outcome: analysis.outcome ?? "completed",
        summary: analysis.summary ?? "Call completed.",
      },
    ]),
  );
  const leadsById = new Map(
    (leadsResponse.data ?? []).map((lead) => [lead.id, formatLeadName(lead.first_name, lead.last_name)]),
  );

  const recentCalls = (recentCallsResponse.data ?? []).map((call) => {
    const analysis = analysisByCallId.get(call.id);
    return {
      id: call.id,
      lead: leadsById.get(call.lead_id) ?? "Unknown lead",
      summary: analysis?.summary ?? `Call status: ${call.status}`,
      outcome: analysis?.outcome ?? call.status,
      duration: formatDuration(call.duration_seconds),
    };
  });

  const bookedCalls = (callAnalysisResponse.data ?? []).filter(
    (analysis) => analysis.outcome === "appointment_booked",
  ).length;
  const completedDurations = (recentCallsResponse.data ?? [])
    .map((call) => call.duration_seconds ?? 0)
    .filter((duration) => duration > 0);
  const averageDurationSeconds =
    completedDurations.length > 0
      ? Math.round(
          completedDurations.reduce((total, duration) => total + duration, 0) / completedDurations.length,
        )
      : 0;

  return {
    stats: {
      totalLeads: leadsCount.count ?? 0,
      callsToday: callsTodayCount.count ?? 0,
      appointments: appointmentsCount.count ?? 0,
      transfers: transfersCount.count ?? 0,
    },
    recentCalls,
    summary: {
      bookingRate:
        (callsTodayCount.count ?? 0) > 0
          ? `${Math.round((bookedCalls / Math.max(callAnalysisResponse.data?.length ?? 1, 1)) * 100)}%`
          : "0%",
      avgDuration: formatDuration(averageDurationSeconds),
      activeCampaigns: 2,
      liveSipLines: sipLineCount.count ?? 0,
    },
  };
}

export async function getLeadsPageData(): Promise<LeadRow[]> {
  if (isDemoMode() || !hasSupabaseAuthEnv()) {
    return demoLeads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: formatPhoneDisplay(lead.phone),
      email: "demo@agency.com",
      campaign: lead.campaign,
      campaignType: lead.campaign === "Renewal Reminder" ? "renewal_reminder" : "appointment_setter",
      location: lead.city,
      city: lead.city,
      state: "",
      premium: lead.premium,
      status: lead.status,
      notes: "",
      nextFollowupAt: "",
    }));
  }

  const context = await getUserContext();
  if (!context?.agencyId) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("leads")
    .select("id, first_name, last_name, phone, email, campaign_type, city, state, monthly_premium, status, notes, next_followup_at")
    .eq("agency_id", context.agencyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((lead) => ({
    id: lead.id,
    name: formatLeadName(lead.first_name, lead.last_name),
    phone: formatPhoneDisplay(lead.phone),
    email: lead.email ?? "No email",
    campaign: formatCampaignType(lead.campaign_type),
    campaignType:
      lead.campaign_type === "renewal_reminder" ? "renewal_reminder" : "appointment_setter",
    location: formatLocation(lead.city, lead.state),
    city: lead.city ?? "",
    state: lead.state ?? "",
    premium: formatMoney(lead.monthly_premium),
    status: lead.status,
    notes: lead.notes ?? "",
    nextFollowupAt: lead.next_followup_at ?? "",
  }));
}

export async function getCallsPageData(): Promise<CallRow[]> {
  if (isDemoMode() || !hasSupabaseAuthEnv()) {
    return demoCalls.map((call) => ({
      id: call.id,
      lead: call.lead,
      status: call.status,
      duration: call.duration,
      outcome: call.outcome,
      summary: call.summary,
    }));
  }

  const context = await getUserContext();
  if (!context?.agencyId) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: calls }, { data: analyses }, { data: leads }] = await Promise.all([
    supabase
      .from("calls")
      .select("id, lead_id, status, duration_seconds, created_at")
      .eq("agency_id", context.agencyId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("call_analysis")
      .select("call_id, outcome, summary")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("leads").select("id, first_name, last_name").eq("agency_id", context.agencyId),
  ]);

  const analysisByCallId = new Map(
    (analyses ?? []).map((analysis) => [analysis.call_id, analysis]),
  );
  const leadNameById = new Map(
    (leads ?? []).map((lead) => [lead.id, formatLeadName(lead.first_name, lead.last_name)]),
  );

  return (calls ?? []).map((call) => {
    const analysis = analysisByCallId.get(call.id);
    return {
      id: call.id,
      lead: leadNameById.get(call.lead_id) ?? "Unknown lead",
      status: call.status,
      duration: formatDuration(call.duration_seconds),
      outcome: analysis?.outcome ?? call.status,
      summary: analysis?.summary ?? `Call status: ${call.status}`,
    };
  });
}

export async function getProfilePageData(): Promise<ProfilePageData> {
  if (isDemoMode() || !hasSupabaseAuthEnv()) {
    return {
      profileName: "Raj Patel",
      role: "Admin",
      email: "raj@agency.com",
      agencyName: "Raj's Insurance",
    };
  }

  const context = await getUserContext();
  if (!context) {
    return {
      profileName: "Unknown user",
      role: "Unknown",
      email: "No email",
      agencyName: "Unassigned agency",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", context.userId)
    .maybeSingle();

  return {
    profileName: profile?.full_name || context.shell.userName,
    role: profile?.role ? profile.role[0].toUpperCase() + profile.role.slice(1) : "Agent",
    email: context.shell.userEmail,
    agencyName: context.shell.agencyName,
  };
}

export async function getAppointmentsPageData(): Promise<AppointmentRow[]> {
  if (isDemoMode() || !hasSupabaseAuthEnv()) {
    return [];
  }

  const context = await getUserContext();
  if (!context?.agencyId) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: appointments }, { data: leads }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, lead_id, scheduled_for, status")
      .eq("agency_id", context.agencyId)
      .order("scheduled_for", { ascending: true })
      .limit(20),
    supabase.from("leads").select("id, first_name, last_name").eq("agency_id", context.agencyId),
  ]);

  const leadNameById = new Map(
    (leads ?? []).map((lead) => [lead.id, formatLeadName(lead.first_name, lead.last_name)]),
  );

  return (appointments ?? []).map((appointment) => ({
    id: appointment.id,
    lead: leadNameById.get(appointment.lead_id) ?? "Unknown lead",
    scheduledForIso: appointment.scheduled_for,
    scheduledFor: new Date(appointment.scheduled_for).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    status: appointment.status,
  }));
}

export async function getCampaignPageData(): Promise<CampaignCard[]> {
  if (isDemoMode() || !hasSupabaseAuthEnv()) {
    return [
      {
        id: "campaign-1",
        name: "Appointment Setter",
        assistant: "Mia",
        queued: 218,
        connected: 47,
        completed: 31,
        callableNow: 190,
        successRate: "22%",
      },
      {
        id: "campaign-2",
        name: "Renewal Reminder",
        assistant: "Ava",
        queued: 94,
        connected: 19,
        completed: 11,
        callableNow: 82,
        successRate: "14%",
      },
    ];
  }

  const context = await getUserContext();
  if (!context?.agencyId) {
    return [
      {
        id: "appointment_setter",
        name: "Appointment Setter",
        assistant: "Mia",
        queued: 0,
        connected: 0,
        completed: 0,
        callableNow: 0,
        successRate: "0%",
      },
      {
        id: "renewal_reminder",
        name: "Renewal Reminder",
        assistant: "Ava",
        queued: 0,
        connected: 0,
        completed: 0,
        callableNow: 0,
        successRate: "0%",
      },
    ];
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: leads }, { data: calls }] = await Promise.all([
    supabase.from("leads").select("campaign_type, status, do_not_call_before").eq("agency_id", context.agencyId),
    supabase.from("calls").select("campaign_type, status").eq("agency_id", context.agencyId),
  ]);

  const campaignConfigs = [
    { id: "appointment_setter", name: "Appointment Setter", assistant: "Mia" },
    { id: "renewal_reminder", name: "Renewal Reminder", assistant: "Ava" },
  ] as const;

  return campaignConfigs.map((campaign) => {
    const queued = (leads ?? []).filter(
      (lead) => lead.campaign_type === campaign.id && !["appointment_booked", "dnc", "transferred"].includes(lead.status),
    ).length;
    const callableNow = (leads ?? []).filter(
      (lead) =>
        lead.campaign_type === campaign.id &&
        !["appointment_booked", "dnc", "transferred"].includes(lead.status) &&
        (!lead.do_not_call_before || new Date(lead.do_not_call_before) <= new Date()),
    ).length;
    const connected = (calls ?? []).filter(
      (call) => call.campaign_type === campaign.id && ["completed", "in_progress"].includes(call.status),
    ).length;
    const completed = (calls ?? []).filter(
      (call) => call.campaign_type === campaign.id && call.status === "completed",
    ).length;
    const wins = (leads ?? []).filter(
      (lead) =>
        lead.campaign_type === campaign.id &&
        (lead.status === "appointment_booked" || lead.status === "transferred"),
    ).length;
    const successBase = Math.max(connected, 1);

    return {
      id: campaign.id,
      name: campaign.name,
      assistant: campaign.assistant,
      queued,
      connected,
      completed,
      callableNow,
      successRate: `${Math.round((wins / successBase) * 100)}%`,
    };
  });
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  if (isDemoMode() || !hasSupabaseAuthEnv()) {
    return {
      bookingRate: demoAnalytics.bookingRate,
      transferRate: demoAnalytics.transferRate,
      avgDuration: demoAnalytics.avgDuration,
      dncRate: demoAnalytics.dncRate,
      callsByDay: [
        { label: "Sun", value: 18 },
        { label: "Mon", value: 22 },
        { label: "Tue", value: 26 },
        { label: "Wed", value: 19 },
        { label: "Thu", value: 24 },
        { label: "Fri", value: 16 },
        { label: "Sat", value: 12 },
      ],
      outcomes: [
        { label: "Booked", value: 8 },
        { label: "Transferred", value: 5 },
        { label: "Voicemail", value: 7 },
        { label: "DNC", value: 2 },
      ],
    };
  }

  const context = await getUserContext();
  if (!context?.agencyId) {
    return {
      bookingRate: "0%",
      transferRate: "0%",
      avgDuration: "00:00",
      dncRate: "0%",
      callsByDay: [
        { label: "Sun", value: 0 },
        { label: "Mon", value: 0 },
        { label: "Tue", value: 0 },
        { label: "Wed", value: 0 },
        { label: "Thu", value: 0 },
        { label: "Fri", value: 0 },
        { label: "Sat", value: 0 },
      ],
      outcomes: [
        { label: "Booked", value: 0 },
        { label: "Transferred", value: 0 },
        { label: "Voicemail", value: 0 },
        { label: "DNC", value: 0 },
      ],
    };
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: calls }, { data: analyses }, { data: leads }] = await Promise.all([
    supabase.from("calls").select("duration_seconds, status, created_at").eq("agency_id", context.agencyId),
    supabase.from("call_analysis").select("outcome"),
    supabase.from("leads").select("status").eq("agency_id", context.agencyId),
  ]);

  const booked = (analyses ?? []).filter((analysis) => analysis.outcome === "appointment_booked").length;
  const transferred = (analyses ?? []).filter((analysis) => analysis.outcome === "transferred").length;
  const dnc = (leads ?? []).filter((lead) => lead.status === "dnc").length;
  const voicemail = (calls ?? []).filter((call) => call.status === "voicemail").length;
  const completedDurations = (calls ?? [])
    .map((call) => call.duration_seconds ?? 0)
    .filter((duration) => duration > 0);
  const averageDurationSeconds =
    completedDurations.length > 0
      ? Math.round(
          completedDurations.reduce((total, duration) => total + duration, 0) / completedDurations.length,
        )
      : 0;
  const analysisCount = Math.max(analyses?.length ?? 0, 1);
  const leadCount = Math.max(leads?.length ?? 0, 1);
  const callsByDay = Array.from({ length: 7 }, (_, index) => {
    const value = new Date();
    value.setDate(value.getDate() - (6 - index));
    value.setHours(0, 0, 0, 0);
    return value;
  }).map((day) => {
    const count = (calls ?? []).filter((call) => {
      const createdAt = (call as { created_at?: string | null }).created_at;
      if (!createdAt) {
        return false;
      }
      const created = new Date(createdAt);
      return created.toDateString() === day.toDateString();
    }).length;

    return {
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      value: count,
    };
  });

  return {
    bookingRate: `${Math.round((booked / analysisCount) * 100)}%`,
    transferRate: `${Math.round((transferred / analysisCount) * 100)}%`,
    avgDuration: formatDuration(averageDurationSeconds),
    dncRate: `${Math.round((dnc / leadCount) * 100)}%`,
    callsByDay,
    outcomes: [
      { label: "Booked", value: booked },
      { label: "Transferred", value: transferred },
      { label: "Voicemail", value: voicemail },
      { label: "DNC", value: dnc },
    ],
  };
}

export async function getSipConfigOptions(): Promise<SipOption[]> {
  if (isDemoMode() || !hasSupabaseAuthEnv()) {
    return [
      {
        id: "demo-sip-config",
        label: "Main Line",
        phoneNumber: "+13125550182",
        isActive: true,
      },
    ];
  }

  const context = await getUserContext();
  if (!context?.agencyId) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("sip_configurations")
    .select("id, label, phone_number, is_active")
    .eq("agency_id", context.agencyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((config) => ({
    id: config.id,
    label: config.label,
    phoneNumber: config.phone_number,
    isActive: config.is_active,
  }));
}
