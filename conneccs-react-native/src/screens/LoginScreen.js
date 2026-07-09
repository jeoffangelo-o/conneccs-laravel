import React, { useState } from 'react';
import {
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { ScrollView, YStack, XStack, Text as TamaguiText } from 'tamagui';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    const success = await login(email, password);
    if (success) {
      navigation.replace('Main');
    } else {
      Alert.alert('Error', 'Invalid email or password');
    }
  };

  const quickLogin = async (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
    const success = await login(userEmail, userPassword);
    if (success) {
      navigation.replace('Main');
    }
  };

  return (
    <YStack f={1} bg="$bg">
      <StatusBar style="light" />
      <ScrollView f={1} contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <YStack ai="center" mb={40}>
          <YStack 
            w={140} 
            h={140} 
            bg="$bg2" 
            borderRadius={70} 
            borderWidth={3}
            borderColor="$accent"
            ai="center" 
            jc="center" 
            mb={16}
            style={{ 
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            }}
          >
            <TamaguiText color="$accent" fontSize={56} fontWeight="800">C</TamaguiText>
          </YStack>
          <TamaguiText fontSize={32} fontWeight="800" color="$text" letterSpacing={-1} mb={4}>
            ConneCCS
          </TamaguiText>
          <TamaguiText fontSize={15} color="$text2" textAlign="center" fontWeight="600" mb={2}>
            Target Monitoring & Management System
          </TamaguiText>
          <TamaguiText fontSize={12} color="$text3" textAlign="center">
            College of Computer Studies
          </TamaguiText>
        </YStack>

        {/* Login Form */}
        <YStack 
          bg="$bg2" 
          borderRadius={16} 
          borderWidth={1} 
          borderColor="$border" 
          p={24}
          maxWidth={500}
          width="100%"
          alignSelf="center"
        >
          <TamaguiText fontSize={24} fontWeight="800" color="$text" mb={8}>
            Sign In
          </TamaguiText>
          <TamaguiText fontSize={14} color="$text3" mb={24}>
            Welcome to ConneCCS - Departmental Target Monitoring & Management System
          </TamaguiText>

          <YStack mb={16}>
            <TamaguiText fontSize={13} fontWeight="600" color="$text2" mb={6}>
              Email Address
            </TamaguiText>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.text3}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </YStack>

          <YStack mb={16}>
            <TamaguiText fontSize={13} fontWeight="600" color="$text2" mb={6}>
              Password
            </TamaguiText>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.text3}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </YStack>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
            <TamaguiText color="#fff" fontSize={15} fontWeight="600">
              Sign In
            </TamaguiText>
          </TouchableOpacity>

          <XStack jc="center" ai="center" mt={16}>
            <TamaguiText fontSize={14} color="$text3">
              Don't have an account?{' '}
            </TamaguiText>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <TamaguiText fontSize={14} color="$accent" fontWeight="500">
                Register here
              </TamaguiText>
            </TouchableOpacity>
          </XStack>

          {/* Quick Login Section - At Bottom */}
          <YStack mt={24} pt={24} borderTopWidth={1} borderTopColor="$border">
            <TamaguiText 
              fontSize={12} 
              fontWeight="600" 
              color="$text3" 
              textTransform="uppercase" 
              letterSpacing={0.5}
              mb={12}
              textAlign="center"
            >
              Quick Login (Demo)
            </TamaguiText>
            <XStack gap={8} flexWrap="wrap" jc="center">
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('onesa@cspc.edu.ph', 'dean123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Dean (Onesa)
                </TamaguiText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('colle@cspc.edu.ph', 'faculty123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Chair (Colle)
                </TamaguiText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('gastilo@cspc.edu.ph', 'secretary123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Secretary (Gastilo)
                </TamaguiText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('otares@cspc.edu.ph', 'secretary123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Secretary (Otares)
                </TamaguiText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('baeta@cspc.edu.ph', 'secretary123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Secretary (Baeta)
                </TamaguiText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('tanamor@cspc.edu.ph', 'secretary123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Secretary (Tañamor)
                </TamaguiText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('bagaporo@cspc.edu.ph', 'faculty123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Faculty (Bagaporo)
                </TamaguiText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('broqueza@cspc.edu.ph', 'faculty123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Faculty (Broqueza)
                </TamaguiText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('baluis@cspc.edu.ph', 'coordinator123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Extension (Baluis)
                </TamaguiText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('benosa@cspc.edu.ph', 'coordinator123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Research (Benosa)
                </TamaguiText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickLoginBtn}
                onPress={() => quickLogin('admin@cspc.edu.ph', 'admin123')}
              >
                <TamaguiText fontSize={12} fontWeight="600" color="$accent">
                  Admin
                </TamaguiText>
              </TouchableOpacity>
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

const createStyles = (colors) => StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  input: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  quickLoginBtn: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
});
