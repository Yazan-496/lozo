import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';

interface SchedulePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (scheduledAt: Date) => void;
}

export function SchedulePickerModal({ visible, onClose, onConfirm }: SchedulePickerModalProps) {
    const colors = useThemeColors();
    const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 5 * 60 * 1000)); // Default: 5 minutes from now
    const [mode, setMode] = useState<'date' | 'time'>('date');
    const [showPicker, setShowPicker] = useState(false);

    const handleDateChange = (event: any, selected?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }

        if (selected) {
            setSelectedDate(selected);
        }
    };

    const showDatePicker = () => {
        setMode('date');
        setShowPicker(true);
    };

    const showTimePicker = () => {
        setMode('time');
        setShowPicker(true);
    };

    const validateAndConfirm = () => {
        const now = new Date();
        const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

        if (selectedDate <= now) {
            Alert.alert('Invalid Time', 'Please select a future date and time.');
            return;
        }

        if (selectedDate > maxDate) {
            Alert.alert('Invalid Time', 'Messages can only be scheduled up to 30 days in advance.');
            return;
        }

        onConfirm(selectedDate);
        onClose();
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString();
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.bg }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Schedule Message</Text>
                    </View>

                    <View style={[styles.warning, { backgroundColor: colors.secondaryBackground }]}>
                        <Text style={[styles.warningText, { color: colors.secondaryText }]}>
                            ⚠️ App must be running to send scheduled messages
                        </Text>
                    </View>

                    <View style={styles.content}>
                        <TouchableOpacity
                            style={[styles.pickerButton, { borderColor: colors.border }]}
                            onPress={showDatePicker}
                        >
                            <Text style={[styles.pickerLabel, { color: colors.secondaryText }]}>
                                Date
                            </Text>
                            <Text style={[styles.pickerValue, { color: colors.text }]}>
                                {formatDate(selectedDate)}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.pickerButton, { borderColor: colors.border }]}
                            onPress={showTimePicker}
                        >
                            <Text style={[styles.pickerLabel, { color: colors.secondaryText }]}>
                                Time
                            </Text>
                            <Text style={[styles.pickerValue, { color: colors.text }]}>
                                {formatTime(selectedDate)}
                            </Text>
                        </TouchableOpacity>

                        {showPicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode={mode}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                                maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                            />
                        )}
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.cancelButton,
                                { borderColor: colors.border },
                            ]}
                            onPress={onClose}
                        >
                            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.confirmButton,
                                { backgroundColor: colors.primary },
                            ]}
                            onPress={validateAndConfirm}
                        >
                            <Text style={[styles.buttonText, { color: 'white' }]}>Schedule</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 16,
        overflow: 'hidden',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    warning: {
        padding: 12,
        margin: 16,
        borderRadius: 8,
    },
    warningText: {
        fontSize: 13,
        textAlign: 'center',
    },
    content: {
        padding: 20,
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
    },
    pickerLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    pickerValue: {
        fontSize: 16,
    },
    buttons: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    confirmButton: {},
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
