// TEMPLATE: Dark Mode Update Pattern for All Pages
// Apply this pattern to: HomePage, RegisterPage, ProfilePage, ChatPage, 
// ProductPages, DeclarationSinistrePage, AssistancePage, BulletinPage, ContactPage, AgentPage

// ============================================================
// STEP 1: Add import for useDarkMode hook
// ============================================================

import { useDarkMode } from '../hooks/useDarkMode';


// ============================================================
// STEP 2: Add these lines at the start of your component function
// ============================================================

export default function YourPageName({ navigation }) {
  const { isDark } = useDarkMode();
  const colors = isDark ? COLORS.dark : COLORS;
  const dynamicStyles = makeStyles(colors);

  // ... rest of your component code


// ============================================================
// STEP 3: Replace all static StyleSheet.create() with makeStyles()
// ============================================================

// BEFORE (Static):
// const styles = StyleSheet.create({
//   container: { backgroundColor: COLORS.bgPrimary },
//   text: { color: COLORS.textPrimary },
// });

// AFTER (Dynamic):
const makeStyles = (colors) => StyleSheet.create({
  container: { backgroundColor: colors.bgPrimary },
  text: { color: colors.textPrimary },
});

// Add this at the very end for backwards compatibility:
const styles = StyleSheet.create({});


// ============================================================
// STEP 4: Update all style references in JSX
// ============================================================

// BEFORE:
// <View style={styles.container}>
//   <Text style={styles.text}>Hello</Text>
// </View>

// AFTER:
// <View style={[dynamicStyles.container, { backgroundColor: colors.bgPrimary }]}>
//   <Text style={[dynamicStyles.text, { color: colors.textPrimary }]}>Hello</Text>
// </View>

// OR simpler (if using makeStyles properly):
// <View style={dynamicStyles.container}>
//   <Text style={dynamicStyles.text}>Hello</Text>
// </View>


// ============================================================
// STEP 5: Color Reference - Use these in your styles
// ============================================================

// Theme-aware colors (colors object provides light OR dark automatically):
colors.primary              // Main brand color
colors.secondary            // Secondary brand color
colors.bgPrimary            // Page background
colors.bgSecondary          // Card/panel background
colors.textPrimary          // Main text color
colors.textSecondary        // Secondary text color
colors.border               // Border color
colors.accent               // Accent color
colors.success              // Success state
colors.danger               // Error/danger state
colors.warning              // Warning state
colors.info                 // Info state


// ============================================================
// COMPLETE EXAMPLE: Updating a Simple Component
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../styles/theme';
import { useDarkMode } from '../hooks/useDarkMode';

export default function ExamplePage() {
  const { isDark } = useDarkMode();
  const colors = isDark ? COLORS.dark : COLORS;
  const dynamicStyles = makeStyles(colors);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.title}>Title</Text>
        <Text style={dynamicStyles.body}>Content</Text>
        <Pressable style={[dynamicStyles.button, { backgroundColor: colors.primary }]}>
          <Text style={dynamicStyles.buttonText}>Action</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    padding: 16,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({});


// ============================================================
// PAGES TO UPDATE
// ============================================================

// 1. HomePage.jsx - Remove static COLORS references
// 2. RegisterPage.jsx - Same pattern as LoginPage
// 3. ProfilePage.jsx - User profile management
// 4. ChatPage.jsx - Chat interface
// 5. AgencesPage.jsx - Agency listing  
// 6. MaPrevoyancePage.jsx - Product page (use ProductPageTemplate pattern)
// 7. MaVoiturePage.jsx - Product page
// 8. MonHabitationPage.jsx - Product page
// 9. MonVoyagePage.jsx - Product page
// 10. DeclarationSinistrePage.jsx - Claims form
// 11. AssistancePage.jsx - Assistance page
// 12. BulletinPage.jsx - Newsletter/Bulletin
// 13. ContactPage.jsx - Contact form
// 14. AgentPage.jsx - Agent dashboard


// ============================================================
// COMMON PATTERNS
// ============================================================

// Pattern 1: TextInput with dark mode
<TextInput
  style={[
    dynamicStyles.input,
    {
      backgroundColor: colors.bgSecondary,
      color: colors.textPrimary,
      borderColor: colors.border
    }
  ]}
  placeholderTextColor={colors.textSecondary}
/>

// Pattern 2: Button with primary color
<Pressable style={[dynamicStyles.button, { backgroundColor: colors.primary }]}>
  <Text style={dynamicStyles.buttonText}>Button Text</Text>
</Pressable>

// Pattern 3: Card with border
<View style={[
  dynamicStyles.card,
  {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.border
  }
]}>
  <Text style={{ color: colors.textPrimary }}>Content</Text>
</View>

// Pattern 4: Error messages
{error && <Text style={{ color: colors.danger }}>{error}</Text>}

// Pattern 5: Success messages  
{success && <Text style={{ color: colors.success }}>{success}</Text>}

// Pattern 6: Disabled button
<Pressable
  style={[
    dynamicStyles.button,
    {
      backgroundColor: colors.primary,
      opacity: disabled ? 0.5 : 1
    }
  ]}
  disabled={disabled}
>
  <Text style={dynamicStyles.buttonText}>Button</Text>
</Pressable>


// ============================================================
// TESTING DARK MODE
// ============================================================

// 1. Open any page
// 2. Look for the sun/moon icon in the top-right of AppHeader
// 3. Click to toggle dark mode
// 4. All colors should change appropriately
// 5. Verify text is readable in both modes
// 6. Check that all buttons and interactive elements are visible
// 7. Refresh the page - dark mode preference should persist


// ============================================================
// TROUBLESHOOTING
// ============================================================

// Issue: Colors not changing when theme toggles
// Solution: Make sure you're using dynamicStyles (from makeStyles)
//           NOT static styles

// Issue: Text not visible in dark mode
// Solution: Ensure you're using colors.textPrimary (not hard-coded color)
//           for all text

// Issue: Borders too light/dark
// Solution: Use colors.border instead of hard-coded #ddd or similar

// Issue: Component not re-rendering on theme change
// Solution: Ensure component imports and calls useDarkMode hook
//           The hook automatically triggers re-render when theme changes
