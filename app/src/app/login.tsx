import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogIn, ShieldCheck } from 'lucide-react-native';

import { AppScreen, BrandLogo, Card, FeatureRow, Pill, PrimaryButton } from '../components/charge-ui';
import { ChargeColors as C, ChargeSpacing as S } from '../constants/charge-theme';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Email and password dono required hain.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setIsLoading(false);

    if (error) {
      Alert.alert('Login failed', error.message);
      return;
    }

    router.replace('/dashboard');
  };

  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <BrandLogo size={58} />
            <Pill label="Owner / RWA access" tone="info" />
          </View>

          <Card style={styles.form}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Request, safety check aur billing dashboard yahin se continue karo.</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={C.textMuted}
              style={styles.input}
              value={email}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={C.textMuted}
              secureTextEntry
              style={styles.input}
              value={password}
            />

            <TouchableOpacity
              activeOpacity={0.82}
              disabled={isLoading}
              onPress={onLogin}
              style={[styles.submit, isLoading && { opacity: 0.65 }]}>
              {isLoading ? <ActivityIndicator color={C.white} /> : <LogIn size={18} color={C.white} />}
              <Text style={styles.submitText}>Sign in</Text>
            </TouchableOpacity>
          </Card>

          <Card>
            <FeatureRow
              color={C.green}
              icon={ShieldCheck}
              title="Safe access"
              subtitle="Your request packets, AI check results and bills stay in one place."
            />
            <PrimaryButton label="Create new account" variant="secondary" onPress={() => router.push('/signup')} />
          </Card>
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: S.lg,
    gap: S.lg,
  },
  logoWrap: {
    alignItems: 'center',
    gap: S.sm,
  },
  form: {
    gap: S.md,
  },
  title: {
    color: C.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: C.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: S.sm,
  },
  label: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    color: C.text,
    paddingHorizontal: S.md,
    fontSize: 15,
  },
  submit: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: S.sm,
    marginTop: S.sm,
  },
  submitText: {
    color: C.white,
    fontWeight: '900',
    fontSize: 15,
  },
});

