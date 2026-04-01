import { useState, useEffect } from "react";
import { useFormContext } from '@/context/FormContext';
import { getFormSettings, getBookedSlots, type FormSettings } from '@/lib/supabase';

const CalendarCard: React.FC = () => {
    const { formData, updateFormData } = useFormContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [settings, setSettings] = useState<FormSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Parse existing selection if any
    const [selectedDate, setSelectedDate] = useState<number | null>(
        formData.interview_date ? parseInt(formData.interview_date.split(' ')[1]) : null
    );
    const [selectedMonth, setSelectedMonth] = useState<number | null>(
        formData.interview_date ? new Date(formData.interview_date).getMonth() : null
    );

    const [error, setError] = useState<string | null>(null);

    // Track fully-booked dates: Set of date strings like "March 5, 2026"
    const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set());
    const [checkingBookings, setCheckingBookings] = useState(false);

    // Fetch settings on mount
    useEffect(() => {
        async function loadSettings() {
            const { data, error: fetchError } = await getFormSettings();
            if (fetchError) {
                const msg = fetchError.message || JSON.stringify(fetchError);
                setError(`System Error: ${msg}`);
            } else if (!data) {
                setError("Note: No settings data found. Using system defaults.");
            }
            setSettings(data);
            setLoading(false);
        }
        loadSettings();
    }, []);

    // Default values if settings not loaded
    const availableDays = settings?.available_days || [0, 1, 6];
    const availableDates = settings?.available_dates || [];
    const totalSlots = settings?.time_slots?.length || 0;
    const maxPerSlot = settings?.max_per_slot || 1;

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const isDateAvailable = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Disable past dates
        if (checkDate < now) return false;

        // Format date string for comparison
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // If admin has selected specific dates, ONLY those dates are available
        if (availableDates.length > 0) {
            return availableDates.includes(dateStr);
        }

        // No specific dates selected - use recurring available days
        const dayOfWeek = checkDate.getDay();
        return availableDays.includes(dayOfWeek);
    };

    // Format a day number into the display string used in form data (e.g. "March 5, 2026")
    const formatDateDisplay = (day: number): string => {
        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return dateObj.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Check which dates are fully booked when settings load or month changes
    useEffect(() => {
        if (!settings || totalSlots === 0) return;

        async function checkFullyBooked() {
            setCheckingBookings(true);
            const fullyBooked = new Set<string>();

            // Gather all available dates in current month view
            const availableDatesInMonth: { day: number; displayStr: string }[] = [];
            for (let day = 1; day <= daysInMonth; day++) {
                if (isDateAvailable(day)) {
                    availableDatesInMonth.push({
                        day,
                        displayStr: formatDateDisplay(day)
                    });
                }
            }

            // Fetch booking counts for each available date
            // (batch fetch for performance — check each date)
            const promises = availableDatesInMonth.map(async ({ displayStr }) => {
                const checkDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), availableDatesInMonth.find(d => d.displayStr === displayStr)!.day);
                const dateKey = `${checkDateObj.getFullYear()}-${String(checkDateObj.getMonth() + 1).padStart(2, '0')}-${String(checkDateObj.getDate()).padStart(2, '0')}`;

                const timeSlotsForDate = settings?.specific_date_times?.[dateKey] || settings!.time_slots;

                if (timeSlotsForDate.length === 0) {
                    return; // No slots, so not bookable at all. Or maybe consider it "fully booked". Let's say it's fully booked.
                }

                const counts = await getBookedSlots(displayStr);
                // A date is fully booked if EVERY time slot is either full OR within 12 hours
                const allFull = timeSlotsForDate.every((time24: string) => {
                    const [hourStr, minStr] = time24.split(':');
                    const hour = parseInt(hourStr);
                    const suffix = hour >= 12 ? 'PM' : 'AM';
                    const h = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                    const formatted = `${h}:${minStr} ${suffix}`;

                    // Check if this slot is within 12 hours
                    const slotDate = new Date(checkDateObj);
                    slotDate.setHours(parseInt(hourStr), parseInt(minStr), 0, 0);
                    const diffMs = slotDate.getTime() - Date.now();
                    const isWithin12Hours = diffMs / (1000 * 60 * 60) < 12;

                    return (counts[formatted] || 0) >= maxPerSlot || isWithin12Hours;
                });
                if (allFull && timeSlotsForDate.length > 0) {
                    fullyBooked.add(displayStr);
                }
            });

            await Promise.all(promises);
            setFullyBookedDates(fullyBooked);
            setCheckingBookings(false);
        }

        checkFullyBooked();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings, currentDate.getMonth(), currentDate.getFullYear(), daysInMonth]);

    const handleDateSelect = (day: number) => {
        const displayStr = formatDateDisplay(day);

        // Don't allow selecting a fully-booked date
        if (fullyBookedDates.has(displayStr)) return;

        setSelectedDate(day);
        setSelectedMonth(currentDate.getMonth());

        // Clear time slots when date changes to force re-selection
        updateFormData({
            interview_date: displayStr,
            interview_time: '',
            interview_time_alternate: ''
        });
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const now = new Date();
        if (newDate.getMonth() < now.getMonth() && newDate.getFullYear() === now.getFullYear()) return;
        setCurrentDate(newDate);
    };

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateFormData({
            interview_date: '',
            interview_time: '',
            interview_time_alternate: '',
            slot_hold_id: ''
        });
        setSelectedDate(null);
        setSelectedMonth(null);
    };

    if (loading) {
        return (
            <div className="w-full h-full apply-card border border-border p-8 rounded-xl shadow-sm">
                <div className="flex items-center justify-center h-48">
                    <span className="material-symbols-outlined animate-spin text-3xl text-text-secondary">autorenew</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full h-full apply-card glass-hub border border-border p-6 lg:p-7 rounded-xl shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-[#10b981]/50 focus-within:border-[#10b981] flex flex-col gap-4"
            onMouseEnter={() => updateFormData({ mascot_emotion: 'thinking' })}
            onMouseLeave={() => updateFormData({ mascot_emotion: 'neutral' })}
            onFocus={() => updateFormData({ mascot_emotion: 'thinking' })}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    updateFormData({ mascot_emotion: 'neutral' });
                }
            }}
            tabIndex={0}
        >
            <div className="flex flex-col gap-4 h-full">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">event_available</span>
                                Interview Date
                            </h3>
                        </div>
                    </div>
                    {formData.interview_date && (
                        <button
                            onClick={handleClear}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium px-2 py-1 bg-red-400/10 hover:bg-red-400/20 rounded-lg flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            Clear
                        </button>
                    )}
                </div>

                {error && (
                    <p className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                        {error}
                    </p>
                )}

                {/* Calendar */}
                <div className="bg-background-card rounded-xl p-2 border border-border flex-1 flex flex-col">
                    {/* Month Header */}
                    <div className="flex items-center justify-between mb-2 px-1">
                        <button onClick={prevMonth} className="text-text-secondary hover:text-text-primary disabled:opacity-30">
                            <span className="material-symbols-outlined text-[18px]">arrow_back_ios</span>
                        </button>
                        <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                            {monthName}
                            {checkingBookings && <span className="material-symbols-outlined animate-spin text-[14px] text-text-muted">autorenew</span>}
                        </h4>
                        <button onClick={nextMonth} className="text-text-secondary hover:text-text-primary">
                            <span className="material-symbols-outlined text-[18px]">arrow_forward_ios</span>
                        </button>
                    </div>

                    {/* Week Days Header */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {weekDays.map((day) => (
                            <div key={day} className="text-center text-[10px] font-bold text-text-secondary py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1 flex-1">
                        {calendarDays.map((day, index) => {
                            const available = day ? isDateAvailable(day) : false;
                            const isSelected = day === selectedDate && currentDate.getMonth() === selectedMonth;
                            const displayStr = day ? formatDateDisplay(day) : '';
                            const isFullyBooked = available && fullyBookedDates.has(displayStr);

                            return (
                                <button
                                    key={index}
                                    disabled={!day || !available || isFullyBooked}
                                    onClick={() => day && handleDateSelect(day)}
                                    className={`
                                        aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all relative
                                        ${day === null ? "invisible" : ""}
                                        ${isFullyBooked
                                            ? "bg-red-500/5 border border-red-500/15 text-red-400/50 cursor-not-allowed"
                                            : available
                                                ? isSelected
                                                    ? "bg-primary text-text-primary shadow-md shadow-primary/30 font-bold scale-105"
                                                    : "bg-primary/10 border border-primary/20 text-white hover:bg-primary/20 hover:border-primary/40 cursor-pointer"
                                                : "text-text-muted cursor-not-allowed opacity-20"
                                        }
                                    `}
                                    title={isFullyBooked ? "All slots full" : undefined}
                                >
                                    <span>{day}</span>
                                    {isFullyBooked && (
                                        <span className="text-[6px] leading-none font-bold text-red-400/70">FULL</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {formData.interview_date && (
                    <div className="bg-primary/5 rounded-lg p-2 border border-primary/20 animate-slideUp">
                        <p className="text-[10px] text-text-primary flex items-center gap-1.5 font-medium">
                            <span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>
                            Selected: {formData.interview_date}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarCard;
