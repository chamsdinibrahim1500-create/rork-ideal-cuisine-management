import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Minus, Package, X, Edit3, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/Card';
import { SearchBar } from '@/components/SearchBar';
import { FilterBar } from '@/components/FilterBar';
import { EmptyState } from '@/components/EmptyState';
import { PermissionGate } from '@/components/PermissionGate';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors as colorConstants } from '@/constants/colors';

export default function StockScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { stockItems, updateStockItem, addStockItem, deleteStockItem } = useData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: '0',
    minQuantity: '5',
    unit: 'unité',
    category: '',
  });
  const [editProduct, setEditProduct] = useState({
    name: '',
    quantity: '0',
    minQuantity: '5',
    unit: 'unité',
    category: '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const filterOptions = [
    { key: 'all', label: t('all') },
    { key: 'available', label: t('available'), color: colorConstants.status.completed },
    { key: 'low', label: t('lowStock'), color: colorConstants.status.paused },
    { key: 'out_of_stock', label: t('outOfStock'), color: colorConstants.status.inProgress },
  ];

  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stockItems, search, statusFilter]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = stockItems.find(i => i.id === itemId);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + delta);
      updateStockItem(itemId, { quantity: newQuantity });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) return;

    await addStockItem({
      name: newProduct.name.trim(),
      quantity: parseInt(newProduct.quantity) || 0,
      minQuantity: parseInt(newProduct.minQuantity) || 5,
      unit: newProduct.unit,
      category: newProduct.category || 'Général',
    });

    setNewProduct({
      name: '',
      quantity: '0',
      minQuantity: '5',
      unit: 'unité',
      category: '',
    });
    setShowAddModal(false);
  };

  const handleEditItem = (itemId: string) => {
    const item = stockItems.find(i => i.id === itemId);
    if (!item) return;

    setEditingItem(itemId);
    setEditProduct({
      name: item.name,
      quantity: item.quantity.toString(),
      minQuantity: item.minQuantity.toString(),
      unit: item.unit,
      category: item.category,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editProduct.name.trim()) return;

    await updateStockItem(editingItem, {
      name: editProduct.name.trim(),
      quantity: parseInt(editProduct.quantity) || 0,
      minQuantity: parseInt(editProduct.minQuantity) || 5,
      unit: editProduct.unit,
      category: editProduct.category || 'Général',
    });

    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    Alert.alert(t('delete'), `${t('confirm')} "${itemName}"?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => deleteStockItem(itemId),
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return colorConstants.status.completed;
      case 'low':
        return colorConstants.status.paused;
      case 'out_of_stock':
        return colorConstants.status.inProgress;
      default:
        return colors.textMuted;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('stock')}</Text>
            <PermissionGate permission="addStock">
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={[styles.addButton, { backgroundColor: colors.primary }]}
              >
                <Plus size={22} color={colors.primaryText} />
              </TouchableOpacity>
            </PermissionGate>
          </View>

          <View style={styles.searchContainer}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('search')}
            />
          </View>

          <View style={styles.filterContainer}>
            <FilterBar
              options={filterOptions}
              selected={statusFilter}
              onSelect={setStatusFilter}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
          >
            {filteredItems.length === 0 ? (
              <EmptyState
                icon={<Package size={32} color={colors.textMuted} />}
                title={t('noItems')}
                action={
                  hasPermission('addStock') ? (
                    <Button
                      title={t('addProduct')}
                      onPress={() => setShowAddModal(true)}
                      size="medium"
                    />
                  ) : undefined
                }
              />
            ) : (
              filteredItems.map((item) => (
                <Card key={item.id} style={styles.stockCard}>
                  <View style={styles.stockRow}>
                    <View style={styles.stockInfo}>
                      <View style={styles.stockHeader}>
                        <Text style={[styles.stockName, { color: colors.text }]}>
                          {item.name}
                        </Text>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(item.status) },
                          ]}
                        />
                      </View>
                      <Text style={[styles.stockCategory, { color: colors.textSecondary }]}>
                        {item.category}
                      </Text>
                    </View>

                    <View style={styles.quantitySection}>
                      <PermissionGate permission="editStock">
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(item.id, -1)}
                          style={[styles.quantityBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                          <Minus size={16} color={colors.text} />
                        </TouchableOpacity>
                      </PermissionGate>

                      <View style={[styles.quantityDisplay, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.quantityText, { color: colors.text }]}>
                          {item.quantity}
                        </Text>
                        <Text style={[styles.unitText, { color: colors.textMuted }]}>
                          {item.unit}
                        </Text>
                      </View>

                      <PermissionGate permission="editStock">
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(item.id, 1)}
                          style={[styles.quantityBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                          <Plus size={16} color={colors.text} />
                        </TouchableOpacity>
                      </PermissionGate>
                    </View>
                  </View>

                  <PermissionGate permission="editStock">
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        onPress={() => handleEditItem(item.id)}
                        style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                      >
                        <Edit3 size={16} color={colors.text} />
                        <Text style={[styles.actionText, { color: colors.text }]}>{t('edit')}</Text>
                      </TouchableOpacity>
                      <PermissionGate permission="deleteStock">
                        <TouchableOpacity
                          onPress={() => handleDeleteItem(item.id, item.name)}
                          style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                        >
                          <Trash2 size={16} color={colors.status.inProgress} />
                          <Text style={[styles.actionText, { color: colors.status.inProgress }]}>{t('delete')}</Text>
                        </TouchableOpacity>
                      </PermissionGate>
                    </View>
                  </PermissionGate>
                </Card>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('addProduct')}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Input
                label={t('productName')}
                value={newProduct.name}
                onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                placeholder="Ex: Four à pizza"
              />

              <Input
                label={t('quantity')}
                value={newProduct.quantity}
                onChangeText={(text) => setNewProduct({ ...newProduct, quantity: text })}
                keyboardType="numeric"
                placeholder="0"
              />

              <Input
                label={t('category')}
                value={newProduct.category}
                onChangeText={(text) => setNewProduct({ ...newProduct, category: text })}
                placeholder="Ex: Équipement"
              />

              <Button
                title={t('save')}
                onPress={handleAddProduct}
                size="large"
                style={styles.saveButton}
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('edit')} {t('productName')}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Input
                label={t('productName')}
                value={editProduct.name}
                onChangeText={(text) => setEditProduct({ ...editProduct, name: text })}
                placeholder="Ex: Four à pizza"
              />

              <Input
                label={t('quantity')}
                value={editProduct.quantity}
                onChangeText={(text) => setEditProduct({ ...editProduct, quantity: text })}
                keyboardType="numeric"
                placeholder="0"
              />

              <Input
                label={t('category')}
                value={editProduct.category}
                onChangeText={(text) => setEditProduct({ ...editProduct, category: text })}
                placeholder="Ex: Équipement"
              />

              <Button
                title={t('save')}
                onPress={handleSaveEdit}
                size="large"
                style={styles.saveButton}
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterContainer: {
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  stockCard: {
    marginBottom: 12,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockInfo: {
    flex: 1,
    marginRight: 16,
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stockCategory: {
    fontSize: 13,
    marginTop: 4,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quantityDisplay: {
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  unitText: {
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  modalContainer: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});
