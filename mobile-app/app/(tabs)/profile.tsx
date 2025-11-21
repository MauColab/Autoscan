import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Settings, CreditCard, Bell } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useSession } from '../ctx';

export default function ProfileScreen() {
  const { signOut } = useSession(); 

  const handleLogout = () => {
    signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AS</Text>
        </View>
        <Text style={styles.name}>Agente Smith</Text>
        <Text style={styles.role}>Unidad de Control LPR</Text>
      </View>

      <View style={styles.section}>
        <MenuItem icon={<Settings size={20} color={COLORS.text} />} label="Configuración del Sistema" />
        <MenuItem icon={<Bell size={20} color={COLORS.text} />} label="Notificaciones" />
        <MenuItem icon={<CreditCard size={20} color={COLORS.text} />} label="Licencia Enterprise" />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

function MenuItem({ icon, label }: any) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      {icon}
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, paddingTop: 80 },
  header: { alignItems: 'center', marginBottom: 40 },
  avatar: { 
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: COLORS.surfaceHighlight, 
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.primary, marginBottom: 16
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  role: { color: COLORS.textDim, marginTop: 4 },
  section: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 8, marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  menuLabel: { color: COLORS.text, fontSize: 16 },
  logoutBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 0, 85, 0.3)'
  },
  logoutText: { color: COLORS.error, fontWeight: 'bold' }
});