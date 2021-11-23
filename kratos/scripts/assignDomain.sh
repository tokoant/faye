#!/bin/bash
set -ex
REGION=asia-southeast1
PROJECT=tkpd-stag-kratos-003f
LB_NAME=cloud-run-test-tokopedia-net

SERVICE=feature-<%= featureNumber %>-<%= env %>
SERVICE_HOST=<%= featureNumber %>-<%= env %>-feature.tokopedia.com
SERVICE_BACKEND=$SERVICE-backend
SERVICE_NEG=$SERVICE-neg
SERVICE_MATCHER=$SERVICE-path-matcher

gcloud compute backend-services create $SERVICE_BACKEND --protocol=HTTP --port-name=http --project $PROJECT --global || true

gcloud compute network-endpoint-groups create $SERVICE_NEG \
    --region=$REGION \
    --network-endpoint-type=serverless  \
    --cloud-run-service=$SERVICE --project $PROJECT \
    || true

gcloud compute backend-services add-backend $SERVICE_BACKEND \
    --project $PROJECT \
    --global \
    --network-endpoint-group=$SERVICE_NEG \
    --network-endpoint-group-region=$REGION \
    || true

gcloud compute url-maps add-path-matcher $LB_NAME \
   --default-service $SERVICE_BACKEND \
   --path-matcher-name $SERVICE_MATCHER --backend-service-path-rules="/=$SERVICE_BACKEND" --new-hosts=$SERVICE_HOST --global --project $PROJECT \
   || true