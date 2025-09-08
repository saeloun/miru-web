package com.saeloun.miru

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.saeloun.miru.databinding.ActivityMainBinding
import dev.hotwire.turbo.activities.TurboActivity
import dev.hotwire.turbo.delegates.TurboActivityDelegate

class MainActivity : AppCompatActivity(), TurboActivity {
    
    override lateinit var delegate: TurboActivityDelegate
    private lateinit var binding: ActivityMainBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Initialize Turbo delegate
        delegate = TurboActivityDelegate(this, R.id.nav_host_fragment)
        
        setupBottomNavigation()
        configureTheme()
    }
    
    private fun setupBottomNavigation() {
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val navController = navHostFragment.navController
        
        binding.bottomNavigation.setupWithNavController(navController)
        
        // Handle reselection to scroll to top
        binding.bottomNavigation.setOnItemReselectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.navigation_time -> delegate.refresh()
                R.id.navigation_clients -> delegate.refresh()
                R.id.navigation_projects -> delegate.refresh()
                R.id.navigation_reports -> delegate.refresh()
                R.id.navigation_more -> delegate.refresh()
            }
        }
    }
    
    private fun configureTheme() {
        // Set status bar color
        window.statusBarColor = getColor(R.color.miru_purple)
        
        // Configure action bar
        supportActionBar?.apply {
            setBackgroundDrawable(getDrawable(R.color.miru_purple))
            elevation = 0f
        }
    }
}