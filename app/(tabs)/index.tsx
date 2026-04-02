import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Platform, Image } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AppModal from '../../components/AppModal';
import CircularProgress from '../../components/CircularProgress';
import { useAuth } from '../_layout';

type Task = {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  due_date: string | null;
  category: string;
  created_at: string;
};

export default function DashboardScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const { session, signOut } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (session) {
        fetchTasks();
        fetchProfile();
      } else {
        setTasks([]);
        setAvatarUrl(null);
        setUsername(null);
        setLoading(false);
      }
    }, [session])
  );

  async function fetchProfile() {
    if (!session) return;
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', session.user.id)
      .single();
    if (data) {
      setAvatarUrl(data.avatar_url || null);
      setUsername(data.username || null);
    }
  }

  async function fetchTasks() {
    if (!session) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }

  async function performSignOut() {
    setLogoutVisible(false);
    // signOut from AuthContext: sets session=null IMMEDIATELY,
    // then _layout.tsx useEffect detects !session && isProtected → redirects to '/'
    await signOut();
  }

  async function toggleTask(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (!error) {
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    }
  }

  function handleTaskOptions(task: Task) {
    setSelectedTask(task);
    setMenuVisible(true);
  }

  async function performDelete() {
    if (!selectedTask) return;
    const { error } = await supabase.from('tasks').delete().eq('id', selectedTask.id);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== selectedTask.id));
      setMenuVisible(false);
    }
  }

  async function performPostpone() {
    if (!selectedTask) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { error } = await supabase
      .from('tasks')
      .update({ due_date: tomorrow.toISOString() })
      .eq('id', selectedTask.id);

    if (!error) {
       setMenuVisible(false);
       fetchTasks();
    }
  }

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const productivityPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Task Options Modal */}
      <AppModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={selectedTask?.title}
        options={[
          { 
            text: 'Modifier', 
            icon: 'create-outline', 
            onPress: () => {
              setMenuVisible(false);
              router.push(`/add-task?id=${selectedTask?.id}`);
            } 
          },
          { 
            text: 'Reporter à demain', 
            icon: 'time-outline', 
            onPress: performPostpone 
          },
          { 
            text: 'Supprimer', 
            icon: 'trash-outline', 
            style: 'destructive', 
            onPress: performDelete 
          },
          { 
            text: 'Annuler', 
            style: 'cancel', 
            onPress: () => setMenuVisible(false) 
          },
        ]}
      />

      {/* Logout Modal */}
      <AppModal
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        centered={true}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter de votre sanctuaire ?"
        options={[
          { 
            text: 'Se déconnecter', 
            icon: 'log-out-outline', 
            style: 'destructive', 
            onPress: performSignOut 
          },
          { 
            text: 'Annuler', 
            style: 'cancel', 
            onPress: () => setLogoutVisible(false) 
          },
        ]}
      />

      {/* Header Shell */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-clear-outline" size={24} color="#635979" />
          <Text style={styles.greeting}>{username ? `Bonjour ${username} !` : 'Bonjour !'}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => session ? setLogoutVisible(true) : router.push('/')}
          style={styles.profileButton}
        >
          {session && avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
          ) : (
            <Ionicons 
              name={session ? "person-circle" : "log-in-outline"} 
              size={32} 
              color={session ? "#6f48b2" : "#635979"} 
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Date Header */}
        <Text style={styles.dateLabel}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        </Text>

        {/* Productivity Widget (Bento Style) */}
        <View style={styles.productivityWidget}>
          <View>
            <Text style={styles.widgetTitle}>Flux quotidien</Text>
            <Text style={styles.widgetStats}>
              {productivityPercent}% <Text style={{ color: '#8b5000' }}>Productif</Text>
            </Text>
            <Text style={styles.widgetSubtext}>
              {productivityPercent > 50 ? "Belle progression !" : "On continue !"}
            </Text>
          </View>
          <CircularProgress percentage={productivityPercent} size={80} strokeWidth={8} />
        </View>

        {/* Stream Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Votre flux</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        {/* Tasks Content */}
        <View style={styles.taskContainer}>
          {loading ? (
            <Text style={styles.emptyText}>Chargement...</Text>
          ) : tasks.length === 0 ? (
            <Text style={styles.emptyText}>Rien dans votre flux. C'est l'heure de créer !</Text>
          ) : (
            tasks.map((item) => (
              <View key={item.id} style={styles.taskCard}>
                <TouchableOpacity onPress={() => toggleTask(item)} style={styles.checkboxContainer}>
                  <View style={[styles.checkbox, item.status === 'completed' && styles.checkboxActive]}>
                    {item.status === 'completed' && <Ionicons name="checkmark" size={14} color="white" />}
                  </View>
                  {item.status === 'completed' && <View style={styles.checkboxGlow} />}
                </TouchableOpacity>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, item.status === 'completed' && styles.taskTitleCompleted]}>
                    {item.title}
                  </Text>
                  <View style={styles.taskFooter}>
                    <Ionicons name="time-outline" size={12} color="#49454d" />
                    <Text style={styles.taskTime}>
                      {item.category || 'Général'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleTaskOptions(item)} style={styles.moreButton}>
                  <Ionicons name="ellipsis-vertical" size={20} color="rgba(73, 69, 77, 0.4)" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => {
          console.log('FAB pressed, navigating to /add-task');
          router.push('/add-task');
        }}
      >
        <View style={styles.fabGradient} />
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf9f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fcf9f8',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1b1c1c',
  },
  profileButton: {
    padding: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#6f48b2',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  dateLabel: {
    color: '#635979',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 24,
    opacity: 0.8,
  },
  productivityWidget: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#635979',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#49454d',
    marginBottom: 4,
  },
  widgetStats: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1b1c1c',
    letterSpacing: -1,
  },
  widgetSubtext: {
    fontSize: 14,
    color: '#49454d',
    marginTop: 4,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: '#f6f3f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b1c1c',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
    color: '#635979',
  },
  taskContainer: {
    gap: 16,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#635979',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  checkboxContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cac4cd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#6f48b2',
    borderColor: '#6f48b2',
  },
  checkboxGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(111, 72, 178, 0.1)',
    zIndex: -1,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1b1c1c',
    lineHeight: 22,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#cac4cd',
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  taskTime: {
    fontSize: 12,
    color: '#49454d',
    fontWeight: '500',
  },
  moreButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(255, 152, 0, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 20,
    zIndex: 999,
    overflow: 'hidden',
  },
  fabGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ff9800',
    opacity: 0.9,
  },
  emptyText: {
    textAlign: 'center',
    color: '#635979',
    marginTop: 40,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.6,
  },
});
