package com.saeloun.miru.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import dev.hotwire.turbo.fragments.TurboWebFragment
import dev.hotwire.turbo.delegates.TurboWebFragmentDelegate
import dev.hotwire.turbo.nav.TurboNavGraphDestination
import com.saeloun.miru.R
import com.saeloun.miru.MiruApplication

@TurboNavGraphDestination(uri = "turbo://fragment/web")
class WebFragment : TurboWebFragment() {
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_web, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Configure pull to refresh
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            userAgentString = "$userAgentString ${MiruApplication.USER_AGENT}"
        }
        
        // Add custom styling for mobile
        webView.evaluateJavascript("""
            document.documentElement.classList.add('turbo-native');
            document.documentElement.classList.add('turbo-native-android');
        """.trimIndent(), null)
    }
    
    override fun createWebViewClient(): TurboWebViewClient {
        return MiruWebViewClient(session)
    }
    
    override fun shouldObserveTitleChanges(): Boolean {
        return true
    }
    
    private inner class MiruWebViewClient(session: TurboSession) : TurboWebViewClient(session) {
        
        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            
            // Inject mobile-specific CSS
            view?.evaluateJavascript("""
                (function() {
                    var style = document.createElement('style');
                    style.innerHTML = `
                        .turbo-native-android {
                            padding-top: env(safe-area-inset-top);
                            padding-bottom: env(safe-area-inset-bottom);
                        }
                        
                        .turbo-native-android .desktop-only {
                            display: none !important;
                        }
                        
                        .turbo-native-android .bottom-nav {
                            display: none !important;
                        }
                    `;
                    document.head.appendChild(style);
                })();
            """.trimIndent(), null)
        }
    }
}