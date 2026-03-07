import { useState, useEffect, useRef, useCallback } from "react";
import { useFormContext } from '@/context/FormContext';
import { getFormSettings, getBookedSlots, holdSlot, releaseSlot, releaseSlotKeepalive } from '@/lib/supabase';

const TimeCard: React.FC = () => {
    const { formData, updateFormData } = useFormContext();
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [maxPerSlot, setMaxPerSlot] = useState<number>(1);
    const [bookedCounts, setBookedCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [holdingSlot, setHoldingSlot] = useState<string | null>(null); // time being held
    const holdIdRef = useRef<string | null>(null);
    const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [holdCountdown, setHoldCountdown] = useState<number>(0); // seconds remaining
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Clean up orphaned holds from previous reloads
    useEffect(() => {
        const orphanedHoldId = sessionStorage.getItem('gkk_slot_hold_id');
        if (orphanedHoldId) {
            releaseSlot(orphanedHoldId).then(() => {
                sessionStorage.removeItem('gkk_slot_hold_id');
                // Just in case it actually freed up a space we were looking at
                if (formData.interview_date) {
                    refreshBookedSlots();
                }
            });
        }
    }, []);

    // Load admin time slots + max capacity on mount
    useEffect(() => {
        async function loadTimeSlots() {
            const { data } = await getFormSettings();
            setSettings(data);
            if (data?.time_slots && data.time_slots.length > 0) {
                setTimeSlots(data.time_slots.sort());
            } else {
                setTimeSlots([]);
            }
            setMaxPerSlot(data?.max_per_slot || 1);
            setLoading(false);
        }
        loadTimeSlots();
    }, []);

    const formatTime12 = (time24: string): string => {
        const [hourStr, minStr] = time24.split(':');
        const hour = parseInt(hourStr);
        const suffix = hour >= 12 ? 'PM' : 'AM';
        const h = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${h}:${minStr} ${suffix}`;
    };

    // Fetch booked slots for the selected date
    const refreshBookedSlots = useCallback(async () => {
        if (!formData.interview_date) return;
        const counts = await getBookedSlots(formData.interview_date);
        setBookedCounts(counts);
    }, [formData.interview_date]);

    // Fetch booked slots + start polling when date changes
    useEffect(() => {
        if (!formData.interview_date) {
            setBookedCounts({});
            return;
        }

        // Dynamically update time slots based on the selected date
        if (settings) {
            const dateObj = new Date(formData.interview_date);
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            if (settings.specific_date_times && settings.specific_date_times[dateKey]) {
                setTimeSlots(settings.specific_date_times[dateKey].sort());
            } else {
                setTimeSlots(settings.time_slots ? settings.time_slots.sort() : []);
            }
        }

        async function fetchInitial() {
            setLoadingSlots(true);
            await refreshBookedSlots();
            setLoadingSlots(false);
        }
        fetchInitial();

        // Start polling for updates (every 5 seconds) instead of using WebSockets
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(() => {
            refreshBookedSlots();
        }, 5000);

        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        };
    }, [formData.interview_date, refreshBookedSlots]);

    // Clean up hold on unmount or date change
    useEffect(() => {
        return () => {
            if (holdIdRef.current) {
                releaseSlot(holdIdRef.current);
                holdIdRef.current = null;
            }
            if (holdTimerRef.current) {
                clearInterval(holdTimerRef.current);
                holdTimerRef.current = null;
            }
        };
    }, [formData.interview_date]);

    // Release hold on page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (holdIdRef.current) {
                // Guaranteed completion even if tab closes to prevent ghost slots
                releaseSlotKeepalive(holdIdRef.current);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        // Fallback for Safari/iOS back button cache
        window.addEventListener('pagehide', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
        };
    }, []);

    const startHoldTimer = () => {
        setHoldCountdown(300); // 5 minutes = 300 seconds
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        holdTimerRef.current = setInterval(() => {
            setHoldCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(holdTimerRef.current!);
                    holdTimerRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Handle Local Hold Expiration
    useEffect(() => {
        if (holdCountdown === 0 && holdingSlot && holdIdRef.current) {
            // Timer expired locally, clean up state
            holdIdRef.current = null;
            setHoldingSlot(null);
            updateFormData({ interview_time: '', slot_hold_id: '' });
            refreshBookedSlots();
        }
    }, [holdCountdown, holdingSlot, updateFormData, refreshBookedSlots]);

    const handleTimeSelect = async (time: string) => {
        const formatted = formatTime12(time);
        const bookedCount = bookedCounts[formatted] || 0;

        // Don't allow selecting a full slot
        if (bookedCount >= maxPerSlot) return;

        // If clicking the same slot, deselect and release hold
        if (formData.interview_time === formatted) {
            if (holdIdRef.current) {
                await releaseSlot(holdIdRef.current);
                sessionStorage.removeItem('gkk_slot_hold_id');
                holdIdRef.current = null;
            }
            if (holdTimerRef.current) {
                clearInterval(holdTimerRef.current);
                holdTimerRef.current = null;
            }
            setHoldingSlot(null);
            setHoldCountdown(0);
            updateFormData({ interview_time: '', slot_hold_id: '' });
            refreshBookedSlots();
            return;
        }

        // Release previous hold if any
        if (holdIdRef.current) {
            await releaseSlot(holdIdRef.current);
            sessionStorage.removeItem('gkk_slot_hold_id');
            holdIdRef.current = null;
        }
        if (holdTimerRef.current) {
            clearInterval(holdTimerRef.current);
            holdTimerRef.current = null;
        }

        // Attempt to hold the new slot
        setHoldingSlot(formatted);
        const result = await holdSlot(
            formData.interview_date!,
            formatted,
            formData.email || 'anonymous',
            maxPerSlot
        );

        if (result.success && result.holdId) {
            holdIdRef.current = result.holdId;
            sessionStorage.setItem('gkk_slot_hold_id', result.holdId);
            updateFormData({ interview_time: formatted, slot_hold_id: result.holdId });
            startHoldTimer();
            refreshBookedSlots();
        } else {
            setHoldingSlot(null);
            // Slot was taken — refresh to show updated state
            refreshBookedSlots();
            // Could show error to user here
        }
    };

    const formatCountdown = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="w-full h-full bento-card border border-border p-8 rounded-xl shadow-sm">
                <div className="flex items-center justify-center h-48">
                    <span className="material-symbols-outlined animate-spin text-3xl text-text-secondary">autorenew</span>
                </div>
            </div>
        );
    }

    if (!formData.interview_date) {
        return (
            <div className="w-full h-full bento-card glass-hub border border-border p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3 opacity-60">
                <span className="material-symbols-outlined text-4xl text-text-muted">calendar_today</span>
                <p className="text-sm text-text-secondary font-medium">Please select a date first</p>
            </div>
        );
    }

    const availableCount = timeSlots.filter(time => {
        const formatted = formatTime12(time);
        return (bookedCounts[formatted] || 0) < maxPerSlot;
    }).length;

    const handleClear = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (holdIdRef.current) {
            await releaseSlot(holdIdRef.current);
            sessionStorage.removeItem('gkk_slot_hold_id');
            holdIdRef.current = null;
        }
        if (holdTimerRef.current) {
            clearInterval(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        setHoldingSlot(null);
        setHoldCountdown(0);
        updateFormData({ interview_time: '', slot_hold_id: '' });
        refreshBookedSlots();
    };

    return (
        <div className="w-full h-full bento-card glass-hub border border-border p-6 lg:p-7 rounded-xl shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-[#10b981]/50 flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        Select Slot
                    </h3>
                    <p className="text-text-secondary text-xs">
                        {availableCount > 0
                            ? `${availableCount} of ${timeSlots.length} slots available`
                            : 'All slots are full for this date'}
                    </p>
                </div>
                {formData.interview_time && (
                    <button
                        onClick={handleClear}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium px-2 py-1 bg-red-400/10 hover:bg-red-400/20 rounded-lg flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Clear
                    </button>
                )}
            </div>

            {/* Hold countdown timer */}
            {holdCountdown > 0 && formData.interview_time && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-slideUp">
                    <span className="material-symbols-outlined text-amber-400 text-[16px]">timer</span>
                    <span className="text-[11px] text-amber-300 font-semibold">
                        Slot held for {formatCountdown(holdCountdown)}
                    </span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[300px]">
                {loadingSlots ? (
                    <div className="flex items-center justify-center h-full py-8">
                        <span className="material-symbols-outlined animate-spin text-2xl text-text-secondary">autorenew</span>
                    </div>
                ) : timeSlots.length > 0 ? (
                    availableCount > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                            {timeSlots.map((time) => {
                                const formatted = formatTime12(time);
                                const isSelected = formData.interview_time === formatted;
                                const bookedCount = bookedCounts[formatted] || 0;
                                const isFull = bookedCount >= maxPerSlot;
                                const remaining = maxPerSlot - bookedCount;
                                const isHolding = holdingSlot === formatted && !holdIdRef.current;

                                return (
                                    <button
                                        key={time}
                                        onClick={() => handleTimeSelect(time)}
                                        disabled={(isFull && !isSelected) || isHolding}
                                        className={`
                                            py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border-2 relative
                                            ${isSelected
                                                ? "bg-primary border-primary text-text-primary shadow-md shadow-primary/20 z-10"
                                                : isFull
                                                    ? "bg-red-500/5 border-red-500/20 text-red-400/60 cursor-not-allowed opacity-60"
                                                    : "bg-background-card/30 border-border/40 text-text-secondary hover:border-primary/50 hover:text-primary"
                                            }
                                            ${isHolding ? "animate-pulse" : ""}
                                        `}
                                    >
                                        <span className="flex items-center gap-1">
                                            {isFull && !isSelected && <span className="material-symbols-outlined text-[12px]">lock</span>}
                                            {isHolding && <span className="material-symbols-outlined animate-spin text-[12px]">autorenew</span>}
                                            {formatted}
                                        </span>
                                        {isSelected ? (
                                            <span className="text-[9px] font-bold text-text-primary mt-0.5">Selected</span>
                                        ) : isFull ? (
                                            <span className="text-[9px] font-semibold text-red-400/80 mt-0.5">Slot Full</span>
                                        ) : maxPerSlot > 1 ? (
                                            <span className="text-[9px] font-medium text-text-muted mt-0.5">{remaining} left</span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-400 text-2xl">event_busy</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-red-400">All Slots Full</p>
                                <p className="text-[11px] text-text-muted mt-1">Please select a different date</p>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-3xl">event_busy</span>
                        <p className="text-xs text-text-secondary">No slots available for this date.</p>
                    </div>
                )}
            </div>

            {formData.interview_time && (
                <div className="pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2 text-[10px] text-text-primary font-medium animate-slideUp">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span>Selected: {formData.interview_time}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeCard;
