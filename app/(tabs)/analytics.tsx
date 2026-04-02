import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

type Task = {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  created_at: string;
};

export default function AnalyticsScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  async function fetchStats() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false });

    if (!error) {
      setTasks(data || []);
    }
    setLoading(false);
  }

  // Calculate metrics
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  // Last 7 days chart data (mocked distribution based on real tasks)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayTasks = tasks.filter(t => new Date(t.created_at).toDateString() === d.toDateString());
    return Math.min(dayTasks.length * 20, 100); // Scale for UI height
  });

  // Streak (mocked simple logic)
  const streak = tasks.length > 0 ? 3 : 0; 

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Productivité',
        headerTintColor: '#7E57C2',
        headerStyle: { backgroundColor: '#fcf9f8' },
        headerTitleStyle: { color: '#635979', fontWeight: '700' },
      }} />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color="#7E57C2" size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Taux de réussite : {completionRate}%</Text>
            <View style={styles.chartPlaceholder}>
               {last7Days.map((h, i) => (
                 <View key={i} style={[styles.bar, { height: Math.max(h, 5) }, i === 6 && styles.barHighlight]} />
               ))}
            </View>
            <Text style={styles.statValue}>Derniers 7 jours</Text>
          </View>

          <View style={styles.grid}>
            <View style={styles.miniCard}>
              <Ionicons name="flame-outline" size={24} color="#ff9800" />
              <Text style={styles.miniCardValue}>{streak} jours</Text>
              <Text style={styles.miniCardLabel}>Série</Text>
            </View>
            <View style={styles.miniCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#7E57C2" />
              <Text style={styles.miniCardValue}>{completedTasks.length}</Text>
              <Text style={styles.miniCardLabel}>Tâches finies</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Historique Récent</Text>
          {completedTasks.slice(0, 5).map((task) => (
            <View key={task.id} style={styles.historyItem}>
              <View style={styles.dot} />
              <View>
                <Text style={styles.historyTitle}>{task.title}</Text>
                <Text style={styles.historyTime}>Terminé</Text>
              </View>
            </View>
          ))}
          {completedTasks.length === 0 && (
            <Text style={styles.emptyText}>Aucune tâche terminée récemment.</Text>
          )}
        </ScrollView>
      )}
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
  statCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#635979',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#635979',
    marginBottom: 20,
  },
  chartPlaceholder: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  bar: {
    width: 12,
    backgroundColor: '#eaddff',
    borderRadius: 6,
  },
  barHighlight: {
    backgroundColor: '#ff9800',
  },
  statValue: {
    fontSize: 14,
    color: '#7E57C2',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#635979',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  miniCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1c1c',
    marginVertical: 4,
  },
  miniCardLabel: {
    fontSize: 12,
    color: '#7E57C2',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#635979',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9800',
  },
  historyTitle: {
    fontSize: 14,
    color: '#1b1c1c',
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 12,
    color: '#7E57C2',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7E57C2',
    marginTop: 40,
    fontSize: 14,
  },
});
