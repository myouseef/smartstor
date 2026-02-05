import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import * as Haptics from "expo-haptics";

function SettingItem({ 
  icon, 
  iconColor,
  label, 
  value,
  onPress,
  isRTL,
  showArrow = true,
  rightElement,
}: { 
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isRTL: boolean;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <Pressable 
      style={[styles.settingItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIconContainer, { backgroundColor: iconColor + '20' }]}>
        {icon}
      </View>
      <View style={[styles.settingContent, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 14, marginRight: isRTL ? 14 : 0 }]}>
        <Text style={[styles.settingLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }]}>{label}</Text>
        {value && <Text style={[styles.settingValue, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular' }]}>{value}</Text>}
      </View>
      {rightElement || (showArrow && (
        <Ionicons 
          name={isRTL ? "chevron-back" : "chevron-forward"} 
          size={20} 
          color={Colors.textMuted} 
        />
      ))}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL, language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: topPadding + 20 }]}>
        <Text style={[styles.title, { fontFamily: isRTL ? 'Cairo_700Bold' : 'Inter_700Bold', textAlign: isRTL ? 'right' : 'left' }]}>{t.settings}</Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold', textAlign: isRTL ? 'right' : 'left' }]}>
            {t.language}
          </Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Ionicons name="language" size={20} color={Colors.secondary} />}
              iconColor={Colors.secondary}
              label={t.language}
              value={language === 'en' ? t.english : t.arabic}
              onPress={toggleLanguage}
              isRTL={isRTL}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold', textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'التطبيق' : 'App'}
          </Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<MaterialCommunityIcons name="rocket-launch-outline" size={20} color={Colors.primary} />}
              iconColor={Colors.primary}
              label="TagerPro"
              value={language === 'ar' ? 'الإصدار 1.0.0' : 'Version 1.0.0'}
              isRTL={isRTL}
              showArrow={false}
            />
            <View style={styles.divider} />
            <SettingItem
              icon={<Feather name="info" size={20} color={Colors.warning} />}
              iconColor={Colors.warning}
              label={language === 'ar' ? 'عن التطبيق' : 'About'}
              isRTL={isRTL}
            />
            <View style={styles.divider} />
            <SettingItem
              icon={<Ionicons name="help-circle-outline" size={20} color={Colors.success} />}
              iconColor={Colors.success}
              label={language === 'ar' ? 'المساعدة' : 'Help & Support'}
              isRTL={isRTL}
            />
          </View>
        </View>

        <View style={styles.brandingContainer}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.brandingLogo}
          >
            <MaterialCommunityIcons name="rocket-launch-outline" size={32} color={Colors.text} />
          </LinearGradient>
          <Text style={[styles.brandingName, { fontFamily: isRTL ? 'Cairo_700Bold' : 'Inter_700Bold' }]}>TagerPro</Text>
          <Text style={[styles.brandingTagline, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular' }]}>
            {t.marketingPlatform}
          </Text>
        </View>

        <View style={styles.languageToggle}>
          <Pressable 
            style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLanguage('en');
            }}
          >
            <Text style={[styles.languageOptionText, language === 'en' && styles.languageOptionTextActive, { fontFamily: 'Inter_600SemiBold' }]}>
              English
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.languageOption, language === 'ar' && styles.languageOptionActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLanguage('ar');
            }}
          >
            <Text style={[styles.languageOptionText, language === 'ar' && styles.languageOptionTextActive, { fontFamily: 'Cairo_600SemiBold' }]}>
              العربية
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    padding: 16,
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  settingValue: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 70,
  },
  brandingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 20,
  },
  brandingLogo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandingName: {
    fontSize: 24,
    color: Colors.text,
    marginBottom: 4,
  },
  brandingTagline: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    marginTop: 20,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  languageOptionActive: {
    backgroundColor: Colors.primary,
  },
  languageOptionText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  languageOptionTextActive: {
    color: Colors.text,
  },
});
