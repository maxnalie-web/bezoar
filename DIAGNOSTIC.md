# Diagnostic: Text Input Issue in Patients Search

## Problem
- Keyboard opens when tapping the search input ✓
- Typed characters **do not appear** in the input
- Placeholder text **does not appear** in the white box

## Hypothesis
FormInput's style/prop handling may be blocking text rendering. Need to test with plain React Native TextInput.

## Test Plan
Replace `<FormInput>` in `client/screens/PatientsScreen.tsx` (lines ~225-245) with a plain `<TextInput>`:

```tsx
// Current (broken):
<FormInput
  value={searchQuery}
  onChangeText={(v: string) => setSearchQuery(v)}
  placeholder="جستجوی بیمار (نام، کد ملی، تلفن)"
  placeholderTextColor="#999"
  ref={searchInputRef}
  style={{
    fontSize: 16,
    textAlign: "center",
    color: "#000",
  }}
  containerStyle={{
    borderWidth: 0,
    backgroundColor: "transparent",
    padding: 0,
    margin: 0,
    height: "100%",
    justifyContent: "center",
  }}
/>

// Replace with (test):
import { TextInput as RNTextInput } from "react-native";

<RNTextInput
  ref={searchInputRef}
  value={searchQuery}
  onChangeText={(v: string) => setSearchQuery(v)}
  placeholder="جستجوی بیمار (نام، کد ملی، تلفن)"
  placeholderTextColor="#999"
  style={{
    flex: 1,
    fontSize: 16,
    textAlign: "center",
    color: "#000",
    height: "100%",
    padding: 0,
  }}
/>
```

## Expected Results
- If plain TextInput **works** → FormInput is the issue (likely style/containerStyle props blocking text)
- If plain TextInput **fails** → Issue is in surrounding layout or prop passing (not FormInput)

## Next Steps
After test:
1. If plain TextInput works: inspect FormInput's `containerStyle` merger and style array — likely the `backgroundColor: "transparent"` or flex layout is hiding text
2. If plain TextInput fails: debug layout, zIndex, elevation, flex/width constraints
