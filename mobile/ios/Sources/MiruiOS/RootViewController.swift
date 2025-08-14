import UIKit
import Turbo
import WebKit

class RootViewController: UITabBarController {
    
    private let baseURL = URL(string: "http://localhost:3000")!
    private var turboSessions: [Session] = []
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupTabs()
    }
    
    private func setupTabs() {
        let tabs = [
            createTab(title: "Time", path: "/time-tracking", icon: "clock.fill"),
            createTab(title: "Clients", path: "/clients", icon: "person.2.fill"),
            createTab(title: "Projects", path: "/projects", icon: "folder.fill"),
            createTab(title: "Reports", path: "/reports", icon: "chart.bar.fill"),
            createTab(title: "More", path: "/settings/profile", icon: "ellipsis.circle.fill")
        ]
        
        viewControllers = tabs
        selectedIndex = 0
    }
    
    private func createTab(title: String, path: String, icon: String) -> UIViewController {
        let navController = TurboNavigationController()
        navController.tabBarItem = UITabBarItem(
            title: title,
            image: UIImage(systemName: icon),
            selectedImage: UIImage(systemName: icon)
        )
        
        let url = baseURL.appendingPathComponent(path)
        let viewController = TurboViewController(url: url)
        navController.viewControllers = [viewController]
        
        return navController
    }
}

class TurboNavigationController: UINavigationController {
    
    private lazy var session: Session = {
        let configuration = WKWebViewConfiguration()
        configuration.applicationNameForUserAgent = "Miru iOS"
        configuration.preferences.javaScriptEnabled = true
        
        let session = Session(webViewConfiguration: configuration)
        session.delegate = self
        return session
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        navigationBar.prefersLargeTitles = false
    }
    
    override func pushViewController(_ viewController: UIViewController, animated: Bool) {
        super.pushViewController(viewController, animated: animated)
        
        if let turboVC = viewController as? TurboViewController {
            turboVC.session = session
        }
    }
}

extension TurboNavigationController: SessionDelegate {
    
    func session(_ session: Session, didProposeVisit proposal: VisitProposal) {
        let viewController = TurboViewController(url: proposal.url)
        
        if proposal.options.action == .replace {
            let viewControllers = Array(self.viewControllers.dropLast()) + [viewController]
            setViewControllers(viewControllers, animated: false)
        } else {
            pushViewController(viewController, animated: true)
        }
        
        session.visit(viewController)
    }
    
    func session(_ session: Session, didFailRequestForVisitable visitable: Visitable, error: Error) {
        let alert = UIAlertController(
            title: "Error",
            message: error.localizedDescription,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    func sessionWebViewProcessDidTerminate(_ session: Session) {
        session.reload()
    }
}

class TurboViewController: VisitableViewController {
    
    var session: Session?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configure pull to refresh
        visitableView.allowsPullToRefresh = true
        visitableView.scrollView.refreshControl?.addTarget(
            self,
            action: #selector(refresh),
            for: .valueChanged
        )
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        if let session = session {
            session.visit(self)
        }
    }
    
    @objc private func refresh() {
        session?.reload()
    }
}