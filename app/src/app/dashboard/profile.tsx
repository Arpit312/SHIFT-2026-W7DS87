import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { LogOut, User as UserIcon } from 'lucide-react-native';

const C = {
  background: '#0A0A0B',
  surface: '#111113',
  border: '#2A2A2F',
  textPrimary: '#F4F1EA',
  textMuted: '#A3A3AD',
  danger: '#EF4444',
};

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <View style={s.container}>
      <View style={s.avatarSection}>
        <View style={s.avatar}>
          <UserIcon size={48} color={C.textMuted} />
        </View>
        <Text style={s.name}>EV Owner</Text>
        <Text style={s.email}>user@example.com</Text>
      </View>

      <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
        <LogOut size={20} color={C.danger} />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, padding: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: C.surface,
    borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  name: { color: C.textPrimary, fontSize: 20, fontWeight: '700' },
  email: { color: C.textMuted, marginTop: 4 },
  logoutBtn: {
    marginTop: 'auto', backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)', paddingVertical: 16, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  logoutText: { color: C.danger, fontWeight: '700', fontSize: 18 },
});
