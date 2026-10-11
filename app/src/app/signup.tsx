import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardTypeOptions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';

import { AppHeader, AppScreen, Card, Pill, PrimaryButton } from '../components/charge-ui';
import { ChargeColors as C, ChargeSpacing as S } from '../constants/charge-theme';
import { supabase } from '../lib/supabase';

type SignupField = {
  key: 'fullName' | 'email' | 'phone' | 'societyName' | 'flatNumber';
  label: string;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
};

const fields: SignupField[] = [
  { key: 'fullName', label: 'Full name', placeholder: 'Arpit Pathak' },
  { key: 'email', label: 'Email', placeholder: 'you@example.com', keyboardType: 'email-address' },
  { key: 'phone', label: 'Phone', placeholder: '+91 9876543210', keyboardType: 'phone-pad' },
  { key: 'societyName', label: 'Society', placeholder: 'Sunrise Apartments' },
  { key: 'flatNumber', label: 'Flat / parking', placeholder: 'A-101 / P2-17' },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    societyName: '',
    flatNumber: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSignup = async () => {
    const missing = Object.values(form).some((value) => !value.trim());
    if (missing) {
      Alert.alert('Missing details', 'Saare fields fill karo taaki request packet ready ho sake.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          role: 'EV_OWNER',
          society_name: form.societyName.trim(),
          flat_number: form.flatNumber.trim(),
        },
      },
    });
    setIsLoading(false);

    if (error) {
      Alert.alert('Signup failed', error.message);
      return;
    }

    Alert.alert('Account created', 'Ab login karke apna first charging request start karo.');
    router.replace('/login');
  };

  return (
    <AppScreen>
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Create account" subtitle="Owner profile for NOC, safety and billing" showLogo />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <View style={styles.topLine}>
              <Pill label="EV Owner" tone="good" />
              <Text style={styles.stepText}>1 of 1</Text>
            </View>

            {fields.map((field) => (
              <View key={field.key} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                  keyboardType={field.keyboardType}
                  onChangeText={(value) => updateField(field.key, value)}
                  placeholder={field.placeholder}
                  placeholderTextColor={C.textMuted}
                  style={styles.input}
                  value={form[field.key]}
                />
              </View>
            ))}

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                onChangeText={(value) => updateField('password', value)}
                placeholder="Create password"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                style={styles.input}
                value={form.password}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              disabled={isLoading}
              onPress={onSignup}
              style={[styles.submit, isLoading && { opacity: 0.65 }]}>
              {isLoading ? <ActivityIndicator color={C.white} /> : <UserPlus size={18} color={C.white} />}
              <Text style={styles.submitText}>Create account</Text>
            </TouchableOpacity>
          </Card>

          <PrimaryButton label="I already have an account" variant="secondary" onPress={() => router.push('/login')} />
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
    padding: S.lg,
    paddingBottom: 36,
    gap: S.lg,
  },
  card: {
    gap: S.md,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S.xs,
  },
  stepText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  field: {
    gap: S.xs,
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

