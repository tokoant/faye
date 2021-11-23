set -ex

mkdir -p /root/docker/git
cd /root/docker/git
git clean -d -f
git reset --hard
git config user.email "skipper.team@tokopedia.com"
git config user.name "kratosbot (Tokopedia-lite-Staging-Deploy-Bot-Kratos)"
git for-each-ref --format '%(refname:short)' refs/heads | grep -v master | xargs git branch -D || true
ssh-agent bash -c "ssh-add /root/docker/git.key && \
 git fetch origin <%= sourceBranch %> --update-head-ok --force && \
 git checkout <%= sourceBranch %> && \
 git reset --hard origin/<%= sourceBranch %> && \
 git push origin <%= sourceBranch %>:<%= targetBranch %>  -f"
