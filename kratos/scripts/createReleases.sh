set -ex

set +x
printf "\n<GroupedLog>\n"
printf "Initial setups (...)\n"
set -x
mkdir -p /root/docker/git
cd /root/docker/git
git clean -d -f
git reset --hard
git config user.email "kratos-noreply@tokopedia.com"
git config user.name "kratosbot (Automated Weekly Github Releases)"

# set npm to access private pkg
npm set email "kratos.bot@tokopedia.com"
npm set @tokopedia:registry https://npm.pkg.github.com
set +x
npm set //npm.pkg.github.com/:_authToken <%= githubToken %>
set -x

eval `ssh-agent`
ssh-add /root/docker/git.key
git checkout master
git reset --hard HEAD
git for-each-ref --format '%(refname:short)' refs/heads | grep -v master | xargs git branch -D || true
git fetch origin master
git reset --hard origin/master
git checkout -b jacky/create-release-auto
set +x
printf "\n</GroupedLog>\n"

printf "\n<GroupedLog>\n"
printf "lerna bootstrap\n"
set -x
pnpm run init:build
set +x
printf "\n</GroupedLog>\n"

printf "\n<GroupedLog>\n"
printf "Syncing up local tags with remote\n"
set -x
# prune local refs that no longer exist in the remote
git remote prune origin
# sync up local tags with remote
git tag -l | xargs git tag -d && git fetch -t
set +x
printf "\n</GroupedLog>\n"

# push branch to remote
git push -u origin jacky/create-release-auto -f

# create github release
printf "\n<GroupedLog>\n"
printf "Running lerna to create releases\n"
set -x
# deleting husky manually because HUSKY_SKIP_HOOKS doesn't work on the build server for some reason
rm -rf /root/docker/git/node_modules/husky
GH_TOKEN=<%= githubToken %> HUSKY_SKIP_HOOKS=true npm run create-release -- --yes

# update lockfile
pnpm run init:build
# remove husky
rm -rf /root/docker/git/node_modules/husky
# push new commit
git add .
HUSKY_SKIP_HOOKS=true git commit -m "chore: update lockfile"
git push origin HEAD:jacky/create-release-auto

set +x
printf "\n</GroupedLog>\n"

printf "\n<GroupedLog>\n"
printf "Clean ups\n"
set -x
# reset HEAD
git checkout master
git reset --hard HEAD

# delete branch in local
git branch -D jacky/create-release-auto

# kill ssh-agent
eval `ssh-agent -k`
set +x
printf "\n</GroupedLog>\n"
