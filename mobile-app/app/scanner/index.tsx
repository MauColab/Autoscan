import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Camera, Image as ImageIcon, UploadCloud } from 'lucide-react-native';
import { COLORS, STYLES } from '@/constants/theme';
import { BlurView } from 'expo-blur';

export default function ScannerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Botón Cerrar */}
      <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
        <X color="#fff" size={24} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <UploadCloud size={60} color={COLORS.primary} />
        </View>
        
        <Text style={styles.title}>Análisis de Placa</Text>
        <Text style={styles.subtitle}>
          Seleccione el método de entrada.{'\n'}El sistema de IA procesará la imagen automáticamente.
        </Text>

        {/* Opciones de Entrada */}
        <View style={styles.actions}>
          <ActionButton 
            icon={<Camera size={32} color="#000" />} 
            title="Tomar Foto" 
            desc="Usar cámara del dispositivo"
            primary
          />
          
          <ActionButton 
            icon={<ImageIcon size={32} color={COLORS.text} />} 
            title="Galería" 
            desc="Subir imagen existente"
          />
        </View>
      </View>
      
      {/* Footer Legal */}
      <Text style={styles.footerText}>VisionGuard Enterprise v2.4.0</Text>
    </View>
  );
}

function ActionButton({ icon, title, desc, primary }: any) {
  return (
    <TouchableOpacity 
      style={[
        styles.actionButton, 
        primary ? { backgroundColor: COLORS.primary } : { backgroundColor: COLORS.surface, borderColor: COLORS.surfaceHighlight, borderWidth: 1 }
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.actionContent}>
        {icon}
        <View>
          <Text style={[styles.actionTitle, { color: primary ? '#000' : COLORS.text }]}>{title}</Text>
          <Text style={[styles.actionDesc, { color: primary ? 'rgba(0,0,0,0.6)' : COLORS.textDim }]}>{desc}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24 },
  closeBtn: { marginTop: 40, alignSelf: 'flex-end', padding: 8, backgroundColor: COLORS.surfaceHighlight, borderRadius: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: 'rgba(0, 240, 255, 0.1)', 
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.primary,
    marginBottom: 30, ...STYLES.shadow
  },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  subtitle: { textAlign: 'center', color: COLORS.textDim, marginBottom: 50, lineHeight: 22 },
  actions: { width: '100%', gap: 16 },
  actionButton: { padding: 20, borderRadius: 16, height: 90, justifyContent: 'center' },
  actionContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionTitle: { fontSize: 18, fontWeight: 'bold' },
  actionDesc: { fontSize: 13 },
  footerText: { textAlign: 'center', color: COLORS.surfaceHighlight, marginBottom: 20 }
});