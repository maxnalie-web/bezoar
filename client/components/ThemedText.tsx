import { Text, type TextProps, Platform, I18nManager } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "link";
};

const getFontFamily = (weight: "400" | "500" | "600" | "700") => {
  if (Platform.OS === "web") {
    return "'Vazirmatn', 'Tahoma', sans-serif";
  }
  switch (weight) {
    case "700":
    case "600":
      return "Vazirmatn-Bold";
    case "500":
      return "Vazirmatn-Medium";
    default:
      return "Vazirmatn-Regular";
  }
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    const baseStyle = (() => {
      switch (type) {
        case "h1":
          return Typography.h1;
        case "h2":
          return Typography.h2;
        case "h3":
          return Typography.h3;
        case "h4":
          return Typography.h4;
        case "body":
          return Typography.body;
        case "small":
          return Typography.small;
        case "link":
          return Typography.link;
        default:
          return Typography.body;
      }
    })();

    return {
      ...baseStyle,
      fontFamily: getFontFamily(baseStyle.fontWeight),
    };
  };

  return (
    <Text
      style={[
        {
          color: getColor(),
          textAlign: I18nManager.isRTL ? "right" : "left",
          writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
        },
        getTypeStyle(),
        style,
      ]}
      {...rest}
    />
  );
}
