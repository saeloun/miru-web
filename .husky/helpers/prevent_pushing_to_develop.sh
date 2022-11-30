#!/bin/sh

prevent_pushing_to_develop() {
  current_branch=`git symbolic-ref HEAD`
  current_origin=`git remote`
  if [ current_origin = "origin" -o "$current_branch" = "refs/heads/develop" -o "$current_branch" = "refs/heads/main" ]
  then
  cat <<EOT
======================================================================================
You are not authorized to push/commit directly to develop/main branch in origin remote.
Push from a new branch and make the PR.

Or if you are 100% sure you want to push/commit to develop/main branch,
then pass in the optional --no-verify option with the git command.

Example:
# Warning: pushing to develop is not recommended
git push origin develop --no-verify
======================================================================================
EOT
    echo "";
    exit 1;
  fi
}
