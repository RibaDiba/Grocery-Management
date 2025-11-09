'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';

export type WeekSelection = {
  start: number;
  end: number;
  label: string;
};

type CalendarOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onWeekSelect?: (week: WeekSelection) => void;
  onAddReceipt?: () => void;
  addReceiptLabel?: string;
  addReceiptDisabled?: boolean;
  onViewProfile?: () => void;
  profileLabel?: string;
};

type CalendarCell = number | null;

type GroceryItem = {
  id: string;
  name: string;
  min_days: number | null;
  max_days: number | null;
  created_at: string;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatMonthDay = (date: Date) => {
  return date.toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
  });
};

const formatFullDate = (date: Date) => {
  return date.toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

const toExpiryDate = (item: GroceryItem): Date => {
  const created = new Date(item.created_at);
  if (Number.isFinite(item.max_days)) {
    const result = new Date(created);
    result.setDate(result.getDate() + (item.max_days ?? 0));
    return result;
  }
  if (Number.isFinite(item.min_days)) {
    const result = new Date(created);
    result.setDate(result.getDate() + (item.min_days ?? 0));
    return result;
  }
  return created;
};

export default function CalendarOverlay({
  isOpen,
  onClose,
  token,
  onWeekSelect,
  onAddReceipt,
  addReceiptLabel = 'Add Receipt',
  addReceiptDisabled = false,
  onViewProfile,
  profileLabel = 'Profile',
}: CalendarOverlayProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      startTransition(() => {
        setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDate(now);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setItemsError(null);
      setItemsLoading(false);
      return;
    }

    if (!token) {
      setItems([]);
      setItemsError('Sign in to view expiring groceries.');
      setItemsLoading(false);
      return;
    }

    let aborted = false;
    const fetchItems = async () => {
      setItemsLoading(true);
      setItemsError(null);
      try {
        const response = await fetch('http://localhost:8000/api/groceries/', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to load groceries');
        }
        const data: GroceryItem[] = await response.json();
        if (!aborted) {
          setItems(data);
        }
      } catch (error) {
        if (!aborted) {
          const message = error instanceof Error ? error.message : 'Unknown error fetching groceries';
          setItemsError(message);
        }
      } finally {
        if (!aborted) {
          setItemsLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      aborted = true;
    };
  }, [isOpen, token]);

  const calendarGrid = useMemo<CalendarCell[]>(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay();
    const numberOfDays = new Date(year, month + 1, 0).getDate();

    const cells: CalendarCell[] = [];

    for (let i = 0; i < startDay; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= numberOfDays; day++) {
      cells.push(day);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    if (cells.length / 7 < 6) {
      const initialLength = cells.length;
      for (let i = initialLength; i < 42; i++) {
        cells.push(null);
      }
    }

    return cells;
  }, [visibleMonth]);

  const calendarRows = useMemo(() => {
    const rows: CalendarCell[][] = [];
    for (let i = 0; i < calendarGrid.length; i += 7) {
      rows.push(calendarGrid.slice(i, i + 7));
    }
    return rows;
  }, [calendarGrid]);

  const weekInfo = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
      start,
      end,
      label: `${formatMonthDay(start)} - ${formatMonthDay(end)}`,
    };
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen || !onWeekSelect) {
      return;
    }

    onWeekSelect({
      start: weekInfo.start.getTime(),
      end: weekInfo.end.getTime(),
      label: weekInfo.label,
    });
  }, [isOpen, weekInfo, onWeekSelect]);

  const isDayInSelectedWeek = (day: CalendarCell) => {
    if (day === null) return false;
    const current = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    return current >= weekInfo.start && current <= weekInfo.end;
  };

  const handlePrevMonth = () => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: CalendarCell) => {
    if (!day) return;
    const updated = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    setSelectedDate(updated);
  };

  const selectedWeekItems = useMemo(() => {
    return items
      .map((item) => {
        const expiryDate = toExpiryDate(item);
        return { ...item, expiryDate };
      })
      .filter(({ expiryDate }) => expiryDate >= weekInfo.start && expiryDate <= weekInfo.end)
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  }, [items, weekInfo]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{
        background: 'linear-gradient(to bottom, #CBDFC9 32%, #95C590 100%)',
      }}
    >
      <div className="px-4 pt-6 flex items-center gap-3">
        <button
          aria-label="Go back"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md"
          style={{ color: '#354A33' }}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 shadow-lg">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ color: '#354A33' }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Search food items"
              className="flex-1 border-none bg-transparent text-sm focus:outline-none"
              style={{ color: '#354A33' }}
              readOnly
            />
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: '#354A33' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7 7 0 1010 17a7 7 0 006.65-10.35z"
              />
            </svg>
          </div>
        </div>

        <button
          aria-label="Close"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md"
          style={{ color: '#354A33' }}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <div className="mx-auto mt-4 w-full max-w-sm rounded-3xl bg-white p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4EFE3]"
                style={{ color: '#354A33' }}
                aria-label="Previous month"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex flex-col leading-tight" style={{ color: '#354A33' }}>
                <div className="flex items-center gap-1 text-base font-semibold">
                  <span>{MONTH_NAMES[visibleMonth.getMonth()]}</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span>{visibleMonth.getFullYear()}</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                onClick={handleNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4EFE3]"
                style={{ color: '#354A33' }}
                aria-label="Next month"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-medium" style={{ color: '#9AAEA1' }}>
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="py-1">
                {label}
              </span>
            ))}
          </div>

          <div className="mt-1 space-y-1">
            {calendarRows.map((row, rowIndex) => {
              const rowHasSelection = row.some((day) => isDayInSelectedWeek(day));

              return (
                <div key={rowIndex} className="relative grid grid-cols-7 text-center text-sm">
                  {rowHasSelection && (
                    <div className="pointer-events-none absolute inset-x-1 top-1 bottom-1 rounded-3xl bg-[#E6F2E4]" />
                  )}

                  {row.map((cell, cellIndex) => {
                    const isSelected =
                      cell !== null &&
                      selectedDate.getFullYear() === visibleMonth.getFullYear() &&
                      selectedDate.getMonth() === visibleMonth.getMonth() &&
                      selectedDate.getDate() === cell;

                    return (
                      <div key={`${cell ?? 'blank'}-${cellIndex}`} className="relative flex justify-center py-1">
                        <button
                          type="button"
                          onClick={() => handleSelectDay(cell)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors"
                          style={{
                            color: isSelected ? '#FFFFFF' : '#354A33',
                            backgroundColor: isSelected ? '#95C590' : 'transparent',
                          }}
                          disabled={cell === null}
                        >
                          {cell ?? ''}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-5 w-full max-w-sm">
          <div
            className="flex items-center gap-3 rounded-2xl border border-[#354A33]/10 bg-white/90 px-4 py-4 shadow-md"
            style={{ color: '#354A33' }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F6EF]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">Groceries expiring week of {weekInfo.label}</p>
              <p className="text-xs text-[#4A614F]">Tap a date to see items expiring around then.</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 w-full max-w-sm space-y-3 pb-6">
          {itemsLoading && (
            <div className="rounded-2xl bg-white/90 p-4 text-center text-sm font-medium text-[#4A614F] shadow-md">
              Loading groceries...
            </div>
          )}

          {itemsError && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 shadow-md">
              {itemsError}
            </div>
          )}

          {!itemsLoading && !itemsError && selectedWeekItems.length === 0 && (
            <div className="rounded-2xl bg-white/90 p-4 text-center text-sm font-medium text-[#4A614F] shadow-md">
              No groceries expiring this week.
            </div>
          )}

          {selectedWeekItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-md"
              style={{ color: '#354A33' }}
            >
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-[#4A614F]">
                  Since {formatFullDate(new Date(item.created_at))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#9AAEA1]">Expiry date</p>
                <p className="text-sm font-semibold">{formatFullDate(item.expiryDate)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

