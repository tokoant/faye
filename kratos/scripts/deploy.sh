set -ex

mkdir -p /root/docker/feature/<%= featureNumber %>
mkdir -p /var/consul/template
touch /root/docker/feature/<%= featureNumber %>/.env

#Update consul config
# we use "EOF" here (with quotes) so `cat` doesn't not interpret `\` in configTemplate as escape chars
cat <<"EOF" > /var/consul/template/feature_<%= featureNumber %>.template
<%= configTemplate %>
EOF

cat <<EOF > /var/consul/config/feature_<%= featureNumber %>.config
consul = "consul.tokopedia.local:8500"
log_level = "warn"
// source - consul tempalte to run.
// destination - consul output file to be updated with template run output.
// command - commands to be executed after the destination file is updated. Please look at it carefully.
// command_timeout - this is by default 30s.
template {
  source          = "/var/consul/template/feature_<%= featureNumber %>.template"
  destination     = "/root/docker/feature/<%= featureNumber %>/.env"
  command         = "cd /root/docker/feature/<%= featureNumber %> && docker-compose restart"
  command_timeout = "90s"
}
EOF

UBUNTU_VERSION=`lsb_release -r | cut -f 2`
if [ "$UBUNTU_VERSION" == "18.04" ]; then
#USING SYSTEMD FOR 18.04 version of Ubuntu
cat <<EOF > /etc/systemd/system/consul-feature_<%= featureNumber %>.service
[Unit]
Description=Consul template for feature_<%= featureNumber %> kratos server tokopedia-lite-v2
Documentation=https://www.consul.io/
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
Group=root
ExecStart=/usr/local/bin/consul-template -config /var/consul/config/feature_<%= featureNumber %>.config

ExecReload=/bin/kill -HUP $MAINPID
KillSignal=SIGINT
TimeoutStopSec=5
Restart=on-failure
SyslogIdentifier=consul-template-feature-11

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable consul-feature_<%= featureNumber %>
systemctl start consul-feature_<%= featureNumber %>
systemctl restart consul

else
#USING UPSTART FOR 14.04 version of Ubuntu

cat <<EOF > /etc/init/consul-feature_<%= featureNumber %>.conf
description "Consul template for feature_<%= featureNumber %> kratos server tokopedia-lite-v2"
start on (local-filesystems and net-device-up IFACE!=lo)
stop on runlevel [06]
exec /usr/local/bin/consul-template -config /var/consul/config/feature_<%= featureNumber %>.config >> /var/log/consul-feature_<%= featureNumber %>.log 2>&1
respawn
respawn limit 10 10
kill timeout 10
EOF

stop consul-feature_<%= featureNumber %> || true
start consul-feature_<%= featureNumber %>
fi

cd /root/docker/feature/<%= featureNumber %>
cat <<EOF > /root/docker/feature/<%= featureNumber %>/docker-compose.yml
<%= dockerComposeYml %>
EOF

#Start feature
set +x
printf "\n<GroupedLog>\n"
printf "Docker Pull Logs\n"
set -x
docker pull <%= registryHost %>/<%= fullServiceName %>:<%= git.commit %>
set +x
printf "\n</GroupedLog>\n"
set -x
cd /root/docker/feature/<%= featureNumber %>
mkdir -p /var/www/feature/<%= featureNumber %>
docker-compose up -d
