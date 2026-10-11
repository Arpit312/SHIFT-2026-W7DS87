import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert, ScrollView, StyleSheet } from 'react-native';
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

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSignup = async () => {
    if (!email || !password || !fullName || !phone || !societyName || !flatNumber) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName, phone, role: 'EV_OWNER', society_name: societyName, flat_number: flatNumber },
      },
    });
    setIsLoading(false);
    if (error) {
      Alert.alert('Signup failed', error.message);
    } else {
      Alert.alert('Success', 'Account created successfully! Please log in.');
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.container}>
          <View style={s.logoWrap}>
            <Image source={require('../../assets/images/logo-themed.jpg')} style={{ width: 200, height: 100 }} resizeMode="contain" />
          </View>

          <View style={s.card}>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>Sign up as an EV Owner to request charging</Text>

            <Text style={s.label}>Full Name</Text>
            <TextInput style={s.input} placeholder="John Doe" placeholderTextColor={C.textMuted} value={fullName} onChangeText={setFullName} />

            <Text style={s.label}>Email</Text>
            <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={C.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={s.label}>Phone Number</Text>
            <TextInput style={s.input} placeholder="+91 9876543210" placeholderTextColor={C.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={s.label}>Society Name</Text>
            <TextInput style={s.input} placeholder="Sunrise Apartments" placeholderTextColor={C.textMuted} value={societyName} onChangeText={setSocietyName} />

            <Text style={s.label}>Flat Number</Text>
            <TextInput style={s.input} placeholder="A-101" placeholderTextColor={C.textMuted} value={flatNumber} onChangeText={setFlatNumber} />

            <Text style={s.label}>Password</Text>
            <TextInput style={s.input} placeholder="••••••••" placeholderTextColor={C.textMuted} value={password} onChangeText={setPassword} secureTextEntry />

            <TouchableOpacity onPress={onSignup} disabled={isLoading} style={[s.btn, isLoading && { opacity: 0.7 }]}>
              {isLoading ? <ActivityIndicator color="white" /> : <Text style={s.btnText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={{ color: C.textMuted }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={{ color: C.brandOrange, fontWeight: '600' }}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scrollContent: { padding: 16, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
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
  btn: { backgroundColor: C.brandOrange, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
