import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '../lib/supabase';
import AppModal from '../components/AppModal';

export default function SignupScreen() {
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

  async function handleSignup() {
    if (!email || !password) return showAlert('Veuillez remplir tous les champs');
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      showAlert(error.message);
    } else {
      showAlert('Consultez votre email pour confirmer votre compte !', true, () => {
        setAlertConfig(null);
        router.back();
      });
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'Créer un compte', headerTintColor: '#7E57C2' }} />
      
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
          <Text style={styles.subtitle}>Créez votre sanctuaire de productivité</Text>
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
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Chargement...' : 'Créer mon compte'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Déjà un compte ? Se connecter</Text>
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
});
