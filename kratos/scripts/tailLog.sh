set -ex

if [ \( -d "/root/docker/feature/<%= featureNumber %>" \) ]; then
  cd /root/docker/feature/<%= featureNumber %>
  docker-compose logs <%= tailFlag %> <%= dockerApp %>
else 
  echo "feature <%= featureNumber %> has not been deployed yet!"
fi