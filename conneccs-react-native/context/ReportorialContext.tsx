import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import {
  ReportorialRequirement,
  ReportorialSubmission,
  ReportorialReminder,
  ReportorialReport,
  MessageChannel,
  Message,
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import usersData from '../assets/data/users.json';
import { getFacultyUsers } from '../utils/businessRules';

interface ReportorialContextType {
  requirements: ReportorialRequirement[];
  submissions: ReportorialSubmission[];
  reminders: ReportorialReminder[];
  reports: ReportorialReport[];
  messageChannels: MessageChannel[];
  messages: Message[];
  
  // Requirement management
  addRequirement: (requirement: ReportorialRequirement) => void;
  updateRequirement: (id: string, updates: Partial<ReportorialRequirement>) => void;
  deleteRequirement: (id: string) => void;
  uploadTemplate: (requirementId: string, fileUrl: string) => void;
  
  // Submission management
  submitRequirement: (submission: ReportorialSubmission) => void;
  rateSubmission: (submissionId: string, quality: number, timeliness: number, remarks?: string) => void;
  getSubmissionsForRequirement: (requirementId: string) => ReportorialSubmission[];
  getFacultySubmission: (requirementId: string, facultyId: string) => ReportorialSubmission | undefined;
  
  // Reminder system
  sendReminder: (requirementId: string, recipientIds: string[], message: string, channel: 'EMAIL' | 'SMS' | 'IN_APP' | 'ALL') => void;
  sendBulkReminder: (requirementId: string) => void;
  
  // Report generation
  generateSubmittedReport: (requirementId: string) => ReportorialReport;
  generateNotSubmittedReport: (requirementId: string) => ReportorialReport;
  generateSummaryReport: (requirementId: string) => ReportorialReport;
  
  // Messaging
  createMessageChannel: (name: string, type: 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT', participantIds: string[]) => MessageChannel;
  sendMessage: (channelId: string, senderId: string, senderName: string, content: string, attachments?: any[]) => void;
  getChannelMessages: (channelId: string) => Message[];
  markMessageRead: (messageId: string, userId: string) => void;
}

const ReportorialContext = createContext<ReportorialContextType | undefined>(undefined);

// Version number - increment this to force reload of initial data
const DATA_VERSION = 3;

// Initial requirements data (from the screen)
const initialRequirements: ReportorialRequirement[] = [
  {
    id: 'req-1',
    no: '1',
    requirement: 'LETTER OF INTENT',
    template: 'Letter of Intent',
    copies: '3 COPIES',
    fileSize: 'LONG',
    deadline: 'May 2026',
    remarks: 'ALL COS AND ADMIN PART-TIME',
    staff: 'JO',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/letter-of-intent.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-2',
    no: '2',
    requirement: 'PERMIT TO TEACH',
    template: 'Permit to Teach COS Full-Time / Part-Time / Admin Part-Time',
    copies: '3 COPIES',
    fileSize: 'LONG',
    deadline: 'Effective upon the approval of Letter of Intent',
    remarks: 'COS FULL-TIME / COS PART-TIME / ADMIN PART-TIME',
    staff: 'JO',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/permit-to-teach.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-3',
    no: '3',
    requirement: 'WORKLOAD SCHEDULE OF FACULTY',
    template: 'Workload Schedule',
    copies: '1 COPY',
    fileSize: 'LONG',
    deadline: 'Effective upon the approval and signing of Subject Load Notice',
    remarks: 'ALL FACULTY MEMBERS',
    staff: 'JO',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/workload-schedule.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-4',
    no: '4',
    requirement: 'APPROVED SYLLABUS',
    template: 'DRIVE FOLDER: Syllabus 25-2',
    copies: 'SOFT COPY',
    fileSize: 'LONG',
    deadline: '',
    remarks: 'ALL FACULTY MEMBERS',
    staff: 'STEPH',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/syllabus.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-5',
    no: '5',
    requirement: 'CLASS MONITORING CHECKLIST',
    template: 'DRIVE FOLDER: CMC Template',
    copies: '1 COPY',
    fileSize: 'LONG',
    deadline: '1st Week of the following month',
    remarks: 'All Faculty Members handling Non-Laboratory Subjects/courses',
    staff: 'VIANNE',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/cmc-template.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-6',
    no: '6',
    requirement: 'COMPUTATION OF MIDTERM GRADES',
    template: '',
    copies: '1 COPY',
    fileSize: 'LONG',
    deadline: 'March 25, 2026',
    remarks: 'ALL FACULTY MEMBERS',
    staff: 'CHEN',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/midterm-grades.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-7',
    no: '7',
    requirement: 'LIST OF DROPPED STUDENT',
    template: 'List of Dropped Student',
    copies: '1 COPY',
    fileSize: 'LONG',
    deadline: 'March 24, 2026',
    remarks: 'ALL FACULTY MEMBERS',
    staff: 'CHEN',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/dropped-students.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-8',
    no: '8',
    requirement: 'CLASS OBSERVATION',
    template: 'Class Observation',
    copies: 'SOFT COPY',
    fileSize: 'LONG',
    deadline: 'March 31, 2026',
    remarks: 'PROGRAM CHAIRS',
    staff: 'CHEN',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/class-observation.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-9',
    no: '9',
    requirement: 'APPROVED TOS W/ Test Question & KEY to correction',
    template: 'DRIVE FOLDER: TOS/RUBRIC 25-2',
    copies: 'SOFT COPY',
    fileSize: 'LONG',
    deadline: 'March 13, 2026',
    remarks: 'ALL FACULTY MEMBERS',
    staff: 'STEPH',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/tos-rubric.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-10',
    no: '10',
    requirement: 'APPROVED RUBRIC OF ASSESSMENT W/ ATTACHED PROBLEM/ SAMPLE OUTPUT',
    template: 'DRIVE FOLDER: TOS/RUBRIC 25-2',
    copies: 'SOFT COPY',
    fileSize: 'LONG',
    deadline: 'March 13, 2026',
    remarks: 'ALL FACULTY MEMBERS',
    staff: 'STEPH',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/rubric-assessment.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-11',
    no: '11',
    requirement: 'SIAS GRADE SHEET',
    template: '',
    copies: '3 COPIES',
    fileSize: 'LONG',
    deadline: 'Graduate 5/20/2026 / Undergrad 5/27/2026',
    remarks: 'ALL FACULTY MEMBERS',
    staff: 'CHEN',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/sias-grade-sheet.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-12',
    no: '12',
    requirement: 'LIST OF TOP TEN',
    template: 'List of Top Ten',
    copies: '1 COPY',
    fileSize: 'LONG',
    deadline: 'May 27, 2026',
    remarks: 'All Class Advisers',
    staff: 'JO',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/top-ten.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-13',
    no: '13',
    requirement: 'DELIQUENCY REPORT',
    template: 'Delinquency Report',
    copies: '1 COPY',
    fileSize: 'LONG',
    deadline: 'May 27, 2026',
    remarks: 'All Class Advisers',
    staff: 'JO',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/delinquency-report.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-14',
    no: '14',
    requirement: "DEAN'S & PRESIDENT LIST",
    template: "DRIVE FOLDER: Dean's List 25-2",
    copies: 'SOFTCOPY',
    fileSize: 'LONG',
    deadline: 'May 27, 2026',
    remarks: 'All Class Advisers',
    staff: 'JO',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/deans-list.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-15',
    no: '15',
    requirement: 'APPROVED CLASS RECORD',
    template: '',
    copies: '1 COPY',
    fileSize: 'LONG',
    deadline: 'Graduate 5/20/2026 / Undergrad 5/27/2026',
    remarks: 'All Class Advisers',
    staff: 'STEPH',
    category: 'REPORTORIAL',
    templateFileUrl: 'https://example.com/templates/class-record.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-other-1',
    no: '1',
    requirement: 'MAKE UP CLASS REQUEST',
    template: 'Attachments: Class and Faculty Plotting; Proof of Agreement with Students on the Make-Up Class Schedule',
    copies: 'Two (2) COPIES of the Request form; One (1) copy of the supporting attachments',
    fileSize: 'LONG',
    deadline: 'AS REQUIRED',
    remarks: 'AS REQUESTED BY FACULTY',
    staff: 'JO',
    category: 'OTHER_DOCUMENTS',
    templateFileUrl: 'https://example.com/templates/makeup-class.pdf',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-other-2',
    no: '2',
    requirement: 'LEAVE FORM',
    template: 'STANDARD FORMS AVAILABLE AT DEANS OFFICE',
    copies: '',
    fileSize: '',
    deadline: 'AS NEEDED',
    remarks: 'WHEN APPLICABLE/FILED BY FACULTY',
    staff: 'VIANNE',
    category: 'OTHER_DOCUMENTS',
    templateFileUrl: 'https://example.com/templates/leave-form.pdf',
    createdAt: new Date().toISOString(),
  },
];

export const ReportorialProvider = ({ children }: { children: ReactNode }) => {
  const [requirements, setRequirements] = useState<ReportorialRequirement[]>(initialRequirements);
  const [submissions, setSubmissions] = useState<ReportorialSubmission[]>([]);
  const [reminders, setReminders] = useState<ReportorialReminder[]>([]);
  const [reports, setReports] = useState<ReportorialReport[]>([]);
  const [messageChannels, setMessageChannels] = useState<MessageChannel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load data from AsyncStorage
  useEffect(() => {
    loadData();
  }, []);

  // Save data to AsyncStorage
  useEffect(() => {
    saveData();
  }, [requirements, submissions, reminders, reports, messageChannels, messages]);

  const loadData = async () => {
    try {
      const storedVersion = await AsyncStorage.getItem('reportorial_data_version');
      const currentVersion = DATA_VERSION.toString();
      
      console.log('Loading reportorial data - stored version:', storedVersion, 'current version:', currentVersion);
      
      // If version mismatch, clear old data and use initial data
      if (storedVersion !== currentVersion) {
        console.log('Data version mismatch, loading initial data and clearing storage');
        await AsyncStorage.setItem('reportorial_data_version', currentVersion);
        await AsyncStorage.removeItem('reportorial_requirements');
        await AsyncStorage.removeItem('reportorial_submissions');
        await AsyncStorage.removeItem('reportorial_reminders');
        await AsyncStorage.removeItem('reportorial_reports');
        await AsyncStorage.removeItem('message_channels');
        await AsyncStorage.removeItem('messages');
        setRequirements(initialRequirements);
        console.log('Initial requirements loaded:', initialRequirements.length);
        return;
      }
      
      const [reqData, subData, remData, repData, chanData, msgData] = await Promise.all([
        AsyncStorage.getItem('reportorial_requirements'),
        AsyncStorage.getItem('reportorial_submissions'),
        AsyncStorage.getItem('reportorial_reminders'),
        AsyncStorage.getItem('reportorial_reports'),
        AsyncStorage.getItem('message_channels'),
        AsyncStorage.getItem('messages'),
      ]);

      // Check if we need to update with new initial data
      if (reqData) {
        const storedReqs = JSON.parse(reqData);
        console.log('Stored requirements count:', storedReqs.length, 'Initial requirements count:', initialRequirements.length);
        // If stored data has fewer items than initial data, use initial data
        if (storedReqs.length < initialRequirements.length) {
          console.log('Updating requirements with new initial data');
          setRequirements(initialRequirements);
        } else {
          console.log('Using stored requirements');
          setRequirements(storedReqs);
        }
      } else {
        // No stored data, use initial
        console.log('No stored data, using initial requirements');
        setRequirements(initialRequirements);
      }
      
      if (subData) setSubmissions(JSON.parse(subData));
      if (remData) setReminders(JSON.parse(remData));
      if (repData) setReports(JSON.parse(repData));
      if (chanData) setMessageChannels(JSON.parse(chanData));
      if (msgData) setMessages(JSON.parse(msgData));
    } catch (error) {
      console.error('Error loading reportorial data:', error);
      // On error, use initial data
      console.log('Error occurred, falling back to initial requirements');
      setRequirements(initialRequirements);
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('reportorial_requirements', JSON.stringify(requirements)),
        AsyncStorage.setItem('reportorial_submissions', JSON.stringify(submissions)),
        AsyncStorage.setItem('reportorial_reminders', JSON.stringify(reminders)),
        AsyncStorage.setItem('reportorial_reports', JSON.stringify(reports)),
        AsyncStorage.setItem('message_channels', JSON.stringify(messageChannels)),
        AsyncStorage.setItem('messages', JSON.stringify(messages)),
      ]);
    } catch (error) {
      console.error('Error saving reportorial data:', error);
    }
  };

  // ─── REQUIREMENT MANAGEMENT ───────────────────────────────────────────────

  const addRequirement = (requirement: ReportorialRequirement) => {
    setRequirements(prev => [...prev, requirement]);
  };

  const updateRequirement = (id: string, updates: Partial<ReportorialRequirement>) => {
    setRequirements(prev =>
      prev.map(req => (req.id === id ? { ...req, ...updates, updatedAt: new Date().toISOString() } : req))
    );
  };

  const deleteRequirement = (id: string) => {
    setRequirements(prev => prev.filter(req => req.id !== id));
  };

  const uploadTemplate = (requirementId: string, fileUrl: string) => {
    updateRequirement(requirementId, { templateFileUrl: fileUrl });
  };

  // ─── SUBMISSION MANAGEMENT ────────────────────────────────────────────────

  const submitRequirement = (submission: ReportorialSubmission) => {
    setSubmissions(prev => [...prev, submission]);
  };

  const rateSubmission = (submissionId: string, quality: number, timeliness: number, remarks?: string) => {
    setSubmissions(prev =>
      prev.map(sub =>
        sub.id === submissionId
          ? {
              ...sub,
              qualityRating: quality,
              timelinessRating: timeliness,
              remarks,
              status: 'RATED' as const,
              ratedAt: new Date().toISOString(),
            }
          : sub
      )
    );
  };

  const getSubmissionsForRequirement = (requirementId: string): ReportorialSubmission[] => {
    return submissions.filter(sub => sub.requirementId === requirementId);
  };

  const getFacultySubmission = (requirementId: string, facultyId: string): ReportorialSubmission | undefined => {
    return submissions.find(sub => sub.requirementId === requirementId && sub.facultyId === facultyId);
  };

  // ─── REMINDER SYSTEM ──────────────────────────────────────────────────────

  const sendReminder = (
    requirementId: string,
    recipientIds: string[],
    message: string,
    channel: 'EMAIL' | 'SMS' | 'IN_APP' | 'ALL'
  ) => {
    const reminder: ReportorialReminder = {
      id: `reminder-${Date.now()}`,
      requirementId,
      sentAt: new Date().toISOString(),
      sentBy: 'SECRETARY', // Should be current user ID
      recipientIds,
      message,
      channel,
    };

    setReminders(prev => [...prev, reminder]);

    // Send in-app messages
    if (channel === 'IN_APP' || channel === 'ALL') {
      // Find or create announcement channel
      let announcementChannel = messageChannels.find(ch => ch.type === 'ANNOUNCEMENT' && ch.name === 'Reportorial Reminders');
      
      if (!announcementChannel) {
        announcementChannel = createMessageChannel('Reportorial Reminders', 'ANNOUNCEMENT', recipientIds);
      }

      // Send message to channel
      sendMessage(
        announcementChannel.id,
        'SYSTEM',
        'Reportorial System',
        message,
        undefined,
        true,
        requirementId
      );
    }

    console.log(`Reminder sent to ${recipientIds.length} recipients via ${channel}`);
  };

  const sendBulkReminder = (requirementId: string) => {
    const requirement = requirements.find(req => req.id === requirementId);
    if (!requirement) return;

    // Get all faculty members
    const allFaculty = getFacultyUsers(usersData as any[]);
    
    // Filter out those who have already submitted
    const submittedFacultyIds = submissions
      .filter(sub => sub.requirementId === requirementId)
      .map(sub => sub.facultyId);
    
    const nonSubmitters = allFaculty.filter((f: any) => !submittedFacultyIds.includes(f.id));
    
    if (nonSubmitters.length === 0) {
      console.log('All faculty have submitted this requirement');
      return;
    }

    const message = `Reminder: Please submit "${requirement.requirement}" by ${requirement.deadline || 'the deadline'}. This is a required reportorial document.`;
    
    sendReminder(
      requirementId,
      nonSubmitters.map((f: any) => f.id),
      message,
      'ALL'
    );
  };

  // ─── REPORT GENERATION ────────────────────────────────────────────────────

  const generateSubmittedReport = (requirementId: string): ReportorialReport => {
    const requirement = requirements.find(req => req.id === requirementId);
    const requirementSubmissions = getSubmissionsForRequirement(requirementId);
    
    const facultyList = requirementSubmissions.map(sub => ({
      facultyId: sub.facultyId,
      facultyName: sub.facultyName,
      status: 'SUBMITTED' as const,
      submittedAt: sub.submittedAt,
      qualityRating: sub.qualityRating,
      timelinessRating: sub.timelinessRating,
    }));

    const report: ReportorialReport = {
      id: `report-${Date.now()}`,
      requirementId,
      generatedAt: new Date().toISOString(),
      generatedBy: 'SECRETARY', // Should be current user ID
      reportType: 'SUBMITTED',
      facultyList,
    };

    setReports(prev => [...prev, report]);
    return report;
  };

  const generateNotSubmittedReport = (requirementId: string): ReportorialReport => {
    const allFaculty = getFacultyUsers(usersData as any[]);
    const submittedFacultyIds = submissions
      .filter(sub => sub.requirementId === requirementId)
      .map(sub => sub.facultyId);
    
    const nonSubmitters = allFaculty.filter((f: any) => !submittedFacultyIds.includes(f.id));
    
    const facultyList = nonSubmitters.map((f: any) => ({
      facultyId: f.id,
      facultyName: f.name,
      status: 'NOT_SUBMITTED' as const,
    }));

    const report: ReportorialReport = {
      id: `report-${Date.now()}`,
      requirementId,
      generatedAt: new Date().toISOString(),
      generatedBy: 'SECRETARY', // Should be current user ID
      reportType: 'NOT_SUBMITTED',
      facultyList,
    };

    setReports(prev => [...prev, report]);
    return report;
  };

  const generateSummaryReport = (requirementId: string): ReportorialReport => {
    const allFaculty = getFacultyUsers(usersData as any[]);
    const requirementSubmissions = getSubmissionsForRequirement(requirementId);
    
    const facultyList = allFaculty.map((f: any) => {
      const submission = requirementSubmissions.find(sub => sub.facultyId === f.id);
      
      return {
        facultyId: f.id,
        facultyName: f.name,
        status: submission ? ('SUBMITTED' as const) : ('NOT_SUBMITTED' as const),
        submittedAt: submission?.submittedAt,
        qualityRating: submission?.qualityRating,
        timelinessRating: submission?.timelinessRating,
      };
    });

    const report: ReportorialReport = {
      id: `report-${Date.now()}`,
      requirementId,
      generatedAt: new Date().toISOString(),
      generatedBy: 'SECRETARY', // Should be current user ID
      reportType: 'SUMMARY',
      facultyList,
    };

    setReports(prev => [...prev, report]);
    return report;
  };

  // ─── MESSAGING ────────────────────────────────────────────────────────────

  const createMessageChannel = (
    name: string,
    type: 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT',
    participantIds: string[]
  ): MessageChannel => {
    const channel: MessageChannel = {
      id: `channel-${Date.now()}`,
      name,
      type,
      participantIds,
      createdBy: 'SECRETARY', // Should be current user ID
      createdAt: new Date().toISOString(),
    };

    setMessageChannels(prev => [...prev, channel]);
    return channel;
  };

  const sendMessage = (
    channelId: string,
    senderId: string,
    senderName: string,
    content: string,
    attachments?: any[],
    isSystemMessage: boolean = false,
    relatedReportorialId?: string
  ) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId,
      senderName,
      content,
      attachments,
      sentAt: new Date().toISOString(),
      readBy: [senderId],
      isSystemMessage,
      relatedReportorialId,
    };

    setMessages(prev => [...prev, message]);
    
    // Update channel's last message time
    setMessageChannels(prev =>
      prev.map(ch =>
        ch.id === channelId ? { ...ch, lastMessageAt: message.sentAt } : ch
      )
    );
  };

  const getChannelMessages = (channelId: string): Message[] => {
    return messages.filter(msg => msg.channelId === channelId).sort((a, b) => 
      new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );
  };

  const markMessageRead = (messageId: string, userId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId && !msg.readBy.includes(userId)
          ? { ...msg, readBy: [...msg.readBy, userId] }
          : msg
      )
    );
  };

  const value: ReportorialContextType = {
    requirements,
    submissions,
    reminders,
    reports,
    messageChannels,
    messages,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    uploadTemplate,
    submitRequirement,
    rateSubmission,
    getSubmissionsForRequirement,
    getFacultySubmission,
    sendReminder,
    sendBulkReminder,
    generateSubmittedReport,
    generateNotSubmittedReport,
    generateSummaryReport,
    createMessageChannel,
    sendMessage,
    getChannelMessages,
    markMessageRead,
  };

  return <ReportorialContext.Provider value={value}>{children}</ReportorialContext.Provider>;
};

export const useReportorial = () => {
  const context = useContext(ReportorialContext);
  if (!context) {
    throw new Error('useReportorial must be used within ReportorialProvider');
  }
  return context;
};
