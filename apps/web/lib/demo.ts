export const demoStats = {
  totalLeads: 1248,
  callsToday: 83,
  bookedToday: 17,
  transfersToday: 9,
};

export const demoLeads = [
  {
    id: "lead-1",
    name: "Eleanor Brooks",
    phone: "(312) 555-0182",
    campaign: "Appointment Setter",
    status: "new",
    city: "Chicago, IL",
    premium: "$89/mo",
  },
  {
    id: "lead-2",
    name: "James Carter",
    phone: "(214) 555-0141",
    campaign: "Renewal Reminder",
    status: "callback_scheduled",
    city: "Dallas, TX",
    premium: "$129/mo",
  },
  {
    id: "lead-3",
    name: "Patricia Nelson",
    phone: "(404) 555-0175",
    campaign: "Appointment Setter",
    status: "appointment_booked",
    city: "Atlanta, GA",
    premium: "$74/mo",
  },
  {
    id: "lead-4",
    name: "Robert Hayes",
    phone: "(480) 555-0130",
    campaign: "Renewal Reminder",
    status: "dnc",
    city: "Phoenix, AZ",
    premium: "$112/mo",
  },
];

export const demoCalls = [
  {
    id: "call-1",
    lead: "Eleanor Brooks",
    status: "completed",
    duration: "04:18",
    outcome: "appointment_booked",
    summary: "Confirmed city, beneficiary, and phone. Booked a call for tomorrow at 10:30 AM.",
  },
  {
    id: "call-2",
    lead: "James Carter",
    status: "voicemail",
    duration: "00:31",
    outcome: "voicemail",
    summary: "Reached voicemail greeting, left callback message, scheduled follow-up for next day.",
  },
  {
    id: "call-3",
    lead: "Mildred Turner",
    status: "completed",
    duration: "03:07",
    outcome: "transferred",
    summary: "Lead confirmed premium discomfort and requested live agent help. Warm transfer initiated.",
  },
];

export const demoAppointments = [
  {
    id: "appt-1",
    lead: "Eleanor Brooks",
    scheduledFor: "Tomorrow, 10:30 AM",
    status: "scheduled",
  },
  {
    id: "appt-2",
    lead: "Patricia Nelson",
    scheduledFor: "Monday, 2:00 PM",
    status: "scheduled",
  },
];

export const demoCampaigns = [
  {
    id: "campaign-1",
    name: "Appointment Setter",
    assistant: "Mia",
    queued: 218,
    successRate: "22%",
  },
  {
    id: "campaign-2",
    name: "Renewal Reminder",
    assistant: "Ava",
    queued: 94,
    successRate: "14%",
  },
];

export const demoAnalytics = {
  bookingRate: "20.4%",
  transferRate: "11.2%",
  avgDuration: "03:41",
  dncRate: "4.1%",
};

export function demoApiResponse<T>(payload: T): T {
  return payload;
}
