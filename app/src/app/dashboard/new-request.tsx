import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera as CameraIcon, UploadCloud, CheckCircle2 } from 'lucide-react-native';

const C = {
  background: '#0A0A0B',
  surface: '#111113',
  border: '#2A2A2F',
  textPrimary: '#F4F1EA',
  textMuted: '#A3A3AD',
  brandOrange: '#FF7A1A',
  success: '#22C55E',
};

export default function NewRequestScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={s.permissionWrap}>
        <Text style={s.permissionText}>
          We need your permission to show the camera so you can take photos of
          your electricity meter and parking spot directly.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={s.grantBtn}>
          <Text style={s.grantBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      if (photo?.uri) setPhotoUri(photo.uri);
    }
  };

  const submitRequest = () => {
    Alert.alert('Success', 'Your charging request with the photo evidence has been submitted successfully to your RWA!');
    setPhotoUri(null);
  };

  return (
    <View style={s.container}>
      <Text style={s.heading}>New Charging Request</Text>
      <Text style={s.subheading}>
        Use your mobile camera to quickly capture evidence of your electricity
        meter. This speeds up RWA approval.
      </Text>

      {photoUri ? (
        <View style={s.preview}>
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject} />
          <View style={s.checkBadge}>
            <CheckCircle2 size={24} color="white" />
          </View>
        </View>
      ) : (
        <View style={s.preview}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
          <View style={s.shutterRow}>
            <TouchableOpacity onPress={takePicture} style={s.shutterOuter}>
              <View style={s.shutterInner} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {photoUri ? (
        <View style={s.actionRow}>
          <TouchableOpacity onPress={() => setPhotoUri(null)} style={s.retakeBtn}>
            <Text style={s.retakeBtnText}>Retake Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={submitRequest} style={s.submitBtn}>
            <UploadCloud size={20} color="white" />
            <Text style={s.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.disabledBtn}>
          <Text style={{ color: C.textMuted, fontWeight: '500' }}>Take a photo to proceed</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, padding: 16 },
  heading: { color: C.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subheading: { color: C.textMuted, marginBottom: 20, lineHeight: 22 },
  preview: { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  checkBadge: { position: 'absolute', bottom: 16, right: 16, backgroundColor: C.success, padding: 8, borderRadius: 999 },
  shutterRow: {
    position: 'absolute', bottom: 0, width: '100%', paddingVertical: 24,
    flexDirection: 'row', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)',
  },
  shutterOuter: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 4,
    borderColor: C.brandOrange, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.brandOrange },
  actionRow: { flexDirection: 'row', gap: 12 },
  retakeBtn: {
    flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    paddingVertical: 16, borderRadius: 10, alignItems: 'center',
  },
  retakeBtnText: { color: C.textPrimary, fontWeight: '500' },
  submitBtn: {
    flex: 1, backgroundColor: C.brandOrange, paddingVertical: 16, borderRadius: 10,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  submitBtnText: { color: 'white', fontWeight: '700' },
  disabledBtn: {
    backgroundColor: C.surface, paddingVertical: 16, borderRadius: 10, alignItems: 'center', opacity: 0.5,
  },
  permissionWrap: { flex: 1, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionText: { color: C.textPrimary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  grantBtn: { backgroundColor: C.brandOrange, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  grantBtnText: { color: 'white', fontWeight: '700' },
});
