import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const C = {
  background: '#0A0A0B',
  surface: '#111113',
  border: '#2A2A2F',
  textPrimary: '#F4F1EA',
  textMuted: '#A3A3AD',
  brandOrange: '#FF7A1A',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      Alert.alert('Login failed', error.message);
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.logoWrap}>
          <Image source={require('../../assets/images/logo-themed.jpg')} style={{ width: 200, height: 100 }} resizeMode="contain" />
        </View>

        <View style={s.card}>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to your account to continue</Text>

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={C.textMuted}
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor={C.textMuted}
            value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity onPress={onLogin} disabled={isLoading} style={[s.btn, isLoading && { opacity: 0.7 }]}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={{ color: C.textMuted }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={{ color: C.brandOrange, fontWeight: '600' }}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center', padding: 16 },
  container: { width: '100%', maxWidth: 400 },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 24 },
  title: { color: C.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: C.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  label: { color: C.textPrimary, fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: C.background, borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, color: C.textPrimary, marginBottom: 16,
  },
  btn: {
    backgroundColor: C.brandOrange, paddingVertical: 14, borderRadius: 8,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
