import React, { useState } from 'react';
import { MOCK_ROOMS } from '../../data/mockData';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  available:          { label: 'Available',         dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  occupied:           { label: 'Occupied',          dot: 'bg-red-500',     badge: 'bg-red-50 text-red-600 border-red-200' },
  reserved:           { label: 'Reserved',          dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  'under-maintenance':{ label: 'Under Maintenance', dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const FILTERS = ['all', 'available', 'occupied', 'reserved', 'under-maintenance'];

// ─── Badge ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Room card ────────────────────────────────────────────────────────────────
function RoomCard({ room }) {
  return (
    <div className="flex flex-col rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[14px] font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">{room.name}</p>
          <p className="text-[12px] text-slate-400 mt-0.5">{room.type} · Floor {room.floor}</p>
        </div>
        <StatusBadge status={room.status} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
          👤 Capacity: {room.capacity}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
          📍 {room.office}
        </span>
      </div>

      {room.amenities?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {room.amenities.map(a => (
            <span key={a} className="rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
              {a}
            </span>
          ))}
        </div>
      )}

      {room.currentBooking && (
        <div className="mb-3 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-700">
          👤 {room.currentBooking}
        </div>
      )}

      <div className="mt-auto flex gap-2 pt-3 border-t border-slate-100">
        <button
          className="flex-1 cursor-pointer rounded-[8px] border border-slate-200 bg-white py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
          title="View room details"
        >
          View
        </button>
        <button
          className="flex-1 cursor-pointer rounded-[8px] border border-violet-700 bg-violet-700 py-1.5 text-[12px] font-bold text-white transition hover:bg-violet-800"
          title="Book this room"
        >
          Book
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Rooms() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = MOCK_ROOMS.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.office.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = [
    { label: 'Total Rooms',   val: MOCK_ROOMS.length,                                    color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
    { label: 'Available',     val: MOCK_ROOMS.filter(r => r.status === 'available').length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Occupied',      val: MOCK_ROOMS.filter(r => r.status === 'occupied').length,  color: 'text-red-600',    bg: 'bg-red-50 border-red-100' },
    { label: 'Reserved',      val: MOCK_ROOMS.filter(r => r.status === 'reserved').length,  color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-extrabold text-[#1E1B4B] font-['Outfit',sans-serif]">Venues &amp; Rooms</h2>
            <p className="text-[13px] text-slate-400 mt-0.5">
              {MOCK_ROOMS.filter(r => r.status === 'available').length} available of {MOCK_ROOMS.length} total
            </p>
          </div>
          <button className="cursor-pointer rounded-[10px] border border-violet-700 bg-violet-700 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-violet-800">
            + Add Room
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className={`rounded-[14px] border ${s.bg} bg-white p-4 shadow-sm`}>
              <p className={`text-[28px] font-black ${s.color} font-['Outfit',sans-serif]`}>{s.val}</p>
              <p className="text-[12px] font-semibold text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rooms or office…"
              className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-[13px] text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 transition text-[15px]" title="Clear search">✕</button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
                  filter === f
                    ? 'border-violet-700 bg-violet-700 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(r => <RoomCard key={r.id} room={r} />)}
          </div>
        ) : (
          <div className="rounded-[14px] border border-slate-200 bg-white py-16 text-center text-[14px] text-slate-400 shadow-sm">
            No rooms found.
          </div>
        )}
      </div>
    </div>
  );
}