#!/bin/bash
REGION=asia-southeast1
PROJECT=tkpd-stag-kratos-003f
LB_NAME=cloud-run-test-tokopedia-net
ENVIRONMENT=staging


# include service name?
# params:
# <%= featureNumber %>
# <%= appName %>

SERVICE=1000-staging
SERVICE_HOST=$SERVICE-$ENVIRONMENT-feature.tokopedia.com
SERVICE_BACKEND=$SERVICE-backend
SERVICE_NEG=$SERVICE-neg
SERVICE_MATCHER=$SERVICE-path-matcher

# SERVICE2=test-app2
# SERVICE_HOST2=$SERVICE2-$ENVIRONMENT-feature.tokopedia.com
# SERVICE_BACKEND2=$SERVICE2-backend
# SERVICE_NEG2=$SERVICE2-neg
# SERVICE_MATCHER2=$SERVICE2-path-matcher



# set REGION asia-southeast1
# set PROJECT tkpd-stag-kratos-003f
# set LB_NAME cloud-run-test-tokopedia-net
# set ENVIRONMENT staging
# set SERVICE test-app
# set SERVICE_HOST $SERVICE-$ENVIRONMENT-feature.tokopedia.com
# set SERVICE_BACKEND $SERVICE-backend
# set SERVICE_NEG $SERVICE-neg
# set SERVICE_MATCHER $SERVICE-path-matcher
# set SERVICE2 test-app2
# set SERVICE_HOST2 $SERVICE2-$ENVIRONMENT-feature.tokopedia.com
# set SERVICE_BACKEND2 $SERVICE2-backend
# set SERVICE_NEG2 $SERVICE2-neg
# set SERVICE_MATCHER2 $SERVICE2-path-matcher