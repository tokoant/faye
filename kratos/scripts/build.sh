#!/bin/bash

set -ex

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
git clean -d -f
git reset --hard
git config user.email "kratos.bot@tokopedia.com"
git config user.name "Kratos (Tokopedia-lite-Staging-Deploy-Bot-Kratos)"
git for-each-ref --format '%(refname:short)' refs/heads | grep -v master | xargs git branch -D || true
ssh-agent bash -c "set -ex && ssh-add /root/docker/git.key && git fetch origin <%= git.fetch %> --update-head-ok --force"
git reset --hard HEAD
git checkout <%= git.commit %>

# set npm to access private pkg
npm set email "kratos.bot@tokopedia.com"
npm set @tokopedia:registry https://npm.pkg.github.com
set +x
npm set //npm.pkg.github.com/:_authToken <%= githubToken %>
set -x

# remove all but current service folder
mv <%= appFolder %> /tmp/dockerBuildCache
rm -rf services
mkdir services
mv /tmp/dockerBuildCache <%= appFolder %>

# check and install desired node version
NODE_VERSION=<%= node_version %>
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
set +x
which pnpm
pnpm -v
node -v


# exit 0

if [ \( -f "pnpm-lock.yaml" \) ]; then


  # bootstrap the repo using pnpm
  set +x
  printf "\n</GroupedLog>\n"

  printf "\n<GroupedLog>\n"
  printf "pnpm recursive install\n"
  set -x
  pnpm run init:build

  # --service flag will be used to detect what local packages/pluggables we want to build, to avoid building everything
  node scripts/ci/build-packages.js --service=<%= appName %>
  cp ./config/<%= appName %>/env.<%= envFile %>.consul <%= appFolder %>/.env
  rm -rf <%= appFolder %>/build
  set +x
  printf "\n</GroupedLog>\n"

  printf "\n<GroupedLog>\n"
  printf "pnpm run <%= appName %>:build\n"
  printf "Build env: <%= buildEnv %>"
  set -x

  if [ "<%= buildEnv %>" != "" ]; then
    export <%= buildEnv %>
    echo "<%= (buildEnv || '').replace(/ /g, '\\n') %>" >> <%= appFolder %>/.env
  fi

  NODE_ENV=production KRATOS=true pnpm run <%= appName %>:build
  set +x
  printf "\n</GroupedLog>\n"

  printf "\n<GroupedLog>\n"
  printf "Remove devDependencies\n"
  # This is the correct way, but pnpm has a bug pruning workspaces
  # https://github.com/pnpm/pnpm/issues/2396
  pwd
  # NO_POST_INSTALL=1 pnpm recursive prune --prod

  # This is our temporary workaround
  set -x
  rm -rf /tmp/lite-build/node_modules/
  mkdir -p /tmp/lite-build/node_modules/.cache
  mv node_modules/.cache /tmp/lite-build/node_modules/
  rm -rf ./node_modules/
  set -x
  NO_POST_INSTALL=1 pnpm recursive install --prod
  set +x

  if [ \( -d "/tmp/lite-build/node_modules/.cache/" \) ]; then
    rm -rf node_modules/.cache
    mv /tmp/lite-build/node_modules/.cache/ node_modules/
  fi
  printf "\n</GroupedLog>\n"

else 
  # bootstrap the repo using yarn + lerna (normal flow)
  set +x
  printf "\n</GroupedLog>\n"

  printf "\n<GroupedLog>\n"
  printf "lerna bootstrap\n"
  set -x
  lerna bootstrap
  cp ./config/<%= appName %>/env.<%= envFile %>.consul <%= appFolder %>/.env
  rm -rf <%= appFolder %>/build
  set +x
  printf "\n</GroupedLog>\n"

  printf "\n<GroupedLog>\n"
  printf "yarn <%= appName %>:build\n"
  printf "Build env: <%= buildEnv %>"
  set -x

  if [ "<%= buildEnv %>" != "" ]; then
    export <%= buildEnv %>
    echo "<%= (buildEnv || '').replace(/ /g, '\\n') %>" >> <%= appFolder %>/.env
  fi

  NODE_ENV=production yarn <%= appName %>:build
  set +x
  printf "\n</GroupedLog>\n"

  printf "\n<GroupedLog>\n"
  printf "NO_POST_INSTALL=1 lerna bootstrap -- --production\n"
  set -x
  NO_POST_INSTALL=1 lerna bootstrap -- --production
  set +x
  printf "\n</GroupedLog>\n"
fi

printf "\n<GroupedLog>\n"
printf "Moving node_modules/.cache directory...\n"
set -x
rm -rf /tmp/lite-build/node_modules/
mkdir -p /tmp/lite-build/node_modules/.cache
mv node_modules/.cache /tmp/lite-build/node_modules/
set +x
printf "\n</GroupedLog>\n"

printf "\n<GroupedLog>\n"
printf "docker build --file <%= appFolder %>/docker/staging/Dockerfile (...)\n"
set -x
docker build --file <%= appFolder %>/docker/staging/Dockerfile \
    --label commit=<%= git.commit %> \
    --tag <%= registryHost %>/<%= fullServiceName %>:latest \
    --tag <%= registryHost %>/<%= fullServiceName %>:<%= git.commit %> \
    --tag gcr.io/tkpd-stag-kratos-003f/kratos-old/<%= fullServiceName %>:<%= git.commit %> \
    --tag gcr.io/tkpd-prod-kratos-a2bf/kratos-old/<%= fullServiceName %>:<%= git.commit %> \
    .
set +x
printf "\n</GroupedLog>\n"
set -x

printf "\n<GroupedLog>\n"
printf "Moving back node_modules/.cache directory...\n"
set -x
if [ \( -d "/tmp/lite-build/node_modules/.cache/" \) ]; then
  rm -rf node_modules/.cache
  mv /tmp/lite-build/node_modules/.cache/ node_modules/
fi
set +x
printf "\n</GroupedLog>\n"

USEOSSBUCKET="<%= useOSS %>"

if [ \( -d "services/<%= appName %>/build/client" \) ]; then
  set +x
  printf "\n<GroupedLog>\n"
  printf "Uploading client folder to CDN\n"
  set -x

  if [ $USEOSSBUCKET == "true" ]; then
    # Aliyun just upload all assets
    oss -c ~/.ossutilconfig<%= envFile %> cp --force --recursive "services/<%= appName %>/build/client/" oss://tqp-<%= envFile %>/assets-tokopedia-lite/v2/<%= appName %>/kratos/
  else
    # copy non-brotli and non-wasm files and non *.map files
    aws s3 cp --recursive "services/<%= appName %>/build/client/" s3://tokopedia-upload/assets-tokopedia-lite/v2/<%= appName %>/kratos/ \
      --exclude="*.br" --exclude="**/*.br" --exclude="*.wasm" --exclude="**/*.wasm" \
      --exclude="*.map" --exclude="**/*.map"

    # copy .wasm files
    aws s3 cp --recursive "services/<%= appName %>/build/client/" s3://tokopedia-upload/assets-tokopedia-lite/v2/<%= appName %>/kratos/ \
      --exclude="*" --include="*.wasm" --include="**/*.wasm" --content-type="application/wasm"

    # cp js brotli files
    aws s3 cp --recursive "services/<%= appName %>/build/client/" s3://tokopedia-upload/assets-tokopedia-lite/v2/<%= appName %>/kratos/ \
      --exclude="*" --include="**/*.js.br" \
      --include="*.js.br" --content-encoding br --content-type="application/javascript"

    # cp css brotli files
    aws s3 cp --recursive "services/<%= appName %>/build/client/" s3://tokopedia-upload/assets-tokopedia-lite/v2/<%= appName %>/kratos/ \
      --exclude="*" --include="**/*.css.br" \
      --include="*.css.br" --content-encoding br --content-type="text/css"

    # cp svg brotli files
    aws s3 cp --recursive "services/<%= appName %>/build/client/" s3://tokopedia-upload/assets-tokopedia-lite/v2/<%= appName %>/kratos/ \
      --exclude="*" --include="**/*.svg.br" \
      --include="*.svg.br" --content-encoding br --content-type="image/svg+xml"

    # cp wasm brotli files
    aws s3 cp --recursive "services/<%= appName %>/build/client/" s3://tokopedia-upload/assets-tokopedia-lite/v2/<%= appName %>/kratos/ \
      --exclude="*" --include="**/*.wasm.br" \
      --include="*.wasm.br" --content-encoding br --content-type="application/wasm"

    # cp source maps to private bucket
    aws s3 cp --recursive "services/<%= appName %>/build/client/" s3://sources-maps/tkpd-web/tokopedia-lite/v2/<%= appName %>/kratos/ \
      --exclude="*" --include="**/*.map" \
      --include="*.map" --content-type="application/json"
  fi

  set +x
  printf "\n</GroupedLog>\n"
  set -x
fi

set +x
printf "\n<GroupedLog>\n"
printf "docker pushes and cleanups\n"
set -x

ISCLOUDRUN="<%= isCloudRun %>"

if [ $ISCLOUDRUN == "true" ]; then
  docker push gcr.io/tkpd-stag-kratos-003f/kratos-old/<%= fullServiceName %>:<%= git.commit %>
  echo "Pushing to Google Cloud Registy [Staging]: gcr.io/tkpd-stag-kratos-003f/kratos-old/<%= fullServiceName %>:<%= git.commit %>"
  docker push gcr.io/tkpd-prod-kratos-a2bf/kratos-old/<%= fullServiceName %>:<%= git.commit %>
  echo "Pushing to Google Cloud Registy [Production]: gcr.io/tkpd-prod-kratos-a2bf/kratos-old/<%= fullServiceName %>:<%= git.commit %>"
else
  docker push <%= registryHost %>/<%= fullServiceName %>:latest
  docker push <%= registryHost %>/<%= fullServiceName %>:<%= git.commit %>
fi



docker rmi -f $(docker images | grep -v 'bitnami\|REPOSITORY' | awk '{ print $3 }' | uniq ) || true

# We want to prune everything except network, so we don't use `docker system prune` because it can prune networks too.
# All have `--force` flag so they will not prompt for confirmation
# The `|| true` is used to make the pruning optional. Because Docker can only run one prune operation at a time, calling prune again will throw error. The `|| true` will prevent it from causing the error from halting the script.
docker container prune --force || true
docker image prune --force || true
docker volume prune --force || true
docker builder prune --force || true

set +x
printf "\n</GroupedLog>\n"
set -x

set +x
echo "Debugging information:"
# for debugging
which pnpm
which node
pnpm -v
node -v
set -x
