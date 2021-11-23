set -ex

cat <<EOF > /etc/nginx/conf.d/<%= featureNumber %>-<%= env %>-feature.tokopedia.com.conf
server {
    listen      80;
    server_name <%= featureNumber %>-<%= env %>-feature.tokopedia.com;

    ssi off;

    location / {
        root /var/www/feature/<%= featureNumber %>/static;
        try_files \$uri @feature;
    }

    location ~ /helios-client/client-log {
        try_files \$uri @feature;
    }

    location @feature {
        proxy_pass http://<%= deployToServer %>:<%= featurePort %>;

        proxy_set_header    X-Forwarded-For     \$remote_addr;
        proxy_set_header    X-Forwarded-Proto   https;
        proxy_set_header    X-Forwarded-Port    443;
        proxy_http_version  1.1;
        proxy_set_header    Upgrade \$http_upgrade;
        proxy_set_header    Connection "upgrade";
        proxy_set_header    Host \$host;
        proxy_cache_bypass  \$http_upgrade;
        
        proxy_intercept_errors on;
        error_page 500 502 503 504 =200 @fallback;
    }

    location @fallback {
        return 302 https://<%= kratosUrl %>/feature/<%= featureNumber %>/down/;
    }
}
EOF

# create "static" folder
docker pull <%= registryHost %>/<%= fullServiceName %>:<%= git.commit %>
rm -rf /var/www/feature/<%= featureNumber %>/static
mkdir -p /var/www/feature/<%= featureNumber %>/static
docker run --rm -v /var/www/feature/<%= featureNumber %>/static:/code/staticCopy <%= registryHost %>/<%= fullServiceName %>:<%= git.commit %> cp -R static/. staticCopy/
nginx -t && nginx -s reload
docker image rm <%= registryHost %>/<%= fullServiceName %>:<%= git.commit %>
