import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, Image, Platform, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import AppModal from '../../components/AppModal';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Modal
  const [modal, setModal] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    style?: 'destructive' | 'success' | 'cancel' | 'default';
  }>({ visible: false });

  useEffect(() => {
    if (session) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [session]);

  async function fetchProfile() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setUsername(data.username || '');
      setAvatarUrl(data.avatar_url || null);
    }
    if (error && error.code !== 'PGRST116') {
      console.error('Profile fetch error:', error);
    }
    setLoading(false);
  }

  async function updateProfile() {
    if (!session) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        username,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);
    if (error) {
      showModal('Erreur', error.message, 'destructive');
    } else {
      showModal('Succès', 'Profil mis à jour avec succès !', 'success');
    }
  }

  async function changePassword() {
    if (!newPassword || !confirmPassword) {
      return showModal('Erreur', 'Veuillez remplir les deux champs', 'destructive');
    }
    if (newPassword !== confirmPassword) {
      return showModal('Erreur', 'Les mots de passe ne correspondent pas', 'destructive');
    }
    if (newPassword.length < 6) {
      return showModal('Erreur', 'Le mot de passe doit contenir au moins 6 caractères', 'destructive');
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      showModal('Erreur', error.message, 'destructive');
    } else {
      setNewPassword('');
      setConfirmPassword('');
      showModal('Succès', 'Mot de passe modifié avec succès !', 'success');
    }
  }

  async function pickAndUploadAvatar() {
    if (!session) return;

    // For web: use a file input
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSaving(true);
        const fileExt = file.name.split('.').pop();
        const filePath = `${session.user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          showModal('Erreur', uploadError.message, 'destructive');
          setSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl + '?t=' + Date.now();

        await supabase.from('profiles').upsert({
          id: session.user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

        setAvatarUrl(publicUrl);
        setSaving(false);
        showModal('Succès', 'Photo de profil mise à jour !', 'success');
      };
      input.click();
    }
  }

  function showModal(title: string, message: string, style: 'destructive' | 'success' | 'cancel' | 'default') {
    setModal({ visible: true, title, message, style });
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.guestContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#cac4cd" />
          <Text style={styles.guestTitle}>Connexion requise</Text>
          <Text style={styles.guestSubtitle}>
            Connectez-vous pour accéder à vos paramètres
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/')}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.guestContainer}>
          <ActivityIndicator size="large" color="#6f48b2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <AppModal
        visible={modal.visible}
        onClose={() => setModal({ visible: false })}
        centered={true}
        title={modal.title}
        message={modal.message}
        options={[{
          text: 'OK',
          icon: modal.style === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
          style: modal.style as any,
          onPress: () => setModal({ visible: false }),
        }]}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAndUploadAvatar} style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#cac4cd" />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toucher pour changer la photo</Text>
          <Text style={styles.emailText}>{session.user.email}</Text>
        </View>

        {/* Username Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre nom d'utilisateur"
              placeholderTextColor="#9e9e9e"
              value={username}
              onChangeText={setUsername}
            />
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={updateProfile}
            disabled={saving}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
            <Text style={styles.saveButtonText}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9e9e9e"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9e9e9e"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
          <TouchableOpacity
            style={[styles.passwordButton, saving && styles.buttonDisabled]}
            onPress={changePassword}
            disabled={saving}
          >
            <Ionicons name="key-outline" size={20} color="#6f48b2" />
            <Text style={styles.passwordButtonText}>
              {saving ? 'Modification...' : 'Changer le mot de passe'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color="#e53935" />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf9f8',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fcf9f8',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1b1c1c',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  // Guest
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1b1c1c',
    marginTop: 8,
  },
  guestSubtitle: {
    fontSize: 15,
    color: '#635979',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#6f48b2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#6f48b2',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0ecf6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e0d6f0',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6f48b2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fcf9f8',
  },
  avatarHint: {
    fontSize: 13,
    color: '#9e9e9e',
    fontWeight: '500',
  },
  emailText: {
    fontSize: 14,
    color: '#635979',
    fontWeight: '600',
    marginTop: 4,
  },
  // Sections
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#635979',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1c1c',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#635979',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f8f5fc',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#1b1c1c',
    borderWidth: 1.5,
    borderColor: '#e8e0f4',
  },
  saveButton: {
    backgroundColor: '#6f48b2',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  passwordButton: {
    backgroundColor: 'rgba(111, 72, 178, 0.08)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(111, 72, 178, 0.2)',
  },
  passwordButtonText: {
    color: '#6f48b2',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 57, 53, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 57, 53, 0.15)',
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#e53935',
    fontSize: 15,
    fontWeight: '600',
  },
});
