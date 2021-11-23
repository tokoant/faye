# Clear Jest temporary files
# Note: It seems "clearCache" clears whole Jest's temporary folder which not only contain Jest build cache, but also all temporary files used by Jest.
cd /root/docker/git
./node_modules/.bin/jest --clearCache
