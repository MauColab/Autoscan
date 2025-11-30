import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { User, Mail, Lock, Shield, ArrowLeft } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useSession } from '../../context/ctx';

// REPLACE WITH YOUR PC IP
const API_URL = 'http://10.67.153.175:5000';

export default function RegisterScreen() {
  const { signIn } = useSession();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // -------- VALIDACIONES --------
  const validar = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dniRegex = /^[0-9]{8}$/;

    if (pass.length < 6) {
      return "La contraseña debe tener más de 6 caracteres.";
    }
    if (!emailRegex.test(email)) {
      return "Ingresa un correo válido.";
    }
    if (!dniRegex.test(dni)) {
      return "El DNI debe tener exactamente 8 números.";
    }

    return null;
  };

  const enviar = async () => {
    const errorMsg = validar();

    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/mobile/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: nombre,
          dni: dni,
          email: email,
          password: pass
        })
      });

      const data = await response.json();
      setLoading(false);

      if (data.status === 'success') {
        Alert.alert("Registro Exitoso", "Tu cuenta ha sido creada. Inicia sesión.");
        router.push("/(auth)/login");
      } else {
        setError(data.error || "Error al registrar usuario");
      }
    } catch (err) {
      setLoading(false);
      setError("No se pudo conectar con el servidor.");
      console.error(err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft color={COLORS.textDim} size={24} />
      </TouchableOpacity>

      <Text style={styles.title}>Solicitud de Alta</Text>
      <Text style={styles.subtitle}>Registrate como usuario y ayuda contra la delincuencia</Text>

      <View style={styles.form}>
        <InputItem
          icon={<User size={20} color={COLORS.secondary} />}
          placeholder="Nombre Completo"
          value={nombre}
          onChangeText={setNombre}
        />

        <InputItem
          icon={<Shield size={20} color={COLORS.secondary} />}
          placeholder="DNI del Usuario"
          value={dni}
          onChangeText={setDni}
          keyboardType="numeric"
        />

        <InputItem
          icon={<Mail size={20} color={COLORS.secondary} />}
          placeholder="Email Personal"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <InputItem
          icon={<Lock size={20} color={COLORS.secondary} />}
          placeholder="Contraseña Maestra"
          value={pass}
          onChangeText={setPass}
          secure
        />

        {error.length > 0 && (
          <Text style={styles.errorMsg}>{error}</Text>
        )}

        <TouchableOpacity style={styles.registerBtn} onPress={enviar} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.secondary} />
          ) : (
            <Text style={styles.registerText}>ENVIAR SOLICITUD</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InputItem({ icon, placeholder, secure, value, onChangeText, keyboardType }: any) {
  return (
    <View style={styles.inputContainer}>
      {icon}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={COLORS.textDim}
        secureTextEntry={secure}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 24, paddingTop: 80 },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 28, color: COLORS.text, fontWeight: 'bold' },
  subtitle: { color: COLORS.textDim, marginBottom: 40 },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.surfaceHighlight,
    height: 56, paddingHorizontal: 16
  },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },
  registerBtn: {
    height: 56, borderRadius: 12, backgroundColor: 'transparent',
    borderWidth: 1, borderColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center', marginTop: 10
  },
  registerText: { color: COLORS.secondary, fontWeight: 'bold', letterSpacing: 1 },
  errorMsg: { color: 'red', marginTop: 5, textAlign: 'center', fontSize: 14 }
});