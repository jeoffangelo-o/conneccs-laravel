import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'FACULTY',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@cspc\.edu\.ph$/;
    return emailRegex.test(email.toLowerCase());
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Only @cspc.edu.ph email addresses are allowed');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle();
      
      // Validate that the Google account email is from cspc.edu.ph
      if (result.email && !validateEmail(result.email)) {
        setError('Only @cspc.edu.ph email addresses are allowed');
        setGoogleLoading(false);
        return;
      }

      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
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
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.text2 }]}>
            Join ConneCCS Target Monitoring System
          </Text>
          <Text style={[styles.emailNote, { color: colors.text3 }]}>
            Use your @cspc.edu.ph email address
          </Text>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.red + '20', borderColor: colors.red }]}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.red} />
              <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
            </View>
          ) : null}

          {/* Google Sign Up Button */}
          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: '#fff', borderColor: colors.border }]}
            onPress={handleGoogleRegister}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                <Text style={[styles.googleButtonText, { color: '#000' }]}>
                  Sign up with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.text3 }]}>OR</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          {/* First Name */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="account-outline" 
              size={20} 
              color={colors.text3} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg2, color: colors.text, borderColor: colors.border }]}
              placeholder="First Name"
              placeholderTextColor={colors.text3}
              value={formData.firstName}
              onChangeText={(text) => {
                setFormData({ ...formData, firstName: text });
                setError('');
              }}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="account-outline" 
              size={20} 
              color={colors.text3} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg2, color: colors.text, borderColor: colors.border }]}
              placeholder="Last Name"
              placeholderTextColor={colors.text3}
              value={formData.lastName}
              onChangeText={(text) => {
                setFormData({ ...formData, lastName: text });
                setError('');
              }}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="email-outline" 
              size={20} 
              color={colors.text3} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg2, color: colors.text, borderColor: colors.border }]}
              placeholder="Email (@cspc.edu.ph)"
              placeholderTextColor={colors.text3}
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                setError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          {/* Role Selection */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="briefcase-outline" 
              size={20} 
              color={colors.text3} 
              style={styles.inputIcon}
            />
            <View style={[styles.input, styles.roleContainer, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
              <Text style={[styles.roleLabel, { color: colors.text3 }]}>Role:</Text>
              <View style={styles.roleOptions}>
                {['FACULTY', 'SECRETARY', 'COORDINATOR'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      { 
                        backgroundColor: formData.role === role ? colors.accent : 'transparent',
                        borderColor: formData.role === role ? colors.accent : colors.border,
                      }
                    ]}
                    onPress={() => setFormData({ ...formData, role })}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      { color: formData.role === role ? colors.bg : colors.text }
                    ]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="lock-outline" 
              size={20} 
              color={colors.text3} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg2, color: colors.text, borderColor: colors.border }]}
              placeholder="Password (min. 8 characters)"
              placeholderTextColor={colors.text3}
              value={formData.password}
              onChangeText={(text) => {
                setFormData({ ...formData, password: text });
                setError('');
              }}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
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

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="lock-check-outline" 
              size={20} 
              color={colors.text3} 
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg2, color: colors.text, borderColor: colors.border }]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.text3}
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, confirmPassword: text });
                setError('');
              }}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <MaterialCommunityIcons 
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color={colors.text3}
              />
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={handleRegister}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <>
                <MaterialCommunityIcons name="account-plus" size={20} color={colors.bg} />
                <Text style={[styles.buttonText, { color: colors.bg }]}>Create Account</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.text2 }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={[styles.loginLink, { color: colors.accent }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={[styles.footer, { color: colors.text3 }]}>
            By registering, you agree to our Terms of Service{'\n'}
            and Privacy Policy
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
  googleButton: {
    width: '100%',
    maxWidth: 400,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
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
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  roleLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 15,
    zIndex: 1,
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
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
  },
});
