import React, { useState } from 'react';
import { Platform } from 'react-native';
import { YStack, XStack, ScrollView, Text as TamaguiText } from 'tamagui';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { SvgIcon } from '../components/SvgIcon';
import { ProgressBar } from '../../components/ProgressBar';
import { countLinkedIPCRs } from '../../utils/calculations';

export default function OPCRScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { opcr, ipcrs } = useData();
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [showFacultyOverview, setShowFacultyOverview] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Check if user is Vianne Faye S. Gastilo (only secretary who can access OPCR)
  const canAccessOPCR = () => {
    if (!user) return false;
    
    // Allow admin and dean to access
    if (user.role === 'ADMIN' || user.role === 'DEAN') return true;
    
    // Only Vianne Faye S. Gastilo can access OPCR among secretaries
    if (user.role === 'SECRETARY') {
      return user.name.includes('Vianne') || user.name.includes('Gastilo');
    }
    
    return false;
  };

  // If user doesn't have access, show access denied screen
  if (!canAccessOPCR()) {
    return (
      <YStack f={1} bg="$bg">
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        {/* Topbar */}
        <XStack
          bg="$bg2"
          bw={1}
          bbc="$border"
          px="$4"
          py="$3"
          pt={48}
          ai="center"
        >
          <XStack
            pressStyle={{ opacity: 0.7 }}
            onPress={() => navigation.openDrawer()}
            cursor="pointer"
          >
            <SvgIcon name="menu" size={24} color={colors.text} />
          </XStack>
          <YStack f={1} mx="$4">
            <TamaguiText fontSize={17} fontWeight="700" color="$text">
              OPCR
            </TamaguiText>
            <TamaguiText fontSize={11} color="$text3" mt={2}>
              Office Performance Commitment Review
            </TamaguiText>
          </YStack>
        </XStack>

        {/* Access Denied Content */}
        <YStack f={1} ai="center" jc="center" p="$5">
          <YStack
            bg="$bg2"
            br="$4"
            bw={1}
            bc="$border"
            p="$6"
            ai="center"
            maxWidth={400}
          >
            <SvgIcon name="alertCircle" size={64} color={colors.orange} mb="$4" />
            <TamaguiText fontSize={20} fontWeight="700" color="$text" mb="$2" textAlign="center">
              Access Restricted
            </TamaguiText>
            <TamaguiText fontSize={14} color="$text3" textAlign="center" lineHeight={22}>
              You do not have permission to view the OPCR. Only Vianne Faye S. Gastilo (Administrative Aide III) can access this section.
            </TamaguiText>
          </YStack>
        </YStack>
      </YStack>
    );
  }

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'STRATEGIC':
        return colors.accent;
      case 'CORE':
        return colors.teal;
      case 'SUPPORT':
        return colors.orange;
      default:
        return colors.text3;
    }
  };

  // Get faculty summary from IPCRs (remove duplicates by facultyId)
  const getFacultySummary = () => {
    const facultyMap = new Map();
    
    ipcrs.forEach(ipcr => {
      // Skip if we already have this faculty (keep the first one)
      if (facultyMap.has(ipcr.facultyId)) {
        return;
      }
      
      const totalTargets = ipcr.majorFunctions?.reduce((sum, mf) => sum + (mf.targets?.length || 0), 0) || 0;
      const ratedTargets = ipcr.majorFunctions?.reduce(
        (sum, mf) => sum + (mf.targets?.filter(t => t.a4Rating && t.a4Rating > 0).length || 0),
        0
      ) || 0;
      const completionPercent = totalTargets > 0 ? Math.round((ratedTargets / totalTargets) * 100) : 0;
      
      facultyMap.set(ipcr.facultyId, {
        id: ipcr.id,
        facultyId: ipcr.facultyId,
        name: ipcr.facultyName || 'Unknown',
        status: ipcr.status,
        totalTargets,
        ratedTargets,
        completionPercent,
        finalRating: ipcr.finalRating,
      });
    });
    
    return Array.from(facultyMap.values());
  };

  const facultySummary = getFacultySummary();

  // Filter major functions by selected category
  const filteredMajorFunctions = selectedCategory === 'ALL'
    ? opcr.majorFunctions
    : opcr.majorFunctions.filter(mf => mf.category === selectedCategory);

  // Count functions by category
  const categoryCounts = {
    ALL: opcr.majorFunctions.length,
    STRATEGIC: opcr.majorFunctions.filter(mf => mf.category === 'STRATEGIC').length,
    CORE: opcr.majorFunctions.filter(mf => mf.category === 'CORE').length,
    SUPPORT: opcr.majorFunctions.filter(mf => mf.category === 'SUPPORT').length,
  };

  return (
    <YStack f={1} bg="$bg">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Topbar */}
      <XStack
        bg="$bg2"
        bw={1}
        bbc="$border"
        px="$4"
        py="$3"
        pt={48}
        ai="center"
      >
        <XStack
          pressStyle={{ opacity: 0.7 }}
          onPress={() => navigation.openDrawer()}
          cursor="pointer"
        >
          <SvgIcon name="menu" size={24} color={colors.text} />
        </XStack>
        <YStack f={1} mx="$4">
          <TamaguiText fontSize={17} fontWeight="700" color="$text">
            OPCR
          </TamaguiText>
          <TamaguiText fontSize={11} color="$text3" mt={2}>
            Office Performance Commitment Review
          </TamaguiText>
        </YStack>
        <XStack pressStyle={{ opacity: 0.7 }} cursor="pointer">
          <SvgIcon name="bell" size={22} color={colors.text2} />
        </XStack>
      </XStack>

      <ScrollView
        f={1}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <YStack
          bg="$bg2"
          br="$4"
          bw={1}
          bc="$border"
          p="$5"
          mb="$4"
        >
          <TamaguiText fontSize={20} fontWeight="800" color="$text" mb="$1">
            {opcr.officeName}
          </TamaguiText>
          <TamaguiText fontSize={14} color="$text3" mb="$3">
            {opcr.period}
          </TamaguiText>
          <XStack
            bg="rgba(16, 185, 129, 0.15)"
            px="$3"
            py="$2"
            br="$3"
            alignSelf="flex-start"
          >
            <TamaguiText fontSize={12} fontWeight="600" color="$green">
              {opcr.status}
            </TamaguiText>
          </XStack>
        </YStack>

        {/* Faculty Overview Section */}
        <YStack
          bg="$bg2"
          br="$4"
          bw={1}
          bc="$border"
          mb="$4"
          overflow="hidden"
        >
          {/* Section Header */}
          <XStack
            p="$4"
            ai="center"
            jc="space-between"
            pressStyle={{ opacity: 0.7 }}
            onPress={() => setShowFacultyOverview(!showFacultyOverview)}
            cursor="pointer"
          >
            <XStack ai="center" gap="$3" f={1}>
              <YStack
                w={40}
                h={40}
                bg="$accent"
                br={20}
                ai="center"
                jc="center"
              >
                <SvgIcon name="users" size={20} color="#fff" />
              </YStack>
              <YStack f={1}>
                <TamaguiText fontSize={16} fontWeight="700" color="$text" mb={2}>
                  Faculty IPCR Overview
                </TamaguiText>
                <TamaguiText fontSize={12} color="$text3">
                  {facultySummary.length} faculty members
                </TamaguiText>
              </YStack>
            </XStack>
            <SvgIcon
              name={showFacultyOverview ? 'chevronUp' : 'chevronDown'}
              size={20}
              color={colors.text3}
            />
          </XStack>

          {/* Faculty List */}
          {showFacultyOverview && (
            <YStack
              btw={1}
              btc="$border"
              p="$4"
              gap="$3"
              bg="$bg2"
            >
              {facultySummary.length === 0 ? (
                <YStack ai="center" py="$5">
                  <SvgIcon name="alertCircle" size={48} color={colors.text3} mb="$3" />
                  <TamaguiText fontSize={14} color="$text3" textAlign="center">
                    No faculty IPCRs generated yet
                  </TamaguiText>
                </YStack>
              ) : (
                facultySummary.map((faculty) => (
                  <XStack
                    key={faculty.id}
                    bg="$bg3"
                    br="$3"
                    p="$3.5"
                    ai="center"
                    gap="$3"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => navigation.navigate('IPCRDetail', { id: faculty.id })}
                    cursor="pointer"
                  >
                    {/* Avatar */}
                    <YStack
                      w={48}
                      h={48}
                      bg="$accent"
                      br={24}
                      ai="center"
                      jc="center"
                    >
                      <TamaguiText color="#fff" fontSize={18} fontWeight="800">
                        {faculty.name.charAt(0)}
                      </TamaguiText>
                    </YStack>

                    {/* Faculty Info */}
                    <YStack f={1}>
                      <TamaguiText fontSize={14} fontWeight="700" color="$text" mb={2}>
                        {faculty.name}
                      </TamaguiText>
                      <XStack ai="center" gap="$2" mb="$2">
                        <XStack
                          bg={
                            faculty.status === 'COMPLETED' ? 'rgba(34,197,94,0.15)' :
                            faculty.status === 'PENDING_REVIEW' ? 'rgba(234,179,8,0.15)' :
                            'rgba(156,163,175,0.15)'
                          }
                          px="$2"
                          py="$1"
                          br="$2"
                        >
                          <TamaguiText
                            fontSize={10}
                            fontWeight="600"
                            color={
                              faculty.status === 'COMPLETED' ? '$green' :
                              faculty.status === 'PENDING_REVIEW' ? '$yellow' :
                              '$text3'
                            }
                          >
                            {faculty.status.replace('_', ' ')}
                          </TamaguiText>
                        </XStack>
                        <TamaguiText fontSize={11} color="$text3">
                          {faculty.ratedTargets}/{faculty.totalTargets} targets
                        </TamaguiText>
                      </XStack>
                      
                      {/* Progress Bar */}
                      <YStack bg="$border" h={6} br="$2" overflow="hidden">
                        <YStack
                          bg="$accent"
                          h={6}
                          width={`${faculty.completionPercent}%`}
                        />
                      </YStack>
                    </YStack>

                    {/* Completion Percent */}
                    <YStack ai="flex-end">
                      <TamaguiText fontSize={20} fontWeight="800" color="$accent">
                        {faculty.completionPercent}%
                      </TamaguiText>
                      {faculty.finalRating && (
                        <TamaguiText fontSize={11} color="$text3">
                          Rating: {faculty.finalRating.toFixed(2)}
                        </TamaguiText>
                      )}
                    </YStack>

                    <SvgIcon name="chevronRight" size={20} color={colors.text3} />
                  </XStack>
                ))
              )}
            </YStack>
          )}
        </YStack>

        {/* Category Filter Buttons */}
        <YStack mb="$4">
          <TamaguiText fontSize={13} fontWeight="600" color="$text3" mb="$3">
            Filter by Category
          </TamaguiText>
          <XStack gap="$2.5" flexWrap="wrap">
            {/* All Button */}
            <XStack
              bg={selectedCategory === 'ALL' ? '$accent' : '$bg2'}
              bw={1}
              bc={selectedCategory === 'ALL' ? '$accent' : '$border'}
              px="$4"
              py="$2.5"
              br="$3"
              ai="center"
              gap="$2"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setSelectedCategory('ALL')}
              cursor="pointer"
            >
              <TamaguiText
                fontSize={13}
                fontWeight="600"
                color={selectedCategory === 'ALL' ? '#fff' : '$text'}
              >
                All
              </TamaguiText>
              <YStack
                bg={selectedCategory === 'ALL' ? 'rgba(255,255,255,0.25)' : '$bg3'}
                px="$2"
                py="$0.5"
                br="$2"
                minWidth={24}
                ai="center"
              >
                <TamaguiText
                  fontSize={11}
                  fontWeight="700"
                  color={selectedCategory === 'ALL' ? '#fff' : '$text3'}
                >
                  {categoryCounts.ALL}
                </TamaguiText>
              </YStack>
            </XStack>

            {/* Strategic Button */}
            <XStack
              bg={selectedCategory === 'STRATEGIC' ? '$accent' : '$bg2'}
              bw={1}
              bc={selectedCategory === 'STRATEGIC' ? '$accent' : '$border'}
              px="$4"
              py="$2.5"
              br="$3"
              ai="center"
              gap="$2"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setSelectedCategory('STRATEGIC')}
              cursor="pointer"
            >
              <YStack
                w={10}
                h={10}
                br={5}
                backgroundColor={selectedCategory === 'STRATEGIC' ? '#fff' : colors.accent}
              />
              <TamaguiText
                fontSize={13}
                fontWeight="600"
                color={selectedCategory === 'STRATEGIC' ? '#fff' : '$text'}
              >
                Strategic
              </TamaguiText>
              <YStack
                bg={selectedCategory === 'STRATEGIC' ? 'rgba(255,255,255,0.25)' : '$bg3'}
                px="$2"
                py="$0.5"
                br="$2"
                minWidth={24}
                ai="center"
              >
                <TamaguiText
                  fontSize={11}
                  fontWeight="700"
                  color={selectedCategory === 'STRATEGIC' ? '#fff' : '$text3'}
                >
                  {categoryCounts.STRATEGIC}
                </TamaguiText>
              </YStack>
            </XStack>

            {/* Core Button */}
            <XStack
              bg={selectedCategory === 'CORE' ? colors.teal : '$bg2'}
              bw={1}
              bc={selectedCategory === 'CORE' ? colors.teal : '$border'}
              px="$4"
              py="$2.5"
              br="$3"
              ai="center"
              gap="$2"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setSelectedCategory('CORE')}
              cursor="pointer"
            >
              <YStack
                w={10}
                h={10}
                br={5}
                backgroundColor={selectedCategory === 'CORE' ? '#fff' : colors.teal}
              />
              <TamaguiText
                fontSize={13}
                fontWeight="600"
                color={selectedCategory === 'CORE' ? '#fff' : '$text'}
              >
                Core
              </TamaguiText>
              <YStack
                bg={selectedCategory === 'CORE' ? 'rgba(255,255,255,0.25)' : '$bg3'}
                px="$2"
                py="$0.5"
                br="$2"
                minWidth={24}
                ai="center"
              >
                <TamaguiText
                  fontSize={11}
                  fontWeight="700"
                  color={selectedCategory === 'CORE' ? '#fff' : '$text3'}
                >
                  {categoryCounts.CORE}
                </TamaguiText>
              </YStack>
            </XStack>

            {/* Support Button */}
            <XStack
              bg={selectedCategory === 'SUPPORT' ? colors.orange : '$bg2'}
              bw={1}
              bc={selectedCategory === 'SUPPORT' ? colors.orange : '$border'}
              px="$4"
              py="$2.5"
              br="$3"
              ai="center"
              gap="$2"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setSelectedCategory('SUPPORT')}
              cursor="pointer"
            >
              <YStack
                w={10}
                h={10}
                br={5}
                backgroundColor={selectedCategory === 'SUPPORT' ? '#fff' : colors.orange}
              />
              <TamaguiText
                fontSize={13}
                fontWeight="600"
                color={selectedCategory === 'SUPPORT' ? '#fff' : '$text'}
              >
                Support
              </TamaguiText>
              <YStack
                bg={selectedCategory === 'SUPPORT' ? 'rgba(255,255,255,0.25)' : '$bg3'}
                px="$2"
                py="$0.5"
                br="$2"
                minWidth={24}
                ai="center"
              >
                <TamaguiText
                  fontSize={11}
                  fontWeight="700"
                  color={selectedCategory === 'SUPPORT' ? '#fff' : '$text3'}
                >
                  {categoryCounts.SUPPORT}
                </TamaguiText>
              </YStack>
            </XStack>
          </XStack>
        </YStack>

        {/* Major Functions */}
        {filteredMajorFunctions.length === 0 ? (
          <YStack
            bg="$bg2"
            br="$4"
            bw={1}
            bc="$border"
            p="$5"
            ai="center"
          >
            <SvgIcon name="alertCircle" size={48} color={colors.text3} mb="$3" />
            <TamaguiText fontSize={14} color="$text3" textAlign="center">
              No {selectedCategory.toLowerCase()} functions found
            </TamaguiText>
          </YStack>
        ) : (
          filteredMajorFunctions.map((mf) => {
          const isExpanded = expandedSections.includes(mf.id);
          const categoryColor = getCategoryColor(mf.category);

          return (
            <YStack
              key={mf.id}
              bg="$bg2"
              br="$4"
              bw={1}
              bc="$border"
              mb="$3"
              overflow="hidden"
            >
              {/* Accordion Header */}
              <XStack
                p="$4"
                ai="center"
                jc="space-between"
                pressStyle={{ opacity: 0.7 }}
                onPress={() => toggleSection(mf.id)}
                cursor="pointer"
              >
                <XStack f={1} ai="center" gap="$3">
                  <YStack
                    w={12}
                    h={12}
                    br={6}
                    backgroundColor={categoryColor}
                  />
                  <YStack f={1}>
                    <TamaguiText fontSize={15} fontWeight="600" color="$text" mb={2}>
                      {mf.title}
                    </TamaguiText>
                    <TamaguiText fontSize={12} color="$text3">
                      {mf.category} • Weight: {(mf.weight * 100)}%
                    </TamaguiText>
                  </YStack>
                </XStack>
                <SvgIcon
                  name={isExpanded ? 'chevronUp' : 'chevronDown'}
                  size={20}
                  color={colors.text3}
                />
              </XStack>

              {/* Accordion Content */}
              {isExpanded && (
                <YStack
                  btw={1}
                  btc="$border"
                  p="$4"
                  gap="$3"
                  bg="$bg2"
                >
                  {mf.successIndicators.map((si, index) => {
                    const linkedCount = countLinkedIPCRs(si.id, ipcrs);
                    
                    return (
                      <YStack
                        key={si.id}
                        bg="$bg3"
                        br="$3"
                        p="$3.5"
                      >
                        {/* Indicator Header */}
                        <XStack jc="space-between" ai="center" mb="$2">
                          <TamaguiText
                            fontSize={12}
                            fontWeight="700"
                            color="$accent"
                            textTransform="uppercase"
                          >
                            {si.code}
                          </TamaguiText>
                          <XStack
                            bg="$bg"
                            px="$2.5"
                            py="$1"
                            br="$3"
                          >
                            <TamaguiText fontSize={11} fontWeight="600" color="$text3">
                              {si.timeline}
                            </TamaguiText>
                          </XStack>
                        </XStack>

                        <TamaguiText fontSize={14} color="$text" mb="$2.5" lineHeight={20}>
                          {si.description}
                        </TamaguiText>
                        
                        {/* Measures */}
                        <XStack mb="$3">
                          <TamaguiText fontSize={12} fontWeight="600" color="$text3" mr="$2">
                            Measures:
                          </TamaguiText>
                          <TamaguiText fontSize={12} color="$text2" f={1}>
                            {si.measures}
                          </TamaguiText>
                        </XStack>

                        {/* Required Ratings */}
                        {si.requiredRatings && si.requiredRatings.length > 0 && (
                          <XStack mb="$3" gap="$2" flexWrap="wrap">
                            <TamaguiText fontSize={12} fontWeight="600" color="$text3">
                              Required Ratings:
                            </TamaguiText>
                            {si.requiredRatings.map((rating) => (
                              <XStack
                                key={rating}
                                bg={`${categoryColor}20`}
                                px="$2"
                                py="$1"
                                br="$1.5"
                                ai="center"
                              >
                                <TamaguiText fontSize={11} fontWeight="600" color={categoryColor}>
                                  {rating === 'Q' ? 'Quality' : rating === 'E' ? 'Efficiency' : 'Timeliness'}
                                </TamaguiText>
                              </XStack>
                            ))}
                          </XStack>
                        )}

                        {/* Progress */}
                        <YStack mb="$3">
                          <XStack jc="space-between" ai="center" mb="$2">
                            <TamaguiText fontSize={12} fontWeight="600" color="$text3" f={1}>
                              Progress
                            </TamaguiText>
                            <TamaguiText fontSize={12} fontWeight="600" color="$text" mr="$2">
                              {si.actualValue} / {si.targetValue}
                            </TamaguiText>
                            <TamaguiText fontSize={14} fontWeight="700" color="$accent">
                              {si.percentAccomplished}%
                            </TamaguiText>
                          </XStack>
                          <ProgressBar
                            percent={si.percentAccomplished}
                            color={categoryColor}
                            height={8}
                          />
                        </YStack>

                        {/* Accountable */}
                        <XStack mb="$2">
                          <TamaguiText fontSize={12} fontWeight="600" color="$text3" mr="$2">
                            Accountable:
                          </TamaguiText>
                          <TamaguiText fontSize={12} color="$text2" f={1}>
                            {si.accountableUnits}
                          </TamaguiText>
                        </XStack>

                        {/* Linked IPCRs */}
                        <XStack
                          ai="center"
                          gap="$2"
                          pt="$2"
                          btw={1}
                          btc="$border"
                        >
                          <SvgIcon name="link" size={16} color={colors.accent} />
                          <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                            Linked IPCRs: {linkedCount}
                          </TamaguiText>
                        </XStack>
                      </YStack>
                    );
                  })}
                </YStack>
              )}
            </YStack>
          );
        })
        )}
      </ScrollView>
    </YStack>
  );
}
