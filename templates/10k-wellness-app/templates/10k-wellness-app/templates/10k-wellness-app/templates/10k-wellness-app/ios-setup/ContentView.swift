import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        WebViewContainer()
            .ignoresSafeArea()
    }
}

struct WebViewContainer: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        
        // Configure for better mobile experience
        webView.configuration.allowsInlineMediaPlayback = true
        webView.configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Enable JavaScript (required for React app)
        webView.configuration.preferences.javaScriptEnabled = true
        
        // Load your local development server or deployed app
        if let url = URL(string: "http://localhost:5173") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
        
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
        // Handle updates if needed
    }
}

#Preview {
    ContentView()
}