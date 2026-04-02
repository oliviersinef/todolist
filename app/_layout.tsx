import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, createContext, useContext } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { supabase } from '../lib/supabase';

import { useColorScheme } from '@/hooks/use-color-scheme';

const AuthContext = createContext<{
  session: any;
  signOut: () => Promise<void>;
}>({
  session: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth event:', _event, !!session);
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setSession(null);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.log('SignOut error (ignored):', e);
    }
    // Stay on dashboard — user can browse in guest mode
  };

  useEffect(() => {
    if (!initialized) return;

    const inAddTask = segments[0] === 'add-task';
    const isLoginPage = segments[0] === 'index' || segments[0] === undefined;
    const isSignupPage = segments[0] === 'signup';

    // Only protect add-task (requires login)
    if (!session && inAddTask) {
      router.replace('/');
    }
    // Redirect logged-in users away from login/signup screens
    else if (session && (isLoginPage || isSignupPage)) {
      router.replace('/(tabs)');
    }
  }, [session, segments, initialized]);

  return (
    <AuthContext.Provider value={{ session, signOut }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ title: 'Inscription', headerShown: false }} />
          <Stack.Screen name="add-task" options={{ title: 'Tâche', presentation: 'modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthContext.Provider>
  );
}
