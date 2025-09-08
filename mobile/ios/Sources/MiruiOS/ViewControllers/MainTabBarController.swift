import UIKit
import Turbo
import Strada
import Combine

// Jumpstart Pro-inspired tab bar controller with modern architecture
class MainTabBarController: UITabBarController {
    
    // MARK: - Properties
    private let sessionManager = SessionManager.shared
    private var cancellables = Set<AnyCancellable>()
    
    private let tabs = [
        TabConfiguration(
            title: "Time",
            path: "/time-tracking",
            icon: "clock.fill",
            color: UIColor.systemBlue
        ),
        TabConfiguration(
            title: "Clients",
            path: "/clients",
            icon: "person.2.fill",
            color: UIColor.systemGreen
        ),
        TabConfiguration(
            title: "Projects",
            path: "/projects",
            icon: "folder.fill",
            color: UIColor.systemOrange
        ),
        TabConfiguration(
            title: "Reports",
            path: "/reports",
            icon: "chart.bar.fill",
            color: UIColor.systemPurple
        ),
        TabConfiguration(
            title: "More",
            path: "/settings/profile",
            icon: "ellipsis.circle.fill",
            color: UIColor.systemGray
        )
    ]
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupTabs()
        configureAppearance()
        observeAuthenticationState()
    }
    
    // MARK: - Setup
    private func setupTabs() {
        let controllers = tabs.map { config in
            createNavigationController(for: config)
        }
        viewControllers = controllers
        selectedIndex = 0
    }
    
    private func createNavigationController(for config: TabConfiguration) -> UINavigationController {
        let navController = TurboNavigationController(
            sessionManager: sessionManager,
            modalSessionManager: sessionManager
        )
        
        navController.tabBarItem = UITabBarItem(
            title: config.title,
            image: UIImage(systemName: config.icon),
            selectedImage: UIImage(systemName: config.icon)
        )
        
        // Set initial URL
        let url = sessionManager.baseURL.appendingPathComponent(config.path)
        navController.route(to: url, options: VisitOptions(action: .replace))
        
        return navController
    }
    
    private func configureAppearance() {
        // Modern tab bar appearance
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .systemBackground
        
        // Selected item appearance
        appearance.stackedLayoutAppearance.selected.iconColor = UIColor.miruPurple
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: UIColor.miruPurple
        ]
        
        // Normal item appearance
        appearance.stackedLayoutAppearance.normal.iconColor = .systemGray
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor.systemGray
        ]
        
        tabBar.standardAppearance = appearance
        tabBar.scrollEdgeAppearance = appearance
        
        // Add shadow
        tabBar.layer.shadowColor = UIColor.black.cgColor
        tabBar.layer.shadowOffset = CGSize(width: 0, height: -2)
        tabBar.layer.shadowRadius = 8
        tabBar.layer.shadowOpacity = 0.05
    }
    
    private func observeAuthenticationState() {
        sessionManager.$isAuthenticated
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isAuthenticated in
                if !isAuthenticated {
                    self?.presentLoginScreen()
                }
            }
            .store(in: &cancellables)
    }
    
    private func presentLoginScreen() {
        let loginURL = sessionManager.baseURL.appendingPathComponent("/sign_in")
        let loginController = TurboViewController(url: loginURL)
        loginController.delegate = self
        
        let navController = UINavigationController(rootViewController: loginController)
        navController.modalPresentationStyle = .fullScreen
        
        present(navController, animated: true)
    }
}

// MARK: - Tab Configuration
struct TabConfiguration {
    let title: String
    let path: String
    let icon: String
    let color: UIColor
}

// MARK: - TurboViewController Delegate
extension MainTabBarController: TurboViewControllerDelegate {
    func turboViewControllerDidAuthenticate(_ controller: TurboViewController) {
        dismiss(animated: true) {
            // Reload all tabs after authentication
            self.viewControllers?.forEach { navController in
                if let turboNav = navController as? TurboNavigationController {
                    turboNav.reload()
                }
            }
        }
    }
}

// MARK: - UIColor Extensions
extension UIColor {
    static let miruPurple = UIColor(hex: "#5E5DF0")
    static let miruDarkPurple = UIColor(hex: "#1D1A31")
    static let miruGray = UIColor(hex: "#F3F4F6")
}