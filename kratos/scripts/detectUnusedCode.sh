set -ex
mkdir -p /root/docker/git

cd /root/docker/

if [ ! -d /root/docker/git/.git ]; then
  ssh-agent bash -c "set -ex && ssh-add /root/docker/git.key && git clone git@github.com:tokopedia/tokopedia-lite.git git"
fi

cd /root/docker/git
git clean -d -f
git reset --hard
git config user.email "kratos.bot@tokopedia.com"
git config user.name "Kratos (Tokopedia-lite-Staging-Deploy-Bot-Kratos)"
git for-each-ref --format '%(refname:short)' refs/heads | grep -v master | xargs git branch -D || true
ssh-agent bash -c "ssh-add /root/docker/git.key && git fetch origin <%= git.fetch %> --update-head-ok --force"
git reset --hard HEAD
git checkout <%= git.commit %>

# set npm to access private pkg
npm set email "kratos.bot@tokopedia.com"
npm set @tokopedia:registry https://npm.pkg.github.com
set +x
npm set //npm.pkg.github.com/:_authToken <%= githubAccessToken %>
set -x

#remove all but current service folder
mv <%= appFolder %> /tmp/dockerBuildCache
rm -rf services
mkdir services
mv /tmp/dockerBuildCache <%= appFolder %>

# check and install desired node version
cat .nvmrc

# setup nvm source
source ~/.nvm/nvm.sh --no-use
source ~/.nvm/bash_completion

# TODO: install supported node js in playbook layer to avoid installing every build
# nvm will install node if not available, if avilable it will just use
nvm install

# use correct node version based on .nvmrc file
nvm use

# install pnpm for the node version used, in case it isn't available yet
npm install -g pnpm@4

pnpm run init:build

node scripts/ci/build-packages.js --service=<%= appName %>
cp ./config/<%= appName %>/env.staging.consul <%= appFolder %>/.env
rm -rf <%= appFolder %>/build

if [ "<%= buildEnv %>" != "" ]; then
  export <%= buildEnv %>
  echo "<%= (buildEnv || '').replace(/ /g, '\\n') %>" >> <%= appFolder %>/.env
fi

if [ "<%= appName %>" == "atreus" ]; then
  NODE_ENV=appName npm run <%= appName %>:check-unused:client -- --included-regex=<%= includedRegex %> --excluded-regex=<%= excludedRegex %>
else
  NODE_ENV=appName npm run <%= appName %>:build:client -- --check-unused --included-regex=<%= includedRegex %> --excluded-regex=<%= excludedRegex %>
fi

echo "<<< START OF UNUSED CODE OUTPUT >>>"
cat services/<%= appName %>/unusedCodeReport/client-report.json
echo "<<< END OF UNUSED CODE OUTPUT >>>"

docker rmi -f $(docker images | grep -v 'bitnami\|REPOSITORY' | awk '{ print $3 }' | uniq ) || true

# We want to prune everything except network, so we don't use `docker system prune` because it can prune networks too.
# All have `--force` flag so they will not prompt for confirmation
# The `|| true` is used to make the pruning optional. Because Docker can only run one prune operation at a time, calling prune again will throw error. The `|| true` will prevent it from causing the error from halting the script.
docker container prune --force || true
docker image prune --force || true
docker volume prune --force || true
docker builder prune --force || true
