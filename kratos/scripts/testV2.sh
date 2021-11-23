set -ex

# Initial setups
set +x
printf "\n<GroupedLog>\n"
printf "Initial setups (...)\n"
set -x

mkdir -p /root/docker/git
cd /root/docker/

if [ ! -d /root/docker/git/.git ]; then
  ssh-agent bash -c "set -ex && ssh-add /root/docker/git.key && git clone git@github.com:tokopedia/tokopedia-lite.git git"
fi

cd /root/docker/git

## Cleanup failed rebase from prior test (if exists).
if [ -d ".git/rebase-apply" ]
then
  rm -r .git/rebase-apply
fi

if [ -d ".git/rebase-merge" ]
then
  rm -r .git/rebase-merge
fi
## End of Cleanup failed rebase from prior test.

## Remove untracked files and directories.
git clean -d -f

git config user.email "skipper.team@tokopedia.com"
git config user.name "kratosbot (Tokopedia-lite-Staging-Deploy-Bot-Kratos)"

# Set npm to access private pkg
npm set email "kratos.bot@tokopedia.com"
npm set @tokopedia:registry https://npm.pkg.github.com

set +x
npm set //npm.pkg.github.com/:_authToken <%= githubAccessToken %>
set -x
# Enf of Set npm to access private pkg

<% if (git.fetch === 'master') { %>
  ssh-agent bash -c "set -ex && ssh-add /root/docker/git.key && git fetch origin master && git fetch origin <%= git.commit %>"
<% } else { %>
  ssh-agent bash -c "set -ex && ssh-add /root/docker/git.key && git fetch origin master && git fetch origin <%= git.fetch %>"
<% } %>

git reset --hard origin/master
git checkout <%= git.commit %>

set +x
printf "\n</GroupedLog>\n"
# End of Initial setups


# Rebase code to latest master
printf "\n<GroupedLog>\n"
printf "Rebase code to latest master\n"

<% if (git.fetch === 'master') { %>
  printf "No rebase needed because this test run on \"master\"\n"
<% } else { %>
  set -x

  git rebase origin/master

  set +x
<% } %>

printf "\n</GroupedLog>\n"
# End of Rebase code to latest master


# Bootstrapping
printf "\n<GroupedLog>\n"
printf "Bootstrap\n"
set -x

# check and install desired node version
NODE_VERSION=<%= nodeVersion %>
echo "v$NODE_VERSION" > .nvmrc
cat .nvmrc

# setup nvm source
source ~/.nvm/nvm.sh --no-use
source ~/.nvm/bash_completion

# TODO: install supported node js in playbook layer to avoid installing every build
# nvm will install node if not available, if avilable it will just use
nvm install

# install pnpm for the node version used, in case it isn't available yet
npm install -g pnpm@4

# for debugging
which pnpm
pnpm -v
node -v

# clean up node_modules
# to supporting multi node version, we need to clean up node_modules
# to prevent incompatible dependencies issue
rm -rf ./node_modules

# install dependencies and build packages
pnpm run init:build
node scripts/ci/build-packages.js

set +x
printf "\n</GroupedLog>\n"
# End of Bootstraping

# Check pnpm-lock.yaml
printf "\n<GroupedLog>\n"
printf "Check pnpm-lock.yaml\n"
set -x

git diff pnpm-lock.yaml

set +x

if [ $(git diff pnpm-lock.yaml | wc -c) -gt 0 ]
then
  printf "✘ There are pnpm-lock.yaml changes that are not commited. Maybe you or someone else updated dependencies but forgot to update pnpm-lock.yaml. Please check.\n"
  exit 1
else
  printf "✓ pnpm-lock.yaml is already up to date\n"
fi

printf "\n</GroupedLog>\n"
# End of Check pnpm-lock.yaml

# Start of test

## Clear Jest cache
printf "\n<GroupedLog>\n"
printf "Clear Jest cache\n"
set -x

<% if (useJestCache) { %>
  # Clear Jest cache because we use Jest cache.
  ./node_modules/.bin/jest --clearCache
<% } else { %>
  printf "✓ Skip clearing Jest cache because this test doesn't use Jest cache\n"
<% } %>

set +x
printf "\n</GroupedLog>\n"
## End of Clear Jest cache


### ESLint Test
printf "\n<GroupedLog>\n"
printf "Run ESLint\n"
set -x

npm run lint:ci

set +x
printf "\n</GroupedLog>\n"
### End of ESLint Test


## Start type checking
printf "\n<GroupedLog>\n"
printf "Run Type Checking\n"
set -x

pnpm run type-check --filter "...[origin/master]" --if-present --workspace-concurrency=3

set +x
printf "\n</GroupedLog>\n"
## End type checking

## Start test all changed projects + it's dependents
printf "\n<GroupedLog>\n"
printf "Run Tests\n"
set -x

pnpm test --filter "...[origin/master]" --workspace-concurrency=1 -- --no-colors <%= useJestCache ? '' : '--no-cache' %> --maxWorkers=<%= maxWorkers %> <%= '--reporters ' + jestReporters.join(' --reporters ') %> <%= coverage ? '--coverage' : '' %> <%= coverage ? '--coverageReporters ' + coverageReporters.join(' --coverageReporters ') : '' %>

set +x
printf "\n</GroupedLog>\n"
## End test all changed projects + it's dependents


## Upload Code Coverage report
<% if (coverage) { %>

  upload_coverages() {
    entry_type="$1"
    for entry in "${entry_type}"/*/
    do
        ### Upload each entry coverage
        printf "\n<GroupedLog>\n"
        printf "Upload $entry coverage\n"
        set -x

        if [ -d "${entry}coverage" ]
        then
          aws s3 cp --recursive "${entry}coverage/" s3://sources-maps/coverage/<%= git.commit %>/$entry
        else
          printf "✓ NOT uploading ${entry}coverage because it doesn't exist\n"
        fi

        set +x
        printf "\n</GroupedLog>\n"
        ### End of Upload each entry coverage
    done
  }

  ## Start of uploading Code Coverage report


  ### Upload Core Scripts Coverage
  ### We don't upload Core Package coverage because it doesn't have coverage since it doesn't test source code (it test functionality)
  printf "\n<GroupedLog>\n"
  printf "Upload Core Scripts Coverage\n"
  set -x

  if [ -d "scripts/coverage" ]
  then
    aws s3 cp --recursive "scripts/coverage" s3://sources-maps/coverage/<%= git.commit %>/core-scripts/
  else
    printf "✓ NOT uploading scripts/coverage because it doesn't exist\n"
  fi

  set +x
  printf "\n</GroupedLog>\n"
  ### End of Upload Core Scripts Coverage


  upload_coverages "packages"
  upload_coverages "pluggables"
  upload_coverages "services"
<% } %>
## End of Upload Code Coverage report

# End of test
set -x

set +x
echo "Debugging information:"
# for debugging
which pnpm
which node
pnpm -v
node -v
set -x
