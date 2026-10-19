import WebKit

struct Cookie {
    var name: String
    var value: String
}

let gcmMessageIDKey = "00000000000" // update this with actual ID if using Firebase 

// URL for first launch
// Krok 2 Booktago: aplikacja startuje z nowego adresu. Stary host zostaje
// dozwolony (linki z SMS-ów, QR i wizytówek z app.booksero.com otwierają się
// w aplikacji, a nie w Safari).
let rootUrl = URL(string: "https://booktago.app")!

// allowed origin is for what we are sticking to pwa domain
// This should also appear in Info.plist (WKAppBoundDomains) and in
// Entitlements.plist (applinks / webcredentials)
let allowedOrigins: [String] = ["booktago.app", "app.booksero.com"]

// auth origins will open in modal and show toolbar for back into the main origin.
// These should also appear in Info.plist
let authOrigins: [String] = []
// allowedOrigins + authOrigins <= 10

let platformCookie = Cookie(name: "app-platform", value: "iOS App Store")

// UI options
let displayMode = "standalone" // standalone / fullscreen.
let adaptiveUIStyle = true     // iOS 15+ only. Change app theme on the fly to dark/light related to WebView background color.
let overrideStatusBar = false   // iOS 13-14 only. if you don't support dark/light system theme.
let statusBarTheme = "dark"    // dark / light, related to override option.
let pullToRefresh = true    // Enable/disable pull down to refresh page
