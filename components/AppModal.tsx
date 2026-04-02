import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Option = {
  text: string;
  onPress: () => void;
  style?: 'destructive' | 'cancel' | 'default' | 'success';
  icon?: string;
};

type AppModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: Option[];
  centered?: boolean;
};

export default function AppModal({ visible, onClose, title, message, options, centered }: AppModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={centered ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={[styles.modalOverlay, centered && styles.modalOverlayCentered]} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={[styles.menuContainer, centered && styles.menuContainerCentered]}>
          {title && <Text style={styles.menuTitle}>{title}</Text>}
          {message && <Text style={styles.menuMessage}>{message}</Text>}
          
          <View style={styles.optionsList}>
            {options.map((option, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.menuItem, 
                  option.style === 'cancel' && styles.cancelButton,
                  option.style === 'destructive' && styles.menuItemDestructive,
                  option.style === 'success' && styles.menuItemSuccess
                ]} 
                onPress={() => {
                  option.onPress();
                }}
              >
                {option.icon && (
                  <Ionicons 
                    name={option.icon as any} 
                    size={20} 
                    color={
                      option.style === 'destructive' ? '#ba1a1a' : 
                      option.style === 'success' ? '#2e7d32' : 
                      '#635979'
                    } 
                  />
                )}
                <Text style={[
                  styles.menuText, 
                  option.style === 'cancel' && styles.cancelText,
                  option.style === 'destructive' && { color: '#ba1a1a' },
                  option.style === 'success' && { color: '#2e7d32' }
                ]}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalOverlayCentered: {
    justifyContent: 'center',
    padding: 24,
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  menuContainerCentered: {
    borderRadius: 24,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1c1c',
    marginBottom: 8,
    textAlign: 'center',
  },
  menuMessage: {
    fontSize: 14,
    color: '#49454d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  optionsList: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#fcf9f8',
  },
  menuItemDestructive: {
    backgroundColor: '#fffbfa',
  },
  menuItemSuccess: {
    backgroundColor: '#f1f8e9',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1c1c',
  },
  cancelButton: {
    marginTop: 8,
    justifyContent: 'center',
    backgroundColor: '#f6f3f2',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#635979',
    textAlign: 'center',
  },
});
