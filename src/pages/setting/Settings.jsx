import React, { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';
import { Toast } from '../../components/ui';
import { Moon, Sun, Check, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [toast, setToast] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const [general, setGeneral] = useState({
    orgName: 'TechCorp Middle East',
    orgEmail: 'admin@techcorp.ae',
    phone: '+971 50 011 1111',
    timezone: 'Asia/Dubai',
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
  });

  const [notifSettings, setNotifSettings] = useState({
    emailNotif: true,
    whatsappNotif: false,
    smsNotif: true,
    visitorCheckin: true,
    appointmentReminder: true,
    serviceAlert: true,
    reportGenerated: false,
    staffLogin: false,
  });

  const [reportSettings, setReportSettings] = useState({
    autoGenerate: true,
    frequency: 'Weekly',
    sendTo: 'director@corpgms.com',
    format: 'PDF',
    includeVisitors: true,
    includeAppointments: true,
    includeRooms: true,
    includeServices: true,
    includeStaff: false,
    retentionDays: '90',
    watermark: true,
    logo: true,
  });

  const [security, setSecurity] = useState({
    sessionTimeout: '30',
    twoFactor: false,
    passwordExpiry: '90',
    loginAttempts: '5',
    auditLog: true,
  });

  const save = () => setToast({ msg: 'Settings saved successfully.', type: 'success' });

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'reports', label: 'Reports' },
    { id: 'security', label: 'Security' },
    { id: 'subscription', label: 'Subscription' },
  ];

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
        checked ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${
          checked ? 'left-[23px]' : 'left-[3px]'
        }`}
      />
    </button>
  );

  function ToggleRow({ label: lbl, desc, checked, onChange }) {
    return (
      <div className="flex items-center justify-between border-b border-[var(--app-border)] py-3">
        <div className="pr-4">
          <div className="text-[13px] font-bold text-[var(--app-text)]">{lbl}</div>
          {desc && <div className="mt-0.5 text-[11px] text-[var(--app-muted)]">{desc}</div>}
        </div>
        <Toggle checked={checked} onChange={onChange} />
      </div>
    );
  }

  function FormRow({ label, children }) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--app-muted)]">
          {label}
        </label>
        {children}
      </div>
    );
  }

  const baseCard = 'rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm';
  const baseInput =
    'w-full rounded-[10px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-[13px] text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-muted)] focus:border-sky-500';
  const baseBtn =
    'rounded-[10px] border border-sky-500 bg-sky-500 px-[18px] py-2 text-[13px] font-bold text-white transition hover:bg-sky-600';
  const themeBtn =
    'inline-flex items-center gap-2 rounded-[10px] border border-sky-500 px-[18px] py-2 text-[13px] font-bold text-sky-700 transition hover:bg-sky-50';

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-7 font-['Outfit','Plus_Jakarta_Sans',sans-serif] text-[var(--app-text)] sm:px-6 lg:px-8">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[20px] font-extrabold text-[var(--app-text)]">Settings</h1>
          <p className="mt-1 text-[13px] text-[var(--app-muted)]">
            Manage your platform configuration
          </p>
        </div>

        <button onClick={toggleTheme} className={themeBtn}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'White Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className={`${baseCard} w-full shrink-0 p-3 lg:w-[240px]`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-col">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-[10px] px-4 py-[11px] text-left text-[13px] font-bold transition w-full
                  ${
                    activeTab === tab.id
                      ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                      : 'bg-transparent text-[var(--app-muted)] hover:bg-[var(--app-surface-alt)]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {activeTab === 'general' && (
            <section className={`${baseCard} p-5`}>
              <h3 className="mb-5 mt-0 text-[16px] font-extrabold text-[var(--app-text)]">
                General Settings
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormRow label="Organisation Name">
                  <input
                    className={baseInput}
                    value={general.orgName}
                    onChange={(e) => setGeneral((p) => ({ ...p, orgName: e.target.value }))}
                    placeholder="Enter Organisation Name"
                  />
                </FormRow>
                <FormRow label="Email ID">
                  <input
                    className={baseInput}
                    value={general.orgEmail}
                    onChange={(e) => setGeneral((p) => ({ ...p, orgEmail: e.target.value }))}
                    placeholder="Enter Email ID"
                  />
                </FormRow>
                <FormRow label="Contact Number">
                  <input
                    className={baseInput}
                    value={general.phone}
                    onChange={(e) => setGeneral((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Enter Contact Number"
                  />
                </FormRow>
                <FormRow label="Time Zone">
                  <select
                    className={baseInput}
                    value={general.timezone}
                    onChange={(e) => setGeneral((p) => ({ ...p, timezone: e.target.value }))}
                  >
                    <option>Asia/Kolkata</option>
                    <option>Asia/Dubai</option>
                    <option>UTC</option>
                    <option>America/New_York</option>
                  </select>
                </FormRow>
                <FormRow label="Language">
                  <select
                    className={baseInput}
                    value={general.language}
                    onChange={(e) => setGeneral((p) => ({ ...p, language: e.target.value }))}
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Arabic</option>
                  </select>
                </FormRow>
                <FormRow label="Date Format">
                  <select
                    className={baseInput}
                    value={general.dateFormat}
                    onChange={(e) => setGeneral((p) => ({ ...p, dateFormat: e.target.value }))}
                  >
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </FormRow>
                <FormRow label="Currency">
                  <select
                    className={baseInput}
                    value={general.currency}
                    onChange={(e) => setGeneral((p) => ({ ...p, currency: e.target.value }))}
                  >
                    <option>INR</option>
                    <option>USD</option>
                    <option>INR</option>
                  </select>
                </FormRow>
              </div>
              <button className={`${baseBtn} mt-4`} onClick={save}>
                Save Changes
              </button>
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className={`${baseCard} p-5`}>
              <h3 className="mb-5 mt-0 text-[16px] font-extrabold text-[var(--app-text)]">
                Notification Settings
              </h3>
              <div className="mb-5">
                <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--app-accent)]">
                  Channels
                </div>
                <ToggleRow
                  label="Email Notifications"
                  desc="Send alerts via email"
                  checked={notifSettings.emailNotif}
                  onChange={(v) => setNotifSettings((p) => ({ ...p, emailNotif: v }))}
                />
                <ToggleRow
                  label="WhatsApp Notifications"
                  desc="Send alerts via WhatsApp"
                  checked={notifSettings.whatsappNotif}
                  onChange={(v) => setNotifSettings((p) => ({ ...p, whatsappNotif: v }))}
                />
                <ToggleRow
                  label="SMS Notifications"
                  desc="Send alerts via SMS"
                  checked={notifSettings.smsNotif}
                  onChange={(v) => setNotifSettings((p) => ({ ...p, smsNotif: v }))}
                />
              </div>
              <div>
                <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--app-accent)]">
                  Alert Types
                </div>
                <ToggleRow
                  label="Visitor Check-in"
                  checked={notifSettings.visitorCheckin}
                  onChange={(v) => setNotifSettings((p) => ({ ...p, visitorCheckin: v }))}
                />
                <ToggleRow
                  label="Appointment Reminders"
                  checked={notifSettings.appointmentReminder}
                  onChange={(v) => setNotifSettings((p) => ({ ...p, appointmentReminder: v }))}
                />
                <ToggleRow
                  label="Service Alerts"
                  checked={notifSettings.serviceAlert}
                  onChange={(v) => setNotifSettings((p) => ({ ...p, serviceAlert: v }))}
                />
                <ToggleRow
                  label="Report Generated"
                  checked={notifSettings.reportGenerated}
                  onChange={(v) => setNotifSettings((p) => ({ ...p, reportGenerated: v }))}
                />
                <ToggleRow
                  label="Staff Login Activity"
                  checked={notifSettings.staffLogin}
                  onChange={(v) => setNotifSettings((p) => ({ ...p, staffLogin: v }))}
                />
              </div>
              <button className={`${baseBtn} mt-4`} onClick={save}>
                Save Changes
              </button>
            </section>
          )}

          {activeTab === 'reports' && (
            <section className={`${baseCard} p-5`}>
              <h3 className="mb-5 mt-0 text-[16px] font-extrabold text-[var(--app-text)]">
                Report Settings
              </h3>
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormRow label="Auto-Generate Frequency">
                  <select
                    className={baseInput}
                    value={reportSettings.frequency}
                    onChange={(e) => setReportSettings((p) => ({ ...p, frequency: e.target.value }))}
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                  </select>
                </FormRow>
                <FormRow label="Send Report To">
                  <input
                    className={baseInput}
                    value={reportSettings.sendTo}
                    onChange={(e) => setReportSettings((p) => ({ ...p, sendTo: e.target.value }))}
                    placeholder="Enter Email ID"
                  />
                </FormRow>
                <FormRow label="Export Format">
                  <select
                    className={baseInput}
                    value={reportSettings.format}
                    onChange={(e) => setReportSettings((p) => ({ ...p, format: e.target.value }))}
                  >
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                  </select>
                </FormRow>
                <FormRow label="Data Retention (Days)">
                  <input
                    className={baseInput}
                    type="number"
                    value={reportSettings.retentionDays}
                    onChange={(e) => setReportSettings((p) => ({ ...p, retentionDays: e.target.value }))}
                  />
                </FormRow>
              </div>
              <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--app-accent)]">
                Include in Reports
              </div>
              {[
                ['includeVisitors', 'Visitor Log'],
                ['includeAppointments', 'Appointments'],
                ['includeRooms', 'Room Utilisation'],
                ['includeServices', 'Services'],
                ['includeStaff', 'Staff Activity'],
                ['watermark', 'Add Watermark'],
                ['logo', 'Include Logo'],
                ['autoGenerate', 'Auto-Generate Reports'],
              ].map(([key, lbl]) => (
                <ToggleRow
                  key={key}
                  label={lbl}
                  checked={reportSettings[key]}
                  onChange={(v) => setReportSettings((p) => ({ ...p, [key]: v }))}
                />
              ))}
              <button className={`${baseBtn} mt-4`} onClick={save}>
                Save Report Settings
              </button>
            </section>
          )}

          {activeTab === 'security' && (
            <section className={`${baseCard} p-5`}>
              <h3 className="mb-5 mt-0 text-[16px] font-extrabold text-[var(--app-text)]">
                Security Settings
              </h3>
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormRow label="Session Timeout (Minutes)">
                  <input
                    className={baseInput}
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity((p) => ({ ...p, sessionTimeout: e.target.value }))}
                  />
                </FormRow>
                <FormRow label="Password Expiry (Days)">
                  <input
                    className={baseInput}
                    type="number"
                    value={security.passwordExpiry}
                    onChange={(e) => setSecurity((p) => ({ ...p, passwordExpiry: e.target.value }))}
                  />
                </FormRow>
                <FormRow label="Max Login Attempts">
                  <input
                    className={baseInput}
                    type="number"
                    value={security.loginAttempts}
                    onChange={(e) => setSecurity((p) => ({ ...p, loginAttempts: e.target.value }))}
                  />
                </FormRow>
              </div>
              <ToggleRow
                label="Two-Factor Authentication"
                desc="Require 2FA for all admin logins"
                checked={security.twoFactor}
                onChange={(v) => setSecurity((p) => ({ ...p, twoFactor: v }))}
              />
              <ToggleRow
                label="Audit Log"
                desc="Log all admin actions for compliance"
                checked={security.auditLog}
                onChange={(v) => setSecurity((p) => ({ ...p, auditLog: v }))}
              />
              <button className={`${baseBtn} mt-4`} onClick={save}>
                Save Security Settings
              </button>
            </section>
          )}

          {activeTab === 'subscription' && (
            <section>
              <div className="mb-5 rounded-[14px] border border-[var(--app-border)] bg-[linear-gradient(135deg,#0C2340_0%,#0284C7_100%)] p-5 text-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] opacity-70">
                      Current Plan
                    </div>
                    <div className="mt-1 text-[28px] font-black">Professional</div>
                    <div className="mt-1 text-[13px] opacity-80">
                      5 Offices · 25 Users · 5,000 Visitors/Month
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[36px] font-black">
                      ₹7,999<span className="text-[14px] opacity-70">/Month</span>
                    </div>
                    <div className="text-[11px] opacity-70">Renews 30/04/2026</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`${baseCard} relative p-5 ${
                      plan.featured ? 'border-sky-500' : ''
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute left-1/2 top-[-12px] -translate-x-1/2 rounded-full bg-sky-500 px-3 py-1 text-[10px] font-extrabold text-white">
                        CURRENT
                      </div>
                    )}

                    <div className="text-[17px] font-black" style={{ color: plan.color }}>
                      {plan.name}
                    </div>

                    <div className="my-2 text-[28px] font-black text-[var(--app-text)]">
                      ₹{plan.price}
                      <span className="ml-1 text-[12px] text-[var(--app-muted)]">/Month</span>
                    </div>

                    <div className="mb-3 text-[11px] text-[var(--app-muted)]">
                      {plan.desc}
                    </div>

                    {plan.features.slice(0, 4).map((f) => (
                      <div
                        key={f.label}
                        className={`mb-1 text-[12px] ${
                          f.included ? 'text-emerald-600' : 'text-[var(--app-muted)]'
                        }`}
                      >
                        {f.included ? <Check size={12} className="mr-1 inline" /> : <X size={12} className="mr-1 inline" />}
                        {f.label}
                      </div>
                    ))}

                    <button
                      className={`mt-4 w-full rounded-[10px] border px-4 py-2 text-[13px] font-bold transition ${
                        plan.featured
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-sky-500 text-sky-600 hover:bg-sky-50'
                      }`}
                    >
                      {plan.featured ? 'Current Plan' : 'Upgrade'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default SettingsPage;