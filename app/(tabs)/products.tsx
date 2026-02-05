import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, ActivityIndicator, TextInput, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/query-client";
import * as Haptics from "expo-haptics";

interface Product {
  id: number;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  price: string;
  originalPrice: string | null;
  image: string | null;
  offer: string | null;
  status: string;
  createdAt: string;
}

function ProductCard({ 
  product, 
  isRTL, 
  onEdit, 
  onDelete 
}: { 
  product: Product;
  isRTL: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  
  return (
    <View style={styles.productCard}>
      <View style={[styles.productHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.productIcon}>
          <Ionicons name="cube" size={24} color={Colors.primary} />
        </View>
        <View style={[styles.productInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
          <Text style={[styles.productName, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold', textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL && product.nameAr ? product.nameAr : product.name}
          </Text>
          <Text style={[styles.productPrice, { fontFamily: isRTL ? 'Cairo_700Bold' : 'Inter_700Bold' }]}>
            ${product.price}
            {product.originalPrice && (
              <Text style={styles.originalPrice}> ${product.originalPrice}</Text>
            )}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: product.status === 'active' ? Colors.success + '20' : Colors.textMuted + '20' }]}>
          <Text style={[styles.statusText, { color: product.status === 'active' ? Colors.success : Colors.textMuted, fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }]}>
            {product.status === 'active' ? t.active : t.inactive}
          </Text>
        </View>
      </View>
      
      {(product.description || product.descriptionAr) && (
        <Text style={[styles.productDescription, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
          {isRTL && product.descriptionAr ? product.descriptionAr : product.description}
        </Text>
      )}
      
      {product.offer && (
        <View style={[styles.offerBadge, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Ionicons name="pricetag" size={12} color={Colors.warning} />
          <Text style={[styles.offerText, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }]}>{product.offer}</Text>
        </View>
      )}
      
      <View style={[styles.productActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable style={styles.actionButton} onPress={onEdit}>
          <Feather name="edit-2" size={16} color={Colors.secondary} />
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onDelete}>
          <Feather name="trash-2" size={16} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL, language } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    price: '',
    originalPrice: '',
    description: '',
    descriptionAr: '',
    offer: '',
    status: 'active',
  });
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('POST', '/api/products', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      setModalVisible(false);
      resetForm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const res = await apiRequest('PUT', `/api/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setModalVisible(false);
      resetForm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      price: '',
      originalPrice: '',
      description: '',
      descriptionAr: '',
      offer: '',
      status: 'active',
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      nameAr: product.nameAr || '',
      price: product.price,
      originalPrice: product.originalPrice || '',
      description: product.description || '',
      descriptionAr: product.descriptionAr || '',
      offer: product.offer || '',
      status: product.status,
    });
    setModalVisible(true);
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      t.delete,
      `${t.delete} "${product.name}"?`,
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.delete, style: 'destructive', onPress: () => deleteMutation.mutate(product.id) },
      ]
    );
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: topPadding + 20, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.title, { fontFamily: isRTL ? 'Cairo_700Bold' : 'Inter_700Bold' }]}>{t.products}</Text>
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
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : products && products.length > 0 ? (
          products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              isRTL={isRTL}
              onEdit={() => handleEdit(product)}
              onDelete={() => handleDelete(product)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={Colors.textMuted} />
            <Text style={[styles.emptyText, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular' }]}>{t.noProducts}</Text>
            <Pressable 
              style={styles.emptyButton}
              onPress={() => {
                resetForm();
                setModalVisible(true);
              }}
            >
              <Text style={[styles.emptyButtonText, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold' }]}>{t.addProduct}</Text>
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
                {editingProduct ? t.editProduct : t.addProduct}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.name} (EN)</Text>
              <TextInput
                style={[styles.input, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t.name}
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.name} (AR)</Text>
              <TextInput
                style={[styles.input, { fontFamily: 'Cairo_400Regular', textAlign: 'right' }]}
                value={formData.nameAr}
                onChangeText={(text) => setFormData({ ...formData, nameAr: text })}
                placeholder="الاسم بالعربية"
                placeholderTextColor={Colors.textMuted}
              />
              
              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.price}</Text>
              <TextInput
                style={[styles.input, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />

              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.originalPrice}</Text>
              <TextInput
                style={[styles.input, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}
                value={formData.originalPrice}
                onChangeText={(text) => setFormData({ ...formData, originalPrice: text })}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
              
              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.description} (EN)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder={t.description}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.description} (AR)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { fontFamily: 'Cairo_400Regular', textAlign: 'right' }]}
                value={formData.descriptionAr}
                onChangeText={(text) => setFormData({ ...formData, descriptionAr: text })}
                placeholder="الوصف بالعربية"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />
              
              <Text style={[styles.inputLabel, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>{t.offer}</Text>
              <TextInput
                style={[styles.input, { fontFamily: isRTL ? 'Cairo_400Regular' : 'Inter_400Regular', textAlign: isRTL ? 'right' : 'left' }]}
                value={formData.offer}
                onChangeText={(text) => setFormData({ ...formData, offer: text })}
                placeholder="e.g. 20% OFF"
                placeholderTextColor={Colors.textMuted}
              />

              <View style={styles.statusToggle}>
                <Pressable 
                  style={[styles.statusOption, formData.status === 'active' && styles.statusOptionActive]}
                  onPress={() => setFormData({ ...formData, status: 'active' })}
                >
                  <Text style={[styles.statusOptionText, formData.status === 'active' && styles.statusOptionTextActive, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }]}>{t.active}</Text>
                </Pressable>
                <Pressable 
                  style={[styles.statusOption, formData.status === 'inactive' && styles.statusOptionActive]}
                  onPress={() => setFormData({ ...formData, status: 'inactive' })}
                >
                  <Text style={[styles.statusOptionText, formData.status === 'inactive' && styles.statusOptionTextActive, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_500Medium' }]}>{t.inactive}</Text>
                </Pressable>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { fontFamily: isRTL ? 'Cairo_600SemiBold' : 'Inter_600SemiBold' }]}>{t.cancel}</Text>
              </Pressable>
              <Pressable 
                style={[styles.saveButton, (!formData.name || !formData.price) && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!formData.name || !formData.price || createMutation.isPending || updateMutation.isPending}
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
  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  productHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    color: Colors.text,
  },
  productPrice: {
    fontSize: 18,
    color: Colors.primary,
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
  },
  productDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  offerText: {
    fontSize: 12,
    color: Colors.warning,
  },
  productActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    gap: 12,
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
  statusToggle: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusOptionActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  statusOptionTextActive: {
    color: Colors.primary,
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
