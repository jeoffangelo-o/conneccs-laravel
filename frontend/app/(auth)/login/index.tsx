import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@(cspc\.edu\.ph|my\.cspc\.edu\.ph)$/;
    return emailRegex.test(email.toLowerCase());
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Only @cspc.edu.ph or @my.cspc.edu.ph email addresses are allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo */}
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>Welcome to ConneCCS</Text>
          <Text style={[styles.subtitle, { color: colors.text2 }]}>
            Target Monitoring System
          </Text>
          <Text style={[styles.emailNote, { color: colors.text3 }]}>
            Sign in with your @cspc.edu.ph or @my.cspc.edu.ph account
          </Text>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.red + '20', borderColor: colors.red }]}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.red} />
              <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="email-outline" 
              size={20} 
              color={colors.text3} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg2, color: colors.text, borderColor: colors.border }]}
              placeholder="Email (@cspc.edu.ph or @my.cspc.edu.ph)"
              placeholderTextColor={colors.text3}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="lock-outline" 
              size={20} 
              color={colors.text3} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg2, color: colors.text, borderColor: colors.border }]}
              placeholder="Password"
              placeholderTextColor={colors.text3}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialCommunityIcons 
                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color={colors.text3}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <>
                <MaterialCommunityIcons name="login" size={20} color={colors.bg} />
                <Text style={[styles.buttonText, { color: colors.bg }]}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: colors.text2 }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={[styles.registerLink, { color: colors.accent }]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Login (Development Only) */}
          <View style={styles.quickLoginContainer}>
            <Text style={[styles.quickLoginTitle, { color: colors.text3 }]}>
              Quick Login (Dev)
            </Text>
            <View style={styles.quickLoginButtons}>
              <TouchableOpacity
                style={[styles.quickLoginButton, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                onPress={() => {
                  setEmail('dean.onesa@cspc.edu.ph');
                  setPassword('password123');
                }}
              >
                <Text style={[styles.quickLoginButtonText, { color: colors.text }]}>Dean</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickLoginButton, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                onPress={() => {
                  setEmail('secretary.admin@cspc.edu.ph');
                  setPassword('password123');
                }}
              >
                <Text style={[styles.quickLoginButtonText, { color: colors.text }]}>Secretary</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickLoginButton, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                onPress={() => {
                  setEmail('chair.colle@cspc.edu.ph');
                  setPassword('password123');
                }}
              >
                <Text style={[styles.quickLoginButtonText, { color: colors.text }]}>Chair</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickLoginButton, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                onPress={() => {
                  setEmail('john.benosa@cspc.edu.ph');
                  setPassword('password123');
                }}
              >
                <Text style={[styles.quickLoginButtonText, { color: colors.text }]}>Faculty</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickLoginButton, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                onPress={() => {
                  setEmail('coordinator.santos@cspc.edu.ph');
                  setPassword('password123');
                }}
              >
                <Text style={[styles.quickLoginButtonText, { color: colors.text }]}>Coordinator</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text style={[styles.footer, { color: colors.text3 }]}>
            © 2026 College of Computer Studies{'\n'}
            Camarines Sur Polytechnic Colleges
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emailNote: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },

  inputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 16,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 15,
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 48,
    paddingRight: 48,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 15,
    zIndex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginRight: Platform.select({ web: 'calc((100% - 400px) / 2)', default: 0 }),
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    maxWidth: 400,
    height: 50,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickLoginContainer: {
    width: '100%',
    maxWidth: 400,
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  quickLoginTitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickLoginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickLoginButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
  },
});
