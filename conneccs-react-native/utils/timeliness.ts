/**
 * Calculate Timeliness (T) rating based on submission date vs deadline
 * 
 * Rating Scale:
 * 5: Completed at least 2 days before deadline
 * 4: Completed at least 1 day before deadline
 * 3: Completed on the scheduled date/deadline
 * 2: Completed after the deadline
 * 1: Task not completed at all
 */

export const calculateTimelinessRating = (
  submissionDate: Date,
  deadline: Date
): {
  rating: number;
  label: string;
  description: string;
  color: string;
} => {
  // Calculate days difference (negative = before deadline, positive = after)
  const timeDiff = submissionDate.getTime() - deadline.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  if (daysDiff <= -2) {
    return {
      rating: 5,
      label: 'Excellent',
      description: 'Completed at least 2 days before deadline',
      color: '#10b981', // green
    };
  } else if (daysDiff === -1) {
    return {
      rating: 4,
      label: 'Very Good',
      description: 'Completed at least 1 day before deadline',
      color: '#3b82f6', // blue
    };
  } else if (daysDiff === 0) {
    return {
      rating: 3,
      label: 'Good',
      description: 'Completed on the scheduled date/deadline',
      color: '#f59e0b', // amber
    };
  } else if (daysDiff > 0) {
    return {
      rating: 2,
      label: 'Late',
      description: 'Completed after the deadline',
      color: '#ef4444', // red
    };
  } else {
    return {
      rating: 1,
      label: 'Not Completed',
      description: 'Task not completed at all',
      color: '#6b7280', // gray
    };
  }
};

/**
 * Parse deadline string to Date object
 * Handles various formats like "May 2026", "March 25, 2026", etc.
 */
export const parseDeadline = (deadlineStr: string): Date | null => {
  if (!deadlineStr || deadlineStr === 'AS REQUIRED' || deadlineStr === 'AS NEEDED' || deadlineStr === 'TBA') {
    return null;
  }

  try {
    // Try to parse the date string
    const date = new Date(deadlineStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Get timeliness status for display
 */
export const getTimelinessStatus = (
  deadline: string,
  submissionDate?: Date | string
): {
  status: 'submitted' | 'pending' | 'overdue' | 'no-deadline';
  daysUntil?: number;
  color: string;
} => {
  const deadlineDate = parseDeadline(deadline);
  
  if (!deadlineDate) {
    return { status: 'no-deadline', color: '#6b7280' };
  }

  // Convert submissionDate to Date if it's a string
  let submissionDateObj: Date | undefined;
  if (submissionDate) {
    if (typeof submissionDate === 'string') {
      submissionDateObj = new Date(submissionDate);
    } else {
      submissionDateObj = submissionDate;
    }
  }

  const now = submissionDateObj || new Date();
  
  // Ensure now is a valid Date
  if (!(now instanceof Date) || isNaN(now.getTime())) {
    return { status: 'no-deadline', color: '#6b7280' };
  }

  const timeDiff = deadlineDate.getTime() - now.getTime();
  const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (submissionDateObj) {
    return { status: 'submitted', daysUntil, color: '#10b981' };
  } else if (daysUntil < 0) {
    return { status: 'overdue', daysUntil: Math.abs(daysUntil), color: '#ef4444' };
  } else if (daysUntil <= 7) {
    return { status: 'pending', daysUntil, color: '#f59e0b' };
  } else {
    return { status: 'pending', daysUntil, color: '#3b82f6' };
  }
};
