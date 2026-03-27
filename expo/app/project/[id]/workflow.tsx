import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Plus,
  Trash2,
  GripVertical,
  X,
  ChevronDown,
  Users,
  Check,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PermissionGate } from '@/components/PermissionGate';

export default function WorkflowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { employees } = useAuth();
  const { getProjectById, addWorkflowStage, deleteWorkflowStage, addTask } = useData();

  const project = getProjectById(id || '');

  const [showAddStage, setShowAddStage] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  if (!project) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Project not found
        </Text>
      </View>
    );
  }

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    await addWorkflowStage(project.id, newStageName.trim());
    setNewStageName('');
    setShowAddStage(false);
  };

  const handleDeleteStage = (stageId: string) => {
    Alert.alert(t('delete'), t('confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => deleteWorkflowStage(project.id, stageId),
      },
    ]);
  };

  const handleAddTask = async () => {
    if (!newTaskDescription.trim() || !selectedStageId) return;

    await addTask(project.id, selectedStageId, {
      description: newTaskDescription.trim(),
      status: 'pending',
      assignedTo: selectedAssignees,
    });

    setNewTaskDescription('');
    setSelectedAssignees([]);
    setShowAddTask(false);
    setSelectedStageId(null);
  };

  const openAddTask = (stageId: string) => {
    setSelectedStageId(stageId);
    setShowAddTask(true);
  };

  const toggleAssignee = (employeeId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('workflow'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {project.workflow.map((stage, index) => (
          <View key={stage.id}>
            <Card style={styles.stageCard}>
              <View style={styles.stageHeader}>
                <View style={styles.stageLeft}>
                  <GripVertical size={18} color={colors.textMuted} />
                  <View style={[styles.stageNumber, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.stageNumberText, { color: colors.primaryText }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stageName, { color: colors.text }]}>
                    {stage.name}
                  </Text>
                </View>
                <View style={styles.stageActions}>
                  <TouchableOpacity
                    onPress={() => openAddTask(stage.id)}
                    style={[styles.stageBtn, { backgroundColor: colors.surface }]}
                  >
                    <Plus size={16} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteStage(stage.id)}
                    style={[styles.stageBtn, { backgroundColor: colors.surface }]}
                  >
                    <Trash2 size={16} color={colors.status.inProgress} />
                  </TouchableOpacity>
                </View>
              </View>

              {stage.tasks.length > 0 && (
                <View style={[styles.tasksList, { borderTopColor: colors.borderLight }]}>
                  {stage.tasks.map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      onPress={() => router.push(`/task/${task.id}`)}
                      style={[styles.taskRow, { borderBottomColor: colors.borderLight }]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.taskNumber, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.taskNumberText, { color: colors.text }]}>
                          {task.number}
                        </Text>
                      </View>
                      <Text style={[styles.taskDescription, { color: colors.text }]} numberOfLines={2}>
                        {task.description}
                      </Text>
                      <StatusBadge status={task.status} size="small" showLabel={false} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>

            {index < project.workflow.length - 1 && (
              <View style={styles.arrowContainer}>
                <View style={[styles.arrowLine, { backgroundColor: colors.border }]} />
                <ChevronDown size={20} color={colors.border} />
              </View>
            )}
          </View>
        ))}

        <Button
          title={t('addStage')}
          onPress={() => setShowAddStage(true)}
          variant="outline"
          size="large"
          icon={<Plus size={18} color={colors.text} />}
          style={styles.addStageBtn}
        />
      </ScrollView>

      <Modal
        visible={showAddStage}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddStage(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('addStage')}
              </Text>
              <TouchableOpacity onPress={() => setShowAddStage(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Input
                label={t('stageName')}
                value={newStageName}
                onChangeText={setNewStageName}
                placeholder="Ex: Installation"
              />

              <Button
                title={t('save')}
                onPress={handleAddStage}
                size="large"
                style={styles.modalButton}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showAddTask}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddTask(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('createTask')}
              </Text>
              <TouchableOpacity onPress={() => setShowAddTask(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Input
                label={t('taskDescription')}
                value={newTaskDescription}
                onChangeText={setNewTaskDescription}
                placeholder="Ex: Installer les équipements"
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.assignLabel, { color: colors.text }]}>
                {t('assignTo')}
              </Text>
              <Card style={styles.assigneesList}>
                {employees.map((employee) => (
                  <TouchableOpacity
                    key={employee.id}
                    onPress={() => toggleAssignee(employee.id)}
                    style={[styles.assigneeRow, { borderBottomColor: colors.borderLight }]}
                  >
                    <View style={styles.assigneeInfo}>
                      <View style={[styles.assigneeAvatar, { backgroundColor: colors.surface }]}>
                        <Users size={14} color={colors.textMuted} />
                      </View>
                      <Text style={[styles.assigneeName, { color: colors.text }]}>
                        {employee.name}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: selectedAssignees.includes(employee.id)
                            ? colors.primary
                            : 'transparent',
                          borderColor: selectedAssignees.includes(employee.id)
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      {selectedAssignees.includes(employee.id) && (
                        <Check size={12} color={colors.primaryText} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </Card>

              <Button
                title={t('save')}
                onPress={handleAddTask}
                size="large"
                style={styles.modalButton}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  stageCard: {
    padding: 0,
    overflow: 'hidden',
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  stageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  stageNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumberText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  stageName: {
    fontSize: 15,
    fontWeight: '500' as const,
    flex: 1,
  },
  stageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  stageBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasksList: {
    borderTopWidth: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 50,
    borderBottomWidth: 1,
    gap: 12,
  },
  taskNumber: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskNumberText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  taskDescription: {
    flex: 1,
    fontSize: 14,
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  arrowLine: {
    width: 2,
    height: 12,
  },
  addStageBtn: {
    marginTop: 16,
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
  modalButton: {
    marginTop: 24,
  },
  assignLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  assigneesList: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 16,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
  },
  assigneeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assigneeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeName: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
