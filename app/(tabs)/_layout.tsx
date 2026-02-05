import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import React from "react";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const tabBarHeight = 60 + (Platform.OS === 'web' ? 34 : insets.bottom);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: Colors.surface,
            web: Colors.surface,
          }),
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium',
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.dashboard,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t.products,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: t.leads,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-tools"
        options={{
          title: t.aiTools,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
