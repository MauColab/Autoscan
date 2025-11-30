import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, STYLES } from '@/constants/theme';
import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useSession } from '../../context/ctx';

// REPLACE WITH YOUR PC IP
const API_URL = 'http://10.67.153.175:5000';

export default function LoginScreen() {
  const { signIn } = useSession();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingrese correo y contraseña");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/mobile/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      setLoading(false);

      if (data.status === 'success') {
        // Save user name for display
        if (data.user && data.user.full_name) {
            await SecureStore.setItemAsync('user_name', data.user.full_name);
        }
        signIn(); 
      } else {
        Alert.alert("Error", data.error || "Credenciales inválidas");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "No se pudo conectar con el servidor");
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft color={COLORS.textDim} size={24} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        <Text style={styles.subtitle}>Ingrese su información de registro</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Mail color={COLORS.primary} size={20} style={styles.inputIcon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.textDim}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock color={COLORS.primary} size={20} style={styles.inputIcon} />
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor={COLORS.textDim}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          <LinearGradient
            colors={[COLORS.primary, '#0099FF']}
            style={styles.gradientBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.btnText}>ACCEDER</Text>
                <ChevronRight color="#000" size={20} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 60, left: 24, zIndex: 10 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, color: COLORS.text, fontWeight: 'bold', letterSpacing: 1 },
  subtitle: { color: COLORS.textDim, marginTop: 8 },
  form: { gap: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.surfaceHighlight,
    height: 56, paddingHorizontal: 16
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },
  loginBtn: { height: 56, borderRadius: 12, overflow: 'hidden', marginTop: 10, ...STYLES.shadow },
  gradientBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});