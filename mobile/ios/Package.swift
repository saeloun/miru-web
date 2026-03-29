// swift-tools-version:5.7
import PackageDescription

let package = Package(
    name: "MiruiOS",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "MiruiOS",
            targets: ["MiruiOS"]),
    ],
    dependencies: [
        .package(url: "https://github.com/hotwired/turbo-ios", from: "7.0.0"),
        .package(url: "https://github.com/hotwired/strada-ios", from: "1.0.0-beta1")
    ],
    targets: [
        .target(
            name: "MiruiOS",
            dependencies: [
                .product(name: "Turbo", package: "turbo-ios"),
                .product(name: "Strada", package: "strada-ios")
            ]),
        .testTarget(
            name: "MiruiOSTests",
            dependencies: ["MiruiOS"]),
    ]
)