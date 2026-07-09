import { StyleSheet } from 'react-native';

export const createGlobalStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  // Typography
  displayFont: {
    fontFamily: 'System',
    fontWeight: '800',
  },
  bodyFont: {
    fontFamily: 'System',
    fontWeight: '400',
  },
  // Buttons
  btnPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnSecondary: {
    backgroundColor: colors.bg3,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '500',
  },
  // Cards/Panels
  panel: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelBody: {
    padding: 16,
  },
  // Form Elements
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  formTextarea: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Badges
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeGreen: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  badgeGreenText: {
    color: colors.green,
  },
  badgeRed: {
    backgroundColor: 'rgba(244,63,94,0.12)',
  },
  badgeRedText: {
    color: colors.red,
  },
  badgeBlue: {
    backgroundColor: 'rgba(79,124,255,0.12)',
  },
  badgeBlueText: {
    color: colors.accent,
  },
  badgeYellow: {
    backgroundColor: 'rgba(234,179,8,0.12)',
  },
  badgeYellowText: {
    color: colors.yellow,
  },
  badgeGray: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeGrayText: {
    color: colors.text3,
  },
  // Stats
  statCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  statSub: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 4,
  },
  // Avatar
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  avatarLg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarLgText: {
    fontSize: 24,
  },
  // Topbar
  topbar: {
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topbarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  topbarBreadcrumb: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 2,
  },
  // Announcement Card
  announcementCard: {
    backgroundColor: colors.bg3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  announcementMeta: {
    fontSize: 12,
    color: colors.text3,
    marginBottom: 8,
  },
  announcementBody: {
    fontSize: 14,
    color: colors.text2,
    lineHeight: 20,
  },
  // Faculty Card
  facultyCard: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  facultyCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  facultyCardMeta: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
});
