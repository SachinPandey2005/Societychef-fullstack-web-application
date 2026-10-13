import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../constants/colors';

type CloseTimePickerProps = {
  value: string; // e.g. "10:35 PM"
  onChange: (time: string) => void;
  error?: string;
  label?: string;
};

function parseTimeValue(value: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
  const fallback = { hour: '12', minute: '00', period: 'PM' as const };
  if (!value) return fallback;

  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return fallback;

  const hour = String(parseInt(match[1], 10)); // strip leading zero for display
  const minute = match[2];
  const period = match[3].toUpperCase() as 'AM' | 'PM';

  return { hour, minute, period };
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM'];

export default function CloseTimePicker({ value, onChange, error, label }: CloseTimePickerProps) {
  const parsed = parseTimeValue(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(parsed.period);

  // Sync from parent if value changes externally
  useEffect(() => {
    const p = parseTimeValue(value);
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  function emitChange(h: string, m: string, p: 'AM' | 'PM') {
    onChange(`${h}:${m.padStart(2, '0')} ${p}`);
  }

  function handleHourChange(val: string) {
    setHour(val);
    emitChange(val, minute, period);
  }

  function handleMinuteChange(val: string) {
    setMinute(val);
    emitChange(hour, val, period);
  }

  function handlePeriodChange(val: string) {
    const p = val as 'AM' | 'PM';
    setPeriod(p);
    emitChange(hour, minute, p);
  }

  const displayText = `${hour} : ${minute.padStart(2, '0')} ${period}`;

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : (
        <Text style={styles.label}>Booking Closes At</Text>
      )}

      <View style={styles.pickerRow}>
        {/* Hour Picker */}
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={hour}
            onValueChange={handleHourChange}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {HOURS.map((h) => (
              <Picker.Item key={h} label={h} value={h} />
            ))}
          </Picker>
        </View>

        <Text style={styles.colonSeparator}>:</Text>

        {/* Minute Picker */}
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={minute}
            onValueChange={handleMinuteChange}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {MINUTES.map((m) => (
              <Picker.Item key={m} label={m} value={m} />
            ))}
          </Picker>
        </View>

        {/* Period Picker */}
        <View style={[styles.pickerWrapper, styles.periodWrapper]}>
          <Picker
            selectedValue={period}
            onValueChange={handlePeriodChange}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {PERIODS.map((p) => (
              <Picker.Item key={p} label={p} value={p} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Combined display */}
      <Text style={styles.displayText}>{displayText}</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 10,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pickerWrapper: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        width: 90,
        height: 120,
      },
      android: {
        minWidth: 80,
      },
      default: {
        minWidth: 80,
      },
    }),
  },
  periodWrapper: {
    ...Platform.select({
      ios: {
        width: 70,
      },
      android: {
        minWidth: 70,
      },
      default: {
        minWidth: 70,
      },
    }),
  },
  picker: {
    ...Platform.select({
      ios: {
        height: 120,
      },
      android: {
        height: 50,
      },
      default: {
        height: 50,
      },
    }),
  },
  pickerItem: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.dark,
  },
  colonSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark,
    marginHorizontal: 4,
  },
  displayText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
});
