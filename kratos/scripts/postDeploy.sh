# In here we do stuffs that is not related to either build or deployment
# i. e.: running `bundlesize`

echo "postDeploy.sh is currently inactive, bundlesize-no-exit might be not available for now"
exit 0

docker pull <%= registryHost %>/kratos-utils:latest

mkdir -p ~/docker/kratos-utils-temp_<%= git.commit %>_<%= fullServiceName %>/code

# create our docker-compose.yml
cat <<EOF > ~/docker/kratos-utils-temp_<%= git.commit %>_<%= fullServiceName %>/docker-compose.yml
<%= dockerComposeYml %>
EOF

cd ~/docker/kratos-utils-temp_<%= git.commit %>_<%= fullServiceName %>

cat <<EOF > ~/docker/kratos-utils-temp_<%= git.commit %>_<%= fullServiceName %>/command.sh
mkdir -p /kratos-utils-temp/code

if [ \( -d "/code/build/client" \) ]; then
  cp -r /code/build/client /kratos-utils-temp/code
else
  cp -r /code/client /kratos-utils-temp/code
fi

cp /code/package.json /kratos-utils-temp/code/package.json
EOF

docker pull gcr.io/<%= project %>/kratos-old/<%= fullServiceName %>:<%= git.commit %>

docker-compose run --rm <%= appName %> bash < ~/docker/kratos-utils-temp_<%= git.commit %>_<%= fullServiceName %>/command.sh
# docker-compose run --rm <%= appName %> test -f /code/bundlesize.config.json && cp /code/bundlesize.config.json /kratos-utils-temp/code/bundlesize.config.json
docker-compose run --rm kratos-utils npx bundlesize-no-exit > ~/docker/kratos-utils-temp_<%= git.commit %>_<%= fullServiceName %>/bundlesize-report.txt

# output to STDOUT
# used in ./kratos/server/util/runShellScript/runPostDeploy.js
echo "<<< START OF BUNDLESIZE OUTPUT >>>"
cat ~/docker/kratos-utils-temp_<%= git.commit %>_<%= fullServiceName %>/bundlesize-report.txt
echo "<<< END OF BUNDLESIZE OUTPUT >>>"

# cleanup
cd ~/docker
docker image rm gcr.io/<%= project %>/kratos-old/<%= fullServiceName %>:<%= git.commit %>
rm -rf ~/docker/kratos-utils-temp_<%= git.commit %>_<%= fullServiceName %>
