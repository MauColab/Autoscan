import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ShieldCheck, Scan, ChevronRight } from 'lucide-react-native';
import { COLORS, STYLES } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Fondo con degradado sutil */}
      <LinearGradient
        colors={[COLORS.background, '#020617']}
        style={StyleSheet.absoluteFill}
      />

      {/* Contenido */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Scan size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>AUTO<Text style={{color: COLORS.primary}}>SCAN</Text></Text>
          <Text style={styles.subtitle}>Enterprise JP Solutions</Text>
        </View>

        <View style={styles.features}>
          <FeatureItem 
            icon={<ShieldCheck color={COLORS.success} size={24} />} 
            text="Seguridad de Grado Militar" 
          />
          <FeatureItem 
            icon={<Scan color={COLORS.secondary} size={24} />} 
            text="Reconocimiento IA en < 0.5s" 
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.buttonPrimary}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
            <ChevronRight color="black" size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.buttonSecondary}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={[styles.buttonText, { color: COLORS.text }]}>Solicitar Acceso</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: any, text: string }) {
  return (
    <View style={styles.featureItem}>
      {icon}
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 24, justifyContent: 'space-between', paddingVertical: 60 },
  header: { alignItems: 'center', marginTop: 40 },
  iconContainer: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: COLORS.surfaceHighlight, 
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, ...STYLES.shadow 
  },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, letterSpacing: 1 },
  subtitle: { fontSize: 16, color: COLORS.textDim, marginTop: 5, letterSpacing: 2, textTransform: 'uppercase' },
  features: { gap: 20 },
  featureItem: { 
    flexDirection: 'row', alignItems: 'center', gap: 15, 
    padding: 20, borderRadius: 12, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.surfaceHighlight
  },
  featureText: { color: COLORS.text, fontSize: 16, fontWeight: '500' },
  footer: { gap: 15 },
  buttonPrimary: {
    backgroundColor: COLORS.primary, flexDirection: 'row',
    height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10
  },
  buttonSecondary: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.surfaceHighlight,
    height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center'
  },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#000' }
});