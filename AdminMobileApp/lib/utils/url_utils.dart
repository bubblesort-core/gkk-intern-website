class UrlUtils {
  /// Converts a direct Supabase Storage URL to a proxied URL via Netlify.
  /// If the URL is already proxied or not a Supabase Storage URL, it returns it as is.
  static String getProxiedUrl(String url) {
    if (url.isEmpty) return url;

    // Handle main project storage
    if (url.contains(
      'hjpsyxqakzrhvzegehtm.supabase.co/storage/v1/object/public/',
    )) {
      return url.replaceFirst(
        'https://hjpsyxqakzrhvzegehtm.supabase.co/storage/v1/object/public/',
        'https://gkkintern.in/storage-main/',
      );
    }

    // Handle chat project storage
    if (url.contains(
      'mwnpwuxrbaousgwgoyco.supabase.co/storage/v1/object/public/',
    )) {
      return url.replaceFirst(
        'https://mwnpwuxrbaousgwgoyco.supabase.co/storage/v1/object/public/',
        'https://gkkintern.in/storage-chat/',
      );
    }

    return url;
  }
}
