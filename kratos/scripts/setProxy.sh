test -d <%= configDir %> || mkdir -p <%= configDir %>

if test -f <%= configFile %>; then
  mv <%= configFile %> /root/<%= configFilename %>.backup
fi

cat <<EOT > <%= configFile %>
  <%= proxyValue %>
EOT

if nginx -t; then
  echo "nginx mantul"
  rm /root/<%= configFilename %>.backup
else
  mv /root/<%= configFilename %>.backup <%= configFile %>
fi

nginx -s reload

