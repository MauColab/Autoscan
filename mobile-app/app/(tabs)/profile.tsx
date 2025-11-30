import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { LogOut, Settings, CreditCard, Bell, X, Info, ShieldCheck } from 'lucide-react-native';
import { COLORS, STYLES } from '@/constants/theme';
import { useSession } from '../../context/ctx';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from 'expo-router';
import React from 'react';

export default function ProfileScreen() {
  const { signOut } = useSession();
  const [showConfig, setShowConfig] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [userName, setUserName] = useState("Usuario");

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
      const name = await SecureStore.getItemAsync('user_name');
      if (name) setUserName(name);
  }

  // Generar Licencia Mock una vez
  const [license] = useState(`ENT-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userName.substring(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.role}>Unidad de Control LPR</Text>
      </View>

      <View style={styles.section}>
        <MenuItem
          icon={<Settings size={20} color={COLORS.text} />}
          label="Configuración del Sistema"
          onPress={() => setShowConfig(true)}
        />
        <MenuItem
          icon={<Bell size={20} color={COLORS.text} />}
          label="Notificaciones"
          onPress={() => setShowNotif(true)}
        />
        <View style={styles.menuItem}>
          <CreditCard size={20} color={COLORS.text} />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Licencia Enterprise</Text>
            <Text style={styles.licenseCode}>{license}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <LogOut size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>

      {/* MODAL CONFIGURACIÓN */}
      <Modal visible={showConfig} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configuración</Text>
              <TouchableOpacity onPress={() => setShowConfig(false)}>
                <X color={COLORS.text} size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.configBody}>
              <Info size={48} color={COLORS.primary} style={{ alignSelf: 'center', marginBottom: 20 }} />
              <Text style={styles.configText}>
                Las fotografías capturadas por esta aplicación son enviadas automáticamente a la central de monitoreo policial (PC-Program).
              </Text>
              <Text style={styles.configText}>
                Es <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>CRÍTICO</Text> que incluya un comentario detallado en cada reporte para facilitar la evaluación del oficial a cargo.
              </Text>
              <View style={styles.infoBox}>
                <ShieldCheck size={20} color={COLORS.success} />
                <Text style={styles.infoBoxText}>Conexión Segura: ENCRIPTADA</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL NOTIFICACIONES */}
      <Modal visible={showNotif} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notificaciones</Text>
              <TouchableOpacity onPress={() => setShowNotif(false)}>
                <X color={COLORS.text} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <NotificationItem title="Alertas de Robo" desc="Notificar placas con denuncia activa" />
              <NotificationItem title="Confirmación de Envío" desc="Vibrar al completar subida" />
              <NotificationItem title="Actualizaciones de Estado" desc="Cuando un oficial revise su caso" />
              <NotificationItem title="Boletines Policiales" desc="Noticias de la red" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      {icon}
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function NotificationItem({ title, desc }: any) {
  const [enabled, setEnabled] = useState(true);
  return (
    <View style={styles.notifItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.notifTitle}>{title}</Text>
        <Text style={styles.notifDesc}>{desc}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: COLORS.surfaceHighlight, true: COLORS.primary }}
        thumbColor={'#fff'}
      />
    </View>
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
  licenseCode: { color: COLORS.primary, fontSize: 12, fontFamily: 'monospace', marginTop: 4 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 0, 85, 0.3)'
  },
  logoutText: { color: COLORS.error, fontWeight: 'bold' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.surfaceHighlight },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  configBody: { gap: 16 },
  configText: { color: COLORS.textDim, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0, 255, 148, 0.1)', padding: 12, borderRadius: 8, marginTop: 10 },
  infoBoxText: { color: COLORS.success, fontWeight: 'bold', fontSize: 12 },

  notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceHighlight },
  notifTitle: { color: COLORS.text, fontWeight: 'bold', marginBottom: 4 },
  notifDesc: { color: COLORS.textDim, fontSize: 12 }
});