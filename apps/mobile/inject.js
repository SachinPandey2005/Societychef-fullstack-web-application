const fs = require('fs');

const stylesToAdd = `
  segmentedControl: { flexDirection: 'row', backgroundColor: Colors.pillInactive, borderRadius: 8, padding: 4, marginTop: 10 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentBtnActive: { backgroundColor: Colors.surface },
  segmentText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  segmentTextActive: { color: Colors.textPrimary },`;

// Consumer Profile
let cp = fs.readFileSync('c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile/app/(consumer)/profile.tsx', 'utf8');
if (!cp.includes('Appearance')) {
  let appearanceUI = `          {/* Appearance */}
          <Card>
            <View style={styles.cardTitleRow}>
              <Ionicons name="color-palette-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Appearance</Text>
            </View>
            <View style={styles.segmentedControl}>
              {(['light', 'dark', 'system'] as const).map((m) => (
                <Pressable
                  key={m}
                  style={[styles.segmentBtn, useThemeStore.getState().mode === m && styles.segmentBtnActive]}
                  onPress={() => useThemeStore.getState().setMode(m)}
                >
                  <Text style={[styles.segmentText, useThemeStore.getState().mode === m && styles.segmentTextActive]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
`;
  cp = cp.replace('          {/* Preferences */}', appearanceUI + '          {/* Preferences */}');
  cp = cp.replace('const getStyles = (Colors: any) => StyleSheet.create({', 'const getStyles = (Colors: any) => StyleSheet.create({' + stylesToAdd);
  fs.writeFileSync('c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile/app/(consumer)/profile.tsx', cp);
  console.log('Updated consumer profile');
}

// Chef Profile
let hp = fs.readFileSync('c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile/app/(chef)/profile.tsx', 'utf8');
if (!hp.includes('Appearance')) {
  let appearanceUI2 = `        {/* Appearance Settings */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="color-palette-outline" size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>Appearance</Text>
          </View>
          <View style={styles.segmentedControl}>
            {(['light', 'dark', 'system'] as const).map((m) => (
              <Pressable
                key={m}
                style={[styles.segmentBtn, useThemeStore.getState().mode === m && styles.segmentBtnActive]}
                onPress={() => useThemeStore.getState().setMode(m)}
              >
                <Text style={[styles.segmentText, useThemeStore.getState().mode === m && styles.segmentTextActive]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
`;
  hp = hp.replace('        {/* Account Settings */}', appearanceUI2 + '        {/* Account Settings */}');
  hp = hp.replace('const getStyles = (Colors: any) => StyleSheet.create({', 'const getStyles = (Colors: any) => StyleSheet.create({' + stylesToAdd);
  fs.writeFileSync('c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile/app/(chef)/profile.tsx', hp);
  console.log('Updated chef profile');
}
