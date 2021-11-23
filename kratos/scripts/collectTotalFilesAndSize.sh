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

rm -rf $1 ./node_modules
echo "Deleting root node_modules"

rm -rf $1 ./services/*/node_modules
echo "Deleting services node_modules"

rm -rf $1 ./pluggables/*/node_modules
echo "Deleting pluggables node_modules"

rm -rf $1 ./packages/*/node_modules
echo "Deleting packages node_modules"

rm -rf $1 ./packages/*/dist
echo "Deleting dist packages"

rm -rf $1 ./pluggables/*/dist
echo "Deleting dist pluggables"

ls -a

echo "<<< START OF TOTAL FILES OUTPUT >>>"
find . -not -path '*/\.*' -type f | wc -l
echo "<<< END OF TOTAL FILES OUTPUT >>>"

echo "<<< START OF TOTAL SIZE OUTPUT >>>"
du -shk .
echo "<<< END OF TOTAL SIZE OUTPUT >>>"

docker rmi -f $(docker images | grep -v 'bitnami\|REPOSITORY' | awk '{ print $3 }' | uniq ) || true

# We want to prune everything except network, so we don't use `docker system prune` because it can prune networks too.
# All have `--force` flag so they will not prompt for confirmation
# The `|| true` is used to make the pruning optional. Because Docker can only run one prune operation at a time, calling prune again will throw error. The `|| true` will prevent it from causing the error from halting the script.
docker container prune --force || true
docker image prune --force || true
docker volume prune --force || true
docker builder prune --force || true
