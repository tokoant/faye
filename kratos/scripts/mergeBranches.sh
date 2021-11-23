set -ex

mkdir -p /root/docker/git
cd /root/docker/git
git clean -d -f
git reset --hard
git config user.email "skipper.team@tokopedia.com"
git config user.name "kratosbot (Tokopedia-lite-Staging-Deploy-Bot-Kratos)"
ssh-agent bash -c "ssh-add /root/docker/git.key && \
 git fetch origin <%= sourceBranch %> --update-head-ok --force && \
 git fetch origin <%= targetBranch %> --update-head-ok --force"
git checkout <%= targetBranch %>
git reset --hard origin/<%= targetBranch %>
git merge origin/<%= sourceBranch %>
ssh-agent bash -c "ssh-add /root/docker/git.key && git push"

