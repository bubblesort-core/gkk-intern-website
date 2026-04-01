import { useState, useEffect, useCallback} from 'react';
import { useFormContext } from '@/context/FormContext';
import { getFormSettings, getBookedSlots, holdSlot, releaseSlot, releaseSlotKeepalive, type FormSettings } from '@/lib/supabase';
import { useRef } from 'react';
import Swal from 'sweetalert2';

const StepSchedule: React.FC = () => {
    const { formData, updateFormData } = useFormContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [settings, setSettings] = useState<FormSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<number | null>(
        formData.interview_date ? parseInt(formData.interview_date.split(' ')[1]) : null
    );
    const [selectedMonth, setSelectedMonth] = useState<number | null>(
        formData.interview_date ? new Date(formData.interview_date).getMonth() : null
    );
    const [error, setError] = useState<string | null>(null);
    const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set());
    const [checkingBookings, setCheckingBookings] = useState(false);

    // Time slot state
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [maxPerSlot, setMaxPerSlot] = useState(1);
    const [bookedCounts, setBookedCounts] = useState<Record<string, number>>({});
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [holdingSlot, setHoldingSlot] = useState<string | null>(null);
    const holdIdRef = useRef<string | null>(null);
    const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [holdCountdown, setHoldCountdown] = useState(0);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isHoldingInProgress, setIsHoldingInProgress] = useState(false);
    const prevDateRef = useRef<string | undefined>(formData.interview_date);

    // Clean up orphaned holds
    useEffect(() => {
        const orphanedHoldId = sessionStorage.getItem('gkk_slot_hold_id');
        if (orphanedHoldId) {
            releaseSlot(orphanedHoldId).then(() => {
                sessionStorage.removeItem('gkk_slot_hold_id');
                if (formData.interview_date) refreshBookedSlots();
            });
        }
    }, []);

    // Load settings
    useEffect(() => {
        async function load() {
            const { data, error: fetchErr } = await getFormSettings();
            if (fetchErr) setError('Technical error loading schedule.');
            setSettings(data);
            if (data?.time_slots) setTimeSlots(data.time_slots.sort());
            setMaxPerSlot(data?.max_per_slot || 1);
            setLoading(false);
        }
        load();
    }, []);

    const availableDays = settings?.available_days || [0, 1, 6];
    const availableDates = settings?.available_dates || [];

    const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    const isDateAvailable = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        if (checkDate < now) return false;
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (availableDates.length > 0) return availableDates.includes(dateStr);
        return availableDays.includes(checkDate.getDay());
    };

    const formatDateDisplay = (day: number) => {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    // Check fully booked dates
    useEffect(() => {
        if (!settings || !settings.time_slots?.length) return;
        async function check() {
            setCheckingBookings(true);
            const booked = new Set<string>();
            const available: { day: number; str: string }[] = [];
            for (let d = 1; d <= daysInMonth; d++) {
                if (isDateAvailable(d)) available.push({ day: d, str: formatDateDisplay(d) });
            }
            const promises = available.map(async ({ day, str }) => {
                const checkDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dateKey = `${checkDateObj.getFullYear()}-${String(checkDateObj.getMonth() + 1).padStart(2, '0')}-${String(checkDateObj.getDate()).padStart(2, '0')}`;
                const slotsForDate = settings?.specific_date_times?.[dateKey] || settings!.time_slots;
                if (!slotsForDate.length) return;
                const counts = await getBookedSlots(str);
                const allFull = slotsForDate.every((time24: string) => {
                    const [h, m] = time24.split(':');
                    const hour = parseInt(h);
                    const suffix = hour >= 12 ? 'PM' : 'AM';
                    const hh = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                    const formatted = `${hh}:${m} ${suffix}`;
                    const slotDate = new Date(checkDateObj);
                    slotDate.setHours(parseInt(h), parseInt(m), 0, 0);
                    const within12 = (slotDate.getTime() - Date.now()) / (1000 * 60 * 60) < 12;
                    return (counts[formatted] || 0) >= maxPerSlot || within12;
                });
                if (allFull) booked.add(str);
            });
            await Promise.all(promises);
            setFullyBookedDates(booked);
            setCheckingBookings(false);
        }
        check();
    }, [settings, currentDate.getMonth(), currentDate.getFullYear(), daysInMonth]);

    const handleDateSelect = (day: number) => {
        const displayStr = formatDateDisplay(day);
        if (fullyBookedDates.has(displayStr)) return;
        setSelectedDate(day);
        setSelectedMonth(currentDate.getMonth());
        updateFormData({ interview_date: displayStr, interview_time: '', interview_time_alternate: '' });
    };

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // ===== TIME SLOT LOGIC =====
    const formatTime12 = (t: string) => {
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const suffix = hour >= 12 ? 'PM' : 'AM';
        const hh = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${hh}:${m} ${suffix}`;
    };

    const isSlotWithin12Hours = (t: string): boolean => {
        if (!formData.interview_date) return false;
        const slotDate = new Date(formData.interview_date);
        const [h, m] = t.split(':');
        slotDate.setHours(parseInt(h), parseInt(m), 0, 0);
        return (slotDate.getTime() - Date.now()) / (1000 * 60 * 60) < 12;
    };

    const refreshBookedSlots = useCallback(async () => {
        if (!formData.interview_date) return;
        const counts = await getBookedSlots(formData.interview_date);
        setBookedCounts(counts);
    }, [formData.interview_date]);

    // Release hold on date change
    useEffect(() => {
        const prev = prevDateRef.current;
        prevDateRef.current = formData.interview_date;
        if (prev && prev !== formData.interview_date && holdIdRef.current) {
            releaseSlot(holdIdRef.current);
            sessionStorage.removeItem('gkk_slot_hold_id');
            holdIdRef.current = null;
            setHoldingSlot(null);
            setHoldCountdown(0);
            if (holdTimerRef.current) { clearInterval(holdTimerRef.current); holdTimerRef.current = null; }
        }
    }, [formData.interview_date]);

    // Fetch slots + poll
    useEffect(() => {
        if (!formData.interview_date) { setBookedCounts({}); return; }
        if (settings) {
            const dateObj = new Date(formData.interview_date);
            const dk = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            setTimeSlots((settings.specific_date_times?.[dk] || settings.time_slots || []).sort());
        }
        async function init() { setLoadingSlots(true); await refreshBookedSlots(); setLoadingSlots(false); }
        init();
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(refreshBookedSlots, 5000);
        return () => { if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; } };
    }, [formData.interview_date, refreshBookedSlots, settings]);

    // Cleanup hold on unmount
    useEffect(() => {
        return () => {
            if (holdIdRef.current) releaseSlot(holdIdRef.current);
            if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        };
    }, [formData.interview_date]);

    // Keepalive release on unload
    useEffect(() => {
        const handler = () => { if (holdIdRef.current) releaseSlotKeepalive(holdIdRef.current); };
        window.addEventListener('beforeunload', handler);
        window.addEventListener('pagehide', handler);
        return () => { window.removeEventListener('beforeunload', handler); window.removeEventListener('pagehide', handler); };
    }, []);

    const startHoldTimer = (heldUntil?: string) => {
        let sec = 300;
        if (heldUntil) sec = Math.max(0, Math.floor((new Date(heldUntil).getTime() - Date.now()) / 1000));
        setHoldCountdown(sec);
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        holdTimerRef.current = setInterval(() => {
            setHoldCountdown(p => { if (p <= 1) { clearInterval(holdTimerRef.current!); return 0; } return p - 1; });
        }, 1000);
    };

    useEffect(() => {
        if (holdCountdown === 0 && holdingSlot && holdIdRef.current) {
            holdIdRef.current = null;
            setHoldingSlot(null);
            updateFormData({ interview_time: '', slot_hold_id: '' });
            refreshBookedSlots();
        }
    }, [holdCountdown, holdingSlot]);

    const handleTimeSelect = async (time: string) => {
        const fmt = formatTime12(time);
        if (isHoldingInProgress) return;
        if ((bookedCounts[fmt] || 0) >= maxPerSlot) return;
        if (formData.interview_time === fmt) {
            if (holdIdRef.current) { await releaseSlot(holdIdRef.current); sessionStorage.removeItem('gkk_slot_hold_id'); holdIdRef.current = null; }
            if (holdTimerRef.current) { clearInterval(holdTimerRef.current); holdTimerRef.current = null; }
            setHoldingSlot(null); setHoldCountdown(0);
            updateFormData({ interview_time: '', slot_hold_id: '' });
            refreshBookedSlots();
            return;
        }
        if (holdIdRef.current) { await releaseSlot(holdIdRef.current); sessionStorage.removeItem('gkk_slot_hold_id'); holdIdRef.current = null; }
        if (holdTimerRef.current) { clearInterval(holdTimerRef.current); holdTimerRef.current = null; }
        setIsHoldingInProgress(true);
        setHoldingSlot(fmt);
        const result = await holdSlot(formData.interview_date!, fmt, formData.email || 'anonymous', maxPerSlot);
        setIsHoldingInProgress(false);
        if (result.success && result.holdId) {
            holdIdRef.current = result.holdId;
            sessionStorage.setItem('gkk_slot_hold_id', result.holdId);
            updateFormData({ interview_time: fmt, slot_hold_id: result.holdId });
            startHoldTimer(result.heldUntil);
            refreshBookedSlots();
        } else {
            setHoldingSlot(null);
            refreshBookedSlots();
            Swal.fire({ icon: 'warning', title: 'Slot Unavailable', text: result.error || 'Slot taken.', confirmButtonColor: '#f59e0b', background: '#13131a', color: '#f0efe9', timer: 4000, timerProgressBar: true });
        }
    };

    const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const availableSlotCount = timeSlots.filter(t => {
        const f = formatTime12(t);
        return (bookedCounts[f] || 0) < maxPerSlot && !isSlotWithin12Hours(t);
    }).length;

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="step-enter flex flex-col gap-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                    Pick a Date & Time
                </h2>
                <p className="text-text-secondary text-sm mt-1">Choose an available interview slot</p>
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-200">{error}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => {
                            const nd = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                            const now = new Date();
                            if (nd.getMonth() < now.getMonth() && nd.getFullYear() === now.getFullYear()) return;
                            setCurrentDate(nd);
                        }} className="text-text-muted hover:text-text-primary p-1"><span className="material-symbols-outlined text-lg">arrow_back_ios</span></button>
                        <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                            {monthName}
                            {checkingBookings && <span className="material-symbols-outlined animate-spin text-xs text-text-muted">autorenew</span>}
                        </h4>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="text-text-muted hover:text-text-primary p-1"><span className="material-symbols-outlined text-lg">arrow_forward_ios</span></button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {weekDays.map(d => <div key={d} className="text-center text-[10px] font-bold text-text-muted py-1">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                            const avail = day ? isDateAvailable(day) : false;
                            const isSel = day === selectedDate && currentDate.getMonth() === selectedMonth;
                            const dispStr = day ? formatDateDisplay(day) : '';
                            const isFullBooked = avail && fullyBookedDates.has(dispStr);
                            return (
                                <button key={i} disabled={!day || !avail || isFullBooked} onClick={() => day && handleDateSelect(day)}
                                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                                        ${!day ? 'invisible' : ''}
                                        ${isFullBooked ? 'bg-red-50 border border-red-200 text-red-400/60 cursor-not-allowed'
                                            : avail ? isSel ? 'bg-primary text-white shadow-md font-bold scale-105'
                                                : 'bg-primary/5 border border-primary/20 text-text-primary hover:bg-primary/15 cursor-pointer'
                                            : 'text-text-muted/30 cursor-not-allowed'}
                                    `}>
                                    <span>{day}</span>
                                    {isFullBooked && <span className="text-[6px] font-bold text-red-400/70">FULL</span>}
                                </button>
                            );
                        })}
                    </div>
                    {formData.interview_date && (
                        <div className="mt-3 bg-primary/5 rounded-lg p-2 border border-primary/20 animate-slideUp">
                            <p className="text-xs text-text-primary flex items-center gap-1.5 font-medium">
                                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                                {formData.interview_date}
                            </p>
                        </div>
                    )}
                </div>

                {/* Time Slots */}
                <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                            Select Time
                        </h4>
                        {formData.interview_time && (
                            <button onClick={async (e) => {
                                e.stopPropagation();
                                if (holdIdRef.current) { await releaseSlot(holdIdRef.current); sessionStorage.removeItem('gkk_slot_hold_id'); holdIdRef.current = null; }
                                if (holdTimerRef.current) { clearInterval(holdTimerRef.current); holdTimerRef.current = null; }
                                setHoldingSlot(null); setHoldCountdown(0);
                                updateFormData({ interview_time: '', slot_hold_id: '' });
                                refreshBookedSlots();
                            }} className="text-xs text-red-400 hover:text-red-500 font-medium">Clear</button>
                        )}
                    </div>

                    {holdCountdown > 0 && formData.interview_time && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 mb-3 animate-slideUp">
                            <span className="material-symbols-outlined text-amber-500 text-sm">timer</span>
                            <span className="text-xs text-amber-600 font-semibold">Held for {fmtCountdown(holdCountdown)}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 mb-3">
                        <span className="material-symbols-outlined text-blue-500 text-xs">info</span>
                        <span className="text-[10px] text-blue-600 font-medium">Slots must be booked 12+ hours in advance</span>
                    </div>

                    {!formData.interview_date ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8 opacity-50">
                            <span className="material-symbols-outlined text-3xl text-text-muted">calendar_today</span>
                            <p className="text-sm text-text-muted font-medium">Select a date first</p>
                        </div>
                    ) : loadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : timeSlots.length > 0 && availableSlotCount > 0 ? (
                        <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto max-h-64 custom-scrollbar">
                            {timeSlots.map(time => {
                                const fmt = formatTime12(time);
                                const isSel = formData.interview_time === fmt;
                                const cnt = bookedCounts[fmt] || 0;
                                const full = cnt >= maxPerSlot;
                                const expired = isSlotWithin12Hours(time);
                                const rem = maxPerSlot - cnt;
                                const holding = (holdingSlot === fmt && !holdIdRef.current) || (isHoldingInProgress && holdingSlot === fmt);
                                return (
                                    <button key={time} onClick={() => handleTimeSelect(time)} disabled={(full && !isSel) || expired || holding}
                                        className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center border-2
                                            ${isSel ? 'bg-primary border-primary text-white shadow-md'
                                                : expired ? 'bg-orange-50 border-orange-200 text-orange-400/60 cursor-not-allowed'
                                                    : full ? 'bg-red-50 border-red-200 text-red-400/60 cursor-not-allowed'
                                                        : 'bg-bg-input border-border text-text-secondary hover:border-primary/50 hover:text-primary'}
                                            ${holding ? 'animate-pulse' : ''}
                                        `}>
                                        <span className="flex items-center gap-1">
                                            {holding && <span className="material-symbols-outlined animate-spin text-xs">autorenew</span>}
                                            {fmt}
                                        </span>
                                        {isSel ? <span className="text-[9px] mt-0.5">Selected</span>
                                            : expired ? <span className="text-[9px] mt-0.5">Closed</span>
                                                : full ? <span className="text-[9px] mt-0.5">Full</span>
                                                    : maxPerSlot > 1 ? <span className="text-[9px] text-text-muted mt-0.5">{rem} left</span> : null}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
                            <span className="material-symbols-outlined text-3xl text-red-400">event_busy</span>
                            <p className="text-sm font-semibold text-red-500">All Slots Full</p>
                            <p className="text-xs text-text-muted">Please select a different date</p>
                        </div>
                    )}

                    {formData.interview_time && (
                        <div className="mt-3 pt-2 border-t border-border/50">
                            <p className="text-xs text-text-primary font-medium flex items-center gap-1.5 animate-slideUp">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                Selected: {formData.interview_time}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StepSchedule;
