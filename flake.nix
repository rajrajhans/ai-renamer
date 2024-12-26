{
  description = "ai-renamer";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ ];

        pkgs = import nixpkgs {
          inherit overlays system;
        };

        common = [
          pkgs.nodejs_20
        ];

        dev =
          if builtins.getEnv "CI" != "true" then [
            pkgs.nixpkgs-fmt
            pkgs.fswatch
            pkgs.ack
            pkgs.python39
            pkgs.cmake
          ] else [ ];

        all = common ++ dev;

        inherit (pkgs) inotify-tools terminal-notifier;
        inherit (pkgs.lib) optionals;
        inherit (pkgs.stdenv) isDarwin isLinux;

        linuxDeps = optionals isLinux [ inotify-tools ];
        darwinDeps = optionals isDarwin [ terminal-notifier ]
          ++ (with pkgs.darwin.apple_sdk.frameworks; optionals isDarwin [
          CoreFoundation
          Foundation
        ]);

      in
      {
        devShells = {
          default = pkgs.mkShell {
            packages = with pkgs; all ++ linuxDeps ++ darwinDeps;
            shellHook = ''
              mkdir -p ./.npm-global
              npm config set prefix './.npm-global'
              export PATH=./.npm-global/bin:bin:$PATH
            '';
          };
        };
      });
}
