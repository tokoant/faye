set -ex

if [ "<%= featureNumber %>" -gt "999" ]; then
  set +e
  echo "cloud run release"
  REGION=asia-southeast1
  PROJECT=<%= project %>
  LB_NAME=cloud-run-test-tokopedia-net

  SERVICE=feature-<%= featureNumber %>-<%= env %>
  SERVICE_HOST=<%= featureNumber %>-<%= env %>-feature.tokopedia.com
  SERVICE_BACKEND=$SERVICE-backend
  SERVICE_NEG=$SERVICE-neg
  SERVICE_MATCHER=$SERVICE-path-matcher

  # glcloud will ask confirmation (yes/no)
  # we tell the answer in the first place

  yes | gcloud run services delete $SERVICE \
  --project $PROJECT \
  --platform managed \
  --region asia-southeast1 || true
else
  echo "docker compose release"
  #STOP Feature
  cd /root/docker
  mkdir -p /root/docker/feature/<%= featureNumber %>
  touch /root/docker/feature/<%= featureNumber %>/.env
  cd /root/docker/feature/<%= featureNumber %>
  if [ -f docker-compose.yml ]; then
    docker-compose down --remove-orphans
  fi

  rm -f /var/consul/template/feature_<%= featureNumber %>.template
  rm -f /var/consul/config/feature_<%= featureNumber %>.config
  UBUNTU_VERSION=`lsb_release -r | cut -f 2`
  if [ "$UBUNTU_VERSION" == "18.04" ]; then
  echo "2"
  systemctl stop consul-feature_<%= featureNumber %> || true
  systemctl disable consul-feature_<%= featureNumber %> || true
  rm -f /etc/systemd/system/consul-feature_<%= featureNumber %>.service
  systemctl daemon-reload
  else
  stop consul-feature_<%= featureNumber %> || true
  rm -f /etc/init/consul-feature_<%= featureNumber %>.conf
  fi

  rm -rf /root/docker/feature/<%= featureNumber %>
  rm -rf /var/www/feature/<%= featureNumber %>

  docker rmi -f $(docker images | grep -v 'bitnami\|REPOSITORY' | awk '{ print $3 }' | uniq ) || true

  # We want to prune everything except network, so we don't use `docker system prune` because it can prune networks too.
  # All have `--force` flag so they will not prompt for confirmation
  # The `|| true` is used to make the pruning optional. Because Docker can only run one prune operation at a time, calling prune again will throw error. The `|| true` will prevent it from causing the error from halting the script.
  docker container prune --force || true
  docker image prune --force || true
  docker volume prune --force || true
  docker builder prune --force || true
fi
