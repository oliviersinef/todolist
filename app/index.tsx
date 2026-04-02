import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '../lib/supabase';
import AppModal from '../components/AppModal';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title?: string; message: string; style?: any; onConfirm?: () => void } | null>(null);
  const router = useRouter();

  function showAlert(message: string, isSuccess = false, onConfirm?: () => void) {
    setAlertConfig({
      visible: true,
      title: isSuccess ? 'Succès !' : 'Oups...',
      message,
      style: isSuccess ? 'success' : 'destructive',
      onConfirm: onConfirm || (() => setAlertConfig(null))
    });
  }

  async function handleAuth() {
    if (!email || !password) return showAlert('Veuillez remplir tous les champs');
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showAlert(error.message);
    }
    setLoading(false);
  }



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppModal 
        visible={!!alertConfig?.visible}
        onClose={() => setAlertConfig(null)}
        title={alertConfig?.title}
        message={alertConfig?.message}
        options={[
          { 
            text: 'OK', 
            icon: alertConfig?.style === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
            style: alertConfig?.style,
            onPress: alertConfig?.onConfirm || (() => setAlertConfig(null))
          }
        ]}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.logo}>Todo Clarity</Text>
          <Text style={styles.subtitle}>Bon retour dans votre sanctuaire</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#7E57C2"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#7E57C2"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Chargement...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/signup')}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Pas encore de compte ? Créer un compte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.backButtonText}>← Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf9f8',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#635979',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7E57C2',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#1b1c1c',
    shadowColor: '#635979',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  button: {
    backgroundColor: '#d1c4e9',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#635979',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#1b1c1c',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#635979',
    fontSize: 14,
    fontWeight: '600',
  },
});
