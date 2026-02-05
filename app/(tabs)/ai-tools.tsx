import React, { useState, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetch } from "expo/fetch";
import { getApiUrl } from "@/lib/query-client";
import * as Haptics from "expo-haptics";

type AITool = 'description' | 'adCopy' | 'price' | 'campaign';

interface ToolConfig {
  key: AITool;
  icon: string;
  endpoint: string;
  fields: { key: string; label: string; placeholder: string; multiline?: boolean }[];
}

const tools: ToolConfig[] = [
  {
    key: 'description',
    icon: 'text-box-outline',
    endpoint: '/api/ai/generate-description',
    fields: [
      { key: 'productName', label: 'productName', placeholder: 'Product name...' },
      { key: 'category', label: 'category', placeholder: 'Category...' },
    ],
  },
  {
    key: 'adCopy',
    icon: 'bullhorn-outline',
    endpoint: '/api/ai/generate-ad-copy',
    fields: [
      { key: 'productName', label: 'productName', placeholder: 'Product name...' },
      { key: 'price', label: 'price', placeholder: 'Price...' },
      { key: 'offer', label: 'offer', placeholder: 'Offer details...' },
    ],
  },
  {
    key: 'price',
    icon: 'currency-usd',
    endpoint: '/api/ai/suggest-price',
    fields: [
      { key: 'productName', label: 'productName', placeholder: 'Product name...' },
      { key: 'description', label: 'description', placeholder: 'Description...', multiline: true },
      { key: 'category', label: 'category', placeholder: 'Category...' },
    ],
  },
  {
    key: 'campaign',
    icon: 'rocket-launch-outline',
    endpoint: '/api/ai/campaign-ideas',
    fields: [
      { key: 'productName', label: 'productName', placeholder: 'Product name...' },
      { key: 'targetAudience', label: 'targetAudience', placeholder: 'Target audience...', multiline: true },
    ],
  },
];

function ToolCard({ 
  tool, 
  isActive, 
  onPress, 
  isRTL, 
  t 
}: { 
  tool: ToolConfig; 
  isActive: boolean;
  onPress: () => void;
  isRTL: boolean;
  t: any;
}) {
  const labels: Record<AITool, string> = {
    description: t.generateDescription,
    adCopy: t.generateAdCopy,
    price: t.suggestPrice,
    campaign: t.campaignIdeas,
  };

  return (
    <Pressable 
      style={[styles.toolCard, isActive && styles.toolCardActive]}
      onPress={onPress}
    >
      <View style={[styles.toolIcon, isActive && styles.toolIconActive]}>
        <MaterialCommunityIcons 
          name={tool.icon as any} 
          size={24} 
          color={isActive ? Colors.text : Colors.primary} 
        />
      </View>
      <Text 
        style={[
          styles.toolLabel, 
          isActive && styles.toolLabelActive,
          { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }
        ]}
        numberOfLines={2}
      >
        {labels[tool.key]}
      </Text>
    </Pressable>
  );
}

export default function AIToolsScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL, language } = useLanguage();
  const [activeTool, setActiveTool] = useState<AITool>('description');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeToolConfig = tools.find(t => t.key === activeTool)!;

  const handleGenerate = async () => {
    if (isGenerating) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setResult('');

    abortControllerRef.current = new AbortController();

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}${activeToolConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          ...formData,
          language,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to generate');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;
              setResult(fullContent);
            }
          } catch {}
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setResult(language === 'ar' ? 'حدث خطأ، يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToolChange = (tool: AITool) => {
    if (isGenerating) {
      abortControllerRef.current?.abort();
    }
    setActiveTool(tool);
    setFormData({});
    setResult('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: topPadding + 20 }]}>
        <Text style={[styles.title, { fontFamily: isRTL ? 'Cairo_700Bold' : 'Inter_700Bold', textAlign: isRTL ? 'right' : 'left' }]}>{t.aiTools}</Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.toolsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {tools.map((tool) => (
            <ToolCard
              key={tool.key}
              tool={tool}
              isActive={activeTool === tool.key}
              onPress={() => handleToolChange(tool.key)}
              isRTL={isRTL}
              t={t}
            />
          ))}
        </ScrollView>

        <View style={styles.formContainer}>
          {activeToolConfig.fields.map((field) => (
            <View key={field.key}>
              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>
                {(t as any)[field.label] || field.label}
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  field.multiline && styles.textArea,
                  { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }
                ]}
                value={formData[field.key] || ''}
                onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textMuted}
                multiline={field.multiline}
                numberOfLines={field.multiline ? 3 : 1}
              />
            </View>
          ))}

          <Pressable 
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color={Colors.text} />
                <Text style={[styles.generateButtonText, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold', marginLeft: 8 }]}>
                  {t.generating}
                </Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="auto-fix" size={20} color={Colors.text} />
                <Text style={[styles.generateButtonText, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold', marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
                  {t.generate}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {result ? (
          <View style={styles.resultContainer}>
            <View style={[styles.resultHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
              <Text style={[styles.resultLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold', marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
                {t.result}
              </Text>
            </View>
            <Text style={[styles.resultText, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>
              {result}
            </Text>
          </View>
        ) : null}
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
  toolsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  toolCard: {
    width: 100,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolCardActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  toolIconActive: {
    backgroundColor: Colors.primary,
  },
  toolLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  toolLabelActive: {
    color: Colors.primary,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  resultContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: Colors.primary,
  },
  resultText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
});
