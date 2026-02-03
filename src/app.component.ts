import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isMarketDay: boolean;
  dayNumber: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  // Reference date: Feb 2, 2026
  private readonly REFERENCE_DATE = new Date(2026, 1, 2); // Month is 0-indexed (1 = Feb)
  
  // State
  readonly viewDate = signal(new Date());
  readonly selectedDate = signal<Date | null>(null);

  readonly weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  readonly currentYear = computed(() => this.viewDate().getFullYear());
  readonly currentMonth = computed(() => this.viewDate().getMonth() + 1);
  
  readonly calendarDays = computed(() => {
    const view = this.viewDate();
    const year = view.getFullYear();
    const month = view.getMonth();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Calculate offset for Monday start (0=Sun, 1=Mon ... 6=Sat)
    // We want Mon=0, ..., Sun=6
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const offset = (dayOfWeek + 6) % 7; // Convert to Monday-start index
    
    // Start date of the grid
    const startDate = new Date(year, month, 1 - offset);
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 42 days (6 rows * 7 cols) to ensure full month visibility
    for (let i = 0; i < 42; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      
      // Normalize time for comparison
      current.setHours(0, 0, 0, 0);
      
      days.push({
        date: new Date(current),
        dayNumber: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        isMarketDay: this.checkIfMarketDay(current)
      });
    }
    
    return days;
  });

  checkIfMarketDay(date: Date): boolean {
    // Logic: Every 3 days starting from Ref date.
    // Calculate difference in days.
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Use UTC to avoid DST issues when calculating pure day difference across large spans
    const d1 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const d2 = Date.UTC(this.REFERENCE_DATE.getFullYear(), this.REFERENCE_DATE.getMonth(), this.REFERENCE_DATE.getDate());
    
    const diffDays = Math.floor((d1 - d2) / oneDay);
    
    // Handle negative modulo correctly for dates before reference
    // Mathematical modulo: ((n % m) + m) % m
    return ((diffDays % 3) + 3) % 3 === 0;
  }

  prevMonth() {
    this.viewDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(d.getMonth() - 1);
      return newDate;
    });
  }

  nextMonth() {
    this.viewDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(d.getMonth() + 1);
      return newDate;
    });
  }

  jumpToToday() {
    this.viewDate.set(new Date());
  }

  jumpToStart() {
    this.viewDate.set(new Date(this.REFERENCE_DATE));
  }
}