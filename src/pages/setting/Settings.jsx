import React, { useState } from 'react';
import { Settings, Bell, Shield, Globe, Palette, Database, Save, ChevronRight } from 'lucide-react';

const SECTIONS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'organization', label: 'Organization', icon: Globe },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Data & Storage', icon: Database },
];

// ToggleField Component
const ToggleField = ({ label, description, value, onChange, color = '#A78BFA' }) => {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-purple-500/8 last:border-b-0">
      <div>
        <div className="text-sm font-medium text-purple-100">{label}</div>
        <div className="text-xs text-purple-300/50 mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="w-11 h-6 rounded-full border-none cursor-pointer relative flex-shrink-0 transition-all duration-200"
        style={{
          backgroundColor: value ? color : 'rgba(255,255,255,0.1)'
        }}
      >
        <div 
          className="w-4.5 h-4.5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-200"
          style={{
            left: value ? '23px' : '3px'
          }}
        />
      </button>
    </div>
  );
};

// InputField Component
const InputField = ({ label, value, onChange, type = 'text', placeholder }) => {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-purple-400/70 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.25 bg-white/5 border border-purple-500/20 rounded-lg text-purple-100 text-sm outline-none transition-all duration-150 hover:border-purple-500/30 focus:border-purple-500/50"
        style={{ boxSizing: 'border-box' }}
      />
    </div>
  );
};

// SelectField Component
const SelectField = ({ label, value, onChange, options }) => {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-purple-400/70 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.25 bg-slate-900/80 border border-purple-500/20 rounded-lg text-purple-100 text-sm outline-none cursor-pointer transition-all duration-150 hover:border-purple-500/30 focus:border-purple-500/50"
        style={{ boxSizing: 'border-box' }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-slate-900">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// SectionHeader Component
const SectionHeader = ({ title, subtitle }) => {
  return (
    <div className="mb-6 pb-4 border-b border-purple-500/10">
      <h2 className="text-base font-bold text-purple-100 mb-1">{title}</h2>
      <p className="text-xs text-purple-300/50">{subtitle}</p>
    </div>
  );
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState({
    orgName: 'CorpGMS Inc.',
    email: 'admin@corpgms.com',
    phone: '+1 (555) 000-0000',
    address: '123 Business Ave, Suite 100',
    timezone: 'UTC+5:30',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    newGuestAlert: true,
    appointmentReminder: true,
    dailyReport: false,
    weeklyDigest: true,
    systemAlerts: true,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30',
    loginAttempts: '5',
    passwordExpiry: '90',
    auditLog: true,
    ipRestriction: false,
    requireStrongPass: true,
  });

  const [appearance, setAppearance] = useState({
    theme: 'dark',
    accentColor: '#8B5CF6',
    compactMode: false,
    showAvatars: true,
    animationsEnabled: true,
    sidebarCollapsed: false,
  });

  const [data, setData] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: '90',
    exportFormat: 'csv',
    guestDataAnonymize: false,
    analyticsTracking: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const renderSection = () => {
    if (activeSection === 'general') {
      return (
        <div>
          <SectionHeader title="General Settings" subtitle="Basic organization and system configuration" />
          <div className="grid grid-cols-2 gap-x-6">
            <InputField label="Organization Name" value={general.orgName} onChange={v => setGeneral({ ...general, orgName: v })} />
            <InputField label="Email Address" value={general.email} onChange={v => setGeneral({ ...general, email: v })} type="email" />
            <InputField label="Phone Number" value={general.phone} onChange={v => setGeneral({ ...general, phone: v })} />
            <SelectField 
              label="Timezone" 
              value={general.timezone} 
              onChange={v => setGeneral({ ...general, timezone: v })}
              options={['UTC-8', 'UTC-5', 'UTC+0', 'UTC+1', 'UTC+5:30', 'UTC+8', 'UTC+9'].map(z => ({ value: z, label: z }))}
            />
            <SelectField 
              label="Language" 
              value={general.language} 
              onChange={v => setGeneral({ ...general, language: v })}
              options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }, { value: 'mr', label: 'Marathi' }]}
            />
            <SelectField 
              label="Date Format" 
              value={general.dateFormat} 
              onChange={v => setGeneral({ ...general, dateFormat: v })}
              options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(f => ({ value: f, label: f }))}
            />
            <SelectField 
              label="Time Format" 
              value={general.timeFormat} 
              onChange={v => setGeneral({ ...general, timeFormat: v })}
              options={[{ value: '12h', label: '12-hour (AM/PM)' }, { value: '24h', label: '24-hour' }]}
            />
          </div>
          <div className="col-span-full mt-4">
            <InputField label="Office Address" value={general.address} onChange={v => setGeneral({ ...general, address: v })} placeholder="Full address..." />
          </div>
        </div>
      );
    }

    if (activeSection === 'notifications') {
      return (
        <div>
          <SectionHeader title="Notification Preferences" subtitle="Control how and when you receive alerts" />
          <div className="mb-5">
            <div className="text-xs font-semibold text-purple-300/50 uppercase tracking-wider mb-2.5">Channels</div>
            <ToggleField label="Email Alerts" description="Receive notifications via email" value={notifications.emailAlerts} onChange={v => setNotifications({ ...notifications, emailAlerts: v })} color="#60A5FA" />
            <ToggleField label="SMS Alerts" description="Receive notifications via SMS" value={notifications.smsAlerts} onChange={v => setNotifications({ ...notifications, smsAlerts: v })} color="#34D399" />
            <ToggleField label="Push Notifications" description="In-app push notifications" value={notifications.pushNotifications} onChange={v => setNotifications({ ...notifications, pushNotifications: v })} color="#A78BFA" />
          </div>
          <div>
            <div className="text-xs font-semibold text-purple-300/50 uppercase tracking-wider mb-2.5">Events</div>
            <ToggleField label="New Guest Check-in" description="Alert when a new guest checks in" value={notifications.newGuestAlert} onChange={v => setNotifications({ ...notifications, newGuestAlert: v })} />
            <ToggleField label="Appointment Reminders" description="Reminders before upcoming appointments" value={notifications.appointmentReminder} onChange={v => setNotifications({ ...notifications, appointmentReminder: v })} />
            <ToggleField label="Daily Summary Report" description="End-of-day activity summary" value={notifications.dailyReport} onChange={v => setNotifications({ ...notifications, dailyReport: v })} color="#FBBF24" />
            <ToggleField label="Weekly Digest" description="Weekly performance overview" value={notifications.weeklyDigest} onChange={v => setNotifications({ ...notifications, weeklyDigest: v })} color="#FBBF24" />
            <ToggleField label="System Alerts" description="Critical system notifications" value={notifications.systemAlerts} onChange={v => setNotifications({ ...notifications, systemAlerts: v })} color="#EF4444" />
          </div>
        </div>
      );
    }

    if (activeSection === 'security') {
      return (
        <div>
          <SectionHeader title="Security Settings" subtitle="Manage authentication and access policies" />
          <ToggleField label="Two-Factor Authentication" description="Require 2FA for all user logins" value={security.twoFactor} onChange={v => setSecurity({ ...security, twoFactor: v })} color="#10B981" />
          <ToggleField label="Audit Logging" description="Log all user actions for compliance" value={security.auditLog} onChange={v => setSecurity({ ...security, auditLog: v })} color="#3B82F6" />
          <ToggleField label="IP Restriction" description="Restrict access to specific IP ranges" value={security.ipRestriction} onChange={v => setSecurity({ ...security, ipRestriction: v })} color="#EF4444" />
          <ToggleField label="Require Strong Passwords" description="Enforce password complexity rules" value={security.requireStrongPass} onChange={v => setSecurity({ ...security, requireStrongPass: v })} />
          <div className="mt-5 grid grid-cols-2 gap-x-6">
            <SelectField 
              label="Session Timeout (minutes)" 
              value={security.sessionTimeout} 
              onChange={v => setSecurity({ ...security, sessionTimeout: v })}
              options={['15', '30', '60', '120', '240'].map(v => ({ value: v, label: `${v} minutes` }))}
            />
            <SelectField 
              label="Max Login Attempts" 
              value={security.loginAttempts} 
              onChange={v => setSecurity({ ...security, loginAttempts: v })}
              options={['3', '5', '10'].map(v => ({ value: v, label: v }))}
            />
            <SelectField 
              label="Password Expiry (days)" 
              value={security.passwordExpiry} 
              onChange={v => setSecurity({ ...security, passwordExpiry: v })}
              options={['30', '60', '90', '180', 'never'].map(v => ({ value: v, label: v === 'never' ? 'Never' : `${v} days` }))}
            />
          </div>
        </div>
      );
    }

    if (activeSection === 'appearance') {
      return (
        <div>
          <SectionHeader title="Appearance" subtitle="Customize the look and feel of the interface" />
          <SelectField 
            label="Theme" 
            value={appearance.theme} 
            onChange={v => setAppearance({ ...appearance, theme: v })}
            options={[{ value: 'dark', label: 'Dark (Default)' }, { value: 'light', label: 'Light' }, { value: 'system', label: 'System' }]}
          />
          <div className="mb-5">
            <label className="block text-xs font-semibold text-purple-400/70 mb-2 uppercase tracking-wider">
              Accent Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#A78BFA', '#F97316'].map(color => (
                <button
                  key={color}
                  onClick={() => setAppearance({ ...appearance, accentColor: color })}
                  className="w-8 h-8 rounded-full border-2 border-transparent cursor-pointer transition-all duration-150 hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: appearance.accentColor === color ? 'white' : 'transparent',
                    transform: appearance.accentColor === color ? 'scale(1.2)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>
          <ToggleField label="Compact Mode" description="Reduce spacing for denser information display" value={appearance.compactMode} onChange={v => setAppearance({ ...appearance, compactMode: v })} color="#3B82F6" />
          <ToggleField label="Show User Avatars" description="Display avatar icons in lists and headers" value={appearance.showAvatars} onChange={v => setAppearance({ ...appearance, showAvatars: v })} />
          <ToggleField label="Enable Animations" description="Smooth transitions and micro-interactions" value={appearance.animationsEnabled} onChange={v => setAppearance({ ...appearance, animationsEnabled: v })} color="#10B981" />
        </div>
      );
    }

    if (activeSection === 'data') {
      return (
        <div>
          <SectionHeader title="Data & Storage" subtitle="Manage backups, exports, and data policies" />
          <ToggleField label="Automatic Backups" description="Automatically backup data at regular intervals" value={data.autoBackup} onChange={v => setData({ ...data, autoBackup: v })} color="#10B981" />
          <ToggleField label="Analytics Tracking" description="Collect usage analytics to improve performance" value={data.analyticsTracking} onChange={v => setData({ ...data, analyticsTracking: v })} color="#3B82F6" />
          <ToggleField label="Anonymize Guest Data" description="Anonymize guest records after checkout" value={data.guestDataAnonymize} onChange={v => setData({ ...data, guestDataAnonymize: v })} color="#EF4444" />
          <div className="mt-5 grid grid-cols-2 gap-x-6">
            <SelectField 
              label="Backup Frequency" 
              value={data.backupFrequency} 
              onChange={v => setData({ ...data, backupFrequency: v })}
              options={[{ value: 'hourly', label: 'Hourly' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]}
            />
            <SelectField 
              label="Data Retention (days)" 
              value={data.retentionPeriod} 
              onChange={v => setData({ ...data, retentionPeriod: v })}
              options={['30', '60', '90', '180', '365'].map(v => ({ value: v, label: `${v} days` }))}
            />
            <SelectField 
              label="Default Export Format" 
              value={data.exportFormat} 
              onChange={v => setData({ ...data, exportFormat: v })}
              options={['csv', 'xlsx', 'pdf', 'json'].map(v => ({ value: v, label: v.toUpperCase() }))}
            />
          </div>
        </div>
      );
    }

    if (activeSection === 'organization') {
      return (
        <div>
          <SectionHeader title="Organization" subtitle="Configure your organization's structure and branches" />
          <div className="p-5 bg-purple-500/8 border border-purple-500/15 rounded-xl mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center text-xl font-black text-white shrink-0">
                G
              </div>
              <div>
                <div className="text-base font-bold text-purple-100">CorpGMS Inc.</div>
                <div className="text-xs text-purple-300/50">Enterprise Plan · 28 users</div>
              </div>
            </div>
          </div>
          <InputField label="Organization Name" value={general.orgName} onChange={v => setGeneral({ ...general, orgName: v })} />
          <InputField label="Primary Email" value={general.email} onChange={v => setGeneral({ ...general, email: v })} type="email" />
          <InputField label="Contact Number" value={general.phone} onChange={v => setGeneral({ ...general, phone: v })} />
          <InputField label="Headquarters Address" value={general.address} onChange={v => setGeneral({ ...general, address: v })} />
          <div className="mt-2 p-3.5 bg-blue-500/8 border border-blue-500/15 rounded-lg">
            <div className="text-xs text-blue-400 font-semibold mb-1">Branch Offices</div>
            <div className="text-xs text-purple-300/50">Manage branch offices from the Offices page.</div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900/50 to-slate-900 text-purple-100 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-600 to-teal-400 flex items-center justify-center shrink-0">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-purple-100 mb-0.5">Settings</h1>
              <p className="text-xs text-purple-300/60">Configure your system preferences and organization settings</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4.5 py-2.25 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 border-2 shadow-sm ${
              saved
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-gradient-to-r from-purple-600/40 to-purple-500/30 border-purple-500/40 text-purple-200 hover:from-purple-600/50 hover:to-purple-500/40 hover:shadow-purple-500/25'
            }`}
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-[220px_1fr] gap-5 items-start">
          {/* Sidebar */}
          <div className="bg-white/5 backdrop-blur-sm border border-purple-500/10 rounded-xl overflow-hidden p-2">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg mb-0.5 text-left transition-all duration-150 group hover:bg-purple-500/12 ${
                    active
                      ? 'bg-purple-500/20 border border-purple-500/30 text-purple-200 font-medium shadow-sm'
                      : 'text-purple-400/60 hover:border hover:border-purple-500/20'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-purple-300' : 'text-purple-400/70 group-hover:text-purple-300'} />
                  <span className="text-sm">{section.label}</span>
                  {active && <ChevronRight size={13} className="ml-auto text-purple-400" />}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="bg-white/5 backdrop-blur-sm border border-purple-500/10 rounded-xl p-6 min-h-[500px]">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}