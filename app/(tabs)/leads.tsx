import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, ActivityIndicator, TextInput, Modal, Alert, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, FontAwesome } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  productId: number | null;
  source: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: Colors.primary,
  contacted: Colors.secondary,
  qualified: Colors.warning,
  converted: Colors.success,
  lost: Colors.error,
};

const sourceIcons: Record<string, string> = {
  landing_page: 'globe-outline',
  whatsapp: 'logo-whatsapp',
  social_media: 'share-social-outline',
  referral: 'people-outline',
};

function LeadCard({ 
  lead, 
  isRTL, 
  onEdit, 
  onDelete,
  onWhatsApp,
  t,
}: { 
  lead: Lead;
  isRTL: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onWhatsApp: () => void;
  t: any;
}) {
  return (
    <View style={styles.leadCard}>
      <View style={[styles.leadHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.leadAvatar}>
          <Text style={styles.leadAvatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={[styles.leadInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
          <Text style={[styles.leadName, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold', textAlign: isRTL ? 'right' : 'left' }]}>{lead.name}</Text>
          <Text style={[styles.leadPhone, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular' }]}>{lead.phone}</Text>
          {lead.email && (
            <Text style={[styles.leadEmail, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular' }]}>{lead.email}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (statusColors[lead.status] || Colors.textMuted) + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[lead.status] || Colors.textMuted, fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }]}>
            {lead.status}
          </Text>
        </View>
      </View>
      
      <View style={[styles.leadMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.sourceBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Ionicons name={sourceIcons[lead.source] as any || 'ellipse'} size={14} color={Colors.textSecondary} />
          <Text style={[styles.sourceText, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}>
            {lead.source.replace('_', ' ')}
          </Text>
        </View>
        <Text style={[styles.dateText, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular' }]}>
          {new Date(lead.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      {lead.notes && (
        <Text style={[styles.leadNotes, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
          {lead.notes}
        </Text>
      )}
      
      <View style={[styles.leadActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable style={[styles.whatsappButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={onWhatsApp}>
          <FontAwesome name="whatsapp" size={16} color={Colors.text} />
          <Text style={[styles.whatsappButtonText, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}>
            {t.messageOnWhatsApp}
          </Text>
        </Pressable>
        <View style={styles.actionButtons}>
          <Pressable style={styles.actionButton} onPress={onEdit}>
            <Feather name="edit-2" size={16} color={Colors.secondary} />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={onDelete}>
            <Feather name="trash-2" size={16} color={Colors.error} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function LeadsScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL, language } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'landing_page',
    status: 'new',
    notes: '',
  });
  
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('POST', '/api/leads', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      setModalVisible(false);
      resetForm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const res = await apiRequest('PUT', `/api/leads/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setModalVisible(false);
      resetForm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      source: 'landing_page',
      status: 'new',
      notes: '',
    });
    setEditingLead(null);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || '',
      source: lead.source,
      status: lead.status,
      notes: lead.notes || '',
    });
    setModalVisible(true);
  };

  const handleDelete = (lead: Lead) => {
    Alert.alert(
      t.delete,
      `${t.delete} "${lead.name}"?`,
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.delete, style: 'destructive', onPress: () => deleteMutation.mutate(lead.id) },
      ]
    );
  };

  const handleWhatsApp = (lead: Lead) => {
    const phone = lead.phone.replace(/\D/g, '');
    const message = language === 'ar' 
      ? `مرحباً ${lead.name}، نتواصل معك من تاجر برو`
      : `Hello ${lead.name}, we're reaching out from TagerPro`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredLeads = leads?.filter(lead => 
    filterStatus === 'all' || lead.status === filterStatus
  ) || [];

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const statuses = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: topPadding + 20, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.title, { fontFamily: isRTL ? 'Cairo_700Bold' : 'Inter_700Bold' }]}>{t.leads}</Text>
        <Pressable 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons name="add" size={24} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterScroll}
        contentContainerStyle={[styles.filterContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        {statuses.map((status) => (
          <Pressable
            key={status}
            style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }]}>
              {status === 'all' ? t.all : status}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              isRTL={isRTL}
              onEdit={() => handleEdit(lead)}
              onDelete={() => handleDelete(lead)}
              onWhatsApp={() => handleWhatsApp(lead)}
              t={t}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
            <Text style={[styles.emptyText, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular' }]}>{t.noLeads}</Text>
            <Pressable 
              style={styles.emptyButton}
              onPress={() => {
                resetForm();
                setModalVisible(true);
              }}
            >
              <Text style={[styles.emptyButtonText, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold' }]}>{t.addLead}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { fontFamily: isRTL ? 'Cairo_700Bold' : 'Inter_700Bold' }]}>
                {editingLead ? t.editLead : t.addLead}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.name}</Text>
              <TextInput
                style={[styles.input, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t.name}
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.phone}</Text>
              <TextInput
                style={[styles.input, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="+1234567890"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.email}</Text>
              <TextInput
                style={[styles.input, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="email@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.source}</Text>
              <View style={[styles.sourceOptions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {['landing_page', 'whatsapp', 'social_media', 'referral'].map((source) => (
                  <Pressable
                    key={source}
                    style={[styles.sourceOption, formData.source === source && styles.sourceOptionActive]}
                    onPress={() => setFormData({ ...formData, source })}
                  >
                    <Ionicons 
                      name={sourceIcons[source] as any} 
                      size={18} 
                      color={formData.source === source ? Colors.primary : Colors.textMuted} 
                    />
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.status}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.statusOptions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {['new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
                    <Pressable
                      key={status}
                      style={[styles.statusOption, formData.status === status && { backgroundColor: statusColors[status] + '20', borderColor: statusColors[status] }]}
                      onPress={() => setFormData({ ...formData, status })}
                    >
                      <Text style={[styles.statusOptionText, formData.status === status && { color: statusColors[status] }, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }]}>
                        {status}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              
              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.notes}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder={t.notes}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </ScrollView>
            
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold' }]}>{t.cancel}</Text>
              </Pressable>
              <Pressable 
                style={[styles.saveButton, (!formData.name || !formData.phone) && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!formData.name || !formData.phone || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <Text style={[styles.saveButtonText, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold' }]}>{t.save}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: Colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    maxHeight: 48,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  leadCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  leadHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  leadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    color: Colors.text,
  },
  leadPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  leadEmail: {
    fontSize: 12,
    color: Colors.textMuted,
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
  leadMeta: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceBadge: {
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  leadNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  leadActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: Colors.whatsapp,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  whatsappButtonText: {
    fontSize: 13,
    color: Colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 34,
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    color: Colors.text,
  },
  formScroll: {
    padding: 20,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
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
  sourceOptions: {
    gap: 12,
  },
  sourceOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceOptionActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  statusOptions: {
    gap: 8,
    marginTop: 4,
  },
  statusOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusOptionText: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: Colors.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 15,
    color: Colors.text,
  },
});
