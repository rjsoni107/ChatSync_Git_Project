import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const APP_LOCK_KEY = 'chatterapp_lock_enabled';

export const checkBiometricsAvailability = async () => {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        return {
            hasHardware,
            isEnrolled,
            supportedTypes: supportedTypes.map(type => {
                if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) return 'Fingerprint';
                if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) return 'FaceID';
                if (type === LocalAuthentication.AuthenticationType.IRIS) return 'Iris';
                return 'Unknown';
            })
        };
    } catch (error) {
        console.error("Error checking biometrics:", error);
        return { hasHardware: false, isEnrolled: false, supportedTypes: [] };
    }
};

export const authenticateWithBiometrics = async (reason = "Unlock ChatterApp") => {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: reason,
            fallbackLabel: "Use Passcode",
            cancelLabel: "Cancel",
            disableDeviceFallback: false,
        });
        return result.success;
    } catch (error) {
        console.error("Authentication error:", error);
        return false;
    }
};

export const setAppLockEnabled = async (enabled) => {
    try {
        await SecureStore.setItemAsync(APP_LOCK_KEY, enabled ? 'true' : 'false');
        return true;
    } catch (error) {
        console.error("Error saving lock preference:", error);
        return false;
    }
};

export const getAppLockEnabled = async () => {
    try {
        const value = await SecureStore.getItemAsync(APP_LOCK_KEY);
        return value === 'true';
    } catch (error) {
        console.error("Error getting lock preference:", error);
        return false;
    }
};
