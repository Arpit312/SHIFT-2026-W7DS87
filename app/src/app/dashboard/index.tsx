import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FilePlus, MapPin, ShieldCheck, LayoutDashboard } from 'lucide-react-native';

const C = {
  background: '#0A0A0B',
  surface: '#111113',
  border: '#2A2A2F',
  textPrimary: '#F4F1EA',
  textMuted: '#A3A3AD',
  brandOrange: '#FF7A1A',

  info: '#38BDF8',
  success: '#22C55E',
  warning: '#F59E0B',
};

export default function DashboardOverview() {
  const router = useRouter();

  return (
    <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.heading}>Dashboard Overview</Text>

      <View style={s.grid}>
        <TouchableOpacity onPress={() => router.push('/dashboard/new-request')} style={[s.tile, s.tileHighlight]}>
          <FilePlus size={32} color={C.brandOrange} />
          <Text style={[s.tileText, { color: C.brandOrange }]}>New Charging{'\n'}Request</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.tile}>
          <MapPin size={32} color={C.info} />
          <Text style={s.tileText}>Request{'\n'}Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.tile}>
          <ShieldCheck size={32} color={C.success} />
          <Text style={s.tileText}>Photo Check{'\n'}Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.tile}>
          <LayoutDashboard size={32} color={C.warning} />
          <Text style={s.tileText}>Evidence{'\n'}Locker</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.background },
  heading: { color: C.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  tile: {
    width: '47%', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    padding: 20, borderRadius: 14, alignItems: 'center', gap: 12,
  },
  tileHighlight: {
    backgroundColor: 'rgba(255,122,26,0.1)', borderColor: 'rgba(255,122,26,0.3)',
  },
  tileText: { color: C.textPrimary, fontWeight: '700', textAlign: 'center', lineHeight: 20 },
});
