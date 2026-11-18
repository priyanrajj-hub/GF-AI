#!/usr/bin/env bash
set -euo pipefail

# ====================================================================
# GF-AI / Ada Cloud-Native Local Cluster Bootstrapper (kind / k3d)
# ====================================================================

CLUSTER_NAME="ada-dev"

echo "🚀 Checking local Kubernetes environment..."
if command -v kind &>/dev/null; then
  echo "📦 Found 'kind'. Creating local cluster '${CLUSTER_NAME}'..."
  if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    kind create cluster --name "${CLUSTER_NAME}"
  else
    echo "✓ Cluster '${CLUSTER_NAME}' already running."
  fi
elif command -v k3d &>/dev/null; then
  echo "📦 Found 'k3d'. Creating local cluster '${CLUSTER_NAME}'..."
  if ! k3d cluster list | grep -q "^${CLUSTER_NAME} "; then
    k3d cluster create "${CLUSTER_NAME}" --servers 1 --agents 2 -p "80:80@loadbalancer" -p "443:443@loadbalancer"
  else
    echo "✓ Cluster '${CLUSTER_NAME}' already running."
  fi
else
  echo "⚠️ Neither 'kind' nor 'k3d' found. Please install kind (https://kind.sigs.k8s.io) or k3d (https://k3d.io)."
  exit 1
fi

echo "📦 Installing cert-manager for TLS Ingress..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.2/cert-manager.yaml

echo "📦 Installing KEDA for event-driven autoscaling..."
kubectl apply --server-side -f https://github.com/kedacore/keda/releases/download/v2.16.0/keda-2.16.0.yaml

echo "📦 Deploying Ada Helm chart (charts/ada)..."
helm upgrade --install ada ./charts/ada \
  --namespace ada \
  --create-namespace \
  -f ./charts/ada/values.yaml \
  -f ./charts/ada/values.development.yaml

echo "✅ Ada local Kubernetes cluster is ready!"
kubectl get pods -n ada
