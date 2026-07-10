import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../../../components/SvgIcon';
import { apiService } from '../../../services/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, [currentMonth]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/calendar/events', {
        params: {
          month: currentMonth.getMonth() + 1,
          year: currentMonth.getFullYear(),
        },
      });
      setEvents(response.data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const getSelectedDateEvents = () => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === selectedDate.getDate() &&
             eventDate.getMonth() === selectedDate.getMonth() &&
             eventDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'DEADLINE':
        return colors.red;
      case 'MEETING':
        return colors.accent;
      case 'HOLIDAY':
        return colors.green;
      case 'EVENT':
        return colors.teal;
      default:
        return colors.text3;
    }
  };

  const days = getDaysInMonth(currentMonth);
  const selectedDateEvents = getSelectedDateEvents();

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <SvgIcon name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.topbarTitle}>
            <Text style={styles.topbarTitleText}>Calendar</Text>
            <Text style={styles.topbarBreadcrumb}>Events & Deadlines</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => {}}>
          <SvgIcon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <SvgIcon name="arrowBack" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <SvgIcon name="arrowForward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((day) => (
              <View key={day} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isSelected = day && 
                day.getDate() === selectedDate.getDate() &&
                day.getMonth() === selectedDate.getMonth() &&
                day.getFullYear() === selectedDate.getFullYear();
              const isToday = day &&
                day.getDate() === new Date().getDate() &&
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear();

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !day && styles.dayCellEmpty,
                    isSelected && styles.dayCellSelected,
                    isToday && styles.dayCellToday,
                  ]}
                  onPress={() => day && setSelectedDate(day)}
                  disabled={!day}
                >
                  {day && (
                    <>
                      <Text style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isToday && !isSelected && styles.dayTextToday,
                      ]}>
                        {day.getDate()}
                      </Text>
                      {dayEvents.length > 0 && (
                        <View style={styles.eventDots}>
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <View
                              key={idx}
                              style={[styles.eventDot, { backgroundColor: getEventTypeColor(event.type) }]}
                            />
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Date Events */}
        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>
            Events on {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={[styles.eventColorBar, { backgroundColor: getEventTypeColor(event.type) }]} />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={[styles.eventTypeBadge, { backgroundColor: `${getEventTypeColor(event.type)}20` }]}>
                      <Text style={[styles.eventTypeText, { color: getEventTypeColor(event.type) }]}>
                        {event.type}
                      </Text>
                    </View>
                  </View>
                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}
                  <View style={styles.eventMeta}>
                    <View style={styles.metaRow}>
                      <SvgIcon name="clock" size={14} color={colors.text3} />
                      <Text style={styles.metaText}>{event.time || 'All day'}</Text>
                    </View>
                    {event.location && (
                      <View style={styles.metaRow}>
                        <SvgIcon name="users" size={14} color={colors.text3} />
                        <Text style={styles.metaText}>{event.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noEventsContainer}>
              <SvgIcon name="calendar" size={32} color={colors.text3} />
              <Text style={styles.noEventsText}>No events on this date</Text>
            </View>
          )}
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
  addButton: {
    backgroundColor: colors.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  calendarCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayCellEmpty: {
    backgroundColor: 'transparent',
  },
  dayCellSelected: {
    backgroundColor: colors.accent,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayTextToday: {
    color: colors.accent,
  },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventsSection: {
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  eventCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  eventColorBar: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventDescription: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
    marginBottom: 8,
  },
  eventMeta: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.text3,
  },
  noEventsContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noEventsText: {
    fontSize: 14,
    color: colors.text3,
    marginTop: 12,
  },
});
