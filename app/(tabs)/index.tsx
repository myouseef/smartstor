import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";

interface Analytics {
  totalVisits: number;
  totalLeads: number;
  totalProducts: number;
  conversionRate: number;
  recentLeads: Array<{
    id: number;
    name: string;
    phone: string;
    status: string;
    createdAt: string;
  }>;
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color,
  isRTL,
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  color: string;
  isRTL: boolean;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: isRTL ? 0 : 3, borderRightWidth: isRTL ? 3 : 0, borderRightColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { fontFamily: isRTL ? 'Cairo_700Bold' : 'Inter_700Bold' }]}>{value}</Text>
      <Text style={[styles.statLabel, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular' }]}>{label}</Text>
    </View>
  );
}

function RecentLeadItem({ 
  lead, 
  isRTL 
}: { 
  lead: Analytics['recentLeads'][0];
  isRTL: boolean;
}) {
  const statusColors: Record<string, string> = {
    new: Colors.primary,
    contacted: Colors.secondary,
    qualified: Colors.warning,
    converted: Colors.success,
    lost: Colors.error,
  };

  return (
    <View style={[styles.leadItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.leadAvatar}>
        <Text style={styles.leadAvatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={[styles.leadInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
        <Text style={[styles.leadName, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold' }]}>{lead.name}</Text>
        <Text style={[styles.leadPhone, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular' }]}>{lead.phone}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: (statusColors[lead.status] || Colors.textMuted) + '20' }]}>
        <Text style={[styles.statusText, { color: statusColors[lead.status] || Colors.textMuted, fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }]}>
          {lead.status}
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics'],
  });

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 20, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.greeting, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>{t.welcome}</Text>
            <Text style={[styles.title, { fontFamily: isRTL ? 'Cairo_700Bold' : 'Inter_700Bold', textAlign: isRTL ? 'right' : 'left' }]}>TagerPro</Text>
          </View>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.logo}
            >
              <MaterialCommunityIcons name="rocket-launch-outline" size={24} color={Colors.text} />
            </LinearGradient>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                icon={<Ionicons name="cube" size={20} color={Colors.primary} />}
                label={t.totalProducts}
                value={analytics?.totalProducts || 0}
                color={Colors.primary}
                isRTL={isRTL}
              />
              <StatCard
                icon={<Ionicons name="people" size={20} color={Colors.secondary} />}
                label={t.totalLeads}
                value={analytics?.totalLeads || 0}
                color={Colors.secondary}
                isRTL={isRTL}
              />
              <StatCard
                icon={<Ionicons name="trending-up" size={20} color={Colors.success} />}
                label={t.conversion}
                value={`${analytics?.conversionRate || 0}%`}
                color={Colors.success}
                isRTL={isRTL}
              />
              <StatCard
                icon={<Ionicons name="eye" size={20} color={Colors.warning} />}
                label={t.visits}
                value={analytics?.totalVisits || 0}
                color={Colors.warning}
                isRTL={isRTL}
              />
            </View>

            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.sectionTitle, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold' }]}>{t.recentLeads}</Text>
              <Pressable onPress={() => router.push('/leads')}>
                <Text style={[styles.viewAllText, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }]}>{t.viewAll}</Text>
              </Pressable>
            </View>

            <View style={styles.leadsContainer}>
              {analytics?.recentLeads && analytics.recentLeads.length > 0 ? (
                analytics.recentLeads.map((lead) => (
                  <RecentLeadItem key={lead.id} lead={lead} isRTL={isRTL} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
                  <Text style={[styles.emptyText, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular' }]}>{t.noLeads}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 28,
    color: Colors.text,
    marginTop: 4,
  },
  logoContainer: {
    width: 48,
    height: 48,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
  },
  leadsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  leadItem: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leadAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 15,
    color: Colors.text,
  },
  leadPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },
});
