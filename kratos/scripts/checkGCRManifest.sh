#!/bin/bash
set -ex

COMMIT_ID=<%= gitCommit %>
APP_NAME=<%= appName %>
PROJECT=<%= project %>

gcloud container images list-tags gcr.io/$PROJECT/kratos-old/$APP_NAME --filter="tags:$COMMIT_ID" --limit=1 | grep $COMMIT_ID || true
