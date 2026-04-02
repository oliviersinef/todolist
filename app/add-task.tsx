import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AppModal from '../components/AppModal';

const categories = ['Travail', 'Personnel', 'Santé', 'Finance', 'Loisirs'];

export default function AddTaskScreen() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Travail');
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title?: string; message: string; style?: any; onConfirm?: () => void } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchTask(id as string);
    }
  }, [id]);

  async function fetchTask(taskId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!error && data) {
      setTitle(data.title);
      setCategory(data.category || 'Travail');
    }
  }

  function showAlert(message: string, isSuccess = false, onConfirm?: () => void) {
    setAlertConfig({
      visible: true,
      title: isSuccess ? 'Succès !' : 'Oups...',
      message,
      style: isSuccess ? 'success' : 'destructive',
      onConfirm: onConfirm || (() => setAlertConfig(null))
    });
  }

  async function saveTask() {
    if (!title) return showAlert('Veuillez entrer un titre');
    
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      showAlert('Non connecté');
      return;
    }

    const taskData = {
      title,
      category,
      user_id: userData.user.id,
      status: 'pending' as const,
    };

    let error;
    if (id) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ title, category })
        .eq('id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert([taskData]);
      error = insertError;
    }

    if (error) {
      showAlert(error.message);
    } else {
      showAlert(id ? 'Tâche mise à jour !' : 'Tâche ajoutée avec succès !', true, () => {
        setAlertConfig(null);
        router.back();
      });
    }
    setLoading(false);
  }

  async function deleteTask() {
    if (!id) return;
    
    setAlertConfig({
      visible: true,
      title: 'Supprimer',
      message: 'Voulez-vous vraiment supprimer cette tâche ?',
      style: 'destructive',
      onConfirm: async () => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) showAlert(error.message);
        else {
          setAlertConfig(null);
          router.back();
        }
      }
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: id ? 'Modifier la tâche' : 'Nouvelle Tâche',
        headerTintColor: '#7E57C2',
        headerStyle: { backgroundColor: '#fcf9f8' },
        headerTitleStyle: { color: '#635979', fontWeight: '700' },
        headerRight: id ? () => (
          <TouchableOpacity onPress={deleteTask}>
            <Ionicons name="trash-outline" size={24} color="#ba1a1a" />
          </TouchableOpacity>
        ) : undefined
      }} />

      <AppModal 
        visible={!!alertConfig?.visible}
        onClose={() => setAlertConfig(null)}
        centered={true}
        title={alertConfig?.title}
        message={alertConfig?.message}
        options={[
          { 
            text: alertConfig?.title === 'Supprimer' ? 'Supprimer' : 'OK', 
            icon: alertConfig?.style === 'success' ? 'checkmark-circle-outline' : alertConfig?.title === 'Supprimer' ? 'trash-outline' : 'alert-circle-outline',
            style: alertConfig?.style,
            onPress: alertConfig?.onConfirm || (() => setAlertConfig(null))
          },
          ...(alertConfig?.title === 'Supprimer' ? [{
            text: 'Annuler',
            style: 'cancel' as const,
            onPress: () => setAlertConfig(null)
          }] : [])
        ]}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Qu'avez-vous à faire ?</Text>
          <TextInput
            style={styles.input}
            placeholder="Titre de la tâche"
            placeholderTextColor="#cac4cd"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.chipContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, loading && { opacity: 0.7 }]} 
          onPress={saveTask}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>{id ? 'Mettre à jour' : 'Créer la tâche'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf9f8',
  },
  content: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#635979',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    color: '#1b1c1c',
    shadowColor: '#635979',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eaddff',
  },
  chipActive: {
    backgroundColor: '#d1c4e9',
    borderColor: '#d1c4e9',
  },
  chipText: {
    color: '#7E57C2',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#1b1c1c',
  },
  saveButton: {
    backgroundColor: '#ff9800',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#ff9800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
