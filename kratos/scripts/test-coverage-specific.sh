set -ex

all_services=(aether arael ares artemis atlas atreus b2b chimera courier freyja gundala hera hermes icarus intools medusa megaira mentor mercurius midas mynakama openapi pegasus phoenix play poseidon segmentation theseus thor yggdrasil zeus)

all_packages=(eslint-plugin-tokopedia-lite lite-client-logger lite-components lite-config lite-testing lite-utils lite-shared-config script-controller)

all_pluggables=(components chat notification topads-widget uploadpedia)

declare "min_config_version_aether=2"
declare "min_config_version_ares=2"
declare "min_config_version_atreus=4"
declare "min_config_version_hermes=2"
declare "min_config_version_xpol=2"
declare "min_config_version_zeus=5"

array_get() {
  local array=$1 index=$2
  local i="${array}_$index"
  echo "${!i}"
}

# If run on other branches, it will find the changed files compared to master
#   - The collected coverage will be diffed against the latest one on mongo, then added to github status and comment

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


# set npm to access private pkg
npm set email "kratos.bot@tokopedia.com"
npm set @tokopedia:registry https://npm.pkg.github.com

set +x
npm set //npm.pkg.github.com/:_authToken <%= githubToken %>
set -x

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

# use correct node version based on .nvmrc file
# nvm use
# install pnpm for the node version used, in case it isn't available yet
PNPM_VERSION=4
npm install -g pnpm@$PNPM_VERSION

# for debugging
which pnpm
pnpm -v
node -v

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


check_test_config() {
  set +x
  printf "Checking if Jest config of $1/$2 is up to date...\n"
  set -x

  if [[ -n "$(array_get min_config_version $2)" ]]
  then
    if [ $(cat $1/$2/jest.config.js.version) -ge $(array_get min_config_version $2) ]
    then
      set +x
      printf "✓ Jest config of $1/$2 is up to date.\n"
      set -x
    else
      set +x
      printf "Failed. Jest config of $1/$2 is outdated. Please rebase the code to latest master first.\n"
      set -x

      exit 1
    fi
  else
    set +x
    printf "No check needed. $1/$2 doesn't have minimum Jest config version.\n"
    set -x
  fi
}

run_test_with_coverage() {
  check_test_config $1 $2

  KRATOS_DIFF_CI=true npm run $2:test -- --no-colors <%= useJestCache ? '' : '--no-cache' %> --maxWorkers=<%= maxWorkers %> <%= '--reporters ' + jestReporters.join(' --reporters ') %> --coverage <%= '--coverageReporters ' + coverageReporters.join(' --coverageReporters ') %>
}

run_test() {
  check_test_config $1 $2

  npm run $2:test -- --no-colors <%= useJestCache ? '' : '--no-cache' %> --maxWorkers=<%= maxWorkers %> <%= '--reporters ' + jestReporters.join(' --reporters ') %>
}

run_tests_with_coverage() {
  entry_type="$1"
  shift
  test_entries=("$@")
  for entry in "${test_entries[@]}"
  do
    printf "\n<GroupedLog>\n"
    printf "Test $entry with coverage\n"
    set -x

    run_test_with_coverage $entry_type $entry

    set +x
    printf "\n</GroupedLog>\n"
  done
}

run_tests() {
  entry_type="$1"
  shift
  test_entries=()

  # this loop is basically: all_services minus service_to_be_tested
  # if we change a package, we want to test all service, but we only want to "test with coverage" for some services
  # example:
  #   all_services =(ares atreus atropos)
  #   service_to_be_tested = (atreus)
  #   the PR change lite-tools
  #   we run_test for ares and atropos
  #   we run_test_with_coverage for atreus only
  for i in "$@";
  do
      skip=
      for j in "${service_to_be_tested[@]}"; do
          [[ $i == $j ]] && { skip=1; break; }
      done
      [[ -n $skip ]] || test_entries+=("$i")
  done

  for entry in "${test_entries[@]}"
  do
    printf "\n<GroupedLog>\n"
    printf "Test $entry\n"
    set -x

    run_test $entry_type $entry

    set +x
    printf "\n</GroupedLog>\n"
  done
}

run_type_check() {
  npm run $1:type-check
}

run_type_checks() {
  test_entries=("$@")
  whitelisted_services=(<%= servicesEnableTypeChecking %>)

  for whitelisted_service in "${whitelisted_services[@]}"
  do
    if [[ " ${test_entries[@]} " =~ " ${whitelisted_service} " ]]; then
      printf "\n<GroupedLog>\n"
      printf "Check Type in $whitelisted_service\n"
      set -x
      
      run_type_check $whitelisted_service

      set +x
      printf "\n</GroupedLog>\n"
    fi
  done
}

<% if (servicesToBeTested.length === 0) { %>

## Run these Core tests only if we are not getting missing coverage. If we are getting missing coverage, these Core tests are already done in initial phase of test-coverage-specific.sh


### Core Package Test
printf "\n<GroupedLog>\n"
printf "Test Core\n"
set -x

run_test "core" "core"

set +x
printf "\n</GroupedLog>\n"
### End of Core Package Test


### Core Scripts Test
printf "\n<GroupedLog>\n"
printf "Test Core Scripts\n"
set -x

run_test "core" "scripts"

set +x
printf "\n</GroupedLog>\n"
### End of Core Scripts Test


### ESLint Test
printf "\n<GroupedLog>\n"
printf "Run ESLint\n"
set -x

npm run lint:ci

set +x
printf "\n</GroupedLog>\n"
### End of ESLint Test

<% } %>

## Determine services to be tested
printf "\n<GroupedLog>\n"
printf "Determine services to be tested\n"
set -x
<% if (git.fetch === 'master') { %>
  <% for (let i = 0; i < servicesToBeTested.length; i += 1) { %>
    service_to_be_tested+=( "<%= servicesToBeTested[i] %>" )
  <% } %>

<% } else { %>
  changed_files=$(git diff `git merge-base HEAD origin/master`..HEAD --name-only)

  for the_file in $changed_files
  do
    if [[ $the_file == services/* || $the_file == config/* ]]
    then
      service_name=$(echo $the_file | cut -f2 -d"/")
      service_package_json="services/$service_name/package.json"

      if [[ -f "$service_package_json" ]]; then
        service_to_be_tested+=( "$service_name" )
      fi
    elif [[ $the_file == pnpm-lock.yaml || $the_file == .github/CODEOWNERS || $the_file == .ownership.json || $the_file == scripts/* ]]
    then
      # Colon means do nothing. We do nothing for these global files since their test already covered by Core Test and Scripts Test
      :
    else
      need_to_test_all=true
      service_to_be_tested+=( "${all_services[@]}" )
    fi
  done
<% } %>

### Remove duplicate elements in service_to_be_tested (if any)
service_to_be_tested=($(echo "${service_to_be_tested[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))

set +x
printf "✓ Services to be tested: "
echo "${service_to_be_tested[@]}"
printf "\n</GroupedLog>\n"
## End of Determine affected services

## Start of each service type checking
run_type_checks "${service_to_be_tested[@]}"
## End of each service type checking

## need to test all because package/pluggables changed
if [[ $need_to_test_all == true ]]
then
  run_tests "services" "${all_services[@]}"
  run_tests "packages" "${all_packages[@]}"
  run_tests "pluggables" "${all_pluggables[@]}"
fi

## Start of each service coverage test
run_tests_with_coverage "services" "${service_to_be_tested[@]}"
## End of each service coverage test

## Start of getting latest line coverage percentage ##
get_coverages() {
  entry_type="$1"
  shift
  service_entries=("$@")
  for entry in "${service_entries[@]}"
  do
    ### Output each entry coverage summary to STDOUT, kratos will parse and add them to database
    printf "\n<GroupedLog>\n"
    printf "Getting $entry's coverage summary from the json-summary\n"
    set +x

    # output to STDOUT
    # used in ./kratos/server/util/runShellScript/runPostDeploy.js
    echo "<<< START OF COVERAGE SUMMARY OUTPUT >>>"
    cat "services/${entry}/coverage/coverage-summary.json" | jq -r -a ".total + {service: \"$entry\"}"
    echo "<<< END OF COVERAGE SUMMARY OUTPUT >>>"

    printf "\n</GroupedLog>\n"
    ### End of Output each entry coverage summary to STDOUT, kratos will parse and add them to database
  done
}

get_coverages "services" "${service_to_be_tested[@]}"

## End of getting latest line coverage percentage ##

# End of test

printf "✓ Success. Coverage collected and stored\n"
set -x

set +x
echo "Debugging information:"
# for debugging
which pnpm
which node
pnpm -v
node -v
set -x
