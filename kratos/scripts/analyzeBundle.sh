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
npm set //npm.pkg.github.com/:_authToken <%= githubToken %>
set -x

# clean all node_modules
rm -rf ./node_modules
rm -rf ./services/*/node_modules
rm -rf ./pluggables/*/node_modules
rm -rf ./packages/*/node_modules

#remove all but current service folder
mv <%= appFolder %> /tmp/dockerBuildCache
rm -rf services
mkdir services
mv /tmp/dockerBuildCache <%= appFolder %>

if [ \( -f "pnpm-lock.yaml" \) ]; then
  pnpm run init:build
  node scripts/ci/build-packages.js
  cp ./config/<%= appName %>/env.staging.consul <%= appFolder %>/.env
  rm -rf <%= appFolder %>/build

  if [ "<%= buildEnv %>" != "" ]; then
    export <%= buildEnv %>
    echo "<%= (buildEnv || '').replace(/ /g, '\\n') %>" >> <%= appFolder %>/.env
  fi

  ANALYZE_BUNDLE=true NODE_ENV=production npm run <%= appName %>:build:client

  # This is the correct way, but pnpm has a bug pruning workspaces
  # https://github.com/pnpm/pnpm/issues/2396
  pwd
  # NO_POST_INSTALL=1 pnpm recursive prune --prod

  # This is our temporary workaround
  rm -rf /tmp/lite-build/node_modules/
  mkdir -p /tmp/lite-build/node_modules/.cache
  mv node_modules/.cache /tmp/lite-build/node_modules/
  rm -rf ./node_modules
  set -x
  pnpm recursive install --prod
else
  lerna bootstrap
  cp ./config/<%= appName %>/env.staging.consul <%= appFolder %>/.env
  rm -rf <%= appFolder %>/build

  if [ "<%= buildEnv %>" != "" ]; then
    export <%= buildEnv %>
    echo "<%= (buildEnv || '').replace(/ /g, '\\n') %>" >> <%= appFolder %>/.env
  fi

  ANALYZE_BUNDLE=true NODE_ENV=production npm run <%= appName %>:build:client
  NO_POST_INSTALL=1 lerna bootstrap -- --production
fi

docker build --file <%= appFolder %>/docker/staging/Dockerfile \
    --label commit=<%= git.commit %> \
    --tag <%= registryHost %>/<%= appName %>:latest \
    --tag <%= registryHost %>/<%= appName %>:<%= git.commit %> \
    .

if [ \( -d "services/<%= appName %>/build/static" \) ]; then
  echo "Uploading bundle-analyze.<%= git.commit %>.html file to CDN"
  aws s3 cp "services/<%= appName %>/build/static/bundle-analyze.html" s3://tokopedia-upload/assets-tokopedia-lite/v2/<%= fullServiceName %>/kratos/bundle-analyze.<%= git.commit %>.html
fi

docker rmi -f $(docker images | grep -v 'bitnami\|REPOSITORY' | awk '{ print $3 }' | uniq ) || true

# We want to prune everything except network, so we don't use `docker system prune` because it can prune networks too.
# All have `--force` flag so they will not prompt for confirmation
# The `|| true` is used to make the pruning optional. Because Docker can only run one prune operation at a time, calling prune again will throw error. The `|| true` will prevent it from causing the error from halting the script.
docker container prune --force || true
docker image prune --force || true
docker volume prune --force || true
docker builder prune --force || true