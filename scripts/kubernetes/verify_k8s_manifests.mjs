import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../')

console.log('🔍 Executing Kubernetes & Helm Structural Verification...')

const k8sDir = path.join(rootDir, 'infra/kubernetes')
if (!fs.existsSync(k8sDir)) {
  console.error('❌ Missing infra/kubernetes directory')
  process.exit(1)
}

const requiredK8sFiles = [
  'namespace.yaml',
  'configmap.yaml',
  'secrets-template.yaml',
  'api-deployment.yaml',
  'api-service.yaml',
  'api-hpa.yaml',
  'api-pdb.yaml',
  'worker-deployment.yaml',
  'web-deployment.yaml',
  'web-service.yaml',
  'web-hpa.yaml',
  'ingress.yaml',
  'network-policy.yaml',
  'service-account.yaml',
  'rbac.yaml',
]

for (const file of requiredK8sFiles) {
  const filePath = path.join(k8sDir, file)
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing Kubernetes manifest: ${file}`)
    process.exit(1)
  }
  const content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes('apiVersion:') || !content.includes('kind:')) {
    console.error(`❌ Invalid Kubernetes manifest structure in ${file}`)
    process.exit(1)
  }
}
console.log(`  ✅ All ${requiredK8sFiles.length} Kubernetes YAML manifests validated`)

const helmDir = path.join(rootDir, 'infra/helm/gf-ai')
const requiredHelmFiles = [
  'Chart.yaml',
  'values.yaml',
  'values.development.yaml',
  'values.staging.yaml',
  'values.production.yaml',
  'templates/_helpers.tpl',
  'templates/configmap.yaml',
  'templates/secrets.yaml',
  'templates/deployment-api.yaml',
  'templates/service-api.yaml',
  'templates/hpa-api.yaml',
  'templates/pdb-api.yaml',
  'templates/deployment-worker.yaml',
  'templates/deployment-web.yaml',
  'templates/service-web.yaml',
  'templates/hpa-web.yaml',
  'templates/ingress.yaml',
  'templates/networkpolicy.yaml',
  'templates/serviceaccount.yaml',
]

for (const file of requiredHelmFiles) {
  const filePath = path.join(helmDir, file)
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing Helm chart file: ${file}`)
    process.exit(1)
  }
}
console.log(`  ✅ All ${requiredHelmFiles.length} Helm chart templates and environment value files validated`)

// Validate API Deployment Probes
const apiDeploy = fs.readFileSync(path.join(k8sDir, 'api-deployment.yaml'), 'utf8')
if (!apiDeploy.includes('/health/live') || !apiDeploy.includes('/health/ready')) {
  console.error('❌ api-deployment.yaml does not target /health/live and /health/ready probes')
  process.exit(1)
}

if (!apiDeploy.includes('runAsNonRoot: true')) {
  console.error('❌ api-deployment.yaml missing runAsNonRoot securityContext')
  process.exit(1)
}
console.log('  ✅ Kubernetes securityContext non-root and health probes verified')

console.log('🎉 Kubernetes Platform & Helm Chart Verification Passed 100%!')
