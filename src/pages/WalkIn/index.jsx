import React, { memo, useMemo, useState } from "react";

const HOSTS = ["Arjun Mehta", "Priya Sharma", "Rahul Nair", "Khalid Ibrahim"];
const PURPOSES = ["Business Meeting", "Interview", "Consultation", "Delivery", "Contract Signing", "Other"];
const ROOMS = ["Board Room A", "Conference Room 1", "Cabin 1", "Cabin 3"];
const GUEST_LOG_KEY = "cgms_guest_log";

const initialForm = {
  name: "",
  company: "",
  contactNumber: "",
  idType: "Emirates ID",
  host: "",
  purpose: "",
  room: "",
  remarks: "",
};

// ─── Design tokens (violet system) ──────────────────────────────────────────
const inputCls =
  "w-full rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400";
const selectCls = `${inputCls} cursor-pointer`;
const btnPrimary =
  "cursor-pointer rounded-[10px] border border-violet-700 bg-violet-700 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-violet-800 hover:border-violet-800 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";
const btnSecondary =
  "cursor-pointer rounded-[10px] border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = memo(function Toast({ message, type = "success", onClose }) {
  const base =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-700";
  return (
    <div className={`fixed right-4 top-4 z-[10000] flex items-center gap-3 rounded-[10px] border px-4 py-3 text-[13px] font-semibold shadow-lg ${base}`}>
      <span>{message}</span>
      <button onClick={onClose} className="cursor-pointer text-lg leading-none opacity-60 hover:opacity-100 transition">×</button>
    </div>
  );
});

// ─── Field wrapper ────────────────────────────────────────────────────────────
const Field = memo(function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] font-semibold text-red-500">⚠ {error}</p>}
    </div>
  );
});

// ─── Step indicator ──────────────────────────────────────────────────────────
const StepDot = memo(function StepDot({ n, label, step }) {
  const active = step === n;
  const done = step > n;
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
        done ? "bg-emerald-500 text-white shadow-sm" :
        active ? "bg-violet-700 text-white shadow-sm" :
        "border border-slate-200 bg-white text-slate-400"
      }`}>
        {done ? "✓" : n}
      </div>
      <span className={`text-[11px] font-semibold ${active || done ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
    </div>
  );
});

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value }) {
  return (
    <div className="rounded-[10px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400">{label}</div>
      <div className="text-[13px] font-semibold text-[#1E1B4B] break-words">{value || "—"}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WalkIn({ onAddVisitor }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.name.trim()) e.name = "Full Name is required.";
      if (!form.contactNumber.trim()) e.contactNumber = "Contact Number is required.";
      if (!form.idType.trim()) e.idType = "ID Type is required.";
    }
    if (s === 2) {
      if (!form.host.trim()) e.host = "Host is required.";
      if (!form.purpose.trim()) e.purpose = "Purpose is required.";
      if (!form.room.trim()) e.room = "Room is required.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const persistGuestLog = (visitor) => {
    const existing = JSON.parse(localStorage.getItem(GUEST_LOG_KEY) || "[]");
    const entry = {
      id: Date.now(),
      ...visitor,
      checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).replace(/am|pm/gi, m => m.toUpperCase()),
      checkInDate: new Date().toLocaleDateString("en-GB"),
      source: "Walk-In",
      status: "Checked In",
    };
    localStorage.setItem(GUEST_LOG_KEY, JSON.stringify([entry, ...existing]));
  };

  const goNext = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, 3)); };
  const goBack = () => { setErrors({}); setStep(s => Math.max(s - 1, 1)); };

  const resetForm = () => { setStep(1); setForm(initialForm); setErrors({}); setSubmitted(false); setLoading(false); setToast(null); };

  const handleSubmit = () => {
    if (!validateStep(2)) return;
    setLoading(true);
    setTimeout(() => {
      const visitor = {
        name: form.name.trim(), company: form.company.trim(),
        contactNumber: form.contactNumber.trim(), idType: form.idType,
        host: form.host, purpose: form.purpose, room: form.room, remarks: form.remarks.trim(),
      };
      onAddVisitor?.(visitor);
      persistGuestLog(visitor);
      setLoading(false); setSubmitted(true);
      setToast({ message: "Check-In completed successfully.", type: "success" });
    }, 700);
  };

  const checkInTime = useMemo(
    () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).replace(/am|pm/gi, m => m.toUpperCase()),
    [submitted]
  );

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[14px] border border-slate-200 bg-white p-8 shadow-sm text-center">
            <div className="mb-4 text-5xl">✅</div>
            <h3 className="text-[22px] font-extrabold text-[#1E1B4B] font-['Outfit',sans-serif]">Check-In Successful</h3>
            <p className="mt-1 mb-6 text-[13px] text-slate-500">
              {form.name} from {form.company || "Individual"} has been checked in successfully.
            </p>
            <div className="mb-5 grid gap-3 text-left sm:grid-cols-2">
              {[
                ["Name", form.name], ["Company", form.company], ["Contact Number", form.contactNumber],
                ["Host", form.host], ["Purpose", form.purpose], ["ID Type", form.idType],
                ["Room", form.room], ["Check-In Time", checkInTime],
                ["Check-In Date", new Date().toLocaleDateString("en-GB")],
              ].map(([k, v]) => <SummaryCard key={k} label={k} value={v} />)}
            </div>
            <div className="mb-5 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">
              Host will be notified automatically after server confirmation.
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={resetForm} className={btnPrimary}>+ New Check-In</button>
              <button onClick={() => window.location.hash = "#/guest-logs"} className={btnSecondary}>Go to Guest Log</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form screen ──
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-violet-600">Walk-In Check-In</p>
            <h2 className="mt-1 text-[22px] font-extrabold text-[#1E1B4B] font-['Outfit',sans-serif]">Register Visitor Quickly</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">Step-by-step flow to create a clean visitor record and notify the host.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live Entry
          </span>
        </div>

        {/* Step indicators */}
        <div className="flex rounded-[14px] border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <StepDot n={1} label="Visitor Info" step={step} />
          <div className="flex-1 flex items-center px-2 mt-4">
            <div className={`h-px w-full transition-all ${step > 1 ? "bg-emerald-400" : "bg-slate-200"}`} />
          </div>
          <StepDot n={2} label="Visit Details" step={step} />
          <div className="flex-1 flex items-center px-2 mt-4">
            <div className={`h-px w-full transition-all ${step > 2 ? "bg-emerald-400" : "bg-slate-200"}`} />
          </div>
          <StepDot n={3} label="Confirm" step={step} />
        </div>

        {/* Form card */}
        <div className="rounded-[14px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" required error={errors.name}>
                <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Enter Name" maxLength={80} className={inputCls} />
              </Field>
              <Field label="Company" error={errors.company}>
                <input value={form.company} onChange={e => update("company", e.target.value)} placeholder="Enter Company" maxLength={80} className={inputCls} />
              </Field>
              <Field label="Contact Number" required error={errors.contactNumber}>
                <input value={form.contactNumber} onChange={e => update("contactNumber", e.target.value)} placeholder="Enter Contact Number" maxLength={15} className={inputCls} />
              </Field>
              <Field label="ID Type" required error={errors.idType}>
                <select value={form.idType} onChange={e => update("idType", e.target.value)} className={selectCls}>
                  <option>Emirates ID</option>
                  <option>Passport</option>
                  <option>Driving Licence</option>
                  <option>Other</option>
                </select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Host" required error={errors.host}>
                <select value={form.host} onChange={e => update("host", e.target.value)} className={selectCls}>
                  <option value="">Select Host</option>
                  {HOSTS.map(h => <option key={h}>{h}</option>)}
                </select>
              </Field>
              <Field label="Purpose" required error={errors.purpose}>
                <select value={form.purpose} onChange={e => update("purpose", e.target.value)} className={selectCls}>
                  <option value="">Select Purpose</option>
                  {PURPOSES.map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Room" required error={errors.room}>
                <select value={form.room} onChange={e => update("room", e.target.value)} className={selectCls}>
                  <option value="">Select Room</option>
                  {ROOMS.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Description">
                <textarea
                  value={form.remarks} onChange={e => update("remarks", e.target.value.slice(0, 200))}
                  placeholder="Enter Description" rows={3} maxLength={200}
                  className={`${inputCls} resize-y`}
                />
                <span className="text-right text-[10px] text-slate-400">{form.remarks.length}/200</span>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-4 text-[14px] font-bold text-[#1E1B4B]">Confirm Check-In Details</p>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Name", form.name], ["Company", form.company], ["Contact Number", form.contactNumber],
                  ["ID Type", form.idType], ["Host", form.host], ["Purpose", form.purpose],
                  ["Room", form.room], ["Description", form.remarks],
                ].map(([k, v]) => <SummaryCard key={k} label={k} value={v} />)}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={goBack} disabled={step === 1} className={step === 1 ? "cursor-not-allowed rounded-[10px] border border-slate-100 bg-slate-50 px-5 py-2.5 text-[13px] font-semibold text-slate-300" : btnSecondary}>
              {step === 1 ? "Cancel" : "← Back"}
            </button>
            {step < 3 ? (
              <button type="button" onClick={goNext} className={`${btnPrimary} flex-1`}>Continue →</button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className={`${btnPrimary} flex-1`}>
                {loading ? "Saving…" : "Complete Check-In"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}