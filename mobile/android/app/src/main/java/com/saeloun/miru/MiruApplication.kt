package com.saeloun.miru

import android.app.Application
import android.webkit.WebView
import dev.hotwire.turbo.config.TurboConfig
import dev.hotwire.turbo.session.TurboSessionNavHostFragment
import dev.hotwire.strada.Strada

class MiruApplication : Application() {
    
    companion object {
        const val BASE_URL = "http://10.0.2.2:3000" // For emulator, use 10.0.2.2 for localhost
        const val USER_AGENT = "Miru Android"
    }
    
    override fun onCreate() {
        super.onCreate()
        
        // Enable WebView debugging in debug builds
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
        
        configureTurbo()
        configureStrada()
    }
    
    private fun configureTurbo() {
        TurboConfig.apply {
            debugEnabled = BuildConfig.DEBUG
            
            // Set the default fragment destination
            TurboSessionNavHostFragment.defaultFragmentDestination = 
                WebFragment::class
            
            // Configure path configuration from server
            pathConfiguration.load(
                TurboConfig.PathConfiguration.Location(
                    assetFilePath = "json/configuration.json"
                ),
                TurboConfig.PathConfiguration.Location(
                    remoteFileUrl = "$BASE_URL/turbo_native.json"
                )
            )
        }
    }
    
    private fun configureStrada() {
        Strada.config.apply {
            debugEnabled = BuildConfig.DEBUG
            
            // Register bridge components
            registerBridgeComponents(
                BridgeComponentFactories(
                    FormComponent,
                    MenuComponent,
                    ModalComponent,
                    FlashComponent
                )
            )
        }
    }
}