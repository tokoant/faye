set -ex
SERVICE=feature-<%= featureNumber %>-<%= env %>

IMAGE_TAG=<%= project %>/kratos-old/<%= fullServiceName %>:<%= git.commit %>

#gcr.io/tkpd-stag-kratos-003f/kratos-old/thor@sha256:c1ab6ce2d75eb7b0157d4f30fefa793d3ecb93a1597e6e590bf19bb7dd46ccb2
# run 
# sample image:
# -- gcr.io/tkpd-stag-kratos-003f/atreus-test@sha256:a9a4a5bcb3e2bc4e68f575761aac0b476fc2344016db7340b43061f24bcb8b17
# gcr.io/tkpd-stag-kratos-003f/kratos-old/<%= fullServiceName %>:<%= git.commit %>
# gcr.io/tkpd-stag-kratos-003f/atreus-test-curl
#gcr.io/tkpd-stag-kratos-003f/kratos-old/thor

gcloud run deploy $SERVICE --project <%= project %> \
  --image gcr.io/$IMAGE_TAG \
  --platform managed \
  --region asia-southeast1 \
  --memory 8Gi \
  --cpu 4 \
  --port 3000 \
  --allow-unauthenticated \
  --vpc-connector <%= vpcConnector %> \
  --ingress internal

# delete
# gcloud run services delete feature-15 --project tkpd-stag-kratos-003f --platform managed --region asia-southeast1

# docker tag 3a256ed6b8aa gcr.io/tkpd-stag-kratos-003f/bitnami/node

# docker push gcr.io/tkpd-stag-kratos-003f/bitnami/node
