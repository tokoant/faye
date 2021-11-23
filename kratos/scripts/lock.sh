GIT_LOCK_FILE=<%= lockFile %>

if [ -f $GIT_LOCK_FILE ]; then
    echo "$GIT_LOCK_FILE exist"
    exit 1
fi
touch $GIT_LOCK_FILE