import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors matching web dashboard
  static const Color primary = Color(0xFF10B981); // Emerald / Neon Green
  static const Color primaryHover = Color(0xFF0D9488); // Teal

  static const Color bgBody = Color(0xFF0F172A); // Slate 900
  static const Color bgCard = Color(0xFF1E293B); // Slate 800
  static const Color bgSubtle = Color(0xFF1E293B);

  static const Color border = Color(0xFF334155); // Slate 700
  static const Color borderFocused = Color(0xFF10B981);

  static const Color textMain = Color(0xFFF8FAFC); // Slate 50
  static const Color textBody = Color(0xFFCBD5E1); // Slate 300
  static const Color textSecondary = Color(0xFFE2E8F0); // Slate 200
  static const Color textMuted = Color(0xFF94A3B8); // Slate 400

  // Danger & Status
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgBody,
      primaryColor: primary,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: primaryHover,
        surface: bgCard,
        error: error,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme)
          .copyWith(
            displayLarge: GoogleFonts.inter(
              color: textMain,
              fontWeight: FontWeight.bold,
            ),
            displayMedium: GoogleFonts.inter(
              color: textMain,
              fontWeight: FontWeight.bold,
            ),
            displaySmall: GoogleFonts.inter(
              color: textMain,
              fontWeight: FontWeight.w600,
            ),
            headlineMedium: GoogleFonts.inter(
              color: textMain,
              fontWeight: FontWeight.w600,
            ),
            titleLarge: GoogleFonts.inter(
              color: textMain,
              fontWeight: FontWeight.w600,
            ),
            bodyLarge: GoogleFonts.inter(color: textBody),
            bodyMedium: GoogleFonts.inter(color: textBody),
          ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgBody,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: error),
        ),
        labelStyle: const TextStyle(color: textMuted),
        hintStyle: const TextStyle(color: textMuted),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
          elevation: 0,
        ),
      ),
    );
  }
}
