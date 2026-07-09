import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: 'deadline' | 'meeting' | 'review' | 'submission';
  description: string;
  time?: string;
};

const events: CalendarEvent[] = [
  {
    id: '1',
    title: 'IPCR Q1 Submission Deadline',
    date: new Date(2026, 3, 15), // April 15, 2026
    type: 'deadline',
    description: 'Submit Q1 2025 IPCR reports',
    time: '5:00 PM',
  },
  {
    id: '2',
    title: 'Faculty Development Workshop',
    date: new Date(2026, 4, 10), // May 10, 2026
    type: 'meeting',
    description: 'All faculty members are encouraged to attend',
    time: '9:00 AM',
  },
  {
    id: '3',
    title: 'Mid-Year Performance Review',
    date: new Date(2026, 3, 20), // April 20, 2026
    type: 'review',
    description: 'Performance review period starts',
    time: '8:00 AM',
  },
  {
    id: '4',
    title: 'Research Colloquium',
    date: new Date(2026, 3, 25), // April 25, 2026
    type: 'meeting',
    description: 'Present research findings and updates',
    time: '2:00 PM',
  },
  {
    id: '5',
    title: 'IPCR Extension Request Deadline',
    date: new Date(2026, 3, 10), // April 10, 2026
    type: 'deadline',
    description: 'Last day to request IPCR submission extension',
    time: '5:00 PM',
  },
  {
    id: '6',
    title: 'Department Meeting',
    date: new Date(2026, 4, 5), // May 5, 2026
    type: 'meeting',
    description: 'Monthly department meeting',
    time: '3:00 PM',
  },
  {
    id: '7',
    title: 'IPCR Q2 Planning',
    date: new Date(2026, 4, 1), // May 1, 2026
    type: 'submission',
    description: 'Start planning Q2 IPCR objectives',
    time: '10:00 AM',
  },
];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const hasEventsOnDate = (day: number) => {
    const date = new Date(year, month, day);
    return getEventsForDate(date).length > 0;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           month === selectedDate.getMonth() && 
           year === selectedDate.getFullYear();
  };

  const handleDatePress = (day: number) => {
    setSelectedDate(new Date(year, month, day));
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'deadline': return colors.red;
      case 'meeting': return colors.accent;
      case 'review': return colors.orange;
      case 'submission': return colors.teal;
      default: return colors.text3;
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline': return 'clock';
      case 'meeting': return 'users';
      case 'review': return 'clipboard';
      case 'submission': return 'fileText';
      default: return 'calendar';
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasEvents = hasEventsOnDate(day);
      const today = isToday(day);
      const selected = isSelected(day);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            today && styles.calendarDayToday,
            selected && styles.calendarDaySelected,
          ]}
          onPress={() => handleDatePress(day)}
        >
          <Text style={[
            styles.calendarDayText,
            today && styles.calendarDayTextToday,
            selected && styles.calendarDayTextSelected,
          ]}>
            {day}
          </Text>
          {hasEvents && (
            <View style={[
              styles.eventDot,
              selected && styles.eventDotSelected,
            ]} />
          )}
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const upcomingEvents = events
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <SvgIcon name="menu" size={24} color={colors.text} style={{}} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>Calendar</Text>
            <Text style={styles.topbarBreadcrumb}>CCS Faculty Portal › Calendar</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={previousMonth} style={styles.monthBtn}>
              <SvgIcon name="chevronLeft" size={20} color={colors.text} style={{}} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {monthNames[month]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
              <SvgIcon name="chevronRight" size={20} color={colors.text} style={{}} />
            </TouchableOpacity>
          </View>

          {/* Day Names */}
          <View style={styles.dayNamesRow}>
            {dayNames.map(day => (
              <View key={day} style={styles.dayNameCell}>
                <Text style={styles.dayNameText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {renderCalendarDays()}
          </View>
        </View>

        {/* Selected Date Events */}
        {selectedDate && selectedDateEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Events on {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}
            </Text>
            {selectedDateEvents.map(event => (
              <View key={event.id} style={styles.eventCard}>
                <View style={[styles.eventIndicator, { backgroundColor: getEventTypeColor(event.type) }]} />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <SvgIcon 
                      name={getEventTypeIcon(event.type)} 
                      size={16} 
                      color={getEventTypeColor(event.type)} 
                      style={{}} 
                    />
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  {event.time && (
                    <View style={styles.eventTime}>
                      <SvgIcon name="clock" size={12} color={colors.text3} style={{}} />
                      <Text style={styles.eventTimeText}>{event.time}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {upcomingEvents.map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View style={[styles.eventIndicator, { backgroundColor: getEventTypeColor(event.type) }]} />
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <SvgIcon 
                    name={getEventTypeIcon(event.type)} 
                    size={16} 
                    color={getEventTypeColor(event.type)} 
                    style={{}} 
                  />
                  <Text style={styles.eventTitle}>{event.title}</Text>
                </View>
                <Text style={styles.eventDescription}>{event.description}</Text>
                <View style={styles.eventMeta}>
                  <View style={styles.eventDate}>
                    <SvgIcon name="calendar" size={12} color={colors.text3} style={{}} />
                    <Text style={styles.eventMetaText}>
                      {monthNames[event.date.getMonth()]} {event.date.getDate()}, {event.date.getFullYear()}
                    </Text>
                  </View>
                  {event.time && (
                    <View style={styles.eventTime}>
                      <SvgIcon name="clock" size={12} color={colors.text3} style={{}} />
                      <Text style={styles.eventTimeText}>{event.time}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topbar: {
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  topbarTitle: {
    flex: 1,
  },
  topbarTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  topbarBreadcrumb: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  calendarCard: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
  },
  calendarDayToday: {
    backgroundColor: `${colors.accent}20`,
    borderRadius: 8,
  },
  calendarDaySelected: {
    backgroundColor: colors.accent,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: colors.text2,
    fontWeight: '500',
  },
  calendarDayTextToday: {
    color: colors.accent,
    fontWeight: '700',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    position: 'absolute',
    bottom: 6,
  },
  eventDotSelected: {
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
  },
  eventIndicator: {
    width: 4,
    borderRadius: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  eventDescription: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  eventDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: 12,
    color: colors.text3,
  },
  eventTimeText: {
    fontSize: 12,
    color: colors.text3,
  },
});
